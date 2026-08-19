# India Inspiration Studio — Independent Production QA Audit

**Application:** `App/index.html` (title bar reports "Daily Inspiration v2.1")
**Auditor role:** Independent Senior QA Engineer — find defects, do not fix
**Audit date:** 4 August 2026
**Method:** Full source read (base64 assets stripped for logic review), real JSON parse and rule-testing of the embedded 365-record dataset, Node syntax parse, lexical-scope analysis, service-worker file-existence check, dead-code trace.
**Environment limit:** A live headless browser was not available in the audit sandbox, so canvas pixel-level contrast on the 9 template images and on-device touch gestures were assessed by code analysis and need a final manual smoke test on an Android device. Every other finding below is verified against the actual code/data, not assumed.

---

## Executive Summary

| Result | Count |
|--------|-------|
| **FAIL** (blocking or broken feature) | 4 |
| **WARNING** (fix before or shortly after release) | 9 |
| **PASS** (verified working) | 8 areas |

**Production readiness score: 62 / 100**

**Release decision: DO NOT APPROVE.**

The core daily-poster flow and the 365-day dataset are solid — that is the primary daily-use path and it holds up. But offline/PWA is completely broken, a common Personal-Greeting interaction throws a runtime error, and a whole layer of advertised personalisation (event illustrations, tone, audience, age, years) is wired to nothing. These must be resolved (or the dead controls removed) before this is used daily in production.

### Critical blockers
- **F1** — Service worker never installs → no offline mode / PWA caching.
- **F2** — Changing the greeting "Photo style" throws a ReferenceError; the preview stops updating.

### Minor issues
Weekday text leaking into Calendar/Favorites cards, self-XSS via unsanitised contact HTML, unassociated form labels, empty PWA icon set, photo-editor border artifact, and `roundRect` compatibility on older Android. Detail below.

---

## FAIL

### F1 — Service worker install fails; offline / PWA caching broken
- **Severity:** Critical
- **Location:** `App/sw.js` line 2 (`FILES` array)
- **Root cause:** The precache list includes `./Personal_Greeting_Event_Design_Verification.html`, which does not exist inside `App/` — the actual file lives in `Docs/`. `caches.addAll()` is atomic: one 404 rejects the whole install, so the service worker never reaches "activated" and nothing is cached.
- **Reproduction:** Serve `App/` over http(s). Open DevTools → Application → Service Workers. Observe the install error ("Failed to execute 'addAll' … request failed"). Toggle Offline and reload → the app fails to load.
- **Recommended fix:** Remove the `Personal_Greeting_Event_Design_Verification.html` entry (or move that file into `App/`). Keep the precache list limited to files that actually ship inside `App/`. Bump the cache name after the change.

### F2 — "Photo style" change handler throws ReferenceError; preview does not update
- **Severity:** Critical (common interaction)
- **Location:** `index.html`, `initGreeting()` change handler for `#gPhotoStyle` (calls `updatePhotoControls()`); the function is defined **only** as a `const` inside `gReset()`.
- **Root cause:** `updatePhotoControls` is function-scoped to `gReset()`. The `#gPhotoStyle` `change` listener registered in `initGreeting()` cannot see it. The call throws before `gRender()` runs, so the poster never re-renders and the photo controls are neither dimmed nor disabled.
- **Reproduction:** Personal Greeting → choose a photo → change "Photo style" to No Photo / Small Corner / Circular Portrait. Console: `Uncaught ReferenceError: updatePhotoControls is not defined`. The preview keeps the old photo layout until the next full "Generate poster".
- **Recommended fix:** Define `updatePhotoControls` once at a shared scope (top of `initGreeting` or module level) and call it from both `gReset()` and the change handler.

### F3 — Entire event-illustration engine is dead code
- **Severity:** High (advertised feature absent)
- **Location:** `gDrawEventDecoration()` and ~30 `gDraw*` helpers (`gDrawBalloons`, `gDrawCake`, `gDrawRings`, `gDrawTrophy`, `gDrawCap`, `gDrawLaurel`, `gDrawHouse`, `gDrawBaby`, etc.).
- **Root cause:** `gRender()` never calls `gDrawEventDecoration()`. Greeting posters are drawn entirely from the 9 Canva template PNGs plus a text panel. All occasion-specific vector artwork (~250+ lines) is unreachable. If a template image fails to decode, the fallback is a plain gradient with **no** decoration at all.
- **Reproduction:** Generate greetings for Birthday, Retirement, Graduation, etc. → none of the coded balloons/cake/laurel/trophy artwork appears; only the template background and text.
- **Recommended fix:** Decide product intent — either invoke `gDrawEventDecoration()` in `gRender()` (e.g. as a fallback when a template isn't ready, or layered on top) or delete the dead engine to cut ~2 MB-adjacent maintenance load and confusion.

### F5 — Non-functional greeting inputs: Tone, Audience, Age, Years/Milestone
- **Severity:** High (misleading broken controls)
- **Location:** `generateSmartMessage()` (the generator actually wired to "Generate message" and "Generate poster"); `gDefaults()` is defined but never called.
- **Root cause:** `generateSmartMessage()` uses only occasion, message style, name, second name (anniversary) and "detail". It ignores `#gTone`, `#gAudience` ("Medical Batch"), `#gAge`, and `#gYears`. The function that *would* consume age/years (`gDefaults`) is dead.
- **Reproduction:** Birthday, Age 60, Tone "Religious", Audience "Medical Batch" → generated title/message are identical to defaults; age, tone and audience never appear.
- **Recommended fix:** Either wire these fields into message generation (age/years into the sentence, tone into phrasing, audience into a medical variant) or remove the controls so users aren't misled into thinking they do something.

---

## WARNING

### W1 — Calendar & Favorites cards display raw weekday text
- **Severity:** Medium
- **Location:** `card()` — renders `r.Message_English` / `r.Message_Gujarati` unmodified.
- **Root cause:** 138 English and 137 Gujarati source records open with "On this <Weekday>, …" / "આ <વાર>ના દિવસે, …". The poster strips these via `removeWeekdayReference()`, but the browse cards do not, contradicting the "weekday-free" product goal.
- **Reproduction:** Calendar tab → many cards read "On this Thursday, …".
- **Recommended fix:** Pass card text through `removeWeekdayReference()` before rendering.

### W2 — Daily poster header prints the weekday name
- **Severity:** Low–Medium
- **Location:** `render()` — `toLocaleDateString("en-IN",{weekday:"long",…})`.
- **Root cause:** The date line renders e.g. "Thursday, 1 January 2026". This is the date, not the message, but it contradicts the "v2.1 weekday-free" framing.
- **Recommended fix:** If "weekday-free" is strict, drop `weekday` from the format; otherwise confirm it is intended for the date line only.

### W3 — Self-XSS via unsanitised innerHTML (contacts, history)
- **Severity:** Medium
- **Location:** `renderContacts()` and `renderHistory()` — user strings injected via template-literal `innerHTML`.
- **Root cause:** Contact name/notes and history occasion are inserted without escaping. A contact named `<img src=x onerror=…>` executes when the list renders. It is single-user localStorage data (self-XSS, low exploitability) but still unsafe HTML handling.
- **Reproduction:** Contacts → save name `<img src=x onerror=alert(1)>` → alert fires on list render.
- **Recommended fix:** Use `textContent`, or escape values before building `innerHTML`.

### W4 — Form labels not programmatically associated
- **Severity:** Medium (accessibility)
- **Location:** Most `<label>` elements across all panels (only the file-upload labels wrap their input).
- **Root cause:** Labels are siblings of inputs with no `for`/`id` pairing, so assistive tech does not announce field names.
- **Recommended fix:** Add `for`/`id` on each label/input pair, or wrap inputs inside their labels.

### W5 — PWA manifest has no icons; version/theme drift
- **Severity:** Medium
- **Location:** `App/manifest.webmanifest` (`"icons": []`); `sw.js` cache `daily-inspiration-v1-2-event-designs`; `index.html` `theme-color #171b48` vs manifest `#161B44`.
- **Root cause:** No installable icon; cache name still reflects v1.2 while the app is v2.1; theme colour mismatch.
- **Recommended fix:** Add 192px and 512px maskable icons, align the cache name to the current version, and reconcile theme colours.

### W6 — Photo editor bakes a crop-border artifact and re-samples from the preview
- **Severity:** Medium
- **Location:** `applyPhotoEditor()`.
- **Root cause:** The applied crop is copied from the on-screen editor canvas, which includes ~3px of the gold selection ring along the crop edge, and it upsamples (e.g. 576→800px for a circle). Additionally, an already-cropped photo is transformed again by `#gPhotoZoom`/`FocusX`/`Focus` in `gRender()` (double transform).
- **Reproduction:** Adjust/Crop a photo → Apply → the applied image shows a faint gold edge ring and slight softening; further zoom/focus re-warps it.
- **Recommended fix:** Render the crop from the source image at output resolution without the overlay drawn; reset zoom/focus after Apply, or bypass `gCoverDraw` for an edited photo.

### W7 — Greeting engine is missing the "Festival Greeting" occasion
- **Severity:** Low–Medium (spec gap)
- **Location:** `GREETING_OCCASIONS`.
- **Root cause:** The audit spec lists "Festival Greeting" as a greeting occasion; the engine offers 13 occasions but not that one (festival content exists only in the daily-poster dataset).
- **Recommended fix:** Add the occasion with matching library entries if the spec requires it.

### W8 — PNG has no print DPI metadata
- **Severity:** Low
- **Location:** `toDataURL`/`toBlob` on a 1080×1350 canvas.
- **Root cause:** Canvas PNG export carries no DPI/pHYs chunk; it is effectively 96 dpi (≈9″×11.25″) or 300 dpi (3.6″×4.5″) depending on interpretation. Pixel dimensions are correct for WhatsApp/social, but print sizing is undefined.
- **Recommended fix:** Acceptable for screen/social. If print output is expected, post-process to inject a pHYs chunk (e.g. 300 dpi).

### Additional lower-severity warnings
- **L1 `roundRect` compatibility:** Heavy reliance on `CanvasRenderingContext2D.roundRect` (Chrome 99+/Safari 16+). On older Android WebView/Chrome it is undefined and `render()`/`gRender()` throw, leaving a blank canvas. Add a polyfill or feature check for older devices.
- **L2 Unwrapped canvas text:** The daily-poster Gujarati occasion (y≈238) and the hero context pill use `fillText` with no wrap/fit; unusually long values overflow horizontally. Low risk — dataset values are short.
- **L3 Long custom greeting can overlap signature/panel:** `gRender()` allows a 3-line title and 7-line message with no combined vertical-space budget; long manual input pushes the message onto "Warm regards,"/signature (y≈850/900) and past the panel bottom (y≈950). Default/dataset content is short, so this only bites with heavy manual edits. Add an auto-shrink/vertical budget.
- **L4 Greetings are English-only:** The daily poster is bilingual; personal greetings have no Gujarati field. Note if bilingual greetings are expected.
- **L5 Loose import validation:** `importUserEdits()` checks only that `customMessages` is an object; favorites/signature are applied without deeper validation. Low risk.

---

## PASS (independently verified)

1. **Dataset integrity (365 records):** Exactly 365 rows, unique dates spanning 2026-01-01 → 2026-12-31, **no duplicate dates**, **no duplicate English or Gujarati messages**, **no empty required fields**, every Gujarati message contains Gujarati Unicode, all `Palette` and `Style` values valid, 1-Jan `Cultural_Context` = "Western" (built-in QA rule passes). Verified by parsing the embedded `DATASET` and running the rules directly.
2. **Weekday stripping on the poster works:** After applying the real `removeWeekdayReference()` to all 365 records, the only "weekday" survivors are holiday *names* — "Good Friday", "Easter Sunday" / "ઈસ્ટર રવિવાર" — which are correct and should not be stripped.
3. **HTML structure:** No duplicate element IDs. No broken external references (only `manifest.webmanifest`; all fonts/images/data are embedded or system).
4. **JavaScript:** Parses clean under `node --check`. No duplicate top-level function declarations.
5. **PNG geometry:** Both canvases are 1080×1350. Daily and greeting exports use PNG via `toDataURL`/`toBlob`; filenames are sanitised (`[^a-z0-9]+` → `-`).
6. **Share/Download:** Web Share API with `canShare({files})` guard and a correct fallback (download PNG + copy caption) when sharing is unavailable. Bilingual caption assembled correctly for the daily poster.
7. **Generated-image storage:** IndexedDB store with a `createdAt` index, 7-day scheduled cleanup, "delete older than 7 days", "delete all", and live storage stats. Save/generate paths persist blobs; object URLs are revoked on replacement.
8. **Greeting repeat protection:** Smart-theme selection avoids recently used themes per contact and falls back gracefully when the pool is exhausted.

---

## Verification notes
- Dataset checks executed against the live embedded `DATASET` (JSON-parsed), not the CSV, so the report reflects what actually ships in the app. The `App/data/…v0_6.csv` (366 lines incl. header) is the source of record and matches the 365-record count.
- The following require a final manual smoke test on a real Android device because a browser could not be launched in the audit environment: exact text-contrast of each of the 9 template PNGs against the overlaid panel/ink colours, drag/pinch/zoom feel in the photo editor, native share-sheet behaviour, and print-DPI expectations.

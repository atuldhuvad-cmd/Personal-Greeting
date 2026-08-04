# Daily Inspiration — v2.3 FINAL RELEASE

**Release version:** Daily Inspiration v2.3 FINAL RELEASE
**Date:** 4 August 2026
**Application:** `App/index.html` (single-file PWA)
**Service worker cache:** `daily-inspiration-v2-3-final`
**Gate:** Source-level QA approved; manual mobile visual + PNG tests confirmed passed by the user before finalization.

## What's in this release

**Three genuine daily-poster compositions.** The daily poster now renders through three distinct layout engines — Classic Inspiration (centered, mid-canvas hero), Hero Focus (dominant top hero with an overlaid text card), and Editorial Premium (left-column hero, left-aligned magazine layout). They differ in hero size, hero placement, text alignment, and reading flow — not labels. Legacy composition values from earlier versions migrate automatically to Classic Inspiration.

**Nine approved personal-greeting templates.** The Personal Greeting studio ships the nine approved Canva templates (Executive Blue, Nature Green, Classic Gold, Premium Gift, Black & Gold Luxury, Navy Ribbon Premium, White Marble, Marble with Cake, Burgundy Luxury) with per-contact repeat protection so a person isn't sent the same design twice in a row.

**Interactive photo editor.** Recipient/family photos can be positioned, zoomed (slider, mouse wheel, or two-finger pinch), and cropped to portrait, square, or circle. Crops are taken from the source image at output resolution, and photo transform sliders reset on apply so an edited photo isn't re-warped.

**Weekday-free daily messages.** Weekday openers are stripped from both the generated poster and the Calendar/Favorites browse cards; genuine holiday names that contain a weekday word (e.g. Good Friday, Easter Sunday) are correctly preserved. The poster date line shows day, month, and year without a weekday.

**Gujarati overlap protection.** All text blocks are sized through a height-budgeted fitter, so Gujarati titles and messages stay within their allocated regions and do not collide with the hero, English text, or footer in the fixed-box compositions. Canvas remains 1080×1350.

**PWA / offline fixes.** The service worker precaches only files that ship in `App/` (`./`, `index.html`, `manifest.webmanifest`, `assets/icon-192.svg`, `assets/icon-512.svg`) so installation succeeds and offline mode works. The manifest is valid with scope, aligned theme/background colours, and 192px + 512px icons (512 maskable). Cache renamed to `daily-inspiration-v2-3-final`, which purges older caches on activate.

**Greeting message and modifier fixes.** The greeting generator applies Tone, Audience (including a Medical Batch variant), Age, and Years/Milestone to the produced message; a Festival Greeting occasion is available. The photo-style control updates the preview without error. All dynamic lists (contacts, history, QA) render via text nodes, closing the earlier self-XSS vector, and form labels are programmatically associated for accessibility.

## Fixed since the v2.3 candidate

- Corrected an invalid UTF-8 byte (a raw `0xD7`) and wrong separators in the on-screen success-status string; it now reads `• 1080 × 1350 •` and the file is fully valid UTF-8.
- Removed five leftover PNG-QA validation exports from the deployable `App/` folder.

## Validation (this finalization)

- `node --check` on extracted application JavaScript — pass.
- `node --check` on `App/sw.js` — pass.
- `index.html` — valid UTF-8, no duplicate IDs or function declarations.
- Dataset — 365 records, 365 unique dates, 0 duplicates, 0 blank required fields, Gujarati Unicode present in all rows, palettes valid, legacy styles migrate to Classic Inspiration.
- Precache paths — all five service-worker files present on disk.

## Known / deferred (non-blocking)

- Classic Inspiration uses flow layout; on the single longest dataset messages the Gujarati block sits close to the footer. Confirmed acceptable in the manual mobile test. Hero Focus and Editorial Premium are overlap-safe by construction.
- PNG export carries no print-DPI metadata; 1080×1350 pixel dimensions are correct for WhatsApp and social use.

## Files in this release

- `App/index.html` — application (version-stamped "Daily Inspiration v2.3 FINAL RELEASE").
- `App/sw.js` — service worker (cache `daily-inspiration-v2-3-final`).
- `App/manifest.webmanifest` — PWA manifest.
- `App/assets/icon-192.svg`, `App/assets/icon-512.svg` — PWA icons.
- `App/data/India_Inspiration_Studio_2026_365_Day_Content_v0_6.csv` — source dataset of record.

No Git commit or tag was created as part of this release.

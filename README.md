# WishCraft — Greeting Card Studio

WishCraft is a browser-based studio for creating personal greeting cards and festival posters. It works entirely offline as an installable Progressive Web App (PWA).

## Features

- Birthday and festival card templates (Diwali, Holi, Christmas, Eid, Navratri, and more)
- Customizable messages and names with responsive auto-fit typography
- Installable as a standalone app via the Web App Manifest
- Offline support through a service worker

## Getting started

This is a static site with no build step. Serve the folder with any static file server, for example:

```bash
npx serve .
```

Then open the printed local URL in your browser.

## Project structure

- `index.html` — app shell and markup
- `css/` — styles (`styles.css`, `fixes.css`)
- `js/` — app logic, templates, and message content (`app.js`, `templates.js`, `messages.js`)
- `assets/` — birthday and festival images/icons
- `manifest.json` — PWA manifest
- `sw.js` — service worker for offline caching

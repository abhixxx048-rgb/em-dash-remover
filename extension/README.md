# Em Dash Remover - Browser Extension (MV3)

Clean AI text in any field on any site. Right-click a selection and choose
**Clean selection**, or turn on **clean-on-paste** per site, and the em dashes,
curly quotes, ellipses and invisible/zero-width watermark characters are
replaced with the same grammar-aware engine as the
[Em Dash Remover](https://emdashremover.com) website. 100% local - nothing leaves
the browser.

This folder is a **scaffold**, kept at the repo root (outside the Astro site's
`src/`) so it never affects the website build. It is shared across the suite's
in-browser tools.

## MVP (implemented)

- **Right-click "Clean selection"** - `contextMenus` entry in `background.js`
  messages the content script to clean the active selection. Works in plain
  `<input>`/`<textarea>` (undo-safe `setRangeText`) and in contenteditable /
  framework editors (ProseMirror / Lexical / Slate) via an `insertText` path.
- **Clean-on-paste** - opt-in per site (toggled from the popup). Intercepts the
  `paste` event, cleans the plain-text payload, and only replaces it if something
  changed, so it never fights the native paste.
- **Keyboard command** - `Alt+Shift+C` to clean the current selection.

## Files

- `manifest.json` - MV3 manifest (service worker, content scripts, action popup,
  context menus, optional host permissions for the major AI chat sites).
- `background.js` - service worker: registers the context menu and relays the
  clean command to the active tab.
- `content-script.js` - the only part that touches page DOM: selection cleaning,
  clean-on-paste, undo-safe insertion, and the result toast.
- `cleaner.js` - the shared, DOM-free cleaning engine (port of the website's
  `src/lib/cleaner.ts`), exposed as `self.EmDashCleaner`.
- `popup.html` - per-rule toggles and the per-site clean-on-paste switch.

## Install (unpacked, for development)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `extension/` folder.
4. Add `icons/icon16.png`, `icon48.png`, `icon128.png` (referenced by the
   manifest) before publishing.

## TODO (post-MVP)

- Rich-paste (`text/html`) handling reusing the Word/Docs cleanup.
- Live-clean mode for AI chat output (debounced `MutationObserver`, loop-guarded).
- Per-message "Clean this reply" button injection.
- Dark-mode-aware toast, `prefers-reduced-motion`, and an inline Undo link.
- Replace the vendored `cleaner.js` with a shared workspace package so the site
  and extension can never drift.

## Privacy

Reads only the text you select or paste, cleans it locally, and makes zero
network calls - the same provable-privacy promise as the web tool.

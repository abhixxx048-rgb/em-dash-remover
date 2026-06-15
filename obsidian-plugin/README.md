# Em Dash Remover for Obsidian

Clean AI paste inside Obsidian. Paste a draft from ChatGPT, Claude or Gemini and
the em dashes, curly quotes, ellipses and invisible/zero-width watermark
characters are gone before a single character lands in your note - using the same
grammar-aware cleaning engine as the [Em Dash Remover](https://emdashremover.com)
website. 100% local: no network calls, no telemetry.

This folder is a **scaffold**, intentionally kept outside the Astro site's `src/`
so it never affects the website build.

## MVP (implemented in this scaffold)

- **Clean-on-paste interception** - hooks Obsidian's `editor-paste` event, reads
  the clipboard (HTML → Markdown via Obsidian's `htmlToMarkdown`, else plain
  text), cleans it, and only replaces the paste if something actually changed
  (so it never fights the native paste).
- **"Clean selection" command** - fix text that's already in a note. Surfaces in
  the Command Palette and is hotkey-assignable.

## Cleaning engine

`cleaner.ts` is a trimmed, DOM-free port of the website's
[`src/lib/cleaner.ts`](../src/lib/cleaner.ts). It handles:

- Grammar-aware em-dash replacement (comma / semicolon / colon / spaced hyphen),
  not a blind find-and-replace
- En-dash handling and `--`/`---` normalization
- Curly → straight quotes and apostrophes
- Ellipsis (`…` → `...`)
- Zero-width / invisible / watermark character stripping (ZWSP, ZWNJ, ZWJ, word
  joiner, BOM, soft hyphen, bidi marks, Unicode tag block)
- Whitespace cleanup (NBSP → space, collapse runs, trim line ends)
- **Code-fence protection** - fenced and inline code are masked before any
  character rule runs, so snippets, JSON and shell commands are never altered

> In production this engine should be a shared workspace package imported by both
> the site and the plugin, so the rules can never drift. The scaffold vendors a
> copy to stay dependency-light.

## TODO (post-MVP, from the spec)

- Post-paste "cleaned N items" toast with one-click **Undo**
- Status-bar live session counter and ribbon quick-toggle
- "Clean whole note", "Bypass paste", and "Scan note for AI tells" commands
- Right-click `editor-menu` entry
- `PluginSettingTab` with presets (Conservative / Standard / Strict) and per-rule
  toggles with live before→after examples
- Per-folder rules, dry-run preview-before-replace, internal-paste skip
- Mobile (iOS/Android) verification of the paste handler

## Build & install (manual / BRAT beta)

```bash
npm install
npm run build        # esbuild bundles main.ts -> main.js
```

Then copy `manifest.json`, `main.js` (and any `styles.css`) into
`<vault>/.obsidian/plugins/em-dash-remover/` and enable it in
**Settings → Community plugins**. For ongoing beta installs, use
[BRAT](https://github.com/TfTHacker/obsidian42-brat).

A standard Obsidian plugin toolchain (`obsidian`, `esbuild`, `typescript`
devDependencies + an `esbuild.config.mjs`) is assumed; it is **not** added to the
Astro project's dependencies.

## Privacy

Declares no host permissions, ships no analytics, makes zero `fetch`/`requestUrl`
calls, and reads only the clipboard payload of the current paste - the same
provable-privacy promise as the web tool.

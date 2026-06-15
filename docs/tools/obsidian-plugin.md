# Em Dash Remover for Obsidian (Clean-on-Paste)

> An Obsidian community plugin that intercepts AI-chat pastes and rewrites the text with our grammar-aware cleaning rules (em/en dashes, curly quotes, ellipses, invisible chars, AI tells) before a single character ever lands in your note — plus a one-keystroke command to clean any selection. Tier: 3. Difficulty: High. Runs: client-side (100% local; Obsidian is a desktop/mobile app, nothing leaves the vault).

## 1. What it does

When you paste text copied from ChatGPT, Claude, or Gemini into a note, the plugin catches the `editor-paste` event, runs the clipboard payload through the same cleaning engine as the website (em-dash → grammar-aware replacement, en-dash handling, curly→straight quotes, ellipsis normalization, zero-width/invisible-char stripping, whitespace cleanup), and inserts the cleaned Markdown instead of the raw AI output. It also registers an editor **command** ("Clean selection") so you can fix text that's already in a note, and a **bypass paste** command for the rare case you want the original verbatim. Everything runs locally inside Obsidian — the plugin makes zero network calls, which is the same provable-privacy story as the web tool, now living where Obsidian users actually draft.

## 2. Why users want it (demand & search)

**Target keywords (realistic):**
- `obsidian clean ai paste` / `obsidian remove em dash` — the exact in-app pain; low volume but extremely high intent, and the existing "Clean AI Paste" plugin proves the niche is real and under-served.
- `obsidian paste chatgpt clean` / `obsidian clean markdown paste` — medium-low, rising as more people draft with AI then archive in Obsidian.
- `obsidian smart typography` / `obsidian remove curly quotes` — adjacent established cluster (Smart Typography has tens of thousands of installs); searchers in this cluster are typography-sensitive note-takers.
- `obsidian plugin remove invisible characters` / `obsidian zero-width space` — niche but zero competition.
- `remove em dashes obsidian plugin` / `obsidian clean ai text` — our brand-aligned long tail; brings the website's existing SEO audience into the plugin store.

**Demand/competition read:** This is a Tier 3 (low-volume, high-loyalty) play. You don't win it on search volume — you win it as a **distribution channel** and a credibility halo for the website. The Obsidian community plugin browser is itself a discovery surface seen by a privacy-obsessed, power-user audience that overlaps almost perfectly with our ICP. Existing plugins (`obsidian-clean-ai-paste` ~customizable rule set; `obsidian-paste-reformatter` 5,316 downloads / regex-based; `obsidian-remove-newlines`; `obsidian-smart-typography`) validate the need but none combine grammar-aware em-dash replacement + invisible-char stripping + an AI-tell scan + a "this is the desktop arm of a trusted web tool" brand. Each install is a long-lived, daily-active user and a backlink/word-of-mouth node.

**Who searches & the moment they need it:** A knowledge worker, student, or researcher who drafts or brainstorms in ChatGPT/Claude, then pastes the result into their permanent Obsidian vault and is annoyed that their clean notes are now full of em dashes, curly quotes, and the occasional invisible watermark character. The moment of need is the paste itself — they want their vault to stay in *their* voice and *their* punctuation conventions, not the LLM's house style.

**Source domains found in research:** github.com/goslowpoke168/obsidian-clean-ai-paste, github.com/keathmilligan/obsidian-paste-reformatter, github.com/mgmeyers/obsidian-smart-typography, github.com/HandcartCactus/obsidian-remove-newlines, github.com/impPie/obsidian-clean-paste, github.com/kxxt/obsidian-advanced-paste, docs.obsidian.md (Editor, Commands, Releasing/Submit your plugin), forum.obsidian.md (editor-paste outcomes; htmlToMarkdown; simulate paste), obsidianstats.com (paste-reformatter, smart-typography), community.obsidian.md/plugins, github.com/obsidianmd/obsidian-releases, marcusolsson.github.io/obsidian-plugin-docs.

## 3. Target users & use cases

- **AI-assisted note-takers** — brainstorm/draft in ChatGPT/Claude/Gemini, then paste into a permanent note; want the punctuation and invisible chars normalized to their vault's conventions automatically.
- **Researchers & academics** — paste model summaries and quotes into a literature/zettelkasten vault and need consistent, citation-safe typography (straight quotes, plain hyphens) across thousands of notes.
- **Developers / technical writers** — em dashes, curly quotes, and zero-width chars break code blocks, JSON, and CLI snippets pasted from AI; they want a paste that's safe to drop next to code.
- **PKM / "second brain" power users** — already run Smart Typography, Paste Reformatter, Templater; this slots into a curated plugin stack and respects their "everything local" ethos.
- **Bloggers / writers who publish from Obsidian** (via Obsidian Publish, Hugo, Quartz, Eleventy) — want clean source Markdown so published output keeps their human voice and doesn't read as AI-generated.
- **ESL / non-technical note-takers** — don't know AI text "carries junk"; a silent clean-on-paste removes a problem they can't diagnose.
- **Mobile-first users** (Obsidian on iOS/Android) — paste from the AI app into mobile Obsidian; want the same cleanup without a separate web round-trip.

## 4. Features — core (MVP)

1. **Clean-on-paste interception** — register `this.registerEvent(this.app.workspace.on('editor-paste', cb))` with signature `(evt: ClipboardEvent, editor: Editor, info: MarkdownView | MarkdownFileInfo)`. Check `evt.defaultPrevented` first (defer to other plugins), read the clipboard, clean it, call `evt.preventDefault()`, and `editor.replaceSelection(cleaned)`. Only `preventDefault()` if we actually changed something — the Paste Reformatter pattern — so we never fight Obsidian's native paste when there's nothing to do.
2. **HTML-aware payload handling** — read `evt.clipboardData.getData('text/html')` when present and convert via Obsidian's built-in `htmlToMarkdown(html)` export (Turndown under the hood, pre-configured for Obsidian) before applying text rules; fall back to `getData('text/plain')` when there's no HTML. This preserves headings/lists/links/code while still cleaning the prose.
3. **Shared cleaning engine** — apply the existing website rules: grammar-aware em-dash replacement, en-dash handling, curly→straight quotes, ellipsis (`…`/`...`) normalization, invisible/zero-width char stripping (`U+200B–200D`, `U+FEFF`, `U+2060`, `U+00AD`, `U+180E`, tag chars `U+E0000–E007F`), and whitespace/non-breaking-space cleanup. Ship the engine as a framework-agnostic TS module shared between the Astro site and the plugin.
4. **"Clean selection" command** — `addCommand({ id, name, editorCallback: (editor) => editor.replaceSelection(clean(editor.getSelection())) })`, so users fix already-pasted text. Surfaces in the Command Palette and is hotkey-assignable.
5. **"Clean whole note" command** — `editorCallback` that reads `editor.getValue()`, cleans, and replaces, with an undo-safe single transaction and a confirmation if the note is large.
6. **Bypass-paste command** — a second paste command (suggest default `Ctrl/Cmd+Shift+V`) that inserts the original verbatim, for code or quotes you must keep exactly. Mirrors Clean AI Paste's bypass model.
7. **Per-rule settings tab** — `PluginSettingTab` with a toggle per rule (em dash, en dash, quotes, ellipsis, invisible chars, whitespace) plus a master "clean on paste" on/off, persisted via `loadData()`/`saveData()`.
8. **Internal-paste skip** — detect Obsidian-internal pastes (vault-to-vault, drag) and skip them, so moving your own text never gets re-processed.
9. **Code-fence / inline-code protection** — never alter characters inside fenced or inline code, so straight-quote/dash normalization can't corrupt snippets, JSON, or shell commands.
10. **Zero network calls** — no telemetry, no remote config; the manifest declares no host permissions and the bundle makes no `fetch`/`requestUrl`.

## 5. Features — engagement & helpfulness (what makes users love it & stay)

This is the section that turns a utility plugin into one people leave installed for years. Each item says *why* it helps.

1. **Silent, instant clean-on-paste (the magic moment)** — the cleanup happens on the `editor-paste` event itself; the user pastes and the text is *already* clean with no button, modal, or extra keystroke. *Why:* the entire value prop is "I stop thinking about this." Frictionless invisibility is what earns a permanent install instead of a one-time use.
2. **Post-paste "cleaned N items" toast** — a brief, dismissible `Notice` like "Cleaned: 3 em dashes, 2 curly quotes, 1 invisible char" after each paste. *Why:* makes the invisible work visible and trustworthy, gives a tiny dopamine hit, and teaches users the tool is earning its keep — without interrupting flow.
3. **Status-bar live counter** — a `addStatusBarItem()` chip showing a running session tally ("AI tells cleaned: 142"). *Why:* lightweight gamified feedback that quietly reinforces the habit and the brand every time they glance down.
4. **One-click "Undo this clean"** — the toast includes an inline "Undo" that reverts just the cleaning (re-inserts the original payload, which we cached). *Why:* removes the fear that automatic processing might mangle something; reversibility is what makes silent automation feel safe.
5. **Aggressiveness presets** — one-tap profiles in settings: **Conservative** (dashes + invisible chars only), **Standard** (full default set), **Strict** (also flatten exotic spaces, normalize multiple punctuation). *Why:* covers the cautious dev and the maximalist editor without anyone reading a 12-toggle list.
6. **Per-rule toggles with plain-English labels and live examples** — each toggle shows a tiny before→after ("`text—here` → `text - here`"). *Why:* users instantly understand what each rule does and trust it, instead of guessing from a jargon label.
7. **"Why this is a tell" education tooltips** — info icons next to rules explain *why* em dashes / curly quotes / zero-width chars read as AI ("LLMs over-use em dashes; this keeps your human voice"). *Why:* aligns with the brand's "quality, not detector-bypass" positioning and makes users feel smarter, not just cleaned-up.
8. **AI-tell scan command with an inline report** — a "Scan note for AI tells" command that highlights remaining tells (em-dash density, hedging phrases, invisible chars) in a side panel with counts, reusing the website's scanner. *Why:* turns the plugin from a silent fixer into an active coach; gives a reason to open it deliberately, deepening engagement.
9. **Hotkey-first design** — every action (clean selection, clean note, scan, toggle clean-on-paste) is a discrete command, so power users bind them to chords and never touch the mouse. *Why:* Obsidian's audience lives in the keyboard; commands that aren't hotkey-able feel broken to them.
10. **Command palette + right-click context menu entries** — register an `editor-menu` item "Clean selection with Em Dash Remover" on right-click. *Why:* meets users where their hand already is and aids discovery for people who don't memorize commands.
11. **Quick-toggle ribbon icon** — a left-ribbon button to flip clean-on-paste on/off, with the icon state showing whether it's armed. *Why:* one-glance control for the moment you *do* want to paste something verbatim (a code block, a quote) without diving into settings.
12. **Per-vault and per-folder rules (optional)** — let a "drafts/" folder use Strict while a "code/" folder is off, via a simple path-glob list. *Why:* respects that the same person wants different behavior for prose vs. snippets — the #1 reason all-or-nothing paste tools get uninstalled.
13. **Empty-state / first-run guidance** — on first install, a one-screen onboarding `Notice`/modal: "Paste anything from ChatGPT to see it cleaned. Customize in Settings → Em Dash Remover." *Why:* a plugin with no obvious UI can feel like it did nothing; a 5-second orientation prevents "is this even working?" churn.
14. **Dry-run / preview-before-replace mode (toggle)** — optional setting that shows a diff modal before inserting, with additions/removals highlighted, and a "Insert clean" / "Keep original" choice. *Why:* the cautious cohort (academics, legal note-takers) won't trust silent replacement until they've watched it a few times; preview converts skeptics into permanent users.
15. **"Open the full web tool" link** — settings footer link to the website for batch cleaning, the AI-tell report, and sibling tools. *Why:* turns each installed plugin into a steady referral channel back to the site and its ad/SEO surface, and gives users the heavier features that don't belong in an editor.
16. **Theme-native dark/light + mobile parity** — use Obsidian CSS variables (`var(--text-muted)`, etc.) so UI matches the user's theme, and verify the paste handler on iOS/Android. *Why:* feels first-party, works on the phone where people increasingly paste AI output, and avoids the jarring "bolted-on" look that gets plugins removed.

## 6. UX / UI notes

- **Primary interaction is invisible:** the best UX is *no UI* — paste, done. All visible surfaces (toast, status bar, settings) are secondary confirmations, not required steps.
- **Settings tab layout:** master toggle at top ("Clean on paste"), then a preset selector (Conservative / Standard / Strict / Custom), then the per-rule toggle list with inline before→after examples and "why" tooltips, then advanced (per-folder rules, preview mode, internal-paste skip), then a footer with version + link to the web tool.
- **States:**
  - *Idle/armed:* ribbon icon shows clean-on-paste is on; nothing else.
  - *Processing:* effectively instant for normal pastes; for a very large paste (e.g. >100 KB) show a transient "Cleaning…" `Notice` and run async so the UI never blocks.
  - *Result:* "Cleaned N items" toast with Undo; status-bar tally increments.
  - *No-op:* if nothing changed, do **not** `preventDefault()` and show nothing — silence on no-op is a feature.
- **Microcopy tone:** calm, factual, brand-aligned ("Kept your voice. Cleaned 3 em dashes."). Never "beat the detector" language — always quality/voice framing.
- **Mobile behavior:** confirm `editor-paste` fires on Obsidian mobile (CodeMirror 6 on both); keep toasts short and tap targets large; ensure the right-click action is reachable via mobile's long-press editor menu.
- **Accessibility:** all toggles are real checkboxes with labels; toasts are also written to a status-bar text node (not color-only) so the signal isn't purely visual; preview-diff uses text markers (+/−) in addition to color to satisfy WCAG 1.4.1 (no color-only meaning); respect Obsidian's reduced-motion and high-contrast themes by using theme variables only.

## 7. Technical implementation (client-side)

- **Stack:** standard Obsidian plugin scaffold — TypeScript, esbuild bundle to `main.js`, `manifest.json`, optional `styles.css`. Extends `Plugin`; `onload()` registers events/commands/ribbon/status-bar/settings; everything wrapped in `this.registerEvent`/`this.addCommand` so it's auto-cleaned on unload.
- **Paste hook:**
  ```ts
  this.registerEvent(this.app.workspace.on('editor-paste',
    (evt: ClipboardEvent, editor: Editor) => {
      if (evt.defaultPrevented || !this.settings.cleanOnPaste) return;
      const html = evt.clipboardData?.getData('text/html');
      const raw  = html ? htmlToMarkdown(html)
                        : evt.clipboardData?.getData('text/plain') ?? '';
      const { text, stats } = this.engine.clean(raw, this.settings.rules);
      if (text === raw) return;            // no-op: let Obsidian handle it
      evt.preventDefault();
      editor.replaceSelection(text);
      this.report(stats);                  // toast + status bar
    }));
  ```
- **Shared engine:** extract the website's cleaning logic into a pure `clean(input, rules) -> { text, stats }` TS module with **no DOM and no Astro dependency**, published as an internal workspace package and imported by both the site and the plugin. Single source of truth = no rule drift, and the plugin needs no extra runtime deps.
- **Key algorithms / Unicode:**
  - *Em dash:* grammar-aware replacement (reuse existing logic): decide hyphen vs. comma vs. spaced hyphen vs. nothing from surrounding tokens; never inside code.
  - *Invisible chars:* strip `​-‍﻿⁠­᠎` and tag block `\u{E0000}-\u{E007F}` via a single global regex with the `u` flag.
  - *Quotes:* `‘’ → '`, `“” → "`; *ellipsis:* `… → ...` (or normalize `...`); *en dash* `–` per existing rules.
  - *Whitespace:* collapse runs, convert NBSP ` `, trim trailing spaces, normalize blank-line runs (configurable, like Clean AI Paste's Standard/Tight/Off).
- **Code protection:** before applying char-level rules, mask fenced (```` ``` ````) and inline (`` ` ``) code spans (tokenize → placeholder → restore) so dashes/quotes inside snippets are never touched. This is the single most important correctness safeguard.
- **htmlToMarkdown caveat:** it's an exported, documented Obsidian API (Turndown-backed) but version-gate it and fall back to plain text if unavailable, so the plugin degrades gracefully on older app versions.
- **Performance:** for large pastes, run cleaning off the main paste path (microtask/`requestIdleCallback`-style chunking) and replace once; regexes are linear and cheap, so even 100 KB completes in single-digit ms. Avoid catastrophic backtracking by keeping all patterns possessive/simple.
- **Edge cases & failure modes:** internal vault pastes (skip), images/attachments on clipboard (no `text/*` → bail, let Obsidian handle), partial code blocks across the paste boundary, frontmatter (don't touch YAML), tables (preserve pipes), `evt.clipboardData` null on some mobile paths (fall back to async `navigator.clipboard.readText()` guarded behind the no-op check), and other paste plugins also listening (the `defaultPrevented` guard + conditional `preventDefault` prevents double-handling).
- **Privacy story:** Obsidian apps run locally; the plugin declares no network use, ships no analytics, and reads only the clipboard payload of the current paste. No server, no LLM — identical provable-privacy claim as the web tool, and verifiable since plugin source is on GitHub and reviewed by Obsidian before listing.

## 8. Competitors & how we differentiate

- **Clean AI Paste** (`goslowpoke168/obsidian-clean-ai-paste`) — closest competitor; intercepts paste, `htmlToMarkdown`, customizable rules (blank lines, emojis, headers, code fences, URL tracking-param stripping), bypass paste. *Weakness:* focused on Markdown structure/emojis, not grammar-aware em-dash handling, invisible-watermark stripping, or an AI-tell scan; no brand/web companion.
- **Paste Reformatter** (`keathmilligan/...`, 5,316 downloads) — powerful regex-based HTML+Markdown transforms, heading re-leveling, only prevents default when it transforms. *Weakness:* regex-DIY; users must author patterns themselves — no out-of-the-box "clean AI tells," no invisible-char handling, no education.
- **Smart Typography** (`mgmeyers/...`, large install base) — the inverse of us: it *adds* curly quotes/em dashes *as you type* via CodeMirror input rules. *Weakness:* opposite goal and operates on keystrokes, not paste; many users actually want our direction (un-fancy AI output back to plain).
- **Remove Newlines** / **Clean Paste** (`HandcartCactus`, `impPie`) — single-purpose blank-line/formatting strippers. *Weakness:* no dash/quote/invisible-char intelligence; narrow.
- **Our wedge:** (1) **grammar-aware** em-dash replacement no competitor does; (2) **invisible/zero-width watermark stripping** built in; (3) an **AI-tell scan + education** that frames the tool around *human voice and quality*, not detector-bypass; (4) **consolidation** — one plugin instead of stacking three; (5) **trusted web companion** with provable privacy, batch tools, and the same engine, giving the plugin a credibility and discovery advantage the solo plugins lack.

## 9. SEO & page structure

This ships as **both** a plugin listing (Obsidian store) and a dedicated landing page on the site that markets/links to it.

- **Primary keyword:** `obsidian clean ai paste plugin` / `em dash remover for obsidian`.
- **Secondary:** `obsidian remove em dashes`, `obsidian clean chatgpt paste`, `obsidian remove curly quotes`, `obsidian strip invisible characters`, `obsidian ai text cleaner`.
- **H1:** "Em Dash Remover for Obsidian — Clean AI Paste, Locally."
- **H2 outline:** What it does · Clean-on-paste in action (GIF) · Commands & hotkeys · Per-rule settings & presets · 100% local / privacy · How it compares (vs. Clean AI Paste / Smart Typography / Paste Reformatter) · Install (community plugin browser + manual) · FAQ.
- **FAQ ideas:** "Does it send my notes anywhere?" (no, fully local) · "Will it break my code blocks?" (no — code is protected) · "Can I keep the original sometimes?" (bypass paste / per-folder rules) · "Does it work on mobile?" (yes) · "How is this different from Smart Typography?" (opposite direction) · "Does it remove AI watermarks?" (strips zero-width chars).
- **schema.org type:** `SoftwareApplication` (applicationCategory: BrowserApplication/Productivity; operatingSystem: Obsidian) with `FAQPage` for the FAQ block and `HowTo` for install steps.
- **Internal links to sibling tools:** the main paste-box cleaner, the AI-tell report, the invisible-watermark/character inspector, the homoglyph/confusables detector, and the straight↔curly quotes converter — positioning the plugin as the "in-editor" arm of the suite.

## 10. Build effort & priority

- **Effort:** Medium-High. The cleaning engine already exists; the real work is (a) extracting it into a DOM-free shared TS module, (b) learning/implementing the Obsidian plugin lifecycle (events, commands, settings, status bar, ribbon), (c) bulletproofing code-fence protection and the no-op/`defaultPrevented` paste contract, (d) mobile verification, and (e) the community-plugin submission gauntlet.
- **Dependencies on existing code:** hard dependency on refactoring the website's cleaning rules into a framework-agnostic package (this also benefits every other tool in the suite — do it once, reuse everywhere). Optional reuse of the AI-tell scanner for the scan command.
- **Distribution:** submit via `obsidianmd/obsidian-releases` — create a GitHub release whose tag matches `manifest.json` `version` (SemVer), add an entry to `community-plugins.json`, open a PR; passes automated validation then human review. Budget weeks of lead time for review; ship a manual-install / BRAT beta in parallel so early adopters (and the website audience) can use it immediately.
- **Recommended sequencing:** Do this **after** the shared-engine refactor lands and **after** the core web tools (which drive traffic) are solid, since Tier 3 is a loyalty/distribution play rather than a volume play. Phase it: (1) MVP clean-on-paste + clean-selection command + basic settings → BRAT beta; (2) add toast/undo/status-bar + presets + per-rule examples; (3) add scan command, per-folder rules, preview mode; (4) submit to the community store once stable. Treat the plugin as a long-tail credibility and backlink engine for the brand, not a near-term traffic source.

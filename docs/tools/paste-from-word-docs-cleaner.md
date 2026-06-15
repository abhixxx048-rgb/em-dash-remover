# Paste-from-Word/Docs Rich Formatting Cleaner

> Paste straight from Word, Google Docs, or a PDF and get clean, plain paragraphs back - the "mso-" span soup, inline styles, and broken PDF line breaks are stripped the instant you paste, 100% in your browser. Tier: 1. Difficulty: Med. Runs: client-side (100%, no network).

## 1. What it does

Intercepts the `paste` event and reads the **rich HTML payload** the clipboard carries (`text/html`), not just the plain text - that hidden HTML is where Word and Google Docs hide their formatting cruft. It strips Word's `mso-`/`MsoNormal` styles, `<o:p>`/`<w:>`/`<xml>` namespace junk, conditional comments, `StartFragment`/`EndFragment` markers, Google Docs' `docs-internal-guid` wrapper and inline `font-weight:700` spans, and empty/style-only tags - while **keeping the real structure** (paragraphs, headings, lists, bold/italic, links). It also fixes the classic PDF-copy artifacts: words hyphenated across line breaks (`com-\npany` → `company`), one-line-break-per-visual-row paragraphs, and stray page numbers/headers. The output is offered as both clean semantic HTML and clean plain text, with nothing ever leaving the device.

## 2. Why users want it (demand & search)

**Target keywords (realistic):**
- `clean word html` / `word to html cleaner` - high volume, evergreen, the dominant cluster (primary)
- `remove mso styles` / `strip word formatting` / `remove word formatting from text` - high, technical intent
- `paste from word without formatting` / `clean paste` - high, the "moment of need" query
- `google docs to clean html` / `remove docs-internal-guid` - medium, rising, under-served
- `fix pdf copy text` / `remove line breaks from pdf copy` / `pdf paste line break remover` - high and rising (PDF artifacts are a huge pain cluster), strong wedge
- `remove inline styles from html` / `clean html online` - high, but crowded by code-formatter tools
- `paste from word into cms without junk` / `clean word paste wordpress` - long tail, transactional, CMS/editor audience

**Demand/competition read:** The "Word to HTML" cluster is mature and crowded with established tools (wordhtml.com, html-cleaner.com, wordtohtml.net, inspectthepath, popupnote) that mostly assume you already *have* HTML and paste it into a box. Almost none of them read the clipboard HTML on paste - they expect the user to know what "messy HTML" even is. The genuinely under-served, fast-rising wedge is **PDF-copy cleanup** (linebreakremover.com, snaptextclean.com, cleanmytext.com, aicleantext.com/fix-pdf-copy-text are recent entrants), where hyphenation alone causes ~40–50% of copy corruption. Combining live paste-interception + Word/Docs cruft removal + PDF-artifact repair + provable privacy in one tool is a combination none of the incumbents offer.

**Who searches & the moment they need it:** Someone just pasted a Word or Docs draft into a CMS, email, Notion, or web form and it arrived with weird fonts, broken spacing, or visibly mangled HTML - they want plain, on-brand text *right now*. A second large cohort just copied a paragraph out of a PDF (report, paper, invoice, contract) and got one line break per row plus split hyphenated words, and needs it reflowed into real paragraphs before they can use it.

**Source domains found in research:** learn.microsoft.com (CF_HTML / HTML Clipboard Format spec; "remove extraneous HTML cruft" archive), w3.org/TR/clipboard-apis, developer.mozilla.org (paste event, clipboardData), github.com/raineorshine/wordsoap, github.com/cure53/DOMPurify (+ wiki default allow-list), blog.codinghorror.com ("Cleaning Word's Nasty HTML"), terrillthompson.com (Word HTML regex), iter.ca (hidden HTML Google adds to the clipboard), tiny.cloud (Google Docs PowerPaste), wordhtml.com, html-cleaner.com, wordtohtml.net, inspectthepath.com, popupnote.com, linebreakremover.com, snaptextclean.com, cleanmytext.com, aicleantext.com/fix-pdf-copy-text, raymondcamden.com (working with pasted content in JS).

## 3. Target users & use cases

- **Content writers / bloggers / CMS users** - draft in Word or Google Docs, then paste into WordPress, Ghost, Webflow, or a custom CMS and need clean markup that won't fight the site's own styles or leave `MsoNormal` classes in the page source.
- **Marketers / email & newsletter authors** - paste a Docs draft into Mailchimp/HubSpot/an ESP editor where Word's inline `font-family`/`mso-` styles break the email template's rendering.
- **Developers / front-end engineers** - need a quick way to turn a stakeholder's Word doc into clean semantic HTML (`<p>`, `<ul>`, `<strong>`) without hand-deleting style attributes, or to sanitize pasted content in their own rich-text editor.
- **Students / academics / researchers** - copy quotations and passages out of PDFs (papers, textbooks, court documents) and need the hyphenation and per-line line breaks repaired into a usable paragraph for notes or citations.
- **Legal / finance / ops professionals** - pull clauses, figures, and tables out of PDF contracts, invoices, whitepapers, and policy docs that paste as fragmented, page-number-littered text.
- **Editors / publishers** - enforce clean, structure-only copy from contributors who submit in Word, stripping the visual styling while preserving headings and lists.
- **ESL / non-technical writers** - don't know that pasting from Word "carries junk"; a one-paste tool that just produces clean text removes a problem they can't diagnose themselves.
- **Support / knowledge-base authors** - paste from Docs into Zendesk/Confluence/Notion and need it to match house style instead of importing Docs' span wrapper.

## 4. Features - core (MVP)

1. **Paste-interception input** - a focused editable area (or paste-target) that hooks the native `paste` event, reads `event.clipboardData.getData('text/html')` (falling back to `text/plain` when no HTML is present), calls `preventDefault()`, and processes the payload immediately rather than waiting for a button. A manual "paste HTML here" textarea is also offered for users who already have raw HTML.
2. **Word cruft removal** - strip `mso-*` inline style declarations, `MsoNormal`/`MsoListParagraph`/`Mso*` classes, `<o:p>`, `<w:*>`, `<m:*>`, `<v:*>`, and `<xml>` namespace tags, Word `<style>` blocks (which sit outside `StartFragment`), `lang=`, `<!--[if ...]> ... <![endif]-->` conditional comments, and the `<!--StartFragment-->` / `<!--EndFragment-->` / CF_HTML header markers.
3. **Google Docs cruft removal** - unwrap the outer `<b style="font-weight:normal" id="docs-internal-guid-...">` wrapper, convert inline `<span style="font-weight:700">` back to semantic `<strong>` (and `font-style:italic` → `<em>`), and drop the `docs-internal-guid`/`id` attributes and redundant inline spans.
4. **Generic inline-style + attribute stripping** - remove `style`, `class`, `lang`, `align`, `dir`, and event-handler attributes from all elements; collapse `<span>`/`<font>` wrappers that carry no semantic meaning while **keeping their text content**.
5. **Structure preservation (allow-list)** - keep a curated set of structural/semantic tags: `p, br, h1–h6, ul, ol, li, strong, em, b, i, u, a[href], blockquote, code, pre, table, thead, tbody, tr, td, th`. Everything else is unwrapped (content kept) or dropped.
6. **PDF-artifact repair (toggle)** - de-hyphenate words split across line breaks (`word-\n word` → `word`), reflow single-`\n`-per-visual-row text into real paragraphs (join soft line breaks, keep blank-line paragraph boundaries), and optionally drop lines that look like page numbers / repeated running headers.
7. **Empty-element + whitespace cleanup** - remove empty `<p></p>`, `<span></span>`, stray `&nbsp;` runs, and collapse multiple blank lines; reuse the existing whitespace logic from the main cleaner.
8. **Dual output: clean HTML + plain text** - show both a clean semantic-HTML view and a plain-text view, each independently copyable.
9. **One-click copy / clear** - copy the chosen output to clipboard; clear the workspace.
10. **Zero network calls** - all parsing/sanitizing runs in the browser via the DOM; nothing is uploaded.

## 5. Features - engagement & helpfulness (what makes users love it & stay)

This is the section that turns a one-off utility into a sticky, trustworthy tool. Each item says *why* it helps.

1. **Instant paste-and-done (no button hunt)** - the cleanup fires on the `paste` event itself, so the user pastes and the clean result is already there. *Why:* removes the single biggest friction of every competitor (paste → find the "Clean" button → click); it feels magic and "just works," which is what earns a bookmark.
2. **Live before/after split view** - original messy payload on one side (rendered + raw-HTML toggle), clean result on the other, updating instantly. *Why:* proves the tool actually changed something and lets the user trust the output at a glance instead of guessing.
3. **Source auto-detection badge** - detect and label where the paste came from ("Detected: Microsoft Word", "Google Docs", "PDF copy", "Generic HTML") from telltale markers (`mso-`, `docs-internal-guid`, per-line line breaks + hyphens). *Why:* it's a delightful "it understands me" moment and reassures the user the right cleanup profile is being applied.
4. **"What we removed" inventory** - a collapsible summary: "Removed 142 inline styles, 38 empty spans, 6 `mso-` blocks, 1 Docs wrapper; fixed 9 hyphenated words; joined 24 line breaks." *Why:* power users (devs, editors) trust a tool that shows its work, and the counts make the cleanup feel like a measurable win.
5. **Cleanup-aggressiveness presets** - one-click profiles: **"Keep formatting"** (strip junk, keep bold/links/lists/headings), **"Plain text only"** (flatten to clean prose), and **"Markdown"** (output GitHub-style Markdown). *Why:* covers the CMS author who wants structure, the email writer who wants plain prose, and the dev/Notion user who wants Markdown - without anyone touching a settings panel.
6. **Per-rule toggles with sensible defaults** - checkboxes for "Keep links," "Keep bold/italic," "Keep lists," "Keep headings," "Repair PDF line breaks," "Drop page numbers." *Why:* the universal complaint about paste-cleaners is they're all-or-nothing; granular keeps let a user save exactly the structure they care about.
7. **PDF reflow live preview with undo** - when PDF repair joins line breaks, show the joins highlighted and offer a one-click "undo reflow" if the text was actually a list/poem/code that *should* keep its breaks. *Why:* line-break joining is the one operation that's sometimes wrong; making it reversible removes the fear of mangling the user's content.
8. **"Try an example" buttons** - three demo loaders: a gnarly Word paste, a Google Docs paste, and a broken PDF paste. *Why:* solves the empty-state problem and lets a first-time visitor feel the value in two seconds without pasting private content.
9. **Copy as: HTML / plain text / Markdown / rich (for re-paste)** - multiple export paths, including a "copy rich" that writes clean HTML back to the clipboard so the user can paste *formatted-but-clean* content into the next app. *Why:* meets the user at their real destination (CMS, email, Notion, Word) and removes the last-step friction.
10. **Download as .html / .txt / .md** - for users moving the result into a file or repo. *Why:* the dev/editor cohort often wants a file, not a clipboard.
11. **"Why your paste was messy" education panel** - a short, plain-language explainer: Word and Docs hide a rich-HTML copy in the clipboard full of `mso-` styles and span wrappers; PDFs store text by visual position so line breaks and hyphens come along for the ride. *Why:* turns a utility into a learning moment, builds topical authority, and supports internal linking/SEO.
12. **Raw-HTML inspector (view source)** - a "show the raw clipboard HTML" toggle so curious/technical users can see the actual `StartFragment`/`mso-` payload that was cleaned. *Why:* radical transparency reinforces the provable-privacy brand and is genuinely useful for devs debugging their own paste handlers.
13. **Remembered preferences (localStorage)** - persist the chosen preset and per-rule toggles between visits; never persist pasted content. *Why:* a returning CMS author keeps their "Keep formatting" profile automatically - the thing that makes a utility a habit rather than a one-off.
14. **Keyboard shortcuts** - `Ctrl/Cmd+V` to paste-and-clean (native), `Ctrl/Cmd+C` to copy the active output, `Ctrl/Cmd+Shift+M` to toggle Markdown output, `Esc` to clear. *Why:* lets repeat users (an editor cleaning doc after doc) move at speed.
15. **Live word/character/paragraph counter on the output** - small running counts on the cleaned result. *Why:* writers and students need to know length, and it gives the cleanup a tangible result figure.
16. **Empty-state guidance + tooltips** - placeholder copy ("Paste straight from Word, Google Docs, or a PDF - we'll strip the junk and keep your real paragraphs") and a `(?)` tooltip on each toggle with a one-line plain example. *Why:* removes guesswork for ESL and non-technical users who don't know what `mso-` even is.
17. **Dark mode + mobile-first layout** - respects `prefers-color-scheme`; stacks before/after vertically on phones with big tap targets and a sticky Copy bar. *Why:* a meaningful share of "paste from the Docs/PDF app" traffic is mobile and the experience must not break.
18. **Cross-sell handoff strip** - after cleaning, "We also kept some curly quotes and 3 em dashes - run the full AI-text cleaner?" *Why:* converts a single-purpose visitor into a hub user and reinforces the suite (this tool deliberately does *not* normalize quotes/dashes - that's the main cleaner's job).

## 6. UX / UI notes

- **Layout:** A prominent paste target up top ("Paste here - Ctrl/Cmd+V") with the before/after panes below: messy source (with a rendered ⇄ raw-HTML toggle) on the left, clean result on the right, matching the existing `Cleaner.astro` two-pane pattern. Preset chips and per-rule toggles sit in a compact bar between/above the panes; the "what we removed" inventory and education panel are collapsible underneath. On mobile it collapses to a single stacked column.
- **Input/output model:** Primary path is **live paste-interception** (paste → instant clean). Secondary path is a manual "paste raw HTML" textarea for people who already extracted HTML. Output is dual: clean HTML and plain text, each with its own copy button; Markdown is a third output behind the preset/toggle.
- **States:**
  - *Empty:* friendly placeholder, a one-line value prop, and the three "Try an example" buttons (Word / Docs / PDF). No scary blank box.
  - *Processing:* DOM parse + sanitize is synchronous and instant for normal docs; for very large pastes show a subtle "cleaning…" shimmer and process in a microtask/Web Worker (see §7).
  - *Result:* clean panes populated, source badge shown ("Detected: Word"), removal-inventory counts as pills, copy/download enabled. If the paste was already clean: "Looks clean already - no Word/Docs junk found." (positive, not an error).
- **Microcopy tone:** Plain, calm, reassuring; quality-and-clarity framed, never "beat the detector." E.g. "Keeps your headings, lists, and links. Drops the invisible Word junk."
- **Mobile:** single column, source pane collapsible, persistent bottom Copy bar, preset chips in a horizontal scroller, no hover-only affordances (tooltips also open on tap).
- **Accessibility (WCAG 2.2 AA):** the before/after diff and PDF-reflow highlights must NOT rely on color alone - pair color with an icon/underline/label so colorblind users can see what changed; the source-detection badge and removal counts are announced via `aria-live="polite"`; full keyboard operability for the paste target, toggles, chips, and copy buttons; visible focus rings; contrast ≥ 4.5:1 in both themes; the editable paste target carries a clear accessible label.

## 7. Technical implementation (client-side)

**Read the rich payload, not the plain text.** On `paste`, use `const cb = e.clipboardData || window.clipboardData; const html = cb.getData('text/html'); const text = cb.getData('text/plain');` then `e.preventDefault()` so the browser doesn't insert the dirty markup. `text/html` is where Word/Docs hide everything; if it's empty, fall back to the `text/plain` path (and route straight to the PDF-artifact pass, since PDF copies usually have no HTML).

**Parse with the DOM, sanitize with an allow-list - don't regex the whole tree.**
1. `const doc = new DOMParser().parseFromString(html, 'text/html')` to get a real, safely inert document (the parsed nodes are *not* attached to the live page, so scripts don't run).
2. Run **DOMPurify** as the sanitizer with an explicit `ALLOWED_TAGS` allow-list (`p, br, h1–h6, ul, ol, li, strong, em, b, i, u, a, blockquote, code, pre, table, thead, tbody, tr, td, th`) and `ALLOWED_ATTR: ['href']`. Per DOMPurify's defaults, `style`, `class`, `lang`, and event handlers are stripped automatically, and a tag that's *not* allow-listed is **unwrapped with its text content kept** - exactly the behavior we want for `<span>`/`<font>` soup. (~20 kB gzipped; battle-tested; the right tool because hand-rolled regex on Word HTML is famously fragile.)
3. **Pre-DOMPurify regex pass** for the structural junk that lives *outside* normal elements and that an allow-list won't catch on its own: strip `<!--StartFragment-->`/`<!--EndFragment-->`, the CF_HTML header block, `<!--[if ...]>…<![endif]-->` conditional comments, `<xml>…</xml>` / `<w:…>` / `<o:…>` / `<m:…>` / `<v:…>` namespace blocks, and Word's `<style>…mso-…</style>` blocks. These are cheap, well-scoped regexes (the Word `mso-`/`MsoNormal` cleanup is the classic problem documented by Coding Horror, Terrill Thompson, and wordsoap).
4. **Google Docs normalization hook** (a DOMPurify `uponSanitizeElement`/`afterSanitizeAttributes` hook or a post-parse walk): unwrap the `[id^="docs-internal-guid-"]` `<b style="font-weight:normal">` wrapper; map inline `font-weight:600/700` spans → `<strong>` and `font-style:italic` → `<em>` **before** styles are stripped, so the user keeps real bold/italic instead of losing it.
5. **Empty/redundant cleanup walk:** remove empty `<p>`, `<span>`, `<li>`; collapse `&nbsp;` runs; merge adjacent identical inline tags. Then serialize to the clean HTML output, and derive plain text via `element.innerText`/a text walker (preserving paragraph and list-item boundaries).

**PDF-artifact repair (separate, text-level pass):**
- **De-hyphenation:** join `/([A-Za-z])-\s*\n\s*([a-z])/g → "$1$2"` (lowercase second part = almost always a soft hyphen at a line wrap, not a real hyphenated compound).
- **Reflow:** join a single `\n` between two lines that *don't* end in sentence punctuation into a space, but **keep** `\n\n` (paragraph breaks) and keep breaks before list markers (`•`, `-`, `1.`). This converts "one visual line per row" back into paragraphs.
- **Page furniture:** optionally drop lines matching `^\s*\d+\s*$` (bare page numbers) and repeated running headers/footers (a line that recurs identically every N lines).

**Edge cases & failure modes:**
- **No `text/html` available** (plain-text-only paste, Safari quirks, or pasting from a PDF reader): fall back to `text/plain` and run only the PDF/whitespace passes; never error.
- **Tables:** Word/Docs tables carry the heaviest `mso-`/`width`/`border` styling - keep table structure but strip every style; warn that complex table layouts will flatten.
- **Real hyphenated compounds** (`well-known`, `e-mail`) and intentional line breaks (poetry, code, addresses): the de-hyphenation/reflow heuristics can over-join, so PDF repair is a *toggle* with a visible, undoable highlight (§5.7).
- **Nested lists / `mso-list` numbering:** Word fakes list structure with `mso-list` + manual numbers/bullets in text; detect and convert to real `<ol>`/`<ul>` where possible, otherwise leave the visible markers as plain text rather than duplicating numbers.
- **Pasted images / base64 data URIs:** drop them by default (they bloat output and aren't text); mention in the inventory.
- **XSS safety:** because we render the *original* messy HTML in the before-pane, that pane must show **escaped/sanitized** markup or render via a sandboxed mechanism - never inject raw clipboard HTML into the live DOM. DOMPurify is exactly the guard here.

**Performance for large text:** DOMParser + DOMPurify is O(n) over the node count and handles typical multi-page docs instantly. For very large pastes (a whole book chapter, >~500 KB of HTML) the parse can jank the main thread - process in a Web Worker (DOMPurify + a worker-side DOM shim, or parse on main + sanitize/transform in chunks) and show the "cleaning…" shimmer. The PDF text passes are plain O(n) string work and stay fast.

**Server/LLM:** none required. `DOMParser`, DOMPurify, and the text passes all run in-browser - the privacy story is airtight and identical to the existing engine: nothing here touches the network, no upload, no API key. (Markdown output uses a tiny client-side HTML→Markdown step, also local.)

## 8. Competitors & how we differentiate

**Real competitors found:** wordhtml.com, html-cleaner.com, wordtohtml.net, inspectthepath.com/tools/html-cleaner, popupnote.com/html-cleaner, netstool.com (Word→HTML cluster); github.com/raineorshine/wordsoap (the canonical Word-cruft library); for the PDF side, aicleantext.com/fix-pdf-copy-text, linebreakremover.com, snaptextclean.com, cleanmytext.com; plus rich-editor "PowerPaste" features in TinyMCE/CKEditor (built into editors, not standalone).

**Their weaknesses:**
- Almost all of the Word→HTML tools make the user **paste raw HTML into a box** - they don't intercept the `paste` event or read `text/html` from the clipboard, so a non-technical user never even gets the dirty HTML out of Word in the first place.
- The Word tools and the PDF tools are **separate worlds**; no single tool handles Word *and* Google Docs *and* PDF-copy artifacts in one paste.
- Many are ad-heavy, offer no source-detection, no transparency about *what* was removed, no education, and several are framed as code beautifiers rather than "make my pasted text clean."
- Few make a **provable** privacy claim (some run server-side); the PowerPaste options that do this well are locked inside paid commercial editors, not a free standalone page.
- wordsoap is a library, not a product - no UI, no Docs/PDF handling, no privacy framing.

**Our wedge:**
1. **Live paste-interception** - read the clipboard HTML on paste so it "just works" for non-technical users; competitors mostly can't/don't.
2. **Three sources, one tool** - Word + Google Docs + PDF-copy repair unified, which no incumbent combines.
3. **Provable privacy** - 100% client-side via `DOMParser`/DOMPurify, matching the brand's core hook (several competitors send text to a server).
4. **Transparency** - source auto-detection badge + "what we removed" inventory + raw-HTML inspector; nobody else shows their work this clearly.
5. **Structure-preserving by default** - keep headings/lists/links/bold via an allow-list, with granular keeps; competitors are usually all-or-nothing.
6. **Consolidation** - one tap to hand off curly quotes / em dashes / invisible chars to the full cleaner, which standalone pages can't offer.
7. **Quality, not bypass** - framed as "clean, professional, on-brand text," never "beat the detector."

## 9. SEO & page structure

**Primary keyword:** "clean word html" / "paste from word without formatting" (H1 target).
**Secondary:** "remove mso styles," "google docs to clean html," "fix pdf copy text," "remove line breaks from pdf copy," "strip word formatting from text," "remove inline styles from html," "clean word paste for wordpress."

**H1/H2 outline:**
- **H1:** Clean Word, Google Docs & PDF Paste - Strip Formatting, Keep Your Text (Free, Private)
- H2: Paste from Word, Docs, or a PDF - we clean it instantly *(the tool)*
- H2: What it removes (and what it keeps) - `mso-` styles, span soup, Docs wrappers, PDF line breaks vs your headings, lists, and links
- H2: Why pasting from Word and PDFs gets messy *(education + internal links)*
- H2: How to use it / presets (Keep formatting · Plain text · Markdown)
- H2: 100% in your browser - your text never leaves your device *(privacy)*
- H2: FAQ

**FAQ ideas (FAQPage schema):**
- Does this upload my document anywhere? (No - it reads the clipboard and cleans it entirely in your browser.)
- What is `mso-` / `MsoNormal` and why is it in my paste? (Word's hidden formatting; we strip it.)
- Will it keep my headings, bold text, and links? (Yes - by default; choose "Plain text" to flatten.)
- Why does copying from a PDF add line breaks and split words? (PDFs store text by position; we de-hyphenate and reflow.)
- Can I get clean Markdown instead of HTML? (Yes - switch the output to Markdown.)
- Does it work on Google Docs paste? (Yes - it removes the `docs-internal-guid` wrapper and inline spans.)

**schema.org:** `SoftwareApplication`/`WebApplication`, `applicationCategory: Utility`, `offers` price `0`, plus a nested `FAQPage`. Reuse the site's existing structured-data setup.

**Internal links to sibling tools:** the main Em Dash Remover / full AI-text cleaner (for quotes/dashes/invisibles it deliberately leaves alone), Markdown Stripper, Whitespace & Line-Break Reflow Fixer, Emoji & Decorative-Symbol Stripper, Invisible/Watermark Character Inspector, and the "Signs of AI Writing" blog. This page becomes a strong hub node feeding the cleaner from a different (formatting, not detection) intent.

## 10. Build effort & priority

**Effort:** Medium (≈ 1.5–2.5 days for a credible MVP + engagement layer). The paste-interception + `DOMParser`/DOMPurify pipeline and the before/after diff are genuinely new work (more than a regex pass), and the PDF-reflow heuristics need tuning and an undo path. The surrounding shell (two-pane layout, copy/download, counts pills, dark mode, SEO scaffolding, structured data) already exists in `Cleaner.astro` / `cleaner.ts` / `Base.astro`.

**Dependencies on existing code:**
- New dependency: **DOMPurify** (~20 kB gzipped) - the one real library. Word/Docs hooks and the PDF passes are custom but small.
- Reuse `cleaner.ts` whitespace/collapse helpers and the `CleanResult.counts` contract so the removal-inventory and counters come almost for free; reuse the existing copy-to-clipboard and dark-mode/layout primitives.
- Optional: a tiny HTML→Markdown helper (e.g. a small Turndown-style function) for the Markdown output; keep it local.

**Recommended sequencing:** This is a higher-effort Tier-1 item than the pure-regex strippers (emoji, invisibles, whitespace), so ship those first to build the suite quickly, then slot this in as the **flagship "paste from anywhere" tool** - it targets a large evergreen keyword cluster (Word→HTML) plus the fast-rising PDF-copy cluster, and the live-paste-interception experience is a standout demo that differentiates the whole suite. Build in this order: (1) paste-interception + DOMParser/DOMPurify allow-list + clean-HTML/plain-text output; (2) Word + Docs normalization hooks and the source-detection badge; (3) PDF-artifact repair with undoable reflow; (4) presets, removal-inventory, education panel, Markdown output, and the cross-sell handoff to the full cleaner.

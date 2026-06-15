# Bulk / Multi-File Cleaner

> Drag in a whole folder of .txt, .md, and .docx files, clean every one of them in your browser with the same grammar-aware rules, and download the lot as a ZIP - nothing ever leaves your machine. Tier: 2. Difficulty: Med. Runs: client-side (100% in-browser; no server, no LLM).

## 1. What it does
Lets a user drop multiple `.txt`, `.md`, and `.docx` files (or a folder) onto the page and runs the existing de-AI cleaning engine over each one locally. Plain-text and Markdown files are cleaned as strings; `.docx` files are unzipped in the browser, their `word/document.xml` text is cleaned in place, and the file is re-zipped so it stays a valid, formatting-preserving Word document. The user sees a per-file report (what was changed and how many of each artifact) and downloads either individual cleaned files or a single ZIP of all of them. The whole batch is processed on-device, which is the brand's load-bearing claim: dropping a folder of client manuscripts into a website is exactly the moment people fear an upload, so "it provably never leaves your browser" is the wedge.

## 2. Why users want it (demand & search)

**Target keywords (realistic):**
- `bulk text cleaner` / `clean multiple text files` - moderate volume, weak/underserved results.
- `docx em dash remover` / `remove em dashes from word document` - strong intent; today answered only by "open Word and Find/Replace" blog posts and single-paste tools.
- `batch remove invisible characters` / `bulk remove AI formatting` - emerging, low competition.
- `clean ai text multiple files` / `remove em dashes from multiple files` - long-tail, near-zero direct competition.
- `docx ai formatting remover` / `strip markdown from many files` - niche but high-intent.
- Secondary: `convert docx clean in browser`, `batch txt cleaner online`, `zip download cleaned files`.

**Demand/competition read:** The single-file em-dash/AI-cleaner space is crowded (convertcase.net, gptcleanup.com, aitextclean.com, gptclean.co.uk, iloveemdash.com), but **true batch/multi-file is an open gap**. GPT Clean Up explicitly states "Batch mode is coming soon… for now, you can run multiple single-document sessions" - i.e., the category leader admits it can't do this yet. Most competitors are paste-box only; the few that accept files (iloveemdash mentions `.txt`/`.docx`) still do one file at a time and rarely repack a valid `.docx`. So demand is moderate but the **supply is thin and the intent is high** (people with folders of files are doing real work, not idle curiosity).

**Who searches & when:** Someone who just had ChatGPT/Claude draft 20 blog posts, product descriptions, or chapters and now needs them all cleaned before handoff; an editor/VA handed a folder of `.docx` drafts; a dev with a directory of `.md` docs full of smart quotes and zero-width junk; a localization/ESL writer normalizing a content batch.

**Sources found in research:** `gptcleanup.com` (competitor admitting no batch yet), `convertcase.net`, `iloveemdash.com`, `aitextclean.com`, `gptclean.co.uk` (single-file competitors), `github.com/mwilliamson/mammoth.js`, `docxtemplater.com` + `npmjs.com/package/docxtemplater` (PizZip/docx editing), `learn.microsoft.com` (MS-DOCX / WordprocessingML `w:r`/`w:t` structure), `stuk.github.io/jszip`, `developer.mozilla.org` + `developer.chrome.com` (File System Access API).

## 3. Target users & use cases
- **Content marketers / agencies:** A batch of AI-drafted posts or product descriptions; clean em dashes, smart quotes, and invisible chars across all of them in one pass before CMS upload.
- **Editors / VAs / proofreaders:** Receive a folder of `.docx` drafts from writers; need consistent punctuation/whitespace without opening each in Word.
- **Authors / ghostwriters:** A manuscript split into per-chapter `.docx`/`.md` files; normalize quotes and dashes book-wide while preserving Word formatting.
- **Developers / technical writers:** A `docs/` directory of `.md` files with smart quotes, NBSP, and zero-width chars copied from chat tools; clean the whole tree and re-download.
- **ESL / non-native writers:** Normalize a set of documents to consistent straight quotes and standard punctuation.
- **Privacy-sensitive professionals (legal, medical, HR, academic):** Have confidential `.docx` files they will *not* upload to a server; the on-device guarantee is the only acceptable option.
- **Students:** A semester's worth of notes/essays exported from Notion/Docs/AI tools; bulk-strip markdown artifacts and hidden characters.

## 4. Features - core (MVP)
1. **Multi-file drop zone** accepting `.txt`, `.md`/`.markdown`, and `.docx`. Supports OS multi-select via `<input type="file" multiple>` and drag-drop of many files at once.
2. **Folder drop** (where supported): drag a folder in via the HTML Drag-and-Drop API (`DataTransferItem.getAsFileSystemHandle()` / `webkitGetAsEntry()`), recursively enumerating supported files and skipping the rest.
3. **Reuse of the existing `clean()` engine** from `src/lib/cleaner.ts` per file - identical rules and `CleanOptions` (smart dash handling, en dashes, smart→straight quotes, ellipsis, invisibles, whitespace, optional markdown stripping) so behavior matches the single-paste tool exactly.
4. **In-browser DOCX read + repack:** unzip the `.docx` with PizZip/JSZip, clean the text inside `word/document.xml` (and `header*.xml`/`footer*.xml`) **in place**, re-zip, and emit a still-valid `.docx`. Mammoth.js is used only for the *preview/diff* path, never for the output file (it is HTML-only and lossy).
5. **Per-file result table:** filename, status (cleaned / unchanged / skipped / error), total changes, and a breakdown of counts (em dashes, en dashes, smart quotes, ellipses, invisibles, NBSP, markdown) sourced from the engine's `CleanResult.counts`.
6. **Per-file download** (individual cleaned file) **and "Download all as ZIP"** via JSZip `generateAsync` + a saved Blob, preserving original filenames (optionally suffixed `-clean`).
7. **Shared options panel** applied to the whole batch, with the same defaults as the main tool (`DEFAULT_OPTIONS`), so a user sets rules once for the run.
8. **Aggregate summary:** "Cleaned 18 files · 412 changes · 0 errors" so the batch outcome is legible at a glance.
9. **Graceful per-file errors:** a corrupt or password-protected `.docx` fails only itself, with a clear reason, and the rest of the batch still completes and downloads.
10. **Hard file-type/size guardrails** with friendly messaging (unsupported type, empty file, oversized file).

## 5. Features - engagement & helpfulness (what makes users love it & stay)
1. **Live processing progress with per-file ticks.** A row appears the instant each file is added and flips to a green check as it finishes, with an overall progress bar ("12 / 20"). Batch jobs feel slow when silent; visible momentum keeps users from bailing and reassures them work is happening locally.
2. **Per-file expandable before/after diff.** Click any row to see exactly what changed in that file (reusing the existing `diff` dependency already in `package.json`). This is the brand's transparency promise applied at scale - users trust a bulk tool far more when they can spot-check that it didn't mangle their content.
3. **Aggregate score/insight strip.** A headline like "Removed 73 invisible characters and 138 em dashes across 20 files" turns a chore into a satisfying, quantified win and gives a shareable stat.
4. **One-click "Download all (ZIP)" and per-row download.** The single biggest convenience over every competitor: no re-pasting 20 times. One button, named ZIP (`cleaned-files-YYYY-MM-DD.zip`).
5. **Presets the whole batch inherits** ("Light touch" = quotes + invisibles only; "Standard"; "Aggressive" = adds markdown stripping). One click configures intent for a folder; presets save power users from re-toggling seven switches every run.
6. **"Try with samples" empty-state button.** Loads 2–3 demo files (a smart-quote-laden `.txt`, an em-dash-heavy `.md`, a messy `.docx`) so a first-time visitor sees the ZIP-download payoff in five seconds without hunting for their own files - huge for activation.
7. **Drag-anywhere drop with a full-page highlight overlay.** The entire viewport becomes the drop target on dragenter, with a dashed border and "Drop your files here" - forgiving target, no pixel-perfect aiming, especially nice on a trackpad.
8. **Skipped-file transparency, not silent dropping.** Unsupported files (e.g., `.pdf`, `.png`) show as "skipped - unsupported type" rather than vanishing, so users aren't left wondering whether all their files were processed.
9. **Re-run / remove-row controls and "Clear all."** Pull one file out, swap the preset, and re-run without re-dragging the whole batch. Treating the staged list as editable makes iteration painless.
10. **Privacy reassurance, made concrete.** A persistent "Files never leave your browser - works offline" badge, plus an optional **"Verify: go offline and it still works"** hint and a Network-tab callout. For the legal/medical/manuscript audience this is the deciding feature, not decoration.
11. **Inline "why this is a tell" education on hover.** Each count chip (em dash, NBSP, zero-width) has a tooltip explaining why AI text contains it and what the fix does - turns a utility into something users learn from and recommend.
12. **Keyboard shortcuts & full a11y.** `Ctrl/Cmd+O` to open the file picker, `Ctrl/Cmd+Enter` to run, `Ctrl/Cmd+S` to download the ZIP, focus-visible rows, and ARIA live-region announcements ("File 12 of 20 cleaned") so screen-reader and keyboard users get the same progress feedback as sighted users.
13. **Persistent option/preset memory (localStorage).** Remember the user's last preset and toggles (never the files or their content) so a returning editor's workflow is one drag away.
14. **Filename collision & naming control.** Choose suffix (`-clean`), overwrite-style names, or keep originals; preview the output filename per row. Prevents the "which file is which" confusion that kills trust in batch tools.
15. **Dark mode + responsive mobile layout.** Honor `prefers-color-scheme`; on mobile the table collapses to stacked cards and the ZIP button stays reachable, so the tool isn't desktop-only.
16. **"Copy report" / downloadable cleanup summary.** Export the per-file change table as a small `.csv`/`.txt` so an editor or VA can show a client exactly what was normalized - a stickiness and trust feature competitors don't offer.
17. **Non-blocking UI via a Web Worker.** Processing runs off the main thread so the page never freezes mid-batch; the user can scroll the report and read tooltips while files crunch - perceived quality that keeps people from force-closing the tab.

## 6. UX / UI notes
**Layout:** A large central drop zone above a results table. Left/top: a compact shared-options panel (presets + the seven toggles). The drop zone doubles as the file `<input>` trigger.

**Input/output model:** Files in → staged rows → "Clean all" → per-file results with download affordances + a sticky "Download all (ZIP)" action bar.

**States:**
- *Empty:* big dashed drop zone, supported-type hint ("`.txt` · `.md` · `.docx`"), a "Try with samples" button, and the privacy badge. No jargon.
- *Staged:* rows listed with detected type icons and sizes; "Clean all" enabled.
- *Processing:* overall progress bar + per-row spinners flipping to checks; UI stays interactive (Web Worker).
- *Result:* counts per file, aggregate summary, expandable diffs, download buttons. Errors shown inline on their own row with a plain-language reason.

**Microcopy tone:** Calm, plain, quality-framed ("Cleaned 18 files - your formatting and Word styling are preserved"). Never "beat the detector." Reinforce privacy without nagging.

**Mobile:** Table → stacked cards; full-width drop zone; persistent bottom "Download ZIP" bar. File picker works even where folder-drop doesn't.

**Accessibility (WCAG 2.2 AA):** Status conveyed by **icon + text + color**, never color alone (cleaned/unchanged/skipped/error each have a distinct icon and label). ARIA live region for progress. Full keyboard operation of drop/pick/run/download. Visible focus rings; sufficient contrast in both themes; respects `prefers-reduced-motion` (no spinner churn).

## 7. Technical implementation (client-side)

**Plain text / Markdown:** Read with `File.text()`, pass straight through the existing `clean(input, opts)` from `src/lib/cleaner.ts`. The engine already returns `{ text, counts }`, so the per-file report is free. Markdown stripping stays an opt-in toggle (off by default) so we don't destroy intentional `.md` syntax.

**DOCX read + repack (the hard part):** A `.docx` is a ZIP of XML (OPC/OOXML). The correct approach for *quality-preserving* output is to edit the XML in place, **not** to convert via mammoth (mammoth is HTML-only and lossy - fine for preview, wrong for the saved file).
- Unzip with **PizZip** (or JSZip) in the browser.
- Target `word/document.xml`, plus `word/header*.xml`, `word/footer*.xml`, and `word/footnotes.xml`/`endnotes.xml` if present.
- **Key edge case - text runs.** In WordprocessingML, paragraphs (`w:p`) contain runs (`w:r`), each containing text pieces (`w:t`). A single word or sentence is frequently **split across multiple runs** whenever formatting, spell-check ranges, or revision marks change mid-word. So a naive "replace `-` in the raw XML" mostly works for stray characters (an em dash usually sits inside one `w:t`), but **grammar-aware, cross-character replacements can break if the dash and its surrounding words straddle run boundaries.** Strategy: operate on the **text content of each `w:t` node independently** for character-level fixes (invisibles, NBSP, smart→straight quotes, ellipsis, `--`→em) - these are safe per-node. For the smart dash logic that needs neighboring-word context, reconstruct each paragraph's concatenated visible text, run the engine, then **diff and write the cleaned characters back into the corresponding `w:t` nodes** by offset (splitting/merging only when necessary). Preserve `xml:space="preserve"` on any `w:t` we touch so leading/trailing spaces aren't dropped by the XML serializer.
- Re-serialize the XML, write it back into the ZIP, and `JSZip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })`. Keep `[Content_Types].xml`, relationships, media, and styles untouched so the file opens cleanly in Word/Pages/Google Docs.

**ZIP output:** JSZip aggregates all cleaned blobs; `generateAsync` compresses off the UI thread, then trigger a download via an object-URL anchor (or `showSaveFilePicker()` where available, falling back to the anchor). FileSaver is optional.

**Folder / many-file intake:** `<input type="file" multiple>` always works. For folder drag-drop, use `DataTransferItem.getAsFileSystemHandle()` (Chromium) or `webkitGetAsEntry()` and recurse; gracefully degrade to the multi-select picker on Firefox/Safari, which don't expose local-disk directory pickers.

**Performance / large batches:** Run cleaning (and unzip/rezip) in a **Web Worker** to keep the UI responsive - transfer file `ArrayBuffer`s in, post progress out per file. Process files sequentially or in a small `Promise`-pool to bound memory; very large `.docx` (many MB of media) should stream/await rather than load everything at once. Cap individual file size and total batch size with a clear warning. String cleaning is regex-light and fast; the ZIP unpack/repack dominates DOCX cost.

**Library sizes/notes:** JSZip ~100KB min; PizZip is a lean JSZip fork suited to OOXML; mammoth ~150KB min (load **lazily**, only when a `.docx` preview is requested, so `.txt`/`.md` users never pay for it). Lazy-import all three so the page stays light. **Security:** mammoth does no sanitization - only ever render its HTML into a sandboxed/escaped diff view, never inject it raw.

**Privacy story:** Everything above is local - no `fetch`, no upload, no LLM. The DOCX repack and ZIP both happen in the worker. The tool works fully offline, which is the verifiable proof we surface in the UI.

## 8. Competitors & how we differentiate
- **gptcleanup.com / gptcleanuptools.com** - strong single-paste cleaners but **openly state batch mode is "coming soon"**; no multi-file, no ZIP. Direct gap we fill.
- **convertcase.net (Em Dash Remover)** - paste-box only; replace-with-hyphen default, no files, no privacy framing.
- **iloveemdash.com** - mentions `.txt`/`.docx` support but is single-file and doesn't repack a formatting-preserving `.docx` batch.
- **aitextclean.com / gptclean.co.uk** - single-paste invisible-char/dash strippers; no batch, no docx output.

**Our wedge:** (1) **True batch + ZIP** - drop a folder, get a folder back, which none of the above do today. (2) **Provable privacy** - confidential `.docx` files never upload, the exact opposite of server-side "humanizers"; works offline. (3) **Grammar-aware cleaning** - the same smart dash logic (semicolon for two clauses, not a blind comma-splice) applied across every file, vs competitors' naive find-replace. (4) **Formatting-preserving DOCX** - we repack a valid Word file, not a stripped HTML/text dump. (5) **Quality, not bypass** - "clean writing / keep your human voice," never "beat the detector," which also keeps us off detector-arms-race churn.

## 9. SEO & page structure
**Primary keyword:** `bulk text cleaner` (+ `docx em dash remover`).
**Secondary:** `clean multiple text files online`, `remove em dashes from word document`, `batch remove invisible characters`, `bulk remove AI formatting from files`, `docx ai formatting remover`, `clean docx in browser`.

**H1/H2 outline:**
- **H1:** Bulk Text & DOCX Cleaner - Clean Many Files at Once, Privately
- **H2:** Drop your files (`.txt`, `.md`, `.docx`)
- **H2:** What it cleans (em dashes, smart quotes, invisible characters, NBSP, ellipses, markdown)
- **H2:** Word `.docx` support - formatting preserved
- **H2:** 100% in your browser - files never uploaded
- **H2:** Download cleaned files or the whole batch as a ZIP
- **H2:** How it works (read → clean → repack → ZIP)
- **H2:** FAQ

**FAQ ideas:** Are my files uploaded anywhere? (No - fully in-browser; works offline.) Does it keep my Word formatting? (Yes - repacks a valid `.docx`.) How many files at once? Which formats? Why semicolons sometimes instead of commas? Does it strip my markdown? (Only if you turn it on.) What about password-protected/corrupt files? (Skipped with a reason; rest still process.)

**schema.org:** `WebApplication` (`applicationCategory: Utilities/BrowserApplication`, `offers` price `0`) + `FAQPage` for the FAQ. Breadcrumb to the tools hub.

**Internal links:** ← main Em Dash Remover (single paste); → Invisible / Watermark Character Inspector; → Before/After Diff Viewer; → Whitespace & Line-Break Reflow Fixer; → Paste-from-Word Formatting Cleaner. This page becomes the "I have files, not a paste" hub funneling to and from siblings.

## 10. Build effort & priority
**Effort:** Medium - the text path is near-free (reuses `clean()` and the `diff` dep already installed); the cost is the DOCX read/repack with correct `w:t`/run handling, the Web Worker plumbing, and folder-drop degradation across browsers. New runtime deps: **JSZip/PizZip** (required), **mammoth.js** (optional, lazy, preview-only). Estimate ~3–5 focused days for a credible v1, most of it on DOCX-run correctness and edge-case files.

**Dependencies on existing code:** Directly reuses `src/lib/cleaner.ts` (`clean`, `CleanOptions`, `DEFAULT_OPTIONS`, `CleanResult`) and the existing `diff` package; shares the options UI and presets with the main `Cleaner.astro`.

**Sequencing:** Ship the **Before/After Diff Viewer** and **Invisible / Watermark Character Inspector** (Tier 1) first - this tool reuses both their UI patterns. Build Bulk in two phases: **Phase 1** = `.txt`/`.md` multi-file + ZIP (fast, proves the batch UX, ships the underserved keyword) and **Phase 2** = `.docx` read/repack (the moat, but the riskier engineering). Gate Phase 2 behind solid run-boundary tests against real-world Word, Google Docs, and Pages exports before promoting it.

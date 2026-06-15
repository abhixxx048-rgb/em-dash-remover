# Sentence Splitter (one per line)

> Paste any text and get one clean sentence per line — abbreviation-aware, so "Dr.", "e.g.", "3.14" and quotes don't break in the wrong place — to audit your cadence and rhythm. Tier: 2. Difficulty: Med. Runs: client-side.

## 1. What it does

The Sentence Splitter takes a block of prose and rewrites it as one sentence per line. The hard part — and the whole reason to build a dedicated tool instead of a naive "split on period" — is doing this *correctly*: a period can mark the end of a sentence, an abbreviation (`Dr.`, `e.g.`, `U.S.`), a decimal (`3.14`, `$100.00`), an ellipsis, an initial (`J. R. R. Tolkien`), or a URL/email, and only one of those is a real boundary. On top of accurate segmentation, the tool layers a **cadence audit**: it shows each sentence's word count and length band so the writer can instantly see rhythm — runs of same-length sentences, a 60-word monster buried in a paragraph, or the robotic uniformity that is itself an AI tell. Everything runs locally in the browser; no text is uploaded.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**
- `sentence splitter` — the head term; moderate volume, owned by thin utility pages (`sentencesplitter.com`, `sentence-split.vercel.app`, `w3toolkit.com`). Easy to out-build on quality and accuracy.
- `split text into sentences` / `paragraph to sentences` — medium volume, medium competition; many tools here split naively on `.` and break on `Dr.`, which is our wedge.
- `one sentence per line` / `one sentence per line tool` — lower volume but very high intent; this is the exact phrase editors and the "one-sentence-per-line writing method" crowd use.
- `split paragraph into lines` / `paragraph to lines` — medium volume, utility intent.
- `sentence splitter online free` / `... no sign up` — our privacy + no-login angle wins.
- `abbreviation aware sentence splitter` / `sentence boundary detection online` — long-tail, near-zero competition, high intent from devs and writers burned by bad splitters.
- `sentence length checker` / `vary sentence length tool` — overlaps with the cadence-audit feature and pulls the writing-craft audience.

**Who searches and the moment they need it:** an editor doing a line-edit pass who wants to *see* a paragraph's rhythm at a glance; a writer following the popular "write one sentence per line" drafting method (Hieu Phay, line-editing guides) who needs to convert an existing draft into that format; a copywriter checking that sentences vary in length instead of marching in lockstep; a developer prepping text for a translation memory, TTS, flashcards, or per-sentence diffing who needs a reliable boundary list; a student or ESL writer checking each sentence makes one clear point; and our own returning user who just cleaned AI text and now wants to confirm the cadence reads human, not metronomic.

**Source domains found in research:** sentencesplitter.com, sentence-split.vercel.app, w3toolkit.com, webutility.io, onlinetexttools.com, sapling.ai (sentence_split utility), hieuphay.com (one-sentence-per-line method), black-anvil-books.com / kristencorrects.com / bubblecow.com (sentence rhythm & variation), github.com/diasks2/pragmatic_segmenter, developer.mozilla.org (Intl.Segmenter), web.dev (Intl.Segmenter Baseline), en.wikipedia.org (sentence boundary disambiguation).

## 3. Target users & use cases

- **Editors / line-editors** — convert a paragraph to one-per-line to audit rhythm, spot run-ons, and try reordering sentences before committing.
- **Writers using the one-sentence-per-line method** — reformat an existing draft into the working format they edit in.
- **Copywriters & UX writers** — verify sentence-length variation in landing copy and CTAs; catch three 8-word sentences in a row.
- **Content marketers / SEO writers** — break a post into sentences to scan for monotony and overlong sentences that hurt readability.
- **ESL / non-native writers** — check that each sentence is self-contained and makes one point.
- **Students** — audit essay flow; isolate each claim for revision.
- **Developers / data folk** — generate a reliable sentence list for translation memory, TTS scripts, embeddings, flashcard decks, or per-sentence diffs — without sending text to a server.
- **Our own returning users** — after the Em Dash Remover / AI-tell pass, confirm cadence isn't robotically uniform.

## 4. Features — core (MVP)

1. **Paste-or-type input box** with placeholder, an "Try an example" loader (a paragraph deliberately seeded with `Dr.`, `e.g.`, a decimal, and a quote so the accuracy is obvious), and live processing (debounced ~120 ms).
2. **Abbreviation-aware segmentation** — split on real sentence boundaries only. Correctly keep together: titles/abbreviations (`Mr.`, `Dr.`, `Prof.`, `Inc.`, `Ltd.`, `vs.`, `etc.`, `e.g.`, `i.e.`, `U.S.`, `Ph.D.`, `a.m.`/`p.m.`), single-letter initials (`J. K. Rowling`), decimals and currency (`3.14`, `$1,000.50`), ellipses (`…` and `. . .`), and URLs/emails.
3. **One sentence per line output** — each detected sentence on its own line, in a read-only result pane, preserving original casing and punctuation (trim leading/trailing whitespace only).
4. **Sentence count** — prominent "N sentences" headline.
5. **Per-line word count** — a small word-count badge at the end (or start) of each output line.
6. **Copy output** — one-click copy of the full one-per-line result to clipboard.
7. **Download as .txt** — save the result as a plain-text file (and optionally `.csv` with `sentence,wordcount` columns for the data crowd).
8. **Numbered lines toggle** — optionally prefix each line with `1.`, `2.` … for reference during editing.
9. **Preserve-paragraphs toggle** — keep a blank line between source paragraphs so structure isn't flattened (default on).
10. **Robust empty/edge handling** — graceful behavior on empty input, single fragments with no terminal punctuation, and giant pastes.

## 5. Features — engagement & helpfulness (what makes users love it & stay)

This is the heart of the tool. Each item is concrete and ships in v1 or v1.1.

1. **Live, debounced splitting as you type/paste** — the output, sentence count, and cadence bars update within ~120 ms of a keystroke. Why: instant feedback turns it from a one-shot utility into an editing surface people stay in.
2. **Cadence bars (sentence-length visualization)** — render each sentence as a horizontal bar whose length maps to its word count, stacked top-to-bottom. Why: this is the killer feature — rhythm becomes *visible*. A wall of identical bars screams "monotone / AI-uniform," a varied skyline reads human. Directly serves the editor/writer "vary your sentence length" need that competitors ignore.
3. **Length-band color coding** — tint each sentence by band: short (≤8 words), medium (9–20), long (21–35), very long (36+). Why: at a glance you find the 50-word run-on and the staccato runs. (Always paired with the numeric badge so it's never color-only — accessibility.)
4. **"Monotony / uniformity" meter** — a single score from the standard deviation of sentence lengths, with a plain label ("Varied ✓" vs "Uniform — vary your lengths"). Why: gamifies the edit; users chase variety, which keeps them revising. Doubles as a soft AI-tell signal (uniform cadence is a known tell) on-brand with the suite.
5. **Top stats strip** — sentences, words, avg words/sentence, longest sentence (length + jump link), shortest, % short / medium / long. Why: gives writers the exact numbers editors quote, and keeps the page useful before they even read the lines.
6. **Click-to-jump longest/shortest** — clicking "longest: 47 words" scrolls to and pulses that line. Why: turns the stat into an actionable to-do — the single most useful thing for a self-editor.
7. **"Why didn't this split?" inline hints** — when the engine keeps `Dr. Smith` or `3.14` together, an optional subtle marker explains it on hover ("kept together: abbreviation 'Dr.'"). Why: builds trust that the tool is *correct*, not broken — the #1 doubt users have about splitters — and teaches segmentation in context.
8. **Manual override controls** — if the splitter ever guesses wrong, let the user merge two lines (or split one) with a small inline ↑merge / ✂split control. Why: no segmenter is perfect; giving control turns a frustrating mis-split into a 1-click fix and a reason to trust the output.
9. **Custom abbreviation list** — a small editable field ("treat these as abbreviations too: `Fig.`, `Eq.`, `Approx.`") saved to localStorage. Why: power users in law, science, and academia have domain abbreviations; honoring them earns loyalty and repeat visits.
10. **One-click presets / output modes** — toggle chips: "Plain (one per line)", "Numbered", "CSV (sentence,words)", "Markdown list". Why: each preset matches a different downstream job (editing vs data vs docs) so the tool fits more workflows.
11. **Copy / Download / Share** — copy to clipboard, download `.txt`/`.csv`, and a "copy a shareable example" affordance. Toast confirmation on copy. Why: the terminal action of the task; frictionless export is what makes a utility feel finished.
12. **Before/after & re-join** — a "rejoin to paragraph" button that reverses the operation (one-per-line → flowing paragraph), and a toggle to view source vs split side by side. Why: closes the loop for the one-sentence-per-line drafting crowd who split, edit, then want their prose back. Can reuse the existing `diff` dependency for the side-by-side view.
13. **Keyboard shortcuts** — ⌘/Ctrl+Enter to split, ⌘/Ctrl+C-from-output to copy all, Esc to clear. Why: writers live on the keyboard; shortcuts make it feel like a real tool, not a toy.
14. **Empty-state guidance + example** — when blank, show a one-line "Paste text to split it into one sentence per line — abbreviations like Dr. and decimals stay intact" plus a "Load example" button. Why: removes the cold-start blank-page hesitation and immediately demonstrates the accuracy differentiator.
15. **Persistent preferences (localStorage)** — remember toggles (numbered, preserve paragraphs, output mode) and the custom abbreviation list across visits. Why: returning users skip re-setup; small thing, big stickiness.
16. **Dark mode + responsive cadence bars** — bars and badges reflow cleanly on mobile; honors system dark mode and the site theme. Why: matches the suite, and the visualization has to read well on a phone where a lot of pasting happens.
17. **Live word/character counter** in the input header, sticky on scroll. Why: highest-frequency thing writers want; keeps value visible during editing.

## 6. UX / UI notes

- **Layout:** two-pane on desktop (input left, one-per-line output right), stacked on mobile. The cadence-bar visualization sits beside or beneath the output lines so each bar aligns with its sentence. Top stats strip spans full width; toggle chips and output-mode selector live just above the output pane.
- **Input/output model:** input is editable; output is read-only (with optional inline merge/split controls). Splitting is live and debounced — no mandatory "Convert" button, though a visible Split button exists for keyboard/accessibility and the empty state.
- **States:** *Empty* — guidance line + "Load example" + the accuracy promise. *Processing* — for large pastes, a subtle "Splitting…" pill; never block typing. *Result* — stats strip, color-banded lines with word badges, cadence bars, monotony meter. *No boundaries found* — if input has no terminal punctuation, show the whole thing as one line with a gentle note ("No sentence endings detected — treated as one sentence").
- **Microcopy tone:** plain, craft-focused, confident — "See your rhythm," "Abbreviations stay intact," "Vary your lengths." Never detector/bypass language; this is a quality-and-clarity tool, on brand.
- **Mobile:** large tap targets for chips and copy/download; cadence bars scale to viewport width; horizontal scroll avoided. Copy and Download pinned in a sticky action bar.
- **Accessibility (WCAG 2.2 AA):** length bands and the monotony meter are *never* signaled by color alone — every band has a text/numeric label and bars carry an `aria-label` ("Sentence 3: 24 words, long"). Output pane is keyboard-navigable; focus-visible rings; respects `prefers-reduced-motion` (no pulse animation when set); contrast ≥ 4.5:1 in both themes.

## 7. Technical implementation (client-side)

**Primary engine — `Intl.Segmenter` with `granularity: 'sentence'`.** Now Baseline (April 2024) across Chrome, Firefox, Safari, Edge, so it's usable without a polyfill for current browsers; feature-detect with `typeof Intl.Segmenter !== 'undefined'`. It is UAX #29-based and locale-aware, and handles *some* cases well (it generally keeps decimals like `100.5` together). However — and this is the key caveat to design around — UAX #29 sentence breaking is intentionally **not abbreviation-aware**: the spec notes that plain text gives inadequate information to perfectly resolve `Dr.`-style cases, and `Intl.Segmenter` does **not** support sentence-break suppressions (the `ss` Unicode extension / CLDR suppression lists) in current implementations. So `Intl.Segmenter` alone will over-split on `Dr. Smith went home.` Treat it as the base tokenizer, then apply a **post-merge pass**.

**Post-merge / suppression layer (our differentiator):** after the base segmentation, re-join adjacent segments when the break was triggered by a known non-boundary period. Rules to implement:
- **Abbreviation list:** maintain a curated set (titles `Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St`, business `Inc|Ltd|Co|Corp`, latin `e\.g|i\.e|etc|vs|cf|al|viz`, units/time `a\.m|p\.m|No|vol|pp|Fig|Eq`, academic `Ph\.D|B\.A|M\.A|M\.D`, geographic `U\.S|U\.K`). If a segment ends with one of these (case-sensitive on the abbreviation token), merge with the next. Make the list user-extendable (localStorage).
- **Initials:** single uppercase letter + period (`^[A-Z]\.$` at segment end), e.g. `J. R. R. Tolkien` — merge forward.
- **Decimals / currency:** digit-period-digit (`\d\.\d`) — `Intl.Segmenter` mostly handles these, but keep a regex guard for `$100.00`, version numbers `v1.2.3`, and ratios.
- **Ellipses:** `…` and spaced `. . .` should not force a break unless followed by a capitalized new sentence; treat conservatively (keep together by default).
- **URLs / emails:** detect with a lightweight regex (`\bhttps?://\S+`, `\b[\w.+-]+@[\w-]+\.\w+`) and never split inside them.
- **Quotes:** keep terminal punctuation that belongs to the sentence — `"He left." She stayed.` splits, but `"Is it raining?" she asked.` keeps the dialogue tag attached. UAX #29 already handles much of the quote+terminator case; verify against the tricky tag-after-quote pattern.

**Fallback (no `Intl.Segmenter`):** a regex segmenter with the same suppression list — split on `[.!?]+["')\]]?\s+(?=[A-Z"'(\[])`, then run the same abbreviation/initial/decimal/URL merge pass. This keeps the tool working on older browsers with no network call.

**Library option:** if we want stronger out-of-the-box accuracy than DIY merging, **wink-nlp** does browser-side sentence boundary detection with no external deps and very high throughput (~650k tokens/sec), and **compromise** is a small English-only NLP lib good for browser bundle size. Both are heavier than the `Intl.Segmenter`+regex approach (tens to ~hundreds of KB). Recommendation: ship the lightweight `Intl.Segmenter` + suppression layer first (near-zero added bundle), and only pull in wink-nlp if accuracy testing demands it. The `pragmatic_segmenter` "golden rules" (52 English rules) are an excellent free **test corpus** to validate our merge logic against — including its "Holy Grail" case (Rule #18: `a.m./p.m.` followed by a capitalized proper noun).

**Edge cases & failure modes:** abbreviation at a *true* sentence end (`...the U.S. The next year...`) is genuinely ambiguous — accept occasional misses and expose the manual merge/split override (§5.8). Lists, headings, and code blocks pasted in can produce odd fragments — preserve-paragraphs mode plus "no terminal punctuation → one line" keeps these sane. Non-Latin scripts: `Intl.Segmenter` handles many locales; default to user locale, but our abbreviation list is English-centric (note this; it's fine for the English-writer target).

**Performance:** `Intl.Segmenter` + a single regex merge pass is O(n) and fine for typical pastes; for very large inputs (50k+ chars) run segmentation in a Web Worker or chunk by paragraph and debounce, so the UI never blocks. Cap or warn above ~200k chars.

**Privacy story:** 100% client-side — `Intl.Segmenter` is a built-in browser API and the merge logic is local JS. No fetch, no server, no LLM. This preserves the brand's provable-privacy hook; the page can state plainly that nothing is uploaded and the network tab proves it.

## 8. Competitors & how we differentiate

- **sentencesplitter.com** — paste, click convert, colored lines, export as .doc; donation-supported. No abbreviation handling disclosed, no live update, no cadence/stats. We win on accuracy, live feedback, and the rhythm visualization.
- **sentence-split.vercel.app** — clean, free, no sign-up, copy/download .txt. Minimal: no stats, no abbreviation guarantees, no cadence audit.
- **w3toolkit.com / webutility.io / onlinetexttools.com** — generic "split text" utilities, often **delimiter-based (split on `.`)**, which is exactly the naive approach that breaks on `Dr.` and `3.14`. Ad-heavy. Our abbreviation-aware engine is the differentiator.
- **sapling.ai sentence_split** — splits *and* simplifies (rewrites) sentences; that's an AI-rewrite product, not a privacy-first formatter, and it sends text to a server.
- **CoreNLP / pragmatic_segmenter / NLTK** — accurate but developer libraries, not a paste-and-go web tool for writers.

**Our wedge:** (1) **Accuracy** — abbreviation/decimal/quote-aware via `Intl.Segmenter` + suppression list, with "why didn't this split?" transparency and manual override; nobody in the consumer tier does this credibly. (2) **Cadence audit** — length bars + monotony meter reframe the tool as a *writing-quality* instrument, not just a formatter, pulling the writing-craft audience. (3) **Privacy** — 100% client-side vs server-side competitors. (4) **Consolidation** — it lives in a coherent suite (clean AI text → score readability → audit cadence) with shared UX, no ads, no login.

## 9. SEO & page structure

**Primary keyword:** `sentence splitter` / `split text into sentences`.
**Secondary:** `one sentence per line`, `paragraph to sentences`, `abbreviation aware sentence splitter`, `sentence length checker`, `vary sentence length`, `sentence splitter online free no sign up`.

**H1/H2 outline:**
- **H1:** Sentence Splitter — One Sentence Per Line (Abbreviation-Aware)
- H2: Split your text (the tool)
- H2: How it works (and why "Dr." and "3.14" don't break)
- H2: Audit your cadence — see your sentence rhythm
- H2: One sentence per line, the writer's editing method
- H2: Privacy — runs entirely in your browser
- H2: FAQ

**FAQ ideas (each = long-tail target):**
- "Why does a normal splitter break on 'Dr.' or 'e.g.'?"
- "How does this handle decimals, dates, and quotes?"
- "What is the one-sentence-per-line writing method?"
- "Does my text get uploaded anywhere?" (no)
- "Can I add my own abbreviations?" (yes, saved locally)
- "How do I turn one-per-line back into a paragraph?"
- "Why are uniform sentence lengths a sign of AI writing?"

**Schema.org:** `WebApplication` (applicationCategory: `UtilitiesApplication`, `offers` price 0) for the tool; `FAQPage` for the FAQ block; `BreadcrumbList` back to the tools hub.

**Internal links to sibling tools:** Readability / Grade-Level Scorer (sentence length feeds readability), Human-Voice AI-Tell Report (cadence uniformity as a tell), Read-Aloud Proofreader (sentence-by-sentence reading), Before/After Diff Viewer (per-sentence diffs), and the main Em Dash Remover. Add this page to the tools hub and cross-link from the readability and AI-tell pages.

## 10. Build effort & priority

**Effort: Medium (~2–3 days).** The base split is near-free (`Intl.Segmenter` is built in); the real work is the **suppression/merge layer** and validating it against the `pragmatic_segmenter` golden rules, plus the cadence visualization and the manual merge/split override UI.

**Dependencies on existing code:** reuses the suite's input/output shell, copy/download, theming, and the existing `diff` package for the optional side-by-side/rejoin view. No new heavy dependency required for v1 (defer wink-nlp unless accuracy testing demands it). The abbreviation list can be shared with any future tokenizer needs in `src/lib`.

**Recommended sequencing:**
1. v1 — `Intl.Segmenter` + regex fallback + suppression list, one-per-line output, sentence/word counts, copy/download, example loader, empty state.
2. v1.1 — cadence bars, length-band coloring, monotony meter, top stats strip, click-to-jump.
3. v1.2 — manual merge/split override, custom abbreviation list (localStorage), output-mode presets (numbered/CSV/markdown), rejoin-to-paragraph, keyboard shortcuts.

Good Tier-2 candidate to build right after the Readability Scorer, since the two share the "sentence + length" mental model and cross-link naturally; the cadence-audit angle also feeds the AI-tell narrative that anchors the whole suite.

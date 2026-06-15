# Human-Voice / AI-Tell Report

> Paste any draft and get a non-destructive, line-by-line report of what makes it read like AI - sentence-cadence/burstiness, structural patterns ("not X but Y", rule-of-three, repeated openers), hedging/sycophancy/filler, and a GPT-word dictionary with human swaps - so you fix it in your own voice. Tier: 2. Difficulty: Med. Runs: client-side.

## 1. What it does

The Human-Voice / AI-Tell Report reads a draft and surfaces every structural and lexical "tell" that makes prose feel machine-written, without changing a single character. It scores burstiness (sentence-length variation), flags the cadence patterns AI overuses - negative parallelism ("It's not X, it's Y"), tricolons / rule-of-three, repeated sentence openers and metronomic transitions - and detects hedging, sycophancy, and filler preambles, all rendered as inline highlights plus a navigable findings list. For vocabulary, it runs a curated GPT-word dictionary and, for each hit, offers concrete human-sounding swaps. The framing is explicitly guidance-for-quality ("keep your human voice"), not auto-rewrite and not "beat the detector" - the writer makes every edit.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**
- `why does my writing sound like AI` / `why does my text sound like ChatGPT` - rising, high-intent, surprisingly under-served by tools (mostly blog posts, not interactive checkers). Our strongest wedge.
- `AI writing tells` / `signs of AI writing` - high volume, content-heavy SERP (Wikipedia "Signs of AI writing", supercarblondie, Medium); thin on interactive tools to own.
- `ChatGPT words to avoid` / `overused AI words list` - very high, evergreen, but dominated by static listicles (alstonantony 300+ list, Walter Writes, Plus AI); an interactive checker that highlights them in *your* text out-builds a list.
- `burstiness checker` / `sentence variety analyzer` / `perplexity and burstiness` - medium volume, education-led demand (QuillBot, Leap AI, GPTZero glossary); few free standalone analyzers.
- `not just but pattern AI` / `rule of three AI writing` - long-tail, low competition (GPTZero rule-of-three article), strong intent, easy to rank.
- `hedging phrases checker` / `filler words checker` / `"it's important to note"` - long-tail, low competition, pairs with weasel-word demand.
- `make my writing sound human` / `human voice checker` (note: NOT framed as a humanizer/bypass tool) - adjacent to the huge humanizer market without competing on detector-evasion.

**Who searches and the moment they need it:** someone who just drafted with ChatGPT/Claude/Gemini and feels it "sounds off" before sending; a student told their essay "reads like AI" who wants to know *which sentences*; a content marketer auditing a post for brand voice; an editor triaging a batch of AI-assisted drafts; an ESL writer who suspects their tool-polished text became unnaturally ornate; and our own returning users who cleaned punctuation on the main tool and now want a deeper structural read.

**Source domains found in research:** en.wikipedia.org (Wikipedia:Signs of AI writing), gptzero.me (rule-of-three; burstiness glossary), quillbot.com (burstiness & perplexity), tryleap.ai (perplexity vs burstiness), alstonantony.com / walterwrites.ai / plusai.com (overused ChatGPT word lists), supercarblondie.com and medium.com (dead-giveaway lists), github.com/conorbronsdon/avoid-ai-writing (filler/hedging skill), descript.com (AI sycophancy), passed.ai (transition-words detector).

## 3. Target users & use cases

- **Students / academics** - paste an essay flagged as "AI-sounding" and get a concrete punch-list (this opener repeats, these three sentences are all 22 words, "delve" appears 4x) to revise in their own words before submitting.
- **Content marketers & SEO writers** - audit AI-assisted blog drafts for brand voice; strip the metronomic "Moreover… Furthermore… In conclusion" cadence; catch puffery before publishing.
- **Copywriters & UX writers** - kill filler preambles and sycophantic openers in microcopy; tighten cadence so a CTA block reads human.
- **Editors / managing editors** - triage a queue of AI-assisted submissions; the findings list becomes a markup pass they hand back to writers.
- **ESL / non-native writers** - see when a polishing tool over-inflated their prose (tapestry, paramount, multifaceted) and learn plainer swaps.
- **Ghostwriters & freelancers** - prove and protect a client's voice; show before/after cadence as a deliverable.
- **Newsletter / Substack writers** - break the "rule of three" and opener repetition that flatten personal voice.
- **Our own returning users** - after cleaning em dashes/quotes/invisibles on the main tool, run the structural report as the deeper "does this still sound like me?" check.

## 4. Features - core (MVP)

1. **Paste-or-type input with live, non-destructive analysis** - the input text is never mutated; all output is an overlay/derived view. "Try an example" loads an obviously AI-flavored sample so the report populates in one click.
2. **Headline human-voice read** - one prominent, plainly-labeled gauge ("Reads fairly human" → "Reads heavily AI") derived from the existing weighted tell density, plus a one-line plain verdict. Reuse the `scan()` score/band from `src/lib/ai-tells.ts` (0–100, `human`/`some`/`heavy`).
3. **Burstiness / sentence-cadence chart** - a bar/sparkline of every sentence's word count, with the mean line and the coefficient of variation (CV) shown; low CV (<0.4) is called out as "uniform cadence." Reuse and surface the existing `burstiness()` helper (currently it only emits a single flag - promote it to a full chart + per-sentence array).
4. **Structural pattern flags with inline highlights:**
   - **Negative parallelism / "not X but Y"** - reuse the `parallelism` phrase group ("It's not just… it's…", "not only… but also…").
   - **Rule-of-three / tricolons** - extend the existing `\bX, Y, and Z\b` list detector to also catch triadic clauses and three-adjective stacks; flag clusters, not single instances.
   - **Repeated sentence openers** - NEW: tokenize the first 1–3 words of each sentence/paragraph and flag repeats (e.g., three paragraphs opening "Moreover/Furthermore/Additionally", or many sentences opening "This/It/There is").
   - **Metronomic transitions** - surface the existing `AI_TRANSITIONS` density check as an explicit per-opener finding.
5. **Hedging / sycophancy / filler-preamble detectors** - reuse `hedging`, `cta`, and `opener` phrase groups; add a **sycophancy** group (prompt-restatement and flattery openers: "That's a great question", "You're absolutely right", "I'd be happy to", "Certainly!", "Great point") drawn from the sycophancy research.
6. **GPT-word dictionary with human swaps** - reuse `AI_WORDS_STRONG` / `AI_WORDS_SOFT`, but attach a curated swap map (e.g., delve→look at/dig into; utilize→use; leverage→use; robust→strong/reliable; tapestry→mix; paramount→key; navigate→handle/deal with; foster→encourage; underscore→show). Strong words flag at any count; soft words are density-gated.
7. **Inline highlight surface** - every finding paints a colored, hoverable span in a read-only render of the text, color-coded by category (cadence / structure / hedging / vocabulary), never color-only (see §6).
8. **Findings list with jump-to** - a grouped, ranked sidebar of all findings; clicking one scrolls to and pulses the span in the text.
9. **Robust tokenizer** - sentence splitter respecting abbreviations (Mr., Dr., e.g., U.S.), decimals, ellipses, URLs; paragraph splitter for opener-repetition; word counter ignoring stray punctuation. Shared with the readability tool's tokenizer.
10. **Edge handling** - under ~5 sentences, suppress burstiness/CV ("add more text for a reliable cadence read") rather than printing a junk number; never show a binary "AI/human" verdict - always a graded score with the disclaimer "no single tell is conclusive."

## 5. Features - engagement & helpfulness (what makes users love it & stay)

This is the heart of the tool. Each item is concrete and shippable; the goal is to turn a one-off check into a sticky, educational editing loop.

1. **Live, debounced re-scan as you edit** - every highlight, the cadence chart, and the human-voice gauge update within ~120 ms of a keystroke. Why: editing in place and watching the score drop turns a static report into a tight feedback loop; users stay to "chase the number" down sentence by sentence.
2. **Animated human-voice gauge with a moving needle** - a color-banded arc (green "sounds like you" → red "sounds like a model") whose needle visibly slides as the text improves. Why: gamifies revision; the small dopamine hit of watching the needle move keeps people fixing one more tell.
3. **Burstiness chart you can hover and click** - each bar is a sentence; hovering shows its word count and grade, clicking scrolls to it. A flat skyline literally *looks* robotic, which teaches the concept instantly. Why: makes an abstract statistic visual and actionable - the single most "aha" element of the tool.
4. **Per-finding "why this is a tell" explainer** - every highlight and list item expands to a one- to two-line, plain-English reason ("Three paragraphs in a row open with a transition word - humans vary or drop these") with a cited source label. Why: education in context converts a scolding into a lesson; users self-correct on future drafts and trust the tool because it shows its reasoning.
5. **One-click human swaps for vocabulary hits** - click a flagged GPT-word and a small popover offers 2–3 plainer alternatives; choosing one inserts it into the editable copy (this is the *only* place the tool edits, and only on explicit click). Why: removes the "okay, but what do I write instead?" gap that static word-lists never close - the highest-value helpfulness touch.
6. **Findings grouped, counted, and ranked into a punch-list** - a sidebar like "Cadence (3) · Structure (5) · Hedging (2) · Vocabulary (8)", each item jump-to-able and dismissable with a check. Why: turns a vague "sounds like AI" into a finite to-do list a writer can actually finish; checking items off is satisfying and sticky.
7. **Before/after compare snapshot** - snapshot a baseline, edit, and see deltas ("Human-voice 38→71 ▲; uniform-cadence flag cleared; 'delve' ×4 → 0; openers de-duped"). Why: makes improvement visible and rewarding, and reinforces our provable-transparency brand; reuse the existing `diff` dependency.
8. **"Try an example" with multiple flavored samples** - toggle between a heavy-AI sample (puffery + tricolons + metronomic transitions), a subtle one, and a clean human sample so the empty state demonstrates every detector at once. Why: solves the blank-canvas problem and shows the tool's value before the user risks their own text; the clean sample proves we don't cry wolf.
9. **Tell-density heat strip / minimap** - a thin vertical bar beside the text shows where findings cluster, so on a long draft you jump straight to the worst paragraph. Why: scannability on long documents; respects an editor's time.
10. **Copy / download / share the report** - "Copy report summary" (a clean text/markdown block of all findings + scores), "Download report (.md)", and "Copy edited text back." Why: writers paste audits into briefs, Slack, and client deliverables; sharing seeds inbound links and word-of-mouth, and the markdown export is a ready-made editing checklist.
11. **Category toggles + highlight legend** - turn any detector layer on/off (e.g., hide vocabulary to focus on cadence) with a persistent legend; includes a "distraction-free reading" off switch. Why: different workflows need different lenses; control lowers overwhelm on a heavily-flagged draft.
12. **Save to localStorage (last session + preferences)** - auto-restore the last analyzed text, chosen toggles, dismissed findings, and theme. Why: zero-friction return without re-pasting, and it costs no server - a literal expression of the privacy brand.
13. **Keyboard shortcuts** - `[` / `]` to jump between findings, `Cmd/Ctrl+Enter` to re-scan, `Esc` to clear, `x` to dismiss the focused finding. Why: editors running many drafts move materially faster and stick.
14. **Plain-language top-line verdict** - one human sentence above the gauge ("This reads fairly AI - mostly from uniform sentence length and four 'delve'/'underscore' hits; vary cadence and swap those and it'll sound like you"). Why: most users don't know what a 38/100 *means*; the verdict tells them the two things to fix first.
15. **Tooltips + glossary on every term** - `(?)` tooltips define burstiness, perplexity (explained, not computed locally), tricolon, hedging, sycophancy, with a one-line "ideal range" where relevant. Why: turns first-time confusion into a mini-lesson and earns long-tail SEO for each concept.
16. **Empty-state guidance** - a friendly prompt, the example buttons, and a 3-bullet "what we check" preview so users know the value before pasting. Why: lowers bounce on the most fragile moment (the blank page).
17. **Dark mode + responsive, accessible, screen-reader-announced scores** - follows system theme, persists choice, full keyboard nav, ARIA live-region announcing gauge/score changes. Why: writers work at night and on phones; accessibility is on-brand for a clarity tool and widens reach.
18. **Cross-tool nudges** - contextual links: "Lots of em dashes flagged → clean them on the main tool", "These sentences score hard → run the Readability Scorer", "Want one-per-line to audit cadence by hand → Sentence Splitter." Why: routes traffic across the suite and makes the report a hub, not a dead end.

## 6. UX / UI notes

- **Layout:** Two-zone, responsive. Left/top: a large read-only (but copy-back-editable) render of the text that serves as the highlight surface, with a thin tell-density minimap on its edge. Right/bottom (stacks on mobile): a results rail with the human-voice gauge + verdict, the burstiness chart, category toggles/legend, and the grouped findings punch-list. The editable input lives behind the highlight layer (transparent textarea over a styled mirror, or a contenteditable) so highlights stay aligned as the user types.
- **Input/output model:** single source of truth = the input text; the report is fully derived and live; no "Analyze" button required (but provide one for explicit re-run / accessibility). The only mutation path is explicit user actions: accepting a vocabulary swap, or "copy edited text back."
- **States:**
  - *Empty:* friendly prompt, multiple "Try an example" buttons, a 3-bullet "what we check," gauge at a neutral resting position.
  - *Processing:* for large pastes, a subtle "Analyzing…" shimmer on the rail; never block typing.
  - *Result:* gauge animates in, verdict renders, chart draws, highlights paint, punch-list populates with counts.
  - *Too-short / low-signal:* suppress burstiness and soften vocabulary gating; show "Add more text for a reliable cadence read."
  - *Clean text:* celebrate it ("Reads human - no strong tells found") so the tool is trusted not to over-flag.
- **Microcopy tone:** plain, encouraging, non-judgmental, quality-framed - "Here's where it sounds like a model" and "keep your human voice," never "bad writing" and never "beat the detector." Always pair a flag with a constructive next step.
- **Mobile:** rail collapses under the text; findings become an accordion; chart scrolls horizontally; swap popovers anchor as a bottom sheet; tap targets ≥44px.
- **Accessibility (WCAG 2.1 AA):** no color-only signals - every highlight carries an icon/underline-style + an accessible name; findings list is fully usable without the visual highlights; score changes announced via `aria-live="polite"`; full keyboard operation; contrast-checked bands; respects `prefers-reduced-motion` (gauge/chart animate only if allowed).

## 7. Technical implementation (client-side)

**Reuse the existing engine.** `src/lib/ai-tells.ts` already ships the core: `AI_WORDS_STRONG`, `AI_WORDS_SOFT`, `AI_TRANSITIONS`, the `PHRASE_GROUPS` regexes (parallelism, puffery, hedging, conclusion, cta, opener, participle), the `burstiness()` CV helper, the rule-of-three regex, and `scan()` producing a weighted 0–100 score + band. This tool is primarily a **non-destructive report UI** on top of that library plus three additions:

1. **Promote burstiness to a full series.** `burstiness()` currently returns only `{cv, sentences}`. Add a sibling that returns the per-sentence word-count array (and sentence offsets) so the chart and per-bar jump-to can render. CV bands: <0.4 uniform/AI-leaning, 0.4–0.7 normal, >0.7 bursty/human-leaning (corroborating only - never conclusive).
2. **Add opener-repetition detection.** Split into sentences and paragraphs; take the first 1–3 normalized tokens of each; count repeats and flag (a) ≥3 paragraphs sharing a transition opener, (b) a high share of sentences opening with the same word ("This/It/There"). Pure string work, O(n).
3. **Add a sycophancy phrase group + a vocabulary→swap map.** New regex group for flattery/prompt-restatement openers; a `Record<string, string[]>` mapping each GPT-word to 2–3 human swaps surfaced in the popover.

**Highlighting / offsets.** To paint inline, the scanner must return character offsets, not just counts. Run each regex with the `g` flag and capture `match.index`/length; for word-list hits, build `\b…\b` regexes and record spans. Merge/sort spans, resolve overlaps by category priority (structure > vocabulary), and render a mirrored layer. Keep the mirror and textarea fonts/metrics identical so spans align.

**Unicode / regex notes.** Sentence splitting via `/(?<=[.!?])\s+/` is the existing approach; harden with an abbreviation guard list to avoid splitting "U.S." / "e.g.". Use `\p{L}` (with the `u` flag) for word tokenization so accented/ESL text counts correctly. Em-dash/curly/invisible detection already uses explicit code points (U+2014, U+2018–U+201D, zero-width range U+200B–U+200F, U+2060, U+FEFF, U+00AD, U+202F) - reuse verbatim.

**Performance.** All detectors are linear scans over the text; the cost is N regexes × text length. For typical drafts (<10k words) this is sub-frame. For large pastes: debounce (~120 ms), cap live highlighting to the visible viewport + a window, and compute the full report off the main thread in a **Web Worker** if a paste exceeds ~20k words (the worker posts back findings + offsets). No external network, so the worker keeps the UI responsive without touching the privacy story.

**Suggested libraries (keep the bundle lean):** none required for detection - it's vanilla regex + arrays. For the chart, hand-rolled SVG/`<canvas>` bars (no charting dependency; a chart lib would dwarf the logic). Reuse the existing `diff` dependency for the before/after compare. Optional `Intl.Segmenter` (built into modern browsers, zero bundle cost) as a more robust sentence/word segmenter with graceful fallback to the regex splitter.

**Edge cases & failure modes:** code blocks / quoted text (offer a "ignore quoted blocks" toggle so quoting an AI sample doesn't self-flag); lists and tables (a bulleted list legitimately has uniform short "sentences" - exclude list items from burstiness); non-English text (gate or note that word/phrase lists are English-tuned); very short text (suppress statistical flags); deliberate stylistic tricolons (always show as "consider", never "wrong"). Cap examples per finding to avoid huge DOMs.

**Privacy story (the brand hook):** everything - tokenizing, regex, scoring, chart, swaps, localStorage - runs in the browser; zero network calls; perplexity is *explained* in the glossary but **not** computed (true perplexity needs a language model; we deliberately don't ship one or call one, and we say so). This is a genuine differentiator versus humanizers that POST your draft to a server. If we ever add an optional perplexity estimate, it should be the on-device Chrome built-in / WebLLM path covered in the Tier-3 roadmap, never a server call - and it must be opt-in with the privacy promise preserved.

## 8. Competitors & how we differentiate

- **AI humanizers (Walter Writes, Decopy.ai, Phrasly, HCODX, Humaniser, QuillBot humanizer)** - these *rewrite to bypass detectors* and usually upload your text to a server. Weaknesses: server-side (no privacy), opaque rewrites that flatten voice, and an explicit detector-evasion framing that's reputationally and increasingly platform-risky. **Our wedge:** non-destructive, guidance-only, on-device, quality-framed - we tell you *what* and *why*, you keep authorship.
- **Multi-detector dashboards (Originality.ai, GPTZero, ZeroGPT, Sapling)** - give a probability/verdict but little actionable, sentence-level "fix this" guidance, and most gate behind signup/credits. **Our wedge:** no verdict-theater, no login; an editable punch-list with human swaps and a live cadence chart.
- **Static word-list articles (alstonantony "300+", Walter Writes, Plus AI, supercarblondie, Wikipedia "Signs of AI writing")** - high-ranking but inert; you can't run *your* text through a blog post. **Our wedge:** the same canonical lists, but interactive, highlighted in your draft, with one-click swaps.
- **Burstiness explainers (QuillBot, Leap AI, GPTZero glossary)** - educational only; rarely a free standalone analyzer that charts *your* sentences. **Our wedge:** an actual interactive burstiness chart, free, no signup.
- **Hemingway / Grammarly** - adjacent (readability, passive voice, tone) but not built around the 2026 AI-tell taxonomy and not privacy-first. **Our wedge:** purpose-built for AI-tells, fully local, and one node in a consolidated cleaning suite.

**Consolidated positioning:** the only privacy-first, grammar-aware, non-destructive *AI-tell report* that explains every flag and hands you human swaps - part of a suite, framed around quality and keeping your voice, not gaming a detector.

## 9. SEO & page structure

- **Primary keyword:** `why does my writing sound like AI` (+ `AI writing tells` / `signs of AI writing`).
- **Secondary:** `ChatGPT words to avoid`, `overused AI words`, `burstiness checker`, `sentence variety analyzer`, `rule of three AI writing`, `not just but pattern`, `hedging phrases checker`, `AI filler words`, `make my writing sound human`.
- **H1:** "Human-Voice / AI-Tell Report - see why your writing sounds like AI (and fix it)."
- **H2 outline:** What counts as an "AI tell"? · Sentence cadence & burstiness, explained · The "not X but Y" pattern · Rule-of-three / tricolons · Repeated openers & metronomic transitions · Hedging, sycophancy & filler preambles · The GPT-word dictionary (with human swaps) · How the report works (100% in your browser) · Quality, not detector-bypass · FAQ.
- **FAQ ideas (FAQPage schema):** "Why does my text sound like ChatGPT?"; "What is burstiness?"; "Is this an AI detector / will it bypass detectors?" (answer: no - guidance for quality, nothing is uploaded); "What words should I avoid?"; "Does my text get uploaded?" (no); "What's the rule of three?"; "How accurate is it?" (no single tell is conclusive; it's a graded guide).
- **schema.org:** `SoftwareApplication` (WebApplication, free, browser) for the tool + `FAQPage` for the FAQ + `BreadcrumbList` back to the tool hub.
- **Internal links (sibling tools):** Readability / Grade-Level Scorer (hard sentences), Passive-Voice & Weasel-Word Highlighter (overlapping lexical flags), Sentence Splitter (manual cadence audit), Before/After Diff Viewer (verify edits), Emoji & Decorative-Symbol Stripper and the main Em Dash Remover (clean the punctuation/formatting tells this report surfaces). The report is the natural hub linking *into* the destructive cleaners.

## 10. Build effort & priority

- **Effort:** Medium. The detection engine largely exists (`src/lib/ai-tells.ts`), so the work is (a) **offset-aware** versions of the existing matchers for inline highlighting, (b) the **burstiness series + SVG chart**, (c) **opener-repetition** + **sycophancy** detectors and the **swap map**, and (d) the report UI (gauge, punch-list, minimap, compare, toggles, popovers). Roughly 1.5–2.5 weeks for a polished v1, most of it front-end.
- **Dependencies on existing code:** reuses `ai-tells.ts` (word lists, phrase groups, `burstiness()`, `scan()` score/band) and the shared tokenizer/stats; reuses the `diff` dependency for compare; shares the Astro page shell, dark-mode, and localStorage patterns from the other tool pages. The main refactor is having the scanner emit character offsets, which the current count-only API doesn't - do this once and the Passive-Voice highlighter can share it.
- **Sequencing:** Build after the Tier-1 evergreen pages (Invisible-Char Inspector, Word Counter, Readability Scorer, Diff Viewer) have established the tool-hub and internal-link graph, then ship this as the flagship Tier-2 quality differentiator - it's the purest expression of "clean AI writing for real quality / keep your human voice." Ship the offset-aware matcher refactor and burstiness chart first (they unblock both this tool and the Passive-Voice highlighter), then layer the engagement features (swaps, compare, punch-list) in v1.1.

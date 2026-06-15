# Passive-Voice & Weasel-Word Highlighter

> Paste your draft and instantly see every passive construction, weak -ly adverb, and vague "studies suggest" hedge highlighted in place — with live counts and one-click explanations, 100% in your browser. Tier: 2. Difficulty: Med. Runs: client-side.

## 1. What it does

The Passive-Voice & Weasel-Word Highlighter scans pasted prose and paints three classes of weak writing directly onto the text: passive voice (be-verb + past participle, e.g. "was written"), -ly adverbs that usually weaken a verb ("really", "very", "quickly"), and weasel words / vague attributions — qualifiers and hedges like "studies suggest", "many experts", "it could be argued", "fairly", "several". Each match gets an inline color highlight, a hover explanation of *why* it's a tell, and a running counter so the writer can drive each number toward zero. It is a Hemingway-style read-and-revise tool — analysis only, never auto-rewrite — and runs entirely in JavaScript with no upload, no signup, and no server, keeping the privacy promise that anchors the brand. The framing is quality and a stronger human voice, not "beat the detector."

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**
- `passive voice checker` / `passive voice detector` — high evergreen volume, the anchor term; competitive (Grammarly, Hemingway, Originality.ai, Rephrasely own the top), but most rivals gate behind login or paid plans, which is our wedge.
- `passive voice highlighter` / `highlight passive voice online` — medium volume, strong intent, fewer dedicated pages — winnable.
- `weasel words checker` / `weasel word finder` — low-to-medium volume, low competition (editsaurus, write-good are dev-tooling, not polished web pages); easy long-tail win.
- `adverb checker` / `find adverbs in my writing` / `-ly adverb finder` — medium volume, thin competition, perfect anchored sub-section.
- `passive voice checker free no signup` / `hemingway alternative free` — our privacy + no-login angle wins outright.
- `studies suggest weasel word` / `hedging words list` / `vague attribution checker` — informational long-tail that feeds the FAQ and earns featured snippets.
- `passive vs active voice percentage` — intent for the score meter; pairs with our percentage readout.

**Who searches and the moment they need it:** a student finishing an essay whose professor said "too passive"; a marketer or SEO tightening a blog draft so it reads punchy; a UX/technical writer killing hedge words in docs; a novelist or self-publisher running a Hemingway-style pass; an academic told to cut weasel words from a paper's claims; an ESL writer who over-relies on "very/really/quite"; and our own returning users who just cleaned AI text on the main tool and want to confirm the result now sounds confident and human, since LLM output is notoriously hedge-heavy ("it is important to note", "studies suggest").

**Source domains found in research:** github.com/btford/write-good (and its `weasel-words`, `passive-voice`, `adverb-where` npm packages), github.com/retextjs/retext-passive, hemingwayapp.com (and the freecodecamp.org reverse-engineering writeup), datayze.com/passive-voice-detector, originality.ai/blog/passive-voice-checker, rephrasely.com, en.wikipedia.org/wiki/Weasel_word, github.com/tylerwalters/editsaurus.

## 3. Target users & use cases

- **Students / academics** — clear a "too passive" or "too vague" note before submitting an essay, thesis, or grant; tighten claims so "studies suggest" becomes "Smith (2021) found".
- **Content marketers & SEO writers** — make posts read active and confident; cut hedge words that dilute authority and CTAs.
- **Copywriters & UX writers** — strip "very/really/just/simply" from microcopy and landing pages; punch up product claims.
- **Technical writers** — enforce active voice and de-weaseled instructions in docs and runbooks (the exact audience write-good and retext serve, but without a CLI).
- **Novelists & self-publishers** — run a classic Hemingway-style adverb-and-passive sweep on a manuscript chapter.
- **Researchers / scientists** — surface hedging and vague attribution flagged in peer review ("it is thought", "evidence suggests").
- **ESL / non-native writers** — learn which qualifiers and adverbs weaken English prose, with in-context explanations.
- **Editors** — triage a long piece by jumping straight to the densest clusters of flags.
- **Our own returning users** — confirm cleaned AI text no longer hedges ("it's important to note", "as an AI") or leans passive, completing the clean-then-verify loop.

## 4. Features — core (MVP)

1. **Paste-or-type input** with placeholder and a "Try an example" loader; analysis runs live (debounced ~120 ms) as the user types or pastes.
2. **Inline highlight overlay** — a transparent, scroll-synced highlight layer rendered behind/over a textarea (the proven Hemingway/CodeMirror pattern), so flagged spans get colored backgrounds while the text stays fully editable.
3. **Three distinct, non-color-only categories:**
   - **Passive voice** — be-verb (`am, are, were, being, is, been, was, be`) followed by a past participle (`\w+ed` or a curated irregular-participle list: *written, broken, taken, given, done, made, seen, known, …*). Mirrors write-good's `passive-voice` and Hemingway's logic.
   - **-ly adverbs** — words ending in `ly` that are real adverbs (matched against an adverb stem list, not naive `/ly$/`, to exclude *apply, Italy, only, family, reply, supply, ugly, rely*).
   - **Weasel words / vague attributions** — qualifiers and hedges (*clearly, very, really, quite, fairly, several, many, various, significantly, substantially, remarkably, surprisingly*) plus multi-word vague attributions (*studies suggest, experts say, it is thought, it could be argued, many people believe, evidence suggests, some say*).
4. **Live counters per category** — "Passive: 7 · Adverbs: 12 · Weasel: 5" updating on every edit.
5. **Passive-voice percentage** — passive sentences ÷ total sentences, with the widely cited guidance band (aim under ~5–10%), matching what Rephrasely/Originality surface.
6. **Per-flag tooltip / popover** — hover or tap any highlight to see the category, the matched phrase, a one-line "why this weakens your writing," and a suggested fix pattern (e.g. passive → "name the actor: who *wrote* it?").
7. **Category toggles** — checkboxes to show/hide each of the three highlight types independently (write-good's `--no-weasel` / `--no-adverb` model), so a user hunting only passive voice isn't distracted.
8. **"too many / too few" and exception handling** — don't flag whitelisted exceptions (e.g. allow "too many", skip "indeed", skip non-adverb -ly words), matching the reference packages to keep false-positive noise low.
9. **Robust tokenizer** — sentence splitter that respects abbreviations (Mr., Dr., e.g., U.S.), decimals, ellipses, and URLs; word matching over Unicode-aware boundaries so smart-quote/em-dash-laden pasted AI text tokenizes correctly.
10. **Empty / no-issues states** — friendly empty state with example button; a celebratory "No passive voice or weasel words found — strong, direct writing!" when all counts are zero.

## 5. Features — engagement & helpfulness (what makes users love it & stay)

This is the heart of the tool. Each item is concrete and ships in v1 or v1.1.

1. **Live, debounced highlighting as you type/paste** — highlights and all three counters update within ~120 ms of a keystroke. *Why:* instant feedback turns editing into a tight loop; users stay to drive each counter toward zero instead of running one batch check and leaving.
2. **Three animated "strength" score meters / counters** — passive, adverb, and weasel counts shown as pill counters that tick and pulse-flash green when they drop. A combined "Directness score" (0–100, higher = fewer flags per 100 words) sits up top as the headline gauge. *Why:* gamifies revision — the dopamine of watching a number fall keeps people editing one more sentence; the single score gives a finish line.
3. **Click-a-flag-to-jump + "Top issues" list** — a ranked list ("7 passive, 12 adverbs, 5 weasel — jump to each"); clicking an entry scrolls to and pulses that span in the text. *Why:* converts an abstract count into an actionable to-do list, the single most useful thing an editor can hand a writer.
4. **In-context "Why is this a tell?" explanation on every highlight** — hover/tap shows the category, a plain-English reason ("passive hides who did it — name the actor"; "'very' is filler — find a stronger verb/adjective"; "'studies suggest' dodges a citation"), and a rewrite pattern. *Why:* education in context teaches the writer to self-correct on future drafts — they leave a better writer, and come back.
5. **Suggested-fix nudges (non-destructive)** — for weasel words and dead adverbs, offer a stronger-word hint ("very good → excellent; really fast → blazing"); for passive, prompt "Who did it?" with a fill-in to flip to active. We never auto-edit (stays analysis-only and on-brand), but we coach. *Why:* turns flagging into improvement, which is the actual job; differentiates from tools that only highlight.
6. **Category toggles + "focus mode"** — isolate one category at a time, or a "passive only" focus that dims everything else. *Why:* lets a user run a single targeted pass (the way pros revise one issue type at a time) without overwhelm.
7. **Before/after compare mode** — snapshot a baseline, edit, then see deltas ("Passive 7 → 2 ▼; Directness 61 → 84 ▲"). Reuses the existing `diff` dependency. *Why:* makes improvement visible and rewarding, reinforcing the transparency brand and giving a reason to keep editing.
8. **One-click copy / download / share** — copy cleaned-up text, download a `.txt`, or copy a shareable summary ("3 passive, 8 adverbs, 2 weasel — Directness 78/100"). *Why:* removes friction at the finish line and turns results into low-effort word-of-mouth.
9. **"Try an example" + curated demo snippets** — buttons that load (a) a hedge-heavy AI paragraph, (b) a passive-bureaucratic paragraph, (c) an adverb-stuffed fiction paragraph. *Why:* solves the blank-canvas problem, instantly demonstrates value, and shows off detection range to first-time visitors.
10. **Sticky live stat bar** — word count, sentence count, passive %, and the three counters pinned at the top, visible on scroll. *Why:* keeps the page useful at a glance even before the user reads any explanation.
11. **Keyboard shortcuts** — paste-and-analyze, toggle each category (1/2/3), next/previous flag (n/p to walk through issues), copy result. *Why:* power users (editors, writers doing many drafts) move fast and return when a tool respects their hands.
12. **Undo / restore** — a one-step undo and "restore original" after any in-tool edit or example load. *Why:* removes the fear of losing work, which keeps people experimenting in the box.
13. **Save draft to localStorage (opt-in)** — remember the last text and toggle settings between visits, all on-device. *Why:* lets a returning user resume without re-pasting, building habit — while staying 100% private, which we say out loud.
14. **Severity / density heatmap rail** — a thin gutter rail (like a minimap) marking where flags cluster down a long document, clickable to jump. *Why:* lets editors triage long pieces by hitting the densest passive/weasel clusters first.
15. **"AI-tell" cross-promotion chips** — when text is heavy on hedges ("it is important to note", "studies suggest"), surface a chip: "These are classic AI tells — see the full AI-Tell Report." *Why:* educates and routes traffic to the sibling flagship tool, deepening the suite loop.
16. **Dark mode + full mobile layout** — reuse the site's dark-mode plumbing; on mobile, highlights stay tappable and tooltips become bottom-sheet popovers. *Why:* writers draft on phones and at night; not breaking there keeps the session alive.
17. **Empty-state guidance & celebratory zero-state** — helpful prompt when empty, and a positive "Strong, direct writing — nothing to flag!" when clean. *Why:* reduces confusion at the start and rewards success at the end, both of which make the tool feel encouraging rather than nagging.
18. **Accessible, non-color-only flags** — every highlight also carries an underline style (dotted/dashed/wavy per category) and an `aria-label`, so categories are distinguishable without color. *Why:* serves colorblind and screen-reader users and signals quality/care.

## 6. UX / UI notes

- **Layout:** single full-width input area on top (paste box), a results/legend rail below or beside it on desktop showing the three counters, the Directness gauge, category toggles, and the Top-issues list. On mobile everything stacks: stat bar → input → counters → issues list.
- **Input/output model:** *in-place* highlighting (not a separate output pane) — the textarea stays the source of truth with a scroll-synced highlight overlay behind it, so the user reads and edits the same words they see flagged. A small toolbar above the box: example loader, category toggles, copy/download, undo.
- **States:** *empty* — placeholder + "Try an example" + one-line value prop; *typing/processing* — counters and highlights update live with no blocking spinner (debounced, never a full-screen load); *result* — counters populated, highlights painted, Top-issues list filled; *zero-issues* — green celebratory banner; *very large text* — a subtle "analyzing…" pip while a Web Worker finishes, text never janks.
- **Microcopy tone:** encouraging coach, not grammar cop — "Passive voice hides who did it. Who *wrote* the report?" rather than "Error." Brand voice = clarity and human voice, never "fool the detector."
- **Mobile behavior:** tap a highlight to open a bottom-sheet explanation; sticky stat bar; large tap targets; category toggles as a horizontal chip row.
- **Accessibility (WCAG 2.2 AA):** never signal category by color alone — pair each with a distinct underline style and `aria-label`; ensure highlight backgrounds meet 3:1 contrast against text in both themes; full keyboard navigation through flags (n/p) with a visible focus ring; respect `prefers-reduced-motion` (disable the counter pulse/needle animation); tooltips reachable by keyboard and dismissible.

## 7. Technical implementation (client-side)

**Detection heuristics (no full POS tagging needed — these are the proven shortcuts):**

- **Passive voice** — port write-good's `passive-voice` package logic: regex `\b(am|are|were|being|is|been|was|be)\b\s*(\w+ed|<irregular-participle>)\b`, where the irregular list is the ~190-entry set from that package (*awoken, been, born, broken, taken, given, done, made, seen, known, written, thrown, …*). Skip the exception "indeed". Optionally support a "by …" stricter mode (only flag when followed by `by`) to cut false positives. Hemingway uses essentially the same be-verb list + `ed`-suffix / pre-word check. This catches the vast majority of English passives without a parser.
- **-ly adverbs** — do **not** use naive `/\w+ly\b/`; match word stems against the `adverb-where` adverb list (~210 stems stored without the trailing "y", e.g. `absolutel`, `quickl`, `reall`, `clearl`) so you exclude non-adverb -ly words (*apply, Italy, only, family, reply, supply, ugly, rely, jolly*). Build the matcher as one alternation regex compiled once.
- **Weasel words / qualifiers** — port `weasel-words`: a `\b(...)\b` alternation over the qualifier list (*are/is a number, clearly, completely, exceedingly, excellent, extremely, fairly, few, huge, interestingly, largely, many, mostly, obviously, quite, relatively, remarkably, several, significantly, substantially, surprisingly, tiny, various, vast, very*), honoring the "too many / too few" exception. **Extend it** with multi-word vague attributions not in that package — *studies suggest, research(ers) suggest/believe, experts say, it is thought, it is said, it could be argued, many people believe, evidence suggests, some say, it is widely known* — since those are the high-value "weasel" phrases users actually search for and the ones LLMs overuse.
- **Sentence split** (for passive % and the heatmap): split on `[.!?]+` with guards for abbreviations (Mr., Dr., e.g., U.S.), decimals, ellipses, and URLs.

**Rendering the overlay:** maintain a sorted, non-overlapping list of `{start, end, category}` spans; resolve overlaps by precedence (passive > weasel > adverb) so a word isn't double-wrapped. Render into a `div` mirror layered behind a transparent-text textarea (identical font metrics, padding, and `white-space`), syncing scroll position — the standard editable-highlight technique (Hemingway, CodeMirror, `react-highlight-within-textarea`). Each span is a `<mark>` with a category class (background + distinct underline) and `aria-label`.

**Suggested libraries / size & perf:**
- We can **vendor the three small word lists** (`passive-voice` ~3 KB, `adverb-where` ~4 KB, `weasel-words` ~1 KB) rather than pull the full `write-good`/`retext` toolchains, keeping the bundle tiny and dependency-light. `retext-passive` is an alternative but drags in the whole `unified`/`nlcst` stack — overkill for a static page; cite it for credibility, don't ship it.
- Reuse the existing `diff` package (already in `package.json`) for before/after compare.
- No new heavy dependency; this is regex + small JSON lists.

**Edge cases & failure modes:**
- *False positives:* "is interesting" (adjective after be-verb, not a participle) — mitigated by the participle/`ed` requirement; offer the stricter "by …" passive mode as a toggle. "The data were collected" (legitimate scientific passive) — we flag but explain it's sometimes acceptable, never auto-change.
- *Non-adverb -ly words* — handled by the stem allow-list, not `/ly$/`.
- *Quotes/code* — flagging inside quoted speech or code blocks; offer a "skip quoted text / code" toggle in v1.1.
- *Pasted AI text* — run the existing `cleaner.ts` `INVISIBLES` strip before tokenizing so zero-width chars and smart quotes don't break word boundaries.
- *Non-English text* — lists are English-calibrated; detect script and show a caveat banner.
- *Overlapping matches* — resolved by the precedence rule above.

**Performance:** O(n) regex passes over the text; debounce ~120 ms. For documents over ~20k words, run the three regex passes and span-merge in a **Web Worker** and post results back, so the textarea never janks. Memoize per-sentence passive results keyed by sentence text to avoid recompute on unrelated edits.

**Server/LLM:** none required and none used — pure regex/list matching, which *is* the privacy pitch. Zero network calls; reuse the site's "nothing leaves your browser" badge. (If we ever add an optional LLM-powered active-voice rewrite, it must be clearly separated, opt-in, and labeled as the one feature that leaves the device — but it is explicitly out of scope for v1 to preserve the provable-privacy story.)

## 8. Competitors & how we differentiate

- **hemingwayapp.com** — the category leader for inline passive/adverb highlighting, but: bundles it into a broader readability product, pushes a paid desktop/Pro app, doesn't explain *why* each flag matters in depth, separates "weasel/qualifier" detection less explicitly, and isn't framed around privacy. *Wedge:* free, no upsell, deep per-flag education, explicit weasel/vague-attribution category, provably client-side.
- **grammarly.com (passive voice checker page)** — strong brand, but the real tool requires signup/login and an account, and is an upsell funnel to premium. *Wedge:* no signup, instant, nothing uploaded.
- **datayze.com/passive-voice-detector** — clever "by zombies" test and doesn't save text, but dated UX, passive-only (no adverbs/weasel), and weak on counts/percentages and explanations. *Wedge:* three categories, live counters + Directness score, modern UX, jump-to-issue.
- **originality.ai / rephrasely passive checkers** — free and no-signup teasers, but passive-only, framed inside AI-detection / paraphrasing products (the detector-beating positioning we explicitly avoid), and thin on education. *Wedge:* quality-not-bypass framing, adverbs + weasel words too, in-context coaching.
- **write-good / retext-passive / editsaurus (github)** — excellent heuristics (we literally build on their lists) but they're CLIs, linters, and dev tooling — no polished, mobile-friendly web page for a non-developer writer. *Wedge:* we package their proven heuristics into a delightful consumer web tool.

**Overall differentiation:** (1) **Privacy** — provably client-side, no upload, no signup; (2) **Consolidation** — passive + adverbs + weasel/vague-attribution on one free page, with counts, percentage, and a Directness score; (3) **Education** — every flag explains the *why* and a fix pattern, so users improve; (4) **Suite synergy** — it sits next to em-dash cleaning and the AI-Tell Report, so a writer can clean AI text then verify it sounds confident and human in one place; (5) **Quality-not-bypass** brand stays consistent.

## 9. SEO & page structure

- **Primary keyword:** `passive voice checker` / `passive voice highlighter`.
- **Secondary:** `weasel words checker`, `adverb checker`, `-ly adverb finder`, `passive voice detector free no signup`, `hemingway alternative free`, `hedging words list`, `vague attribution checker`, `passive vs active voice percentage`, `studies suggest weasel word`.
- **H1:** "Free Passive Voice & Weasel-Word Highlighter — Find Passive Voice, Adverbs & Vague Words."
- **H2 outline:**
  - "Highlight passive voice, adverbs & weasel words instantly" (the tool)
  - "What is passive voice — and how to spot it" (with the be-verb + participle rule)
  - "Weasel words & vague attributions ('studies suggest') to cut"
  - "-ly adverbs that weaken your writing"
  - "How much passive voice is too much?" (the percentage guidance band)
  - "How to rewrite passive into active voice" (the 'name the actor' method)
  - "Is this private? Yes — it runs in your browser"
  - "FAQ"
- **FAQ ideas:** What counts as passive voice? How much passive voice is acceptable? (under ~5–10%); Is passive voice always wrong? (no — science/objectivity); What are weasel words? (with the list); Why are -ly adverbs flagged? Does this fix the text for me? (no — it highlights and coaches); Does my text get uploaded? (no); How is this different from Hemingway / Grammarly?
- **schema.org:** `WebApplication` (`applicationCategory: "Utility"`, `offers` price 0) for the tool, `FAQPage` for the FAQ block, `BreadcrumbList` back to the tool hub.
- **Internal links to sibling tools:** Em Dash Remover (home), Human-Voice / AI-Tell Report (contextually, from the weasel/hedge section — "these are AI tells"), Readability / Grade-Level Scorer, Word & Reading-Time Counter, Before/After Diff Viewer, Sentence Splitter. Link from the "rewrite passive" section to the AI-Tell Report and from the percentage section to the Readability Scorer.

## 10. Build effort & priority

- **Effort:** Medium (estimated 3–5 dev-days). The detection heuristics are cheap (port three small, proven word lists + a handful of regexes); ~70% of the work is the scroll-synced editable highlight overlay, span overlap resolution, the tooltip/explanation system, and tokenizer edge cases.
- **Dependencies on existing code:** reuse `cleaner.ts`'s `INVISIBLES` strip before tokenizing; reuse the `Base`/`Page` layouts, dark-mode plumbing, privacy badge, and the paste-box component pattern from `Cleaner.astro`; reuse the `diff` package already present for before/after compare; can share a `lib/text-stats.ts` tokenizer with the Word/Reading-Time Counter and Readability Scorer if those ship first. Only "new" assets are the three vendored word lists (passive participles, adverb stems, weasel/attribution phrases) as a small `lib/prose-lints.ts`.
- **Sequencing:** per `WANTLIST.md`, this is Tier 2 and should land just after the Human-Voice / AI-Tell Report flagship — they share the "weak-writing tell" framing and can cross-link tightly, and the highlight-overlay component built here is reusable by the AI-Tell Report. Ship v1 with the three categories + live counters + percentage + tooltips + example loader + toggles; defer suggested-fix nudges, before/after compare, the density heatmap rail, the localStorage save, and the "skip quotes/code" toggle to v1.1.

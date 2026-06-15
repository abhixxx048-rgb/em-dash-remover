# Readability / Grade-Level Scorer

> Paste any text and instantly see its reading ease, U.S. grade level, and the exact sentences dragging it down — 100% in your browser, nothing uploaded. Tier: 1. Difficulty: Low. Runs: client-side.

## 1. What it does

The Readability / Grade-Level Scorer analyzes pasted prose and reports how hard it is to read using the standard, peer-reviewed formulas (Flesch Reading Ease, Flesch–Kincaid Grade, Gunning Fog, SMOG, plus Coleman–Liau and ARI as character-based cross-checks). It surfaces a single headline grade level, the supporting document stats (words, sentences, syllables, average sentence length), and — the differentiating feature — inline highlighting of the hardest individual sentences so the writer knows precisely what to cut or split. Everything is computed locally in JavaScript; no text leaves the device. The framing is quality and clarity ("write so a real human reads it easily"), not detector-gaming.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**
- `readability checker` — high volume, evergreen, competitive (hemingwayapp.com, readable.com own the top).
- `flesch kincaid calculator` / `flesch reading ease calculator` — high intent, medium competition, many thin calculator pages (goodcalculators, charactercalculator) that are easy to out-build on UX.
- `grade level checker` / `reading level checker` — high volume, medium competition.
- `gunning fog index calculator`, `smog calculator`, `coleman liau calculator` — long-tail, low competition, easy wins; each can be an anchored sub-section / FAQ that ranks.
- `hardest sentence checker` / `hard to read sentence highlighter` — low volume but strong intent; almost nobody targets it directly except Hemingway.
- `hemingway app free alternative` / `readability checker no signup` — medium volume, our privacy + no-login angle wins here.

**Who searches and the moment they need it:** students polishing an essay to hit an assigned reading level; content marketers and SEOs checking a post reads at grade 7–9 (the web sweet spot); copywriters and UX writers; technical writers reducing manual/policy density; ESL writers verifying their draft is accessible; healthcare/gov/legal writers required to hit plain-language mandates (e.g., grade 6–8 for patient materials); and anyone who just cleaned AI text on our main tool and wants to confirm it now reads naturally.

**Source domains found in research:** hemingwayapp.com, readable.com, readabilityformulas.com, originality.ai (readability category), en.wikipedia.org (Gunning fog / Coleman–Liau / ARI), clickhelp.com, npmjs.com (`text-readability`, `flesch-kincaid`, `syllable`).

## 3. Target users & use cases

- **Students / academics** — get an essay or thesis abstract under a target grade level before submitting; verify a reading log entry's difficulty.
- **Content marketers & SEO writers** — confirm blog posts land at grade 7–9 for broad reach; A/B two headlines/intros by score.
- **Copywriters & UX writers** — keep microcopy and landing pages skimmable; spot the one bloated sentence in a CTA block.
- **Technical writers** — reduce density in docs, manuals, and release notes; cross-check with ARI (built for technical manuals) and Coleman–Liau.
- **ESL / non-native writers** — verify a draft is accessible and not accidentally ornate.
- **Healthcare, government, legal, insurance writers** — meet plain-language mandates (patient leaflets, consent forms, policy summaries) that specify grade 6–8.
- **Editors** — triage which sentences in a long piece need surgery via hardest-sentence highlighting.
- **Our own returning users** — after running text through the Em Dash Remover / AI-tell tools, confirm the cleaned result reads like a human wrote it.

## 4. Features — core (MVP)

1. **Paste-or-type input box** with placeholder and an "Try an example" loader; analysis runs live (debounced) as the user types or pastes.
2. **Headline grade level** — one prominent number (the Flesch–Kincaid Grade, rounded sensibly) with a plain-language label ("Reads at ~8th grade — fairly easy").
3. **Flesch Reading Ease** — 0–100 score with band label (e.g., 60–70 "Standard / plain English"), formula: `206.835 − 1.015×(words/sentences) − 84.6×(syllables/words)`.
4. **Flesch–Kincaid Grade** — `0.39×(words/sentences) + 11.8×(syllables/words) − 15.59`.
5. **Gunning Fog** — `0.4×[(words/sentences) + 100×(complex words/words)]`, where complex = 3+ syllables excluding proper nouns, common suffixes (-es, -ed, -ing), and obvious compounds.
6. **SMOG Index** — `3 + √(polysyllable count)` (polysyllable = 3+ syllables); note SMOG is most stable on 30+ sentences and say so.
7. **Coleman–Liau** — `0.0588×L − 0.296×S − 15.8` (L = letters per 100 words, S = sentences per 100 words); character-based, no syllable estimation.
8. **Automated Readability Index (ARI)** — `4.71×(characters/words) + 0.5×(words/sentences) − 21.43`.
9. **Consensus grade** — average of the grade-level formulas into a single "consensus reading level," the way readabilityformulas-style tools do, to smooth out per-formula noise.
10. **Document stats panel** — word count, sentence count, paragraph count, syllable count, average words/sentence, average syllables/word, complex-word count, estimated reading time (~238 wpm) and speaking time (~150 wpm).
11. **Hardest-sentence highlighting** — score every sentence individually (Flesch–Kincaid per sentence) and highlight sentences scoring well above the document average: yellow = hard (≈4+ grades above an adult baseline), red = very hard (≈6+ grades above), mirroring Hemingway's model but as read-only analysis, not auto-edit.
12. **Robust tokenizer** — sentence splitter that respects abbreviations (Mr., Dr., e.g., U.S.), decimals, ellipses, and URLs; word counter that ignores stray punctuation; syllable counter (see §7).

## 5. Features — engagement & helpfulness (what makes users love it & stay)

This is the heart of the tool. Each item below is concrete and ships in v1 or v1.1.

1. **Live, debounced scoring as you type/paste** — every score, the grade meter, and the highlights update within ~100–150 ms of a keystroke. Why: instant feedback turns editing into a tight feedback loop; users stay to "chase the number" down.
2. **Animated grade-level meter / gauge** — a color-banded arc (green = easy, amber = standard, red = hard) with a needle that visibly moves when the score changes. Why: gamifies revision; the dopamine of watching the needle drop keeps people editing one more sentence.
3. **Hardest-sentence list with jump-to** — a ranked "Top 5 hardest sentences" list; clicking one scrolls to and pulses that sentence in the text. Why: turns an abstract score into an actionable to-do list — the single most useful thing an editor can give a writer.
4. **Per-sentence hover tooltip** — hovering a highlighted sentence shows its own grade, word count, and why it's flagged ("31 words, 5 complex words → grade 14"). Why: education in context; users learn what "hard" means and self-correct on future sentences.
5. **"Explain this score" expandable cards** — each formula tile flips open to show the exact formula, the plugged-in numbers for *this* text, and a one-line plain-English meaning + ideal-range note. Why: builds trust (provable math, not a black box) and earns long-tail SEO for each formula name.
6. **Target-audience presets** — one-click goals ("General web — grade 7–9", "Wide / plain language — grade 6", "Academic — grade 13+"); the meter recolors around the chosen target and shows "You're 2 grades above target." Why: gives the number a purpose and a finish line, which drives repeat sessions.
7. **Before/after compare mode** — snapshot a baseline, edit, and see deltas (e.g., "Grade 11.2 → 8.4, −2.8 ▼; 6 hard sentences → 2"). Why: makes improvement visible and rewarding; reinforces our transparency brand. Reuses the existing `diff` dependency for text-level diffing if shown.
8. **Inline word counter + reading-time pill** always visible at the top, sticky on scroll. Why: the highest-frequency thing writers want; keeps the page useful even before they read the formulas.
9. **Copy / download / share** — "Copy results summary" (a clean text block of all scores), "Download report" (.txt/.md), and "Copy text back." Why: writers paste readability stats into briefs, docs, and Slack; sharing seeds inbound links/word-of-mouth.
10. **Save to localStorage (drafts + last session)** — auto-restore the last analyzed text and remember the chosen target preset and theme. Why: zero-friction return; people come back to the same draft without re-pasting, and it costs no server (on-brand privacy).
11. **Keyboard shortcuts** — Cmd/Ctrl+Enter to re-run, Esc to clear, `[` / `]` to jump between hard sentences. Why: power users (editors running many drafts) move faster and stick.
12. **One-click "Try an example" with multiple samples** — toggle between a hard sample (dense legalese), a medium one, and an easy one so the empty state demonstrates value immediately. Why: solves the blank-canvas problem; users see the highlighting work in one click before committing their own text.
13. **Plain-language verdict sentence** — a single human takeaway at the top ("This reads at about an 11th-grade level — fine for a technical audience, but ~3 grades too hard for a general blog"). Why: most users don't know what grade 11 *means*; the verdict tells them what to do.
14. **Highlight legend + toggle** — a small key explaining yellow/red, with a switch to turn highlighting off for distraction-free reading and a "passive voice / long sentence" filter toggle (v1.1). Why: control and clarity; respects different workflows.
15. **Dark mode + responsive, accessible UI** — follows system theme, persists choice, full keyboard nav, screen-reader-announced score changes. Why: writers work at night and on phones; accessibility is also on-brand for a clarity tool.
16. **Empty-state guidance + tooltips on every metric** — short, friendly hints ("Aim for 60+ on Reading Ease for web content") and `(?)` tooltips defining each term. Why: turns first-time confusion into a mini-lesson and lowers bounce.
17. **Cross-tool nudges** — contextual links like "These sentences are long because of em dashes → clean them" and "This reads stilted → run the AI-tell report." Why: routes traffic into the wider suite and makes the scorer a hub, not a dead end.

## 6. UX / UI notes

- **Layout:** Two-zone. Left/top: a large editable text area that doubles as the highlight surface (a styled contenteditable or an overlay layer behind a transparent textarea so highlights align with text). Right/bottom (stacks on mobile): a results rail with the grade meter, the consensus verdict, formula tiles, the document-stats panel, and the hardest-sentence list.
- **Input/output model:** single source of truth = the input text; all outputs are derived and live. No "Analyze" button required, but provide one for accessibility/explicit re-run.
- **States:**
  - *Empty:* friendly prompt, "Try an example" buttons, a one-line explainer, and the meter shown at a neutral resting position.
  - *Processing:* for large pastes, a subtle "Analyzing…" shimmer on the rail; never block typing.
  - *Result:* meter animates in, verdict sentence renders, tiles populate, highlights paint.
  - *Edge/too-short:* if under ~1 sentence or ~25 words, show "Add more text for a reliable score" and flag SMOG as needing 30+ sentences rather than printing a junk number.
- **Microcopy tone:** plain, encouraging, non-judgmental ("A bit dense — here's where" not "Bad writing"). Quality-and-clarity framing, never "beat the detector."
- **Mobile:** results rail collapses into tappable accordion cards under the text; meter scales down; hardest-sentence list uses tap-to-scroll; large tap targets; sticky word-count pill.
- **Accessibility (WCAG 2.2 AA):** never signal difficulty by color alone — pair yellow/red highlights with an underline style + an icon + the per-sentence grade in the tooltip and list; ensure 4.5:1 contrast in both themes; announce score/verdict changes via an `aria-live="polite"` region; full keyboard operability for the jump-to-sentence controls.

## 7. Technical implementation (client-side)

**Pipeline:** tokenize → count → run formulas → score per sentence → render. All synchronous JS; for large inputs, move counting into a Web Worker to keep typing smooth.

**Tokenization:**
- *Sentences:* split on `.!?` followed by whitespace + capital, with an abbreviation guard list (Mr., Mrs., Dr., Prof., e.g., i.e., U.S., etc., vs., a.m./p.m.) and protection for decimals (`3.14`), ellipses (`…`/`...`), and URLs/emails. Use `Intl.Segmenter` with `granularity:'sentence'` where available (modern Chrome/Safari/Firefox) and fall back to the regex splitter.
- *Words:* `Intl.Segmenter` word granularity or a `\p{L}[\p{L}\p{M}'’-]*` Unicode regex; exclude pure-punctuation tokens. Count *letters/characters* for Coleman–Liau and ARI from `\p{L}\p{N}` only.
- *Syllables:* counting is the only fuzzy part. Recommended: the `syllable` npm package (Titus Wormer) — ships a curated CMU-dictionary subset for common words plus a tuned heuristic (vowel-group nucleus counting, silent-final-`e` drop, consonant+`le` retention, common-suffix handling, exception list for *every, people, fire, business, February*). It's ~95–98% accurate on standard English, dialect-sensitive on a few loanwords, and small/dependency-light. The `text-readability` package wraps `syllable` and already exposes `fleschReadingEase`, `fleschKincaidGrade`, `gunningFog`, `smogIndex`, `colemanLiauIndex`, `automatedReadabilityIndex`, `daleChallReadabilityScore`, `linsearWriteFormula`, and a `textStandard` consensus — using it gets us a vetted v1 fast. Trade-off: pulling the whole package adds weight and bundles a `daleChall` word list (~3k words); we can tree-shake to only the formulas we ship, or reimplement the six core formulas ourselves (trivial arithmetic) over `syllable` to keep the bundle lean. Budget a small fallback regex syllable counter (`word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'').match(/[aeiouy]{1,2}/g)?.length || 1`) only as a no-dependency degraded mode.

**Formulas (implement exactly as in §4).** Guard every division by zero (empty/one-sentence text). Round Reading Ease to 0–100 clamp; round grades to one decimal for display but keep raw for the consensus average.

**Per-sentence difficulty:** compute Flesch–Kincaid per sentence; baseline = US adult ~grade 8–9; flag yellow at +4 grades over the document/baseline, red at +6, matching Hemingway's documented thresholds. Cache per-sentence results keyed by sentence text to avoid recompute on unrelated edits.

**Edge cases & failure modes:** all-caps / no terminal punctuation (treat as one sentence, warn); code blocks, numbers, and URLs inflating syllable/char counts (offer a "treat as prose only" note); very short text (suppress SMOG, show "low confidence"); non-English text (formulas are English-calibrated — detect script and show a caveat banner); emoji and invisible chars (strip via the existing `cleaner.ts` `INVISIBLES` regex before counting so pasted AI text doesn't skew stats).

**Performance:** O(n) over characters; debounce input ~120 ms; for documents over ~20k words, run counting in a Web Worker and update the rail asynchronously so the textarea never janks. Memoize syllable counts per unique word in a `Map`.

**Server/LLM:** none required and none used — this is pure math, which is the whole privacy pitch. Keep the page free of any network call; reuse the site's existing "nothing leaves your browser" privacy badge.

## 8. Competitors & how we differentiate

- **hemingwayapp.com** — the category leader for hard-sentence highlighting and grade display, but: gives a *single* grade (no Flesch RE/Fog/SMOG breakdown), pushes a paid desktop/Pro app, doesn't expose the math, and isn't framed around privacy. Our wedge: show all six formulas with their numbers, keep it free with no upsell, and make the math provable.
- **readable.com** — comprehensive (Flesch, Fog, SMOG, Coleman–Liau, ARI, Dale–Chall) but gated behind login/subscription (ReadablePro) for anything beyond a teaser. Our wedge: the full multi-formula analysis, free and no signup.
- **readabilityformulas.com** — strong on consensus scoring and education, but dated UX, ad-heavy, and not live-as-you-type. Our wedge: modern live UX, animated meter, jump-to-sentence.
- **goodcalculators / charactercalculator / sagecalculator** — thin single-formula calculator pages, no highlighting, no consensus, no education. Our wedge: one page that does everything plus actionable highlighting.
- **originality.ai readability** — bundled into a paid AI-detection product framed around detector-beating. Our wedge: explicitly quality-not-bypass, and not paywalled.

**Overall differentiation:** (1) **Privacy** — provably client-side, no upload, no signup; (2) **Consolidation** — every major formula + consensus + per-sentence highlighting on one free page; (3) **Grammar/AI-aware ecosystem** — it sits next to em-dash cleaning and AI-tell detection, so a writer can clean then verify in one place; (4) **Education + transparency** — we show the formula and the plugged-in numbers, which both teaches and builds trust.

## 9. SEO & page structure

- **Primary keyword:** `readability checker` / `reading grade level checker`.
- **Secondary:** `flesch reading ease calculator`, `flesch-kincaid grade level calculator`, `gunning fog index calculator`, `smog calculator`, `coleman-liau calculator`, `hard to read sentence highlighter`, `hemingway app free alternative no signup`.
- **H1:** "Free Readability Checker — Flesch–Kincaid, Gunning Fog & Hard-Sentence Highlighter."
- **H2 outline:**
  - "Check your reading level instantly" (the tool)
  - "What your scores mean" (Reading Ease bands + grade-level guide table)
  - "Flesch Reading Ease — formula & how to use it"
  - "Flesch–Kincaid Grade Level explained"
  - "Gunning Fog, SMOG, Coleman–Liau & ARI"
  - "Why the hardest sentences matter (and how to fix them)"
  - "Is this private? Yes — it runs in your browser"
  - "FAQ"
- **FAQ ideas:** What reading level should my content be? (web ≈ grade 7–9); What's a good Flesch Reading Ease score? (60–70 for general audiences); Flesch–Kincaid vs Gunning Fog — which to trust?; Why do the formulas disagree?; How accurate is syllable counting?; Does this send my text anywhere? (no); How is this different from Hemingway?
- **schema.org:** `WebApplication` (or `SoftwareApplication`, `applicationCategory: "Utility"`, `offers` price 0) for the tool, plus `FAQPage` for the FAQ block and `BreadcrumbList` back to the tool hub.
- **Internal links to sibling tools:** Em Dash Remover (home), Word & Reading-Time Counter, Before/After Diff Viewer, Human-Voice / AI-Tell Report, Passive-Voice & Weasel-Word Highlighter, Sentence Splitter. Link contextually from the hardest-sentence section ("split these → Sentence Splitter") and the verdict ("sounds stilted → AI-Tell Report").

## 10. Build effort & priority

- **Effort:** Low (estimated 1.5–3 dev-days for a solid v1). The math is trivial; ~80% of the work is the live-highlight overlay alignment and the tokenizer edge cases.
- **Dependencies on existing code:** reuse `cleaner.ts`'s `INVISIBLES` stripping before counting; reuse the site's privacy badge, `Base`/`Page` layouts, dark-mode plumbing, and the existing paste-box component pattern from `Cleaner.astro`; reuse the `diff` package already in `package.json` for the optional before/after compare. Only new dependency is `syllable` (and optionally `text-readability` for a fast first cut).
- **Sequencing:** per `WANTLIST.md`, build after the Invisible/Watermark Inspector and alongside/just after the Word & Reading-Time Counter — the two share the same counting/tokenizer core, so build a shared `lib/text-stats.ts` once and have both pages consume it. Ship v1 with the six formulas + meter + hardest-sentence highlighting + example loader; defer target-presets, before/after compare, and the passive-voice filter to v1.1.

# Straight-to-Curly Smart Quotes Converter

> Turn typewriter (straight) quotes, apostrophes, hyphens and "..." into correctly-directional curly quotes, true apostrophes, proper en/em dashes and a real ellipsis for polished publishing — instantly, in your browser, with the tricky edge cases (’90s, 6'2", 'Twas, nested quotes) actually handled right. Tier: 2. Difficulty: Med. Runs: client-side (100%).

## 1. What it does
Takes pasted or typed text with dumb/straight punctuation (`"`, `'`, `--`, `...`) and "educates" it into typographically correct marks: directional curly double quotes (“ ”), directional single quotes/apostrophes (‘ ’), en dashes (–) for ranges, em dashes (—) for breaks, and a single ellipsis character (…). It is the deliberate inverse of the site's existing curly→straight cleaner, aimed at writers preparing copy for publication rather than people de-AI-ing text. The differentiator versus a naive find-and-replace is directional correctness and the well-known SmartyPants edge cases: a leading apostrophe in a decade (’90s) must curl as a closing quote, leading contractions (’Twas, ’em, ’cause) must not "miseducate" into opening quotes, and inch/foot measurements (5' 10", 6'2") should become primes (′ ″) — not curly quotes. Everything runs synchronously in the browser, so nothing is uploaded.

## 2. Why users want it (demand & search)
**Target keywords (utility/transactional intent, evergreen):**
- `smart quotes converter`, `straight quotes to curly quotes`, `convert straight quotes to smart quotes` — the head terms; moderate volume, a thin field of utility-site clones (webutility.io, inkplant.com, infyways.com). Competition is low-to-medium and the SERP rewards a fast, correct, ad-light page.
- `curly quotes generator`, `make quotes curly`, `typographer's quotes online` — synonym cluster, same intent, easy to win.
- `apostrophe direction wrong '90s`, `smart quote facing wrong way`, `apostrophe before year curly` — long-tail, high-intent pain queries from people whose word processor curled ’90s the wrong way; very low competition, strong "we actually fix this" hook.
- `straight to smart quotes word`, `google docs smart quotes`, `indesign turn straight quotes curly` — people fighting their editor's auto-correct; long-tail informational + tool intent.
- `prime symbol feet inches`, `inch mark vs quote`, `foot mark typography` — measurement edge-case searchers (designers, technical writers).
- `en dash em dash converter`, `-- to em dash`, `typographer dashes` — overlaps with the site's existing dash audience and the new dash tooling.
- `smartypants online`, `educate quotes` — algorithm-aware searchers (developers, typographers).

**Who searches and when:** A self-publishing author or blogger about to push copy to a CMS/e-book and wanting print-quality punctuation; a designer pasting client copy into InDesign/Figma where straight quotes look amateur; a developer whose CMS strips SmartyPants and needs to pre-curl Markdown; a writer who noticed Word curled `’90s` the wrong way and wants it fixed; an ESL or academic writer who isn't sure which quote faces which direction. The moment is almost always "I have this text and need it to look professionally typeset before I publish/paste it."

**Sources found in research:** daringfireball.net (canonical SmartyPants), docutils.sourceforge.io (smartquotes spec + documented limitations), practicaltypography.com and typographyforlawyers.com (Butterick — straight vs curly rules), cmosshoptalk.com (Chicago on "smart" apostrophes / ’90s), smartquotes.js.org and npmjs.com/package/retext-smartypants (JS libraries), webutility.io / inkplant.com / infyways.com (competing converters), speakipedia.com and typewolf.com (primes for feet/inches cheatsheets).

## 3. Target users & use cases
- **Self-publishing authors / e-book formatters** — convert a manuscript's straight quotes to curly before exporting to EPUB/print, where straight quotes read as unprofessional. They specifically hit the ’90s and leading-contraction (’Twas, ’em) edge cases in dialogue-heavy fiction.
- **Bloggers / content marketers / SEO writers** — polish copy before pasting into a CMS that does not run SmartyPants, so published quotes and dashes look typeset.
- **Designers (print & web)** — paste client/agency copy into InDesign, Figma, or HTML with correct curly quotes and primes for measurements (6'2"), the #1 "looks amateur" tell.
- **Developers / static-site authors** — pre-curl Markdown/MDX when their pipeline lacks `remark-smartypants`, or sanity-check a build's quote handling.
- **Academics & students** — ensure quotations and apostrophes face the right way in papers, especially nested single-inside-double quotes.
- **ESL / non-native writers** — get directional quotes right without having to learn which mark opens vs closes.
- **Editors & proofreaders** — batch-fix a client's typewriter quotes and flag the inch/foot and decade cases that automated tools usually botch.

## 4. Features — core (MVP)
1. **Single input box with live conversion** — educates punctuation on every keystroke/paste; no "Convert" round-trip for normal text.
2. **Directional double quotes** — opening “ vs closing ” chosen by context (preceding whitespace, `(`, `[`, `{`, `—`, `–`, or start-of-string → opening; otherwise closing), per the SmartyPants/educate rules.
3. **Directional single quotes & apostrophes** — ‘ vs ’; an apostrophe inside or at the end of a word becomes ’ (don’t, Hastings’), a single quote after an opener becomes ‘.
4. **Decade/abbreviation apostrophe fix** — the leading-apostrophe-then-digits case (’90s, ’08) and known leading contractions (’Twas, ’em, ’cause, ’tis, ’round, ’n’) curl as a **closing** quote ’, not an opening ‘. This is the headline correctness feature.
5. **Dash conversion** — `--` → en dash (–), `---` → em dash (—); optional "smart dash" that turns ` - ` between clauses into a spaced em/en dash per a chosen style. Mirrors the existing dash engine's character set.
6. **Ellipsis conversion** — `...` (and `. . .`) → a single … character; `....` → … + period.
7. **Prime / measurement handling** — detect inch/foot patterns (`5' 10"`, `6'2"`, `5"`) and emit primes (′ ″) instead of curly quotes, with a toggle (default on) since many users still want plain quotes.
8. **Code/preserve guard** — leave content in fenced code blocks, inline backticks, and obvious URLs/file paths untouched so straight quotes that must stay straight aren't curled.
9. **Locale/style selector** — at minimum English (“ ” ‘ ’); offer common alternates (British single-primary, German „ “, French « »/guillemets) since quote direction is language-dependent.
10. **One-click Copy** and **Clear**; output reflects the educated text.

## 5. Features — engagement & helpfulness (what makes users love it & stay)
1. **Instant live "education" (no submit button)** — re-curls on every keystroke/paste so the tool feels alive and the user sees “ ” ’ – — appear before they finish reading the controls. Zero friction is the single biggest reason a utility page converts and gets re-used.
2. **Before/after split view with change highlighting** — color/underline every character that changed (e.g. `'` → ’) so editors and authors can *verify* the directional calls rather than trusting a black box; this directly serves the skeptical "did it curl ’90s right?" searcher.
3. **"Why this mark?" inline explainer** — hover/tap any changed character to see a one-line reason ("Closing apostrophe because it follows a letter," "Prime, not quote, because it marks inches after a digit," "Opening quote because it follows a space"). This is the education hook that fits the brand ("quality, not bypass") and builds trust the directions are correct.
4. **Edge-case spotlight chips** — a small panel that lights up when the input contains a known tricky pattern: "Detected a decade (’90s) — curled as closing ✓", "Found a foot/inch measurement — using primes", "Leading contraction ’Twas — fixed". Turns invisible correctness into visible value and teaches the user what makes this tool smarter than Word.
5. **Live counters** — quotes converted, apostrophes fixed, dashes upgraded, ellipses, primes detected — a running scoreboard of how much was polished, giving a satisfying sense of work done.
6. **"Try an example" / demo button** — fills the empty box with a deliberately gnarly sample ("'Twas the '90s — she said \"he's 6'2\"...\" — and that's it.") so first-time visitors instantly see every hard case handled at once; doubles as the empty-state guidance.
7. **Style/locale presets with sticky memory** — US English, British English, German, French, "primes off," "dashes off" saved to `localStorage` so a repeat visitor's preferred typographic convention is pre-selected next visit. Removes the re-pick-every-time annoyance and is the core stickiness lever.
8. **One-click Copy with confirmation toast** + auto-select on focus — copying is the terminal action for ~95% of users; make it a single tap with a clear "Copied!" toast.
9. **Download as .txt / copy-as-HTML-entities** — for developers, a toggle to output `&#8220;`/`&#8217;` entities (SmartyPants-style) instead of literal Unicode, matching how many CMSs store them; for authors, a plain .txt download for long documents.
10. **Undo / redo (Ctrl+Z / Ctrl+Y)** — education is lossy (you can't always recover whether a `"` was meant as a prime), so an undo stack and a per-character "force straight here" override prevent the "it curled my inch mark" frustration.
11. **Manual override toggles per character** — click any educated mark to flip it (opening↔closing, quote↔prime, en↔em dash). Gives editors the last-mile control no competitor offers and turns the tool into something they trust for real work.
12. **Keyboard shortcuts** — Ctrl+Enter to copy result, Ctrl+L to clear, a `?` overlay listing them; power users (devs, editors) run many snippets and love staying on the keyboard.
13. **Round-trip / "also do the reverse" link** — a prominent cross-link to the existing curly→straight cleaner so users can flip either direction; framing the pair as "smarten / dumb-down quotes" keeps people inside the suite.
14. **"Paste from clipboard" button** — one tap to pull clipboard text on mobile/desktop where supported, skipping the awkward long-press paste.
15. **Dark mode** (respects `prefers-color-scheme`) and a **mobile-first layout** — big tap targets, sticky Copy button, no horizontal scroll; a large share of casual converter traffic is mobile.
16. **Accessible, no-color-only feedback** — changed-character highlights carry an underline/icon plus an `aria-live` summary ("12 quotes curled, 1 prime detected"), full keyboard operability, and ARIA-pressed states on toggles; broadens the audience and signals quality.
17. **Privacy reassurance line** — "Your text never leaves your browser" with a one-line "how we know" link, reinforcing the site-wide brand hook for the publishing-confidential-manuscript crowd.

## 6. UX / UI notes
**Layout:** Single column on mobile; optional two-pane on desktop (straight input left, curly output right) so the before/after is literal, or a single in-place transform box. A compact control row above the box holds the style/locale preset, the "primes," "dashes," and "ellipsis" toggles, and the demo chip. Counters and edge-case spotlight chips sit in a thin bar under the output. Copy / Download / Clear / "reverse (curly→straight)" form a grouped action row.

**Input/output model:** live, synchronous transform; the output pane shows educated text with optional change highlighting; clicking a highlighted mark opens the per-character override + "why this mark?" tooltip.

**States:**
- *Empty:* placeholder ("Paste text with straight quotes…") plus a "Try an example" chip and one-line "what it does."
- *Processing:* synchronous and instant for normal text; for very large pastes (>50k chars) debounce and show a subtle inline spinner.
- *Result:* output styled distinctly; "Copied!" toast on copy; spotlight chips animate in when an edge case is detected.

**Microcopy tone:** plain, confident, lightly educational — "Smart quotes, done right. We curl your quotes the correct direction — including ’90s and 6'2\"." Never "beat the detector."

**Mobile:** sticky bottom Copy button, full-width toggles, 44px+ targets, no hover-only affordances (tap reveals the "why this mark?" explainer).

**Accessibility (WCAG 2.1 AA):** every toggle keyboard-reachable with visible focus; change-highlights and toggle states conveyed by text/icon + ARIA, not color alone; the conversion summary in an `aria-live="polite"` region; contrast ≥ 4.5:1 in both themes; explainers are real disclosure widgets.

## 7. Technical implementation (client-side)
**All processing is synchronous JS in the browser — no server, no LLM — preserving the privacy story.** This is a port/adaptation of the well-documented SmartyPants "educate" algorithm (Gruber, originally David Dunham's 1980s miniWRITER routine), run on plain strings.

**Characters / Unicode:**
- Double quotes: opening “ U+201C, closing ” U+201D.
- Single quotes/apostrophe: opening ‘ U+2018, closing/apostrophe ’ U+2019.
- Dashes: en – U+2013, em — U+2014 (reuse the existing `EM`/`EN` constants in `src/lib/cleaner.ts`).
- Ellipsis: … U+2026. Primes: ′ U+2032 (feet), ″ U+2033 (inches).
- Locale alternates: „ U+201E / “ (German), « U+00AB / » U+00BB (French guillemets), and British single-primary ordering.

**Core "educate" rules (string passes, order matters):**
1. **Decade & leading-contraction guard first** — before generic single-quote logic, force closing ’ for: apostrophe-then-two-digits-then-optional-`s` (`/'(\d\d)(s)?\b/` → ’90s, ’08) and a small allow-list of leading contractions (`'twas`, `'tis`, `'em`, `'cause`, `'round`, `'n'`, `'bout`, `'til`). This is the canonical SmartyPants miss; handling it is our wedge.
2. **Opening single/double** — a `'` or `"` is **opening** when preceded by start-of-string, whitespace, `(`, `[`, `{`, an em/en dash, or an existing opening quote: pattern along the lines of `/(^|[\s([{–—"'])'/g` → ‘ and the double analogue → “.
3. **Closing single/double / apostrophe** — any remaining `'` becomes ’ (covers don’t, end-of-word possessives Hastings’, and all apostrophes mid-word); any remaining `"` becomes ”.
4. **Backtick style** (optional, for Markdown authors): `` `like this'' `` → “like this”.
5. **Dashes:** `---` → —, `--` → – (do this before/after quotes consistently; the existing engine already normalizes `-{2,}`); optional spaced-dash style for ` - `.
6. **Ellipsis:** `...` and `. . .` → …; `....` → ….

**Prime detection (edge case):** before educating quotes, optionally rewrite measurement patterns: `\d+\s*'` → digit + ′, `\d+\s*"` → digit + ″, and the combined foot-inch form (`6'2"`, `5' 10"`). Gate behind the "primes" toggle because some users genuinely want plain marks. Order matters: detect primes *before* the generic closing-quote rule so 6'2" doesn't become 6’2”.

**Preserve guards:** skip fenced/inline code and URLs/file paths via a tokenizing pre-pass (split out `` `...` ``, ```` ```...``` ````, and `https?://\S+` / path-like tokens), educate only the prose tokens, then re-join — mirrors SmartyPants skipping `<pre>/<code>/<kbd>/<script>` and prevents curling quotes inside code/paths.

**Suggested libraries (all small, optional):**
- `retext-smartypants` (unified/retext plugin, ESM, Node 16+) — battle-tested educate logic; good reference even if not bundled directly.
- `smartquotes` (npm) and `smartquotes.js` — dependency-free, string- and DOM-capable, handle primes; `smartquotes.js` is a few KB. Good for vendoring the core regex set.
- `othree/smartypants.js` / `@tremby/smartypants` — direct JS ports of SmartyPants.pl for entity-output parity.
- Recommendation: **hand-roll ~150 lines** adapted from these (the rules are short) to avoid a dependency and to bolt on our decade/prime/override extensions, keeping bundle size minimal.

**Edge cases & failure modes (document these as the value prop):**
- Leading apostrophe in contractions (’Twas, ’em) — handled by the allow-list (Rule 1); the canonical algorithm gets these wrong.
- Decade ’90s — handled by the digit rule; "every word processor" miscurls this.
- Inch/foot marks vs quotes — primes toggle; inherently ambiguous (`5'` could be a quote), so expose the per-character override.
- Apostrophe after an em dash — Word forces it left; we should open it correctly toward the following word.
- Nested single-inside-double quotes — educate independently so ‘…’ sits inside “…”.
- Token boundaries with no surrounding context (a lone `'` at the very start) — fall back to opening but make it overridable.
- Mixed/locale text, combining marks, NFC normalization before processing.

**Performance:** all transforms are O(n) single passes; debounce live conversion at ~50–100 ms. For pastes over ~50–100k chars, chunk by line or run in a Web Worker so the UI thread stays responsive — still 100% client-side.

**Server/LLM:** none required, and adding one would break the privacy promise. Quote direction is a solved deterministic problem; keep it offline.

## 8. Competitors & how we differentiate
- **webutility.io (Straight Quotes to Curly Quotes)** — does the basic conversion behind a "Convert" button. Weakness: no live preview, no edge-case handling surfaced, no prime/decade correctness story, ad-supported single-purpose page.
- **inkplant.com (Smart Quotes Converter)** — both directions; explicitly "leaves primes as is." Weakness: doesn't *detect* and create primes for measurements, utilitarian UX, no education or change-highlighting.
- **infyways.com / texttools.org / dan.hersam.com** — straightforward straight↔curly utilities. Weakness: thin, no directional explanation, no overrides, no privacy or grammar angle.
- **smartquotes.js.org** — a developer library (and demo), not a polished consumer tool; great engine, but you have to be a dev to use it and it has no UI niceties.
- **prowritingaid.com / Word / Google Docs / InDesign autocorrect** — built into writing tools but notoriously miscurl ’90s and leading contractions, and turn inch/foot marks into curly quotes that must be fixed by hand (the exact pain that drives the long-tail searches).

**Our wedge:**
1. **Correctness on the famous misses** — ’90s, ’Twas/’em, and inch/foot primes handled by default, with visible "we caught this" chips; this is precisely where Word and the thin clones fail.
2. **Education over black box** — the "why this mark?" explainer and before/after highlighting teach direction rather than hiding it, matching the brand ("clean writing for real quality").
3. **Per-character override + reverse link** — editors get trustable last-mile control, and the curly→straight round-trip keeps users in the suite.
4. **Privacy as a first-class promise** — provably client-side, no ads, no signup; ideal for confidential manuscripts. None of the converter clones lead with this.
5. **Consolidation** — reuses the existing dash/ellipsis/Unicode engine in `src/lib/cleaner.ts`, so the same page can also fix dashes and spacing in one pass.

## 9. SEO & page structure
**Primary keyword:** smart quotes converter (straight to curly). **Secondary:** straight quotes to curly quotes, curly quotes generator, convert straight quotes to smart quotes, apostrophe direction ’90s, feet and inches prime symbols, -- to em dash, educate quotes / smartypants online.

**H1/H2 outline:**
- `H1: Smart Quotes Converter — Turn Straight Quotes into Curly Quotes (Done Right)`
- `H2: How to use the smart quotes converter` (3 steps)
- `H2: Straight vs curly quotes — which way does each mark face?` (opening ‘“ vs closing ’” with examples — captures direction confusion)
- `H2: The tricky cases we get right: ’90s, ’Twas, and foot/inch marks (6'2")` (the long-tail pain queries and our differentiator)
- `H2: En dash vs em dash vs hyphen, and -- / --- shortcuts` (internal-link bait to existing dash content)
- `H2: For developers — Unicode vs HTML entities and Markdown/SmartyPants`
- `H2: Privacy — everything runs in your browser`
- `H2: FAQ`

**FAQ ideas:** Why did Word curl my ’90s the wrong way? Which quote is opening and which is closing? How do I make foot and inch marks (primes) instead of quotes? What's the difference between curly and straight quotes? Are smart quotes safe to use in code or URLs? Does this upload my text? How do I convert curly quotes back to straight? What does SmartyPants do?

**Schema.org:** `WebApplication` (applicationCategory `Utility`, `offers` price 0) for the tool, `FAQPage` for the FAQ block, `BreadcrumbList` back to the tools hub.

**Internal links:** the existing curly→straight cleaner (reverse), the em-dash remover / dash explainer blog posts (`em-dash-vs-en-dash-vs-hyphen.md`, `how-to-type-an-em-dash.md`), the whitespace/line-break fixer, and the case converter (sibling publishing-polish tools).

## 10. Build effort & priority
**Effort: Med (roughly 2–3 dev-days for a credible v1).** The educate algorithm itself is short (~150 lines of regex passes) and the dash/ellipsis/Unicode constants already exist in `src/lib/cleaner.ts` — the work is mostly the inverse of code already written. The added cost over a naive clone is the differentiators: the decade/contraction allow-list, prime detection, the preserve-guard tokenizer, change-highlighting, the "why this mark?" explainer, and per-character overrides.

**Dependencies on existing code:** reuse the `EM`/`EN` constants and the dash-handling structure from `cleaner.ts`; reuse the site's `Cleaner.astro` component shell, copy/clear/toast patterns, counters bar, dark mode, and privacy line. Build a new `educate.ts` alongside `cleaner.ts` exporting an `educate(input, opts)` with a `CleanResult`-style counts object, so both tools share UI scaffolding.

**Recommended sequencing:**
1. Ship the core string `educate()` (directional quotes + dashes + ellipsis) reusing the existing component shell and counters — this alone matches the clones.
2. Add the correctness wedge: decade/contraction allow-list and prime detection with the toggle and spotlight chips — this is what earns the long-tail traffic and the "done right" H1.
3. Layer engagement: before/after highlighting, "why this mark?" explainer, per-character overrides, presets-to-localStorage, and the reverse-link to the existing curly→straight cleaner.
4. Cross-link from the dash blog posts and the case converter; add FAQ + schema. Because it inverts shipped logic and shares the UI, prioritize it early among Tier 2 tools.

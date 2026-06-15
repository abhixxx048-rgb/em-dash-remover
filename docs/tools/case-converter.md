# Case Converter

> Convert any text to UPPER, lower, Sentence, Title (style-guide aware: AP / Chicago / APA / MLA), aLtErNaTiNg, camelCase, snake_case and more — instantly, in your browser, with the casing actually done right. Tier: 1. Difficulty: Med. Runs: client-side (100%).

## 1. What it does
Takes pasted or typed text and re-cases it into any target format on demand: the four everyday cases (UPPER, lower, Sentence case, Title Case), style-guide-accurate title casing (AP vs Chicago vs APA vs MLA, each with its own small-word rules), the novelty cases (aLtErNaTiNg, InVeRsE, Capitalized Each Word), and the developer naming conventions (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case). The differentiator versus a naive `.toUpperCase()` clone is correctness: real sentence-boundary detection, proper-noun and acronym preservation, and genuine style-guide small-word lists rather than "lowercase every word under 4 letters." Everything runs in the browser, so nothing is uploaded.

## 2. Why users want it (demand & search)
**Target keywords (high, evergreen, transactional intent):**
- `case converter`, `convert case`, `text case converter` — the head terms; very high volume, dominated by convertcase.net and a long tail of clones. Competition high but the SERP rewards clean UX + speed.
- `title case converter`, `capitalize my title`, `title case generator` — high volume, strong commercial/utility intent. capitalizemytitle.com and titlecaseconverter.com own this.
- `uppercase to lowercase`, `lowercase converter`, `all caps converter` — high volume, dead-simple intent, easy to win with a fast page.
- `sentence case converter` — medium-high; people specifically arrive frustrated that Word/Docs only offers crude "Capitalize Each Word."
- `AP style title case`, `Chicago title case`, `APA title capitalization` — medium volume but high-value, low-competition long tail; editors and students.
- `camelCase converter`, `snake case converter`, `convert camelCase to snake_case`, `kebab case converter` — steady developer demand; separate audience that searches with code intent.
- `alternating case`, `mocking spongebob text`, `random case` — meme/novelty long tail, surprisingly high volume and very low competition.

**Who searches and when:** A marketer or blogger about to publish a headline and unsure how to capitalize it; a student formatting a paper title to APA/MLA; an editor checking a client's title against a house style; an ESL writer who pasted ALL CAPS or all-lowercase text and needs it fixed; a developer renaming variables/columns or building a URL slug; a teen making a mocking-meme caption. The moment is almost always "I have this text right now and need it re-cased before I paste it somewhere else."

**Sources found in research:** convertcase.net, capitalizemytitle.com, titlecaseconverter.com, titleformat.com, headlinecapitalization.com, grammarly.com, freedevtool.org, wordcounttool.com.

## 3. Target users & use cases
- **Bloggers / content marketers / SEO writers** — capitalize headlines and H2s consistently; check a title against AP (common newsroom/blog default) before publishing.
- **Students & academics** — format paper, essay, and reference titles to APA 7, MLA, or Chicago for assignments and citations.
- **Editors & proofreaders** — verify a manuscript's titles/headings match the chosen house style; quickly normalize a client's inconsistent casing.
- **ESL / non-native writers** — rescue text that was typed in all caps or all lowercase, or that over-capitalizes; get correct sentence case without guessing English rules.
- **Developers** — convert identifiers between camelCase / snake_case / kebab-case / CONSTANT_CASE when refactoring, naming DB columns/API fields, or generating URL slugs.
- **Social / meme creators** — aLtErNaTiNg "mocking" text, inverse case, novelty captions.
- **Data cleaners / ops** — normalize a column of names or product titles pasted from a spreadsheet.

## 4. Features — core (MVP)
1. **Single input box** with live, instant conversion as the user types or pastes (no "Convert" round-trip required for the basic cases).
2. **Core case buttons:** UPPER CASE, lower case, Sentence case, Title Case, Capitalized Case (every word), aLtErNaTiNg case, InVeRsE case.
3. **Style-guide selector for Title Case:** AP, Chicago (CMOS), APA 7, MLA — each applying its own small-word list and rules (see §7). Default to AP with a clear label.
4. **Developer cases:** camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case — correct tokenization across spaces/underscores/hyphens/camel boundaries.
5. **Sentence case done correctly:** capitalize first letter of each sentence (after `.`, `!`, `?`), standalone "i" → "I", and preserve existing proper nouns/acronyms rather than flattening everything to lowercase.
6. **Title case small-word handling:** always capitalize first and last word; lowercase articles/short prepositions/coordinating conjunctions mid-title per the selected style; capitalize the first word after a colon (subtitle).
7. **Proper-noun & acronym preservation toggle:** keep NASA, iPhone, JavaScript, New York intact instead of "Nasa" / "Iphone."
8. **Live counters:** characters, words, sentences, lines — updated in real time.
9. **One-click Copy to clipboard** and **Clear**.
10. **Output reflects the active case** with an obvious indication of which mode is selected.

## 5. Features — engagement & helpfulness (what makes users love it & stay)
1. **Instant live conversion (no submit button)** — re-cases on every keystroke/paste so the tool feels alive and zero-friction; the user sees the result before they finish reading the button labels.
2. **Active-mode highlighting + sticky last choice** — the selected case button stays visually active and is remembered in `localStorage`, so a repeat visitor's preferred style (e.g. Chicago title case) is pre-selected next time. Removes the #1 annoyance of re-picking your style every visit.
3. **Real-time counters bar (chars / words / sentences / reading time)** — doubles the tool as a quick word counter, a top reason people stay on capitalizemytitle.com; reading-time adds a small "useful surprise."
4. **"Why this casing?" explainer panel** — for Title Case, a collapsible note that shows *which words were lowercased and why* ("'with' is capitalized in AP but lowercase in Chicago because it's a 4-letter preposition"). This is the education hook that fits the brand ("quality, not bypass") and builds trust that we got it right.
5. **Before/after diff view (toggle)** — highlights exactly which characters changed case, so editors can sanity-check the transformation rather than trusting a black box.
6. **One-click Copy with confirmation toast** + auto-select on focus — copying is the terminal action for 95% of users, so make it a single tap with clear "Copied!" feedback.
7. **Download as .txt** for long documents, matching competitor parity and serving the data-cleaning audience.
8. **Share link / "open with this text"** — encodes mode (not the text) in the URL so a teacher can hand students a link pre-set to APA title case.
9. **Undo / redo (Ctrl+Z / Ctrl+Y)** — since conversions are destructive (you can't recover original casing from UPPERCASE), an undo stack prevents the "I lost my proper nouns" frustration.
10. **Keyboard shortcuts** — e.g. Ctrl+Shift+U (upper), Ctrl+Shift+L (lower), Ctrl+Shift+T (title), plus a `?` overlay listing them; power users (devs, editors) convert dozens of strings and love not reaching for the mouse.
11. **"Try an example" / demo button** — fills the empty box with a messy sample title so first-time visitors immediately see what the tool does (great for the empty state and for demonstrating AP-vs-Chicago differences side by side).
12. **Custom dictionary / "always keep these as-is" terms** — user adds brand names or acronyms (e.g. `iOS`, `OpenAI`, their product name) saved to `localStorage` so casing is never mangled. This is the stickiness feature: once you've taught it your terms, you come back.
13. **AP vs Chicago side-by-side compare mode** — show the same title rendered in all four style guides at once so the user can pick; uniquely helpful for "which is even right?" searchers and a strong SEO/education differentiator.
14. **Straight-quotes / smart-quotes toggle and trim-extra-spaces option** — small cleanups that tie into the existing em-dash-remover engine; lets the tool fix the *other* things wrong with pasted text.
15. **Dark mode** (respects `prefers-color-scheme`) and full **mobile-first layout** — big tap targets, sticky copy button, no horizontal scroll; a large share of casual case-conversion traffic is mobile.
16. **Accessible, no-color-only feedback** — active mode shown by label/border + ARIA, counters announced via `aria-live`, full keyboard operability; broadens the audience and is a quiet quality signal.
17. **Privacy reassurance line** — "Your text never leaves your browser" with a one-line "how we know" link, reinforcing the site-wide brand hook and converting privacy-conscious users.

## 6. UX / UI notes
**Layout:** Single column on mobile, two-pane optional on desktop (input left, output right) or a single in-place transform box like convertcase.net. A horizontal row of case buttons sits directly above the box; the Title Case button reveals the style-guide selector (AP/Chicago/APA/MLA) and the compare toggle. Counters live in a thin bar under the box. Copy / Download / Clear / Share are a clearly grouped action row.

**States:**
- *Empty:* placeholder microcopy ("Paste or type your text…") plus a "Try an example" chip and a one-line description of what each case does on hover/tooltip.
- *Typing/processing:* conversion is synchronous and instant for normal text; for very large pastes (>50k chars) show a subtle inline spinner and debounce.
- *Result:* output styled distinctly; "Copied!" toast on copy; diff highlights available on toggle.

**Microcopy tone:** plain, friendly, confident, lightly educational — never "beat the detector." Example: "Title Case (AP style) — capitalizes the important words, lowercases the little ones."

**Mobile:** sticky bottom Copy button, full-width case buttons in a scrollable/ wrapped grid, large 44px+ targets, no hover-only affordances.

**Accessibility (WCAG 2.1 AA):** every mode toggle reachable by keyboard with visible focus; selected state conveyed by text/icon + ARIA-pressed, not color alone; counters in an `aria-live="polite"` region; contrast ≥ 4.5:1 in both themes; explainer panels are real `<details>`/disclosure widgets.

## 7. Technical implementation (client-side)
**All processing is synchronous JS in the browser — no server, no LLM, preserving the privacy story.**

**Core transforms:**
- UPPER / lower: locale-aware `String.prototype.toLocaleUpperCase()/toLocaleLowerCase()` (handles Turkish dotted-i, German ß edge cases better than the plain versions).
- Capitalized Case: split on whitespace, uppercase first letter of each token.
- Alternating / Inverse: per-character; for alternating, track a parity counter that advances only on letters; inverse swaps each letter's case.

**Sentence case:** split on sentence-ending punctuation using a regex that respects abbreviations and decimals where feasible (`/([.!?]+)\s+/`), capitalize first alphabetic char of each segment, lowercase the rest *except* tokens flagged as proper nouns/acronyms. Special-case standalone `i` → `I` (and `i'm`, `i'll`, `i've`, `i'd`).

**Title case (the hard part):**
- Tokenize on whitespace, keeping punctuation attached.
- Maintain per-style small-word sets:
  - **Articles (all styles lowercase):** a, an, the.
  - **Coordinating conjunctions (all lowercase):** and, but, for, nor, or; AP also lowercases `yet`, `so`; **Chicago capitalizes `yet`, `so`**.
  - **Prepositions:** Chicago lowercases all prepositions regardless of length; **AP capitalizes prepositions of 4+ letters** (From, Into, With) and lowercases ≤3-letter ones (of, in, to, at, on, for, off).
  - `to`: AP capitalizes in infinitives; Chicago keeps lowercase. `as`: AP always lowercase; Chicago capitalizes when used as an adverb.
  - **APA 7:** lowercase articles, short (≤3-letter) prepositions, and `and/but/for/nor/or`; capitalize first word after a colon and any word of 4+ letters.
  - **MLA:** lowercase articles, coordinating conjunctions, and prepositions of any length; capitalize first/last.
- **Always capitalize:** first word, last word, and the first word after a colon (subtitle) across all styles.
- **Hyphenated compounds:** split on `-`, treat each part as its own word against the small-word list — AP capitalizes both parts ("Self-Care", "State-of-the-Art"), Chicago typically capitalizes only the first part ("Self-care"). Make this style-conditional.
- **Acronym/proper-noun preservation:** maintain a bundled dictionary (~a few thousand entries: NASA, iPhone, JavaScript, PostgreSQL, iOS, New York, Los Angeles, etc.) plus the user's custom `localStorage` terms; words already containing internal capitals (iPhone, eBay) or all-caps acronyms (NASA, SQL) are left untouched and never down-cased.

**Developer cases — tokenization is the crux:**
- Normalize input into word tokens by splitting on spaces, `_`, `-`, `.`, and camelCase boundaries. The boundary regex must handle acronym runs: insert a split between a lowercase→uppercase transition AND between an uppercase-run and a following Uppercase+lowercase (`XMLParser` → `XML`, `Parser` → `xml_parser`, **not** `x_m_l_parser`). Regex pattern along the lines of `/([a-z0-9])([A-Z])/g` and `/([A-Z]+)([A-Z][a-z])/g`.
- Re-emit tokens per target: camelCase (first token lower, rest capitalized), PascalCase (all capitalized), snake_case (lowercase + `_`), kebab-case (lowercase + `-`), CONSTANT_CASE (upper + `_`), dot.case (lowercase + `.`). Battle-tested reference: the `change-case` family of npm packages (`camelCase`, `snakeCase`, etc.) — small (~1–2 KB each, tree-shakeable) and well-tested; can vendor the logic to avoid a dependency.

**Libraries / size:** title-case rules can be hand-rolled (a few hundred lines + word lists) or borrow ideas from `title-case`/`titlecase` npm packages; for dev cases, `change-case`. Keep total JS small; the proper-noun dictionary is the heaviest asset — ship it lazily / gzipped (a 3k-entry list compresses to a few KB).

**Edge cases & failure modes:** Unicode/diacritics (use locale-aware methods, normalize with NFC); emoji and combining marks (skip in case logic, don't break the parity counter); all-caps input → Title Case must lowercase the body first *then* re-apply rules (otherwise everything stays caps); numbers and standalone punctuation tokens; mixed-language text; very long single tokens (URLs) in dev-case mode; empty/whitespace-only input.

**Performance:** All transforms are O(n) single passes; debounce live conversion at ~50–100 ms and process on input. For pastes over ~50–100k chars, chunk or move the heavy title-case pass to a Web Worker so the UI thread stays responsive — still 100% client-side.

**Server/LLM:** none required. Optional future "smart proper-noun detection" could use an LLM, but that would break the privacy promise, so keep it off by default and clearly opt-in if ever added.

## 8. Competitors & how we differentiate
- **convertcase.net** — the market leader; broad case list, counters, dark mode, extensions, 13 languages. Weakness: ad-heavy, its Title Case is a single generic mode (no explicit AP/Chicago/APA/MLA picker), and it's a standalone single-purpose site with no education or privacy angle.
- **capitalizemytitle.com** — best-in-class title casing (APA/Chicago/AP/MLA/Bluebook/AMA/NYT/Wiki), counters, custom dictionary, headline scoring. Weakness: cluttered with logins, premium upsell (CMT+), AI generators, and ads; heavy page; mixes too many unrelated tools.
- **titlecaseconverter.com** — accurate, ~3,000-proper-noun dictionary, multi-style. Weakness: narrow (title case only), utilitarian UX, no developer cases or broader cleanup.
- **freedevtool.org / appdevtools.com case converters** — strong on camelCase/snake_case/kebab-case for devs. Weakness: dev-only, no style-guide title casing, no writing audience.

**Our wedge:**
1. **Privacy as a first-class promise** — provably client-side, no ads, no signup; none of the leaders lead with this.
2. **Both audiences in one credible tool** — writer cases (style-guide-accurate title casing) *and* developer cases, without the bloat of capitalizemytitle.com.
3. **Education over black box** — the "why this casing?" explainer and AP-vs-Chicago compare mode teach the user, matching the site brand ("clean writing for real quality, keep your human voice").
4. **Consolidation with the existing suite** — reuse the em-dash/quote/whitespace cleanup engine so the Case Converter also fixes smart quotes and stray spacing in one pass, which no single competitor does.

## 9. SEO & page structure
**Primary keyword:** case converter. **Secondary:** title case converter, AP style title case, Chicago title case, sentence case converter, uppercase to lowercase, camelCase to snake_case converter, capitalize my title.

**H1/H2 outline:**
- `H1: Case Converter — UPPER, lower, Sentence & Title Case (AP, Chicago, APA, MLA)`
- `H2: How to use the case converter` (3 steps)
- `H2: Title case rules by style guide` (AP vs Chicago vs APA vs MLA, with the small-word lists and examples — captures the long-tail style queries)
- `H2: Sentence case vs Capitalized Case` (the common confusion)
- `H2: Developer cases: camelCase, snake_case, kebab-case, CONSTANT_CASE`
- `H2: Why our converter gets capitalization right` (proper nouns, acronyms, hyphenated words)
- `H2: Privacy — everything runs in your browser`
- `H2: FAQ`

**FAQ ideas:** Is "and" capitalized in a title? What's the difference between AP and Chicago title case? Does this work offline / is my text uploaded? How do I convert camelCase to snake_case? Why does Word's "Capitalize Each Word" get titles wrong? How do I capitalize after a colon? Does it keep brand names like iPhone correct?

**Schema.org:** `WebApplication` (applicationCategory: `Utility`/`BusinessApplication`, `offers` price 0) for the tool itself, plus `FAQPage` for the FAQ block, and `BreadcrumbList` linking back to the tools hub.

**Internal links:** to the main Em Dash Remover (cleanup pipeline), and sibling Tier-1 tools (text/word counter, whitespace cleaner, smart-quote fixer, AI-tell scanner). Cross-link the title-case explainer section to a dedicated "AP vs Chicago title case" article for topical authority.

## 10. Build effort & priority
**Effort: Medium.** The plumbing (input box, live counters, copy/download, dark mode, localStorage, layout) is largely shared infrastructure with the existing single paste-box site and can be reused directly. The two real work items are (a) the style-guide title-case engine with correct small-word lists and hyphen handling, and (b) the proper-noun/acronym dictionary + custom-terms feature. Developer cases are low-effort via vendored `change-case`-style logic.

**Dependencies on existing code:** reuse the current curly→straight quote, ellipsis, whitespace, and invisible-char cleanup functions (offered here as optional toggles); reuse the site's component shell, theme, and clipboard/toast utilities.

**Recommended sequencing:**
1. Ship core cases + live counters + copy/download (1–2 days; mostly reuse) — this alone ranks for the head terms.
2. Add the AP/Chicago/APA/MLA title-case engine + explainer + compare mode (the differentiator; 2–3 days incl. word-list tuning).
3. Layer proper-noun dictionary + custom-terms localStorage (1 day).
4. Add developer cases (half day, vendored logic).
5. Polish: keyboard shortcuts, undo/redo, diff view, share link, accessibility audit.

This is a strong Tier-1 first build: high evergreen search demand, heavy reuse of existing cleanup code, and a clear privacy + education wedge against bloated incumbents.

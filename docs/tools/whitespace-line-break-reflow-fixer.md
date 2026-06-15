# Whitespace & Line-Break Reflow Fixer

> Collapse runaway spaces, strip trailing whitespace, drop blank lines, and intelligently unwrap hard-wrapped PDF/email text back into clean paragraphs — including rejoining hyphen-split words — entirely in your browser. Tier: 1. Difficulty: Med. Runs: client-side (100%).

## 1. What it does
Takes pasted or typed text that has been mangled by copying out of a PDF, email client, code comment, or fixed-width terminal and reflows it into clean, readable prose. It collapses multiple spaces/tabs to single spaces, trims trailing and leading whitespace, normalizes Unicode space variants (NBSP, narrow NBSP, ideographic space, etc.) to plain spaces, and limits or removes blank lines. The differentiating piece is **reflow/unwrap**: it uses hard-wrap-detection heuristics to tell a *soft* line break (one a PDF/editor inserted just to fit the margin) from a *hard* one (a real paragraph or list boundary), removes only the soft ones, and stitches the fragments back into paragraphs — including rejoining words that were hyphen-split across a line break (`infor-\nmation` → `information`). Everything runs locally; nothing is uploaded.

## 2. Why users want it (demand & search)
**Target keywords (very high, evergreen, transactional/utility intent):**
- `remove line breaks`, `line break remover`, `remove line breaks online`, `delete line breaks` — the head terms; very high volume, dominated by textfixer.com, linebreakremover.com, removelinebreaks.net. Competition high but the SERP rewards a clean, fast, ad-light page.
- `fix pdf line breaks`, `remove line breaks from pdf copy`, `copy from pdf removes line breaks` — high-intent, frustration-driven; the user has just hit the problem and wants it solved *now*. Strong supporting blog/SERP demand (linebreakremover.com publishes a whole guide on "why copying from PDFs creates line breaks").
- `remove extra spaces`, `remove double spaces`, `collapse multiple spaces`, `normalize whitespace`, `whitespace remover` — separate, also-high cluster owned by miniwebtool, textcleaner.io, freetexttools, codeshack, orbit2x.
- `remove blank lines`, `empty line remover`, `remove blank lines from text` — steady; textfixer ships a dedicated "Empty Line Remover" page, signalling standalone demand.
- `unwrap text`, `text unwrapper`, `join wrapped lines`, `rejoin paragraphs` — lower volume, lower competition long tail; the people who search this are the ones who *understand* the soft-vs-hard distinction and want the smart version, not a dumb "strip all newlines."
- `remove hyphen line break`, `rejoin hyphenated words pdf`, `de-hyphenate text` — niche but very underserved; almost no single-purpose tool nails this, and PDF copy is where it bites hardest (one source estimates hyphenation causes ~40–50% of text corruption during PDF copy-paste).
- `clean up text from email`, `fix skinny column text` — the email/quoted-reply variant of the same pain.

**Who searches and when:** A student or researcher who just copied a quote or a block of references out of a PDF journal article and pasted a fragmented mess into Word/Docs; a marketer or VA who pulled copy out of a PDF brand guide or a forwarded email with `>` quote markers and broken 72-column wrapping; a developer who copied a wrapped log/comment/commit message; an ESL writer cleaning a document before submitting; anyone who pasted from a narrow-column source and got a "skinny column" with a break at the end of every line. The moment is almost always reactive: "I have this broken text in my clipboard right now and need it readable before I paste it onward."

**Sources found in research:** textfixer.com, linebreakremover.com (incl. their PDF line-break explainer), removelinebreaks.net, miniwebtool.com, textcleaner.io, freetexttools.org, gillmeister-software.com, gptcleanup.com, and the Medium "Building a Text UnWrapper" feature-engineering writeup that catalogs the join/don't-join signals.

## 3. Target users & use cases
- **Students & academics / researchers** — paste quotes, abstracts, and reference lists copied out of PDF papers or e-books; need the soft line breaks gone but paragraph and list structure kept, plus hyphen-split words rejoined.
- **Content marketers / VAs / SEO writers** — clean copy lifted from PDF brand guides, slide decks, or forwarded emails before dropping it into a CMS or Doc.
- **Editors & proofreaders** — normalize a client's inconsistently-spaced, double-spaced-after-period, NBSP-riddled manuscript into uniform single-spaced prose.
- **Developers / data folks** — un-wrap copied log lines, code comments, YAML/Markdown blobs, or commit messages; collapse stray tabs/spaces; strip trailing whitespace that breaks diffs.
- **ESL / non-native writers** — rescue documents where copy-paste introduced odd spacing and line fragmentation they can't easily see.
- **Email power users / support agents** — strip `>` quote markers and the 72-/76-column hard wrapping out of forwarded/replied plain-text email into a clean paragraph.
- **Anyone pasting into a width-sensitive field** — social post composers, form fields, or chat where stray newlines submit early or look broken.

## 4. Features — core (MVP)
1. **Single paste/type input box** with a paired output area, processing on input (debounced) — no mandatory "Run" round-trip for the common path, but a visible **Fix / Reflow** button for clarity and for re-running after option changes.
2. **Collapse multiple spaces** → single space, and **collapse multiple tabs**; option to convert tabs→spaces (configurable width) or leave tabs alone.
3. **Trim trailing whitespace** on every line, and **trim leading whitespace** (with an option to preserve indentation for code/lists).
4. **Blank-line control:** three modes — *keep as-is*, *collapse runs of blank lines to a single blank line* (default), or *remove all blank lines*.
5. **Smart Reflow / Unwrap (the headline feature):** detect and remove *soft* line breaks within a paragraph while preserving *hard* paragraph breaks, joining wrapped fragments with a single space. Driven by the §7 heuristics (line length, terminal punctuation, next-line capitalization, indentation, list/quote markers).
6. **Rejoin hyphen-split words:** when a line ends in a word-char + hyphen and the next line begins with a lowercase word-char, join them and drop the hyphen (`infor-\nmation` → `information`); leave genuine hyphenated compounds and ranges intact.
7. **Unicode whitespace normalization:** map NBSP (U+00A0), narrow NBSP (U+202F), figure/thin/hair/em/en spaces (U+2000–U+200A), ideographic space (U+3000), and line/paragraph separators (U+2028/U+2029) to ordinary space or newline; strip zero-width (U+200B/U+FEFF) (delegating deep invisible-char work to the sibling inspector).
8. **Newline normalization:** unify CRLF / CR / LF to a single chosen convention (default LF) so output pastes consistently.
9. **Email/markup pre-clean toggles:** strip leading `>` / `>>` quote markers and optional `|` gutter; this is the most common real-world reflow blocker.
10. **"Remove all line breaks" escape hatch:** the dumb-but-wanted mode (everything → one line, or one line per paragraph) for users who explicitly want it, matching textfixer/linebreakremover behavior.
11. **Live counters:** characters, words, lines, paragraphs, and blank-line count, before and after.
12. **One-click Copy**, **Download (.txt)**, and **Clear**.

## 5. Features — engagement & helpfulness (what makes users love it & stay)
This is the section that turns a commodity "strip newlines" page into a tool people bookmark and return to. Aim is *visible intelligence + zero friction + a little education*.

1. **Live before/after side-by-side (and a stacked view on mobile).** Original on the left, reflowed on the right, updating as you type/paste. Users instantly *see* the tool doing something smart rather than trusting a black box — this is the single biggest trust and stickiness lever and reinforces the brand's "provable transparency" hook.
2. **Inline change highlighting / mini-diff.** Tint the spots that changed — collapsed double-spaces, removed trailing space (shown as a faded marker), joined lines (a subtle "↩ removed" glyph), rejoined hyphens. Lets the user verify nothing real was destroyed. Ties directly into the existing **Before/After Diff Viewer** sibling for a deep-dive.
3. **A "what we changed" summary chip row.** After processing, show tappable counts: *"12 soft breaks removed · 3 hyphen-splits rejoined · 47 double-spaces collapsed · 5 blank lines dropped."* Each chip is clickable to scroll to/flash those changes. Concrete proof of value in one glance.
4. **Confidence + manual override on ambiguous joins.** Where the heuristic is unsure whether a break is soft or hard (e.g. a short line that *might* be a list item), mark it with a dotted underline and let the user toggle that one join with a click — power-users feel in control instead of fighting an over-eager algorithm. This is the honest answer to the well-documented fact that wrap conventions are inconsistent across documents.
5. **One-click presets / "recipes."** Named buttons that set all the toggles at once: **"PDF paste cleanup"** (reflow on, hyphen-rejoin on, collapse blanks, NBSP→space), **"Email cleanup"** (strip `>` quotes, reflow, dehard-wrap), **"Code-safe"** (trim trailing only, preserve indentation & blank lines, no reflow), **"Just collapse spaces,"** **"Remove all line breaks."** Removes the cognitive load of a dozen checkboxes and matches the mental model of *why* the user came.
6. **"Try an example" / demo buttons.** Pre-loaded messy samples (a fragmented PDF abstract with a hyphen-split word; a `>`-quoted email; a double-spaced manuscript) the user can load with one tap to see the tool work before pasting their own. Kills the empty-state cold-start and demonstrates the hard cases.
7. **Empty-state guidance.** When the box is empty, show a short "Paste text copied from a PDF or email here" prompt plus the example buttons and a one-line "Runs 100% in your browser — your text never leaves this page." Orientation + trust in the first second.
8. **Live counters with delta.** Characters / words / lines / paragraphs shown for *both* panes with the change (e.g. "Lines 142 → 18"). Satisfying, communicates impact, and doubles as a lightweight word-counter (cross-links to the **Word & Reading-Time Counter** sibling).
9. **Undo / redo and a "restore original" button.** One keystroke (Ctrl/Cmd-Z) or a button to revert if a reflow over-merged something. Lowers the stakes of experimenting, which keeps people on the page longer.
10. **Keyboard shortcuts.** Ctrl/Cmd-Enter to run, Ctrl/Cmd-C-from-output to copy result, Esc to clear, plus a discoverable "?" shortcuts overlay. Editors and devs who use this repeatedly will love it; signals "made by people who care."
11. **Copy / Download / Share.** One-click copy (with a "Copied!" toast), download as `.txt`, and a "copy as single line" variant for form/field pasting. Optional share-of-settings via URL hash (encodes the chosen recipe, *not* the text — preserves privacy) so a team can share "use these exact options."
12. **Educational tooltips — "why is this a soft break?"** Hover/tap any flagged change for a one-sentence explanation: *"PDFs add a line break at the page margin (a 'soft return'); this one had no ending punctuation and the next line continued mid-sentence, so it's safe to join."* Teaches the soft-vs-hard distinction the competitors only bury in a blog post, building authority and on-brand "quality not bypass" framing.
13. **Persistent options via localStorage.** Remember the user's last-used recipe and toggles (never the text) so a returning user is one paste away from their workflow. Big sticky-factor for repeat use; explicitly text-free to keep the privacy promise.
14. **Score/quality meter — "Cleanliness."** A small before/after meter (e.g. "Whitespace tidiness 38% → 99%") computed from ratios of double-spaces, trailing spaces, stray blank lines, and orphan-wrapped lines. Light gamification that gives a satisfying "fixed!" payoff and a reason to act.
15. **Dark mode + full responsive/mobile layout.** Stacked panes, big tap targets, sticky action bar on mobile; honors `prefers-color-scheme`. Matches the rest of the suite and respects the reality that a lot of "I copied from a PDF on my phone" traffic is mobile.
16. **Accessibility niceties.** All change signals carry a non-color cue (icon + label, not just a tint), the summary chips are real buttons with ARIA labels, live counters announce via `aria-live`, and the whole flow is keyboard-operable. Inclusive *and* it makes the "what changed" info legible to everyone.
17. **"Paste & auto-detect."** On paste, sniff the content (lots of `>` markers → email; trailing hyphens + short uniform line lengths → PDF wrap; tabs → code) and *suggest* the matching recipe with a dismissible banner ("Looks like PDF text — apply PDF cleanup?"). Feels magical and shortcuts the right outcome.

## 6. UX / UI notes
- **Layout:** Two-pane input/output (side-by-side on desktop ≥768px, stacked input-then-output on mobile) with a compact options bar between or above. A horizontal **preset/recipe row** sits on top as the primary entry point; advanced per-toggle controls live in a collapsible "Options" disclosure so the default surface stays calm.
- **Input/output model:** Live, debounced processing (~150–250ms) for responsiveness on normal-sized text; the explicit **Fix/Reflow** button both re-runs and serves as the affordance after changing options. Output is read-only-feeling but selectable; editing the input re-runs.
- **States:**
  - *Empty:* prompt copy + "Try an example" buttons + privacy one-liner.
  - *Processing:* for very large pastes, a subtle progress/spinner and a "processing N characters…" line; never block the UI (chunk or Web Worker — see §7).
  - *Result:* the change-summary chip row appears, counters fill in with deltas, copy/download enabled, cleanliness meter animates from before→after.
- **Microcopy tone:** plain, friendly, confident, lightly educational — never bypass/"beat the detector" framing. e.g. "Joined 12 wrapped lines into paragraphs," "Kept your bullet list intact." Explanations are one sentence, jargon-light (define "soft return" inline the first time).
- **Mobile behavior:** sticky bottom action bar (Fix · Copy · Clear), stacked panes, recipes as a horizontally scrollable chip strip, options behind a sheet. Large hit areas; the "Copy" button is thumb-reachable.
- **Accessibility (WCAG 2.2 AA):** no color-only signals (every change tint pairs with an icon/label); 4.5:1 contrast in both themes; full keyboard path; `aria-live="polite"` on counters and the summary; visible focus rings; respects `prefers-reduced-motion` for the meter animation. Textareas have real labels; recipe buttons announce their effect.

## 7. Technical implementation (client-side)
**100% in-browser, no server, no network call** — the whole thing is string processing, which keeps the privacy story airtight (mirror the existing `src/lib/cleaner.ts` pure-function pattern; add a `reflow.ts`).

**Pipeline (ordered, each step toggleable):**
1. **Newline normalization:** `text.replace(/\r\n?/g, '\n')` first, so all later logic sees only `\n`.
2. **Unicode whitespace normalization:** replace the space-like set with a normal space, and strip zero-width:
   - spaces → `' '`: `/[   -   　]/g`
   - line/paragraph separators → `\n`: `/[  ]/g`
   - zero-width / BOM removal: `/[​-‍﻿]/g`
   - Note: `\s` in JS does **not** match NBSP-class chars reliably across engines, so use the explicit ranges rather than relying on `\s`. (The deep invisible/watermark work stays in the sibling inspector; here we just neutralize whitespace.)
3. **Per-line trim:** split on `\n`; `trimEnd()` every line always; `trimStart()` only when "preserve indentation" is off.
4. **Tab handling:** optional `\t` → N spaces; or collapse `\t+`.
5. **Reflow / unwrap (the core heuristic).** Operate line-by-line deciding, for each line *i*, whether to **join** it with line *i+1* (replace the break with a space) or **keep the break** (paragraph boundary). Join signals (lean toward join) and keep signals (lean toward break), derived from the documented unwrapper feature set:
   - **Terminal punctuation:** current line ends in `. ! ? : ;` or a closing quote/paren following such → likely a real break → **keep**. Ends mid-clause (no terminal punct) → **join**.
   - **Next-line capitalization:** next line starts uppercase *and* current line ended in terminal punctuation → **keep**; lowercase start → strong **join**.
   - **Line length / fill:** if the current line is "full" (length near the document's dominant max line width, computed as a running modal/percentile of line lengths) it was probably soft-wrapped → **join**; a notably **short** line is likely an intentional break → **keep**.
   - **Remaining-space test:** if the current line's leftover width couldn't have fit the next line's first word, the break was forced (soft) → **join**.
   - **Structure markers — never join across these:** blank line (= paragraph break); a line that is/starts a **list item** (`^\s*([-*•‣◦]|\d+[.)]|[a-z][.)])\s`), a **Markdown heading** (`^#{1,6}\s`), a **blockquote** (`^>`), a **table** row (`|`), an indented **code block**, or a **horizontal rule**. These protect real structure — the #1 way naive tools wreck documents.
   - **Email quote depth change:** a change in leading `>` depth → **keep**.
   - Implement as a weighted score per boundary (sum of signal weights) with a threshold, exposing low-confidence boundaries to the §5.4 manual-override UI. A pure-heuristic scorer is the right call client-side; the SVM/ML approach from the research needs labeled training data and a model payload we don't want to ship for a marginal accuracy gain.
6. **Hyphen-split rejoin (run during/after reflow on joined boundaries):** when a line matches `/(\p{L})-$/u` and the next starts `/^(\p{Ll})/u`, join as `\1` + nextword with the hyphen removed. Guard against false positives:
   - don't merge if the result isn't plausibly a word (optionally validate against a small common-word/affix check, or simply require lowercase-after-hyphen which already excludes most compounds),
   - **don't** touch hyphens that are *not* at line end (real compounds like `well-known`),
   - leave number ranges (`2020-\n2021`) and `--`/em-dash sequences alone (defer dash semantics to the existing em-dash engine).
7. **Blank-line policy:** after reflow, apply the chosen mode — `replace(/\n{3,}/g, '\n\n')` to collapse runs to one blank line (default), or `replace(/\n\s*\n/g, '\n')` / drop-all for the other modes.

**Libraries:** none required — native `String`/`RegExp` with the `u` flag and `\p{...}` Unicode property escapes (supported in all current evergreen browsers) cover it. This keeps bundle weight at ~0 added KB beyond our own module, consistent with the existing zero-dependency cleaner. If we ever want richer Unicode classification, `Intl.Segmenter` is built-in (no payload).

**Performance / large text:** the line-by-line pass is O(n). For very large pastes (>~200k chars) move processing into a **Web Worker** so the main thread/UI never janks, and debounce live mode; render output progressively. Avoid catastrophic-backtracking regexes (the patterns above are linear/anchored). The diff/highlight view should virtualize or cap inline-highlight rendering for huge inputs (compute the summary counts always, render per-change markers lazily).

**Edge cases & failure modes:** poetry/verse and addresses (intentional short lines that look soft-wrapped) — protect via the short-line + manual-override path and a "Preserve line breaks in short lines" toggle; ASCII tables/ASCII art (don't reflow — code-safe recipe / table detection); mixed CRLF; tabs vs spaces in code; a single trailing hyphen that's actually a dash; RTL text (don't reorder, only normalize whitespace); already-clean text (must be a no-op — show "Nothing to fix ✓").

**Server/LLM:** none. No step needs a server or model; the entire value is deterministic string transformation, so the privacy promise ("runs entirely in your browser, your text never leaves this page") holds with no asterisk.

## 8. Competitors & how we differentiate
- **textfixer.com (Remove Line Breaks + Empty Line Remover)** — the category leader; does preserve-paragraph-breaks vs strip-all and an optional hyphen-join. Weaknesses: dated UI, ad-heavy, separate single-purpose pages, no before/after, no change summary, no education, no recipes.
- **linebreakremover.com** — client-side, has a genuinely good *explainer* on soft vs hard returns, but the tool itself is a basic strip-all-breaks box; the smart soft-vs-hard detection lives only in the blog, not the product.
- **removelinebreaks.net** — minimal "remove abnormal line breaks" box; little control, no transparency.
- **miniwebtool / textcleaner.io / freetexttools / codeshack / orbit2x / gptcleanup** — strong on the *whitespace* cluster (collapse spaces, trim, normalize) but treat reflow/unwrap and hyphen-rejoin as afterthoughts or skip them; mostly checkbox walls with no before/after, no confidence/override, no education.
- **gillmeister-software** — flexible replace-with-custom-string, but engineer-facing and unfriendly to the student/marketer.

**Our wedge:**
1. **Consolidation** — one page does the whole job (collapse spaces + trim + blank-line control + smart reflow + hyphen-rejoin + Unicode normalize), where competitors split it across pages or omit the hard parts.
2. **Smart, *transparent* reflow** — we ship the soft-vs-hard heuristic *in the product* with visible confidence, a per-join manual override, and inline "why" explanations — the thing linebreakremover only describes in a blog and nobody else exposes.
3. **Best-in-class hyphen-split rejoin** — a genuinely underserved pain (responsible for ~40–50% of PDF copy corruption) treated as a first-class feature with false-positive guards, not a hidden checkbox.
4. **Provable privacy** — 100% client-side with a visible "never leaves your browser" promise and text-free settings persistence; the on-brand differentiator the whole suite is built around.
5. **Quality, not bypass** — framed as "make pasted text clean and readable," consistent with "clean AI writing for real quality / keep your human voice," never "evade detection."
6. **Modern, accessible, ad-light UX** — before/after, change-summary chips, recipes, dark mode, keyboard shortcuts — versus the dated, ad-stuffed incumbents.

## 9. SEO & page structure
**Primary keyword:** `remove line breaks` (+ `line break remover`, `remove line breaks online`).
**Secondary / cluster keywords:** `fix pdf line breaks`, `copy from pdf removes line breaks`, `remove extra spaces`, `remove double spaces`, `normalize whitespace`, `remove blank lines`, `unwrap text` / `text unwrapper`, `rejoin hyphenated words`, `clean up text from email`.

**H1:** "Whitespace & Line-Break Reflow Fixer — Clean Up Messy PDF & Email Text"
**H2 outline:**
- "Paste your text" (the tool / above the fold)
- "Fix line breaks copied from a PDF" (targets the highest-intent query)
- "Remove extra spaces, tabs & blank lines"
- "Smart reflow: soft breaks vs hard paragraph breaks" (the differentiator + education)
- "Rejoin hyphenated words split across lines"
- "Clean up forwarded email text"
- "100% private — runs in your browser" (trust + brand)
- "How it works"
- "FAQ"

**FAQ ideas (also drive featured-snippet/`FAQPage` schema):**
- Why does copying from a PDF add line breaks after every line? (soft vs hard returns)
- How do I keep my paragraphs and bullet lists when removing line breaks?
- How do I rejoin words that were split with a hyphen at the end of a line?
- What's the difference between a soft return and a hard return?
- How do I remove double spaces / extra spaces from text?
- Is my text uploaded anywhere? (No — 100% in your browser.)
- How do I remove blank lines without removing paragraph breaks?

**schema.org:** `SoftwareApplication` (or `WebApplication`) for the tool with `applicationCategory: Utility` and `offers` price `0`, plus a `FAQPage` block for the FAQ, and `BreadcrumbList` linking back to the tools index.

**Internal links to sibling tools** (`/docs/tools/` set): **Before/After Diff Viewer** (verify every change), **Word & Reading-Time Counter** (the counters cross-sell), **Invisible / Watermark Character Inspector** (for the deep hidden-character story this tool only lightly touches), **Case Converter**, **Emoji & Decorative-Symbol Stripper**, and the main em-dash cleaner. Add a "Part of the Em Dash Remover suite" footer cluster.

## 10. Build effort & priority
**Effort: Medium (~3–5 focused days).** The whitespace/trim/blank-line/Unicode-normalize layer is a day of straightforward regex work that largely *reuses patterns already in* `src/lib/cleaner.ts`. The reflow heuristic + hyphen-rejoin + the manual-override UI is the real cost (~2–3 days): tuning signal weights, guarding false positives, and building the confidence/override interaction. The before/after + change-summary engagement layer can lean on the planned **Before/After Diff Viewer** component rather than being built from scratch.

**Dependencies on existing code:** extends the pure-function cleaner pattern (`src/lib/cleaner.ts` → new `reflow.ts`); reuses the `Cleaner.astro` paste-box component shell, the `Page.astro`/`Base.astro` layouts, counters, copy/clear, dark-mode, and consent/ad scaffolding already in the repo. Zero new runtime dependencies.

**Recommended sequencing:** Ship in two passes. **Pass 1 (MVP, ship fast):** the whitespace cluster (collapse spaces/tabs, trim, blank-line modes, Unicode normalize, newline normalize) + "remove all line breaks" + preserve-paragraphs + counters + copy/download — this alone already competes with textfixer/miniwebtool and captures the high-volume `remove line breaks` / `remove extra spaces` head terms. **Pass 2 (the wedge):** smart soft-vs-hard reflow, hyphen-split rejoin, confidence/manual override, recipes, paste auto-detect, and the before/after change-summary — the differentiators that win the long-tail PDF/email queries and earn the bookmarks. Build the **Before/After Diff Viewer** sibling first or in parallel, since this tool's best engagement features reuse it.

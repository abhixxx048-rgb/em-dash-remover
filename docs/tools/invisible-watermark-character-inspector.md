# Invisible / Watermark Character Inspector

> See every hidden Unicode character in your text - highlighted inline, labeled with its U+XXXX code and name - before you decide to strip it. Tier: 1. Difficulty: Med. Runs: 100% client-side.

## 1. What it does

The Invisible / Watermark Character Inspector takes pasted text and renders it back to the user with every non-printing, zero-width, or "look-alike whitespace" Unicode character made visible inline - each one boxed, color-coded, and tagged with its code point (e.g. `U+200B`), Unicode name (e.g. ZERO WIDTH SPACE), and a count. It is the "see it before you strip it" transparency layer that sits in front of the cleaner: instead of a black-box "we removed 7 invisible characters" message, the user sees exactly *what* was hiding, *where*, and *why it matters* (web-copy artifact vs. NBSP from a PDF vs. a suspected AI spacing tell vs. a bidi/Trojan-Source security risk). It is a diagnostic/forensic viewer first, with one-click cleanup as the natural next step.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with a demand/competition read):**

- `invisible character viewer` / `invisible character detector` - the head term; real, steady volume, but **high competition** (invisiblecharacterviewer.com, blanktextcopy.com, RapidToolSet all rank). We compete on quality of the *inspection* view, not on owning the head term day one.
- `hidden unicode characters checker` / `find hidden characters in text` - mid volume, **medium competition**, strong intent.
- `AI watermark checker` / `ChatGPT watermark detector` - **rising fast** (2025–2026 GPT-5 U+202F coverage), medium competition, very high intent. Strong topical hook for our brand.
- `U+202F detector` / `narrow no-break space checker` / `nnbsp in text` - **low competition, low-but-precise volume**, exactly the long-tail GPT-5 artifact searchers; easy to win.
- `zero width space remover` / `ZWSP detector`, `BOM remover U+FEFF`, `soft hyphen U+00AD finder` - long-tail, **low competition**, developer/editor intent.
- `bidi character detector` / `Trojan Source checker` / `right-to-left override U+202E` - niche security/dev long-tail, **low competition**, high authority value (links from dev audiences).
- `why does my text have weird spaces` / `invisible character in my essay` - informational long-tail; great FAQ/blog capture.

**Who searches and the moment they need it:** Someone who pasted AI output (or text from a PDF, Google Docs, Word, Notion, or a website) into a CMS, code editor, ATS résumé field, or assignment box, then saw broken spacing, a failed regex/diff, a flagged plagiarism scan, or just a vague worry that "ChatGPT leaves a fingerprint." The trigger is suspicion + a need for proof, not blind removal - which is exactly the gap a *viewer* (vs. a silent remover) fills.

**Source domains found in research:** invisiblecharacterviewer.com, originality.ai, aiwatermarkchecker.com, community.openai.com (GPT-5 U+202F bug thread), blanktextcopy.com, github.com (moracca/scan-unicode-attacks, dcondrey/unicode-safety-check), aws.amazon.com (Unicode character smuggling defense), embracethered.com (invisible prompt injection).

## 3. Target users & use cases

- **Writers / students / bloggers** pasting AI-assisted drafts who want to *confirm and clean* hidden artifacts before submitting - and to understand which ones are harmless vs. which look like AI tells (U+202F, ZWSP).
- **SEO / content marketers** publishing to a CMS where NBSP and zero-width chars break layout, word counts, or trip "AI content" filters; they want a clean, auditable paste.
- **Developers & code reviewers** scanning pasted snippets, config files, commit messages, or dependency text for bidi overrides (Trojan Source, CVE-2021-42574), homoglyph/PUA payloads, and Unicode Tag characters (U+E0000–E007F) used for ASCII smuggling / prompt injection.
- **Security / AppSec & prompt-injection-aware teams** auditing text that will be fed to an LLM agent for invisible instruction smuggling via variation selectors (U+FE00–FE0F, U+E0100–E01EF) and tag chars.
- **ESL / multilingual writers & translators** who legitimately use NBSP, NNBSP, and joiners and want to see them rather than blindly nuke meaningful characters.
- **Editors / publishers / typesetters** chasing why a line breaks oddly or fails a diff - distinguishing intentional typography (NNBSP, hair space) from junk.
- **Recruiters / ATS users & job seekers** checking résumés for invisible chars that break keyword parsing.

## 4. Features - core (MVP)

1. **Paste-and-inspect input box.** Large textarea / contenteditable; paste, type, or drag a `.txt`. Live (debounced) analysis as text changes - no "Analyze" button required (but provide one for screen-reader/explicit flow).
2. **Inline highlighted render.** A read-only output pane that re-renders the *exact same text* with each invisible character replaced by a visible pill/glyph (e.g. `␣`, `⏎`, a labeled chip) inserted *in place*, preserving surrounding visible text so the user sees position and context. Normal visible characters render normally.
3. **Per-character labeling.** Each detected char's pill is tagged with its `U+XXXX` code point and, on hover/focus, its official Unicode name + short plain-English description and category.
4. **Comprehensive detection set** (see §7 for ranges), grouped into categories:
   - Zero-width / format: U+200B–U+200D, U+2060 (word joiner), U+FEFF (BOM/ZWNBSP), U+00AD (soft hyphen), U+180E, invisible math operators U+2061–U+2064.
   - Look-alike whitespace: U+00A0 (NBSP), **U+202F (narrow no-break space - the GPT-5 tell)**, U+2000–U+200A (en/em/thin/hair spaces), U+205F, U+3000 (ideographic), U+2028/U+2029 (line/paragraph separators), tab/CR shown optionally.
   - Bidirectional controls: U+200E/U+200F, U+202A–U+202E, U+2066–U+2069 (flagged as **security risk**).
   - Variation selectors: U+FE00–U+FE0F and U+E0100–U+E01EF (smuggling vector).
   - Unicode Tag characters: U+E0000–U+E007F (ASCII-smuggling / prompt-injection vector).
   - Optionally: Private Use Area (U+E000–F8FF) and replacement char U+FFFD as "suspicious".
5. **Counts & summary table.** A legend table: Glyph | Name | Code point | Category | Count, sorted by count, with a grand total. Mirrors the existing `CleanResult.counts` shape so it slots into our codebase.
6. **One-click strip / clean.** "Remove all invisible," plus category-level toggles ("remove zero-width only," "convert NBSP/U+202F → normal space," "keep typography"). Reuses the existing `clean()` engine and its `INVISIBLES` regex.
7. **Copy cleaned text.** Copy-to-clipboard of the de-invisible'd output with a confirmation toast.
8. **100% client-side guarantee.** No network call; an explicit "nothing left your browser" badge (our brand hook).

## 5. Features - engagement & helpfulness (what makes users love it & stay)

This is the differentiating layer. The product wins not by removing characters but by *explaining and dramatizing* what was hidden.

1. **Live, debounced inline highlight (the "aha" moment).** As the user pastes, invisible chars pop into view instantly as colored chips. The visceral "whoa, there were 12 hidden things in my paragraph" reaction is the core hook and the most shareable moment. *Why:* turns an abstract worry into concrete, visible proof - the entire reason a viewer beats a silent remover.
2. **Hover/focus tooltips with plain-English "what & why."** Each chip shows not just `U+202F NARROW NO-BREAK SPACE` but a one-line "Often appears in GPT-5 output instead of a normal space; can break spacing in some apps." *Why:* education builds trust and makes the user feel smart, not scared.
3. **"Why this is a tell" education panel.** A collapsible explainer per category: web-copy artifact vs. AI spacing pattern vs. security risk vs. legitimate typography - with a clear, honest stance ("these are most likely training artifacts, not a real watermark - and trivially removable"). *Why:* matches our "quality, not bypass" brand and avoids fear-mongering competitors get wrong.
4. **Cleanliness score / meter.** A 0–100 "text hygiene" gauge (or a simple "Clean / 3 minor / 12 hidden / security risk" badge ladder) that turns red→amber→green as the user cleans. *Why:* gamified, glanceable feedback that gives a satisfying "make it green" goal and a reason to re-run.
5. **Animated before/after toggle.** A switch to flip the output between "Show invisibles" and "Cleaned preview," with a subtle highlight-fade animation on removed chars. *Why:* shows the payoff of cleaning and reassures that visible text is untouched.
6. **Category toggle chips with live recount.** Click "Bidi", "Zero-width", "NBSP/spaces", "Tags" to show/hide each class; counts update live. *Why:* lets power users focus (devs care about bidi; writers care about U+202F) without clutter.
7. **Click-to-jump / next-match navigation.** Up/down arrows or "next" to scroll the input cursor to each detected character; keyboard `Enter`/`n` to cycle. *Why:* in long documents, finding *where* the char is matters as much as the count.
8. **One-click example/demo buttons.** "Load GPT-5 sample (U+202F)", "Load a Trojan-Source snippet", "Load a zero-width-watermarked paragraph", "Load clean text". *Why:* instant empty-state value, demonstrates capability, and is great for SEO dwell time.
9. **"Paste from clipboard" button + drag-drop file.** Reduces friction on mobile and for non-keyboard users. *Why:* the whole task starts with a paste; make it one tap.
10. **Copy / download / share.** Copy cleaned text; download as `.txt`; "copy report" (a shareable plaintext summary like "Found 12 hidden chars: 8× U+202F, 3× ZWSP, 1× BOM"). *Why:* lets editors/devs hand off findings; the report text is naturally viral.
11. **Undo / restore original.** A single "Restore pasted text" so a user who cleaned too aggressively (e.g. removed meaningful NBSP) can revert. *Why:* removes the fear of destructive action - critical when some invisibles are legitimate.
12. **Keyboard shortcuts.** `Cmd/Ctrl+V` auto-analyzes, `Cmd/Ctrl+C` copies cleaned, `Cmd/Ctrl+Z` undo, `n`/`p` next/prev match, `Esc` clears. Show a `?` shortcuts overlay. *Why:* makes repeat/power use fast and sticky.
13. **Persistent preferences (localStorage).** Remember category toggles, "show normal spaces/tabs," dark mode, and last-used cleanup preset - never the text itself (privacy). *Why:* returning users land in their preferred config instantly.
14. **Dark mode + high-contrast highlight palette.** Chips legible in both themes; uses shape + label, not color alone. *Why:* comfort, accessibility, and trust signal.
15. **Empty-state guidance.** When the box is empty: a short "Paste any text to reveal hidden Unicode" with the demo buttons and a 1-line privacy promise. *Why:* removes the blank-canvas paralysis and sells the value before first paste.
16. **"Looks clean" celebratory state.** When zero invisibles are found, show a green all-clear with a gentle confirmation ("No hidden characters detected - your text is clean"). *Why:* a positive result is still a valuable answer; rewarding it encourages re-use.
17. **Severity coloring with legend (not color-only).** Red = security (bidi/tags), amber = likely AI/space tell (U+202F/NBSP), grey = benign artifact (ZWSP/BOM) - each also iconed and labeled. *Why:* helps users triage what to actually care about.
18. **Mobile niceties.** Sticky bottom action bar (Paste / Clean / Copy), large tap targets, horizontal-scroll-safe chips, and a collapsible summary table. *Why:* most "I just pasted from ChatGPT on my phone" sessions are mobile.

## 6. UX / UI notes

**Layout (desktop):** Two-pane. Left = editable input textarea; right = the inline-highlighted render. Above: a slim toolbar (Paste, Load example ▾, theme, shortcuts `?`). Below the render: the cleanliness score badge, category toggle chips, and the legend/counts table. A primary "Clean text" button with category sub-options, then Copy / Download / Restore. On narrow screens the panes stack (input → highlighted render → summary → actions) with a sticky action bar.

**Input/output model:** Single source of truth = the input text. The highlighted render is a derived, read-only view (re-render on debounced change, ~120ms). Cleaning produces a new candidate output the user can preview (before/after toggle) and accept (copy/download) - the input itself is not mutated until the user clicks "Apply to input," and "Restore original" always returns the first-pasted version.

**States:** *Empty* - guidance + demo buttons + privacy line. *Processing* - for very large pastes, a lightweight "Scanning…" shimmer (analysis is chunked/async so the UI never freezes). *Result (clean)* - green all-clear. *Result (found)* - chips + score + table; security category, if present, is pinned to the top with a "⚠ security risk" banner. *Error* - only really applies to file drops (unsupported/binary file → friendly message).

**Microcopy tone:** Calm, transparent, expert-but-friendly. Explain, don't alarm. We explicitly say invisible chars are "most likely artifacts, easily removed - not a secret watermark," matching the brand's "real quality, keep your human voice, not beat-the-detector" stance.

**Accessibility (WCAG 2.2 AA):** No color-only signals - every chip carries an icon + visible `U+XXXX` label + text category, and the legend repeats the mapping. Tooltips are keyboard-focusable and announced via `aria-describedby`. The highlighted render exposes each chip with an `aria-label` ("Zero width space, U plus 200B, position 42"). Full keyboard operation, visible focus rings, contrast ≥ 4.5:1 in both themes, respects `prefers-reduced-motion` (disable fade animations), and the live count summary uses an `aria-live="polite"` region.

## 7. Technical implementation (client-side)

**Detection core.** A single pass over the string by code point (`for...of` / `Array.from` to be surrogate-safe), classifying each into a category map. Build the matcher from explicit ranges rather than one opaque regex so categories and tooltips stay data-driven:

- Zero-width/format: `​-‍`, `⁠`, `﻿`, `­`, `᠎`, `⁡-⁤`.
- Look-alike whitespace: ` `, ` `, ` - `, ` `, `　`, ` `, ` ` (and optionally `\t`, ``, ``).
- Bidi controls: `‎`, `‏`, `‪-‮`, `⁦-⁩`.
- Variation selectors: `︀-️` and the astral `\u{E0100}-\u{E01EF}` (needs the `u` flag).
- Tag characters: `\u{E0000}-\u{E007F}` (astral; `u` flag mandatory - these are the ASCII-smuggling / prompt-injection vector).
- Optional suspicious: PUA `-`, `�`.

Represent each as a data record `{ cp, name, category, severity, note }`. Names/notes ship as a static JSON map (a few hundred entries - small, no dependency). The existing `src/lib/cleaner.ts` already defines an `INVISIBLES` regex and counting logic; extend/refactor it into a shared `lib/invisibles.ts` that both the cleaner and this inspector import, so detection stays consistent across tools.

**Rendering inline.** Walk the string; emit visible runs as text nodes and each flagged code point as a `<span class="chip chip--{category}" data-cp="202F" tabindex="0" aria-label="…">U+202F</span>`. Build via DOM/DocumentFragment (or a framework's keyed list) - **never `innerHTML` with user text** (XSS). Astral chars (tags/variation selectors) must be iterated by code point so a single chip represents one character, not two surrogate halves.

**Libraries / size.** No heavy dependency needed. Unicode name lookups can be a hand-curated JSON of the ~150–250 relevant code points (a few KB) rather than pulling a full UCD package (`@unicode/unicode-*` data is megabytes - avoid). Optional: `unicode-properties` only if we want general-category fallback, but the curated table is lighter and gives better plain-English notes.

**Performance / large text.** Linear `O(n)` single scan. For very large inputs (>~100k chars) chunk the work with `requestIdleCallback` / a Web Worker so the main thread stays responsive, and virtualize the highlighted render (only render chips for the visible viewport region, or cap the rendered preview while still reporting full counts). Debounce input ~120ms.

**Edge cases & failure modes:** combining marks and emoji ZWJ sequences (U+200D is *legitimate* inside emoji - flag but label "joins emoji; removing may break 👨‍👩‍👧"); variation selectors that are legitimate emoji presentation (U+FE0F) vs. smuggling - note the ambiguity rather than asserting malice; NBSP/NNBSP that are *intentional* typography for ESL/French text - never auto-strip without user consent; surrogate pairs and lone surrogates; mixing tabs/CR display as an opt-in to avoid noise; soft hyphen inside hyphenated PDF text.

**Server/LLM:** none required, and that is the point. The full inspect + clean runs in-browser with zero network calls, preserving the provable-privacy brand. We deliberately do *not* claim to detect probabilistic model watermarks (e.g. Google SynthID Text) - those need model internals/keys and cannot be done client-side; we state this honestly in the explainer to set correct expectations.

## 8. Competitors & how we differentiate

**Real competitors found:** invisiblecharacterviewer.com (strong inline view + legend table, but oriented toward *copying* blank chars for social media, cluttered with Discord/TikTok use cases, no AI/security framing); originality.ai invisible-text tool (good 87-codepoint coverage and an honest "not a watermark" stance, but it's a lead-gen page behind a detection brand); aiwatermarkchecker.com (thin - "Analyze Text" button with no methodology, scoring, or highlighting shown); blanktextcopy.com and RapidToolSet (functional detectors, generic tool-farm UX, weak education); humanwritesai / watermarkscan / getgpt (fear-led "beat the detector" framing).

**Their weaknesses:** (a) copy-a-blank-character clutter that dilutes the *inspection* job; (b) fear/bypass framing that misleads users about watermarks; (c) silent removal with little explanation of *what* or *why*; (d) thin or absent security/bidi/tag coverage; (e) no honest "this is an artifact, not a watermark" education; (f) ad-heavy tool-farm UX and uncertain privacy.

**Our wedge:** (1) **Provable privacy** - 100% client-side, no network, as a verifiable brand promise. (2) **Inspection + education first** - the richest "see it, understand it, then decide" experience, with the "why this is a tell" panel. (3) **Security-grade coverage** - bidi/Trojan-Source, tag chars, variation-selector smuggling that writer-focused tools ignore, capturing the dev/AppSec audience and their links. (4) **Honest positioning** - "real quality, keep your human voice," explicitly *not* "beat the AI detector," which differentiates from the fear-led pack. (5) **Suite consolidation** - shares the same engine as the em-dash cleaner and AI-tell scanner, so a user flows inspect → clean → check in one trusted place.

## 9. SEO & page structure

**Primary keyword:** invisible character viewer / detector. **Secondary:** hidden unicode characters checker, AI watermark checker, U+202F (narrow no-break space) detector, zero width space remover, BOM / soft hyphen finder, bidi / Trojan Source character checker, ChatGPT invisible characters.

**H1/H2 outline:**
- **H1:** Invisible & Watermark Character Inspector - See Hidden Unicode Before You Strip It
- **H2:** Paste your text to reveal hidden characters (the tool)
- **H2:** What counts as an "invisible character"? (categories table: zero-width, NBSP/U+202F, bidi, variation selectors, tag chars)
- **H2:** Is this a ChatGPT/GPT-5 watermark? (honest explainer: artifacts vs. watermark, SynthID caveat)
- **H2:** Security risks: bidi overrides, Trojan Source, ASCII smuggling
- **H2:** How to remove invisible characters safely (and when to keep them)
- **H2:** 100% private - runs in your browser
- **H2:** FAQ

**FAQ ideas:** "Does ChatGPT add invisible watermarks?"; "What is U+202F and why is it in my text?"; "Will removing invisible characters break emoji or non-English text?"; "Is this safe / does my text get uploaded?"; "What's the difference between NBSP and a normal space?"; "Can you detect SynthID or probabilistic watermarks?" (honest no); "What are bidi/Trojan-Source characters?"

**Schema.org:** `WebApplication` (or `SoftwareApplication`, `applicationCategory: Utility`, `offers` price 0) for the tool; `FAQPage` for the FAQ block; `BreadcrumbList` for suite navigation.

**Internal links:** to the main em-dash remover/cleaner, the AI-tell scanner, and any future "smart quotes fixer" / "whitespace normalizer" sibling tools - bidirectional links plus a shared "Tools" nav, reinforcing topical authority.

## 10. Build effort & priority

**Effort:** Roughly 2–4 focused days for a credible v1. The detection + cleanup logic is largely **already present** in `src/lib/cleaner.ts` (the `INVISIBLES` regex, NBSP handling, and `CleanResult.counts`); the new work is (a) refactoring detection into a shared, category/data-driven `lib/invisibles.ts`, (b) the inline-highlight render component with chips/tooltips, (c) the curated Unicode name/note JSON, and (d) the engagement layer (score meter, toggles, navigation, examples). It's a new Astro page + an island component, mirroring the existing `Cleaner.astro` pattern.

**Dependencies on existing code:** reuse `clean()` and its options for the cleanup action; reuse the `counts` shape and the page/layout/consent/ad scaffolding already in `src/`. No new runtime libraries required (keep the curated JSON instead of a full UCD package).

**Recommended sequencing:** Ship as the next tool after the core cleaner because (1) it directly reuses existing detection code, (2) it has the strongest "aha" demo (the live reveal) for SEO dwell time and shareability, and (3) it captures the fast-rising "AI watermark / U+202F" search wave while competitors are thin. Build the MVP (§4) + the top 6–8 engagement features (live highlight, tooltips, why-this-is-a-tell, score meter, before/after, examples, copy/report, undo) first; defer click-to-jump navigation, Web Worker virtualization for huge inputs, and the full security/tag-char deep dive to a fast follow.

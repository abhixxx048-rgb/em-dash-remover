# Homoglyph / Confusables Detector & Normalizer

> Catch the Cyrillic `а`, Greek `ο`, and fullwidth `Ａ` look-alikes hiding in your text - flag every mixed-script run, show the Unicode TR39 skeleton, and normalize back to clean Latin in one click, entirely in your browser. Tier: 2. Difficulty: Med. Runs: client-side (100%, no network).

## 1. What it does

Scans pasted text for **confusable characters** - letters that look identical to ordinary Latin ones but are actually from Cyrillic, Greek, Armenian, fullwidth, mathematical-alphanumeric, or other Unicode blocks (e.g. Cyrillic `а` U+0430 vs Latin `a` U+0061, Greek `ο` U+03BF, fullwidth `Ａ` U+FF21). It highlights every offending glyph, groups them into **mixed-script runs/words**, names each one (codepoint + script + Latin equivalent), computes the **UTS #39 skeleton** so you can see what the text "really" looks like to a machine, and offers a **one-click normalize** that maps each look-alike back to its plain ASCII/Latin counterpart. The job is to make invisible script-spoofing visible and removable, framed as text-hygiene and quality - not as a way to "beat a detector."

## 2. Why users want it (demand & search)

**Target keywords (realistic):**
- `homoglyph detector` / `homoglyph checker` - moderate volume, security-leaning, the head term (primary)
- `confusable characters detector` / `unicode confusables checker` - moderate, lower competition, our exact wedge
- `detect cyrillic letters in text` / `cyrillic look alike characters` / `find non-latin characters` - rising, very intent-specific
- `mixed script detector` / `fake text detector` / `spoofed text checker` - moderate, security + anti-phishing intent
- `remove cyrillic characters from text` / `normalize unicode lookalike` / `convert cyrillic to latin lookalike` - transactional, low competition (the *normalize* half nobody bundles well)
- `is this text using fake letters` / `hidden unicode characters in ai text` - rising informational, ties to the AI-cleanup brand
- `fullwidth to normal text` / `fullwidth character converter` - adjacent long-tail with steady volume

**Demand/competition read:** The pure `homoglyph` cluster is dominated by security/phishing tooling (domain-spoofing, IDN homograph) and a handful of thin "detector/generator" toy pages. Most existing pages either (a) only *detect and color-code* without a quality normalize, or (b) are *generators* for making spoofed text. The under-served, on-brand intent is the writer/editor who pasted AI or web text and wants to know "are there fake letters in here, and can you clean them out?" - the **detect + normalize + explain** combination at the prose-hygiene angle is where we win, not on raw security-keyword volume.

**Who searches & the moment they need it:** (1) A writer/editor who pasted text from ChatGPT, a PDF, a webpage, or a doc and suspects "weird letters" - copy that fails a search/find, mis-sorts, or renders oddly. (2) Someone who was told their submission "looks like it's trying to dodge AI detection" (the SilverSpeak-style homoglyph swap) and wants to *clean it to be legitimate*. (3) Devs/security folks checking usernames, domains, brand names, or form input for spoofing. (4) ESL/non-native writers whose keyboard or copy-paste introduced Cyrillic/Greek glyphs they can't see.

**Source domains found in research:** unicode.org (UTS #39 / confusables.txt - the authoritative spec), originality.ai (Fake Text / Homoglyph Detector & Generator), justdone.com (invisible-unicode / homoglyph AI-detector bypass writeup), onlinetoolz.ai, texttools.cc, rapidtoolset.com, gypu.com (competing detector/generator pages), github.com/codebox/homoglyph and github.com/ACMCMC/silverspeak (homoglyph data + attack/revert library), aclanthology.org / arxiv.org 2406.11239 (SilverSpeak academic paper), namesilo.com and haveibeensquatted.com (confusable/IDN brand-protection writeups), paultendo.github.io (confusables.txt-vs-NFKC nuance).

## 3. Target users & use cases

- **Writers / content creators** - pasted an AI or web draft and want to confirm there are no smuggled Cyrillic/Greek letters that will trip spellcheck, search-and-replace, or look unprofessional; they want clean, all-Latin prose.
- **Editors / publishers** - enforcing clean copy across submissions; a single Cyrillic `е` can break find/replace, indexing, and house-style QA, and reads as a red flag of manipulated text.
- **Students / academics** - someone (or a "humanizer" tool they ran) injected homoglyphs to dodge detection; they need to *strip them back out* to submit legitimate, honest work - framed as "clean it, don't cheat with it."
- **Developers / security / trust-&-safety** - checking usernames, display names, brand mentions, domains, coupon codes, or user-submitted form text for spoofing and IDN-homograph-style attacks before they hit a database or moderation pipeline.
- **ESL / non-native & multilingual writers** - bilingual keyboards and copy-paste from Cyrillic/Greek sources silently mix scripts; this surfaces and fixes the invisible mistakes they literally cannot see.
- **Anti-fraud / moderation reviewers** - quickly answering "is this message using look-alike letters to evade a word filter?" (e.g. disguised banned words via Cyrillic substitution).
- **Localization / QA teams** - verifying that "English" strings in a resource file are genuinely Latin-only and haven't been corrupted with confusables during translation round-trips.

## 4. Features - core (MVP)

1. **Paste-and-scan box** - large textarea in, analyzed/cleaned text out, mirroring the existing `Cleaner.astro` input/output model so the suite feels consistent.
2. **Confusable detection (TR39-backed)** - flag every character whose script is not the document's dominant script *and* that has a confusable mapping to a Latin/ASCII glyph. Backed by Unicode `confusables.txt` data (codebox/homoglyph-style map) plus `Script`/`Script_Extensions` so we don't false-flag legitimately non-Latin text.
3. **Per-character inventory** - for each flagged glyph: the glyph, codepoint (e.g. `U+0430`), Unicode name (`CYRILLIC SMALL LETTER A`), source script (Cyrillic/Greek/Armenian/Fullwidth/Math-Alphanumeric), Latin equivalent it maps to, and a count.
4. **Mixed-script run highlighting** - highlight not just lone characters but whole **words/runs** that mix scripts (the real attack signature: `pаypаl` where one `а` is Cyrillic), since a single foreign letter inside an otherwise-Latin word is the strongest signal.
5. **UTS #39 skeleton view** - show the computed `skeleton()` of the text (NFD → drop Default_Ignorable → map confusables to prototypes → NFD again) so users see the canonical "what a machine sees" form. This is the marquee, credibility-establishing feature.
6. **One-click normalize** - replace every confusable with its Latin/ASCII prototype, producing clean output; reversible via undo. Optionally route fullwidth/math-alphanumeric variants through NFKC where appropriate.
7. **Script summary / verdict** - a top-line read: "Found 14 Cyrillic and 3 Greek look-alikes across 6 words - mixed Latin/Cyrillic script detected" with a clear Latin-only / mixed-script status.
8. **Counts in the shared shape** - populate a `counts` object (`{ cyrillic, greek, fullwidth, other, runs, total }`) consistent with the existing `CleanResult.counts` contract.
9. **One-click copy + clear + download (.txt)** - export the normalized text wherever the user needs it.
10. **Zero network calls** - entirely a client-side string + table lookup; nothing uploaded. The confusables data ships in the bundle.

## 5. Features - engagement & helpfulness (what makes users love it & stay)

This is the section that turns a one-off "color-code my text" toy into a tool people trust, return to, and recommend. Each item states *why* it helps.

1. **Live, as-you-type scanning with a running verdict pill** - "Mixed script: 14 Cyrillic look-alikes in 6 words" updates on every keystroke, flipping to a calm green "Latin-only - clean" when nothing's wrong. *Why:* instant, visible feedback proves the tool is actually doing something invisible work normally hides, and the green "all clear" state is genuinely reassuring.
2. **Inline highlight with hover/tap inspector** - each suspect glyph is boxed in the input; hovering (or tapping on mobile) pops a card: `а → a · U+0430 CYRILLIC SMALL LETTER A · maps to Latin a`. *Why:* users *see* exactly which letter is fake and what it'll become, reinforcing the provable-transparency brand and never deleting anything silently.
3. **Side-by-side skeleton / "what a machine sees" panel** - render the original next to its TR39 skeleton with the swapped characters aligned and highlighted. *Why:* the single most credibility-building, "whoa" moment - it makes an abstract attack concrete and teaches *why* normalization matters.
4. **One-click normalize with global undo + "restore original"** - normalize everything in a tap; one shortcut reverts. *Why:* removes the fear of clobbering legitimately non-Latin content and invites experimentation.
5. **Per-character "keep this one" toggle** - click any flagged glyph in the preview to exclude it from normalization (e.g. a genuine Greek `π` in a math note, or a real Cyrillic name). *Why:* the universal failure of naive normalizers is destroying *legitimate* foreign text; one tap protects it.
6. **Script-class filter chips** - chips for `Cyrillic`, `Greek`, `Fullwidth`, `Math-Alphanumeric`, `Armenian`, `Other`, each showing a live count; click to focus/normalize only that class. *Why:* a dev cleaning fullwidth artifacts and an editor hunting Cyrillic swaps have different jobs; chips let each act surgically.
7. **Risk-tiered, non-color-only severity badges** - Cyrillic/Greek-in-Latin = high (icon + label "High: common spoof"), other scripts = medium, fullwidth/math = low/"cosmetic," mirroring how onlinetoolz/Originality tier risk. *Why:* tells users *which* findings actually matter so they don't panic over a harmless fullwidth space, and the icon+text (not color alone) keeps it accessible.
8. **"Why this is a tell" education panel** - a collapsible explainer: what homoglyphs are, the Latin-vs-Cyrillic `а` example, why mixing scripts is the signature of look-alike substitution (with a nod to the SilverSpeak research), linking to the existing "Signs of AI Writing" blog post. *Why:* converts a utility into a learning moment, builds topical authority, and feeds internal-link SEO.
9. **Try-an-example / demo button** - loads a realistic sentence with planted Cyrillic/Greek/fullwidth look-alikes (e.g. a `pаypаl`/`Аpple` style line) so first-timers feel the value in two seconds without pasting their own data. *Why:* solves the empty-state problem and demonstrates the skeleton "wow" instantly.
10. **Copy normalized, copy skeleton, and download (.txt)** - multiple export paths, including "copy clean Latin text." *Why:* meets the user at their destination (CMS, doc, code) and removes finish-line friction.
11. **Character map / inventory table that's sortable & exportable** - glyph, codepoint, name, script, Latin target, count - sortable by frequency, copyable as CSV. *Why:* power users (devs, security, localization QA) trust a tool that *shows its work*, and the table doubles as an inspector/audit artifact.
12. **"Confusability score" meter** - a light gauge: "This text is 92% Latin · 6% Cyrillic · 2% fullwidth - heavily mixed." *Why:* a small gamified, measurable signal makes cleanup feel rewarding and quantifies an otherwise invisible problem.
13. **Keyboard shortcuts** - `Ctrl/Cmd+Enter` to scan/normalize, `Ctrl/Cmd+C` to copy output, `Esc` to clear, `n` to jump to the next flagged glyph. *Why:* lets repeat users (moderators, editors clearing item after item) move fast.
14. **Remembered preferences (localStorage)** - persist toggles, active script-filter chips, NFKC-on-fullwidth choice, and theme between visits; **never** persist the user's text. *Why:* a returning editor keeps their "Cyrillic + Greek only, leave fullwidth" config automatically - the thing that turns a utility into a habit.
15. **Empty-state guidance + per-control tooltips** - placeholder copy ("Paste text - we'll find any Cyrillic, Greek, or fullwidth letters disguised as English and map them back") and a `(?)` on every toggle explaining what it touches with a live example glyph. *Why:* removes guesswork for ESL and non-technical users who don't know what "script" or "skeleton" means.
16. **Positive, honest empty/clean state** - when nothing's found: "No look-alike characters - your text is genuine Latin." (a win, not an error). *Why:* the all-clear is a feature; it gives clean text a clean bill of health and builds trust in the verdict.
17. **Cross-sell strip to the full cleaner** - after scanning, "Also found 2 invisible characters and 4 em dashes - run the full cleaner?" *Why:* converts a single-purpose visitor into a hub user; homoglyph cleanup and invisible-char stripping are natural neighbors.
18. **Dark mode + mobile-first layout** - respects `prefers-color-scheme`, stacks input/output on phones, big tap targets, sticky copy/normalize bar, tap-to-open inspector (no hover-only affordances). *Why:* a lot of "paste from the ChatGPT app" and "check this suspicious message" traffic is mobile and must not break there.

## 6. UX / UI notes

- **Layout:** Two-pane on desktop (input/highlighted-original left, normalized output right), stacked on mobile, matching the existing `Cleaner.astro` pattern. A compact **verdict bar** (Latin-only / mixed-script + script-filter chips) sits above the panes; the **skeleton panel**, **inventory table**, and **education panel** are collapsible below. A persistent **Normalize / Copy / Undo** action row anchors the interaction.
- **Input/output model:** highlighted, read-back original on the left (non-destructive - flags are overlays, text is untouched until you act); normalized result on the right, regenerated live or on Normalize.
- **States:**
  - *Empty:* friendly placeholder + "Try an example" button + one-line value prop. No blank scary box.
  - *Scanning/processing:* synchronous and instant for normal text; for very large pastes show a subtle "scanning…" shimmer and debounce (see §7); the verdict pill animates its new counts.
  - *Result - mixed:* highlighted glyphs, verdict "Mixed Latin/Cyrillic - 14 look-alikes," chips populated, skeleton + inventory available, Normalize enabled.
  - *Result - clean:* "No look-alike characters found - genuine Latin text." (positive).
- **Microcopy tone:** plain, calm, quality-framed - "Find the look-alike letters and map them back to clean English," **never** "beat the detector." When the AI-evasion context comes up, frame it as *cleaning manipulated text to make it legitimate.*
- **Mobile:** single column; tap (not hover) opens the per-glyph inspector; chips as a horizontal scroller; sticky bottom Normalize/Copy bar; skeleton panel collapsed by default to save space.
- **Accessibility (WCAG 2.2 AA):** highlights and severity must **not** rely on color alone - use an underline/dotted box + a small superscript script-tag (e.g. `Cyr`) or icon so colorblind users perceive flags; every flagged glyph exposes its Unicode name and mapping via `aria-label`/`title`; full keyboard operability for chips, per-glyph toggles, and "next flag" navigation; visible focus rings; the live verdict announced via `aria-live="polite"`; contrast ≥ 4.5:1 in both themes; the inventory is a real `<table>` with headers for screen readers.

## 7. Technical implementation (client-side)

**Core approach - data-driven confusable mapping + script analysis, all in-browser.**

1. **Ship a confusables map, not a hand-rolled regex.** Bundle a compact JSON derived from Unicode `confusables.txt` / the codebox/homoglyph dataset: `{ sourceCodepoint → { target: 'a', name: 'CYRILLIC SMALL LETTER A', script: 'Cyrillic' } }`. This is the authoritative source (UTS #39) and avoids the trap of an incomplete ad-hoc list. Prune to the high-value, Latin-confusable subset (Cyrillic, Greek, Armenian, Cherokee, fullwidth forms `U+FF01–FF5E`, mathematical alphanumerics `U+1D400–1D7FF`, and a few Latin-Extended look-alikes) to keep the payload small (target well under ~50–80 KB gzipped; the full map is larger but most rows never appear in prose).
2. **Skeleton algorithm (UTS #39):** implement `skeleton(s)` as: `NFD → strip Default_Ignorable (the invisible-char class the existing engine already removes) → map each char through the confusables prototype table → NFD again`. Idempotent (`skeleton(skeleton(x)) === skeleton(x)`), which is a free correctness self-check. Use this both for the skeleton panel and as the engine for normalize.
3. **Script detection via Unicode property escapes** (native, no library): test characters with `\p{Script=Cyrillic}`, `\p{Script=Greek}`, `\p{Script=Latin}`, `\p{Script=Armenian}`, etc., and use **`\p{Script_Extensions=...}`** where available so shared punctuation/digits (Common/Inherited) don't get mis-attributed. Determine the document's **dominant script** (almost always Latin for our audience) and flag confusables from *other* scripts; this is what prevents false-flagging text that is *legitimately* Cyrillic or Greek throughout.
4. **Mixed-script run detection:** tokenize into word-runs (`\p{L}+` clusters) and, per run, compute the set of scripts present (with the augmented-set rules from TR39 - treat Common/Inherited as wildcard). A run whose letters span Latin **and** Cyrillic/Greek is the highest-signal flag (`pаypаl`). Surface these runs distinctly from isolated stray glyphs.
5. **Normalize = apply prototype map**, honoring the user's per-character "keep" set and script-filter chips. For **fullwidth** and **mathematical-alphanumeric** variants, prefer **NFKC** (which canonically folds `Ａ→A`, `𝐀→A`) - but note the documented gotcha that **`confusables.txt` and NFKC disagree on ~31 characters**, so the confusables map takes precedence for cross-script look-alikes and NFKC is used only for the compatibility/width cases. Don't blindly NFKC the whole string (it would mangle legitimate ligatures, superscripts, etc.).
6. **Counting & inventory:** iterate the per-character scan once to build both the highlight overlay and the inventory table; populate `counts` (`{ cyrillic, greek, fullwidth, math, other, runs, total }`) in the existing `CleanResult.counts` style so the UI counters come for free.

**Edge cases & failure modes:**
- **Legitimately non-Latin text** (a Russian or Greek paragraph) must **not** be flagged as an attack - gate flagging on *mixing against a dominant script*, not on "is non-ASCII." If the dominant script *is* Cyrillic, don't normalize it to Latin.
- **Diacritics / accented Latin** (`é`, `ñ`) are real Latin, not confusables - the skeleton's NFD step must not strip or "normalize" them away; only map entries that exist in the confusables table.
- **Bidirectional text** (Arabic/Hebrew mixed in) - TR39 has a separate `bidiSkeleton()`; for v1 we can flag bidi controls (already handled by the invisibles engine) and skip full bidi-skeleton, documenting the limitation.
- **CJK** - Han/Hiragana/Katakana mixing is legitimate (per TR39's augmented sets); never flag normal Japanese as "mixed script."
- **Font-dependent look-alikes** the data doesn't cover (e.g. some Latin-Extended) - be honest that detection is data-bound; the skeleton view is the ground truth we expose.
- **Whole-script confusables** (entire Cyrillic word like `ѕсоре` that looks like `scope`) - a single-script run with *no* Latin mixing is harder; flag at lower confidence with a "this whole word may be Cyrillic spelled to look Latin" note rather than auto-normalizing.

**Performance for large text:** the scan is O(n) with a hash-map lookup per character - instant up to ~100 KB. For very large pastes (> ~200 KB) debounce the live scan (~150 ms) and/or move it to a **Web Worker** so typing stays smooth; render the inventory/skeleton on demand rather than every keystroke. Lazy-load the confusables JSON (it's only needed once text is present), keeping initial page weight low.

**Server/LLM:** none required for the core. Everything is deterministic table lookup + Unicode property tests, so the privacy story is airtight - identical to the existing engine, "nothing here touches the network." (SilverSpeak's optional LLM-assisted normalization is explicitly *out of scope*; it would break the privacy promise and isn't needed for honest cleanup.)

## 8. Competitors & how we differentiate

**Real competitors found:**
- **originality.ai** "Fake Text (Homoglyph) Detector and Generator" - strong character analysis (codepoints, script, Latin equivalent) but it's a lead-magnet for a paid AI-detection product, framed around detection/evasion, and is *also a generator* (it teaches making spoofed text).
- **onlinetoolz.ai**, **texttools.cc**, **rapidtoolset.com**, **gypu.com**, **usefulutils.in**, **freetools-pro.com** - generic "homoglyph detector/generator" pages; most color-code findings and many *also generate* fake text. Detection is shallow, normalize is weak or absent, no education, no privacy claim, ad-heavy.
- **github.com/codebox/homoglyph** (data + detection code) and **github.com/ACMCMC/silverspeak** (attack + *revert*/normalize library) - developer libraries, not a polished web tool; SilverSpeak is research-grade and Python-only.

**Their weaknesses:**
- Many are **generators first** (they help *create* spoofed text) - off-brand and arguably harmful; we are cleanup-only.
- Detection without a credible **normalize-to-clean-Latin** path, or normalize that naively NFKCs everything and mangles legitimate content.
- No distinction between a **mixed-script attack run** and **legitimately non-Latin text**, producing noisy false positives.
- No **skeleton** view, no **per-character keep**, no education, and frequently **send text to a server** (no privacy story).

**Our wedge:**
1. **Provable privacy** - 100% client-side, confusables data bundled, nothing uploaded - the core brand hook competitors mostly can't claim.
2. **Detect *and* normalize, done right** - TR39 skeleton as the engine, NFKC only where appropriate, with the confusables-vs-NFKC disagreement handled deliberately.
3. **Don't-break-legitimate-text** - dominant-script gating + per-character keep, so real Greek/Cyrillic/CJK survives; the thing naive tools get wrong.
4. **Transparency** - skeleton panel + Unicode-named inventory showing exactly what changed (nobody in the cheap-tool tier does this).
5. **Cleanup, never spoofing** - we deliberately do **not** ship a generator; framed as "make manipulated text legitimate again," on-brand quality-not-bypass.
6. **Consolidation** - one tap hands off to the full cleaner (invisibles, em dashes, quotes), which standalone pages can't offer.

## 9. SEO & page structure

**Primary keyword:** "homoglyph detector" (H1 target), with "confusable characters" as the strong secondary head.

**Secondary:** "detect Cyrillic letters in text," "find non-Latin / look-alike characters," "unicode confusables checker," "remove Cyrillic characters from text," "mixed-script detector," "normalize unicode look-alike characters," "fullwidth to normal text."

**H1/H2 outline:**
- **H1:** Homoglyph & Confusable Character Detector - Find Fake Look-Alike Letters (Free, Private)
- H2: Paste your text - find Cyrillic, Greek & fullwidth look-alikes instantly *(the tool)*
- H2: What are homoglyphs / confusable characters? - the Latin `a` vs Cyrillic `а` example *(education)*
- H2: See the Unicode skeleton - what a machine really reads *(the differentiator)*
- H2: One-click normalize - map look-alikes back to clean Latin
- H2: Why look-alike letters show up in AI & pasted text *(internal link to "Signs of AI Writing")*
- H2: 100% in your browser - your text never leaves your device *(privacy)*
- H2: FAQ

**FAQ ideas (FAQPage schema):**
- What is a homoglyph / confusable character? (Latin `a` vs Cyrillic `а`.)
- Does this send my text anywhere? (No - runs entirely in your browser.)
- Will it flag my legitimate Russian/Greek/Japanese text? (No - it only flags letters that mix into otherwise-Latin words.)
- What's the "skeleton"? (The Unicode TR39 canonical form showing what a machine sees.)
- Can it remove the fake letters automatically? (Yes - one-click normalize to Latin, reversible.)
- Why does AI or "humanizer" text sometimes contain Cyrillic letters? (links to blog - homoglyph swaps used to dodge detection; clean them to stay legitimate.)
- Will it change my accented letters (é, ñ)? (No - those are real Latin.)

**schema.org:** `SoftwareApplication` / `WebApplication`, `applicationCategory: Utility`, `offers` price `0`, nested `FAQPage`. Reuse the site's existing structured-data setup.

**Internal links to sibling tools:** Invisible/Watermark Character Inspector (closest neighbor - share the Default_Ignorable logic), the main Em Dash Remover / full cleaner, Emoji & Decorative-Symbol Stripper, Whitespace & Paste-from-Word cleaner, plus the "Signs of AI Writing" and "Why ChatGPT Uses Em Dashes" blog posts. This page becomes a strong hub node feeding the cleaner.

## 10. Build effort & priority

**Effort:** Medium (≈ 1.5–2.5 days for a solid MVP + engagement layer). Higher than the Tier-1 strippers because of the **confusables dataset** (sourcing, pruning, packaging), the **skeleton + script-extension logic**, and the **mixed-run/dominant-script** analysis - but the surrounding shell (layout, copy/undo, counts contract, dark mode, SEO scaffolding, structured data) already exists in `Cleaner.astro` / `cleaner.ts` / `Base.astro`.

**Dependencies on existing code:**
- Reuse `cleaner.ts` patterns (options object, `CleanResult.counts`, the existing **INVISIBLES** class for the Default_Ignorable strip step of `skeleton()`) - add a `confusables.ts` module rather than a parallel engine.
- One data dependency: a pruned `confusables.json` derived from Unicode `confusables.txt` / codebox/homoglyph (lazy-loaded). No heavy runtime library - native `\p{Script}` / `\p{Script_Extensions}` and `String.prototype.normalize('NFD'|'NFKC')` do the work.
- `Intl.Segmenter` (built-in) optional, for accurate grapheme handling in the inventory.

**Recommended sequencing:** Ship the **Invisible/Watermark Character Inspector** first (it establishes the Default_Ignorable/skeleton-adjacent plumbing this tool reuses), then this **Homoglyph / Confusables Detector** as the flagship Tier-2 follow-up - it's the most *technically impressive* page in the suite (the skeleton view is a genuine differentiator) and targets an under-served detect-**and**-normalize intent. Build in order: (1) confusables map + detection + verdict, (2) highlight + inventory + normalize + undo, (3) skeleton panel and per-character keep, (4) education panel, score meter, presets, and the cross-sell handoff to the full cleaner on launch day so it strengthens the hub immediately.

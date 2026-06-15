# Want List 2 - Round-Two Tools & Features

> Compiled 2026-06-15 from a second multi-agent research workflow (7 web-research lenses → completeness critic → synthesis). 102 raw ideas → deduped to ~27 net-new survivors, ranked into the tiers below. Companion to `WANTLIST.md` and `RESEARCH.md`.
>
> Everything in the original `WANTLIST.md` is now shipped, so this round hunts for genuinely-new ground. All ideas are quality/integrity-framed (never detector-bypass), prefer 100%-client-side execution, and protect the "keep your human voice" brand. Anything that needed a server (cloud translation/grammar) or flirted with detector-bypass (model-fingerprint estimator, SynthID stripping) was deliberately dropped.

## Top pick - build next

**Markdown → Clean-Prose Converter ("de-slop" ChatGPT/Claude output).** One-click stripping of markdown syntax (`##`, `**bold**`, bullets, `|tables|`, backticks, links) into clean prose that pastes properly into Gmail, Docs, LinkedIn, Slack, and CRMs. Very-high evergreen demand ("markdown to plain text", "remove asterisks from ChatGPT"), trivially low build difficulty (pure string transforms), 100% client-side, no browser-API gating, and the natural companion to the shipped em-dash remover and AI-tell report. Slots straight into existing internal-link clusters.

## Tier 1 - build next (high demand, low effort, on-brand)

| Tool | What it does | Target keyword | Demand | Difficulty | Client-side |
|---|---|---|---|---|---|
| **Markdown → Clean-Prose Converter** ⭐ | Strip `##`, `**bold**`, bullets, tables, backticks, links into clean prose for Gmail/Docs/LinkedIn/Slack. | markdown to plain text converter | very high | low | yes |
| Line & List Toolkit | Dedupe / sort (A-Z, numeric, natural, length) / reverse / shuffle / trim / drop blanks / number / prefix-suffix, with case + trim toggles. | remove duplicate lines | very high | low | yes |
| Find & Replace (regex + bulk pairs) | Plain/whole-word/case find-replace, multiline regex with capture groups, many stacked pairs applied at once, live preview, saveable profiles. | find and replace text online | very high | low | yes |
| Multi-Platform Character & Limit Counter | Live counts with visual cutoff bars for X (280), LinkedIn (3000), Instagram, TikTok, SMS, meta title (60), meta description (155). | character counter | very high | low | yes |
| Keyword Density & Phrase-Frequency Analyzer | Top words + 1-5 word n-gram phrases with counts/density and stop-word filtering. Doubles as a repeated-phrase crutch detector. | keyword density checker | very high | low | yes |
| Fancy-Unicode Font Normalizer | De-stylize Unicode "fancy fonts" (math bold/italic/script/fraktur, fullwidth, circled) back to plain ASCII so LinkedIn/Instagram pseudo-formatting is searchable + screen-reader-readable. | convert fancy text back to normal | very high | low | yes |
| Whitespace / Extra-Space Normalizer | Focused landing page: collapse multiple spaces, strip tabs, trim line ends, drop blanks, normalize indentation. | remove extra spaces online | high | low | yes |
| Remove Punctuation / Special-Char Cleaner | Configurable stripper for punctuation, repeated `!!!`, symbols, digits, or non-ASCII, with keep-toggles. | remove punctuation from text | high | low | yes |
| Extractor (emails / URLs / phones / mentions / hashtags) | Pulls and de-dupes emails, URLs, phones, @mentions, #hashtags, DOI/ISBN/arXiv IDs; copy + CSV export. | extract emails from text | high | low | yes |

## Tier 2 - differentiators (defend the AI-cleanup niche, earn backlinks)

| Tool | What it does | Target keyword | Demand | Difficulty | Client-side |
|---|---|---|---|---|---|
| AI Scaffolding & Boilerplate Scrubber | Removes chat scaffolding that leaks into pasted text: "Sure, here's", "I hope this helps!", "As an AI language model", refusal stubs, `[INSERT NAME]` placeholders. | remove ChatGPT intro sentence | high | low | yes |
| AI Cliché & Phrase Catcher | Highlights formulaic openers ("In today's fast-paced world"), spatial metaphors ("tapestry/realm/beacon"), tricolons, "not X but Y", inflated diction ("plethora/utilize") with plainer swaps. | AI cliche phrases checker | high | low | yes |
| Mojibake / Encoding Repair | Fixes garbled text (`â€™`, `Ã©`, smart-quote corruption) from Windows-1252/UTF-8 mismatches. Distinctive, low-competition. | fix garbled text encoding | high | medium | yes |
| Two-Pane Diff Checker (arbitrary A vs B) | General-purpose compare of two pasted documents with line/word diff, ignore-whitespace/case, similarity %. Beyond the shipped before/after view. | compare two texts diff checker | very high | medium | yes |
| Markdown ↔ HTML & Table Generator | Two-way Markdown/HTML/plain conversion with live preview + visual grid editor that outputs aligned GFM tables. | markdown to html converter | high | medium | yes |
| Style-Guide Title Case (AP / APA / Chicago / MLA) | Headline-grade casing per style-guide rules (prepositions, conjunctions, infinitive "to") with toggles. | title case converter AP APA chicago | high | medium | yes |
| URL Slug Generator | Titles → clean lowercase hyphenated slugs with accent transliteration, optional stop-word removal, configurable separator + max length. | slug generator | high | low | yes |
| URL / Link Cleaner | Strips UTM, fbclid, gclid + 40 other tracking params from one or many URLs. Perfectly on-brand for a privacy-first site. | remove utm tracking from url | high | low | yes |
| PII Redactor / Anonymizer | Masks emails, phones, SSNs, cards, names before sharing text with AI/colleagues, on-device, preview-before-apply. | text anonymizer pii redactor | high | medium | yes |
| SERP Snippet & Meta-Length Preview | Live title/meta-description preview with desktop/mobile pixel-width measurement + truncation warnings. | meta description length checker | high | medium | yes |

## Tier 3 - bigger bets & platform / retention features

| Item | What it does | Target keyword | Demand | Difficulty | Client-side |
|---|---|---|---|---|---|
| Image-to-Text OCR | Drop a screenshot, extract text locally (Shape Detection `TextDetector` + tesseract.js fallback), pipe into cleanup. "No image upload." Heavy dep. | image to text online private | very high | medium | yes |
| PDF Text Extractor & Reflow | Load a PDF locally with PDF.js, pull clean text, remove hard wraps/headers/hyphenation. Nothing leaves device. | extract text from pdf private | very high | medium | yes |
| Private TL;DR / Summarizer | On-device Chrome Summarizer API, adjustable length, markdown/plain. Chrome-flag-gated → ship graceful fallback. | text summarizer client side | very high | low | yes |
| On-Device Grammar/Punctuation Fixer | Chrome Proofreader API (Gemini Nano) with a plain-language explanation per change. Multilingual landing pages extend reach. Chrome-flag-gated. | grammar checker no sign up offline | very high | medium | yes |
| Developer Encoder Pack | Base64 / URL encode-decode, SHA-256/MD5 via Web Crypto, JSON/YAML/XML format-validate. High traffic, lower brand fit → cluster under a separate "dev tools" section. | base64 encode decode online | very high | medium | yes |
| Saved Cleaning Presets / Recipes | Chain cleanup steps (em dash, quotes, whitespace, emoji, markdown) into a named preset stored in IndexedDB, one-click on every visit. Account-free. | text cleaner presets | medium | medium | yes |
| Shareable Recipe Links + Cmd-K Palette + PWA | Encode the chosen *recipe* (not the text) into a shareable URL for backlinks; Cmd-K palette to jump between tools; PWA install for offline use. | shareable text tool link | medium | medium | yes |
| Embeddable Cleaner/Counter Widget | One-line iframe embed of the counter/cleaner for blogs/CMS, carrying a backlink, with optional Pro white-label. | embeddable word counter widget | medium | medium | yes |

## Recommended build order

Ship the **9 Tier-1 string-transform tools** first - they're all pure JS with no dependencies, target very-high evergreen keywords, and each becomes an internal-link hub feeding the core cleaner. Lead with the **Markdown → Clean-Prose Converter** (shipped here). Then use **Tier 2** to defend the AI-cleanup niche and earn backlinks - **URL Cleaner, Two-Pane Diff Checker, and Mojibake Repair** are the standout low-competition picks. Treat **Tier 3** platform/retention features (presets, shareable recipes, embeddable widget) as moats once the expanded tool hub has organic traction, and cluster the dev-encoder tools separately so they don't dilute the "keep your human voice" brand.

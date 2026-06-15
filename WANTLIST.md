# Want List — New Tools & Features

> Compiled 2026-06-15 from a multi-agent research workflow (8 web-research lenses → completeness critic → synthesis). Started from 81 raw candidates, deduped to 85 unique, ranked into the 20 below. Companion to `RESEARCH.md`.

A prioritized set of genuinely-new tools to extend Em Dash Remover beyond its current single paste-box. Everything below is net-new (not in the already-built pipeline) and quality-framed, not detector-bypass. Near-duplicates from the candidate pool have been merged into the strongest single framing.

## Tier 1 — Build next (high demand, low effort, on-brand)

| Tool | What it does | Target keyword / demand | Difficulty | Client-side? | Brand fit |
|---|---|---|---|---|---|
| Invisible / Watermark Character Inspector | Read-only mode that highlights hidden chars inline (zero-width, NBSP, BOM, U+202F, variation selectors) with U+XXXX labels and a count badge — see it before stripping. Merges the "scanner", "AI watermark report", and "visual highlighter" candidates. | invisible character viewer / AI watermark checker — very high, dense competitive field (invisiblecharacterviewer.com, Originality.AI, getgpt) | Low | Yes | High |
| Word & Reading-Time Counter | Live word/char (with/without spaces)/sentence/paragraph counts, reading + speaking time, and platform-limit pills (X, LinkedIn, SMS, meta). Sticky companion to a paste-box. | word counter / character count — extremely high evergreen (wordcounter.net, charactercounter.com) | Low | Yes | Med |
| Before/After Diff Viewer | Inline/side-by-side diff of original vs cleaned text with per-change accept/reject, so users verify exactly what changed before copying. Reinforces provable-transparency brand. | text diff / compare / before-after — very high (diffchecker.com, textcompare.org) | Med | Yes | High |
| Readability / Grade-Level Scorer | Flesch Reading Ease, Flesch-Kincaid, Gunning Fog + hardest-sentence highlighting, all local. | readability checker / flesch-kincaid — high evergreen (hemingwayapp.com, plainbench.com) | Low | Yes | High |
| Emoji & Decorative-Symbol Stripper | Toggleable removal of emoji and LLM decorative bullets/symbols (✦ ▶ ✅). A distinct rule the pipeline lacks; doubles as an AI-tell cleanup. | remove emojis from text — very high, many single-purpose pages | Low | Yes | High |
| Case Converter | UPPER / lower / Sentence / Title (style-guide aware) / aLtErNaTiNg; leverages existing grammar awareness. | convert case / sentence case — very high (convertcase.net) | Low | Yes | Med |
| Whitespace & Line-Break Reflow Fixer | Collapse extra spaces, strip trailing spaces, remove blank lines, and unwrap hard-wrapped lines into clean paragraphs (incl. PDF/email copy with hyphen-split rejoining). Adds reflow/unwrap beyond current NBSP trim. | remove line breaks / fix pdf line breaks — very high (textfixer.com, linebreakremover.com) | Med | Yes | High |
| Paste-from-Word/Docs Rich Formatting Cleaner | Reads the clipboard HTML payload on paste to strip Word/Docs span soup, mso styles, entities, and PDF artifacts while keeping real paragraphs. Current tool only handles plain-text paste. | clean formatting paste from word/google docs — high (CleanPaste, QuoteCleaner) | Med | Yes | High |

## Tier 2 — Differentiators (medium effort, strong brand fit)

| Tool | What it does | Target keyword / demand | Difficulty | Client-side? | Brand fit |
|---|---|---|---|---|---|
| Human-Voice / AI-Tell Report | Non-destructive report unifying the structural tells: sentence-cadence/burstiness chart, "not X but Y" + rule-of-three + sentence-opener repetition flags, hedging/sycophancy/filler-preamble detectors, and a GPT-word dictionary with suggested human swaps. Guidance, not auto-rewrite. | why does my text sound like AI / sentence variety — strong; biggest cited 2026 tells | Med | Yes | High |
| Homoglyph / Confusables Detector & Normalizer | Flags Latin/Cyrillic/Greek/full-width look-alikes (Cyrillic "а" in English), shows mixed-script runs and TR39 skeleton, one-click normalize to safe single-script. Security + writing-integrity audience. | homoglyph detector / confusables finder — high (Originality.AI, kovertiz.com) | Med | Yes | High |
| Passive-Voice & Weasel-Word Highlighter | Hemingway-style inline highlights of passive constructions, -ly adverbs, and vague attributions ("studies suggest"), with counts. Heuristic/POS, fully local. | passive voice checker / weasel words — high evergreen (Grammarly, editsaurus) | Med | Yes | High |
| Read-Aloud Proofreader (TTS) | Reads text aloud via Web Speech API with adjustable voice/speed so writers catch run-ons and missing words by ear. 100% on-device, reinforces privacy hook. | text to speech read aloud proofreading — strong (read-aloud.com) | Low | Yes | High |
| Straight-to-Curly Smart Quotes Converter | The inverse of the existing curly→straight: adds correctly-directional curly quotes/apostrophes and proper en/em dashes for polished publishing output. | straight quotes to curly / smart quotes — high (freetoolkit.ai) | Low | Yes | High |
| Sentence Splitter (one sentence per line) | Abbreviation-aware split into one sentence per line so writers audit cadence/opener repetition manually. Pairs with the cadence analysis. | split text into sentences — confirmed standalone category (sentencesplitter.com) | Low | Yes | High |
| Bulk / Multi-File Cleaner | Drag-drop multiple .txt/.md/.docx; clean each with existing rules in-browser (parse/repack DOCX locally), per-file invisible-char report, ZIP download. Underserved private/batch gap. | bulk text cleaner / docx AI formatting remover — strong, underserved | Med | Yes | High |

## Tier 3 — Bigger bets / moonshots

| Tool | What it does | Target keyword / demand | Difficulty | Client-side? | Brand fit |
|---|---|---|---|---|---|
| Browser Extension (clean-on-paste / right-click) | Companion Chrome/Edge extension reusing the same engine to clean any editable field or AI-chat output in place. Validated precedents with traction. | em dash remover chrome extension — very strong (undash, DashAway) | Med | Yes | High |
| On-Device AI Rewrite (Chrome Rewriter / Gemini Nano) | Optional one-click tone/length rewrite via Chrome's built-in Rewriter API, fully on-device, graceful fallback when unsupported. Differentiator vs server-bound, bypass-framed humanizers. | humanize AI text rewrite private in browser — huge market | Med | Partial (built-in API; no external server) | High |
| Local Voice/Style Memory Profile | User pastes 1–3 writing samples; tool builds a local style fingerprint (sentence length, contraction rate, vocab, punctuation) in IndexedDB to bias rewrites and flag deviations — never uploaded. Uniquely on-brand ("keep your human voice"). | match my writing style / voice profile — Grammarly/NoteGPT validate (cloud-only) | High | Yes | High |
| Obsidian Plugin (clean-on-paste) | Intercepts AI-chat paste and applies the cleaning rules before insertion; manual command on selection. Active niche install base. | obsidian clean AI paste — strong niche (Clean AI Paste, Smart Typography) | Med | Yes | High |
| WebGPU/WebLLM Cross-Browser Rewrite | Bundled small quantized model (Phi-3.5-mini 4-bit) via WebLLM+WebGPU so non-Chrome users also get on-device rewrite; weights cached after first load. | in-browser LLM rewrite WebGPU — inherits humanizer demand | High | Yes | High |

## Recommended build order

Start Tier 1 in order of effort-to-payoff: the **Invisible / Watermark Character Inspector**, then the **Word & Reading-Time Counter** and **Readability Scorer** (trivial, evergreen, sticky), followed by the **Before/After Diff Viewer** and the **Emoji**, **Case Converter**, **Reflow**, and **Paste-from-Word** cleaners. These are low-risk, high-traffic landing pages that each become an internal-link hub feeding the existing cleaner. Then move to Tier 2's **Human-Voice / AI-Tell Report** as the flagship quality differentiator, with the **Homoglyph Detector** and **Passive-Voice Highlighter** close behind. Treat Tier 3 (extension, on-device rewrite, voice profile) as strategic bets once the tool hub has organic traction.

**Ship first: the Invisible / Watermark Character Inspector** — it's low effort, sits on top of detection logic the product already has (it strips these chars; this just surfaces them), targets a high-volume evergreen keyword cluster, and is the purest expression of the provable-privacy/transparency brand.

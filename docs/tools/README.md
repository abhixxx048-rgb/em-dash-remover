# Tool Suite - Detailed Specs

> Compiled 2026-06-15. One detailed spec document per planned tool, each produced from dedicated web research (20 tools, ~150 sources total). Strategy lives in [`../../RESEARCH.md`](../../RESEARCH.md); the ranked summary lives in [`../../WANTLIST.md`](../../WANTLIST.md).

Every doc follows the same 10-section structure, with **Section 5 (engagement & helpfulness features)** as the deepest part - the concrete features that make each tool sticky, delightful, and genuinely useful to users. Across the suite that's **340+ documented engagement features**.

Each tool is designed to stay **100% client-side** (provable privacy) and to reinforce the brand: *clean AI writing for real quality / keep your human voice* - never detector-bypass.

---

## Tier 1 - Build next (high demand, low effort, on-brand)

| Tool | Spec | What it does |
|---|---|---|
| Invisible / Watermark Character Inspector | [doc](./invisible-watermark-character-inspector.md) | Inline viewer that highlights hidden Unicode (zero-width, NBSP, BOM, bidi, variation selectors) with U+XXXX labels + counts, then one-click strips. |
| Word & Reading-Time Counter | [doc](./word-reading-time-counter.md) | Live word/char/sentence/paragraph counts, reading & speaking time, color-coded platform-limit pills (X, LinkedIn, SMS, SEO meta). |
| Before/After Diff Viewer | [doc](./before-after-diff-viewer.md) | Inline + side-by-side diff of original vs cleaned with per-change accept/reject and change explanations. |
| Readability / Grade-Level Scorer | [doc](./readability-grade-level-scorer.md) | Flesch, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau, ARI + consensus grade and hardest-sentence highlighting. |
| Emoji & Decorative-Symbol Stripper | [doc](./emoji-decorative-symbol-stripper.md) | Strips emoji (incl. ZWJ/skin-tone/flag sequences) and LLM bullets/checkmarks while keeping meaningful symbols (©, °, $). |
| Case Converter | [doc](./case-converter.md) | UPPER/lower/Sentence/Title (AP/Chicago/APA/MLA) + dev cases, with proper-noun/acronym preservation. |
| Whitespace & Line-Break Reflow Fixer | [doc](./whitespace-line-break-reflow-fixer.md) | Collapse spaces, strip trailing whitespace, control blank lines, unwrap hard-wrapped PDF/email text, rejoin hyphen-split words. |
| Paste-from-Word/Docs Cleaner | [doc](./paste-from-word-docs-cleaner.md) | Intercepts paste, strips Word mso-/span soup + Docs wrappers + PDF artifacts, keeps real paragraphs/lists/links. |

## Tier 2 - Differentiators (medium effort, strong brand fit)

| Tool | Spec | What it does |
|---|---|---|
| Human-Voice / AI-Tell Report | [doc](./human-voice-ai-tell-report.md) | Non-destructive report: burstiness/cadence, "not X but Y"/rule-of-three/opener repetition, hedging/sycophancy/filler, GPT-word dictionary with human swaps. |
| Homoglyph / Confusables Detector | [doc](./homoglyph-confusables-detector.md) | Flags Cyrillic/Greek/fullwidth look-alikes in Latin text, shows mixed-script runs + TR39 skeleton, one-click normalize. |
| Passive-Voice & Weasel-Word Highlighter | [doc](./passive-voice-weasel-word-highlighter.md) | Hemingway-style inline highlights of passive voice, weak -ly adverbs, weasel words, with a Directness score. |
| Read-Aloud Proofreader (TTS) | [doc](./read-aloud-proofreader.md) | Speaks text via Web Speech API with word highlighting, flag-as-you-hear, exportable fix-list. |
| Straight-to-Curly Quotes Converter | [doc](./straight-to-curly-quotes-converter.md) | SmartyPants-style "education" of straight quotes/apostrophes/dashes/ellipses, getting ’90s, ’Twas, 6'2" right. |
| Sentence Splitter | [doc](./sentence-splitter.md) | Abbreviation-aware split into one sentence per line + sentence-length cadence visualization. |
| Bulk / Multi-File Cleaner | [doc](./bulk-multi-file-cleaner.md) | Drag-drop multiple .txt/.md/.docx, clean each in-browser, per-file report, ZIP download. |

## Tier 3 - Bigger bets / moonshots

| Tool | Spec | What it does |
|---|---|---|
| Browser Extension | [doc](./browser-extension.md) | Chrome/Edge MV3 companion: right-click clean, clean-on-paste, live-clean ChatGPT/Claude/Gemini output. |
| On-Device AI Rewrite | [doc](./on-device-ai-rewrite.md) | One-click tone/length rewrite via Chrome's built-in Rewriter API (Gemini Nano), with deterministic fallback. |
| Local Voice/Style Memory | [doc](./local-voice-style-memory.md) | On-device style fingerprint (sentence length, contractions, vocab, punctuation) in IndexedDB; flags where a draft stops sounding like you. |
| Obsidian Plugin | [doc](./obsidian-plugin.md) | Intercepts AI-chat pastes via editor-paste, applies cleaning rules before insertion + clean-selection command. |
| WebGPU / WebLLM Rewrite | [doc](./webgpu-webllm-rewrite.md) | Bundled small quantized model via WebLLM + WebGPU so non-Chrome users also get on-device rewrite. |

---

## How to use these docs

- **Picking what to build:** start at the top of Tier 1. The recommended first ship is the **Invisible / Watermark Character Inspector** - lowest effort, sits on detection logic the product already has, high-volume keyword, purest expression of the privacy brand.
- **Each doc's Section 4 (core MVP)** is the buildable v1 scope; **Section 5** is the backlog of engagement features to layer in over time.
- **Section 7** in each doc has the client-side implementation plan (algorithms, libraries, edge cases) so a tool can go straight to scaffolding.
- **Section 9** gives the SEO outline and internal-link plan - every tool page should cross-link siblings to build the hub-and-spoke structure described in `RESEARCH.md`.

# SEO-TODO.md — Per-Tool SEO Plan

> Suggestions only — nothing here is implemented yet. A practical, tool-by-tool plan to make each of the 20 tools more discoverable in search. Companion to `LAUNCH.md` (overall launch plan) and `LAUNCH-CHECKLIST.md` (human tasks).
>
> **How to use this:** start with Section A (template upgrades that lift every page at once), then work the **Tier 1** tools in Section B first. Don't spread effort evenly — the priority guide at the bottom says where to spend it.

---

## A. Template upgrades — apply once, every tool page benefits

These are the highest-leverage changes because you edit the page *pattern* once and all 20 tools inherit them.

| # | Upgrade | Why it matters | Effort |
|---|---|---|---|
| 1 | **"How to use" numbered steps + `HowTo` JSON-LD** on action tools | Eligible for HowTo rich results and "how to remove…" featured snippets. FAQ schema is already there; HowTo is the missing one. | Med |
| 2 | **One-sentence definition `<p>` directly under the H1** ("An em dash remover is a tool that…") | This is the exact text Google lifts for the featured snippet / People-Also-Ask box. | Low |
| 3 | **"Use cases / Who it's for" block** (students, SEO, freelancers, devs) | Naturally captures long-tail intent variants without keyword stuffing. | Low |
| 4 | **Contextual in-body links** to the tool's supporting blog post + 1–2 sibling tools | In-body editorial links pass more weight than the footer/RelatedTools links alone. | Low |
| 5 | **`SoftwareApplication` / `WebApplication` schema with `aggregateRating`** (once you have reviews/usage) | Unlocks star ratings in the search result. | Med |
| 6 | **Unique, keyword-front-loaded `<title>` + meta description** per tool | Audit the weaker pages; the primary keyword should lead the title. | Low |
| 7 | **`Speakable` schema** on Read-Aloud + an **"Updated" date** on every page | Freshness signal; Speakable helps voice surfaces. | Low |

---

## B. Per-tool keyword, expansion & "alternative-to" plan

For each tool: the primary keyword to own, the best long-tail variations / dedicated pages to capture, the competitor to write an "alternative" page against, and a supporting blog post to anchor the cluster.

### Tier 1 — proven, high evergreen demand (do these first)

| Tool | Primary keyword | Long-tails / variant pages to capture | "Alternative to" page | Supporting blog post |
|---|---|---|---|---|
| **Em Dash Remover** (core, `/`) | em dash remover | remove em dash in Word / Google Docs / Gmail; replace em dash with comma; chatgpt em dash | undash, DashAway | ✅ several already |
| **Invisible Character Inspector** | invisible character remover | remove U+200B / U+202F; zero-width space remover; chatgpt watermark checker | invisiblecharacterviewer.com | "What is a zero-width character" |
| **Word & Reading-Time Counter** | reading time calculator | words to minutes; speech / essay word count; X / LinkedIn character counter | wordcounter.net (long-tail only — don't fight the head term) | "How long does X words take to read" |
| **Before/After Diff Viewer** | text diff checker | compare two texts online; find the difference between two paragraphs | diffchecker | "How to compare two versions of text" |
| **Readability Scorer** | readability checker | flesch-kincaid calculator; what grade level is my writing | Hemingway (free alternative) | "What's a good readability score" |
| **Emoji & Symbol Stripper** | remove emojis from text | strip emoji online; remove decorative bullets | — | "Why AI adds emojis & bullets" |
| **Case Converter** | case converter | sentence case / title case / UPPERCASE-to-lowercase (one page each — see Section C) | convertcase.net | "Title case rules (AP vs Chicago)" |
| **Whitespace & Reflow Fixer** | remove line breaks | fix PDF line breaks; remove extra spaces; delete blank lines | textfixer | "Fix text copied from a PDF" |
| **Paste-from-Word Cleaner** | clean formatting from Word | remove Google Docs formatting; strip mso styles | CleanPaste | "Why pasted text has weird formatting" |

### Tier 2 — moderate / trend-driven

| Tool | Primary keyword | Long-tails / variant pages | "Alternative to" | Supporting blog post |
|---|---|---|---|---|
| **AI-Tell Report** | AI writing checker (free) | why does my text sound like AI; sentence variety checker | — | ✅ signs-of-ai-writing |
| **Homoglyph Detector** | homoglyph detector | confusable characters; cyrillic look-alike letters | Originality.AI tool | "Homoglyph attacks explained" |
| **Straight-to-Curly Quotes** | smart quotes converter | straight to curly quotes; add typographic apostrophes | — | "Curly vs straight quotes" |
| **Sentence Splitter** | split text into sentences | one sentence per line; sentence-per-line tool | sentencesplitter.com | "Audit your sentence cadence" |
| **Passive-Voice Highlighter** | passive voice checker | weasel word checker; -ly adverb highlighter | Grammarly (free alternative) | "Passive voice as an AI tell" |

### Tier 3 — niche but sticky

| Tool | Primary keyword | Long-tails / notes |
|---|---|---|
| **Read-Aloud Proofreader** | read text aloud | text to speech proofreading; read my essay aloud. Add `Speakable` schema. |
| **Bulk Multi-File Cleaner** | bulk text cleaner | batch remove formatting; clean multiple .txt / .docx |
| **Browser Extension** | em dash remover chrome extension | **+ Chrome Web Store listing SEO is a separate channel** (optimize the store title/description) |
| **Obsidian Plugin** | obsidian clean AI paste | **+ Obsidian community plugin directory is a separate channel** |

### Tier 4 — speculative (skip dedicated SEO; keep as on-site differentiators)

| Tool | Reality |
|---|---|
| **On-Device AI Rewrite** | Keyword "free AI rewriter no signup" is brutally competitive; browser-support limits usage. Treat as a differentiator, not a traffic driver. |
| **WebGPU Rewrite** | Not an SEO play. A moat / PR piece for HN / Lobsters ("in-browser LLM"). |
| **Voice / Style Memory** | Almost no search demand ("writing style analyzer" is weak). Novel concept nobody searches for. Manage expectations. |

---

## C. The two biggest programmatic-SEO plays (high effort, high return)

1. **Case Converter sub-pages.** Each case is its own high-volume search. Spin up dedicated pages — `/tools/sentence-case`, `/tools/title-case-converter`, `/tools/uppercase-to-lowercase`, etc. — each a thin wrapper around the same engine with a unique intro + FAQ. This is exactly how convertcase.net dominates.
2. **Em-dash per-platform how-to pages.** `/remove-em-dash-in-word`, `…-google-docs`, `…-gmail`, `…-chatgpt` — each targets a distinct "how to" search and funnels to the core tool. **Watch for self-cannibalization** with existing blog posts; consolidate so you don't compete against yourself for the same query.

---

## D. Off-page levers (often beat on-page SEO for free tools)

- **Embeddable widget** — an iframe-able "AI-tell checker" or word counter with a "Powered by Em Dash Remover" backlink. Free tools earn links this way.
- **Tool-directory listings** — AlternativeTo, TAAFT, FutureTools. They rank *and* get cited by AI assistants recommending tools.
- **Chrome Web Store + Obsidian directory** — these are their own search engines. Optimize those listing titles/descriptions separately from the website.

---

## Priority guide — where to actually spend effort

1. **First:** Section A items 1–4 across all pages (template upgrades — one effort, twenty wins).
2. **Then:** Tier 1 tools in Section B (keyword titles, long-tail content, one supporting blog post each).
3. **Then:** Section C play #1 (Case Converter sub-pages) — the single biggest programmatic win.
4. **Ongoing:** Section D (widget + directory listings) and Tier 2 supporting posts.
5. **Don't bother:** dedicated SEO for Tier 4. Let those three tools ride as differentiators.

> **The one rule:** don't spread SEO effort evenly across 20 tools. ~8 Tier-1 tools have real demand; concentrate there. The rest are breadth that strengthens the brand and internal-linking web, not individual traffic drivers.

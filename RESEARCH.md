# AI Em-Dash Remover - Research & Strategy

> Compiled 2026-06-14. Built from four parallel research streams: competitor analysis, differentiation/features, tech stack, and growth/marketing. Citations inline.

---

## 0. Executive summary - the strategy in five lines

1. **The niche is crowded and free**, won on SEO and UX. The defensible wedge nobody has nailed: **grammar-aware, context-correct replacement** (not blind find-replace) + **100% client-side privacy** + a **consolidated "de-AI" cleaner** (dashes + invisible chars + quotes + markdown + cliché phrases).
2. **Em dashes are the wedge, not the business.** Use the high-intent, low-competition em-dash niche to rank fast, then expand into the far bigger, more durable **"AI humanizer / clean AI tells"** market.
3. **Frame it as "clean up AI writing for real quality / keep your human voice" - NOT "beat the AI detector."** The detector-bypass framing is an unwinnable arms race and is toxic in writing/student communities.
4. **Stack: Astro + Tailwind v4 on Cloudflare Pages, with an optional Claude Haiku "smart rewrite" edge function.** Cheap, fast, SEO-first, unlimited bandwidth (survives a viral spike).
5. **Privacy is the marketing hook AND the architecture:** "Your text never leaves your browser - check the Network tab."

---

## 1. Competitive landscape

### Dedicated em-dash tools (free, browser-based) - direct competitors
Near-identical pattern: paste box → choose replacement (hyphen/comma/space/remove) → client-side → free → no signup.

| Tool | URL | Notes |
|---|---|---|
| **ConvertCase – Em Dash Remover** | convertcase.net/em-dash-remover | Most feature-rich; also en dashes, smart-quote→straight, ellipsis, NBSP, zero-width stripping. **High domain authority = main SEO threat.** |
| **iloveemdash.com** | iloveemdash.com | Paste OR .txt/.docx upload; shows "AI Content Likelihood"; em-dash only. |
| **GPTClean / GPTCleanup family** | gptclean.co.uk, gptcleanuptools.com | Em/en dashes, emojis, whitespace; client-side. |
| **UnAimyText** | unaimytext.io/em-dash-remover | Brand built on "un-AI-ing" text. |
| **Em Dash Optimizer** | em-dash-optimizer.vercel.app | **Claims grammar-aware** comma/semicolon/en-dash conversion - the only one. |
| Others | metric37.com, emdashremover.com, aitextclean.com, copycleanse.com, word.studio | Broader cleanup suites; em dash is a subset. |

### Browser extensions (real-time, in-place) - best demand signal
- **undash** (Chrome) - replaces em dashes as you type/paste anywhere. **Product Hunt #4 Product of the Day, ~294 upvotes** (June 2025). Users: "I've been manually fixing em dashes for months." Asked for curly-quote + AI-phrase detection (**unmet demand**).
- **DashAway** (open source) - removes em dashes live inside ChatGPT/Claude/Gemini/Perplexity output. Good reference impl: github.com/ronxldwilson/DashAway
- **Em-Dash Replacer**, rm-em-dashes, others - small user bases.

### Full AI humanizers (paid) - adjacent, larger, more lucrative market
Em-dash removal is incidental; they rewrite to bypass detectors.

| Tool | Pricing | Note |
|---|---|---|
| Undetectable AI | ~$9.99–$80+/mo | Market leader, ~$3.7M ARR |
| QuillBot Humanizer | Free 125 words/6 uses/day; $14.95/mo | Best free tier, huge user base |
| Phrasly | $12.99/mo | Often ranked #1 for naturalness |
| StealthGPT, Ryne AI, Walter Writes, HIX/BypassGPT | subscription | Me-too detector-bypass players |

### Table stakes (everyone has these)
Paste box · free · no signup · instant · em dash → hyphen/comma/space/remove · client-side "we don't store your text" · live counts · "works with ChatGPT/Claude/Gemini" framing.

### Gaps / opportunities (what's missing across the board)
1. **Grammar-aware replacement** - almost all do blind find-replace → comma splices and broken sentences. **Biggest open niche.**
2. **One consolidated "de-AI" cleaner** - market is fragmented (separate tools for dashes, invisible chars, quotes). Consolidate: dashes + en dashes + smart quotes + zero-width/invisible chars + markdown artifacts + cliché phrases + rule-of-three patterns.
3. **AI-phrase / cliché detection** - heavily requested, essentially nobody does it well.
4. **Integrations** - almost all are paste-boxes. Gaps: Google Docs add-on, Word/Outlook add-in, Notion, **public API**, bulk/file processing.
5. **Website + companion extension combo** - underexploited.
6. **Invisible watermark-character transparency** - rising concern, underserved.

### Common user complaints
- Broken meaning / awkward output from blind replacement (comma splices).
- Humanizers alter voice/meaning and bypass detectors inconsistently.
- Em-dash removal alone isn't enough to "look human" (drives the consolidated-tool demand).
- Manual, repetitive workflow before extensions.

---

## 2. Product strategy & prioritized features

### Strategic thesis
Two camps, both flawed: **dumb cleaners** (free but break grammar, no moat) and **AI humanizers** (paywalled, losing the detector arms race, upload your text). **Your wedge:** free, 100% client-side, privacy-first, grammar-aware, positioned for *quality* not *detector evasion*.

### TIER 1 - MVP (must-have, all client-side, instant)
| Feature | Difficulty | Why |
|---|---|---|
| **Grammar-aware em-dash replacement** | Med | The #1 differentiator (logic below). |
| **100% client-side processing** | Low–Med | Provable privacy, <100ms, no data-processor liability. |
| **Curly→straight quotes & apostrophes** | Low | 2nd-most-cited punctuation tell; trivial regex. |
| **Char cleanups** - zero-width chars, NBSP, lookalike glyphs, stray markdown (`**`/`##`), emoji bullets | Low | Matches the best free tool's bar. |
| **Before/after diff view** | Low–Med | Trust; use Google `diff-match-patch` + diff2html. |
| **Instant live processing** (debounced ~150–300ms) | Low | Feels magical vs humanizers' spinners. |
| **One-tap copy, no signup, no ads, unlimited** | Low | Goodwill the freemium incumbents burned. |
| **Mobile-responsive + accessible (WCAG)** | Low–Med | Paste-and-clean is a mobile micro-task; diff must not rely on color alone. |

### The core replacement logic (the thing to get right)
An em dash does ~8 jobs, each with a *different* correct fix (Merriam-Webster, Chicago, Punctuation Guide):
- Parenthetical aside `text - aside - text` → **pair of commas/parentheses** (match the pair).
- Appositive with internal commas → **parentheses**.
- Summary/explanation lead-in ("one goal - winning") → **colon**.
- Two independent clauses ("it worked - we were stunned") → **semicolon/period** (a comma here is the classic naive-tool splice bug).
- Abrupt break → **period**.
- "and"/"but" connector → **restore the conjunction**.
- Range ("May-September") → **en dash** (never a comma).
- Dialogue cut-off / omitted text → **keep**.
- Also: `--` → proper dash, repair dash mojibake, offer AP (spaced) vs Chicago (closed) spacing.
- **This is where an LLM beats regex** → ship rules + lightweight NLP as the free instant default; reserve a server LLM for a premium "deep rewrite" tier.

### TIER 2 - Best-in-class differentiators
| Feature | Difficulty | Why |
|---|---|---|
| **AI-tell scanner + explainer** (report & coach, not just strip) | Med | Nobody does it; huge SEO surface. |
| **Phrase/pattern detection** ("it's not just X, it's Y", "in today's fast-paced world", rule-of-three, hedging) | Med | Highest-signal tells after em dashes. |
| **Overused-vocab flagging** (delve, tapestry, leverage, robust, realm, testament, seamless…) | Low flag / Med rewrite | The "AI accent." |
| **Readability scoring + Hemingway-style highlights** | Low | Pure client-side arithmetic (`text-readability`). |
| **Accept/reject per change** (track-changes editor) | Med | Turns the diff into an editor. |
| **File formats .txt/.md/.docx + batch** | Low–Med | `mammoth.js` reads .docx in-browser (keeps privacy story); faithful re-export is the hard part. |
| **Polished browser extension** | Med | Distribution = the real moat. |
| **PWA + Web Share Target** | Low–Med | "Share-and-clean" on mobile; offline. |
| **Premium server-LLM tier** ("deep humanize" / tone rewrite) | Med–High | The monetization layer; disclose + no-retention guarantee. |

### TIER 3 - Moonshots
- **Opt-in in-browser LLM** (WebLLM / transformers.js, WebGPU) - LLM-quality rewriting that never leaves the device; gated by ~350MB–2GB download.
- **Native integrations** (Google Docs/Gmail → Word → Notion last; Notion API is hostile to prose).
- **Public API with word-based metering** (B2B, high margin).
- **"Style memory" / personal voice profile** - rewrite toward the user's real voice. Durable moat.
- **"Why this is a tell" education layer** - content/SEO flywheel.

### Marketing copy pillars
1. "Your text never leaves your browser - check the Network tab."
2. "Grammar-correct, not just deleted."
3. "Clean AI writing for real quality - not to beat detectors."

### Recommended build order
MVP (grammar-aware dash + char cleanups + client-side + diff + instant) → AI-tell scanner + readability → extension + file/batch → premium LLM tier + Google Workspace integration → moonshots.

---

## 3. Recommended tech stack (2026)

| Layer | Pick |
|---|---|
| Framework | **Astro 5** (one React island for the widget) |
| Styling | **Tailwind CSS v4** + a few hand-built components (skip shadcn/ui) |
| Hosting | **Cloudflare Pages + Workers** |
| LLM (optional smart mode) | **Anthropic Claude `claude-haiku-4-5`** via a Cloudflare Worker |
| Analytics | **Plausible** (add **PostHog** only for funnels/A-B) |
| Abuse protection | **Cloudflare Turnstile** + Workers rate limiting |
| Monetization (later) | **Stripe Checkout**; defer auth |
| Client text processing | Plain TypeScript/regex + `Intl.Segmenter` |

### Why
- **Astro** ships zero JS by default, hydrates only the widget island → best Core Web Vitals → wins the SEO game this product lives on. (~8KB JS vs ~85KB for comparable Next.js.) Next.js is overkill until there's a logged-in dashboard; SvelteKit is a fine lean alt; plain Vite+React SPA is wrong for SEO.
- **Cloudflare Pages** - **unlimited bandwidth at every tier** (critical for a free tool that could go viral on Reddit/HN), Workers have near-zero cold start, $5/mo cheapest paid vs $20 for Vercel/Netlify.
- **LLM only as opt-in "Smart rewrite."** Most value is free client-side regex. Use **`claude-haiku-4-5`** - mechanical punctuation rewrite, not reasoning.

### Current Claude models & pricing (Anthropic skill, cached 2026-06-04)
| Model | ID | Input $/1M | Output $/1M |
|---|---|---|---|
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3.00 | $15.00 |
| Claude Opus 4.8 | `claude-opus-4-8` | $5.00 | $25.00 |

**Cost per cleanup** (~500 in + 500 out tokens, Haiku) ≈ **$0.003** (3 requests/cent).

### Edge-function notes
Call Claude from a **Worker** (key stays server-side) via `@anthropic-ai/sdk`. Use **structured outputs** for clean JSON, **stream** large pastes, **cache the system prompt** (`cache_control: ephemeral`). Protect with **Turnstile** + IP rate limits (e.g. 10/min, 100/day), hard input cap (~8K chars), and a monthly spend cap in the Anthropic Console. Fall back to client-side regex on errors/refusals.

### Rough monthly cost
| | Low (~5K visits, 500 smart calls) | Medium (~100K, 20K) | High (~1M, 200K) |
|---|---|---|---|
| Hosting | $0 | $5 | $5–20 |
| Bandwidth | $0 | $0 | $0 |
| Claude Haiku | ~$1.50 | ~$60 | ~$600 |
| Analytics | $9 | $19 | $69 |
| **Total** | **~$10** | **~$85** | **~$675** |

The LLM is the only line that scales - which is why smart mode should be opt-in, rate-limited, and behind a paid tier.

---

## 4. Growth / SEO / marketing playbook

### Strategic insight
Em dashes are past peak novelty (peaked Feb–Nov 2025; Sam Altman tweeted the ChatGPT fix Nov 14, 2025). The durable money is the **"AI humanizer"** cluster ("ai humanizer" ~47K/mo, "humanize ai text" ~42K/mo, "how to humanize AI content" +943% YoY). Rank fast on em dashes → expand into the humanizer/cleanup cluster. **Never frame as detector-bypass** (toxic in writing/student communities; em-dash-as-AI claim is publicly contested).

### SEO targets
| Cluster | Examples | Volume | Difficulty | Verdict |
|---|---|---|---|---|
| **Em dash removal** | "em dash remover", "remove em dashes from text", "remove em dash from chatgpt" | Low–mod | **LOW** | **Primary tool target** |
| ChatGPT em dash (info) | "why does chatgpt use em dashes" | Low–mod | LOW–MED | Top-of-funnel blog |
| AI humanizer | "ai humanizer", "humanize ai text" | ~40–47K/mo | **HIGH (KD 69–74)** | Aspirational; long-tail first |
| Make AI sound human | "make ai text sound human" | Moderate | MEDIUM | Secondary target |
| AI detector / bypass | "bypass ai detector" | Very high | **VERY HIGH** | Avoid; comparison content only |
| AI writing tells | "signs of ai writing", "words that give away ai" | Low–mod | LOW–MED | **Content moat** |

Target **KD 0–15** first; expect **3–6 months** to traction. (Hard em-dash volumes aren't published - inferred from landscape.)

### Content strategy
- **Programmatic tool pages** (each genuinely functional, not thin clones): removers (em/en dash, hyphens, smart quotes, ellipsis, NBSP, **zero-width/invisible "AI watermark" chars**), replace-pattern pages, and **platform how-to pages** (Word, Google Docs, Excel, Notion). Hub-and-spoke internal linking. FAQ + SoftwareApplication schema on every page.
- **Blog cornerstones:** "How to stop ChatGPT using em dashes", "Words that give away AI writing", "Em dash vs en dash vs hyphen", "Why does ChatGPT use em dashes?".

### Launch channels
- **Product Hunt** - 12:01 AM PST, ~200–400 pre-warmed supporters, comments weighted heavily, point "Visit" at the live no-login tool. #1 ≈ 5–10K+ visitors. Never buy votes.
- **Reddit** (priority): r/SideProject → r/InternetIsBeautiful (**no signup + genuinely novel**) → r/ChatGPT + r/OpenAI (before/after screenshots, **link in top comment**) → r/EditingAndProofreading. **Avoid humanizer framing in r/writing, r/Students, r/college.** Meet karma/age gates, ~9:1 value-to-promo.
- **Hacker News (Show HN)** - lead with **privacy: "your text never leaves your browser."** No signup. Plain text, maker first-comment. Front page ≈ 3,000+ visitors/hr. ~1.4 GitHub stars/upvote if open-sourced.
- **X/Twitter** - build-in-public, before/after GIFs, **links in first reply** (not the post). Engage @levelsio, @marc_louvion, @arvidkahl.
- **TikTok/Reels/Shorts** - strongest organic lever; the em-dash trend lives here. Faceless screen-rec demos, hook in 1–3 sec. Before/After, POV, listicle ("3 dead giveaways your essay was AI"), myth-bust. Post 5–7×/week, multiple accounts.
- **LinkedIn** - document/PDF carousels ("7 dead giveaways your post was AI"); post natively; engage ghostwriters.

### Viral mechanics
- **Before/after** is the meme - one-click copy, screenshot-friendly.
- **"AI-tell score"** meter that drops as you clean (em dashes 14 → 0).
- **Invisible-character / "AI watermark" detector** as a novelty hook.
- No login, instant, client-side (load-bearing for r/InternetIsBeautiful + HN + conversion).
- Self-aware tone ("RIP the em dash, 2022–2025"); join the "em dash defender" side.

### Riding the trend in mid-2026
It's now a cultural reference, not a scoop. Best plays: the fresh beats ("Altman fixed it - but only via custom instructions, and not for *pasted* text"), the "em dash defender" angle, cite real data (GPT-4.1 ≈ 3.28× human em-dash frequency; "markdown leaking into prose"). **Do NOT use the Gwyneth-Paltrow rumor (no evidence).**

### Monetization
- **Affiliate = best early money** (audience pre-qualified): Originality.ai 25% recurring, Jasper 30% recurring, Grammarly. 
- **Display ads** only pay at scale and utility pages earn low ($0.20–$2.50/1K pageviews); Raptive now accepts 25K pageviews (~$50 RPM) but a bare tool page may fail quality bar - the blog cluster helps.
- **Freemium is where the category's revenue is** - gate by word limits + advanced modes (competitors $9.99–$31/mo). 0.5% of 1M visits at $12/mo ≈ $60K/mo.
- **API/credit sales** for B2B. **Exit:** tool sites sell at 30–40× monthly profit.

### 30 / 60 / 90-day plan
- **Days 1–30 - Build the wedge:** ship core em-dash remover (free, no login, client-side) + AI-tell score + before/after. 8–12 programmatic pages + 3 cornerstone blogs. Affiliate links. Start TikTok/Shorts (5×/week). Target KD 0–15. Warm up X + LinkedIn.
- **Days 31–60 - Launch loud:** Product Hunt → Show HN (privacy angle) → Reddit (SideProject → InternetIsBeautiful → ChatGPT). Add invisible-char remover viral hook. Double down on best TikTok format. LinkedIn carousel.
- **Days 61–90 - Expand to the money cluster:** "AI text cleaner / make AI sound human" pages, medium-KD terms. Add Pro tier (bulk, batch, API). Apply to Raptive if past 25K pageviews. Optimize affiliate placements.

### Caveats
No published hard volumes for em-dash/AI-tells clusters (inferred). Em-dash trend is cooling - diversify into humanizer cluster early. Avoid cheating/bypass framing. Don't use the Paltrow rumor.

---

## 5. Bottom line - what makes us best
1. **Grammar-aware replacement** (the one thing every competitor does badly).
2. **100% client-side privacy** (provable; no humanizer can match it).
3. **Consolidated "de-AI" cleaner** (dashes + invisible chars + quotes + markdown + cliché phrases + AI-tell score) instead of a single-trick tool.
4. **Quality positioning, not detector-bypass** (sidesteps the arms race and the ethics backlash).
5. **Distribution moat:** website + companion extension + API + Google Docs/Word add-ons that the pure paste-box tools lack.
6. **Cheap, fast, viral-proof stack:** Astro + Cloudflare (unlimited bandwidth) + opt-in Claude Haiku smart mode.

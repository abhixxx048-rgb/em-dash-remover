# LAUNCH.md - Em Dash Remover Launch Playbook

> Synthesized from 6 research lenses (SEO, launch/distribution, analytics, engagement/UX, content marketing, competitive). Decisive, sequenced, tailored to **emdashremover.app** - a free, 100% client-side text-cleaning suite of ~20 tools + Chrome/Edge extension + Obsidian plugin. Goal priority: **SEO > tool-usage analytics > engagement > marketing.**

---

## Completeness Critic - gaps & contradictions across lenses (read first)

These are the things no single lens fully resolved. They are folded into the plan below; flagging them so nothing slips.

1. **"Privacy is the wedge" vs "privacy is table stakes."** The launch/UX/content lenses lean on provable privacy as *the* differentiator; the competitive lens proves Originality.AI and CopyCleanse already say the identical "text never leaves your device" line. **Resolution:** privacy is the *credibility floor*; the actual wedge is **breadth + provable transparency + one engine across web/extension/Obsidian + "defend the human voice."** Privacy is *how* you earn trust, not *why* you win.
2. **Reddit account aging is a hard gate, but the timeline conflicts with "launch this week."** Aging needs 2–4 weeks; you cannot retroactively age an account. **Resolution:** start aging TODAY; the coordinated PH/HN/Reddit week fires ~3 weeks out. Don't compress this - a shadowban on r/ChatGPT (4.2M) is unrecoverable.
3. **Analytics "no consent banner" vs existing AdSense banner.** Umami/Cloudflare are cookieless (no banner needed); AdSense requires Consent Mode v2 (banner needed). **Resolution:** keep the existing ConsentBanner gating *only* the AdSense tag; fire Umami unconditionally. Documented in §6.
4. **The em-dash meme is a tailwind AND a decay risk.** OpenAI "fixed" it Nov 2025, so the trend will cool. **Resolution:** newsjack hard NOW, but build the durable evergreen clusters (invisible chars, paste-from-Word, smart quotes) that survive the meme. Don't bet the whole content engine on a meme with a half-life.
5. **AdSense brand-safety risk is under-weighted by most lenses.** The category is full of "bypass/undetectable" sites Google pattern-matches as spam. **Resolution:** zero "bypass/evade/undetectable/cheat" language anywhere; ship an explicit "Why we're not a humanizer" FAQ. This is a launch-blocker for both AdSense approval and SEO.
6. **No lens owns the "what ships before go-live" cut line.** Several "P0" items are really week-1, not launch-blockers. §3 makes the genuine launch-blocker cut explicit.
7. **Open-sourcing the engine is mentioned but never decided.** It's the single biggest HN trust multiplier and the strongest provable-privacy signal. **Decision: open-source the core cleaning engine (`src/lib/tools/*`) on GitHub before the Show HN.** It's already client-side JS/TS; the moat is the brand + suite + distribution, not the regex.

---

## 1. TL;DR

**The 5 highest-leverage moves (in order):**

1. **Start aging Reddit + Indie Hackers accounts TODAY** with genuine, link-free help in r/ChatGPT, r/writing, r/ObsidianMD, r/SEO. This gates your entire launch week and cannot be rushed.
2. **Ship privacy-safe analytics (Umami + Cloudflare WA) with a per-tool event taxonomy BEFORE go-live.** You get exactly one week-one; if you can't see which of the 20 tools convert, the launch spike is wasted data.
3. **Fix the one-way-spoke problem: `<RelatedTools>` module + footer tool-grid on all 20 pages.** One PR that simultaneously lifts pages/session, drives extension installs, and builds the internal-link web SEO needs.
4. **Newsjack the "OpenAI fixed the em dash" moment** with a how-to + "every doc you already pasted still has them, and so does Claude/Gemini" angle - across the homepage H1, Show HN, PH, and the invisible-character pillar post.
5. **Run launch week as a backlink campaign, not a traffic spike:** Show HN (open-sourced engine) + self-hunted PH + value-first Reddit + directories (BetaList, TAAFT, AlternativeTo vs undash/DashAway). These are do-follow links ChatGPT/Claude cite for tool recs - they serve goal #1 (SEO) directly.

**The single positioning wedge:** *The honest, all-in-one, provably-private AI-text toolkit - one engine across web, extension, and Obsidian - that helps your real writing stop getting mistaken for a robot's. (Not a detection-bypass humanizer.)*

**The one tagline to lead with:**
> **Remove em dashes & AI tells - free, no signup, nothing leaves your browser. Check the Network tab.**

---

## 2. Positioning & Messaging

**The wedge (3 pillars competitors can't combine):**
- **Breadth:** ~20 tools on one trusted brand. No competitor has a suite - they fight over a single character (undash, DashAway) or a single page (convertcase).
- **Provable transparency:** not just "we don't upload" - *verify it yourself* (live "Network requests: 0" counter, airplane-mode demo, open-source engine on GitHub).
- **Same engine everywhere:** web + Chrome/Edge extension + Obsidian plugin. Nobody ships one engine across all three surfaces.

**Editorial north star:** *Defend the human voice.* The sympathetic, link-worthy story (Rolling Stone, Air Mail) is real writers being falsely accused of AI for using em dashes - not "how to cheat detectors."

**Tagline options:**

| Use | Tagline |
|---|---|
| Homepage hero / lead | Remove em dashes & AI tells - free, no signup, nothing leaves your browser. |
| Product Hunt | Remove em dashes & AI tells - free, no signup, nothing leaves your browser. |
| Show HN (title) | Show HN: Em Dash Remover – strip AI tells from text, 100% in-browser (no upload) |
| LinkedIn / pro-writer | Recruiters now flag em dashes as AI. Check and clean any doc before you send it. |
| Privacy-led variant | Privacy you can verify, not trust. A text cleaner that never sees your text. |
| Craft variant | Keep your human voice. Strip the AI tells, not your style. |

**What to AVOID, and why:**

| Avoid | Why |
|---|---|
| "Bypass / evade / beat AI detection," "undetectable," "humanizer" | Google spam-policy-adjacent; risks AdSense approval; Originality.AI publicly debunks that removing invisible chars bypasses detectors - you'd be selling a lie and inheriting a penalized neighborhood. |
| Leading with privacy *alone* | Table stakes - Originality.AI & CopyCleanse already say the exact same line. Pair privacy with breadth + proof. |
| Hype/superlatives in HN title | HN distrusts marketing; neutral-technical titles win. |
| Implying watermarks are intentional/sinister | They're byproducts. Honest framing ("these are artifacts, not a secret watermark") wins trust and avoids the bypass trap. |
| Same post blasted to all subreddits same day | Cross-post spam detection → shadowban. |

**Ship this FAQ (captures high-intent query honestly + cements positioning):**
*"Does this bypass AI detection?" → "No - and it doesn't work. Removing characters doesn't change the statistical patterns detectors use. We help your real writing not get mistaken for a robot's, not help robots hide."*

---

## 3. Pre-Launch Checklist (P0 launch-blockers)

Genuine cut line: **must be true before the Show HN / PH go live.** (Items marked → week-1 are important but not blockers.)

**SEO technical**
- [ ] Core page (`/`) + each `/tools/<slug>` has unique 400+ word body, title, H1, FAQ JSON-LD. Index-gate (noindex) any page under ~400 words until fleshed out.
- [ ] Homepage H1 + PH tagline explicitly name **ChatGPT / AI** so trend search traffic lands here.
- [ ] `@astrojs/sitemap` building; submit to **Google Search Console + Bing Webmaster**; enable Cloudflare **Crawler Hints**; "Request Indexing" on the core + top 5 tool pages.
- [ ] BreadcrumbList JSON-LD + breadcrumb UI on every tool page.
- [ ] Newsjack post live: *"OpenAI 'fixed' the em dash. Here's how to clean the millions of docs you already pasted (and Claude/Gemini still do it)."*
- [ ] "Why we're not a humanizer" FAQ live (AdSense + brand safety).
- [ ] Core Web Vitals check on tool pages: **reserve fixed ad-slot heights** (dynamic tool output + ad = CLS trap). Analytics scripts `defer`/`async`.

**Analytics instrumentation** (whole point of measuring week-one)
- [ ] Cloudflare Web Analytics enabled (one click on Pages).
- [ ] Umami Cloud Hobby (free, 100k events/mo) live, script proxied first-party via Cloudflare, loaded `defer`.
- [ ] Central `track(name, props)` wrapper in `src/lib/` with guardrails: event-name allowlist, max prop length (64 chars), reject keys matching `/text|content|input|value|paste/`, bucket numeric lengths. **Never transmit user text.**
- [ ] Core funnel events wired on every tool island: `tool_view`, `input_received`, `clean_run`, `output_copied`, plus `extension_cta_click` / `obsidian_cta_click`.

**Must-have engagement features**
- [ ] `<RelatedTools currentSlug>` module on all 20 tool pages (3–4 hand-curated workflow tiles). *Today every page only links UP to `/tools` - confirmed one-way spokes.*
- [ ] Categorized footer tool-grid in `Base.astro` (all 20 tools, every page).
- [ ] "Try a sample" button + real "Copied!" state on the core cleaner + Word Counter (kills empty-textarea bounce).
- [ ] Live "Network requests this session: 0" counter + "No upload · No signup · Works offline" trust strip above tool output.
- [ ] Open-source the cleaning engine (`src/lib/tools/*`) on GitHub; link it (HN trust multiplier + provable-privacy proof).

**→ Week-1 (not blockers):** PWA manifest + service worker; contextual extension CTA after 2+ cleans; workflow-chaining "next step" buttons with sessionStorage pre-fill; press/launch kit page.

---

## 4. Launch Week Calendar

**Pre-week (now → T-21 days):** age Reddit + IH accounts (100+ karma, link-free help); submit **BetaList now** (free queue ~2 months); submit Obsidian plugin to community catalog (review queue); record the 15-sec "paste in → clean out → Network tab empty" clip; draft all channel-native copy + press kit.

Launch on a **Tuesday–Thursday.**

| Day | Channel | Action / exact framing |
|---|---|---|
| **Mon (T-1)** | Prep | Line up 15–30 warmed contacts (share link, never "please upvote"). Schedule PH for 00:01 PT. Finalize HN maker first-comment. |
| **Tue 00:01 PT** | **Product Hunt** (self-hunt) | Tagline: *"Remove em dashes & AI tells - free, no signup, nothing leaves your browser."* 2+ gallery images + demo GIF (paste→clean + empty Network tab). Maker comment: the em-dash-as-AI-tell moment, client-side verifiable, explicitly **not** a detection bypass. |
| **Tue 8–10am ET** | **Show HN** | Title: `Show HN: Em Dash Remover – strip AI tells from text, 100% in-browser (no upload)`. First comment: the WHY, link the open-source engine, "verify in DevTools Network tab," "not an AI-detection bypass." Reply to every comment in your own voice. |
| **Tue AM** | **X + LinkedIn** | X: screen-recording of empty Network tab - "privacy you can verify, not trust"; quote-reply into the live em-dash discourse (Altman's fix tweet, Rolling Stone). LinkedIn: *"Recruiters now flag resumes with em dashes as AI - here's a free way to check and clean any doc before you send it."* All point at PH/HN. |
| **Tue** | **r/InternetIsBeautiful** | Free single-purpose framing: "I built a free, 100% in-browser tool that reveals the invisible characters hiding in AI text." (huge for free single-purpose tools) |
| **Wed** | **r/ChatGPT (4.2M)** | Find/answer a "how do I remove em dashes" thread with the manual method, THEN: *"full disclosure, I also built a free tool that does this client-side - nothing leaves your browser."* Value first. |
| **Wed** | **Directories wave 1** | TAAFT, FutureTools, Futurepedia, TopAI.tools, **AlternativeTo** (list as alternative to undash, DashAway, QuoteCleaner, wordcounter.net, diffchecker, Hemingway). Do-follow + AI-citation layer. |
| **Wed** | **Indie Hackers** | Build-in-public post: "I launched a privacy-first em dash remover - here's the why and the early numbers," not a link drop. |
| **Thu** | **r/writing + r/freelanceWriters + r/copywriting** | Emotional hook: real writers falsely accused of AI for using em dashes. Tool earns itself. |
| **Thu** | **r/ObsidianMD + r/Notion** | Lead with the **plugin / paste-cleaner** use case ("my Obsidian plugin just got approved"), not the web app. |
| **Thu** | **r/SEO (380K) + r/SideProject + r/SaaS / r/startups share threads** | r/SEO: the internal-linking/hub-spoke + privacy build story. Weekly share threads for the rest. |
| **Fri** | **Peerlist + Uneed + MicroLaunch + SaaSHub** | Tier-2 directories for a second spike; extends the cycle. |
| **Following week** | **Mini-launch #2** | Re-launch the **Invisible/Watermark Character Inspector** standalone (own URL + OG image) on Show HN / r/InternetIsBeautiful / X - the "wait, those were hidden in my text?!" reveal extends the news cycle. |

> **Lobsters:** only if a member invites you; frame purely technically (client-side zero-width/homoglyph detection). Extremely marketing-allergic.

---

## 5. SEO Plan

**Keyword targets**

| Keyword | Intent | Target page | Priority |
|---|---|---|---|
| em dash remover | transactional | `/` (core) | P0 |
| chatgpt em dash / remove em dash chatgpt | informational→tool | `/` + newsjack post | P0 |
| remove em dash in Word / Google Docs / Gmail | how-to | how-to posts → `/` | P0 |
| invisible characters in text / zero-width character | informational | pillar post → inspector tool | P0 |
| chatgpt watermark / remove invisible characters | transactional | `/tools/invisible-watermark-character-inspector` | P0 |
| U+202F / U+200B remover | long-tail transactional | inspector tool | P1 |
| homoglyph detector / confusables | transactional | `/tools/homoglyph-confusables-detector` | P1 |
| paste from Word weird characters / clean formatting | how-to→tool | `/tools/paste-from-word-docs-cleaner` | P1 |
| remove curly quotes / smart to straight quotes | transactional | `/tools/straight-to-curly-quotes-converter` (+ inverse) | P1 |
| remove line breaks / fix pdf line breaks | transactional | `/tools/whitespace-line-break-reflow-fixer` | P1 |
| word counter / character count | evergreen transactional | `/tools/word-reading-time-counter` | P2 |
| readability checker / flesch-kincaid / hemingway alternative | transactional | `/tools/readability-grade-level-scorer` | P2 |
| text diff / diffchecker alternative | transactional | `/tools/before-after-diff-viewer` | P2 |
| passive voice checker / weasel words | transactional | `/tools/passive-voice-weasel-word-highlighter` | P2 |
| are em dashes a sign of AI / falsely accused of using AI | informational (link magnet) | op-ed + AI-tells cluster | P1 |
| undash alternative / DashAway alternative | comparison | comparison pages | P1 |
| remove emojis from text | transactional | `/tools/emoji-decorative-symbol-stripper` | P2 |

**Do NOT chase** "bypass AI detection / undetectable" head terms (penalty + brand risk).

**Programmatic SEO across the 20 tools:** each `/tools/<slug>` is its own indexed landing page and link target - unique 400+ words, intent-matched H1, "how to + why" body, FAQ JSON-LD, BreadcrumbList JSON-LD, and 3–4 contextual `<RelatedTools>` links. Multiplies link-acquisition surface (e.g. pitch the word counter into "word counter" roundups, the diff viewer into "diffchecker alternative" lists).

**Internal linking - hub & spoke:**
- **Hub:** `/` (core cleaner) + `/tools` index.
- **Spokes:** every blog post deep-links its matching tool (e.g. "signs of AI writing" → human-voice-ai-tell-report, emoji-stripper, passive-voice-highlighter). Every tool page `<RelatedTools>` cross-links 3–4 siblings + back to the core. Footer grid puts a link to all 20 on every page. This routes link equity to the 15+ long-tail tools that won't earn external links alone.

**Schema:** keep FAQ JSON-LD (aids AI-citation ~2.8x); add BreadcrumbList; SoftwareApplication/WebApplication on tool pages; Article on posts.

**Search Console / indexing steps:** verify GSC + Bing → submit sitemap → Cloudflare Crawler Hints on → Request Indexing for core + top 5 tools → monthly: rank tool pages by `GSC impressions × Umami copy-conversion` to find "ranks but doesn't engage" (fix UX) vs "engages but doesn't rank" (build links).

---

## 6. Analytics & Instrumentation

**Stack (privacy-safe, respects "text never leaves device"):**

| Layer | Tool | Job | Notes |
|---|---|---|---|
| SEO baseline | Cloudflare Web Analytics | pageviews, referrers, countries | already 1-click; cookieless, no banner; but no custom events, 10% sample, 15-row cap, 30-day retention - cannot build per-tool funnels |
| Product analytics | **Umami Cloud Hobby (free, 100k events/mo)** | per-tool custom events, funnels | cookieless, no PII, no banner; data-attribute events; self-host fallback (~$5 VPS) when nearing cap |
| SEO keywords | Google Search Console + Bing | impressions/clicks/position per URL | join key = tool slug |
| Ad revenue | AdSense dashboard | CTR/revenue | reconcile in AdSense, don't pull PII into Umami |

**Avoid:** Microsoft Clarity / Hotjar (cookies + PII + possible AI-training use → breaks promise + forces banner). Get heatmap-style insight via content-free `scroll_depth` + `section_click` events instead.

**Consent posture:** Umami + Cloudflare fire **unconditionally** (cookieless, exempt). Keep the existing ConsentBanner gating **only** the AdSense tag. Update `/privacy` + `/cookies`: *"Usage analytics are anonymous, cookieless, and never receive your text; only the ad network uses cookies, which you control here."*

**Event taxonomy** (one event per stage; `tool` prop = page slug; counts/metadata only, never text):

| Event | Trigger | Why it matters |
|---|---|---|
| `tool_view` | pageview (auto) | top of per-tool funnel; uniform across all 20 |
| `input_received` `{tool, len_bucket}` | first paste/type | did they engage the textarea at all? |
| `clean_run` `{tool, removed_total, em_dashes, smart_quotes, invisible}` | primary action | core usage + what AI tells are actually out there (PR data) |
| `first_clean_run` `{tool}` | session's first clean | truest activation / "aha" signal |
| `output_copied` `{tool}` | copy button | **value delivered** - the key metric |
| `output_downloaded` `{tool, format}` | download | value for bulk/file tools |
| `tool_switched` / `related_tool_clicked` `{from, to}` | nav between tools | does the `<RelatedTools>` curation actually drive flow? |
| `next_step_clicked` `{from, to}` | workflow-chain button | cross-tool stickiness |
| `sample_loaded` `{tool}` | "Try a sample" | first-time activation aid working? |
| `extension_cta_click` `{placement}` | extension CTA | **goal #1 conversion** |
| `obsidian_cta_click` `{placement}` | plugin CTA | conversion |
| `pwa_install` | install event | retention rail |
| `scroll_depth` `{tool, pct}` | IntersectionObserver | how far down long SEO pages people read |
| `ad_in_view` `{slot}` | IntersectionObserver | ad engagement w/o PII; reconcile $ in AdSense |
| `share_click` `{channel}` | share button | viral loop |

**How the owner SEES which tools get used:** a saved Umami report ranking all 20 slugs by **copy-conversion = `output_copied` / `tool_view`** plus `clean_run` count. High views + low cleans = confusing UI to fix; high copy-conversion = a hero tool to feature on the homepage. Activation = `first_clean_run`.

---

## 7. Engagement & Cross-Tool Flow

Ranked by leverage (impact × low effort), driving pages/session and the #1 conversion (extension/plugin installs):

| # | Recommendation | Effort | Why |
|---|---|---|---|
| 1 | `<RelatedTools currentSlug>` module on all 20 pages (curated by intent, not a dump) | Low | Fixes the confirmed one-way-spoke problem; lifts pages/session + internal-link SEO in one PR |
| 2 | Categorized footer tool-grid in `Base.astro` (all 20, every page) | Low | Lateral link to every tool sitewide |
| 3 | Contextual extension/Obsidian CTA, fires only after 2+ cleans (localStorage, dismissible) | Low | Targets #1 conversion; Chrome install conversion jumps to 10–30%+ with pre-existing demand |
| 4 | "Try a sample" + real "Copied!" state, standardized across tools | Med | Kills empty-textarea bounce; first-time activation |
| 5 | Workflow-chaining "next step" buttons w/ sessionStorage pre-fill (clean→diff→count→readability) | Med | Makes 20 islands feel like one app; removes re-paste friction |
| 6 | Interactive "Network requests: 0" counter + "No upload · No signup · Works offline" trust strip | Med | Turns the privacy *claim* into provable *proof* - why people paste confidential text and return |
| 7 | PWA manifest + offline service worker + "Install app" (after first success, never first paint) | Med | Primary no-signup retention rail; reinforces "works in airplane mode" |
| 8 | "Recently used tools" strip + header tool-switcher (localStorage MRU) | Low | One-tap return path for no-account repeat users |
| 9 | Keyboard shortcuts (Cmd/Ctrl+Enter run, Cmd+Shift+C copy) + "?" hint | Med | Power-user retention; table-stakes on convertcase/wordcounter |
| 10 | "Clean my AI text" wizard on homepage (paste → cleaner runs → "we also found: 3 invisible chars, grade-14 readability…" → routes into each tool w/ text carried) | High | Strongest cross-discovery mechanic; driven by the user's own text |
| 11 | Shareable result card / hash-permalink (scores only, never text) for AI-Tell Report, Readability, Word Counter | Med | No-account viral loop back to specific tools |
| 12 | Bookmarklet + "pin to taskbar" nudge | Low | Captures users who won't grant extension permissions |

---

## 8. 90-Day Marketing/Content Calendar

| Wk | Post title | Target keyword | Channel |
|---|---|---|---|
| 1 | OpenAI "Fixed" the Em Dash. Your Old Docs (and Claude & Gemini) Didn't Get the Memo. | remove em dash chatgpt | Blog + HN + X (newsjack) |
| 1 | What Is a Zero-Width Character? (And Why ChatGPT Text Is Full of Them) | zero-width character / invisible characters in text | Blog pillar → inspector tool |
| 2 | How to Find and Remove Invisible Characters from ChatGPT Text | remove invisible characters | Blog → inspector |
| 2 | Stop Punishing Writers for Using Em Dashes | em dash false positive ai / falsely accused of using ai | Blog op-ed + LinkedIn (link magnet) |
| 3 | Is ChatGPT Watermarking Its Text? What the Hidden Unicode Actually Is | chatgpt watermark / chatgpt invisible watermark | Blog → inspector (honest framing) |
| 3 | How to Remove Em Dashes in Word, Google Docs & Gmail | remove em dash in word/google docs/gmail | Blog how-to → core |
| 4 | We Analyzed 1,000 ChatGPT Outputs: Every AI Tell, Counted | original research (backlink magnet) | Blog + Featured.com/HARO + PR |
| 4 | undash vs Em Dash Remover: Em Dashes Alone Aren't Enough | undash alternative | Comparison page |
| 5 | DashAway Alternative: 10 AI Tells, Not 1 | dashaway alternative | Comparison page |
| 5 | Why Text Pasted from Word Has Weird Characters (and How to Fix It) | clean formatting paste from word | Blog → paste cleaner |
| 6 | How to Convert Smart/Curly Quotes to Straight Quotes | remove curly quotes / smart quotes | Blog → quotes tool |
| 6 | U+200B and Friends: A Field Guide to Zero-Width Unicode | zero-width unicode | Blog (Lobsters-friendly) |
| 7 | Remove Line Breaks and Reflow Messy Text | remove line breaks / fix pdf line breaks | Blog → reflow tool |
| 7 | The First AI Text Cleaner Where Even the AI Runs Locally (Gemini Nano) | private in-browser AI rewrite | Blog + Show HN mini-launch (on-device rewrite) |
| 8 | Homoglyph Attacks in Plain English: When an "a" Isn't an "a" | homoglyph detector / confusables | Blog → homoglyph tool |
| 8–9 | Short-form series: "Words that scream ChatGPT" / "The invisible characters hiding in your AI text" / "Why writers get falsely accused of AI" | meme-native | TikTok/Reels/Shorts + LinkedIn + X |
| 9 | Readability for Writers: Beat the Grade-14 ChatGPT Average | readability checker / hemingway alternative | Blog → readability tool |
| 10 | Passive Voice & Weasel Words: The Quiet AI Tells | passive voice checker / weasel words | Blog → highlighter |
| 11 | "State of AI Text Artifacts" - aggregate removal stats (recurring) | citation bait | Blog + PR + newsletters |
| 12 | Roundup-inclusion outreach sprint (operator prospecting, 100+ lists) + Featured.com/Qwoted ongoing | backlinks/branded search | Outreach |

**Ongoing throughout:** Featured.com (revived HARO) + Qwoted answering "AI detection / em dash / ChatGPT / privacy" queries; AlternativeTo + Tier-2 directories on a recurring schedule; embeddable "AI-tell checker" widget + "Cleaned with Em Dash Remover" badge for widget link-building; small newsletter sponsorships (writer/SEO/AI), measuring branded-search lift in GSC.

---

## 9. Competitive Landscape

| Competitor | What it is | Gap you own |
|---|---|---|
| undash | Em-dash-only Chrome ext (294 PH upvotes) | Suite (10 tells not 1); users explicitly asked for curly quotes/spaces/phrases - you have them |
| DashAway | Em-dash-only ext, unlisted (dev-mode install) | Properly listed, reliable across sites; multi-surface |
| convertcase.net/em-dash-remover | Single tool + Ko-fi upsell on a generalist | AI-cleanup depth; suite; privacy proof |
| Originality.AI Invisible Text Detector | Free, client-side, same privacy line | Breadth + extension + Obsidian; honest non-bypass framing; not a detection vendor |
| CopyCleanse | Client-side cleaner, publishes aggregate stats | Suite breadth; do the stats *better* across 20 tools |
| wordcounter.net (~14M/mo, 8.45K ref domains) | Generalist, huge authority | Don't fight head terms; out-depth on AI-cleanup long tail, cross-link into core |
| diffchecker / Hemingway | Single-purpose giants | Your diff/readability tools capture their searchers and funnel to cleanup |
| emdashremover.com / humanizer.ai / bypassgpt | "Evade detection" framed | Penalty/AdSense liability - position OPPOSITE; weaponize "we don't help you cheat" |
| Obsidian: smart-typography, clean-ai-paste | Separate single-purpose plugins | Same engine as web + extension - one trusted brand |

**Gaps to own:** (1) the 20-tool privacy-first **suite**; (2) **provable** transparency (Network-tab counter, open-source, offline); (3) **one engine across 3 surfaces**; (4) the **invisible/watermark/zero-width** cluster with honest framing; (5) **on-device AI rewrite** (Gemini Nano / WebLLM) - the only "rewrite" that never leaves the device, literally uncopyable by server-bound humanizers; (6) the **anti-humanizer / defend-the-human-voice** editorial lane that earns journalist links the bypass crowd repels.

---

## 10. Prioritized Backlog

| Priority | Item | Lens | Effort |
|---|---|---|---|
| P0 | Age Reddit + Indie Hackers accounts (start TODAY) | Launch | Low |
| P0 | Enable Cloudflare WA + Umami Hobby; central `track()` wrapper with content-leak guardrails | Analytics | Low |
| P0 | Wire core funnel events (tool_view, input_received, clean_run, output_copied, ext/obsidian CTA) on all 20 islands | Analytics | Med |
| P0 | `<RelatedTools>` module + footer tool-grid on all 20 pages | Engagement/SEO | Low |
| P0 | Unique 400+ word content + FAQ JSON-LD per tool page; noindex thin pages | SEO | Med |
| P0 | "Why we're not a humanizer" FAQ + scrub all bypass/undetectable language (AdSense safety) | Competitive | Low |
| P0 | Newsjack "OpenAI fixed the em dash" post | SEO/Launch | Med |
| P0 | Open-source the cleaning engine on GitHub | Launch | Med |
| P0 | Record the "paste → clean → Network tab empty" 15-sec clip | Launch | Low |
| P0 | GSC + Bing verify, sitemap submit, Crawler Hints, Request Indexing | SEO | Med |
| P0 | "Try a sample" + "Copied!" on core cleaner + Word Counter | Engagement | Low |
| P0 | Live "Network requests: 0" counter + trust strip | Competitive/UX | Med |
| P1 | Self-hunt PH (Tue–Thu 00:01 PT) + Show HN same AM + X/LinkedIn | Launch | High |
| P1 | Value-first Reddit posts (ChatGPT, writing, ObsidianMD, SEO, IsBeautiful) spaced across week | Launch | Med |
| P1 | Directories: BetaList (now), TAAFT, FutureTools, AlternativeTo vs undash/DashAway/wordcounter/diffchecker/Hemingway | Launch/SEO | Med |
| P1 | Proxy Umami first-party via Cloudflare; document consent posture in /privacy | Analytics | Med |
| P1 | Invisible/zero-width pillar + spoke posts → inspector tool | Content | Med |
| P1 | "Defend the human voice" op-ed + 1,000-output research piece | Content | Med |
| P1 | undash/DashAway comparison pages | Competitive | Med |
| P1 | Contextual extension/Obsidian CTA after 2+ cleans | Engagement | Low |
| P1 | Featured.com (HARO) + Qwoted source profiles | Content | Med |
| P1 | Internal deep-links from 6 existing posts → matching tools | SEO | Low |
| P2 | PWA manifest + service worker + "Install app" affordance | Engagement | Med |
| P2 | Workflow-chaining "next step" buttons + sessionStorage pre-fill | Engagement | Med |
| P2 | Invisible-Char Inspector standalone mini-launch (week 2) | Launch | Med |
| P2 | Embeddable checker widget + "Cleaned with…" badge program | Content | High |
| P2 | Recently-used strip + header tool-switcher | Engagement | Low |
| P2 | Footer breadcrumbs + BreadcrumbList JSON-LD | Engagement/SEO | Low |
| P2 | Roundup-inclusion outreach (operator prospecting, 100+ lists) | Content | Med |
| P2 | On-device AI rewrite flagship landing page + PR ("even the AI runs locally") | Competitive | High |
| P2 | "Clean my AI text" homepage wizard | Engagement | High |
| P2 | Heatmap-style scroll_depth + section_click events | Analytics | Med |
| P2 | Aggregate "AI tells found this week" / State-of-AI-Text-Artifacts data post | Competitive | Med |
| P2 | Paste-from-Word / smart-quotes / line-break evergreen how-to posts | Content | Med |
| P3 | Short-form meme video series (before/after + invisible-char reveal) | Content | Med |
| P3 | Shareable result cards / hash-permalinks (scores only) | Engagement | Med |
| P3 | Bookmarklet + pin-to-taskbar nudges | Engagement | Low |
| P3 | Build-time CI guardrail: fail build if a tool calls raw `umami.track()` | Analytics | Med |
| P3 | A/B tests via localStorage variant + Umami props (hero copy, CTA placement) | Analytics | Med |
| P3 | Lazy-load below-fold ads, fixed heights, watch CLS on tool pages | Analytics | Low |
| P3 | Newsletter sponsorships (writer/SEO/AI), measure branded-search lift | Content | Low |

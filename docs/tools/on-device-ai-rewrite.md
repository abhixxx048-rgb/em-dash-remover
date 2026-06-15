# On-Device AI Rewrite (Chrome Rewriter / Gemini Nano)

> One-click tone and length rewriting that runs entirely on your device via Chrome's built-in Rewriter/Writer API (Gemini Nano) - no text ever leaves the browser, with graceful fallback when the model isn't available. Tier: 3. Difficulty: High. Runs: client-side (on-device model; optional cloud fallback is opt-in only).

## 1. What it does

Takes the user's pasted text and rewrites it to a chosen tone (more formal / as-is / more casual) and length (shorter / as-is / longer) using Chrome's built-in **Rewriter API**, which is powered by the on-device **Gemini Nano** model. Everything happens locally in the browser - the model runs on the user's GPU/CPU and no text is sent to Google or any server. When the API or model isn't available (wrong browser, unsupported hardware, model still downloading), the tool degrades gracefully to our existing deterministic cleaners plus a clear explanation, never silently failing or secretly phoning home. It complements our existing em-dash/AI-tell cleanup: clean first deterministically, then optionally rephrase on-device to restore a natural human voice.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**

- "rewrite text online free" - very high demand, very high competition (QuillBot/Wordtune dominate). We don't compete head-on; we win the *privacy + on-device* sliver.
- "on-device AI rewriter" / "offline AI rewrite" / "local AI text rewriter" - low-to-medium demand, **very low competition**. This is our wedge keyword set; almost nobody ranks for it.
- "Chrome built-in AI rewriter" / "Gemini Nano rewrite tool" / "Rewriter API demo" - small but rising developer/early-adopter demand, low competition. Captures people searching after reading Chrome dev blogs.
- "rewrite text without sending to server" / "private AI rewriter no upload" - low volume, near-zero competition, extremely high intent (privacy-motivated, legal/medical/enterprise users).
- "make text more formal / more casual free" - medium demand, high competition, but a natural long-tail we can satisfy as a preset.
- "rephrase text no signup no login" - medium demand; signup-free is a credible differentiator vs. Wordtune (10 rewrites/day) and Grammarly.

**Who searches and the moment they need it:**
- People who just used an AI chatbot, pasted the output into our em-dash cleaner, and now want it to "sound like me again" without re-prompting ChatGPT.
- Privacy-conscious professionals (legal, healthcare, finance, journalists handling sources) who literally cannot paste confidential text into a cloud rewriter.
- Developers and AI-curious users who read that Chrome shipped on-device AI and want to *see it actually work* in a real tool.
- Writers hitting Wordtune's 10/day or QuillBot's word caps who want unlimited local rewrites.

**Source domains found in research:**
- developer.chrome.com (Rewriter API, Writer API, Built-in AI APIs, "inform users of model download" docs)
- chrome.dev (Writer/Rewriter API Playground demo)
- groups.google.com/a/chromium.org (chrome-ai-dev-preview-discuss, blink-dev origin-trial threads)
- quillbot.com (incumbent rewriter/paraphraser - competitor)
- developer.chrome.com/blog (AI API updates I/O 2025, "build new features using built-in AI" I/O 2026)
- thangman22.com / pasqualepillitteri.it (independent write-ups on Chrome built-in AI status 2025–2026)

## 3. Target users & use cases

- **AI-text cleaners (our core funnel):** pasted ChatGPT/Claude output, ran our em-dash + AI-tell cleanup, now want a tone pass to humanize it. Scenario: "Make this sound less robotic and a touch more casual."
- **Privacy-bound professionals (legal, medical, finance, HR):** rewrite a sensitive paragraph that cannot legally touch a cloud API. Scenario: redrafting a client email with confidential names locally.
- **ESL / non-native writers:** smooth a paragraph to more natural, more formal English for an academic or work context. Scenario: "Make my cover letter sound more formal."
- **Students:** tighten an essay paragraph (shorter) or expand a thin one (longer) without a subscription. Scenario: "I'm 40 words over the limit - make this shorter."
- **Marketers / content writers:** quickly produce a casual social variant and a formal newsletter variant of the same line. Scenario: tone A/B without leaving the page.
- **Developers / early adopters:** a working reference implementation of the Rewriter API with proper availability handling. Scenario: "Show me Gemini Nano rewriting text in-browser."
- **Editors:** get a neutral "as-is" cleanup pass (light rephrase, same length/tone) on a clunky sentence.

## 4. Features - core (MVP)

1. **Tone control** mapped directly to the Rewriter API `tone` option: `more-formal` | `as-is` | `more-casual`. Presented as a 3-way segmented control.
2. **Length control** mapped to `length`: `shorter` | `as-is` | `longer`. Also a 3-way segmented control.
3. **Format control** mapped to `format`: `as-is` | `plain-text` | `markdown`, defaulting to `plain-text` so it pairs with our markdown-stripping story.
4. **Capability detection on load** - `if ('Rewriter' in self)` then `await Rewriter.availability()` returning `available` | `downloadable` | `unavailable`. UI state branches on this before the user does anything.
5. **On-demand model download with progress** - when `downloadable`, call `Rewriter.create({ monitor(m){ m.addEventListener('downloadprogress', e => …e.loaded…) } })` and show a real percentage bar (the model is large; the first run downloads it once).
6. **Streaming output** via `rewriter.rewriteStreaming(text, { context })`, rendering chunks as they arrive (first token typically <~200ms on a discrete GPU) so the user sees progress immediately.
7. **Shared context / per-call context** - a small "guidance" field wired to `sharedContext` (on create) and the per-call `context` param (e.g. "This is a customer support reply; keep it warm").
8. **Cancel / abort** - every rewrite uses an `AbortController`; a Stop button calls `controller.abort()` and `rewriter.destroy()` cleans up the session.
9. **Graceful fallback** - when the API is `unavailable` (non-Chrome, unsupported OS/hardware, or insufficient storage), fall back to our existing deterministic cleanup (em-dash, quotes, whitespace, markdown) and clearly label it "deterministic cleanup, not AI rewrite."
10. **Before/after panes** - original on the left/top, rewritten on the right/bottom, with one-click copy of the result.
11. **Privacy banner** - an always-visible, provable statement: "Runs on your device via Chrome's built-in AI. No text is sent to any server," with a link to how to verify (DevTools Network tab shows zero requests).

## 5. Features - engagement & helpfulness (what makes users love it & stay)

This is the heart of the tool. Concrete, sticky, genuinely-helpful touches:

1. **Live capability badge** - a colored chip in the header showing exactly what the user can do *right now*: "On-device AI ready" (green), "Model downloads on first use (~one-time)" (amber), or "AI unavailable - using deterministic cleanup" (gray). Removes confusion before the user even clicks; sets honest expectations. *Why:* the #1 frustration with built-in AI tools is silent failure - this kills it up front.
2. **One-click tone/length presets** - named buttons that set both selectors at once: "Polish (formal, as-is)", "Tighten (formal, shorter)", "Soften (casual, as-is)", "Expand (as-is, longer)", "Humanize (casual, as-is + de-AI-tell pass)". *Why:* users think in goals, not API enum values; presets remove decision friction and teach the controls.
3. **Side-by-side diff highlighting** - toggle that highlights what changed between original and rewrite (word-level inserts/deletes). *Why:* builds trust by showing the AI didn't invent content, and helps editors accept/reject selectively.
4. **"Why this changed" education chips** - when the rewrite removes an em-dash, curly quote, or known AI-tell, surface a tiny inline note ("replaced em-dash with comma", "split a long hedging sentence"). *Why:* on-brand education ("keep your human voice"); turns a black-box rewrite into a learning moment.
5. **Live counters** - word count, character count, and estimated reading time for both original and rewritten text, updating as the stream arrives. *Why:* students and marketers care about hitting length limits; the live delta ("−38 words") makes the "shorter" preset instantly satisfying.
6. **"Voice match" meter** - a 0–100 score estimating how much the rewrite preserved the user's original style (lexical overlap + sentence-rhythm similarity, computed locally). *Why:* directly serves the brand promise ("keep your human voice") and gamifies staying authentic rather than over-rewriting.
7. **Re-roll / "Try again" button** - regenerate with the same settings for a different phrasing (LLM output varies). *Why:* zero-cost iteration since it's local; encourages exploration and keeps users on-page.
8. **Undo / redo + rewrite history** - a stack of previous rewrites the user can step back through; restore any prior version with one click. *Why:* removes fear of losing a good version; makes experimentation safe.
9. **Copy, download (.txt/.md), and "copy as plain text"** - plus a "copy both" that grabs original + rewrite. *Why:* meets users where their next step is (paste into Docs/email/CMS) without manual selection.
10. **Keyboard shortcuts** - Cmd/Ctrl+Enter to rewrite, Cmd/Ctrl+Z undo, Esc to cancel a running rewrite, 1/2/3 to switch tone presets. *Why:* power users (writers doing many paragraphs) stay in flow; signals a serious, fast tool.
11. **"Try an example" button** - loads a deliberately AI-sounding sample paragraph (full of em-dashes and hedging) so first-time/no-paste users instantly see value. *Why:* solves the empty-state problem and demonstrates the on-device model working without the user risking their own text.
12. **One-time model-download nudge with honest framing** - instead of a scary spinner, a friendly card: "Chrome is downloading the on-device AI model once (about [size]). After this, rewrites are instant and offline." with a live progress bar from `downloadprogress`. *Why:* the large one-time download is the biggest drop-off risk; reframing it as a one-time investment retains users.
13. **Chain into our other tools** - after a rewrite, a "Clean this further" button pipes the output into the em-dash remover / AI-tell scanner, and a "Rewrite this instead" button pipes cleaned text back in. *Why:* cross-tool stickiness; users discover the whole suite.
14. **Save settings + last text to localStorage** - remembers preferred tone/length/format and optionally restores the last session. *Why:* returning users skip setup; respects privacy (stored locally, with a one-click "clear local data").
15. **Streaming "stop early, keep what you have"** - the Stop button keeps the partial rewrite rather than discarding it. *Why:* if the user already sees a good enough result, they don't wait for the full stream.
16. **Tooltips on every control** explaining the underlying API value in plain English ("More formal: tightens contractions and slang; same meaning"). *Why:* demystifies the controls and quietly educates users about what on-device AI does.
17. **Accessibility-first result announcements** - `aria-live="polite"` region announces "Rewrite complete, 142 words" for screen readers; status conveyed by text + icon, never color alone. *Why:* WCAG compliance and genuine inclusivity widen the audience.

## 6. UX / UI notes

**Layout:** Two-pane editor. Left/top = original (editable textarea); right/bottom = rewritten result (read-only, with copy/download in its toolbar). On mobile the panes stack vertically with a swap toggle. A compact control bar sits above: tone segmented control, length segmented control, format dropdown, preset buttons, and the big "Rewrite" button. The capability badge and privacy banner pin to the header.

**Input/output model:** Paste or type → pick tone/length (or a preset) → Rewrite → stream into the result pane. Optional "guidance/context" field is collapsed by default ("Add guidance ▸").

**States:**
- *Empty:* placeholder + "Try an example" button + the live capability badge so the user knows what to expect.
- *Checking:* brief "Checking on-device AI…" while `availability()` resolves.
- *Downloadable:* one-time download card with progress bar (Feature 12).
- *Processing:* streaming text with a subtle caret, Stop button active, controls disabled.
- *Result:* before/after, diff toggle, counters, voice-match meter, copy/download, re-roll.
- *Unavailable / fallback:* gray badge + "AI rewrite isn't available in this browser. We've applied deterministic cleanup instead" + a short "How to enable on-device AI in Chrome" expander.

**Microcopy tone:** plain, honest, slightly nerdy-friendly. Never "beat the detector"; always "sound like you / clean for real quality." Privacy claims are concrete and verifiable, not vague.

**Mobile:** stacked panes, sticky Rewrite button, larger tap targets for segmented controls, and a note that on-device AI may be unavailable on mobile Chrome → fallback path is the default mobile experience (so mobile never feels broken).

**Accessibility (WCAG 2.2 AA):** full keyboard operation, visible focus rings, `aria-live` for streaming/completion, status via icon+text (not color alone), diff highlights use underline/strikethrough patterns in addition to color, prefers-reduced-motion disables the streaming caret animation, and all controls have labels + tooltips.

## 7. Technical implementation (client-side)

**Core API flow (Rewriter API, Gemini Nano):**
```js
if (!('Rewriter' in self)) return fallbackToDeterministic();
const status = await Rewriter.availability(); // 'available' | 'downloadable' | 'unavailable'
if (status === 'unavailable') return fallbackToDeterministic();

const controller = new AbortController();
const rewriter = await Rewriter.create({
  tone: 'as-is',          // 'more-formal' | 'as-is' | 'more-casual'
  length: 'as-is',        // 'shorter' | 'as-is' | 'longer'
  format: 'plain-text',   // 'as-is' | 'plain-text' | 'markdown'
  sharedContext: 'Preserve the author\'s voice; clean AI tells.',
  expectedInputLanguages: ['en'],
  signal: controller.signal,
  monitor(m) {
    m.addEventListener('downloadprogress', e => setProgress(e.loaded)); // 0..1
  },
});

const stream = rewriter.rewriteStreaming(inputText, {
  context: userGuidance, // per-call context
  signal: controller.signal,
});
for await (const chunk of stream) appendToOutput(chunk);
rewriter.destroy();
```

**Writer API as a sibling path:** for the "Expand (longer)" / "draft from idea" cases, `Writer.create({ tone: 'formal'|'neutral'|'casual', length: 'short'|'medium'|'long', format: 'markdown'|'plain-text' })` with `write()` / `writeStreaming()`. Keep Rewriter as primary (it transforms existing text); Writer is optional for generative expansion.

**Availability & origin-trial reality (as of 2026):** The Rewriter and Writer APIs are in a **joint origin trial spanning Chrome 137–148** (not yet stable). To use them on a public web page we must **register the origin trial token** and inject it via `<meta http-equiv="origin-trial" content="…">` on every page. By contrast, the **Summarizer, Translator, and Language Detector APIs are stable from Chrome 138**, and the Prompt API is slated to stabilize for web pages around **Chrome 148 (Q2 2026)**. Treat Rewriter as "works for many users behind a token, but always have a fallback."

**Local "voice match" + counters (no model needed):** compute word/char counts and reading time with simple regex tokenization. Voice-match score = blend of Jaccard token overlap and normalized average-sentence-length delta between original and rewrite - pure JS, runs in <1ms, no dependency.

**Diff highlighting:** use a small, well-tested LCS word-diff (e.g. a ~5–10 KB diff lib, or hand-rolled Myers diff over tokens). Avoid heavy diff packages; word-level granularity is enough.

**De-AI-tell + deterministic fallback:** reuse the existing em-dash/en-dash, curly→straight quotes, ellipsis, zero-width strip, whitespace, and markdown-strip pipeline already built. The "Humanize" preset runs deterministic cleanup *then* the on-device rewrite (or just deterministic cleanup when AI is unavailable).

**Edge cases & failure modes:**
- *Model `downloadable` but never finishes / metered network:* show progress, allow cancel, fall back to deterministic on timeout.
- *Hardware shortfall:* requirements are steep (>4 GB VRAM *or* 16+ GB RAM and 4+ cores, **~22 GB free disk** on the Chrome-profile volume). On failure, `create()` rejects → catch → fallback.
- *Not in Web Workers:* the Rewriter API is main-thread only, so chunk the UI work and lean on streaming to keep the page responsive.
- *Cross-origin iframe:* requires `allow="rewriter"` permission policy - not relevant if we host the tool top-level, but note it.
- *Output drift / hallucination:* the model can rephrase meaning; mitigate with the diff view and a "this is a draft" note. No documented hard token cap, but very long inputs slow down and risk truncation - chunk by paragraph and rewrite sequentially with a shared session.
- *Temporary usage limits:* the origin trial may impose temporary per-origin rate limits; queue requests and surface a friendly "busy, retrying" state.

**Performance for large text:** stream, and for multi-paragraph input reuse a single `Rewriter` session (one `create()`, many `rewrite()` calls) to avoid re-init cost; rewrite paragraph-by-paragraph so the user sees incremental results and the page never blocks.

**Privacy story (the brand hook):** with the on-device path, **no text is sent to Google or any third party** - verifiable in DevTools (zero network requests during rewrite). The ONLY thing that ever touches the network is the one-time model download by Chrome itself. We expose this explicitly. **Any cloud fallback (e.g. Firebase AI Logic / a hosted model for non-Chrome users) must be strictly opt-in, off by default, and clearly labeled** - otherwise it breaks the provable-privacy promise. Default fallback is deterministic and 100% local.

## 8. Competitors & how we differentiate

- **QuillBot (sentence/paragraph rewriter, AI humanizer):** powerful, free tier, but **cloud-based** (text uploaded to their servers), ad-supported, and gated modes behind Premium. *Our wedge:* on-device, nothing uploaded, unlimited, no ads, no signup.
- **Wordtune:** good rephrasing UX but **10 rewrites/day free** and cloud-based. *Our wedge:* unlimited local rewrites, no account.
- **Grammarly:** 40M+ DAU, comprehensive, but heavyweight, account-driven, cloud, and increasingly upsell-heavy. *Our wedge:* single-purpose, instant, private, free.
- **Chrome's own Writer/Rewriter Playground (chrome.dev):** demonstrates the API but is a raw developer demo - no presets, no diff, no de-AI-tell pipeline, no fallback storytelling. *Our wedge:* a polished consumer tool around the same engine.
- **"Humanizer" / AI-detector-bypass sites:** positioned around beating detectors (often spammy, sometimes cloud + data-harvesting). *Our wedge (and explicit positioning):* quality-not-bypass - clean writing to keep your human voice, on principle, with provable privacy.

Summary wedge: **provable on-device privacy + grammar/AI-tell awareness + suite consolidation + "quality not detector-bypass."** No incumbent combines all four.

## 9. SEO & page structure

**Primary keyword:** "on-device AI rewriter" (also: "private AI text rewriter").
**Secondary keywords:** "Chrome built-in AI rewriter", "Gemini Nano rewrite tool", "rewrite text without sending to server", "offline AI rewrite", "free AI tone changer no signup", "make text more formal/casual locally".

**H1/H2 outline:**
- H1: On-Device AI Rewrite - Private, Browser-Based Tone & Length Rewriting
- H2: Rewrite tone and length on your device (no upload)
- H2: How it works (Chrome's built-in Rewriter API + Gemini Nano)
- H2: 100% client-side - verify it yourself
- H2: Presets: polish, tighten, soften, expand, humanize
- H2: When AI isn't available - deterministic fallback
- H2: How to enable Chrome's built-in AI
- H2: On-device vs. cloud rewriters (privacy comparison)
- H2: FAQ

**FAQ ideas (FAQPage schema):**
- Does my text get sent anywhere? (No - on-device; here's how to verify.)
- Which browsers/versions support this? (Chrome 137–148 origin trial; stable APIs differ.)
- Why is there a one-time download? (Gemini Nano model, downloaded once by Chrome.)
- What if my device can't run it? (Deterministic fallback; requirements ~22 GB free disk, GPU/RAM.)
- Is this an AI-detector bypass? (No - it's for writing quality and keeping your voice.)
- How is this different from QuillBot/Wordtune? (On-device, unlimited, no signup, no upload.)

**schema.org:** `SoftwareApplication` (or `WebApplication`) for the tool + `FAQPage` for the FAQ + `BreadcrumbList` back to the tools suite index.

**Internal links to sibling tools:** Em-Dash Remover, AI-Tell Scanner, Curly→Straight Quotes, Markdown Stripper, Whitespace/Invisible-Char Cleaner - plus a "Clean then Rewrite" cross-link path.

## 10. Build effort & priority

**Effort:** High (the largest in the suite). The deterministic fallback and counters reuse existing code, but the Rewriter integration adds real surface area: capability/availability state machine, origin-trial token management, download-progress UX, streaming render, abort/destroy lifecycle, diff view, and voice-match scoring.

**Dependencies on existing code:** reuses the em-dash/quote/whitespace/markdown/zero-width pipeline and the AI-tell scanner for the "Humanize" preset and the fallback path. Shares the paste-box, copy/download, and localStorage settings patterns from the existing single-page tool.

**Recommended sequencing:**
1. Ship the **deterministic fallback experience first** (it's basically our existing cleanup behind a new two-pane UI + presets) so the page is useful to 100% of visitors day one.
2. Layer in **capability detection + availability badge** (cheap, high trust value).
3. Add the **Rewriter API streaming path** behind a registered origin-trial token, with download-progress UX.
4. Add **engagement layer** (diff view, voice-match meter, history/undo, re-roll, cross-tool chaining).
5. Re-evaluate when the Rewriter API leaves origin trial / Prompt API stabilizes (~Chrome 148, Q2 2026) - at GA we can drop the token and broaden default availability.

Because the fallback alone is a credible v1 and the AI path is additive, this tool can launch progressively rather than blocking on the (still-in-origin-trial) Rewriter API reaching stable.

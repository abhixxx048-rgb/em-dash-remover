# WebGPU / WebLLM Cross-Browser Rewrite

> On-device AI rewriting for everyone, not just Chrome — bundle a small quantized model via WebLLM + WebGPU so Firefox, Safari, and Edge users get private, server-free rewrites with weights cached after first load. Tier: 3. Difficulty: High. Runs: client-side (100% in-browser; no server inference).

## 1. What it does

This tool runs a small, 4-bit quantized language model **entirely inside the user's browser** using [WebLLM](https://github.com/mlc-ai/web-llm) on top of WebGPU, so the model can paraphrase / rewrite / soften AI-sounding text without any text ever leaving the device. On the first visit the model weights (~0.8–2.2 GB depending on the model) stream down once and are cached in the browser; every subsequent rewrite is a local GPU operation with zero network calls. It is the on-device, "provably private" sibling of any cloud-rewrite tool — the cleaner deterministically removes em-dashes and AI tells, and this tool optionally *rephrases* the surrounding sentence so it reads in the user's own human voice.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**
- "free paraphrasing tool no signup" — **high demand, very high competition** (Scribbr, Semrush, QuillBot dominate). Our wedge is the *on-device / no-upload* angle, not raw rankings.
- "offline AI rewriter" / "rewrite text offline browser" — **low–medium demand, low competition** — strong opportunity; almost nobody owns this.
- "in-browser LLM rewrite" / "local AI paraphrase no server" — **low demand, very low competition** — niche but high-intent (privacy-sensitive devs, researchers).
- "private paraphrasing tool no data stored" — **medium demand, medium competition** — privacy framing is rising.
- "rewrite AI text Firefox / Safari" — **low demand, low competition** — captures the "Chrome-only AI tools don't work for me" frustration.
- "WebGPU LLM in browser demo" — **low demand (technical), low competition** — earns backlinks and dev credibility.

**Who searches and the moment they need it:** Privacy-conscious writers (legal, medical, HR, finance) who *cannot paste confidential text into a cloud tool*; ESL writers who want a free unlimited rewriter without an account; students wary of "your text is stored on our servers"; developers and tinkerers who want to see a real WebGPU LLM run; and Firefox/Safari users who keep hitting "this AI feature requires Chrome." The trigger moment is almost always *"I want to rewrite this, but I don't trust pasting it into a website."*

**Source domains found in research:** github.com/mlc-ai/web-llm, webllm.mlc.ai, huggingface.co (webml-community Spaces), arxiv.org (WebLLM paper 2412.15803), web.dev/learn/ai, caniuse.com (via webo360solutions / byteiota coverage), scribbr.com, aicreate.com.

## 3. Target users & use cases

- **Privacy-sensitive professionals (legal/medical/HR/finance):** rewrite a sensitive paragraph (a patient note summary, a termination email) into clearer prose *without the text ever touching a server* — a compliance-friendly path cloud tools can't offer.
- **ESL / non-native writers:** unlimited, account-free fluency rewriting of emails and essays; the on-device model gives "free and unlimited" without rate limits or paywalls.
- **Students:** de-robotify an AI draft into their own voice for quality (positioned as *quality, not detector-bypass*), with the privacy reassurance that nothing is logged.
- **Firefox & Safari users:** the audience explicitly underserved by Chrome-only / Chrome-built-in AI features; this tool reaches them via WebGPU which now ships (with caveats) across all four major engines.
- **Developers / privacy advocates:** want a working, inspectable, offline WebGPU LLM demo they can trust and link to.
- **Bloggers / marketers on locked-down corporate networks:** where pasting copy into external SaaS is blocked by DLP policy, but a static site that does everything client-side is allowed.

## 4. Features — core (MVP)

1. **WebGPU capability gate.** On load, detect `navigator.gpu`; request an adapter/device. If unavailable, *do not* white-screen — fall back to a clear explainer + the existing deterministic cleaner (see §7).
2. **Model picker with a sensible default.** Default to a small model that balances first-load weight against quality — e.g. **Qwen2.5-1.5B-Instruct (~1.2 GB GPU, ~1.5 GB download)** or **Llama-3.2-1B-Instruct** for the lightest load. Offer **Phi-3.5-mini (3.8B, ~2 GB int4 VRAM, ~71 tok/s decode per the WebLLM paper)** as a "Higher quality (bigger download)" option.
3. **One-time weighted download with live progress.** Use `CreateMLCEngine(modelId, { initProgressCallback })` and render a real progress bar (% + MB + ETA). Weights cache via WebLLM's Cache API backend (default) or IndexedDB.
4. **Persistent weight cache.** Configure `appConfig.cacheBackend` so repeat visits skip the download; show a "Model ready (cached)" badge so users know subsequent loads are fast (~2–5 s warm-up).
5. **Rewrite presets (rewrite "modes").** Standard, Fluent (readability), Formal, Casual, Shorten, Expand — each a distinct system prompt. (Mirrors what cloud paraphrasers like AICreate offer in 6 modes.)
6. **Streaming output.** Use streaming chat completion (`stream: true`, async generator) so tokens appear live rather than after a long pause — essential because on-device decode is slower than cloud.
7. **Paste / type input box with character + token estimate** and a soft length cap (chunk long input — see §7).
8. **Run inference in a Web Worker.** Keep `CreateMLCEngine` and `chat.completions.create` off the main thread so the UI never freezes during decode (WebLLM best practice).
9. **Copy result + revert to original.** One-click copy; one-click restore the original text.
10. **Privacy banner that's actually true.** "Runs 100% in your browser. Your text never leaves this device." with a network-tab challenge ("open DevTools → Network; you'll see zero requests during rewrite").

## 5. Features — engagement & helpfulness (what makes users love it & stay)

1. **Live "downloading once" progress with human framing.** Instead of a bare spinner, show "Downloading the AI model (one time only) — 612 / 1,180 MB · ~40s left. After this it works instantly and offline." This turns the scary 1 GB wait into a one-time investment users tolerate, dramatically reducing first-load bounce.
2. **"Model cached — you're now offline-capable" celebration toast.** After first download, fire a small confetti/checkmark toast: "Done! You can now rewrite even with Wi-Fi off." This is a genuine *wow* moment unique to on-device tools and gives users a reason to bookmark and return.
3. **Airplane-mode / "works offline" badge + try-it prompt.** A persistent badge plus a playful "Turn off your Wi-Fi and try it" CTA. It *proves* the privacy claim experientially, which is far stickier than a paragraph of copy.
4. **Side-by-side before/after diff with inline highlights.** Show original vs. rewrite in two panes, with changed spans highlighted (word-level diff). Users instantly see *what* changed, which builds trust in the model and teaches them what "AI-sounding" looked like.
5. **Streaming token animation.** Watching the rewrite type itself out live keeps users engaged during the (slower than cloud) decode and signals "real AI working," not a frozen page.
6. **Rewrite-mode chips with one-click re-run.** Standard / Fluent / Formal / Casual / Shorten / Expand as tappable chips; clicking re-runs instantly on the cached model with no reload. Encourages exploration and multiple rewrites per session (engagement multiplier).
7. **"Regenerate" + temperature/"creativity" slider.** A single Regenerate button (new sampling seed) plus a Low→High creativity slider. Lets users gamble for a better phrasing — the classic "just one more try" loop that boosts time-on-page.
8. **Per-sentence accept/reject.** Apply the rewrite sentence-by-sentence (checkbox per changed sentence) instead of all-or-nothing. This respects the "keep my human voice" brand promise and makes the tool feel like a collaborator, not a replacement.
9. **"Why this changed" explainers (education layer).** Hover a highlighted change to see a short note: "Removed hedging phrase 'It is important to note that' — a common AI tell." Ties directly into the existing AI-tell scanner and teaches users to write better, which earns return visits and word-of-mouth.
10. **Readability + AI-tell score meters (gamified).** Before/after gauges: reading grade level, sentence-length variance, and an "AI-tell density" score that visibly drops after rewriting. A number going green is addictive and gives the rewrite a measurable payoff.
11. **Device-suitability hint up front.** Detect approximate GPU/VRAM and recommend the right model: "Your device handles the 1B model comfortably; the 3.8B model may be slow." Prevents the frustration of a user picking a model their laptop can't run — a major silent churn cause for on-device tools.
12. **Keyboard shortcuts.** Cmd/Ctrl+Enter to rewrite, Cmd/Ctrl+C to copy result, Cmd/Ctrl+Z to revert, `[` / `]` to cycle modes. Power users (the ESL/student repeat-users) move fast and stay.
13. **localStorage memory of preferences.** Remember the last model, last mode, creativity setting, and dark/light theme so a returning user lands ready-to-go in one paste. Removes setup friction on every return.
14. **Copy / download / shareable settings.** Copy result, download as .txt/.md, and a "copy link with my settings" (mode + model in URL params, *never the text*) so users can share their preferred config without sharing private content.
15. **Empty-state guidance with a real demo button.** Before any paste, show "Try an example" that loads a deliberately AI-sounding paragraph and rewrites it — so first-time visitors see value *before* committing to the model download. Critical for conversion given the heavy first-load cost.
16. **Graceful low-power / mobile mode.** On weak mobile GPUs, offer "Quick clean only (no model download)" that runs the existing deterministic cleaner instantly, with a "Want a full rewrite? Tap to load the AI model" upgrade path. Nobody hits a dead end.
17. **Accessible, no-color-only signaling.** Diff highlights use underline/strikethrough + icons, not just color; score meters include numeric labels and ARIA live regions announce "rewrite complete" for screen-reader users.

## 6. UX / UI notes

**Layout:** Two-pane (input left, output right) on desktop; stacked on mobile. A top bar holds the model picker, the "model ready / cached / downloading" status pill, and the privacy badge. A sticky mode-chip row sits between the panes. Score meters dock to a collapsible right rail (or below output on mobile).

**Input/output model:** Paste → pick mode → Rewrite (or Cmd/Ctrl+Enter) → streamed output appears in the right pane with diff highlights → accept all / per-sentence / copy / download.

**States:**
- **Empty:** explainer + "Try an example" + a *clear, honest* one-time-download notice ("First use downloads a ~1.2 GB AI model, then works offline forever"). Don't auto-download until the user opts in.
- **Downloading:** progress bar with MB/ETA + "this only happens once" microcopy; cancellable.
- **Warming up (cached):** small "Loading model from cache… ~3s" indicator (WebLLM gives no callback for cache loads, so use a determinate-feel placeholder/spinner).
- **Generating:** streaming tokens + a stop button.
- **Result:** diff view, scores, action buttons.
- **No-WebGPU fallback:** friendly card explaining the device/browser lacks WebGPU, with the deterministic cleaner offered instead — never a blank screen.

**Microcopy tone:** Calm, honest, privacy-forward, non-hype. "Your text stays on this device." "Quality, not tricks." Avoid "beat the detector" language entirely (brand rule).

**Mobile behavior:** Default to the lightest model (1B) or quick-clean; warn before a large download on cellular ("You're on mobile data — this download is ~1.2 GB. Continue?"). Respect `prefers-reduced-data`.

**Accessibility:** WCAG 2.2 AA — full keyboard operability, focus-visible rings, ARIA live regions for progress and completion, no color-only diff signaling, 4.5:1 contrast, reduced-motion respected for the streaming/confetti animations.

## 7. Technical implementation (client-side)

**Engine.** `@mlc-ai/web-llm` (npm or `https://esm.run/@mlc-ai/web-llm`). Initialize with `CreateMLCEngine(modelId, { initProgressCallback })`, ideally via `CreateWebWorkerMLCEngine` so all inference runs in a Web Worker and the UI thread stays responsive. WebLLM is OpenAI-API-compatible (`engine.chat.completions.create({ messages, stream: true, temperature })`), so prompts/modes are just system messages.

**Model choice (concrete).** First-load weight is the dominant UX cost, so default small:
- **Llama-3.2-1B-Instruct** or **Qwen2.5-1.5B-Instruct** (~1.2 GB GPU, ~1.5 GB download) for the default — fast warm-up, runs on most laptops and many phones.
- **Phi-3.5-mini-instruct (3.8B, q4f16)** as the "best quality" opt-in: ~2 GB int4 VRAM, ~3.6 GB download, ~71 tok/s decode on capable hardware per the WebLLM arXiv paper (2412.15803). Flag it as "too heavy for first load" on weak devices.

**Caching.** WebLLM persists weights via `appConfig.cacheBackend`: `"cache"` (default, Cache API), `"indexeddb"`, or `"opfs"`. Use the default Cache API; expose a "Clear cached model" button (storage hygiene + trust). Note the known limitation: `initProgressCallback` only reports network downloads, *not* cache reads — so on warm loads show a generic determinate-feel spinner.

**WebGPU detection & fallback.** Gate on `if (!navigator.gpu) → fallback`. Even where `navigator.gpu` exists, `requestAdapter()` can return null (driver/blocklist) — handle both. Fallback path = the **existing deterministic cleaner** (em-dash replacement, quotes, ellipsis, invisible-char stripping, AI-tell scan) which needs no model and runs everywhere. Optionally offer a Transformers.js / ONNX Runtime Web WASM path for a *tiny* rewrite model as a middle tier, but WASM LLM decode is 3–15× slower than WebGPU and likely too slow for a good rewrite UX — recommend treating it as out of scope for v1.

**Browser support reality (2026).** Per caniuse-derived coverage, WebGPU is ~82% global, ~87% desktop, ~71% mobile. Chrome/Edge solid; Safari 26 ships it (newer OS only); **Firefox remains the wobble** — enabled on some channels/platforms (e.g. 141 on Windows) but still effectively off-by-default for many users mid-2026 due to fingerprinting/driver concerns. So: *market* cross-browser, but *engineer* a graceful fallback for the meaningful slice still without WebGPU.

**Long-text handling.** On-device decode is slow (~40–70 tok/s on the bigger model, much less on weak GPUs), and small models have limited context. Chunk input by sentence/paragraph, rewrite chunk-by-chunk with a live progress count ("rewriting 3/12 paragraphs"), and stream each. Cap a single run (e.g. ~1,500 words) with a clear "split into batches" UX rather than hanging.

**Edge cases & failure modes.** Out-of-memory on shared-memory laptops (1.5B ≈ 1.2 GB from the same pool as everything else) → catch device-lost errors and suggest the smaller model; tab backgrounded mid-download → resume from cache; user navigates away mid-stream → abort generation cleanly; non-English input → 1B models are weaker, surface a "best for English" note; model produces refusals/hallucination → keep the deterministic cleaner as the always-available baseline so the tool is never useless.

**Privacy story (load-bearing).** Inference is local; the *only* network traffic is the one-time weight download from a CDN (and our static assets). Document this explicitly, invite users to verify in DevTools Network tab, and ensure no analytics beacon ever carries user text. This is the entire brand wedge — protect it.

## 8. Competitors & how we differentiate

**Cloud paraphrasers (the mass market):** QuillBot, Scribbr (scribbr.com), Semrush free paraphraser, RewritePal, paraphrasing-tool.com. Strengths: polished, high-quality large models, strong SEO. **Weakness: every one of them uploads your text to a server**, most gate length/modes behind signup or paywalls, and several explicitly store text. Our wedge: *the text physically never leaves the device* — a claim they structurally cannot make.

**"Privacy-ish" cloud tools:** AICreate (aicreate.com) markets "runs in your browser / privacy + no limits" with 6 modes — closest positioning to us, but verify whether it's truly on-device or just account-free cloud; if cloud, our *provable* on-device story (zero network requests, works offline) is the differentiator.

**Raw WebLLM/Transformers.js demos:** Hugging Face Spaces (webml-community Qwen3.5-WebGPU, llama-3.2-webgpu), the WebLLM chat demo. Strengths: technically impressive. **Weakness: they're generic chat demos, not a focused rewrite tool** — no rewrite presets, no diff, no AI-tell education, no fallback, rough UX. We productize the same engine into a purpose-built, accessible, brand-consistent rewriter.

**Our combined wedge:** (1) **Provable privacy** — on-device, offline-capable, verifiable in DevTools; (2) **Cross-browser reach** — works for the Firefox/Safari users Chrome-only AI features ignore, with a never-dead-ends fallback; (3) **Consolidation** — sits alongside our deterministic cleaner and AI-tell scanner so users clean *and* rewrite in one private place; (4) **Quality, not bypass** — explicitly positioned for human voice and readability, not detector evasion, which builds long-term trust (and avoids the reputational tarpit competitors wade into).

## 9. SEO & page structure

**Primary keyword:** "private on-device AI rewriter (no upload)." **Secondary:** "offline paraphrasing tool," "in-browser LLM rewrite," "free rewriter no signup," "WebGPU AI rewrite Firefox/Safari," "rewrite text without uploading."

**H1/H2 outline:**
- **H1:** Private AI Rewriter — Runs 100% in Your Browser, No Upload
- **H2:** How it works (WebGPU + WebLLM, on-device)
- **H2:** Choose a rewrite mode (Standard, Fluent, Formal, Casual, Shorten, Expand)
- **H2:** Why on-device? Your text never leaves your device
- **H2:** Works in Chrome, Edge, Safari & Firefox (with WebGPU)
- **H2:** First load downloads the model once, then works offline
- **H2:** Rewrite vs. clean — when to use which (links to the cleaner)
- **H2:** FAQ

**FAQ ideas:** Does my text get uploaded? (No — verifiable in DevTools.) Does it work offline? (Yes, after the one-time model download.) Why is the first load slow / large? (One-time ~1–2 GB model, then cached.) Which browsers work? (WebGPU-enabled Chrome/Edge/Safari 26+/Firefox where enabled; fallback otherwise.) Is it free / does it need an account? (Free, no signup.) Will it beat AI detectors? (Not our goal — we optimize for human-readable quality.) What if my device is too slow? (Pick the 1B model or use the instant deterministic cleaner.)

**schema.org:** `WebApplication` (applicationCategory: "UtilitiesApplication", offers price 0, browserRequirements: "Requires WebGPU") + `FAQPage` for the FAQ + `BreadcrumbList` back to the tool suite.

**Internal links:** ↔ Em-Dash Remover / deterministic cleaner (the always-available fallback), ↔ AI-Tell Scanner (feeds the "why this changed" explainers and score meter), ↔ any "humanize / keep your voice" pillar page, ↔ a "How on-device AI works" explainer post for backlinks.

## 10. Build effort & priority

**Effort: High** — the largest single tool in the suite. Bulk of the work is *not* the model call (WebLLM's OpenAI-style API is simple) but the **UX around a heavy, slow, sometimes-unavailable resource**: the download/progress/cache flow, Web Worker plumbing, WebGPU detection + fallback, device-suitability hints, chunked long-text streaming, and the diff/score/education layers in §5.

**Dependencies on existing code:** Reuses the deterministic cleaner as the no-WebGPU / low-power fallback (already built), and the AI-tell scanner powers the "why this changed" explainers and the before/after AI-tell score meter. Astro/Cloudflare static hosting already fits a 100%-client-side tool; ensure the WebLLM worker and the large CDN model URLs are allowed by CSP and that no analytics touches user text.

**Recommended sequencing:**
1. Spike WebGPU detection + `CreateWebWorkerMLCEngine` with one small model (Llama-3.2-1B) and streaming output — prove the pipeline and measure real load/decode times on target devices.
2. Ship the honest first-load/cache/progress flow + empty-state demo + fallback to the existing cleaner (this is the make-or-break UX).
3. Layer modes, diff view, copy/download, keyboard shortcuts, localStorage prefs.
4. Add the engagement/education layer: AI-tell + readability score meters, "why this changed" explainers, per-sentence accept, device-suitability hints.
5. Add the bigger "best quality" model (Phi-3.5-mini) as an opt-in once the small-model UX is solid.

**Priority note:** Because WebGPU is still ~82% global and Firefox is shaky in 2026, **do not** make this the primary CTA of the site — ship it as a premium, privacy-flagship companion to the instant deterministic cleaner, which remains the universal default. This tool's job is *trust and differentiation*, not first-paste conversion.

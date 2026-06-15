---
title: "On-Device AI Rewrite: Change Your Text's Tone Privately, In Your Browser"
description: "How on-device AI rewrite works, why it keeps your text private, and how to change tone, shorten, or lengthen writing without sending a word to the cloud."
pubDate: 2026-06-15
keywords: ["on-device AI rewrite", "private AI rewriter no data sent to cloud", "browser built-in AI rewriter", "change tone of text online free", "Gemini Nano rewrite text", "client-side AI text rewriter"]
---

Most rewriting tools send your draft to a server before they touch a single word. That's fine for a tweet, less fine for a client email, a legal paragraph, or anything you'd rather not hand to a third party. A new option changes that: AI that runs entirely inside your browser, on your own machine. Here's what on-device AI rewriting is, how it works, and how to use it to change tone or length without your text ever leaving your laptop.

## What is on-device AI rewriting?

On-device AI rewriting means the model that rewrites your text runs locally - on your computer's own hardware - instead of in a data centre. You paste a paragraph, ask for a more formal tone or a shorter version, and the rewrite happens in the same place you're typing. No upload, no API call, no copy of your draft sitting in someone's logs.

This is possible now because browsers have started shipping small language models built in. Chrome bundles a compact model (Gemini Nano) and exposes it to web pages through a built-in Rewriter API. A tool can call that API to revise your text, and the work stays on your device. Our [on-device AI rewrite tool](/tools/on-device-ai-rewrite) is built directly on this capability.

## How does on-device AI rewrite work?

The flow is simple from your side and worth understanding under the hood:

1. **The model lives on your machine.** The first time it's needed, Chrome downloads the model once (it's large - tens of gigabytes of free disk space are recommended). After that, it's local.
2. **The page asks the browser to rewrite.** When you click "rewrite", the tool calls the browser's built-in Rewriter API with your text plus instructions - for example, "make this more casual" or "shorten this".
3. **Inference runs on your GPU or CPU.** The model generates the new version using your own hardware. Nothing is sent over the network for this step.
4. **You get the rewrite back in the page.** You compare, keep what you like, and edit the rest.

Because every step happens locally, the tool works the same whether you're on fast Wi-Fi or none at all (once the model is downloaded).

## Is browser AI private? Can I rewrite text without sending it to the cloud?

Yes - that's the entire point. With a [private AI rewriter that sends no data to the cloud](/tools/on-device-ai-rewrite), your draft is processed in your browser and never transmitted to a server. There's no account, no upload, and nothing stored after you close the tab.

This matters most when the text is sensitive: unpublished work, internal documents, personal messages, anything under NDA. Cloud rewriters typically transmit your input and may retain it for a period, depending on their policy. On-device rewriting removes that question entirely, because the data never travels. It's the same privacy stance behind our [text-cleaning tools](/) - your words stay yours.

## Does Gemini Nano work offline?

Once the model has finished its one-time download, yes. The download itself needs a connection and a chunk of free disk space, but after that the rewriter runs on local hardware, so you can change tone or trim a paragraph on a plane or with the network off. If the model hasn't downloaded yet, you'll need to be online for that initial setup.

## How do I change the tone of my text with AI?

Tone is the most common reason people reach for a rewriter. The built-in approach lets you shift between registers without rewriting by hand:

- **More professional:** turn a blunt or chatty note into something measured. Useful for [rewriting an email tone to be professional](/tools/on-device-ai-rewrite) before you hit send.
- **More casual:** loosen up stiff, formal text so it reads like a person talking.
- **Neutral:** strip out emotional or salesy language and state things plainly.

The practical tip: rewrite in small chunks - a paragraph at a time - rather than a whole document at once. Smaller inputs give the model a tighter target and give you a cleaner result to review. And always read the output. A tone shift can quietly change meaning, so you're the editor, not the machine.

## How do I shorten text - or make it longer - with AI?

The same Rewriter API handles length as well as tone. Two everyday uses:

- **Shorten:** condense a rambling paragraph into its core point. Good for summaries, intros, and anywhere you've over-explained.
- **Lengthen:** expand a terse bullet into a fuller sentence or two when something needs more context.

A realistic expectation: shortening tends to be more reliable than lengthening. When you ask a model to add words, it can pad with filler - the exact kind of vague, hedge-heavy phrasing that reads as AI. If you lengthen, watch for clichés and cut them back. Our guide to the [signs of AI writing](/blog/signs-of-ai-writing) covers the specific tells to look for, from over-hedging to the "rule of three" creeping into every sentence.

## What's the difference between cloud AI and on-device AI rewrite?

Both can change tone and length. The differences are about where your text goes and what it costs you:

| | Cloud AI rewriter | On-device AI rewrite |
|---|---|---|
| Where text is processed | A remote server | Your own browser |
| Privacy | Text is transmitted; may be retained | Text never leaves your device |
| Account | Often required | None needed |
| Works offline | No | Yes, after one-time setup |
| Model size/quality | Very large, often stronger | Smaller, lighter, fast |
| Cost | Often metered or subscription | Free |

The honest trade-off: a small on-device model won't match the raw capability of a large cloud model on every task. What it gives you instead is privacy, no signup, no per-use cost, and offline use. For everyday tone and length edits, that's usually the better deal.

## How do I enable the built-in rewriter in Chrome?

The Rewriter API is part of Chrome's built-in AI, available in recent versions through an origin trial (Chrome 137 to 148 at time of writing), so it's newer functionality and still settling. To use it you'll generally need:

- A recent version of Chrome on a supported desktop OS (Windows 10/11, macOS 13+, Linux, or a compatible ChromeOS device).
- Enough free disk space for the model (plan for tens of gigabytes) and a capable GPU or a reasonably specced CPU.
- The first-run model download to complete.

If the API isn't available in your browser, a well-built tool will tell you clearly rather than failing silently. Because this is evolving, exact requirements shift between Chrome versions - the tool checks support for you when the page loads.

## Is on-device AI rewriting free, and do I need an account?

Free, and no. There's nothing to sign up for and nothing to pay. The model is part of your browser and runs on hardware you already own, so there's no usage meter and no login wall. You can rewrite as much as you like, and nothing is stored once you leave.

## Try it on your own text

If you want to change a paragraph's tone, tighten a wordy draft, or make a quick email sound more professional - without handing your words to anyone - try the [on-device AI rewrite tool](/tools/on-device-ai-rewrite). It runs entirely in your browser, needs no account, and keeps every draft on your machine. Pair it with our [punctuation and AI-tell cleaner](/) and you can take an AI-assisted draft all the way to clean, natural, genuinely yours - privately, start to finish.

---

Sources: [Chrome for Developers - Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api), [Chrome for Developers - Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis), [Gemini Nano in the Browser (2026)](https://pasqualepillitteri.it/en/news/3145/gemini-nano-chrome-built-in-ai-client-side-en)

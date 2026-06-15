---
title: "OpenAI 'Fixed' the Em Dash. Your Documents Still Have Them."
description: "ChatGPT reportedly reduced its em-dash habit in late 2025. But every document you already pasted still has them — and Claude, Gemini and the invisible-character tells are untouched."
pubDate: 2026-06-15
keywords: ["remove em dash chatgpt", "openai em dash", "chatgpt em dash fix"]
---

In late 2025, OpenAI reportedly tuned ChatGPT to stop leaning so hard on the em dash. For a punctuation mark, it got a surprising amount of attention — the em dash had become the single most recognisable tell of AI writing, and people noticed when it quietly receded. Good change. But if you write for a living, or you've spent the last two years pasting AI drafts into docs, the fix solves much less than the headlines suggest.

Here's the catch in plain terms: a model behaving differently *today* does nothing about the text you already have, and it says nothing about the other models you use. The em dash problem didn't get fixed. One source of it got a little quieter.

## The documents you already wrote still have them

Think about how much AI-assisted text you've already shipped. Blog drafts, newsletters, product copy, internal docs, slide notes, that bio you rewrote four times. Every one of those was generated under the *old* behaviour, and every em dash that landed in them is still sitting there. A change to ChatGPT's future output is not retroactive. It doesn't reach back into your Google Drive and rebalance your punctuation.

So if you care about how your existing library reads — and you should, because that's the writing people actually find — the fix is irrelevant to it. You still have to go clean it.

The good news is that this is the easy, mechanical part. Paste any document into the [core cleaner](/) and it rebalances em dashes into the commas, periods, and colons they should have been, without creating comma splices or mangling the sentences around them. It's one pass, and it's the same whether the text is one paragraph or one hundred.

## ChatGPT isn't the only model in your stack

The second problem is bigger. ChatGPT is one tool among several, and the em-dash habit was never unique to it. Claude, Gemini, and most other capable models still reach for the em dash freely, because it's genuinely useful punctuation that shows up all over their training data. If your workflow touches more than one assistant — and most people's do now — then "OpenAI tuned theirs" changes one input and leaves the rest exactly as they were.

You can't audit this by remembering which model wrote which paragraph. You won't remember. The reliable move is to treat the text itself as the source of truth: run it through a cleaner that doesn't care which model produced it, and let the punctuation patterns speak for themselves.

## The em dash was always the visible tell, not the only one

This is the part the "OpenAI fixed it" framing misses entirely. The em dash was just the tell you could *see*. Underneath it sits a layer of stuff you can't.

The most important of these is invisible characters. AI output and copied web text routinely carry zero-width spaces, non-breaking spaces, and occasional bidirectional or watermark-style characters that render as nothing at all. You can't spot them by reading — they have no width — but they travel with your text into every field you paste it. They break search, they corrupt slugs and code, and some of them are deliberately seeded as hidden markers. No amount of punctuation tuning removes them, because they were never punctuation. The [Invisible Character Inspector](/tools/invisible-watermark-character-inspector) surfaces every one of these, shows you exactly what's hiding and where, and strips them out.

Beyond the invisible layer, the stylistic tells are still fully intact. The "it's not just X, it's Y" construction. The signature vocabulary — *delve, tapestry, leverage, robust, seamless*. The relentless rule of three. The uniform, medium-length sentence rhythm that never bursts short or runs long. None of these are punctuation, so none of them were touched by a model update. They're how AI text *thinks*, not how it's typeset.

To catch those, run a draft through the [Human-Voice / AI-Tell Report](/tools/human-voice-ai-tell-report). It scores the cadence, flags the clichés and overused words, and points you at the specific sentences that read like a machine wrote them — so you can edit those few spots by hand instead of re-reading the whole thing five times.

## A practical cleanup pass

If you want a routine that survives any model's behaviour changing again next quarter, here's the one we'd use:

1. **Paste into the [core cleaner](/).** Rebalance the em dashes and fix smart quotes, ellipses, and leftover Markdown in one go. This handles every mechanical tell at once.
2. **Run the [Invisible Character Inspector](/tools/invisible-watermark-character-inspector).** Strip the zero-width and watermark characters you can't see. Do this even on text that looks clean — *especially* on text that looks clean.
3. **Check the [AI-Tell Report](/tools/human-voice-ai-tell-report).** Let it flag the clichés and the flat rhythm, then make the handful of human edits it points to.

That's the whole pass, and it works the same for ChatGPT, Claude, Gemini, or whatever you switch to next.

## Why this keeps mattering

Models will keep adjusting their surface style. Today it's the em dash; next time it'll be some other tic that gets too famous. Chasing those one by one is a losing game. The durable approach is to judge the text in front of you, not the tool that made it — clean the mechanical artifacts every time, and spend your real attention on whether the writing sounds like you.

None of this is about disguising anything. It's about quality. Cleaner punctuation, no invisible junk, and a voice that's actually yours make writing better for the reader — which was always the point, long before a single em dash got fixed.

---
title: "Does Removing Em Dashes Bypass AI Detection? No — and That's the Point."
description: "Stripping em dashes and invisible characters won't fool an AI detector. Here's why, and why this toolkit is built for writing quality — not for helping AI hide."
pubDate: 2026-06-15
keywords: ["does removing em dashes bypass ai detection", "ai humanizer", "is em dash remover a humanizer"]
---

It's a fair question, and we get it a lot: if AI writing is famous for its em dashes, won't deleting them get an AI draft past a detector? The honest answer is no. Removing em dashes — or invisible characters, or smart quotes — does not bypass AI detection. And we think that's exactly as it should be. This is a good moment to explain how detectors actually work, and why we deliberately built a cleanup toolkit and not a "humanizer".

## How AI detectors actually decide

AI detectors don't scan for punctuation. They almost never look at em dashes at all. What they measure is statistical: how *predictable* your text is to a language model.

The core ideas are **perplexity** and **burstiness**. Perplexity asks: given everything written so far, how surprised is a language model by the next word? Machine-generated text tends to choose the most probable next word again and again, so it reads as low-perplexity — smooth, expected, unsurprising. Human writing is lumpier. We pick the odd word, change register mid-thought, and leave the model guessing. Burstiness captures the same intuition at the sentence level: humans swing between short punchy lines and long winding ones, while AI tends toward a steady, uniform rhythm.

A detector builds its judgement on those distributions across the whole document. It's reading the *shape* of your word choices, not your typography. So whether a dash is an em dash, an en dash, a comma, or a period changes essentially nothing in that calculation. You can swap every em dash in a machine-written paragraph for a period and the underlying statistics — the predictability, the rhythm — stay almost exactly where they were. The detector's verdict barely moves.

This is why the popular belief is wrong. The em dash is a tell that *human readers* notice. It is not a feature most detectors weigh. Cleaning it makes your writing read better; it doesn't change what a perplexity model sees.

## So what is this toolkit for?

This is the important distinction, and it's the one the "humanizer" crowd blurs on purpose.

A **humanizer** exists to take machine-written text and rephrase it specifically to score lower on detectors — to help AI output pass as human. That's an arms race against detection, and it's fundamentally about deception. We don't build that, and we won't, because the goal itself is dishonest.

What we build is a **cleanup and quality toolkit**. The job is to take text — yours, AI-assisted, or pasted from somewhere messy — and make it *read* better and *carry* less junk. That means rebalancing overused em dashes into the right punctuation, stripping invisible characters that shouldn't be in any document, fixing smart quotes, and flagging the clichés and flat cadence that make a draft feel generic. Every one of those is a legitimate editing task you'd do anyway. None of them is aimed at a detector's score.

The difference is the intent. One tries to hide the machine. The other tries to make the writing good.

## The detection problem we actually care about

There's a real harm here, and it runs the *opposite* direction from what people assume. The bigger problem with AI detectors isn't that they catch AI — it's that they catch **humans**. Detectors regularly flag genuine human writing as machine-generated. Non-native English speakers get hit especially hard, because their prose can read as more "predictable" to the model. Students, job applicants, and writers have been falsely accused on the strength of a number that was never reliable to begin with.

If you wrote something yourself and a detector flagged it, no amount of punctuation cleanup will move that score either — but understanding *why* it flagged you helps. Run your own text through the [Human-Voice / AI-Tell Report](/tools/human-voice-ai-tell-report). It shows you the cadence and patterns a detector keys on, so you can see whether your draft genuinely reads flat or whether the detector is just wrong. Often it's the latter, and now you have something concrete to point to.

## What cleanup is genuinely good for

So if it won't fool a detector, why clean at all? Because the artifacts are real problems on their own terms:

- **Invisible characters** don't belong in any document. They break search and copy-paste, corrupt code and URLs, and some are deliberate hidden markers. The [Invisible Character Inspector](/tools/invisible-watermark-character-inspector) finds and strips them — a worthwhile fix regardless of who wrote the text.
- **Overused em dashes** make prose feel breathless and uniform. Rebalancing them with the [core cleaner](/) makes writing clearer for the reader. That's an editing win, not a detection trick.
- **Clichés and flat rhythm** are worth catching because they're weak writing. Fixing them makes your draft stronger, whether a detector ever sees it or not.

For the full picture of which tells matter and how to edit them out, our guide to the [signs of AI writing](/blog/signs-of-ai-writing) walks through each one — as quality fixes, not as evasion.

## The honest bottom line

Removing em dashes will not get AI text past a detector, because detectors read statistics, not punctuation. We're glad it doesn't, because chasing detector scores is a game built on deception, and we'd rather not be in it.

What cleanup *will* do is make your writing cleaner, lighter, and more clearly your own — and give you something real to point at if your honest work ever gets falsely flagged. That's the line we draw. Use AI to draft if you want, then edit it into good writing the same way you'd edit any first draft. The [core cleaner](/) handles the mechanical part. The judgement stays with you, which is exactly where it belongs.

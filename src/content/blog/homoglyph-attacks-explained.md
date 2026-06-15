---
title: "Homoglyph Attacks Explained: What Lookalike Unicode Characters Are and How to Catch Them"
description: "What a homoglyph attack is, why Cyrillic and Greek letters sneak into your text, and how to detect and normalize confusable Unicode characters fast."
pubDate: 2026-06-15
keywords: ["homoglyph attack", "homoglyph detector", "unicode confusables", "lookalike characters", "detect cyrillic characters in text", "what is a homoglyph"]
---

Some of the most confusing problems in text are invisible in plain sight. A word can look perfectly normal - "paypal", "Apple", "secure" - while one of its letters is secretly from a different alphabet. That swapped letter is a homoglyph, and the trick of using it is a homoglyph attack. Here's what's going on, why it shows up in everyday documents, and how to catch it.

## What is a homoglyph?

A homoglyph is a character that looks identical (or nearly identical) to another character but has a different Unicode code point. The Latin "a" (U+0061) and the Cyrillic "а" (U+0430) render as the same shape in almost every font, yet to a computer they are completely different letters.

Unicode contains thousands of these lookalikes because it encodes dozens of writing systems - Latin, Cyrillic, Greek, Armenian, Cherokee, and more - and many of them independently developed letters that share a shape. Unicode's own data files call these pairs "confusables," and they maintain an official confusables table (Technical Report TR39) that maps each lookalike to the character it can be mistaken for.

## What is a confusable character?

"Confusable" is just the precise term for the same idea: a character that could be confused with another. Common offenders include:

- **Cyrillic а, е, о, р, с, х** - identical to Latin a, e, o, p, c, x
- **Greek ο, ν, Α, Β, Ε** - lookalikes for Latin o, v, A, B, E
- **Fullwidth forms** like `ａ` `Ａ` - used in East Asian typography
- **Mathematical alphanumerics** like 𝐚 or 𝒂 - the styled letters AI and design tools sometimes emit

A single confusable in the wrong place changes what a string *means* to software, even though it looks unchanged to you.

## What is a homoglyph attack?

A homoglyph attack is the deliberate use of confusable characters to make one thing pass as another. The classic example is the **IDN homograph attack**: an attacker registers a domain like `аpple.com` where the first "a" is Cyrillic. The address bar shows what looks like the real domain, but it points somewhere else entirely. The same trick appears in phishing emails (a spoofed sender or brand name), fake usernames that impersonate a real account, and text crafted to slip past keyword filters.

The defense is detection. If you can flag every character that doesn't belong to the script the rest of the text uses, the disguise falls apart instantly. Our [homoglyph and confusables detector](/tools/homoglyph-confusables-detector) does exactly this - it scans for mixed scripts and highlights every lookalike character so a spoofed string can't hide.

## Why does my text have Cyrillic letters?

Most people who run into homoglyphs aren't being attacked - their document just picked up stray characters. Common causes:

- **Copy-pasting from the web or PDFs**, where a page mixed scripts or used a styled font
- **Autocorrect or keyboard layouts** switching languages mid-word
- **Pasting from chat tools and AI assistants**, which occasionally emit non-Latin lookalikes or styled math letters

Can ChatGPT insert hidden Cyrillic characters? It can happen - large language models very occasionally produce a confusable letter, especially with styled or multilingual context. It's uncommon and not a reliable "watermark," but it's real, which is why a quick scan before publishing is worth the few seconds. (For the zero-width and invisible characters that are a separate problem, see our wider notes on [the signs of AI writing](/blog/signs-of-ai-writing).)

## How do I detect Cyrillic characters in text?

Spotting these by eye is nearly impossible - that's the entire point of a confusable. You need a tool that compares each character against the Unicode confusables table and tells you which script it belongs to. A good detector will:

1. **Highlight** every non-Latin lookalike in context, so you can see exactly where it sits.
2. **Identify the script** (Cyrillic, Greek, fullwidth, mathematical) so you understand what was swapped.
3. **Offer to normalize** - replace each confusable with its plain ASCII or Latin equivalent.

Paste your text into the [Cyrillic and lookalike-character detector](/tools/homoglyph-confusables-detector) and it does all three in your browser. Nothing is uploaded; the scan runs locally, which matters when the text is a contract, an email, or anything you'd rather not send to a server.

## How to find lookalike characters in a Word document or Google Docs

Word and Google Docs don't flag confusables on their own, but there are workarounds:

- **Word:** Word's spell-checker often *underlines* a word containing a foreign-script letter as misspelled, even though it looks correct. That squiggle under a word that's clearly spelled right is a strong hint. You can also select text and check the language field - mixed-script runs sometimes report an unexpected language.
- **Google Docs:** there's no built-in check, so the reliable path is to copy the suspect text out and run it through a detector.

For either app, the fastest route is to copy the text into a [confusables checker](/tools/homoglyph-confusables-detector), let it highlight the offenders, normalize them, and paste the clean version back.

## How do I normalize homoglyphs to ASCII?

Normalization means replacing each confusable with the standard character it imitates: Cyrillic "о" becomes Latin "o", a fullwidth "Ａ" becomes "A", and so on. The mapping comes straight from the Unicode confusables data, so it's deterministic rather than guesswork.

Do this with care in two situations:

- **Genuinely multilingual text.** If your document is *supposed* to contain Russian or Greek, don't blanket-normalize - you'd corrupt real words. Normalize only the words that should be Latin.
- **Names and identifiers.** A person's name may legitimately use non-Latin letters. Treat those as intentional.

A good tool shows you each change before applying it, so you stay in control instead of mass-replacing blindly.

## Why do plagiarism and spam checkers miss confusable substitution?

Because most checkers compare *text strings*, and to a string comparison "pаypal" (with a Cyrillic a) and "paypal" are simply different. The substituted word no longer matches the dictionary, the banned-term list, or the source it was copied from. That's why confusable substitution slips past naive filters - and why a dedicated detector that works at the character and script level is the right layer to catch it.

To be clear about intent: detecting and normalizing homoglyphs is about **integrity and clarity** - making sure text says what it appears to say. It's a verification step, not a way to disguise anything.

## Catch confusables before you publish

If you handle text that other people trust - domains, brand names, invoices, published copy - a ten-second scan for lookalike characters is cheap insurance. Paste your text into the [Homoglyph and Confusables Detector](/tools/homoglyph-confusables-detector) to highlight every Cyrillic, Greek, and fullwidth impostor and normalize it back to clean ASCII, entirely in your browser with nothing uploaded. Pair it with the rest of our [free, private text tools](/) and your writing stays exactly as legible to machines as it is to readers.

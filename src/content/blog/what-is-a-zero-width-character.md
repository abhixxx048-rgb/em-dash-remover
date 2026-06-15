---
title: "What Is a Zero-Width Character? Invisible Unicode, Explained"
description: "Zero-width spaces, joiners, BOMs and bidi characters are invisible Unicode you can't see but software can. Here's what they are and how to find them."
pubDate: 2026-06-15
keywords: ["what is a zero width space", "what are invisible unicode characters", "zero width character detector", "what is a bidi character", "detect AI watermark characters", "remove invisible characters from text"]
---

You copy a price from a website, paste it into a spreadsheet, and the formula breaks. You set a password and it's rejected even though it looks identical to the one you typed. You paste a paragraph from ChatGPT and a code review flags "invisible characters." In every case the culprit is the same: zero-width and other invisible Unicode characters that your eyes skip over but software reads loud and clear.

This post explains what those characters are, where they come from, and how to find them. If you just want to scan a block of text right now, paste it into the [Invisible Character Inspector](/tools/invisible-watermark-character-inspector) - it runs entirely in your browser and highlights every hidden code point.

## What is a zero-width space?

A zero-width space is a Unicode character (code point **U+200B**) that marks a possible line-break point without taking up any visual width. It renders as nothing. There's no glyph, no gap, no cursor pause you'd notice - but it's a real character sitting in the byte stream.

It was designed for legitimate typesetting: languages without spaces between words, or long URLs that need to wrap cleanly. The problem is that it travels invisibly. Copy text from a styled web page, a PDF, or a chat app, and zero-width spaces can come along for the ride, embedding themselves in places you never intended.

## What are invisible Unicode characters?

"Zero-width space" is just the most famous member of a larger family. Invisible Unicode characters are code points that occupy no visible space (or look identical to a normal space) yet still count as characters. The usual suspects:

- **Zero-width space** (U+200B) - the classic break hint.
- **Zero-width joiner** (U+200D) - glues symbols together, notably emoji.
- **Zero-width non-joiner** (U+200C) - prevents characters from joining.
- **Zero-width no-break space / BOM** (U+FEFF) - a byte order mark that often lurks at the start of a file.
- **Non-breaking space** (U+00A0) and **narrow no-break space** (U+202F) - look like ordinary spaces but aren't.
- **Word joiner** (U+2060), **soft hyphen** (U+00AD), and various **variation selectors**.

None of these show up when you read the text, which is exactly why they cause confusion. A good [hidden character detector](/tools/invisible-watermark-character-inspector) names each one by its code point so you know precisely what you're dealing with.

## What is a zero-width joiner?

The zero-width joiner (U+200D) tells the rendering engine to combine adjacent characters into a single glyph. It's the quiet workhorse behind modern emoji. The "family" emoji, for example, is several person emoji stitched together with zero-width joiners; the "rainbow flag" is a flag joined to a rainbow the same way.

That's a feature, not a bug - until you copy emoji-rich text into a database, a username field, or a fixed-width log and the invisible joiners throw off your character counts or validation. Removing a stray joiner can also silently break a legitimate emoji, so it's worth *seeing* exactly where they sit before you strip anything.

## What is a bidi character, and what's a Trojan Source attack?

Bidi (bidirectional) characters control text direction so that left-to-right scripts like English and right-to-left scripts like Arabic or Hebrew can coexist in one line. Characters like the right-to-left override (U+202E) tell software to reverse the visual order of what follows.

In normal multilingual text this is essential. In source code it can be dangerous. A 2021 research disclosure called **Trojan Source** showed that bidi overrides can make code *look* like it does one thing while the compiler reads something else entirely - hiding a comment that's actually executable, or reordering a logic check. Later supply-chain incidents (the Glassworm campaign in late 2025 among them) reused invisible and bidi Unicode to smuggle malicious instructions past human reviewers.

This is why scanning for invisible characters isn't only a writing-cleanliness chore. If you maintain code, config, or anything that gets parsed by a machine, a quick pass through a [zero-width and bidi character detector](/tools/invisible-watermark-character-inspector) is a cheap security habit.

## Does ChatGPT add invisible watermark characters?

Sometimes, yes - though "watermark" overstates it. Through 2024 and 2025, people noticed that text from ChatGPT and other assistants occasionally contained a **narrow no-break space (U+202F)** and other invisible characters, especially around punctuation and numbers. This sparked claims that AI vendors were secretly watermarking output to track it.

The honest version is more mundane. OpenAI has described these as a quirk of how the model formats certain tokens, not a deliberate tracking mechanism. They aren't a reliable signal that text is AI-generated - human-typed text picks up invisible characters too - and they can be removed without changing a single visible word. So treat them as **formatting noise to clean up**, not as a watermark to fear or a fingerprint to defeat. (For the broader pattern of AI formatting habits, see our guide to the [signs of AI writing](/blog/signs-of-ai-writing).)

The practical move is the same regardless of origin: detect them, then decide. If you want to [remove invisible characters from ChatGPT text](/tools/invisible-watermark-character-inspector), the inspector strips zero-width and no-break characters while leaving your real content untouched.

## Why is there a weird invisible character in my text?

If something looks fine but behaves badly, an invisible character is a strong suspect. Common sources:

- **Copy-pasting** from websites, PDFs, Word, or Google Docs, which carry over formatting characters.
- **AI assistants** inserting narrow no-break spaces around numbers and punctuation.
- **Byte order marks** added by editors when saving files, which then break JSON parsers or shift CSV columns.
- **Form fields and passwords**, where a single trailing zero-width character makes two "identical" strings fail to match.

The reason a password "looks right" but won't work is almost always this: the stored value and the typed value differ by one character you can't see. The same explains a JSON file that's valid to your eye but rejected by the parser, or a CSV whose first column header mysteriously won't match.

## How do I find and remove invisible characters?

You have a few options depending on where the text lives:

- **In Word**, turn on *Show/Hide* formatting marks (the ¶ button) to reveal some hidden characters, then use Find & Replace with special characters to clear them.
- **In Google Docs**, paste as plain text (Ctrl/Cmd+Shift+V) to drop most invisible formatting, or use a script to flag what remains.
- **In code editors** like VS Code, enable "Render Control Characters" and unicode-highlight settings so bidi and zero-width characters become visible inline.

Those built-in tools are partial - they each catch some characters and miss others. For a complete pass, paste your text into a dedicated [invisible character remover](/tools/invisible-watermark-character-inspector). A purpose-built inspector highlights every hidden code point, tells you its name and Unicode value, and lets you strip them in one click - without touching the visible text.

## Is an invisible character safe to remove?

Usually, yes. Stray zero-width spaces, BOMs, and no-break spaces picked up from copy-pasting are noise; removing them only makes your text cleaner and more portable. The two cases to think twice about are **emoji** (where a zero-width joiner is doing real work) and **genuinely multilingual text** (where a bidi marker may be intentional). That's the argument for a tool that *shows* you each character before removing it, rather than a blind strip that could break a legitimate emoji or a right-to-left passage.

The safest workflow is: inspect first, understand what's there, then remove deliberately. Privacy matters here too - your text may be a draft, a password, or proprietary code, so it should never leave your machine. Everything on Em Dash Remover runs 100% in your browser with no uploads and no signup.

## Clean your text in one pass

Invisible characters are easy to ignore right up until they break a formula, a login, a build, or a paste. The fix is quick: scan the text, see exactly which hidden Unicode is in there, and remove what doesn't belong. Drop your text into the [Invisible Character Inspector](/tools/invisible-watermark-character-inspector) to find and remove zero-width spaces, joiners, byte order marks, no-break spaces, and bidi characters in seconds - privately, for free, with nothing to install.

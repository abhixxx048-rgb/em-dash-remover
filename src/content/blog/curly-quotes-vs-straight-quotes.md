---
title: "Curly Quotes vs Straight Quotes: When to Use Each (and How to Convert)"
description: "What's the difference between straight and curly quotes, when to use smart quotes, the right Unicode and HTML entities, and how to convert text fast."
pubDate: 2026-06-15
keywords: ["curly quotes vs straight quotes", "what are smart quotes", "convert straight quotes to curly quotes", "curly apostrophe", "html entity for curly quotes", "smart quotes for ebook publishing"]
---

Open any published book and look closely at the punctuation. The quotation marks lean. The apostrophes curl. That's not an accident - it's typography. Straight quotes are a relic of the typewriter, and on screen and in print, curly quotes almost always look more polished. Here's how to tell them apart, when each is correct, and how to convert from one to the other without breaking anything.

## What is the difference between straight and curly quotes?

Straight quotes are the vertical marks you get by default from most keyboards: the straight double quote (`"`) and the straight single quote / apostrophe (`'`). They point neither left nor right. The typewriter used a single symmetrical key for each to save space, and that compromise survived into ASCII and onto your keyboard.

Curly quotes - also called *smart quotes* or *typographic quotes* - are direction-aware. A curly double quote opens with a "6"-shaped mark and closes with a "9"-shaped mark. The apostrophe and closing single quote share the same right-leaning shape. They're the marks typesetters used for centuries before the typewriter flattened everything.

The practical difference: straight quotes are interchangeable and code-safe; curly quotes are correct, readable typography. For prose meant to be read - articles, books, newsletters - curly quotes are the professional default.

## What are smart quotes?

"Smart quotes" is just the software term for curly quotes that get inserted automatically. When you type a straight `"` in Word or Google Docs, an autocorrect feature watches the surrounding characters and decides whether you meant an opening or closing mark, then swaps in the curly version. It's "smart" because it picks the direction for you based on context (a space before usually means opening; a letter before means closing).

The same feature is why text pasted out of a word processor often carries curly marks into places that don't want them - plain-text fields, code editors, CSV files.

## Are curly quotes better than straight quotes?

For readable prose, yes - and it's not just aesthetics. Curly quotes give the reader a visual cue about which end of a quotation they're looking at, which subtly aids scanning. Major style guides (Chicago, AP for print) and every professional book designer use them. Straight quotes in a finished article read as a small but real sign of an unpolished draft.

But "better" depends entirely on context. Curly quotes are *wrong* in:

- **Code.** A curly quote inside a string or attribute is a different character than the straight quote your compiler expects, so it throws syntax errors. (More on that below.)
- **Measurements.** Feet and inches use the *prime* (`′`) and *double prime* (`″`), not curly quotes - though straight quotes are the common stand-in.
- **Plain-text systems.** Some legacy fields, URLs, and data formats only handle ASCII cleanly.

So the honest answer: curly for reading, straight for machines.

## When should I use curly quotes?

Use curly quotes whenever the text is meant to be *read by a person* in a finished form:

- Blog posts, articles, and essays
- Books and ebooks (this is non-negotiable for professional publishing)
- Marketing copy, newsletters, and slide decks
- Social posts where you want the polish

Stick with straight quotes for code, config files, spreadsheets, command-line input, and any field where a curly character might be misinterpreted. When in doubt about a finished piece of writing, curly is the safer choice for credibility - the same way clean punctuation and varied rhythm signal careful writing, a theme we cover in our guide to the [signs of AI writing](/blog/signs-of-ai-writing).

## What Unicode characters are curly quotes?

Each curly mark is a distinct Unicode code point. This is worth knowing because it's *why* curly quotes behave differently from straight ones - they are literally different characters, not styled versions of the same one.

| Mark | Character | Unicode | HTML entity |
|------|-----------|---------|-------------|
| Opening single / left | ' | U+2018 | `&lsquo;` |
| Closing single / right / apostrophe | ' | U+2019 | `&rsquo;` |
| Opening double / left | " | U+201C | `&ldquo;` |
| Closing double / right | " | U+201D | `&rdquo;` |

By contrast, the straight double quote is U+0022 and the straight apostrophe is U+0027 - plain ASCII.

## What is the HTML entity for curly quotes?

You don't strictly *need* HTML entities - if your page is saved as UTF-8 (which it should be), you can paste the curly characters directly. But entities are useful when you want your source to stay pure ASCII or you're worried about encoding getting mangled in transit. Use `&ldquo;` and `&rdquo;` for double quotes, `&lsquo;` and `&rsquo;` for single quotes and the apostrophe. The closing single `&rsquo;` is also the correct apostrophe in words like "don't" and "it's."

## Why are my quotes straight and not curly?

A few common reasons:

1. **Autocorrect is off.** In Word and Google Docs, smart quotes are a toggle that can be disabled. Re-enable it under autocorrect/preferences and re-type the mark.
2. **You pasted from a plain-text source.** Code editors, Notepad, and most chat boxes don't apply smart-quote substitution, so anything typed there stays straight.
3. **The text came from a programming or terminal context.** These deliberately keep straight quotes.

If you've already got a finished block of straight-quote text and don't want to re-type it, you don't need to fight autocorrect at all - run it through our [straight-to-curly quotes converter](/tools/straight-to-curly-quotes-converter), which applies the opening/closing logic in one pass.

## How do I type a curly apostrophe?

By hand, the curly apostrophe (U+2019, `'`) can be entered with OS shortcuts:

- **Mac:** Option + Shift + `]`
- **Windows:** Alt + `0146` (on the numeric keypad)
- **HTML:** `&rsquo;`

That's fine for one apostrophe. For a whole document, typing shortcuts is impractical - which is exactly what conversion tools are for.

## How do I convert straight quotes to curly quotes?

You have three realistic options:

- **Let the word processor do it as you type.** Good for new writing, useless for text you've already pasted.
- **Find-and-replace.** Tempting, but it can't tell an opening quote from a closing one, so it'll get the direction wrong. Don't do this for apostrophes - you'll end up with opening marks mid-word.
- **Use a context-aware converter.** This is the reliable route. A good [convert straight quotes to curly quotes](/tools/straight-to-curly-quotes-converter) tool looks at the characters around each quote to decide opening vs. closing, and handles apostrophes inside contractions correctly.

Our converter runs **100% in your browser** - your text never leaves your device, there's no sign-up, and nothing is stored. It also fixes proper dashes and apostrophes in the same pass, so you get publishing-quality typography, not just swapped quote marks.

## Do I need curly quotes for an ebook?

Yes. Ebook retailers and reviewers treat straight quotes as a hallmark of an unedited manuscript - some readers call them "fly-specks on the page." Every professional ebook uses curly quotes throughout, along with proper em dashes and a real apostrophe in contractions. If you're publishing, converting your manuscript to smart quotes is a baseline step, not a nicety.

## Why do curly quotes break my code?

Because the compiler is looking for the *exact* ASCII character U+0022 or U+0027, and a curly quote is a completely different code point. When you copy a snippet out of a document where smart quotes were applied, the quotes look almost identical but parse as foreign characters - producing "unexpected token" or "unterminated string" errors. This is the single most common reason a pasted code sample won't run.

The fix is the reverse conversion: replace smart quotes with straight ones before pasting into an editor. Curly quotes belong in prose, never in source code.

## Convert your quotes the right way

Curly quotes make finished writing look professional; straight quotes keep code and data working. The trick is converting cleanly in the right direction without mangling apostrophes or mixing up openers and closers. Our free, private, in-browser [straight-to-curly quotes converter](/tools/straight-to-curly-quotes-converter) handles the direction logic for you - and bundles proper dashes and apostrophes so your text is genuinely publishing-ready. Paste, convert, copy. No account, no upload, nothing leaves your browser. While you're polishing, the [main cleanup tool](/) on our home page can strip invisible characters and other paste artifacts in the same sitting.

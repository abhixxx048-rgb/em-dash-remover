---
title: "Why Pasting From Word Adds Weird Formatting (and How to Fix It)"
description: "Pasted text looks bloated, off-font, or oddly spaced? Here's why Word and Google Docs add hidden formatting on paste - and how to strip it cleanly."
pubDate: 2026-06-15
keywords: ["why does pasting from word add weird formatting", "remove formatting when pasting from word", "paste from word without formatting", "clean word formatting", "remove mso styles from word html", "paste plain text but keep paragraphs"]
---

You copy a clean-looking paragraph out of Word, paste it into your website, your email, or your CMS, and suddenly it's the wrong font, the spacing is doubled, and the line breaks are in strange places. You didn't ask for any of that. So where does it come from?

The short answer: when you copy from a rich-text editor, you don't copy *text* - you copy a hidden bundle of styling instructions that travel along with it. This post explains exactly what's going on and how to get clean text back without retyping anything.

## Why does pasting from Word add weird formatting?

When you select text in Microsoft Word and copy it, Word doesn't put plain characters on your clipboard. It puts an HTML version of your selection, wrapped in Word-specific markup. That markup includes proprietary `mso-` style declarations (short for *Microsoft Office*), inline `<span>` tags carrying fonts and colours, `class` attributes pointing at Word's internal stylesheet, and conditional comments meant only for other Office apps.

Most websites and editors try to honour that markup. So when you paste, they faithfully reproduce Word's font (often Calibri or Times New Roman), Word's exact point size, Word's paragraph spacing, and Word's hidden styles - none of which match the place you pasted into. The text *looks* fine in Word because Word understands its own instructions. Everywhere else, those instructions clash with the destination's design.

Google Docs does the same thing in its own dialect: it wraps everything in nested `<span>` tags with inline `style` attributes for every run of text. That's why text pasted from Google Docs often arrives as a different font with bloated, near-unreadable underlying HTML.

## Why does Word add extra spacing when I paste?

The doubled or uneven spacing usually comes from two sources. First, Word stores paragraph spacing (the gap *after* each paragraph) as a style, and that style rides along on paste - so you get Word's spacing stacked on top of your destination's own paragraph spacing. Second, text copied from PDFs, emails, or older documents often contains a hard line break at the end of every visual line rather than at the end of each paragraph. The destination treats each of those as a real break, so a single paragraph explodes into a dozen short lines.

The fix is to remove the styling and the stray breaks while keeping genuine paragraph boundaries. That distinction - drop the styling, keep the paragraphs - is the whole game.

## How do I paste plain text but keep paragraphs?

This is the most common request, and the built-in "paste as plain text" options handle it inconsistently. A few reliable approaches:

- **Paste Special / Keep Text Only.** In Word, Outlook, and many editors, `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) pastes unformatted text. In Microsoft apps you can also use the *Keep Text Only* paste option from the right-click menu.
- **The Notepad round-trip.** Paste into a plain-text editor like Notepad or TextEdit, then copy again. This strips all formatting - but it often *also* flattens your paragraph breaks into a single block, which is exactly what you didn't want.
- **A dedicated cleaner.** A purpose-built [paste-from-Word cleaner](/tools/paste-from-word-docs-cleaner) removes the `mso-` junk, inline styles, and span bloat while deliberately preserving paragraph breaks - so you keep your structure and lose the mess.

If keeping paragraphs (and optionally headings and lists) matters, the third option is the only one that does it predictably.

## How to remove mso styles from Word HTML

If you're working with the HTML directly - say you pasted into a CMS that shows source view - the tell-tale signs of Word soup are everywhere: `<o:p>` tags, `mso-` prefixed style rules, `<span lang=...>` wrappers, `class="MsoNormal"`, and conditional comments like `<!--[if gte mso 9]>`. Cleaning this by hand is miserable.

The mechanical job is: strip every `mso-` declaration, remove Word's proprietary `<o:>` namespace tags, unwrap pointless `<span>` tags that only carry fonts and colours, drop `class` attributes that reference Word's stylesheet, and delete the conditional comments. What you keep is the semantic structure - paragraphs, headings, lists, and your bold and italics. Our [paste-from-Word cleaner](/tools/paste-from-word-docs-cleaner) does all of this in one pass so you get lean, valid HTML instead of kilobytes of Office markup.

## How do I clean up text copied from Google Docs?

Google Docs bloat is mostly inline `style` attributes on nested spans. The clean-up is the same idea as Word: remove the inline styling, collapse the redundant spans, and keep the paragraph and list structure. If you're pasting into WordPress, Webflow, Notion, or Squarespace, this matters even more - those platforms have their own typography, and you want your pasted content to inherit *their* fonts and spacing, not fight against Google's.

A good rule of thumb: paste content so it adopts the destination's design. The text should carry meaning (headings, lists, emphasis) but not appearance (specific fonts, colours, point sizes).

## Why is my pasted text a different font?

Because the font came along in the markup. Word and Google Docs both attach an explicit font-family to your text - Calibri, Arial, whatever your document used. When the destination respects that inline font, your new paragraph stubbornly stays in the old document's typeface while everything around it uses the site's font. Strip the inline font declarations and the text immediately falls back to the destination's own styling, which is almost always what you want.

## Is it safe to use an online text cleaner?

It depends entirely on *where the cleaning happens*. Many "Word to HTML" converters upload your text to a server to process it. For anything sensitive - client work, unpublished drafts, internal documents - that's a real consideration.

The privacy-respecting approach is a tool that runs **entirely in your browser**. Nothing is uploaded; the cleaning happens locally on your own machine, and the text never leaves your computer. That's how our tools are built - 100% client-side, no signup, no server round-trip. You can read more about the broader cleanup workflow in our guide to [the signs of AI writing](/blog/signs-of-ai-writing), which covers the related mess of curly quotes, ellipses, and invisible characters that often hitch a ride with pasted text.

## The quick fix

To recap the practical workflow:

1. Copy your text from Word, Google Docs, a PDF, or an email as usual.
2. Run it through a cleaner that strips `mso-` styles, inline fonts, and span bloat but keeps your paragraphs, headings, and lists.
3. Paste the clean result into your destination, where it inherits the right typography automatically.

You skip the Notepad round-trip, you don't lose your structure, and you don't ship a wall of invisible Office markup into your CMS.

Ready to stop fighting messy pastes? Drop your text into the free, in-browser [paste-from-Word cleaner](/tools/paste-from-word-docs-cleaner) - it removes Word and Google Docs formatting in one click, keeps your paragraphs intact, and never uploads a thing. Or explore the full [text-cleanup tool suite](/) for em dashes, smart quotes, and hidden characters too.

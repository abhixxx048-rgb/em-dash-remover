---
title: "How to Fix Text Copied From a PDF (Remove Line Breaks, Keep Paragraphs)"
description: "PDF copy-paste breaks every line and splits hyphenated words. Here's how to remove the line breaks, keep your paragraphs, and reflow the text cleanly."
pubDate: 2026-06-15
keywords: ["fix text copied from pdf", "remove line breaks but keep paragraphs", "remove line breaks from pdf copy", "unwrap text into paragraphs", "remove hyphenation from pdf copied text", "reflow pdf text"]
---

You copy a paragraph from a PDF, paste it into an email or a document, and it arrives looking like a ransom note: a hard line break at the end of every line, words split with hyphens, and odd gaps where the columns used to be. It's one of the most common copy-paste annoyances there is, and it has a clean fix. Here's why it happens and how to turn that mess back into readable paragraphs.

## Why does copied PDF text have line breaks every line?

A PDF doesn't store flowing paragraphs the way a web page or a Word file does. It stores text as positioned lines on a page - each visual line is its own object placed at fixed coordinates. There's no underlying "this paragraph runs until here" structure for most PDFs; the layout *is* the document.

When you select and copy, your viewer reads those lines in order and inserts a line break wherever one visually ended. So a paragraph that wrapped across eight lines on the page becomes eight separate lines of text, each ending in a hard return (a newline character). The original "soft" wrapping that your screen would normally do on its own is gone, replaced by baked-in **hard line breaks**.

This is also why pasted PDF text often won't reflow when you resize a window or change the font: the breaks are real characters now, not flexible wrapping.

## How do I copy text from a PDF without line breaks?

You usually can't, at the source. The breaks come from how the PDF stores text, so the practical approach is to copy as normal and then clean the result. You have three options:

- **Find & Replace in your editor.** Works, but fiddly - you have to match newline characters (often `\n` or `^p`) and you risk merging paragraphs you wanted to keep separate.
- **Paste into a tool that reflows the text.** The fastest route, and the one that handles the tricky "keep paragraphs" case for you.
- **Re-export the PDF** to Word or rich text if you have the source and edit access. Overkill for a quick paste.

For most people the second option wins. Paste the broken text into the [Whitespace & Reflow Fixer](/tools/whitespace-line-break-reflow-fixer), and it joins the wrapped lines back into paragraphs in one step - no Find & Replace gymnastics.

## How to remove line breaks but keep paragraphs

This is the part generic tools get wrong. A naive "remove all line breaks" tool strips *every* newline, which fuses your separate paragraphs into one giant wall of text. That's worse than the original.

The trick is to tell the difference between two kinds of break:

- A **single** line break inside a paragraph - the kind PDF copying adds at the end of each wrapped line. These should be removed and replaced with a space.
- A **double** line break (a blank line) between paragraphs. This signals a real paragraph boundary and should be preserved.

So the rule is: collapse single line breaks into spaces, but keep the blank-line gaps that separate paragraphs. A good reflow tool does exactly this automatically, which is why "[remove line breaks but keep paragraphs](/tools/whitespace-line-break-reflow-fixer)" is the differentiator worth looking for. Strip-everything tools fail here; paragraph-aware reflow is what you actually want.

If you're doing it by hand in **Word**, search for two paragraph marks (`^p^p`) and replace them with a placeholder, then replace single `^p` with a space, then restore your placeholder back to `^p^p`. In **Google Docs**, use Find & Replace with the regular-expressions option and match `\n` the same way. Both work; both are slower than pasting once.

## How to remove hyphenation when copying from PDF

PDFs that are typeset with justified text often break long words across lines with a hyphen - "inter-" at the end of one line and "national" at the start of the next. When you copy, you get `inter-` plus a line break plus `national`, and naively joining the lines leaves you with "inter- national" or "inter-national" in the middle of a sentence.

**Fix:** the reflow step should detect a hyphen immediately before a line break and join the two halves *without* a space, removing the stray hyphen - so `inter-\nnational` becomes `international`. Be a little careful with genuinely hyphenated compounds like "well-being" if they happen to fall at a line end; reading back through the result catches the rare false join. The [Whitespace & Reflow Fixer](/tools/whitespace-line-break-reflow-fixer) handles end-of-line hyphenation as part of the reflow so you don't have to hunt for split words yourself.

## How to remove extra spaces and blank lines too

PDF and copy-paste text usually drags along more than just line breaks:

- **Extra spaces between words**, left over from justified spacing or tab stops. Collapse runs of multiple spaces into a single space.
- **Tabs** used to fake columns. Convert them to a space or strip them.
- **Leading and trailing whitespace** on each line. Trim it.
- **Empty lines** scattered through the text. Remove the extra blank lines while keeping one blank line between real paragraphs.

Doing all of this in the same pass is the point of whitespace normalisation - you reflow the lines *and* tidy the spacing together, rather than fixing one problem and creating another.

## Does this work for forwarded emails and ChatGPT output too?

Yes. The same hard-wrapping problem shows up in plenty of places:

- **Forwarded or plain-text emails** often wrap at a fixed width (commonly 72 or 76 characters) and sometimes add `>` quote markers. Unwrapping rejoins the lines into clean paragraphs.
- **Pasted website text** can carry odd line breaks, non-breaking spaces, and invisible characters.
- **AI output** sometimes arrives with awkward line breaks when pasted into narrow fields.

If your text also has the *other* tells of AI-assisted writing - stray Markdown, smart quotes, a flood of em dashes - it's worth a read through [the common signs of AI writing](/blog/signs-of-ai-writing) and a pass through the [main cleaner](/) as well. Reflow fixes the layout; the cleaner fixes the punctuation and invisible characters.

## Is it safe to paste text into an online text cleaner?

It depends entirely on the tool. Many "remove line breaks" sites process your text on their server, which means your content is uploaded to someone else's machine. For anything sensitive - contracts, drafts, internal docs - that's a real consideration.

Our tools run **100% in your browser**. The text you paste never leaves your device; there's no upload, no account, and no server round-trip. You can confirm it yourself by going offline after the page loads - the reflow still works, because all the processing happens locally. That privacy-by-design approach is the whole point of the suite, and it's free with no sign-up.

## Fix your PDF paste in one step

Stop fighting Find & Replace. Paste your broken text into the [Whitespace & Reflow Fixer](/tools/whitespace-line-break-reflow-fixer) - it removes the hard line breaks, keeps your paragraphs intact, mends hyphenated words split across lines, and collapses the extra spaces, all in your browser and all for free. Copy the clean result straight back into your document and get on with the writing.

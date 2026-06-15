---
title: "Clean AI Paste in Obsidian: Fix ChatGPT Formatting in Your Notes"
description: "Pasting ChatGPT, Claude, or Gemini text into Obsidian breaks the formatting. Here's how to clean em dashes, emojis, and stray blank lines fast."
pubDate: 2026-06-15
keywords: ["obsidian clean ai paste plugin", "how to remove em dashes in obsidian", "obsidian remove ai formatting artifacts", "clean ai paste obsidian plugin", "how to remove extra blank lines in obsidian", "fix chatgpt markdown formatting obsidian"]
---

Obsidian is a magnet for AI-assisted notes. You ask ChatGPT for an outline, get a clean answer in the chat window, paste it into your vault - and it arrives looking wrong. Doubled blank lines, em dashes everywhere, curly quotes that break code blocks, the odd emoji bullet. This post walks through why that happens and the fastest ways to clean it, including a [clean-AI-paste plugin for Obsidian](/tools/obsidian-plugin) that does the whole pass in one keystroke.

## Why does ChatGPT formatting break when pasted into Obsidian?

The text you see in a chat window is rendered HTML, not the raw Markdown Obsidian wants. When you copy it, your clipboard often carries rich-text styling - and when Obsidian converts that back to Markdown, the round-trip is lossy. Headings can lose their `#` markers, list spacing inflates, and "smart" typography (curly quotes, ellipsis characters, em dashes) comes along for the ride.

Three things go wrong most often:

- **Spacing inflates.** A single paragraph break in the chat becomes two or three blank lines in your note, so everything looks double-spaced.
- **Smart characters sneak in.** Straight quotes become curly ("), three dots become a single ellipsis glyph (…), and hyphens become em dashes (-). These look fine in prose but break code fences, YAML frontmatter, and link syntax.
- **Invisible characters hitch a ride.** AI output and copied web text can carry zero-width spaces and narrow non-breaking spaces (U+202F) you can't see but that still pollute search and find-and-replace.

None of this is Obsidian's fault - it's the clipboard handoff. The fix is to normalise the text on the way in.

## How do I clean up ChatGPT text pasted into Obsidian?

You have three realistic options, from most manual to most automatic.

**1. Paste as plain text.** Use `Ctrl/Cmd + Shift + V` to paste without formatting. This strips the rich-text wrapper, which kills most of the doubled spacing. It does **not** remove em dashes, curly quotes, or emojis - those are part of the text itself, not the formatting - so it's a partial fix.

**2. Clean it in a browser tool first.** Drop the text into a privacy-first cleaner like the [em dash and AI-text cleaner on our homepage](/), let it rebalance the punctuation and strip the invisible characters, then paste the result. Everything runs in your browser, so the note never leaves your machine.

**3. Clean it inside Obsidian on paste.** Install a [clean-AI-paste plugin for Obsidian](/tools/obsidian-plugin) and the cleanup runs automatically the moment you paste. No second app, no copy-clean-recopy dance.

## How do I remove em dashes in Obsidian?

The em dash (-) is the single most common AI tell, and find-and-replace alone is a blunt instrument: swapping every `-` for a hyphen produces ugly `word - word` gaps where a comma or period would read better. (If you want the full background, see our piece on the [signs of AI writing](/blog/signs-of-ai-writing).)

A grammar-aware pass is smarter. It looks at what sits on each side of the dash and picks the right replacement - a comma here, a period there, a colon before a list - instead of forcing one substitution everywhere. The Obsidian plugin does exactly this on paste, and the same engine is available in the browser if you'd rather clean text before it ever reaches your vault.

If you only want the manual route: open search with `Ctrl/Cmd + F`, paste an em dash into the field (copy one from any AI output), and step through the matches deciding case by case. It works, but it's slow over a long note.

## How do I remove extra blank lines in Obsidian?

Doubled blank lines are the most visible paste problem. To fix them by hand, open the in-note search-and-replace and target runs of two-or-more blank lines, collapsing them to a single one. Obsidian's core search supports this, and several community plugins offer a "remove newlines" or "reflow" command.

The catch is that you usually want to keep *one* blank line between paragraphs while removing the extras - a naive "delete all blank lines" wrecks readability by gluing paragraphs together. A good clean-paste tool preserves paragraph breaks and only collapses the surplus, so your notes stay scannable.

## How do I strip emojis from notes in Obsidian?

ChatGPT and Copilot love decorative bullets and emoji section markers. Obsidian's built-in find-and-replace struggles here because a single emoji can span several Unicode code points, so a plain search misses half of them.

The reliable approach is a tool that targets the emoji and pictograph Unicode ranges directly while **keeping meaningful symbols** - currency ($, £, €), math (+, =, %), and copyright marks. You want the section emoji gone, not your prices mangled. The Obsidian plugin and the browser cleaner both make that distinction, so a list like "- Step one" loses its decorative dash-bullet but your `$49` survives intact.

## Is there an Obsidian plugin to clean AI paste, and is it free?

Yes. A [clean-AI-paste plugin for Obsidian](/tools/obsidian-plugin) intercepts the paste event and runs the cleanup before the text lands - rebalancing em dashes, straightening curly quotes, collapsing extra blank lines, stripping invisible characters, and removing decorative emojis in one pass. It's free, with no signup.

It also runs **fully offline**. Once installed, nothing in your vault is sent anywhere - the cleaning happens locally inside Obsidian, which matters when your notes are personal, client work, or research you can't leak. That privacy-first stance is the whole point of the suite: better writing without handing your text to a server.

It works the same whether the source is ChatGPT, Claude, or Gemini, because all three produce the same family of artifacts - em dashes, smart quotes, and inflated spacing. Clean the output, not the model.

## How do I install a community plugin in Obsidian?

If you're new to plugins, the path is short:

1. Open **Settings → Community plugins** and turn off Restricted ("Safe") mode if it's on.
2. Click **Browse**, search for the clean-AI-paste plugin, and choose **Install**.
3. Click **Enable**, then check the plugin's settings to pick which fixes run automatically on paste.

From then on, every AI paste is cleaned the moment it lands - no extra steps, no copy-clean-recopy loop.

## The honest goal: cleaner notes, not disguised text

Cleaning AI paste isn't about hiding that you used AI. It's about making your vault readable and consistent: punctuation that matches your style, no invisible junk breaking search, no double-spacing to scroll past. You drafted with a tool; you're editing the draft into shape, exactly as you would any first pass.

Ready to stop fixing the same paste problems by hand? Install the [clean-AI-paste plugin for Obsidian](/tools/obsidian-plugin) and let every ChatGPT, Claude, or Gemini paste arrive clean - em dashes rebalanced, emojis stripped, spacing fixed, and nothing ever leaving your machine.

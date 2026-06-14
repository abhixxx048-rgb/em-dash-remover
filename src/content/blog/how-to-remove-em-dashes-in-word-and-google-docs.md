---
title: "How to Remove Em Dashes in Word and Google Docs"
description: "Step-by-step methods to find and replace em dashes in Microsoft Word and Google Docs — plus why a grammar-aware tool does it better."
pubDate: 2026-05-30
keywords: ["remove em dashes in word", "remove em dashes google docs", "find replace em dash"]
---

Whether you're cleaning up an AI draft or just prefer simpler punctuation, here's exactly how to remove or replace em dashes in Microsoft Word and Google Docs — and an honest look at the limits of Find & Replace.

## Microsoft Word

### Method 1: Find & Replace with the special code

1. Press `Ctrl + H` (Windows) or `Control + H` (Mac) to open Find and Replace.
2. In **Find what**, type `^+` — this is Word's code for an em dash. (For an en dash, use `^=`.)
3. In **Replace with**, type your replacement. For a comma followed by a space, type `, `. To delete the dash entirely, leave it blank. To turn it into a hyphen, type `-`.
4. Click **Replace All**.

### Method 2: Paste the character

If the code doesn't work in your version, copy an em dash (—) from anywhere, paste it into the **Find what** box, type your replacement, and Replace All.

### Turn off auto-creation

Word recreates em dashes as you type. To stop that: File → Options → Proofing → AutoCorrect Options → uncheck "Hyphens (--) with dash".

## Google Docs

1. Open **Edit → Find and replace** (or `Ctrl/Cmd + H`).
2. In **Find**, paste an em dash character (—). Google Docs Find & Replace doesn't support Word's `^+` code, so you need the actual character.
3. Enter your replacement in **Replace with** (for example `, ` for a comma and space, or leave blank to delete).
4. Click **Replace all**.

To stop Docs from auto-converting `--` into an em dash: Tools → Preferences → uncheck "Automatic substitution".

## The problem with Find & Replace

Both methods share the same flaw: they do a **blind, identical replacement**. Every em dash becomes the same thing — usually a comma. But an em dash does different jobs in different sentences:

- "The plan was simple — we would win." → replacing with a comma gives "The plan was simple, we would win," which is a **comma splice** (two complete sentences joined by a comma). It should be a semicolon or a period.
- "My sister — a doctor — arrived." → here commas are correct, and you need *both* dashes replaced as a pair.
- "We met in May—September." → this is really a date range that should be an en dash, not a comma at all.

A single Replace All can't tell these apart, so it quietly introduces grammar errors. If you're cleaning a long document, you'll create dozens of them without noticing.

## The faster, correct way

Instead of replacing every dash identically, paste your text into our [grammar-aware em dash remover](/). It reads the words on both sides of each dash and chooses the right fix:

- two independent clauses → semicolon or period (no comma splice),
- a parenthetical aside → a matched pair of commas or parentheses,
- an explanation → a colon,
- a date or number range → an en dash,
- everything else → a clean comma.

Then you copy the result back into Word or Google Docs. You can even use **Diff** view to see precisely what changed before you trust it. It's faster than running multiple Find & Replace passes, and it doesn't leave your document full of splices.

## Quick comparison

| | Word/Docs Find & Replace | Grammar-aware cleaner |
| --- | --- | --- |
| Speed | Fast | Fast |
| Handles ranges (en dash) | No | Yes |
| Avoids comma splices | No | Yes |
| Replaces pairs correctly | No | Yes |
| Shows what changed | No | Yes (Diff view) |
| Cost | Free | Free |

Find & Replace is fine for a quick, one-off swap. For cleaning AI text or a whole manuscript, let a tool handle the grammar so you don't have to re-read every sentence.

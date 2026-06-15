# Before/After Diff Viewer

> See exactly what the cleaner changed — every em dash, quote, and invisible character highlighted inline or side-by-side, with per-change accept/reject so you stay in control of your own voice. Tier: 1. Difficulty: Med. Runs: 100% client-side.

## 1. What it does

The Before/After Diff Viewer takes the user's original pasted text and the cleaned output and renders a precise, color-coded comparison of every change the tool made. Users can toggle between an **inline** view (changes flow within one column, deletions struck/red, insertions green) and a **side-by-side** view (original left, cleaned right, aligned line-by-line). Critically, each individual change is a reviewable unit: a user can **accept** a change (keep the cleaned version) or **reject** it (restore the original) one at a time, then copy or download the final merged result. It turns the cleaner from a black box into a transparent, auditable edit — reinforcing the brand promise of "clean for quality, keep your human voice."

## 2. Why users want it (demand & search)

Bulk find-and-replace tools are scary: writers fear a tool silently mangling their prose. A diff viewer removes that fear by showing every change before it is committed. This is the single highest-trust feature a text-cleaning suite can ship.

**Target search keywords** (realistic, with rough read):
- `text diff checker` / `text compare` — very high volume, high competition (Diffchecker, TextCompare dominate). We do not win head-on; we win as a *contextual feature* of the cleaner.
- `compare before and after text` — moderate volume, low competition, high intent.
- `see what changed in my text` / `highlight differences between two texts` — long-tail, low competition, good intent match.
- `diff checker online free no upload` / `private text compare` — low-moderate volume, our privacy angle is a direct wedge.
- `word diff vs character diff` — informational, supports an FAQ/blog cross-link.
- `accept reject changes online text` — niche, low competition, very high intent (people who want Word's "track changes" without Word).

**Who searches & the moment they need it:** editors and writers who just ran a cleanup and want to verify it before pasting into a CMS/doc; students checking that an "AI-tell removal" did not change their meaning; developers/PMs comparing two config or copy strings; ESL writers who want to *learn* from the corrections rather than blindly accept them. The need spikes immediately after a cleaning action — so the diff should be one click (or zero clicks) away from the main paste box.

**Source domains found in research:** diffchecker.com, textcompare.org, textcompareonline.org, text-compare.com, contentharmony.com (text diff tool), github.com/google/diff-match-patch, github.com/kpdecker/jsdiff, github.com/rtfpessoa/diff2html, blog.jcoglan.com (patience diff), inventivehq.com (diff algorithm guide).

## 3. Target users & use cases

- **Editors / proofreaders** — verify a batch cleanup did not alter sentences or strip intentional formatting before approving copy.
- **Students & academics** — confirm an "AI-tell" pass kept their argument intact; learn which habits read as AI by seeing the swaps.
- **Content marketers / SEO writers** — sanity-check cleaned blog drafts against the original brand voice before publishing to a CMS.
- **ESL / non-native writers** — use the per-change explanations as a micro-lesson ("curly quote → straight quote," "em dash → comma") rather than a silent rewrite.
- **Developers / PMs** — quick private compare of two strings (release notes, microcopy variants, prompt versions) without sending data to a third-party server.
- **Privacy-sensitive professionals (legal, medical, finance)** — need a diff tool that provably never uploads text; this audience explicitly searches "no upload" / "offline."

## 4. Features — core (MVP)

1. **Two input sources.** Default: auto-load `original` and `cleaned` from the main cleaner's `CleanResult`. Also accept two manual paste boxes ("Original" / "Changed") so it works as a standalone compare tool.
2. **Inline diff view.** Single merged column: deletions in red with strikethrough, insertions in green, unchanged text neutral. This is the default (lowest cognitive load on mobile).
3. **Side-by-side diff view.** Two aligned columns with gutter line numbers; removed-only lines highlighted left, added-only highlighted right, intra-line changes sub-highlighted.
4. **Word-level diffing by default, character-level toggle.** Word-level reads far better for prose; character-level is offered for fine punctuation inspection (e.g., a lone em dash → comma).
5. **Per-change accept / reject.** Each diff segment has Accept (keep cleaned) / Reject (keep original) controls. Rejecting restores the original substring into the working result.
6. **Accept all / Reject all.** One-click bulk actions, plus "accept all of this type" (e.g., accept every quote change but review dashes).
7. **Change counter & summary.** "+N insertions, −M deletions, K changes" header, mirroring the cleaner's existing `counts` object.
8. **Copy final result.** Copies the post-accept/reject merged text to clipboard.
9. **Download.** Save final text as `.txt`; optionally export the diff itself as standalone HTML or Markdown (`~~old~~` / `**new**`).
10. **Empty / unchanged states.** Clear messaging when both texts are identical ("No changes — your text was already clean").

## 5. Features — engagement & helpfulness (what makes users love it & stay)

This is the heart of the tool. The diff is not just a display; it is the moment the user *trusts* the product. Each touch below is designed to make that moment fast, clear, reassuring, and educational.

1. **Live re-diff as you edit.** The original/changed boxes are editable; the diff recomputes (debounced ~150ms) on every keystroke, like Diffchecker. Instant feedback removes the "did it work?" anxiety and invites experimentation.
2. **Per-change "why" tooltips (education hook).** Hovering a change shows the *reason*: "Em dash → comma (smoother sentence flow)," "Curly quote → straight," "Removed zero-width space (invisible AI artifact)." This turns a mechanical diff into a mini writing lesson — the single biggest reason ESL writers and students stay. It also reinforces the "quality, not detector-bypass" positioning.
3. **Change-type filter chips.** Chips for Dashes / Quotes / Ellipses / Invisibles / Whitespace / Markdown let users isolate one category. "Show only dash changes" lets a user accept everything else and scrutinize just the dashes — respecting their voice.
4. **Per-change accept/reject with one click + keyboard nav.** `j`/`k` to move between changes, `a` to accept, `r` to reject, `u` to undo. Power users (editors) burn through a document in seconds; this is the stickiness that makes them return.
5. **Live "changes remaining" meter.** A small progress indicator ("12 of 30 changes reviewed") gamifies the review and gives a satisfying completion state. People finish what they start when progress is visible.
6. **Undo / redo stack.** Every accept/reject is reversible (`Ctrl/Cmd+Z`). Fearless reviewing — users explore freely knowing nothing is permanent.
7. **Inline ↔ side-by-side toggle with state memory.** Remembered in `localStorage` so the layout the user prefers is the one they get next visit. Mobile users get inline; desktop editors get side-by-side.
8. **Word ↔ character granularity toggle, live.** Switching re-renders without losing accept/reject decisions where possible. Lets a user zoom from "what sentences changed" down to "exactly which characters."
9. **"Try an example" demo button.** Loads a messy AI-flavored paragraph (em dashes, curly quotes, zero-width chars) pre-cleaned, so a first-time visitor sees a populated, colorful diff in one click — no blank-page paralysis.
10. **Copy buttons everywhere.** Copy final result, copy original, copy cleaned, copy just the changed lines. Each with a 1.5s "Copied!" confirmation. Friction-free exit is what makes a tool feel trustworthy and reusable.
11. **Scroll-sync in side-by-side.** The two columns scroll together and changed regions are reachable via "next change ▾ / prev change ▴" jump buttons, so long documents stay navigable.
12. **Minimap / change ruler.** A thin vertical ruler beside the scrollbar with colored ticks for each change location — instantly shows *where* and *how dense* the edits are, like a code editor.
13. **Dark mode + high-contrast diff palette.** Honors `prefers-color-scheme`. Diff colors chosen to remain distinguishable in both themes and for color-blind users (see §6) so the feedback never relies on color alone.
14. **Stat pills with personality.** "Saved you 14 invisible characters 👻," "8 em dashes tamed," "Reading flow: smoother." Light, non-gimmicky microcopy that makes a utilitarian task feel rewarding and shareable.
15. **Persist last session (opt-in, local only).** Remember the last diff in `localStorage` so a refresh does not lose work — with a visible "stored only on this device, never uploaded" note that doubles as a privacy trust signal.
16. **Empty-state guidance.** When boxes are blank: a one-line "Paste your original on the left, your cleaned text on the right — or hit *Try an example*." plus the inline/side-by-side and granularity controls already visible so the UI never looks broken.
17. **Keyboard-shortcut cheat-sheet (`?`).** A dismissible overlay listing nav/accept/reject keys — surfaces the power-user features that drive retention without cluttering the default UI.

## 6. UX / UI notes

**Layout.** Top: title + view controls (Inline | Side-by-side, Word | Character, change-type chips, change counter, Accept all / Reject all). Body: the diff surface. When launched from the main cleaner, original/cleaned are pre-filled and the panel slides in beneath the paste box ("Review changes"). Standalone route exposes two labeled paste boxes that collapse into the diff once both have content.

**Input/output model.** Inputs are two plain-text strings (editable). Output is a single merged string derived from the accept/reject decisions, exposed via Copy/Download. No intermediate server step.

**States:**
- *Empty:* friendly guidance + "Try an example" (see §5.16).
- *Identical:* green "No changes — already clean" state with a checkmark, not an error.
- *Processing:* for very large inputs only, a brief skeleton/spinner; under ~50KB the diff is effectively instant and no spinner shows (avoid flicker).
- *Result:* the interactive diff with all controls live.

**Microcopy tone.** Calm, plain, reassuring, lightly warm. Never "beat the detector" — always "keep your voice / see what changed." Verbs over jargon: "Keep original" / "Use cleaned" can be friendlier labels than "reject/accept" for non-technical users (offer both, or tooltip the technical term).

**Mobile.** Inline view is the default on narrow screens (side-by-side is a horizontal-scroll fallback, not primary). Accept/reject become full-width tap targets on the active change; change-type chips scroll horizontally; jump-to-next-change is a floating button. Minimum 44px touch targets.

**Accessibility (WCAG 2.2 AA).** No color-only signaling: insertions also carry a `+`/underline marker and `aria-label="inserted"`; deletions carry strikethrough + `−` + `aria-label="deleted"`. Diff regions use semantic `<ins>`/`<del>`. Full keyboard operability (nav, accept, reject, toggles). Live region announces "Change accepted, 11 remaining." Color palette meets 3:1 against background and is verified against deuteranopia/protanopia. Respects `prefers-reduced-motion` (no animated transitions on re-diff).

## 7. Technical implementation (client-side)

**Diff engine.** Two credible options:
- **jsdiff (`diff`)** — ergonomic API: `diffWords`, `diffWordsWithSpace`, `diffChars`, `diffLines`, `diffSentences`. Returns an array of `{ value, added, removed }` parts that map almost directly onto accept/reject segments. Supports `maxEditLength` (bail out early on huge, very-different inputs) and an async mode to avoid blocking. ~`diffWords`/`diffChars` use Myers O(ND). Small, tree-shakeable, MIT.
- **diff-match-patch (Google)** — character-mode by default and very fast; word-mode requires the documented `diff_linesToWords` trick (copy `diff_linesToChars`, split on runs of whitespace instead of `\n`, run `diff_main`, then `diff_charsToLines`), followed by `diff_cleanupSemantic()` for human-readable groupings. Has a built-in `Diff_Timeout` (default ~1s) to cap runtime on pathological inputs.

**Recommendation:** start with **jsdiff** for the cleaner-output diff because its `{added, removed, value}` part array is the natural unit for per-change accept/reject UI, and its word/char/sentence helpers cover all granularity toggles out of the box. Keep diff-match-patch's `cleanupSemantic` approach in mind if word-mode groupings look noisy. Render with a thin custom renderer (we control accept/reject state, so we cannot use diff2html's static HTML output directly) — **diff2html** remains a useful reference for the GitHub-style side-by-side CSS and line-pairing UX, and `react-diff-viewer-continued` is a reference for the side-by-side component model even though this stack is Astro/vanilla.

**Mapping to per-change accept/reject.** Convert the diff part array into a list of *segments*: unchanged, or a paired (removed, added) change with a `type` inferred by inspecting the substring (em dash, en dash, curly quote, ellipsis, invisible char, nbsp, markdown token). The cleaner already classifies these in `src/lib/cleaner.ts`; reuse that classification to label each change rather than re-detecting. Each change segment holds a `decision: 'accepted' | 'rejected'`. Final output = concatenation: unchanged → value; accepted → added value; rejected → removed value.

**Algorithm / detail notes.**
- Default **word-level** (`diffWordsWithSpace` preserves whitespace so reassembly is lossless); **character-level** toggle for punctuation precision.
- Run `cleanupSemantic`-style grouping so a single conceptual edit is one segment, not a scatter of single characters.
- Line numbers for side-by-side come from splitting on `\n` after the diff is computed and assigning rows.

**Edge cases & failure modes.**
- *Identical inputs:* short-circuit to the "no changes" state (skip diffing).
- *Huge / very different inputs:* use `maxEditLength` (jsdiff) or `Diff_Timeout` (dmp) to avoid a frozen tab; show "Texts are very different — showing line-level diff" fallback to a coarser `diffLines`.
- *Unicode:* the whole point is invisible/zero-width chars — render them as visible chips (e.g., `␣`, `[ZWSP]`) inside diff segments so a "removed nothing-looking thing" is actually visible. Handle astral/emoji safely by diffing on code points (use an array of `Array.from(str)`), not UTF-16 units, to avoid splitting surrogate pairs.
- *CRLF vs LF:* normalize line endings before line-level diff, but preserve the original choice in the final output if a user rejects whitespace changes.
- *Very long single line (minified/no newlines):* word/char diff still works; just ensure the container wraps and the minimap reflects positions.

**Performance.** Debounce live re-diff (~150ms). For inputs above ~100–200KB, run the diff in a **Web Worker** so typing/scroll stay smooth (jsdiff async mode or post the strings to a worker). Virtualize the rendered diff rows for very large documents (only mount visible rows) to keep the DOM light. Target: sub-100ms perceived for typical 1–5KB pastes.

**Server/LLM:** none. Everything — diffing, classification, accept/reject merge, export — runs in the browser. This is essential to the privacy story: the diff tool inherits the cleaner's "nothing touches the network" guarantee, which is a literal search-keyword wedge ("no upload," "private," "offline"). The page should state this plainly and back it with the fact that the JS bundle makes zero fetch calls with user text.

## 8. Competitors & how we differentiate

**Diffchecker.com** — the market leader. Real-time, word/char/line modes, Myers-style, does not upload by default, has paid PDF/folder features. Weakness: it is a *generic* compare tool with no concept of *why* something changed and no per-change accept/reject of prose edits; the free tier nudges toward accounts/Pro and shows ads heavily.

**TextCompare.org / textcompareonline.org / text-compare.com** — browser-side, red/delete + green/add highlighting, counts lines added/deleted, can export PDF or save+share a URL. Weakness: "save online and share URL" breaks the privacy promise; UIs are dated; no accept/reject; no semantic classification of changes.

**diff2html / jsdiff demo pages** — developer-oriented, gorgeous side-by-side, but expect unified-diff/git input and offer no merge/accept workflow for ordinary writers.

**Our wedge:**
1. **Context, not just comparison.** We already *know why* each change exists (the cleaner produced it), so we explain every diff segment — no competitor does this for prose.
2. **Per-change accept/reject with "keep my voice" framing.** Track-changes power without Microsoft Word and without uploading.
3. **Provable privacy.** 100% client-side, zero network calls with user text — a direct answer to "no upload / private / offline" searches that several competitors fail by offering server-side share links.
4. **Consolidation.** It is one stop in a suite (cleaner → diff → AI-tell scanner), not a standalone island; the diff is one click from the cleaning action where intent is highest.
5. **Quality, not bypass.** Positioning stays on writing quality and human voice, never "fool the detector."

## 9. SEO & page structure

**Primary keyword:** "before and after text diff viewer" / "compare before and after text."
**Secondary:** "text diff checker no upload," "highlight differences between two texts," "accept reject changes online," "word diff vs character diff," "private text compare."

**H1/H2 outline:**
- `H1` — Before/After Diff Viewer: See Exactly What Changed
- `H2` — Compare your original and cleaned text instantly
- `H2` — Inline vs side-by-side: pick your view
- `H2` — Accept or reject every change — keep your voice
- `H2` — Word-level vs character-level diff (what's the difference?)
- `H2` — 100% private: your text never leaves your browser
- `H2` — How to use the diff viewer (3 steps)
- `H2` — FAQ

**FAQ ideas (FAQPage schema):**
- "Does this upload my text anywhere?" (No — runs entirely in your browser.)
- "What's the difference between word-level and character-level diff?"
- "Can I undo a change after I accept it?"
- "Can I compare two texts that didn't come from the cleaner?"
- "Why are some 'invisible' changes shown as chips?"
- "Does it work on mobile?"

**Schema.org:** `WebApplication` (or `SoftwareApplication`) with `applicationCategory: "Utility"`, `offers: free`; plus `FAQPage` for the FAQ; `BreadcrumbList` back to the tools index.

**Internal links (sibling tools):** Em Dash Remover / main Cleaner (primary upstream), AI-Tell Scanner, Invisible Character Remover, Smart-Quote Converter, Markdown Stripper. Reciprocal "Review changes in the Diff Viewer" CTA from the cleaner's result panel.

## 10. Build effort & priority

**Effort:** Medium — roughly 2–4 focused days. The diff library (jsdiff) does the heavy lifting; the real work is (a) the accept/reject state model and lossless merge, (b) the inline/side-by-side renderers + CSS, and (c) reusing the cleaner's change-classification to label and explain each segment.

**Dependencies on existing code:** Consumes `CleanResult` (`{ text, counts }`) and the change-type classification logic in `src/lib/cleaner.ts` (`src/lib/cleaner.ts`) — refactor that classification into a small shared helper so both the cleaner and the diff viewer label changes identically. New route/component sits alongside `src/components/Cleaner.astro` and the existing `src/pages/index.astro`; styling builds on `src/styles/global.css`. Add one dependency (`diff`), MIT, small.

**Recommended sequencing:** This is the **highest-trust Tier 1 add** and should ship right after the core cleaner — it directly de-risks the cleaner itself ("show me what you changed before I trust you"). Build order: (1) inline word-level diff from cleaner output with the change counter and per-change tooltips, (2) accept/reject + merge + copy/download, (3) side-by-side view + minimap + keyboard nav, (4) standalone two-box mode + "Try an example" + localStorage persistence. Ship (1)+(2) as the credible MVP; (3)+(4) are fast follow-ons.

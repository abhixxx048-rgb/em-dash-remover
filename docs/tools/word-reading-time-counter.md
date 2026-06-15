# Word & Reading-Time Counter

> Paste any text and instantly see live word, character, sentence and paragraph counts plus reading/speaking time and platform-limit pills - all computed in your browser, nothing uploaded. Tier: 1. Difficulty: Low. Runs: client-side.

## 1. What it does

A live text analyzer: as you type or paste, it counts words, characters (with and without spaces), sentences, paragraphs, lines and reading/speaking time. On top of the raw counts it overlays "platform-limit pills" - small badges that tell you whether your text fits an X post, an SEO meta description, an SMS segment, a LinkedIn post, an Instagram caption, and so on, turning amber as you approach a limit and red when you blow past it. Everything runs in the browser with zero network calls, which is the same provable-privacy hook as the rest of the suite.

## 2. Why users want it (demand & search)

**Target search keywords (realistic, with demand/competition read):**

- `word counter` - enormous head-term volume, brutally competitive (wordcounter.net owns it). We will NOT win this head term; we target the long tail.
- `character counter` - very high volume, competitive (charactercounter.com).
- `reading time calculator` / `how long to read` - medium volume, moderate competition, strong intent.
- `twitter character counter` / `x character counter` - high volume, recurring need, beatable with a focused page.
- `meta description length checker` / `seo title length checker` - medium volume, high commercial intent (marketers).
- `linkedin post character limit` / `instagram caption character count` - medium volume, evergreen.
- `sms character counter` / `160 character counter` - steady volume, very specific intent.
- `words per minute speech time` / `speech time calculator` - medium volume, presenters/students.
- `word counter no sign up` / `private word counter` - low volume but on-brand and uncontested; our wedge.

**Who searches and the moment they need it:**

- A student at 11pm checking an essay hits a 500-word minimum or a 2,500-word cap.
- A marketer drafting a tweet/LinkedIn post who needs it to fit before the "see more" fold.
- An SEO writing a `<title>`/meta description who needs it under ~60 chars / ~155 chars (or under the pixel budget).
- A speaker timing a 5-minute talk ("how many words is that?").
- A freelancer billing per word, or hitting a client word target.
- An ESL writer who wants to gauge text difficulty/length.

**Source domains found in research:** wordcounter.net, charactercounter.com, charactercounter.com/twitter, wordcounter.ai, yourwordcounter.com, omnicalculator.com (WPM), scholarwithin.com (avg reading speed), lettercounter.org / advancedcharactercounter.com (2026 social limits), scalenut.com / mrs.digital (meta title pixel width).

## 3. Target users & use cases

- **Students & academics** - meeting essay min/max word counts, abstract limits (e.g. 250-word abstracts), checking paragraph counts.
- **Content marketers & social media managers** - fitting posts to X (280), LinkedIn (3,000), Instagram caption (2,200), Threads (500), TikTok caption (4,000); checking what shows before "see more."
- **SEO specialists** - meta title (~60 char / ~600px) and meta description (~155 char) length, plus keyword density.
- **Copywriters & freelancers** - word-count-based billing, client length targets, ad-copy limits.
- **Public speakers, podcasters, video creators** - converting a script to speaking time at 130–150 wpm; trimming to a slot.
- **ESL / non-native writers** - gauging readability and whether text is "too long/dense."
- **Authors & bloggers** - tracking chapter/post length, estimating reader time-on-page.
- **Developers / QA** - verifying text fits DB/UI field limits (bios, alt text, push notifications).

## 4. Features - core (MVP)

1. **Live counting as-you-type/paste** - updates on every keystroke (debounced for very large text), no "Count" button required.
2. **Word count** - Unicode-aware; counts runs of letters/numbers, not naive `split(' ')`. Handles hyphenated words, contractions, and non-Latin scripts via `Intl.Segmenter` where available.
3. **Character count, two modes** - with spaces and without spaces. Also expose grapheme-correct length (so emoji and accented characters count as 1, not 2+ code units).
4. **Sentence count** - segment on `.?!` with abbreviation/decimal guards (or `Intl.Segmenter('sentence')`).
5. **Paragraph count** - blocks separated by blank lines / hard breaks.
6. **Line count** - raw newline-delimited lines (useful for code/lists).
7. **Reading time** - word count ÷ 238 wpm (silent-reading meta-analysis default), rounded to a friendly "≈ X min Y sec."
8. **Speaking time** - word count ÷ 130 wpm (presentation default), shown as min:sec.
9. **Platform-limit pills** - a row of badges (X, SMS, SEO title, SEO meta description, LinkedIn, Instagram, Threads, etc.) each showing `used / limit` and a status color.
10. **Empty / placeholder state** - sample text + "Paste your text" prompt so the tool is never a blank void.

## 5. Features - engagement & helpfulness (what makes users love it & stay)

This is the heart of the page. Concrete, sticky touches and why each helps:

1. **Color-coded limit pills with 80% amber threshold.** Each platform pill is green under 80% of its limit, amber at 80–100%, red over. *Why:* gives an instant "am I safe?" read without mental math - the single most-cited delight in competitor research.

2. **Live remaining-count, not just used-count (X-style).** For the active/pinned platform, show "127 left" counting down (and "−14 over" in red when exceeded). *Why:* mirrors the mental model people already have from posting on X; tells them exactly how much to cut.

3. **Adjustable reading-speed presets (Slow 150 / Normal 238 / Fast 350 wpm) + custom slider.** *Why:* a slow reader and a skimmer get very different times; letting users pick makes the estimate feel honest and personal, and a custom slider is a power-user hook.

4. **Keyword density panel (top 10 words + %).** Shows most-used words with frequency and percentage, with common stop-words toggled off by default. *Why:* SEO and content writers stay on the page to refine; surfaces accidental repetition ("you wrote 'really' 9 times").

5. **Readability / reading-level badge (e.g. Flesch–Kincaid grade).** A simple "Grade 8 - easy to read" chip with a tooltip explaining the scale. *Why:* turns a counter into a quality coach, on-brand with our "real quality, keep your human voice" positioning - and it's educational, not a detector-beating gimmick.

6. **"What shows before 'See more'" preview.** For Instagram/Facebook/LinkedIn, render the exact truncation point (e.g. first 125/210 chars) inline. *Why:* writers care about the hook, not just the total - this is uniquely useful and rarely done well.

7. **SERP/pixel preview for SEO fields.** A mini Google result mockup that renders the title/description and warns by pixel width (~600px), not only character count. *Why:* the 2026 SEO standard is pixel-based; showing the actual snippet is far more convincing than a number.

8. **One-click copy, clear, and download (.txt).** Copy the cleaned text, copy a stats summary, clear the box, or download. *Why:* removes friction at the moment of "I'm done" - keeps the workflow inside our tool.

9. **Auto-save to localStorage (private, no account).** Restores the last text on return with a subtle "Restored your draft" toast and a one-click "start fresh." *Why:* huge stickiness driver on competitors - but we do it locally, reinforcing the privacy brand instead of undermining it.

10. **Writing goal / target meter.** User sets a target (e.g. 500 words, or 280 chars) and a progress bar fills toward it with a celebratory check at 100%. *Why:* gamifies essays and limit-bound posts; gives a reason to keep typing in-tool.

11. **Live "best-fit platform" hint.** A one-line nudge: "Fits X, Threads, and SMS (2 segments). Too long for a single SMS." *Why:* answers the user's real question ("where can I post this?") in plain language.

12. **SMS segment + encoding awareness.** Show segments (160 GSM-7 / 70 UCS-2) and flag which characters (emoji, curly quotes, em dashes) forced UCS-2. *Why:* genuinely useful for anyone sending bulk SMS, and a natural cross-sell to our em-dash/quote cleaner ("removing these 2 em dashes drops you to 1 segment").

13. **Click-to-pin a platform.** Pin X (or any platform) so its remaining-count and preview are always front-and-center. *Why:* lets repeat users tailor the tool to their one job.

14. **Keyboard shortcuts + tooltips everywhere.** Ctrl/Cmd+K clear, Ctrl/Cmd+C copy summary, `?` to open shortcut help; every metric has a hover/long-press tooltip ("Sentences: split on . ? ! - abbreviations excluded"). *Why:* power users feel fast; novices learn what each number means.

15. **"Try an example" button.** Loads a realistic sample paragraph. *Why:* removes the cold-start problem and instantly demonstrates value (especially on mobile where pasting is fiddly).

16. **Dark mode + fully responsive, thumb-friendly mobile layout.** Stat chips wrap into a scrollable row; the editor stays full-width. *Why:* a large share of social-caption checks happen on phones at night.

17. **Cross-tool deep links.** "Found 4 em dashes and 6 curly quotes" → button to send the text straight to the Em Dash Remover / AI-tell scanner. *Why:* turns the counter into the top of a funnel for the whole suite and makes our consolidation story real.

## 6. UX / UI notes

- **Layout:** single large textarea on the left/top; a sticky stats panel on the right/bottom. Primary stats (Words, Characters, Reading time) as big chips; secondary stats (sentences, paragraphs, lines, avg word length, speaking time) smaller. Platform pills in a wrapping row beneath. SEO/SMS previews and keyword density in collapsible accordions so the default view isn't overwhelming.
- **Input/output model:** input = the textarea (and paste); output = reactive panels. No submit button; everything recomputes live. Settings (wpm, goal, pinned platform) persist in localStorage.
- **States:**
  - *Empty:* placeholder with a one-line prompt + "Try an example" button; pills show `0 / limit` greyed.
  - *Processing:* effectively instant under ~50k words; for huge pastes, debounce ~150ms and show a tiny "counting…" shimmer rather than freezing.
  - *Result:* live chips; a brief highlight pulse on any chip whose value just changed.
- **Microcopy tone:** plain, encouraging, non-judgmental ("≈ 2 min read", "127 left for X", "Nice - under the meta-description limit"). Never "beat the detector."
- **Mobile:** stats collapse into a horizontally scrollable chip strip pinned above the keyboard; pin-a-platform becomes the default focus.
- **Accessibility (WCAG 2.2 AA):** never signal status by color alone - pair every amber/red pill with an icon (✓ / ! / ✕) and text ("over by 14"). Stats panel is an `aria-live="polite"` region so screen readers announce updated counts without spamming. Full keyboard operability; visible focus rings; 4.5:1 contrast in both themes; respects `prefers-reduced-motion` (disable the pulse).

## 7. Technical implementation (client-side)

- **Words:** prefer `Intl.Segmenter(locale, { granularity: 'word' })`, counting segments where `seg.isWordLike === true` - correct for CJK/Thai and emoji. Fallback for older runtimes: `text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0` (Unicode property escapes; keeps contractions/hyphenates as one word).
- **Characters:** with-spaces = grapheme count via `Intl.Segmenter({granularity:'grapheme'})` (so 👨‍👩‍👧 = 1, é = 1); also expose `string.length` (UTF-16 code units) separately for byte/field-limit use cases. Without-spaces = strip `\s` then count graphemes.
- **Sentences:** `Intl.Segmenter({granularity:'sentence'})`, or regex fallback splitting on `[.!?]+` with negative guards for `(\b[A-Z]\.|\d\.\d|e\.g\.|i\.e\.|Mr\.|Dr\.)` to avoid over-splitting abbreviations/decimals. Document this in the tooltip.
- **Paragraphs:** `text.split(/\n\s*\n/).filter(s => s.trim()).length`. **Lines:** `text.split(/\r\n|\r|\n/).length`.
- **Reading time:** `words / 238` min (Brysbaert 2019 silent-reading mean); presets 150/238/350. **Speaking time:** `words / 130` min. Format mm:ss.
- **Keyword density:** lowercase, strip punctuation, tokenize, drop a stop-word set (~150 common English words, toggleable), tally with a `Map`, sort desc, take top 10, compute `count / totalWords`.
- **Readability:** Flesch–Kincaid needs syllable counts - use a lightweight heuristic syllable counter (vowel-group regex with silent-e/diphthong adjustments); good enough for a "grade" chip, label it an estimate.
- **SMS segments:** test text against the GSM-7 charset; if any char is outside it → UCS-2 (70/segment, 67 for concatenated), else GSM-7 (160/segment, 153 concatenated). Flag the offending characters.
- **SEO pixel width:** approximate by measuring the rendered string in a hidden canvas with `ctx.measureText()` using Arial ~20px (Google's title font proxy); compare to ~600px. More accurate than char count.
- **Performance:** debounce recompute ~150ms; for >100k chars, run counting in a `requestIdleCallback`/Web Worker to keep typing smooth. `Intl.Segmenter` on huge text can be slow - cap full segmentation or sample for very large inputs and note it.
- **Edge cases:** emoji/ZWJ sequences, combining diacritics, RTL text, pasted Word "smart" punctuation, trailing whitespace, all-whitespace input (→ 0 words, not 1), URLs (note that some platforms count URLs as a fixed 23 chars - offer an X-mode toggle for that), CRLF vs LF.
- **Libraries:** ideally **zero** - `Intl.Segmenter` is built-in and well-supported in 2026. Optional tiny deps if needed: a small syllable/readability helper (~2–4KB) only if the hand-rolled heuristic proves inaccurate. Avoid heavyweight NLP bundles.
- **Privacy:** 100% client-side - no fetch, no analytics keystroke logging. Nothing here needs a server or LLM; that is the differentiator. State the "open DevTools → Network tab is empty" claim explicitly on the page.

## 8. Competitors & how we differentiate

- **wordcounter.net** - feature-rich (reading level, keyword density, auto-save, goals, flow score) but ad-heavy, cluttered, no provable-privacy stance, gates some features (premium). *Our wedge:* same depth, clean/fast, no ads, provably private.
- **charactercounter.com** - strong on character/grapheme/byte/emoji counting and per-platform sub-pages, but thin on reading time and keyword analysis, and limits aren't shown inline on the main page. *Our wedge:* unify counting + limits + reading time + readability in one view.
- **wordcounter.ai / yourwordcounter.com** - newer, some AI framing; variable accuracy on limits, less rigorous on Unicode. *Our wedge:* accurate `Intl.Segmenter` counting and honest, sourced wpm/limit numbers.
- **Single-platform counters (charactercounter.com/twitter, lettercounter.org)** - rank for individual platform keywords but force users to bounce between pages. *Our wedge:* one page covers all platforms with pin-a-platform.

**Overall differentiation:** provable client-side privacy (brand hook), Unicode/grapheme correctness, consolidation (counts + limits + reading + readability + SMS encoding in one place), and quality-not-bypass framing that cross-sells into the em-dash/AI-tell cleaning suite. We deliberately do not compete on the head term "word counter"; we win long-tail platform/reading-time/private queries and funnel into the suite.

## 9. SEO & page structure

- **Primary keyword:** word & character counter (+ reading time).
- **Secondary:** reading time calculator, twitter/x character counter, meta description length checker, linkedin character limit, instagram caption counter, sms character counter, speech time calculator, private word counter no sign up.
- **H1:** Word & Reading-Time Counter - Free, Private, In-Browser
- **H2 outline:**
  - Live counts: words, characters, sentences, paragraphs
  - Reading & speaking time (and how we calculate it)
  - Platform limits: X, LinkedIn, Instagram, Threads, SMS, SEO title & meta description
  - Keyword density & readability
  - 100% client-side - your text never leaves your browser
  - How to use it (3 steps)
  - FAQ
- **FAQ ideas:** How is reading time calculated? / What words-per-minute do you use? / Does my text get uploaded? (no) / What's the X/Twitter character limit in 2026? / Why do emojis count differently in SMS? / Pixel width vs character count for SEO titles? / How are sentences/paragraphs counted? / Why does my count differ from Microsoft Word?
- **Schema.org:** `WebApplication` (or `SoftwareApplication`) with `applicationCategory: Utility`, `offers price 0`; add `FAQPage` for the FAQ block; `BreadcrumbList` back to the tools suite hub.
- **Internal links:** → Em Dash Remover (from the "found N em dashes" hint), → Curly-quote/straight-quote converter, → AI-tell scanner, → tools suite hub. Reciprocal links from those tools' "also clean up length" callouts.

## 10. Build effort & priority

- **Effort:** Low - roughly 2–4 dev-days for a credible v1 (counting engine + pills + reading/speaking time + copy/clear/example + empty state), plus ~2–3 days for the engagement extras (keyword density, readability, SMS encoding, SERP/pixel preview, auto-save, goal meter, cross-tool deep links).
- **Dependencies on existing code:** reuses existing Unicode/invisible-char handling and the curly-quote/em-dash detection already built for the main cleaner - the SMS-encoding flag and the "send to Em Dash Remover" deep link are nearly free given that code exists. Shares the Astro/Cloudflare shell, dark-mode, and design system.
- **Sequencing:** ship the **core counting + reading time + platform pills** first (this alone is a strong, indexable page and a low-risk Tier-1 win). Add **SMS encoding + cross-tool deep links** next (highest synergy with existing suite). Then **keyword density, readability, SERP pixel preview, auto-save, goal meter** as a second release to deepen engagement and time-on-page. Because it's pure client-side with no LLM, it carries no infra cost and reinforces the privacy brand from day one.

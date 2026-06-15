# Read-Aloud Proofreader (TTS)

> Hear your own writing read back to you so your ear catches the mistakes your eyes skip - runs entirely in your browser, no upload, no signup. Tier: 2. Difficulty: Med. Runs: client-side.

## 1. What it does

Paste any text and the tool reads it aloud using your device's built-in speech engine (the Web Speech API `SpeechSynthesis`), highlighting each word as it is spoken. The point is not entertainment or accessibility listening - it is proofreading: a text-to-speech voice reads *exactly* what is on the page (not what you meant to write), so missing words, doubled words, awkward phrasing, run-on sentences, and clumsy transitions become audible. The user controls voice, speed, and pitch, can jump to any sentence, and pairs the listen-through with our existing AI-tell scanner so the same paste-box that *cleans* AI writing also lets you *hear* whether it still sounds human.

## 2. Why users want it (demand & search)

**Why this works as a proofreading method (the evidentiary hook):**
- Reading aloud routes the text through the auditory cortex rather than the visual cortex, and that different processing path is what makes errors stand out (UNC Writing Center; ElevenReader).
- A 2022 study found people caught significantly more errors reading aloud than reading silently (referenced widely in proofreading guides).
- When *you* read your own work aloud you tend to say the word you intended, not the word on the page - a TTS engine reads the literal text and exposes every error (Read Aloud Reader; Oregon State Marketing).
- Hearing it puts you in the reader's position and surfaces tone problems, run-ons, and bad transitions, not just typos.

**Target search keywords (realistic, with a demand/competition read):**
- `read my essay to me` / `read my text aloud` - strong intent, students; medium competition (Papersowl, ElevenReader, NaturalReader own this).
- `proofreading read aloud tool` / `read aloud proofreading` - lower volume, *high* intent, weak incumbents → best wedge for us.
- `text to speech proofreading` - medium volume, medium competition.
- `hear my writing` / `listen to my writing` - long-tail, low competition, exactly our framing.
- `free text to speech reader online` - high volume, *high* competition (TTSReader, NaturalReader, Speechify all rank); we should NOT fight head-on for the generic listening query.
- `read aloud with word highlighting` - niche, low competition, differentiating feature query.
- `proofread by listening` / `catch typos by hearing` - long-tail editorial intent.

**Who searches and when:** A student about to submit an essay at 2am; a writer/novelist doing a final pass; a marketer reviewing copy before it ships; an ESL writer checking whether a paragraph "sounds right"; an editor doing a literal read against the manuscript. The trigger moment is *final pass before sending/submitting* - the same moment they reach for our em-dash cleaner.

**Source domains found in research:** writingcenter.unc.edu, blogs.oregonstate.edu, elevenreader.io, readaloudreader.com, jay-penner.medium.com (Medium), speechify.com, ttsreader.com, developer.mozilla.org.

## 3. Target users & use cases

- **Students** - final read-through of an essay/application before submitting; catching dropped words and run-ons by ear.
- **Novelists / fiction writers** - chapter-level literal read to catch repeated words, awkward dialogue, and rhythm problems (Jay Penner's TTS-proofing workflow is a documented pattern).
- **Marketers / content writers** - listening to landing-page or email copy to test flow and tone before publishing.
- **ESL / non-native writers** - using their ear to judge whether phrasing "sounds natural," a use case the literature explicitly calls out.
- **Editors / proofreaders** - a literal read of the source so their eyes follow the highlight while their ear catches deviations.
- **Accessibility-adjacent users** - people who simply retain text better by hearing it (secondary to the proofing positioning, but a real audience).
- **People who just used our cleaner** - read the cleaned output aloud to confirm the human voice survived the edit (consolidation play).

## 4. Features - core (MVP)

1. **Paste-and-play**: large textarea; a primary Play button starts reading immediately using a sensible default voice. No signup, no upload - speech runs locally via `window.speechSynthesis`.
2. **Word-by-word highlighting**: as each word is spoken, highlight it in the text using the `boundary` event's `charIndex` (+ `charLength` where available) to map the spoken position back to the textarea/render. Auto-scroll to keep the spoken word in view.
3. **Voice picker**: populate from `speechSynthesis.getVoices()`, grouped by language, with a flag/label for `localService` (on-device) vs. cloud voices so privacy-sensitive users can pick a fully-local voice.
4. **Speed (rate) control**: slider 0.5x–2.0x with quick presets (0.75 slow-proof, 1.0, 1.25, 1.5). Proofreaders typically want *slower* than normal listening.
5. **Pitch control**: 0–2 slider (collapsed under "Advanced"). A flatter, slightly different pitch helps the text feel less like your own inner voice.
6. **Transport controls**: Play / Pause / Resume / Stop, plus **skip to next/previous sentence** so users can re-hear a clunky line.
7. **Click-to-start-here**: click any word/sentence to begin reading from that point.
8. **Long-text handling**: automatically chunk text into sentence-sized utterances to defeat the Chrome ~15-second / ~200–250-char cutoff bug (see §7), stitched seamlessly so the user perceives one continuous read.
9. **Live progress**: a progress bar plus "sentence 4 of 37" so users know where they are in a long piece.
10. **Graceful no-support state**: feature-detect `speechSynthesis`; if absent (e.g., Firefox for Android lacks synthesis), show a clear message and still offer the rest of the suite.

## 5. Features - engagement & helpfulness (the sticky layer)

> This is the section the stakeholder cares about most. Each item lists the feature **and why it helps the user**.

1. **Auto-scrolling karaoke highlight** - the current word lights up and the page scrolls to keep it centered. *Why:* turns passive listening into active proofing; the eye follows the ear so the moment they hear a wrong word they see exactly where it is. This is also a query we can rank for (`read aloud with word highlighting`).

2. **"Flag what I just heard" button (and `F` hotkey)** - while listening, one tap drops a marker at the currently-spoken sentence into a side list of "Things to fix." *Why:* you can't stop and edit mid-listen without losing flow; flagging lets you do a full pass, then fix everything at the end. This is the single feature most TTS readers lack and is our core proofing differentiator.

3. **Sentence re-hear / loop-this-sentence** - replay just the current sentence (`R` key). *Why:* the most common proofing action is "wait, say that again" for an awkward line.

4. **Speed presets framed for proofing** - "Slow proof (0.75x)", "Natural (1x)", "Skim (1.5x)" rather than raw numbers. *Why:* tells the user *why* they'd pick slower, teaching the method while they use it.

5. **Live stats while you read** - word count, estimated read time at current speed, sentence count, and a "longest sentence: 42 words" callout. *Why:* long sentences are the #1 thing read-aloud surfaces; flagging the longest one before they even press Play primes them to listen for it.

6. **"Readability / awkwardness" pre-scan meter** - before playing, a lightweight client-side pass highlights very long sentences, repeated adjacent words ("the the", "that that"), and doubled spaces, scored into a simple meter. *Why:* gives instant value even if they never press Play, and tells them where to listen hardest. Reuses logic adjacent to our existing AI-tell scanner.

7. **Inline "why this is a tell" tooltips** - clickable markers on flagged spots explaining *why* a 40-word sentence or a repeated word matters, with a one-line fix suggestion. *Why:* educates rather than just flags; builds trust and brings people back.

8. **One-click "Read the cleaned version"** - a toggle to feed the *output* of our em-dash/AI cleaner straight into the reader. *Why:* closes the loop - clean, then hear that the human voice survived. Drives cross-tool usage and stickiness across the suite.

9. **Voice A/B compare** - quickly swap between two voices on the same sentence. *Why:* a different voice catches different things; some users proof better with a robotic voice, others with a natural one.

10. **Resume where you left off (localStorage)** - remembers your last text, voice, speed, and scroll position; "Continue your last proofread?" on return. *Why:* proofing a long doc spans sessions; never lose your place or re-pick your voice. Pure client-side, on-brand for privacy.

11. **Keyboard-first transport** - Space = play/pause, ←/→ = prev/next sentence, ↑/↓ = speed, `F` = flag, `R` = re-hear. *Why:* power users (editors) proof faster without touching the mouse; shown in a `?` cheat-sheet.

12. **"Try an example" / demo button** - loads a deliberately flawed paragraph (dropped word, run-on, repeated word) so first-time visitors hear the value in 5 seconds. *Why:* solves the empty-state problem and demonstrates *what* to listen for.

13. **Copy / download the fix-list** - export your flagged sentences (with positions) as plain text or markdown checklist. *Why:* lets them take the proof results into their editor of choice; concrete takeaway artifact.

14. **Wake-Lock + tab-focus keep-alive** - request a screen Wake Lock and re-queue on `visibilitychange` so a long read doesn't silently die when the tab/screen idles. *Why:* nothing is more frustrating than the voice stopping at sentence 30; this quietly makes long reads reliable.

15. **Dark mode, high-contrast highlight, dyslexia-friendly font toggle** - and a non-color highlight cue (underline + bold, not color alone). *Why:* accessibility and comfort for long sessions; satisfies WCAG and serves the ESL/dyslexia audience that overlaps heavily with read-aloud users.

16. **Privacy badge "spoken on your device"** - when a `localService` voice is selected, an explicit "this voice never leaves your browser" indicator; a subtle warning when a cloud voice is chosen. *Why:* our entire brand is provable privacy; the read-aloud tool is one of the few where a naive implementation *could* send text to a vendor, so we make the local-vs-cloud choice visible and honest.

## 6. UX / UI notes

**Layout:** Single column on mobile, two-pane on desktop - left = the text being read with live highlight, right (or top toolbar) = transport + voice/speed controls + the live stats/fix-list panel. Mirrors the existing paste-box site so it feels like the same product.

**Input/output model:** One textarea is both input and the read surface. On Play it switches to a read-only highlighted render; an "Edit" button returns to editable mode (and pauses speech). Output is ephemeral audio + the persistent fix-list.

**States:**
- *Empty:* big textarea, "Paste your writing - then hear it" headline, a "Try an example" button, and a one-line explanation of why reading aloud catches errors.
- *Ready:* stats and pre-scan meter appear under the box as soon as text is present (before any audio).
- *Processing/voices-loading:* `getVoices()` can return empty until the `voiceschanged` event fires; show a brief "loading voices…" and disable Play until at least one voice exists.
- *Playing:* highlighted word, progress bar, "sentence N of M", live transport.
- *Paused / done:* clear resume affordance; on completion show "Heard it all - N spots flagged" with the fix-list.
- *Unsupported:* honest message + link back to the cleaner tools.

**Microcopy tone:** Calm, craft-focused, never "beat the detector." E.g., "Your ear catches what your eyes skim." "Hear it the way your reader will."

**Mobile:** Sticky bottom transport bar (thumb-reachable Play/Pause/flag); larger tap targets; respect the iOS/Safari requirement that speech be kicked off by a user gesture.

**Accessibility (WCAG 2.2 AA):** Highlight uses underline+weight, not color alone; all controls keyboard-reachable and labelled; `aria-live` announcements for state changes; honor `prefers-reduced-motion` by disabling auto-scroll animation; focus-visible rings; sliders operable by arrow keys with `aria-valuetext`.

## 7. Technical implementation (client-side)

**Core API:** `window.speechSynthesis` + `SpeechSynthesisUtterance`. Fully in-browser when a `localService` voice is used - no server, no upload, perfectly on-brand. Cloud voices (e.g., Google's network voices) *do* send the utterance text to the vendor, so we surface that and let users pick local voices; that's the only privacy caveat and we make it explicit.

**Voice loading:** `getVoices()` is async-populated; subscribe to `voiceschanged` and re-render the picker. Sort/group by `lang`; tag `localService`.

**Word highlighting:** attach a `boundary` listener to each utterance. Use `event.charIndex` (and `event.charLength` where present, Chromium-only) to slice the source text and map to a rendered span. Because boundaries are computed per-utterance, keep a running offset so per-sentence chunks map back to absolute positions in the full text. **Caveat (researched):** the `boundary` event is *not Baseline* - it works on Safari (macOS) and Windows Chromium but is unreliable/absent on Linux and Android. So: feature-detect; if no boundary events arrive within the first ~300ms of speech, **fall back to sentence-level highlighting** driven by chunk start/`end` events (we always know which sentence is speaking because we chunk). This degrades gracefully from word-level to sentence-level highlight rather than breaking.

**Long-text chunking (critical):** Desktop Chrome cancels a single utterance after ~15 seconds / ~200–250 characters mid-sentence (long-standing Chromium bug). Split text into sentences (regex on `.?!` with abbreviation guards, or `Intl.Segmenter` with `granularity:'sentence'` where available - it's the clean modern path), enqueue each as its own utterance, and start the next on the previous one's `end` event. Keep chunks under ~200 chars; further split over-long sentences at clause boundaries (`,;:`). This sidesteps the cutoff entirely and gives us free sentence-level progress + click-to-start-here.

**Keep-alive:** On Chromium desktop, a known stutter/stall on long queues is mitigated by a periodic `pause()`+`resume()` tick (~10s) - guard it behind a UA/feature check because Android's `pause()` effectively ends the utterance (no-op resume). Also request `navigator.wakeLock` while playing and re-queue on `visibilitychange` since Chrome/Safari throttle synthesis in backgrounded tabs.

**Pre-scan (the meter & flags):** pure client-side regex/string passes - sentence segmentation for length, `\b(\w+)\s+\1\b` (case-insensitive) for doubled words, `\s{2,}` for spacing, simple syllable/word-count readability estimate. No LLM, no network.

**Performance for large text:** virtualize/segment so we never re-render the whole doc per boundary event (only the active sentence span re-renders). `Intl.Segmenter` is built-in (no library weight). Avoid mounting tens of thousands of word spans at once - render spans lazily per active sentence.

**Suggested library:** consider `easy-speech` (cross-browser shim that normalizes the well-known `getVoices()`/Safari/Chrome quirks; small, dependency-free) - or hand-roll, since our needs are narrow and we want to keep bundle size minimal for an Astro/Cloudflare static page.

**What needs a server/LLM:** nothing for v1. The whole tool is client-side; this preserves the "provable privacy" story. (A *future* optional upgrade could offer higher-quality neural voices via an API, but that would be opt-in and clearly marked as leaving the device - not in MVP.)

**Edge cases / failure modes:** empty voice list on first paint (handle `voiceschanged`); iOS requires a user gesture to start audio; numbers/URLs/emoji read oddly (offer a "normalize for speech" toggle that expands or strips them - overlaps with our existing normalization code); boundary event absent → sentence fallback; backgrounded tab throttling → wake lock + re-queue; very long single "sentence" with no punctuation → clause-level fallback split.

## 8. Competitors & how we differentiate

- **TTSReader (ttsreader.com)** - free, unlimited, reads pages/PDFs/ebooks. Strength: voices and formats. Weakness: it's a *listening/consumption* tool, not a *proofing* tool - no flagging, no fix-list, no awkwardness pre-scan, ad-supported.
- **NaturalReader** - polished, OCR, many voices, but the *free* tier is gated and it's positioned for accessibility/listening; upsell-heavy, account-oriented.
- **Speechify** - heavily marketed, mobile-first, celebrity voices on premium; expensive (~$139/yr), productivity-listening focus, not proofreading.
- **ElevenReader / Papersowl "read my essay"** - directly target the student "read my essay to me" query; ElevenLabs has the best voices. Weakness: cloud-only (text leaves your device), signup/credits, again framed as listening not proofing.
- **Browser/OS read-aloud (Edge, Word, Google Docs add-on)** - free and built-in, but no flagging, no fix-list, no privacy framing, and clunky for a quick paste.

**Our wedge:**
1. **Proofing, not listening** - flag-as-you-hear, a fix-list you can export, an awkwardness/long-sentence pre-scan, and microcopy that teaches the method. None of the incumbents do this.
2. **Provable privacy** - 100% client-side with an explicit local-vs-cloud voice indicator; text never has to leave the browser. The "read my essay" student crowd is pasting sensitive/graded work.
3. **No signup, no credits, no ads** - instant paste-and-play.
4. **Consolidation** - it lives in the same suite as the em-dash/AI cleaner; "clean it, then hear it" is a workflow no competitor offers.
5. **Quality, not bypass** - on-brand "keep your human voice," not "beat the detector."

## 9. SEO & page structure

**Primary keyword:** `read aloud proofreader` / `read my writing aloud to proofread`.
**Secondary:** `text to speech proofreading`, `hear my essay / read my essay to me`, `read aloud with word highlighting`, `free text to speech reader (no signup)`, `catch typos by listening`, `proofread by ear`.

**H1:** "Read-Aloud Proofreader - Hear Your Writing, Catch What Your Eyes Miss"

**H2 outline:**
- Why reading your writing aloud catches more errors (cite the auditory-cortex / 2022 study evidence)
- How to use it (paste → pick a voice → press Play → flag → fix)
- Word-by-word highlighting and slow-proof speeds
- 100% private - speech runs in your browser, nothing uploaded
- What it catches: dropped words, run-ons, repeated words, awkward phrasing
- Read the *cleaned* version (link to the em-dash / AI-text cleaner)
- FAQ

**FAQ ideas (schema-eligible):**
- Does reading aloud really help proofreading? (yes - auditory processing; studies)
- Is my text sent anywhere? (no with a local voice; we show which voices are local)
- Which browsers support word highlighting? (Safari/Chrome on macOS/Windows; sentence-level fallback elsewhere)
- Why does it slow down or stop on very long text? (browser limits - we auto-chunk to fix it)
- Can I change the voice and speed? Is it free? Do I need an account?

**Schema.org:** `WebApplication` (applicationCategory: "UtilityApplication", offers: free) + `FAQPage` + `HowTo` ("How to proofread by listening").

**Internal links (sibling tools):** ← Em-Dash Remover / AI-text cleaner (primary), AI-tell scanner, quote/ellipsis normalizer, invisible-character remover, markdown stripper. Add a "Tools" footer nav shared across the suite; cross-link "clean then hear."

## 10. Build effort & priority

**Effort:** Medium - roughly 3–5 dev-days for a credible v1. The `speechSynthesis` plumbing is small; the *real* work is robust chunking, the boundary→highlight mapping with sentence-level fallback, and the keep-alive/wake-lock reliability layer (this is where naive implementations fail).

**Dependencies on existing code:** Reuse our sentence/whitespace normalization and the AI-tell/repeated-word detection for the pre-scan meter and the "normalize for speech" toggle. Reuse the shared layout, dark-mode, and tool-footer components. The "read the cleaned version" feature depends on exposing the cleaner's output as an importable input.

**Recommended sequencing:**
1. MVP: paste → voice picker (with `voiceschanged` handling) → play/pause/stop → chunked long-text → sentence-level highlight + progress. Ship this first; it already beats most free tools for proofing.
2. Layer 2: word-level boundary highlighting with graceful fallback, click-to-start-here, keyboard transport, wake-lock keep-alive.
3. Layer 3 (the stickiness): flag-as-you-hear + exportable fix-list, awkwardness pre-scan meter, "why this is a tell" tooltips, "read the cleaned version" cross-tool toggle, localStorage resume, example button.

Sequence note: do **Layer 1 + the chunking/keep-alive reliability work before any polish** - the one thing that kills trust in a read-aloud tool is the voice stopping partway through a long document, and that's a known browser bug we must defeat up front.

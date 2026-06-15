/**
 * Word & Reading-Time Counter - pure client-side analysis engine.
 *
 * Design goals (see docs/tools/word-reading-time-counter.md):
 *  - Unicode-aware counting (Intl.Segmenter where available, regex fallback) so
 *    CJK / emoji / accented text and contractions count correctly - NOT a naive
 *    `split(' ')`.
 *  - Grapheme-correct character counts (👨‍👩‍👧 = 1, é = 1) plus raw UTF-16 length
 *    for field-limit use cases.
 *  - Reading & speaking time from sourced WPM defaults (Brysbaert 2019).
 *  - Platform-limit awareness (X, SMS, SEO, LinkedIn, Instagram, Threads…).
 *  - 100% in-browser, deterministic. Nothing here touches the DOM or network.
 */

/* ------------------------------------------------------------------ counts */

export interface CountResult {
  /** Unicode-aware word count (word-like segments / letter+number runs). */
  words: number;
  /** Grapheme-correct character count, spaces included. */
  chars: number;
  /** Grapheme-correct character count, all whitespace stripped. */
  charsNoSpaces: number;
  /** Raw UTF-16 code-unit length (what `string.length` reports). */
  codeUnits: number;
  /** Sentence count (segmenter or `.?!` split with abbreviation guards). */
  sentences: number;
  /** Paragraph count: blocks separated by blank lines. */
  paragraphs: number;
  /** Raw newline-delimited line count. */
  lines: number;
  /** Average word length in characters (0 when there are no words). */
  avgWordLength: number;
}

/** Reading speed presets, words-per-minute. `normal` = Brysbaert 2019 mean. */
export const WPM_PRESETS = { slow: 150, normal: 238, fast: 350 } as const;
export type WpmPreset = keyof typeof WPM_PRESETS;

/** Speaking-rate default for presentations (words per minute). */
export const SPEAKING_WPM = 130;

/* ---- segmenters are created lazily and reused (construction is not free) -- */

let wordSeg: Intl.Segmenter | null | undefined;
let graphemeSeg: Intl.Segmenter | null | undefined;
let sentenceSeg: Intl.Segmenter | null | undefined;

function getSegmenter(granularity: 'word' | 'grapheme' | 'sentence'): Intl.Segmenter | null {
  // `Intl.Segmenter` is widely supported in 2026 but we feature-detect anyway.
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter === 'undefined') return null;
  try {
    return new Intl.Segmenter(undefined, { granularity });
  } catch {
    return null;
  }
}

/** Count words: prefer Intl.Segmenter word-like segments, else a Unicode regex. */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  if (wordSeg === undefined) wordSeg = getSegmenter('word');
  if (wordSeg) {
    let n = 0;
    for (const s of wordSeg.segment(text)) if (s.isWordLike) n++;
    return n;
  }
  // Fallback: runs of letters/numbers, keeping contractions & hyphenates whole.
  const m = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
}

/** Count graphemes (user-perceived characters), reused for char counts. */
export function countGraphemes(text: string): number {
  if (text.length === 0) return 0;
  if (graphemeSeg === undefined) graphemeSeg = getSegmenter('grapheme');
  if (graphemeSeg) {
    let n = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of graphemeSeg.segment(text)) n++;
    return n;
  }
  // Fallback: spread iterates by code point (still better than .length for emoji).
  return [...text].length;
}

// Common abbreviations / patterns that should NOT end a sentence in the regex
// fallback. Documented in the tooltip on the page.
const ABBREV_GUARD = /\b(?:[A-Z]|Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|No)$/i;

/** Count sentences: Intl.Segmenter sentence granularity, or guarded `.?!` split. */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (sentenceSeg === undefined) sentenceSeg = getSegmenter('sentence');
  if (sentenceSeg) {
    let n = 0;
    for (const s of sentenceSeg.segment(trimmed)) if (s.segment.trim()) n++;
    return n;
  }
  // Fallback: split on terminal punctuation, skipping abbreviations / decimals.
  let n = 0;
  const parts = trimmed.split(/([.!?]+)/);
  for (let i = 0; i < parts.length; i += 2) {
    const chunk = parts[i];
    const punct = parts[i + 1];
    if (!chunk || !chunk.trim()) continue;
    // No terminator (final fragment) still counts as one sentence.
    if (punct === undefined) { n++; continue; }
    // Decimal like "3.14" - the next chunk starts with a digit: not a break.
    const next = parts[i + 2];
    const isDecimal = punct === '.' && /\d$/.test(chunk) && next && /^\d/.test(next);
    if (isDecimal || ABBREV_GUARD.test(chunk.trimEnd())) {
      // Merge into the following chunk so we don't double-count.
      if (next !== undefined) parts[i + 2] = chunk + punct + next;
      continue;
    }
    n++;
  }
  return Math.max(1, n);
}

/** Count paragraphs: non-empty blocks separated by blank lines / hard breaks. */
export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((s) => s.trim().length > 0).length;
}

/** Count raw lines (newline-delimited). Empty input is 0 lines. */
export function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

/** Run the full count pass once. Deterministic; safe to call on every keystroke. */
export function count(text: string): CountResult {
  const words = countWords(text);
  const chars = countGraphemes(text);
  const charsNoSpaces = countGraphemes(text.replace(/\s/gu, ''));
  return {
    words,
    chars,
    charsNoSpaces,
    codeUnits: text.length,
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    lines: countLines(text),
    avgWordLength: words ? Math.round((charsNoSpaces / words) * 10) / 10 : 0,
  };
}

/* -------------------------------------------------------------- timing */

export interface TimeEstimate {
  /** Total seconds (float). */
  seconds: number;
  /** Whole minutes part. */
  minutes: number;
  /** Remaining whole seconds part (0–59). */
  secs: number;
  /** Friendly label e.g. "2 min 14 sec" or "< 1 min". */
  label: string;
}

/** Convert a word count + words-per-minute into a friendly time estimate. */
export function readingTime(words: number, wpm: number): TimeEstimate {
  const totalSeconds = wpm > 0 ? (words / wpm) * 60 : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  // Rounding can push secs to 60 - carry it into minutes.
  const carry = secs === 60 ? 1 : 0;
  const m = minutes + carry;
  const s = secs === 60 ? 0 : secs;
  let label: string;
  if (words === 0) label = '0 sec';
  else if (m === 0 && s < 30) label = '< 30 sec';
  else if (m === 0) label = `${s} sec`;
  else label = s ? `${m} min ${s} sec` : `${m} min`;
  return { seconds: totalSeconds, minutes: m, secs: s, label };
}

/* ---------------------------------------------------- platform limits */

export type LimitUnit = 'chars' | 'words' | 'codeUnits';
export type PillStatus = 'empty' | 'ok' | 'warn' | 'over';

export interface PlatformLimit {
  id: string;
  /** Display name. */
  label: string;
  /** The maximum allowed value. */
  limit: number;
  /** Which metric the limit applies to. */
  unit: LimitUnit;
  /** Optional short note (e.g. truncation hint). */
  note?: string;
}

/**
 * Platform limits (2026). Character limits use grapheme counts so emoji behave
 * the way the platform UI shows them. SEO limits are character-based proxies for
 * the pixel budget; the page can refine with canvas measurement.
 */
export const PLATFORM_LIMITS: PlatformLimit[] = [
  { id: 'x', label: 'X / Twitter', limit: 280, unit: 'chars' },
  { id: 'sms', label: 'SMS segment', limit: 160, unit: 'chars', note: 'GSM-7; 70 if emoji/unicode' },
  { id: 'seo-title', label: 'SEO title', limit: 60, unit: 'chars', note: '~600px in Google' },
  { id: 'seo-desc', label: 'SEO meta description', limit: 155, unit: 'chars' },
  { id: 'linkedin', label: 'LinkedIn post', limit: 3000, unit: 'chars' },
  { id: 'instagram', label: 'Instagram caption', limit: 2200, unit: 'chars' },
  { id: 'threads', label: 'Threads', limit: 500, unit: 'chars' },
  { id: 'facebook', label: 'Facebook post', limit: 63206, unit: 'chars' },
];

export interface PillResult {
  id: string;
  label: string;
  used: number;
  limit: number;
  /** Signed remaining count: negative means "over by N". */
  remaining: number;
  /** Fraction of the limit used (can exceed 1). */
  ratio: number;
  status: PillStatus;
  note?: string;
}

/** Status thresholds: <80% ok, 80–100% warn, >100% over, 0 used = empty. */
export function pillStatus(used: number, limit: number): PillStatus {
  if (used === 0) return 'empty';
  if (used > limit) return 'over';
  if (used >= limit * 0.8) return 'warn';
  return 'ok';
}

/** Evaluate every platform limit against a computed CountResult. */
export function evaluateLimits(c: CountResult, limits = PLATFORM_LIMITS): PillResult[] {
  return limits.map((p) => {
    const used = p.unit === 'words' ? c.words : p.unit === 'codeUnits' ? c.codeUnits : c.chars;
    const remaining = p.limit - used;
    return {
      id: p.id,
      label: p.label,
      used,
      limit: p.limit,
      remaining,
      ratio: p.limit > 0 ? used / p.limit : 0,
      status: pillStatus(used, p.limit),
      note: p.note,
    };
  });
}

/* ---------------------------------------------------- SMS encoding */

// GSM-7 basic + extension charset. Anything outside forces UCS-2 (70/segment).
const GSM7 =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà' +
  '\f^{}\\[~]|€'; // extension chars count as 2 but we keep the check simple

export interface SmsInfo {
  encoding: 'GSM-7' | 'UCS-2';
  /** Per-segment character budget. */
  perSegment: number;
  /** Number of segments needed (0 for empty text). */
  segments: number;
  /** Characters used (grapheme count). */
  used: number;
  /** Distinct characters that forced UCS-2 (e.g. emoji, curly quotes, em dash). */
  offenders: string[];
}

/** Determine SMS encoding + segment count, flagging non-GSM-7 characters. */
export function smsInfo(text: string): SmsInfo {
  const used = countGraphemes(text);
  const offenders = new Set<string>();
  for (const ch of text) {
    if (!GSM7.includes(ch)) offenders.add(ch);
  }
  const ucs2 = offenders.size > 0;
  const encoding = ucs2 ? 'UCS-2' : 'GSM-7';
  const single = ucs2 ? 70 : 160;
  const concat = ucs2 ? 67 : 153;
  let segments = 0;
  if (used > 0) segments = used <= single ? 1 : Math.ceil(used / concat);
  return {
    encoding,
    perSegment: segments > 1 ? concat : single,
    segments,
    used,
    offenders: [...offenders].slice(0, 12),
  };
}

/* ---------------------------------------------------- keyword density */

// A compact English stop-word set (toggleable on the page).
const STOP_WORDS = new Set(
  ('a an and the of to in is it for on that this with as are was were be been being ' +
    'at by from or but not you your i we he she they them his her our us me my mine ' +
    'do does did has have had will would can could should may might must if then than ' +
    'so up out about into over after before all any some no nor too very just more most ' +
    'such own same other which who whom what when where why how').split(/\s+/),
);

export interface KeywordHit {
  word: string;
  count: number;
  /** Share of total words, 0–1. */
  density: number;
}

/** Top-N most frequent words, optionally excluding common stop-words. */
export function keywordDensity(text: string, opts: { excludeStopWords?: boolean; top?: number } = {}): KeywordHit[] {
  const { excludeStopWords = true, top = 10 } = opts;
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  const total = tokens.length;
  if (total === 0) return [];
  const tally = new Map<string, number>();
  for (const t of tokens) {
    if (excludeStopWords && STOP_WORDS.has(t)) continue;
    tally.set(t, (tally.get(t) || 0) + 1);
  }
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word, c]) => ({ word, count: c, density: c / total }));
}

/* ---------------------------------------------------- readability */

/** Heuristic syllable counter: vowel groups with silent-e / diphthong fixes. */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  let s = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  s = s.replace(/^y/, '');
  const groups = s.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export interface Readability {
  /** Flesch–Kincaid grade level (estimate). */
  grade: number;
  /** Plain-language label, e.g. "Easy to read". */
  label: string;
}

/**
 * Flesch–Kincaid grade estimate. Needs words, sentences and syllables; we treat
 * it as an estimate and label it as such on the page.
 */
export function readability(text: string, c: CountResult): Readability | null {
  const words = text.match(/[\p{L}]+(?:['’\-][\p{L}]+)*/gu) || [];
  const wordCount = words.length;
  const sentences = Math.max(1, c.sentences);
  if (wordCount < 5) return null; // not enough signal to be meaningful
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const grade = 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59;
  const g = Math.max(1, Math.round(grade));
  let label: string;
  if (g <= 6) label = 'Very easy to read';
  else if (g <= 9) label = 'Easy to read';
  else if (g <= 12) label = 'Fairly hard to read';
  else if (g <= 15) label = 'Hard to read (college level)';
  else label = 'Very hard to read';
  return { grade: g, label };
}

/* ---------------------------------------------------- best-fit hint */

/** Plain-language nudge: which common platforms the text currently fits. */
export function bestFitHint(c: CountResult, sms: SmsInfo): string {
  if (c.chars === 0) return 'Paste or type some text to see where it fits.';
  const pills = evaluateLimits(c);
  const fits = pills.filter((p) => p.status !== 'over').map((p) => p.label);
  const tooLong = pills.filter((p) => p.status === 'over').map((p) => p.label);
  const parts: string[] = [];
  if (fits.length) parts.push(`Fits ${fits.slice(0, 3).join(', ')}`);
  if (sms.segments > 1) parts.push(`needs ${sms.segments} SMS segments`);
  if (tooLong.length) parts.push(`too long for ${tooLong.slice(0, 2).join(', ')}`);
  return parts.length ? parts.join(' · ') : 'Fits every common platform.';
}

/* ---------------------------------------------------- summary export */

/** Build a plain-text stats summary (for the "copy summary" button). */
export function statsSummary(text: string): string {
  const c = count(text);
  const read = readingTime(c.words, WPM_PRESETS.normal);
  const speak = readingTime(c.words, SPEAKING_WPM);
  return [
    `Words: ${c.words}`,
    `Characters: ${c.chars} (${c.charsNoSpaces} without spaces)`,
    `Sentences: ${c.sentences}`,
    `Paragraphs: ${c.paragraphs}`,
    `Lines: ${c.lines}`,
    `Reading time: ${read.label}`,
    `Speaking time: ${speak.label}`,
  ].join('\n');
}

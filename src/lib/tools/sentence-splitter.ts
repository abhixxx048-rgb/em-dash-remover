/**
 * Sentence Splitter - pure client-side segmentation engine.
 *
 * Design goals (see docs/tools/sentence-splitter.md):
 *  - Split prose into one sentence per line *correctly*. The hard part is that a
 *    period can end a sentence, an abbreviation (Dr.), a decimal (3.14), an
 *    initial (J. R. R.), an ellipsis, or a URL/email - and only one of those is a
 *    real boundary.
 *  - Use the browser's built-in `Intl.Segmenter` (granularity: 'sentence') as the
 *    base tokenizer where available, because it is UAX #29-based and Baseline
 *    across modern browsers. UAX #29 is intentionally NOT abbreviation-aware, so
 *    we layer a deterministic POST-MERGE pass that re-joins segments split on a
 *    known non-boundary period (abbreviations, initials, decimals, URLs).
 *  - Provide a regex fallback segmenter (same merge logic) for old browsers.
 *  - A cadence audit: per-sentence word counts, length bands, and a monotony
 *    score derived from the standard deviation of sentence lengths.
 *  - 100% in-browser. Nothing here touches the network or the DOM.
 */

export type OutputMode = 'plain' | 'numbered' | 'csv' | 'markdown';

/** Word-count bands used for cadence color-coding (never color-only in the UI). */
export type LengthBand = 'short' | 'medium' | 'long' | 'veryLong';

export interface SplitOptions {
  /** Keep a blank line between source paragraphs so structure isn't flattened. */
  preserveParagraphs: boolean;
  /** Extra user abbreviations (without the trailing period), e.g. ["Fig", "Eq"]. */
  customAbbreviations: string[];
}

export const DEFAULT_OPTIONS: SplitOptions = {
  preserveParagraphs: true,
  customAbbreviations: [],
};

export interface Sentence {
  /** The trimmed sentence text. */
  text: string;
  /** Word count for this sentence. */
  words: number;
  /** Length band derived from `words`. */
  band: LengthBand;
  /** True when this entry is a paragraph separator (blank line), not a sentence. */
  isBreak?: boolean;
}

export interface CadenceStats {
  sentences: number;
  words: number;
  /** Average words per sentence (rounded to 1 decimal). */
  avgWords: number;
  /** Longest sentence by word count (index into the non-break sentence list). */
  longest: { index: number; words: number } | null;
  shortest: { index: number; words: number } | null;
  /** Share of sentences in each band, 0-100, rounded. */
  pctShort: number;
  pctMedium: number;
  pctLong: number;
  /** Population standard deviation of sentence word counts. */
  stdDev: number;
  /** 0-100 monotony score (higher = more uniform = more robotic). */
  monotony: number;
  /** Plain label for the monotony score. */
  monotonyLabel: string;
}

export interface SplitResult {
  /** Sentences in document order, possibly interleaved with paragraph breaks. */
  sentences: Sentence[];
  /** Cadence statistics computed over the real (non-break) sentences. */
  stats: CadenceStats;
  /** True when no terminal punctuation was found (treated as one sentence). */
  noBoundaries: boolean;
}

// --- Band thresholds (word counts). Short ≤8, medium 9-20, long 21-35, 36+ very long.
const BAND_SHORT_MAX = 8;
const BAND_MEDIUM_MAX = 20;
const BAND_LONG_MAX = 35;

/** Map a word count to its cadence band. */
export function bandFor(words: number): LengthBand {
  if (words <= BAND_SHORT_MAX) return 'short';
  if (words <= BAND_MEDIUM_MAX) return 'medium';
  if (words <= BAND_LONG_MAX) return 'long';
  return 'veryLong';
}

/** Human-readable band label (used for aria-labels so it's never color-only). */
export function bandLabel(band: LengthBand): string {
  switch (band) {
    case 'short': return 'short';
    case 'medium': return 'medium';
    case 'long': return 'long';
    case 'veryLong': return 'very long';
  }
}

/** Count words in a chunk of text (whitespace-delimited, ignoring empties). */
export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

// --- Built-in suppression list: tokens that, when they end a segment with a
// trailing period, indicate a NON-boundary so we merge forward. Matched
// case-sensitively against the final token of a segment (per the spec).
const BASE_ABBREVIATIONS = [
  // Titles
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'St', 'Mt', 'Gov', 'Sen', 'Rep', 'Gen', 'Capt', 'Lt', 'Col', 'Sgt',
  // Business / org
  'Inc', 'Ltd', 'Co', 'Corp', 'LLC', 'Dept', 'Univ', 'Assn', 'Bros',
  // Latin / editorial
  'e.g', 'i.e', 'etc', 'vs', 'cf', 'al', 'viz', 'ibid', 'op', 'cit', 'nb',
  // Units / time / reference
  'a.m', 'p.m', 'No', 'Vol', 'pp', 'Fig', 'Eq', 'Ch', 'Sec', 'p',
  // Academic degrees
  'Ph.D', 'B.A', 'M.A', 'M.D', 'B.S', 'M.S', 'Ed',
  // Geographic / address
  'U.S', 'U.K', 'U.N', 'E.U', 'D.C', 'Ave', 'Blvd', 'Rd', 'Apt',
  // Month abbreviations
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec',
];

/**
 * Build a Set of normalized abbreviation tokens (lowercased, periods stripped)
 * from the base list plus any user-supplied extras. We compare the *final token*
 * of a segment against this set; multi-period abbreviations like "e.g" are stored
 * with internal periods removed ("eg") and the token is normalized the same way.
 */
function buildAbbrevSet(custom: string[]): Set<string> {
  const set = new Set<string>();
  for (const a of BASE_ABBREVIATIONS) set.add(normalizeAbbrev(a));
  for (const a of custom) {
    const n = normalizeAbbrev(a);
    if (n) set.add(n);
  }
  return set;
}

/** Normalize an abbreviation/token for comparison: drop periods, lowercase. */
function normalizeAbbrev(token: string): string {
  return token.replace(/\./g, '').toLowerCase();
}

// Lightweight URL / email detectors (used to avoid splitting inside them).
const URL_TAIL = /(https?:\/\/|www\.)\S*$/i;
const EMAIL_TAIL = /[\w.+-]+@[\w-]+\.\w*$/;

/**
 * Decide whether `segment` should be MERGED with the segment that follows it,
 * i.e. the period that ended it is a non-boundary. Returns true to merge.
 */
function shouldMergeForward(segment: string, abbrev: Set<string>): boolean {
  const trimmed = segment.replace(/\s+$/, '');
  if (!trimmed) return false;

  // Only periods cause the abbreviation ambiguity; if the segment ends in ! or ?
  // (optionally followed by a closing quote/bracket) it's a real boundary.
  const last = trimmed[trimmed.length - 1];
  const closer = last === '"' || last === "'" || last === ')' || last === ']' || last === '”' || last === '’';
  const effectiveEnd = closer ? trimmed.slice(0, -1).replace(/\s+$/, '') : trimmed;
  if (!effectiveEnd.endsWith('.')) {
    // Ellipsis (… char) is handled separately below; otherwise non-period ends
    // are treated as real boundaries.
    if (effectiveEnd.endsWith('…')) return true; // keep ellipsis attached conservatively
    return false;
  }

  // URL / email at the very end → never split inside it.
  if (URL_TAIL.test(effectiveEnd) || EMAIL_TAIL.test(effectiveEnd)) return true;

  // Spaced ellipsis ". . ." → conservatively keep together.
  if (/\.\s\.\s\.$/.test(effectiveEnd)) return true;

  // Decimal / currency / version: a digit immediately before the final period's
  // group, e.g. "3.14", "$1,000.50", "v1.2.3" - the trailing "." here is rare,
  // but guard digit-period-digit runs ending the segment.
  if (/\d\.\d[\d.]*\.?$/.test(effectiveEnd)) return true;

  // Grab the final whitespace-delimited token (e.g. "Dr." or "e.g.").
  const tokenMatch = effectiveEnd.match(/(\S+)$/);
  if (!tokenMatch) return false;
  const token = tokenMatch[1];

  // Single uppercase initial: "J." → merge forward (e.g. "J. R. R. Tolkien").
  if (/^[A-Z]\.$/.test(token)) return true;

  // Known abbreviation? Normalize the token (strip periods, lowercase) and look
  // it up. This catches "Dr.", "e.g.", "U.S.", "Ph.D.", etc.
  const normalized = normalizeAbbrev(token);
  if (abbrev.has(normalized)) return true;

  return false;
}

/**
 * Base tokenizer using Intl.Segmenter when available, else a regex splitter.
 * Returns raw (untrimmed) segments in document order so offsets stay sane.
 */
function baseSegments(text: string): string[] {
  // Feature-detect Intl.Segmenter with sentence granularity.
  const hasSegmenter =
    typeof Intl !== 'undefined' &&
    typeof (Intl as unknown as { Segmenter?: unknown }).Segmenter !== 'undefined';

  if (hasSegmenter) {
    try {
      // Use the user's locale where available; default otherwise.
      const locale =
        (typeof navigator !== 'undefined' && navigator.language) || 'en';
      const seg = new Intl.Segmenter(locale, { granularity: 'sentence' });
      const out: string[] = [];
      for (const part of seg.segment(text)) out.push(part.segment);
      return out;
    } catch {
      // fall through to regex
    }
  }

  // Fallback: split after sentence-ending punctuation followed by whitespace and
  // a capital/quote/bracket. Keep the delimiter with the preceding sentence.
  const out: string[] = [];
  const re = /[^.!?]*[.!?]+["')\]”’]?\s+|[^.!?]+$/g;
  let m: RegExpExecArray | null;
  let consumed = 0;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) { re.lastIndex++; continue; }
    out.push(m[0]);
    consumed += m[0].length;
  }
  if (consumed < text.length) out.push(text.slice(consumed));
  return out.length ? out : [text];
}

/**
 * Run the base tokenizer + suppression merge pass over a single paragraph and
 * return trimmed sentence strings. Empty input yields an empty array.
 */
function splitParagraph(paragraph: string, abbrev: Set<string>): string[] {
  if (!paragraph.trim()) return [];

  const segments = baseSegments(paragraph);
  const merged: string[] = [];
  let buffer = '';

  for (let i = 0; i < segments.length; i++) {
    buffer += segments[i];
    // If this segment ends on a non-boundary AND there's a next segment to join,
    // keep accumulating; otherwise flush the buffer as one sentence.
    const hasNext = i < segments.length - 1;
    if (hasNext && shouldMergeForward(segments[i], abbrev)) {
      continue;
    }
    const t = buffer.trim();
    if (t) merged.push(t);
    buffer = '';
  }
  // Flush any trailing buffer (e.g. a fragment with no terminal punctuation).
  const tail = buffer.trim();
  if (tail) merged.push(tail);

  return merged;
}

/** Standard-deviation-based monotony score (0-100; higher = more uniform). */
function monotonyFrom(stdDev: number, mean: number): { score: number; label: string } {
  if (mean <= 0) return { score: 0, label: 'Not enough text' };
  // Coefficient of variation: stdDev relative to mean length. Human prose tends
  // to have CV around 0.5-0.8; very uniform AI/robotic text trends much lower.
  const cv = stdDev / mean;
  // Map CV → monotony: cv >= 0.7 ⇒ 0 (varied), cv <= 0.15 ⇒ 100 (uniform).
  const clamped = Math.max(0.15, Math.min(0.7, cv));
  const score = Math.round(((0.7 - clamped) / (0.7 - 0.15)) * 100);
  let label: string;
  if (score < 35) label = 'Varied ✓';
  else if (score < 65) label = 'Somewhat uniform';
  else label = 'Uniform - vary your lengths';
  return { score, label };
}

/** Compute cadence stats over the real (non-break) sentences. */
function computeStats(sentences: Sentence[]): CadenceStats {
  const real = sentences.filter((s) => !s.isBreak);
  const counts = real.map((s) => s.words);
  const n = counts.length;
  const totalWords = counts.reduce((a, b) => a + b, 0);

  if (n === 0) {
    return {
      sentences: 0, words: 0, avgWords: 0,
      longest: null, shortest: null,
      pctShort: 0, pctMedium: 0, pctLong: 0,
      stdDev: 0, monotony: 0, monotonyLabel: 'Not enough text',
    };
  }

  const mean = totalWords / n;
  const variance = counts.reduce((a, w) => a + (w - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Longest / shortest by word count (first match wins on ties).
  let longest = { index: 0, words: counts[0] };
  let shortest = { index: 0, words: counts[0] };
  counts.forEach((w, i) => {
    if (w > longest.words) longest = { index: i, words: w };
    if (w < shortest.words) shortest = { index: i, words: w };
  });

  const shortN = real.filter((s) => s.band === 'short').length;
  const mediumN = real.filter((s) => s.band === 'medium').length;
  const longN = n - shortN - mediumN; // long + veryLong

  const { score: monotony, label: monotonyLabel } = monotonyFrom(stdDev, mean);

  return {
    sentences: n,
    words: totalWords,
    avgWords: Math.round((mean) * 10) / 10,
    longest,
    shortest,
    pctShort: Math.round((shortN / n) * 100),
    pctMedium: Math.round((mediumN / n) * 100),
    pctLong: Math.round((longN / n) * 100),
    stdDev: Math.round(stdDev * 10) / 10,
    monotony,
    monotonyLabel,
  };
}

/**
 * MAIN ENTRY: split `input` into one sentence per line with cadence stats.
 * Deterministic; safe on empty / fragment / giant input.
 */
export function split(input: string, opts: SplitOptions = DEFAULT_OPTIONS): SplitResult {
  const abbrev = buildAbbrevSet(opts.customAbbreviations);

  // Split into source paragraphs on blank lines so we can optionally preserve
  // structure. A "paragraph" is any run of text separated by 1+ blank lines.
  const rawParagraphs = input.split(/\n[ \t]*\n+/);

  const sentences: Sentence[] = [];
  let totalSegments = 0;
  let anyTerminal = false;

  rawParagraphs.forEach((para, pIdx) => {
    if (pIdx > 0 && opts.preserveParagraphs) {
      // Only emit a break if we've already added real content and this paragraph
      // is non-empty, to avoid leading/trailing blank lines.
      if (sentences.some((s) => !s.isBreak) && para.trim()) {
        sentences.push({ text: '', words: 0, band: 'short', isBreak: true });
      }
    }
    const parts = splitParagraph(para, abbrev);
    totalSegments += parts.length;
    for (const p of parts) {
      if (/[.!?…]["')\]”’]?$/.test(p)) anyTerminal = true;
      const words = countWords(p);
      sentences.push({ text: p, words, band: bandFor(words) });
    }
  });

  const real = sentences.filter((s) => !s.isBreak);
  // "No boundaries" = exactly one resulting sentence and no terminal punctuation.
  const noBoundaries = real.length <= 1 && !anyTerminal && input.trim().length > 0;

  const stats = computeStats(sentences);
  return { sentences, stats, noBoundaries };
}

/**
 * Render the split result to text in the requested output mode. The result maps
 * one sentence per line; paragraph breaks become blank lines (plain/numbered/
 * markdown) or are skipped (csv).
 */
export function render(result: SplitResult, mode: OutputMode = 'plain'): string {
  const lines: string[] = [];
  let n = 0;

  if (mode === 'csv') {
    lines.push('sentence,words');
    for (const s of result.sentences) {
      if (s.isBreak) continue;
      lines.push(`${csvEscape(s.text)},${s.words}`);
    }
    return lines.join('\n');
  }

  for (const s of result.sentences) {
    if (s.isBreak) { lines.push(''); continue; }
    n++;
    if (mode === 'numbered') lines.push(`${n}. ${s.text}`);
    else if (mode === 'markdown') lines.push(`- ${s.text}`);
    else lines.push(s.text);
  }
  return lines.join('\n');
}

/** Escape a field for CSV output (quote if it contains comma/quote/newline). */
function csvEscape(field: string): string {
  if (/[",\n]/.test(field)) return `"${field.replace(/"/g, '""')}"`;
  return field;
}

/**
 * Reverse the operation: re-join one-sentence-per-line output back into flowing
 * paragraphs (blank lines separate paragraphs). Useful for the "rejoin" feature.
 */
export function rejoin(result: SplitResult): string {
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const s of result.sentences) {
    if (s.isBreak) {
      if (current.length) paragraphs.push(current.join(' '));
      current = [];
      continue;
    }
    current.push(s.text);
  }
  if (current.length) paragraphs.push(current.join(' '));
  return paragraphs.join('\n\n');
}

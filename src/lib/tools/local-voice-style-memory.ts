/**
 * Local Voice / Style Memory - pure client-side stylometry engine.
 *
 * Design goals (see docs/tools/local-voice-style-memory.md):
 *  - Build a private "style fingerprint" from samples of a user's own writing:
 *    sentence length (mean/SD/burstiness), contraction rate, lexical diversity
 *    (TTR + MATTR + Yule's K), a function-word frequency vector, punctuation
 *    frequencies, and structure (paragraph/word length, Flesch baseline).
 *  - Score a new draft as a 0-100 "sounds-like-you" match against that
 *    fingerprint, with a per-feature z-score breakdown and offset-aware flags
 *    for the concrete off-voice spans.
 *  - 100% in-browser. NO DOM, NO network, NO new dependencies. The persistence
 *    layer (IndexedDB/localStorage) lives in the component; this module only
 *    knows pure data structures so the same input always gives the same output.
 *
 * Framing is "bias toward your own voice," never "beat a detector."
 */

// ---------------------------------------------------------------------------
// Versioning - persisted profiles carry these so future metric changes can
// re-derive or invalidate old fingerprints cleanly.
// ---------------------------------------------------------------------------

/** Bump when the stored profile SHAPE changes. */
export const SCHEMA_VERSION = 1;
/** Bump when the FEATURE math changes (so old vectors can be re-derived). */
export const EXTRACTOR_VERSION = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The raw stylometric feature vector extracted from text. */
export interface Features {
  /** Mean sentence length in words. */
  sentLenMean: number;
  /** Standard deviation of sentence length in words. */
  sentLenSd: number;
  /** Coefficient of variation of sentence length (SD/mean) - "burstiness". */
  sentLenCv: number;
  /** Contractions ÷ expansion opportunities, 0..1. */
  contractionRate: number;
  /** Type-token ratio (unique words ÷ total words), 0..1. */
  ttr: number;
  /** Moving-average TTR over a fixed window - length-robust diversity, 0..1. */
  mattr: number;
  /** Yule's K richness (lower = richer vocabulary). */
  yuleK: number;
  /** Mean word length in characters. */
  wordLenMean: number;
  /** Mean syllables per word. */
  syllablesPerWord: number;
  /** Flesch Reading Ease baseline (0-100, higher = easier). */
  fleschEase: number;
  /** Mean paragraph length in words. */
  paraLenMean: number;
  /** Punctuation marks per 1000 words (commas, semicolons, etc.). */
  punct: PunctProfile;
  /** Normalized function-word frequency vector (sums to ~1). */
  funcWords: number[];
}

/** Punctuation frequencies, expressed per 1000 words. */
export interface PunctProfile {
  comma: number;
  semicolon: number;
  colon: number;
  emDash: number;
  enDash: number;
  ellipsis: number;
  parenthesis: number;
  exclamation: number;
  question: number;
}

/** Sample-level bookkeeping shown in the adequacy meter. */
export interface SampleStats {
  sampleCount: number;
  wordCount: number;
  sentenceCount: number;
}

/** A complete, persistable style profile (value stored in IndexedDB). */
export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  schemaVersion: number;
  extractorVersion: number;
  features: Features;
  /** Per-feature spread used for z-scoring (mean is in `features`). */
  spread: ProfileSpread;
  sampleStats: SampleStats;
  /** True when samples are too short/few for a reliable fingerprint. */
  lowConfidence: boolean;
  /** Local history of recent match scores (sparkline / trend). */
  lastMatchScores: number[];
}

/**
 * Per-feature standard deviations, derived across the individual samples used
 * to build the profile. These are the "your own SDs" a draft is measured
 * against. When only one sample exists we fall back to sensible defaults so a
 * z-score is never divided by zero.
 */
export interface ProfileSpread {
  sentLenMean: number;
  contractionRate: number;
  mattr: number;
  yuleK: number;
  wordLenMean: number;
  fleschEase: number;
}

/** One off-voice finding with offsets back into the draft. */
export interface Flag {
  /** Stable category key (also used for color + icon mapping in the UI). */
  kind: 'long-sentence' | 'short-sentence' | 'expanded-contraction' | 'off-punct';
  /** Character offset into the draft. */
  start: number;
  /** End offset (exclusive). */
  end: number;
  /** The offending text span. */
  text: string;
  /** Plain-English, profile-derived reason. */
  reason: string;
  /** Optional click-to-apply nudge that moves toward the profile. */
  suggestion?: { replace: string; with: string };
}

/** One row of the "you vs. this draft" per-feature comparison. */
export interface FeatureDelta {
  label: string;
  /** Profile (your) value, already formatted for display. */
  you: string;
  /** Draft value, already formatted for display. */
  draft: string;
  /** Signed z-score (how many of YOUR SDs the draft is away). */
  z: number;
  /** Absolute z, capped - drives "how off" sorting and the bar width. */
  severity: number;
}

/** Full result of scanning a draft against a profile. */
export interface ScanResult {
  /** 0-100 "sounds-like-you" score (higher = more like you). */
  score: number;
  /** Band for color + verdict. */
  band: 'you' | 'drifting' | 'model';
  /** One-line plain verdict. */
  verdict: string;
  /** Top-deviating features first. */
  deltas: FeatureDelta[];
  /** Offset-aware off-voice spans. */
  flags: Flag[];
  draftFeatures: Features;
  draftStats: SampleStats;
}

// ---------------------------------------------------------------------------
// Tokenization (mirrors readability-grade-level-scorer.ts so the suite agrees)
// ---------------------------------------------------------------------------

// Zero-width & invisible characters frequently left in AI / web-copied text.
// Mirrors cleaner.ts INVISIBLES so pasted AI text does not skew the counts.
const INVISIBLES = /[​‌‍⁠﻿­‎‏‪-‮⁡-⁤]/g;

// Abbreviations whose trailing period must NOT end a sentence.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'inc',
  'ltd', 'co', 'corp', 'dept', 'est', 'fig', 'no', 'vol', 'pp', 'ed',
  'i.e', 'e.g', 'a.m', 'p.m', 'u.s', 'u.k', 'ph.d', 'd.c',
]);

/** Strip invisible characters before any counting. */
function preclean(input: string): string {
  return input.replace(INVISIBLES, '');
}

/**
 * Split text into sentences with original character offsets. Prefers the native
 * Intl.Segmenter and falls back to a regex splitter with an abbreviation guard.
 */
export function splitSentences(text: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const seg = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
      for (const part of seg.segment(text)) {
        const raw: string = part.segment;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const start = part.index + (raw.length - raw.trimStart().length);
        out.push({ text: trimmed, start, end: start + trimmed.length });
      }
      return mergeAbbreviations(out);
    } catch {
      /* fall through */
    }
  }

  const re = /[^.!?…]+[.!?…]+(?:["'”’)\]]+)?|\s*[^.!?…]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const start = m.index + (raw.length - raw.trimStart().length);
    out.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return mergeAbbreviations(out);
}

/** Re-glue sentences wrongly split after a known abbreviation / decimal / initial. */
function mergeAbbreviations(spans: { text: string; start: number; end: number }[]) {
  const merged: { text: string; start: number; end: number }[] = [];
  for (const s of spans) {
    const prev = merged[merged.length - 1];
    if (prev) {
      const lastWord = prev.text.split(/\s+/).pop() || '';
      const stripped = lastWord.replace(/[.]$/, '').toLowerCase();
      const endsDecimal = /\d\.$/.test(prev.text);
      const singleInitial = /\b[A-Z]\.$/.test(prev.text);
      if (
        ABBREVIATIONS.has(stripped) ||
        ABBREVIATIONS.has(lastWord.toLowerCase().replace(/\.$/, '')) ||
        endsDecimal ||
        singleInitial
      ) {
        prev.text = (prev.text + ' ' + s.text).trim();
        prev.end = s.end;
        continue;
      }
    }
    merged.push({ ...s });
  }
  return merged;
}

/** Extract lowercase word tokens (Unicode letters + internal apostrophes/hyphens). */
export function splitWords(text: string): string[] {
  const matches = text.match(/\p{L}[\p{L}\p{M}'’-]*/gu);
  return matches ? matches.filter((w) => /\p{L}/u.test(w)).map((w) => w.toLowerCase()) : [];
}

// ---------------------------------------------------------------------------
// Syllable counting (no-dependency heuristic, mirrors the Readability scorer)
// ---------------------------------------------------------------------------

const SYLLABLE_EXCEPTIONS: Record<string, number> = {
  every: 2, business: 2, people: 2, fire: 1, hour: 1, our: 1, area: 3,
  february: 4, idea: 3, real: 1, being: 2, create: 2, science: 2,
  poem: 2, quiet: 2, simile: 3, mobile: 2, queue: 1, colonel: 2,
  wednesday: 2, choir: 1, aisle: 1,
};

const _syllableCache = new Map<string, number>();

/** Estimate the syllable count of an English word (vowel-group heuristic). */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const cached = _syllableCache.get(w);
  if (cached !== undefined) return cached;

  let count: number;
  if (SYLLABLE_EXCEPTIONS[w] !== undefined) {
    count = SYLLABLE_EXCEPTIONS[w];
  } else {
    let s = w;
    if (/[^aeiouy]le$/.test(s)) {
      /* keep "consonant + le" (table, little) */
    } else {
      s = s.replace(/e$/, '');
    }
    s = s.replace(/^y/, '');
    const groups = s.match(/[aeiouy]+/g);
    count = groups ? groups.length : 1;
    if (count < 1) count = 1;
  }
  _syllableCache.set(w, count);
  return count;
}

// ---------------------------------------------------------------------------
// Function-word list - the stylometric workhorse. These are unconscious and
// topic-independent, so they characterize an author far better than content
// words. (A pragmatic ~120-word English set.)
// ---------------------------------------------------------------------------

export const FUNCTION_WORDS: string[] = [
  'the', 'a', 'an', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'if', 'then', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'on', 'in', 'to', 'from', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
  'his', 'its', 'our', 'their', 'mine', 'yours', 'who', 'whom',
  'whose', 'which', 'what', 'is', 'am', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'not', 'no', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too',
  'very', 'just', 'now', 'here', 'there', 'when', 'where', 'why',
  'how', 'also', 'however', 'therefore',
];

const FUNCTION_INDEX: Map<string, number> = new Map(
  FUNCTION_WORDS.map((w, i) => [w, i]),
);

// Contractions we expect a contraction-heavy writer to use, mapped to the
// expanded form an AI tool would likely produce. Used both to count the
// contraction rate and to drive "you'd usually contract this" suggestions.
const CONTRACTIONS: { full: RegExp; short: string }[] = [
  { full: /\bit is\b/gi, short: "it's" },
  { full: /\bthat is\b/gi, short: "that's" },
  { full: /\bthere is\b/gi, short: "there's" },
  { full: /\bdo not\b/gi, short: "don't" },
  { full: /\bdoes not\b/gi, short: "doesn't" },
  { full: /\bdid not\b/gi, short: "didn't" },
  { full: /\bis not\b/gi, short: "isn't" },
  { full: /\bare not\b/gi, short: "aren't" },
  { full: /\bwas not\b/gi, short: "wasn't" },
  { full: /\bwere not\b/gi, short: "weren't" },
  { full: /\bcannot\b|\bcan not\b/gi, short: "can't" },
  { full: /\bwill not\b/gi, short: "won't" },
  { full: /\bwould not\b/gi, short: "wouldn't" },
  { full: /\bshould not\b/gi, short: "shouldn't" },
  { full: /\bcould not\b/gi, short: "couldn't" },
  { full: /\bhave not\b/gi, short: "haven't" },
  { full: /\bhas not\b/gi, short: "hasn't" },
  { full: /\bI am\b/g, short: "I'm" },
  { full: /\byou are\b/gi, short: "you're" },
  { full: /\bwe are\b/gi, short: "we're" },
  { full: /\bthey are\b/gi, short: "they're" },
  { full: /\bI will\b/gi, short: "I'll" },
  { full: /\bI have\b/gi, short: "I've" },
  { full: /\bwould have\b/gi, short: "would've" },
];

// A small list of stiff/AI-favored words paired with a plainer everyday twin.
// Only flagged when the profile clearly never reaches for the formal word.
const PLAINER: Record<string, string> = {
  utilize: 'use', utilizes: 'uses', utilizing: 'using', utilized: 'used',
  leverage: 'use', leverages: 'uses', leveraging: 'using',
  facilitate: 'help', facilitates: 'helps',
  commence: 'start', commences: 'starts', commenced: 'started',
  endeavor: 'try', endeavour: 'try',
  ascertain: 'find out', additional: 'more',
  numerous: 'many', purchase: 'buy', obtain: 'get',
  furthermore: 'also', moreover: 'also', subsequently: 'then',
  approximately: 'about', sufficient: 'enough', demonstrate: 'show',
};

// ---------------------------------------------------------------------------
// Small statistics helpers
// ---------------------------------------------------------------------------

function div(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Population standard deviation. */
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---------------------------------------------------------------------------
// Feature extraction
// ---------------------------------------------------------------------------

/** Count contractions present and the expansion opportunities, → a 0..1 rate. */
function contractionRate(text: string): number {
  // Already-contracted forms (straight or curly apostrophe).
  const contracted = (text.match(/\b\w+['’](t|s|re|ve|ll|d|m)\b/gi) || []).length;
  // Expansion opportunities the writer COULD have contracted.
  let opportunities = contracted;
  for (const c of CONTRACTIONS) {
    opportunities += (text.match(c.full) || []).length;
  }
  return opportunities === 0 ? 0 : clamp(contracted / opportunities, 0, 1);
}

/** Moving-average type-token ratio over a fixed window (default 50 words). */
function mattr(words: string[], window = 50): number {
  if (words.length === 0) return 0;
  if (words.length <= window) {
    return div(new Set(words).size, words.length);
  }
  let total = 0;
  let n = 0;
  for (let i = 0; i + window <= words.length; i++) {
    const slice = words.slice(i, i + window);
    total += new Set(slice).size / window;
    n++;
  }
  return div(total, n);
}

/**
 * Yule's K - a length-stable richness measure based on the frequency spectrum.
 * K = 10000 * (Σ_i i² V_i − N) / N², where V_i is the number of word types that
 * occur i times and N is the token count. Lower K = richer vocabulary.
 */
function yuleK(words: string[]): number {
  const N = words.length;
  if (N === 0) return 0;
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  // V_i: count of types occurring exactly i times.
  const spectrum = new Map<number, number>();
  for (const c of freq.values()) spectrum.set(c, (spectrum.get(c) || 0) + 1);
  let sum = 0;
  for (const [i, Vi] of spectrum) sum += i * i * Vi;
  return round1((10000 * (sum - N)) / (N * N));
}

/** Build the punctuation-per-1000-words profile. */
function punctProfile(text: string, words: number): PunctProfile {
  const per1000 = (count: number) => (words === 0 ? 0 : round1((count / words) * 1000));
  return {
    comma: per1000((text.match(/,/g) || []).length),
    semicolon: per1000((text.match(/;/g) || []).length),
    colon: per1000((text.match(/:/g) || []).length),
    emDash: per1000((text.match(/-/g) || []).length),
    enDash: per1000((text.match(/–/g) || []).length),
    ellipsis: per1000((text.match(/…|\.\.\./g) || []).length),
    parenthesis: per1000((text.match(/[()]/g) || []).length),
    exclamation: per1000((text.match(/!/g) || []).length),
    question: per1000((text.match(/\?/g) || []).length),
  };
}

/** Normalized function-word frequency vector (sums to ~1 when any present). */
function functionVector(words: string[]): number[] {
  const vec = new Array(FUNCTION_WORDS.length).fill(0);
  let total = 0;
  for (const w of words) {
    const idx = FUNCTION_INDEX.get(w);
    if (idx !== undefined) {
      vec[idx]++;
      total++;
    }
  }
  if (total > 0) for (let i = 0; i < vec.length; i++) vec[i] /= total;
  return vec;
}

/**
 * Extract the full feature vector from a block of text.
 * Deterministic: same input → same output.
 */
export function extractFeatures(input: string): { features: Features; stats: SampleStats } {
  const text = preclean(input);
  const sentences = splitSentences(text);
  const sentLens = sentences.map((s) => splitWords(s.text).length).filter((n) => n > 0);
  const words = splitWords(text);

  // Sentence-length distribution.
  const sentLenMean = mean(sentLens);
  const sentLenSd = stdev(sentLens);
  const sentLenCv = sentLenMean === 0 ? 0 : sentLenSd / sentLenMean;

  // Lexical diversity.
  const ttr = div(new Set(words).size, words.length);

  // Word / syllable / Flesch baseline.
  let syllables = 0;
  let charTotal = 0;
  for (const w of words) {
    syllables += countSyllables(w);
    charTotal += w.length;
  }
  const wordLenMean = div(charTotal, words.length);
  const syllablesPerWord = div(syllables, words.length);
  const wps = div(words.length, Math.max(1, sentences.length));
  const fleschEase = clamp(206.835 - 1.015 * wps - 84.6 * syllablesPerWord, 0, 100);

  // Paragraph structure.
  const paras = text.split(/\n\s*\n/).map((p) => splitWords(p).length).filter((n) => n > 0);
  const paraLenMean = mean(paras);

  const features: Features = {
    sentLenMean: round1(sentLenMean),
    sentLenSd: round1(sentLenSd),
    sentLenCv: round1(sentLenCv * 100) / 100,
    contractionRate: round1(contractionRate(text) * 100) / 100,
    ttr: round1(ttr * 100) / 100,
    mattr: round1(mattr(words) * 100) / 100,
    yuleK: yuleK(words),
    wordLenMean: round1(wordLenMean),
    syllablesPerWord: round1(syllablesPerWord * 100) / 100,
    fleschEase: round1(fleschEase),
    paraLenMean: round1(paraLenMean),
    punct: punctProfile(text, words.length),
    funcWords: functionVector(words),
  };

  const stats: SampleStats = {
    sampleCount: 1,
    wordCount: words.length,
    sentenceCount: sentences.length,
  };

  return { features, stats };
}

// ---------------------------------------------------------------------------
// Profile building
// ---------------------------------------------------------------------------

let _idCounter = 0;
/** Stable-ish unique id without any crypto dependency. */
export function makeId(): string {
  _idCounter++;
  return `p_${Date.now().toString(36)}_${(_idCounter).toString(36)}`;
}

// Sensible default spreads (in feature units) when a writer gives only one
// sample, so a single-sample profile still produces non-degenerate z-scores.
const DEFAULT_SPREAD: ProfileSpread = {
  sentLenMean: 3,
  contractionRate: 0.12,
  mattr: 0.06,
  yuleK: 25,
  wordLenMean: 0.4,
  fleschEase: 8,
};

const MIN_WORDS_RELIABLE = 300;
const MIN_SAMPLES_RELIABLE = 2;

/**
 * Build a profile from one or more writing samples. The combined text drives
 * the central feature vector; the per-sample spread drives z-scoring.
 */
export function buildProfile(name: string, samples: string[]): Profile {
  const clean = samples.map((s) => s.trim()).filter(Boolean);
  const combined = clean.join('\n\n');
  const { features, stats } = extractFeatures(combined);
  stats.sampleCount = clean.length;

  // Per-sample features for spread estimation.
  const per = clean.map((s) => extractFeatures(s).features);
  const spreadFrom = (pick: (f: Features) => number, fallback: number) => {
    if (per.length < 2) return fallback;
    const sd = stdev(per.map(pick));
    return sd > 0 ? round1(sd * 100) / 100 : fallback;
  };

  const spread: ProfileSpread = {
    sentLenMean: spreadFrom((f) => f.sentLenMean, DEFAULT_SPREAD.sentLenMean),
    contractionRate: spreadFrom((f) => f.contractionRate, DEFAULT_SPREAD.contractionRate),
    mattr: spreadFrom((f) => f.mattr, DEFAULT_SPREAD.mattr),
    yuleK: spreadFrom((f) => f.yuleK, DEFAULT_SPREAD.yuleK),
    wordLenMean: spreadFrom((f) => f.wordLenMean, DEFAULT_SPREAD.wordLenMean),
    fleschEase: spreadFrom((f) => f.fleschEase, DEFAULT_SPREAD.fleschEase),
  };

  const lowConfidence =
    stats.wordCount < MIN_WORDS_RELIABLE || stats.sampleCount < MIN_SAMPLES_RELIABLE;

  return {
    id: makeId(),
    name: name.trim() || 'My voice',
    createdAt: Date.now(),
    schemaVersion: SCHEMA_VERSION,
    extractorVersion: EXTRACTOR_VERSION,
    features,
    spread,
    sampleStats: stats,
    lowConfidence,
    lastMatchScores: [],
  };
}

/**
 * A live "profile strength" read for the adequacy meter while building.
 * Returns 0..100 plus a friendly message.
 */
export function profileStrength(samples: string[]): { pct: number; words: number; samples: number; message: string } {
  const clean = samples.map((s) => s.trim()).filter(Boolean);
  const words = clean.reduce((n, s) => n + splitWords(s).length, 0);
  // Strength saturates around 3 samples / 600 words.
  const wordScore = clamp(words / 600, 0, 1);
  const sampleScore = clamp(clean.length / 3, 0, 1);
  const pct = Math.round(((wordScore * 0.7 + sampleScore * 0.3)) * 100);

  let message: string;
  if (words === 0) {
    message = 'Paste a few things you actually wrote to start your fingerprint.';
  } else if (words < MIN_WORDS_RELIABLE) {
    message = `Good start - ${clean.length} sample${clean.length === 1 ? '' : 's'}, ${words} words. Add more of your writing for a sharper fingerprint.`;
  } else if (clean.length < 3) {
    message = `Solid - ${clean.length} sample${clean.length === 1 ? '' : 's'}, ${words} words. One more sample sharpens it further.`;
  } else {
    message = `Strong fingerprint - ${clean.length} samples, ${words} words.`;
  }
  return { pct, words, samples: clean.length, message };
}

// ---------------------------------------------------------------------------
// Plain-English portrait
// ---------------------------------------------------------------------------

/** A friendly one-paragraph "here's how you write" description. */
export function describeProfile(p: Profile): string {
  const f = p.features;
  const len =
    f.sentLenMean < 13 ? 'short' : f.sentLenMean < 19 ? 'medium-length' : 'long';
  const variation = f.sentLenCv > 0.55 ? 'a lot of variation' : f.sentLenCv > 0.35 ? 'some variation' : 'fairly even rhythm';
  const contract =
    f.contractionRate >= 0.6 ? 'contract heavily' : f.contractionRate >= 0.3 ? 'contract sometimes' : 'rarely contract';
  const semi = f.punct.semicolon < 0.5 ? 'rarely use semicolons' : 'use semicolons freely';
  const dash = f.punct.emDash < 0.5 ? 'almost never use em dashes' : 'reach for em dashes';
  const vocab = f.fleschEase >= 60 ? 'plain, easy-to-read vocabulary' : 'denser, more formal vocabulary';

  return `You write ${len} sentences (${Math.round(f.sentLenMean)} words on average) with ${variation}, ${contract} (${Math.round(f.contractionRate * 100)}%), ${semi}, ${dash}, and lean on ${vocab}.`;
}

// ---------------------------------------------------------------------------
// Scoring a draft against a profile
// ---------------------------------------------------------------------------

/** Cosine distance (0 = identical direction, up to 2) between two vectors. */
function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 1;
  return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Format a numeric feature value for display in the comparison table. */
function fmt(kind: string, v: number): string {
  switch (kind) {
    case 'sentLenMean':
      return `${Math.round(v)} words`;
    case 'contractionRate':
      return `${Math.round(v * 100)}%`;
    case 'mattr':
      return `${Math.round(v * 100)}%`;
    case 'fleschEase':
      return `${Math.round(v)}/100`;
    case 'wordLenMean':
      return `${v.toFixed(1)} chars`;
    default:
      return `${v}`;
  }
}

/**
 * Score a draft against a profile and return a 0-100 match plus a per-feature
 * deviation breakdown and offset-aware off-voice flags.
 *
 * The score blends:
 *  - z-distance on the headline scalar features (sentence length, contraction
 *    rate, diversity, Flesch ease, word length), each measured in the writer's
 *    OWN standard deviations, and
 *  - cosine distance on the function-word and punctuation vectors.
 * It is mapped through a smooth, monotonic transform to 0-100.
 */
export function scanDraft(draft: string, profile: Profile): ScanResult {
  const { features: d, stats } = extractFeatures(draft);
  const p = profile.features;
  const sp = profile.spread;

  // z-scored scalar features → comparison rows.
  const rows: { kind: string; label: string; you: number; draft: number; sd: number }[] = [
    { kind: 'sentLenMean', label: 'Sentence length', you: p.sentLenMean, draft: d.sentLenMean, sd: sp.sentLenMean },
    { kind: 'contractionRate', label: 'Contraction rate', you: p.contractionRate, draft: d.contractionRate, sd: sp.contractionRate },
    { kind: 'mattr', label: 'Vocabulary variety', you: p.mattr, draft: d.mattr, sd: sp.mattr },
    { kind: 'fleschEase', label: 'Reading ease', you: p.fleschEase, draft: d.fleschEase, sd: sp.fleschEase },
    { kind: 'wordLenMean', label: 'Word length', you: p.wordLenMean, draft: d.wordLenMean, sd: sp.wordLenMean },
  ];

  const deltas: FeatureDelta[] = rows.map((r) => {
    const z = r.sd > 0 ? (r.draft - r.you) / r.sd : 0;
    return {
      label: r.label,
      you: fmt(r.kind, r.you),
      draft: fmt(r.kind, r.draft),
      z: round1(z),
      severity: round1(Math.min(4, Math.abs(z))),
    };
  });
  // Most-off features first.
  deltas.sort((a, b) => b.severity - a.severity);

  // Combine z-distances (averaged squared z, capped) with vector distances.
  const zPenalty = mean(rows.map((r) => {
    const z = r.sd > 0 ? (r.draft - r.you) / r.sd : 0;
    return Math.min(9, z * z); // cap each feature's contribution
  }));
  const funcDist = cosineDistance(p.funcWords, d.funcWords);
  const punctDist = punctDistance(p.punct, d.punct);

  // Weighted total distance → 0-100 (higher = more like you).
  const distance = zPenalty * 0.6 + funcDist * 6 + punctDist * 4;
  let score = Math.round(100 * Math.exp(-distance / 4));
  // Soften the score for low-confidence profiles - never present a shaky number
  // as fact. Pull it toward a neutral 60.
  if (profile.lowConfidence) score = Math.round(score * 0.7 + 60 * 0.3);
  score = clamp(score, 0, 100);

  const band: ScanResult['band'] = score >= 75 ? 'you' : score >= 50 ? 'drifting' : 'model';
  const verdict = buildVerdict(score, band, profile);

  return {
    score,
    band,
    verdict,
    deltas,
    flags: findFlags(draft, profile),
    draftFeatures: d,
    draftStats: stats,
  };
}

/** Normalized L1 distance between two punctuation profiles. */
function punctDistance(a: PunctProfile, b: PunctProfile): number {
  const keys: (keyof PunctProfile)[] = [
    'comma', 'semicolon', 'colon', 'emDash', 'enDash', 'ellipsis', 'parenthesis', 'exclamation', 'question',
  ];
  let sum = 0;
  for (const k of keys) {
    // Normalize each mark by a soft scale so a single rare mark can't dominate.
    sum += Math.abs(a[k] - b[k]) / (a[k] + b[k] + 8);
  }
  return sum / keys.length;
}

function buildVerdict(score: number, band: ScanResult['band'], p: Profile): string {
  const conf = p.lowConfidence ? ' (low-confidence profile - add more of your writing for a firmer read)' : '';
  if (band === 'you') return `This sounds like you - nice. Match ${score}/100.${conf}`;
  if (band === 'drifting') return `Drifting from your voice in a few places. Match ${score}/100 - the breakdown below shows where.${conf}`;
  return `This reads more like the model than like you. Match ${score}/100 - see the off-voice spots below.${conf}`;
}

// ---------------------------------------------------------------------------
// Offset-aware off-voice flags
// ---------------------------------------------------------------------------

const MAX_FLAGS = 60;

/**
 * Find concrete, offset-carrying off-voice spans in the draft:
 *  - sentences far longer/shorter than the writer's norm,
 *  - expanded contractions a contraction-heavy writer would normally shorten,
 *  - punctuation the profile essentially never uses (e.g. an em dash),
 *  - stiff vocabulary when the writer favors plain words.
 */
export function findFlags(draft: string, profile: Profile): Flag[] {
  const text = preclean(draft);
  const p = profile.features;
  const sp = profile.spread;
  const flags: Flag[] = [];

  // 1) Sentence length outliers (±2 of the writer's own SDs, min gap 6 words).
  const sentences = splitSentences(text);
  const sd = Math.max(sp.sentLenMean, 2);
  for (const s of sentences) {
    const wc = splitWords(s.text).length;
    if (wc < 3) continue;
    const z = (wc - p.sentLenMean) / sd;
    if (z >= 2 && wc - p.sentLenMean >= 6) {
      flags.push({
        kind: 'long-sentence',
        start: s.start,
        end: s.end,
        text: s.text,
        reason: `Your sentences average ${Math.round(p.sentLenMean)} words; this one is ${wc} - well above your range.`,
      });
    } else if (z <= -2 && p.sentLenMean - wc >= 6) {
      flags.push({
        kind: 'short-sentence',
        start: s.start,
        end: s.end,
        text: s.text,
        reason: `Much shorter than your usual ~${Math.round(p.sentLenMean)}-word sentences.`,
      });
    }
    if (flags.length >= MAX_FLAGS) return flags;
  }

  // 2) Expanded contractions - only when the writer clearly contracts a lot.
  if (p.contractionRate >= 0.4) {
    for (const c of CONTRACTIONS) {
      c.full.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = c.full.exec(text)) !== null) {
        flags.push({
          kind: 'expanded-contraction',
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          reason: `You'd usually contract this - try "${c.short}".`,
          suggestion: { replace: m[0], with: matchCase(m[0], c.short) },
        });
        if (m[0].length === 0) c.full.lastIndex++;
        if (flags.length >= MAX_FLAGS) return flags;
      }
    }
  }

  // 3) Punctuation the profile essentially never uses (em dash is the headline,
  //    and ties straight into the main Em Dash Remover tool).
  if (p.punct.emDash < 0.5) {
    const re = /-/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      flags.push({
        kind: 'off-punct',
        start: m.index,
        end: m.index + 1,
        text: '-',
        reason: 'Your writing essentially never uses em dashes - this one stands out. Clean it on the main Em Dash Remover.',
      });
      if (flags.length >= MAX_FLAGS) return flags;
    }
  }

  // 4) Stiff vocabulary swaps when the writer favors plain words.
  if (p.fleschEase >= 55) {
    const re = /\p{L}[\p{L}'’-]*/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const lower = m[0].toLowerCase();
      const plain = PLAINER[lower];
      if (plain) {
        flags.push({
          kind: 'off-punct',
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          reason: `You favor plain words - "${m[0]}" → "${plain}".`,
          suggestion: { replace: m[0], with: matchCase(m[0], plain) },
        });
        if (flags.length >= MAX_FLAGS) return flags;
      }
    }
  }

  // Sort by position so highlighting and "[ / ]" navigation are in reading order.
  flags.sort((a, b) => a.start - b.start);
  return flags;
}

/** Preserve leading capitalization when swapping a word/phrase. */
function matchCase(original: string, replacement: string): string {
  if (original.length === 0) return replacement;
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

// ---------------------------------------------------------------------------
// Profile export / import (manual portability - the only "sync", no server)
// ---------------------------------------------------------------------------

/** Serialize a profile to a pretty JSON string for download. */
export function exportProfile(p: Profile): string {
  return JSON.stringify(p, null, 2);
}

/**
 * Parse and validate an imported profile JSON. Throws on malformed data so the
 * caller can show a friendly error. Re-stamps the id to avoid collisions.
 */
export function importProfile(json: string): Profile {
  const raw = JSON.parse(json);
  if (!raw || typeof raw !== 'object' || !raw.features || !raw.name) {
    throw new Error('Not a valid style profile file.');
  }
  return {
    id: makeId(),
    name: String(raw.name),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    schemaVersion: SCHEMA_VERSION,
    extractorVersion: EXTRACTOR_VERSION,
    features: raw.features,
    spread: raw.spread || DEFAULT_SPREAD,
    sampleStats: raw.sampleStats || { sampleCount: 0, wordCount: 0, sentenceCount: 0 },
    lowConfidence: Boolean(raw.lowConfidence),
    lastMatchScores: Array.isArray(raw.lastMatchScores) ? raw.lastMatchScores.slice(-20) : [],
  };
}

// ---------------------------------------------------------------------------
// Demo profile + sample drafts (solve the cold-start problem)
// ---------------------------------------------------------------------------

/** A pre-baked "punchy casual voice" sample used to seed the demo profile. */
export const DEMO_SAMPLES: string[] = [
  `Okay, here's the deal. I don't do long, winding sentences. I write the way I talk - short, fast, to the point. If something's boring, I cut it. You won't catch me using fancy words when a plain one does the job.`,
  `Honestly? Most advice online is fluff. I'd rather give you one thing that works than ten things that sound smart. So that's what I do. I test it, I keep what works, and I tell you the rest is noise.`,
  `Weekends are for the dog and bad coffee. I'm not precious about routines. I show up, I do the work, and then I'm done. That's it. No big secret.`,
];

/** An obviously off-voice, AI-flavored draft to demo the deviation scan. */
export const DEMO_DRAFT =
  `In today's rapidly evolving landscape, it is important to note that one must endeavor to utilize a multifaceted approach in order to facilitate optimal outcomes - a testament to the transformative power of strategic thinking. Furthermore, it is worth noting that by leveraging robust methodologies, individuals are able to ascertain numerous additional benefits that subsequently demonstrate sufficient value across a wide variety of contexts.`;

/** Build the demo profile on demand (named so the UI can greet by name). */
export function buildDemoProfile(): Profile {
  const p = buildProfile('Demo - punchy casual voice', DEMO_SAMPLES);
  p.id = 'demo';
  return p;
}

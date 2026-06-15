/**
 * Readability / Grade-Level Scorer - pure client-side engine.
 *
 * Design goals (see docs/tools/readability-grade-level-scorer.md):
 *  - Deterministic, framework-free analysis of English prose using the standard
 *    peer-reviewed formulas: Flesch Reading Ease, Flesch-Kincaid Grade,
 *    Gunning Fog, SMOG, Coleman-Liau and ARI - plus a consensus grade.
 *  - Per-sentence difficulty so the UI can highlight the hardest sentences.
 *  - 100% in-browser math. NO DOM, NO network, NO new dependencies.
 *
 * Everything here is plain arithmetic over a tokenized document, so the same
 * input always produces the same output.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One tokenized sentence plus its own readability stats. */
export interface SentenceStat {
  /** Raw sentence text (trimmed). */
  text: string;
  /** Character offset of the sentence in the original input. */
  start: number;
  /** End offset (exclusive) in the original input. */
  end: number;
  words: number;
  syllables: number;
  /** Words with 3+ syllables (used for the "complex" signal). */
  complexWords: number;
  /** Flesch-Kincaid grade computed for THIS sentence alone. */
  grade: number;
  /** Difficulty bucket relative to a readable baseline. */
  level: 'ok' | 'hard' | 'veryHard';
}

/** Document-wide counts the UI shows in the stats panel. */
export interface DocStats {
  words: number;
  sentences: number;
  paragraphs: number;
  syllables: number;
  characters: number; // letters + digits only (for Coleman-Liau / ARI)
  complexWords: number; // 3+ syllables (Gunning Fog)
  polysyllables: number; // 3+ syllables (SMOG) - same rule, named for clarity
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  /** Estimated silent reading time in minutes (~238 wpm). */
  readingMinutes: number;
  /** Estimated speaking time in minutes (~150 wpm). */
  speakingMinutes: number;
}

/** The six formula scores. Grades are in US school-year units. */
export interface Scores {
  fleschReadingEase: number; // 0-100, higher = easier
  fleschKincaidGrade: number;
  gunningFog: number;
  smog: number;
  colemanLiau: number;
  automatedReadabilityIndex: number;
  /** Average of the five grade-level formulas. */
  consensusGrade: number;
}

/** Full analysis result returned by {@link analyze}. */
export interface Analysis {
  stats: DocStats;
  scores: Scores;
  sentences: SentenceStat[];
  /** True when the text is too short for a reliable score (< ~25 words / 1 sentence). */
  lowConfidence: boolean;
  /** True when there are fewer than 30 sentences (SMOG is unstable below this). */
  smogLowConfidence: boolean;
  /** A single plain-language takeaway sentence for the headline. */
  verdict: string;
}

// ---------------------------------------------------------------------------
// Reading-ease band labels
// ---------------------------------------------------------------------------

/**
 * Map a Flesch Reading Ease score to its conventional band label.
 * Bands follow the widely published Flesch table.
 */
export function readingEaseBand(score: number): string {
  if (score >= 90) return 'Very easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly easy';
  if (score >= 60) return 'Standard / plain English';
  if (score >= 50) return 'Fairly difficult';
  if (score >= 30) return 'Difficult';
  return 'Very difficult';
}

/** Turn a numeric grade level into a friendly schooling label. */
export function gradeLabel(grade: number): string {
  const g = Math.round(grade);
  if (g <= 0) return 'Pre-school';
  if (g <= 5) return `${ordinal(g)} grade - very easy`;
  if (g <= 8) return `${ordinal(g)} grade - easy to read`;
  if (g <= 10) return `${ordinal(g)} grade - fairly easy`;
  if (g <= 12) return `${ordinal(g)} grade - fairly hard`;
  if (g <= 15) return 'College level - hard';
  return 'Graduate level - very hard';
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", etc. */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------------------------------------------------------------------------
// Tokenization
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

/**
 * Strip invisible characters before any counting so watermark/zero-width
 * characters from pasted AI text do not inflate stats.
 *
 * Exported because the UI must render its highlight surface over the SAME
 * precleaned string the engine measured: all sentence offsets in {@link Analysis}
 * are computed against `preclean(input)`, so slicing the raw input with them
 * would drift every highlight by the number of invisible chars seen so far.
 */
export function preclean(input: string): string {
  return input.replace(INVISIBLES, '');
}

/**
 * Split text into sentences. We prefer the native Intl.Segmenter (modern
 * Chrome/Safari/Firefox) and fall back to a regex splitter with an
 * abbreviation guard. Each returned span carries its original offsets so the
 * UI can map a sentence back to a position in the textarea.
 */
export function splitSentences(text: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];

  // Native segmentation when available - most accurate for edge cases.
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
      // Merge segments that were split right after a known abbreviation.
      return mergeAbbreviations(out);
    } catch {
      /* fall through to regex */
    }
  }

  // Regex fallback: break on . ! ? … followed by whitespace.
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

/**
 * Join a sentence back onto the previous one when it was wrongly split after a
 * known abbreviation, a decimal, or a single capital initial (e.g. "Mr." or
 * "3.14" or "J. Smith").
 */
function mergeAbbreviations(spans: { text: string; start: number; end: number }[]) {
  const merged: { text: string; start: number; end: number }[] = [];
  for (const s of spans) {
    const prev = merged[merged.length - 1];
    if (prev) {
      const lastWord = prev.text.split(/\s+/).pop() || '';
      const stripped = lastWord.replace(/[.]$/, '').toLowerCase();
      const endsDecimal = /\d\.$/.test(prev.text); // "3."
      const singleInitial = /\b[A-Z]\.$/.test(prev.text); // "J."
      if (
        ABBREVIATIONS.has(stripped) ||
        ABBREVIATIONS.has(lastWord.toLowerCase().replace(/\.$/, '')) ||
        endsDecimal ||
        singleInitial
      ) {
        // Re-glue: keep prev start, extend to this span's end.
        prev.text = (prev.text + ' ' + s.text).trim();
        prev.end = s.end;
        continue;
      }
    }
    merged.push({ ...s });
  }
  return merged;
}

/**
 * Extract word tokens (Unicode letters, allowing internal apostrophes and
 * hyphens). Pure-punctuation tokens are excluded.
 */
export function splitWords(text: string): string[] {
  const matches = text.match(/\p{L}[\p{L}\p{M}'’-]*/gu);
  return matches ? matches.filter((w) => /\p{L}/u.test(w)) : [];
}

/** Count letters + digits only (for Coleman-Liau and ARI character counts). */
function countCharacters(text: string): number {
  const m = text.match(/[\p{L}\p{N}]/gu);
  return m ? m.length : 0;
}

// ---------------------------------------------------------------------------
// Syllable counting (no-dependency heuristic + memoization)
// ---------------------------------------------------------------------------

// Words whose heuristic syllable count is commonly wrong - hand-tuned.
const SYLLABLE_EXCEPTIONS: Record<string, number> = {
  every: 2, business: 2, people: 2, fire: 1, hour: 1, our: 1, area: 3,
  february: 4, idea: 3, real: 1, being: 2, create: 2, science: 2,
  poem: 2, quiet: 2, simile: 3, mobile: 2, queue: 1, colonel: 2,
  wednesday: 2, choir: 1, aisle: 1,
};

const _syllableCache = new Map<string, number>();

/**
 * Estimate the syllable count of an English word.
 *
 * Heuristic (vowel-group nucleus counting):
 *  - lowercase, strip non-letters
 *  - drop a silent trailing "e" (but keep "le" after a consonant, e.g. "table")
 *  - count runs of vowels as one nucleus each
 *  - clamp to a minimum of 1
 *
 * Memoized per unique word for performance on large pastes.
 */
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
    // Keep "consonant + le" as a syllable (table, little), else drop silent e.
    if (/[^aeiouy]le$/.test(s)) {
      // leave it - the "le" cluster counts
    } else {
      s = s.replace(/e$/, '');
    }
    // A leading "y" acts as a consonant, not a vowel nucleus.
    s = s.replace(/^y/, '');
    const groups = s.match(/[aeiouy]+/g);
    count = groups ? groups.length : 1;
    if (count < 1) count = 1;
  }
  _syllableCache.set(w, count);
  return count;
}

// ---------------------------------------------------------------------------
// Formulas
// ---------------------------------------------------------------------------

/** Guarded division: returns 0 when the denominator is 0. */
function div(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

/** Round to one decimal for display while keeping raw values for the average. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Compute all six formula scores from aggregate counts.
 * Each formula is implemented exactly per the spec (Section 4).
 */
export function computeScores(
  words: number,
  sentences: number,
  syllables: number,
  characters: number,
  complexWords: number,
  polysyllables: number,
): Scores {
  const wps = div(words, sentences); // words per sentence
  const spw = div(syllables, words); // syllables per word

  // Flesch Reading Ease (0-100, higher = easier), clamped.
  const fre = 206.835 - 1.015 * wps - 84.6 * spw;
  const fleschReadingEase = Math.max(0, Math.min(100, fre));

  // Flesch-Kincaid Grade.
  const fkg = 0.39 * wps + 11.8 * spw - 15.59;

  // Gunning Fog: 0.4 * (wps + 100 * complex/words).
  const fog = 0.4 * (wps + 100 * div(complexWords, words));

  // SMOG: 1.043 * sqrt(polysyllables * 30 / sentences) + 3.1291. (Most stable on 30+ sentences.)
  const smog = sentences > 0 ? 1.043 * Math.sqrt(div(polysyllables * 30, sentences)) + 3.1291 : 0;

  // Coleman-Liau: 0.0588*L - 0.296*S - 15.8, where L/S are per-100-words.
  const L = div(characters, words) * 100;
  const S = div(sentences, words) * 100;
  const cli = 0.0588 * L - 0.296 * S - 15.8;

  // Automated Readability Index.
  const ari = 4.71 * div(characters, words) + 0.5 * wps - 21.43;

  // Consensus = mean of the five grade-level formulas (not Reading Ease).
  const grades = [fkg, fog, smog, cli, ari];
  const consensus = grades.reduce((a, b) => a + b, 0) / grades.length;

  return {
    fleschReadingEase: round1(fleschReadingEase),
    fleschKincaidGrade: round1(Math.max(0, fkg)),
    gunningFog: round1(Math.max(0, fog)),
    smog: round1(Math.max(0, smog)),
    colemanLiau: round1(Math.max(0, cli)),
    automatedReadabilityIndex: round1(Math.max(0, ari)),
    consensusGrade: round1(Math.max(0, consensus)),
  };
}

// ---------------------------------------------------------------------------
// Per-sentence scoring
// ---------------------------------------------------------------------------

// Hemingway-style thresholds: flag relative to a readable adult baseline.
const BASELINE_GRADE = 9; // US adult ~grade 8-9
const HARD_OVER = 4; // yellow at +4 grades
const VERY_HARD_OVER = 6; // red at +6 grades

/** Score a single sentence with Flesch-Kincaid and bucket its difficulty. */
function scoreSentence(
  span: { text: string; start: number; end: number },
): SentenceStat {
  const words = splitWords(span.text);
  let syllables = 0;
  let complex = 0;
  for (const w of words) {
    const s = countSyllables(w);
    syllables += s;
    if (s >= 3) complex++;
  }
  const wps = words.length; // single sentence => words/sentence = word count
  const spw = div(syllables, words.length);
  const grade = 0.39 * wps + 11.8 * spw - 15.59;

  let level: SentenceStat['level'] = 'ok';
  if (grade >= BASELINE_GRADE + VERY_HARD_OVER) level = 'veryHard';
  else if (grade >= BASELINE_GRADE + HARD_OVER) level = 'hard';

  return {
    text: span.text,
    start: span.start,
    end: span.end,
    words: words.length,
    syllables,
    complexWords: complex,
    grade: round1(Math.max(0, grade)),
    level,
  };
}

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

const WORDS_PER_MIN_READ = 238;
const WORDS_PER_MIN_SPEAK = 150;

/**
 * Full readability analysis of an input string.
 * Deterministic: same input -> same output.
 */
export function analyze(input: string): Analysis {
  const text = preclean(input);

  const sentenceSpans = splitSentences(text);
  const sentences = sentenceSpans.map(scoreSentence);

  // Aggregate document counts.
  const allWords = splitWords(text);
  let syllables = 0;
  let complexWords = 0;
  for (const w of allWords) {
    const s = countSyllables(w);
    syllables += s;
    if (s >= 3) complexWords++;
  }
  const words = allWords.length;
  const sentenceCount = sentences.length;
  const characters = countCharacters(text);
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length;

  const stats: DocStats = {
    words,
    sentences: sentenceCount,
    paragraphs: Math.max(paragraphs, words > 0 ? 1 : 0),
    syllables,
    characters,
    complexWords,
    polysyllables: complexWords,
    avgWordsPerSentence: round1(div(words, sentenceCount)),
    avgSyllablesPerWord: round2(div(syllables, words)),
    readingMinutes: Math.max(words > 0 ? 1 : 0, Math.round(words / WORDS_PER_MIN_READ)),
    speakingMinutes: Math.max(words > 0 ? 1 : 0, Math.round(words / WORDS_PER_MIN_SPEAK)),
  };

  const scores = computeScores(
    words,
    sentenceCount,
    syllables,
    characters,
    complexWords,
    complexWords,
  );

  const lowConfidence = words < 25 || sentenceCount < 1;
  const smogLowConfidence = sentenceCount < 30;

  return {
    stats,
    scores,
    sentences,
    lowConfidence,
    smogLowConfidence,
    verdict: buildVerdict(scores, lowConfidence),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build the single plain-language takeaway shown above the meter.
 * Frames everything around clarity, never detector-gaming.
 */
function buildVerdict(scores: Scores, lowConfidence: boolean): string {
  if (lowConfidence) {
    return 'Add more text (about 25+ words) for a reliable reading-level score.';
  }
  const g = scores.consensusGrade;
  const ease = scores.fleschReadingEase;
  const grade = gradeLabel(g);
  if (g <= 8) {
    return `This reads at about a ${ordinal(Math.round(g))}-grade level (${grade.split('-')[1]?.trim() || 'easy'}) - great for a broad, general audience.`;
  }
  if (g <= 12) {
    return `This reads at about a ${ordinal(Math.round(g))}-grade level - fine for an adult audience, but a couple of grades above the grade 7-9 sweet spot for general web content.`;
  }
  return `This reads at roughly a ${grade.toLowerCase()} (grade ${Math.round(g)}, ease ${Math.round(ease)}/100) - likely too dense for a general audience. Shorten the hardest sentences to bring it down.`;
}

/**
 * Return the hardest sentences (highest grade), capped at `limit`.
 * Used for the "Top hardest sentences" jump-to list.
 */
export function hardestSentences(sentences: SentenceStat[], limit = 5): SentenceStat[] {
  return [...sentences]
    .filter((s) => s.words >= 3)
    .sort((a, b) => b.grade - a.grade)
    .slice(0, limit);
}

/**
 * Build a clean plain-text results summary suitable for "Copy results" and
 * the downloadable report.
 */
export function buildReport(analysis: Analysis): string {
  const { stats, scores } = analysis;
  const lines = [
    'READABILITY REPORT',
    '==================',
    '',
    analysis.verdict,
    '',
    'GRADE LEVELS',
    `  Consensus grade:         ${scores.consensusGrade}`,
    `  Flesch-Kincaid grade:    ${scores.fleschKincaidGrade}`,
    `  Gunning Fog:             ${scores.gunningFog}`,
    `  SMOG:                    ${scores.smog}${analysis.smogLowConfidence ? ' (low confidence - needs 30+ sentences)' : ''}`,
    `  Coleman-Liau:            ${scores.colemanLiau}`,
    `  Automated Readability:   ${scores.automatedReadabilityIndex}`,
    '',
    `Flesch Reading Ease:       ${scores.fleschReadingEase} / 100 (${readingEaseBand(scores.fleschReadingEase)})`,
    '',
    'DOCUMENT STATS',
    `  Words:                   ${stats.words}`,
    `  Sentences:               ${stats.sentences}`,
    `  Paragraphs:              ${stats.paragraphs}`,
    `  Syllables:               ${stats.syllables}`,
    `  Complex words (3+ syl):  ${stats.complexWords}`,
    `  Avg words / sentence:    ${stats.avgWordsPerSentence}`,
    `  Avg syllables / word:    ${stats.avgSyllablesPerWord}`,
    `  Reading time:            ~${stats.readingMinutes} min`,
    `  Speaking time:           ~${stats.speakingMinutes} min`,
  ];
  return lines.join('\n');
}

/**
 * Read-Aloud Proofreader - pure client-side engine.
 *
 * Design goals (see docs/tools/read-aloud-proofreader.md):
 *  - Deterministic, framework-free text analysis that prepares prose for a
 *    text-to-speech "proof by ear" pass: sentence chunking (so we defeat the
 *    Chrome ~15-second / ~200-char utterance cutoff), a lightweight awkwardness
 *    pre-scan (long sentences, doubled words, double spaces), and read-time
 *    estimates.
 *  - NO DOM, NO network, NO Web Speech here. This module only computes the data
 *    the island needs; the island owns `speechSynthesis`. Keeping speech out of
 *    here makes every function pure and unit-testable.
 *  - Same input always yields the same output.
 *
 * Comment density intentionally mirrors cleaner.ts / readability-grade-level-scorer.ts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One spoken chunk (usually a sentence, sometimes a clause-split fragment). */
export interface Chunk {
  /** The chunk text, trimmed, ready to hand to a SpeechSynthesisUtterance. */
  text: string;
  /** Character offset of this chunk in the original input (for highlighting). */
  start: number;
  /** End offset (exclusive) in the original input. */
  end: number;
  /** Word count of this chunk (drives the "longest sentence" callout). */
  words: number;
}

/** A flagged "listen harder here" spot found by the pre-scan. */
export interface Flag {
  /** What kind of issue this is - drives the icon + explanation in the UI. */
  kind: 'longSentence' | 'doubledWord' | 'doubleSpace';
  /** Index into the chunk list this flag belongs to (-1 if document-level). */
  chunk: number;
  /** Character offset of the issue in the original input. */
  start: number;
  /** End offset (exclusive) of the issue. */
  end: number;
  /** Human-readable label, e.g. "42-word sentence". */
  label: string;
  /** One-line, calm explanation of why it's worth re-hearing (the "tell"). */
  why: string;
}

/** Document-wide stats shown under the box before the user presses Play. */
export interface ReadStats {
  words: number;
  sentences: number;
  /** Words in the single longest sentence (the #1 thing reading aloud surfaces). */
  longestSentenceWords: number;
  /** Chunk index of the longest sentence (so the UI can jump/scroll to it). */
  longestSentenceChunk: number;
  /**
   * Estimated spoken minutes at 1.0x. Multiply by (1 / rate) for other speeds.
   * Based on ~150 words/min, the conventional speaking rate.
   */
  baseSpeakMinutes: number;
}

/** Everything the island needs from one analysis pass. */
export interface ProofAnalysis {
  chunks: Chunk[];
  flags: Flag[];
  stats: ReadStats;
  /**
   * 0-100 "listen score": 100 = nothing flagged, lower = more spots to hear.
   * NOT a quality verdict - just "how much to listen for". Honest framing only.
   */
  awkwardScore: number;
}

// ---------------------------------------------------------------------------
// Tokenization helpers
// ---------------------------------------------------------------------------

// Zero-width & invisible characters frequently left in AI / web-copied text.
// Mirrors cleaner.ts INVISIBLES so pasted AI text does not skew counts or make
// the TTS engine read odd pauses.
const INVISIBLES = /[​‌‍⁠﻿­‎‏‪-‮⁡-⁤]/g;

// Abbreviations whose trailing period must NOT end a sentence (mirrors the
// readability scorer's list so chunking stays consistent across the suite).
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'inc',
  'ltd', 'co', 'corp', 'dept', 'est', 'fig', 'no', 'vol', 'pp', 'ed',
  'i.e', 'e.g', 'a.m', 'p.m', 'u.s', 'u.k', 'ph.d', 'd.c',
]);

/**
 * Strip invisible characters before any counting or speaking.
 *
 * Exported because every offset this engine returns (chunk + flag start/end) is
 * measured against the *precleaned* string. The island must render and slice
 * against this same cleaned string, or highlight spans drift by one position per
 * stripped invisible char in pasted AI/web text.
 */
export function preclean(input: string): string {
  return input.replace(INVISIBLES, '');
}

/** Extract word tokens (Unicode letters with internal apostrophes/hyphens). */
export function splitWords(text: string): string[] {
  const m = text.match(/\p{L}[\p{L}\p{M}'’-]*/gu);
  return m ? m.filter((w) => /\p{L}/u.test(w)) : [];
}

/**
 * Split text into sentence spans, preferring native Intl.Segmenter (the clean
 * modern path) and falling back to a regex splitter with an abbreviation guard.
 * Each span carries original offsets so the island can map a spoken chunk back
 * to a position in the rendered text.
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
      return mergeAbbreviations(out);
    } catch {
      /* fall through to regex */
    }
  }

  // Regex fallback: break on . ! ? … (optionally followed by closing quotes).
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
 * Re-glue a span onto the previous one when it was wrongly split after a known
 * abbreviation, a decimal ("3.14"), or a single capital initial ("J. Smith").
 */
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

// ---------------------------------------------------------------------------
// Chunking (the reliability core)
// ---------------------------------------------------------------------------

/**
 * Max characters per spoken chunk. Desktop Chrome cancels a single utterance
 * after roughly 200-250 chars / ~15s mid-sentence (long-standing Chromium bug).
 * Staying under ~200 chars sidesteps it and gives us free sentence-level
 * progress + click-to-start-here.
 */
export const MAX_CHUNK_CHARS = 200;

/**
 * Build the ordered list of speakable chunks from raw input.
 *
 * Strategy:
 *  1. Segment into sentences (offsets preserved).
 *  2. Any sentence longer than MAX_CHUNK_CHARS is further split at clause
 *     boundaries (, ; :) - and, if a clause is *still* too long (e.g. a URL or
 *     run-on with no punctuation), hard-split on whitespace as a last resort.
 *  3. Offsets are kept absolute so highlighting maps back to the full text.
 */
export function buildChunks(input: string): Chunk[] {
  const text = preclean(input);
  const chunks: Chunk[] = [];

  for (const sent of splitSentences(text)) {
    if (sent.text.length <= MAX_CHUNK_CHARS) {
      chunks.push(toChunk(sent.text, sent.start, sent.end));
      continue;
    }
    // Over-long sentence: split at clause boundaries, keeping the delimiter.
    for (const piece of splitLongSpan(text, sent.start, sent.end)) {
      chunks.push(toChunk(piece.text, piece.start, piece.end));
    }
  }
  return chunks;
}

/** Trim a raw slice but keep accurate absolute offsets for the trimmed text. */
function toChunk(raw: string, absStart: number, absEnd: number): Chunk {
  const leftPad = raw.length - raw.trimStart().length;
  const trimmed = raw.trim();
  const start = absStart + leftPad;
  return { text: trimmed, start, end: start + trimmed.length, words: splitWords(trimmed).length };
}

/**
 * Split an over-long span at clause boundaries (, ; :) into <=MAX_CHUNK_CHARS
 * pieces. Falls back to whitespace splitting when a single clause is still too
 * long (URLs, no-punctuation run-ons). Returns absolute-offset slices.
 */
function splitLongSpan(
  full: string,
  start: number,
  end: number,
): { text: string; start: number; end: number }[] {
  const segment = full.slice(start, end);
  const out: { text: string; start: number; end: number }[] = [];

  // Greedily accumulate clauses until adding the next would exceed the cap.
  // Clause boundary = a comma/semicolon/colon followed by a space.
  const clauseRe = /[^,;:]+[,;:]?\s*/g;
  let buf = '';
  let bufStart = -1;
  let m: RegExpExecArray | null;

  const flush = (localEnd: number) => {
    if (!buf.trim()) { buf = ''; return; }
    out.push({ text: buf, start: start + bufStart, end: start + localEnd });
    buf = '';
    bufStart = -1;
  };

  while ((m = clauseRe.exec(segment)) !== null) {
    const clause = m[0];
    const at = m.index;
    if (bufStart === -1) bufStart = at;

    // A single clause longer than the cap must be hard-split on whitespace.
    if (clause.length > MAX_CHUNK_CHARS) {
      if (buf) flush(at);
      for (const w of hardSplit(clause, start + at)) out.push(w);
      continue;
    }

    if (buf.length + clause.length > MAX_CHUNK_CHARS && buf) {
      flush(at);
      bufStart = at;
    }
    buf += clause;
  }
  flush(segment.length);
  return out.length ? out : [{ text: segment, start, end }];
}

/** Last-resort whitespace splitter for clauses with no internal punctuation. */
function hardSplit(clause: string, absStart: number): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const wordRe = /\S+\s*/g;
  let buf = '';
  let bufStart = -1;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(clause)) !== null) {
    if (bufStart === -1) bufStart = m.index;
    if (buf.length + m[0].length > MAX_CHUNK_CHARS && buf) {
      out.push({ text: buf, start: absStart + bufStart, end: absStart + m.index });
      buf = '';
      bufStart = m.index;
    }
    buf += m[0];
  }
  if (buf.trim()) out.push({ text: buf, start: absStart + bufStart, end: absStart + clause.length });
  return out;
}

// ---------------------------------------------------------------------------
// Pre-scan (the "listen harder here" flags)
// ---------------------------------------------------------------------------

/**
 * Sentences at or above this word count are flagged "long". Reading aloud
 * surfaces long sentences first, so we prime the user to listen for them.
 */
export const LONG_SENTENCE_WORDS = 30;

/**
 * Lightweight, pure client-side pre-scan. Flags exactly three things that the
 * ear catches well and that have unambiguous fixes:
 *  - very long sentences (run-on risk),
 *  - adjacent doubled words ("the the", "that that"),
 *  - double spaces (you can hear an odd gap; trivial to fix).
 * No LLM, no network - just string/regex passes over the chunked text.
 */
export function prescan(input: string, chunks: Chunk[]): Flag[] {
  const text = preclean(input);
  const flags: Flag[] = [];

  // 1) Long sentences (per chunk; over-long sentences are already split, but
  //    we still flag any chunk that is itself a long sentence).
  chunks.forEach((c, i) => {
    if (c.words >= LONG_SENTENCE_WORDS) {
      flags.push({
        kind: 'longSentence',
        chunk: i,
        start: c.start,
        end: c.end,
        label: `${c.words}-word sentence`,
        why: 'Long sentences are the #1 thing reading aloud reveals. If you run out of breath saying it, your reader runs out of patience. Try splitting it at a conjunction.',
      });
    }
  });

  // 2) Doubled adjacent words, case-insensitive ("the the", "is is").
  //    \b(\w+)\s+\1\b with a unicode-friendly word class.
  const dblWord = /\b([\p{L}']+)(\s+)(\1)\b/giu;
  let mw: RegExpExecArray | null;
  while ((mw = dblWord.exec(text)) !== null) {
    flags.push({
      kind: 'doubledWord',
      chunk: chunkAt(chunks, mw.index),
      start: mw.index,
      end: mw.index + mw[0].length,
      label: `Repeated word "${mw[1]}"`,
      why: 'A doubled word slips past the eye but the ear hears it twice. Delete the repeat unless it is deliberate emphasis.',
    });
  }

  // 3) Double (or more) spaces between words.
  const dblSpace = /\S(  +)\S/g;
  let ms: RegExpExecArray | null;
  while ((ms = dblSpace.exec(text)) !== null) {
    const gapStart = ms.index + 1;
    flags.push({
      kind: 'doubleSpace',
      chunk: chunkAt(chunks, gapStart),
      start: gapStart,
      end: gapStart + ms[1].length,
      label: 'Double space',
      why: 'Extra spaces create an audible stumble and look sloppy in print. Collapse them to a single space.',
    });
    dblSpace.lastIndex = ms.index + 1; // allow overlapping runs to be found
  }

  // Keep flags in document order so the fix-list reads top-to-bottom.
  flags.sort((a, b) => a.start - b.start);
  return flags;
}

/** Map an absolute offset to the chunk index that contains it (-1 if none). */
function chunkAt(chunks: Chunk[], offset: number): number {
  for (let i = 0; i < chunks.length; i++) {
    if (offset >= chunks[i].start && offset < chunks[i].end) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

const WORDS_PER_MIN_SPEAK = 150;

/** Full analysis of an input string. Deterministic: same input -> same output. */
export function analyze(input: string): ProofAnalysis {
  const chunks = buildChunks(input);
  const flags = prescan(input, chunks);

  let totalWords = 0;
  let longestWords = 0;
  let longestChunk = -1;
  chunks.forEach((c, i) => {
    totalWords += c.words;
    if (c.words > longestWords) {
      longestWords = c.words;
      longestChunk = i;
    }
  });

  const stats: ReadStats = {
    words: totalWords,
    sentences: chunks.length,
    longestSentenceWords: longestWords,
    longestSentenceChunk: longestChunk,
    baseSpeakMinutes: totalWords > 0 ? Math.max(0.1, totalWords / WORDS_PER_MIN_SPEAK) : 0,
  };

  return { chunks, flags, stats, awkwardScore: scoreAwkward(stats, flags) };
}

/**
 * Convert the flag count into a 0-100 "listen score" (100 = nothing flagged).
 * Each flag costs points, scaled gently by length so a short note with one
 * doubled word is not punished like a wall of run-ons. Purely advisory.
 */
function scoreAwkward(stats: ReadStats, flags: Flag[]): number {
  if (stats.words === 0) return 100;
  // Penalty per 100 words keeps the score length-fair.
  const per100 = (flags.length / Math.max(stats.words, 1)) * 100;
  const score = 100 - Math.round(per100 * 14);
  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Speed presets (framed for proofing, per spec §5.4)
// ---------------------------------------------------------------------------

export interface SpeedPreset {
  /** SpeechSynthesisUtterance.rate value. */
  rate: number;
  /** Short label shown on the button. */
  label: string;
  /** Why a proofreader would pick this speed. */
  note: string;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { rate: 0.75, label: 'Slow proof', note: 'Catch every word' },
  { rate: 1.0, label: 'Natural', note: 'How a reader hears it' },
  { rate: 1.5, label: 'Skim', note: 'Check overall flow' },
];

/** Estimated spoken time in whole minutes:seconds at a given rate. */
export function estimateTime(stats: ReadStats, rate: number): string {
  if (stats.words === 0 || rate <= 0) return '0:00';
  const totalSec = Math.round((stats.baseSpeakMinutes / rate) * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Fix-list export (the takeaway artifact, §5.13)
// ---------------------------------------------------------------------------

/** Friendly title for a flag kind, used in the exported checklist. */
function flagHeading(kind: Flag['kind']): string {
  switch (kind) {
    case 'longSentence': return 'Long sentence';
    case 'doubledWord': return 'Repeated word';
    case 'doubleSpace': return 'Double space';
  }
}

/**
 * Build a plain-text / markdown-checklist export of the pre-scan flags plus any
 * sentences the user manually flagged by ear (passed in by chunk index).
 */
export function buildFixList(
  analysis: ProofAnalysis,
  manualFlags: number[] = [],
): string {
  const lines: string[] = [
    '# Read-Aloud proof - things to fix',
    '',
    `Heard it through. ${analysis.flags.length} pre-scan flag${analysis.flags.length === 1 ? '' : 's'}` +
      (manualFlags.length ? `, ${manualFlags.length} flagged by ear.` : '.'),
    '',
  ];

  if (manualFlags.length) {
    lines.push('## Flagged by ear');
    const seen = new Set<number>();
    for (const ci of manualFlags) {
      if (seen.has(ci)) continue;
      seen.add(ci);
      const c = analysis.chunks[ci];
      if (c) lines.push(`- [ ] ${truncate(c.text, 140)}`);
    }
    lines.push('');
  }

  if (analysis.flags.length) {
    lines.push('## Pre-scan flags');
    for (const f of analysis.flags) {
      lines.push(`- [ ] ${flagHeading(f.kind)}: ${f.label}`);
    }
    lines.push('');
  }

  if (!analysis.flags.length && !manualFlags.length) {
    lines.push('Nothing flagged - it reads clean. Nice.');
  }

  return lines.join('\n');
}

/** Truncate a string to `n` chars with an ellipsis, for tidy list lines. */
function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

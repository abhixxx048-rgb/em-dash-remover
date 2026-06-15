/**
 * Human-Voice / AI-Tell Report - pure client-side analysis engine.
 *
 * Design goals (see docs/tools/human-voice-ai-tell-report.md):
 *  - Non-destructive: the input text is NEVER mutated. Everything here is a
 *    derived, offset-aware report so the UI can paint inline highlights without
 *    touching a single character of the user's draft.
 *  - Surface the structural + lexical "tells" that make prose read like AI:
 *    sentence-cadence / burstiness, "not X but Y", rule-of-three, repeated
 *    openers, metronomic transitions, hedging / sycophancy / filler, and an
 *    overused-GPT-word dictionary with concrete human swaps.
 *  - Quality framing, never detector-bypass. No single tell is conclusive; we
 *    output a graded human-voice read, never a binary verdict.
 *  - 100% in-browser, deterministic, framework-free. NO DOM, NO network, NO new
 *    npm dependencies. Same input always produces the same output.
 *
 * The detection vocabulary is intentionally close to src/lib/ai-tells.ts so the
 * two tools agree; the difference here is that every matcher records character
 * offsets so the report can highlight in place.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category buckets - also drive highlight color + legend (never color-only). */
export type FindingCategory = 'cadence' | 'structure' | 'hedging' | 'vocabulary';

/** One concrete, offset-aware finding the UI can highlight + list. */
export interface Finding {
  /** Stable per-finding id (category + running index). */
  id: string;
  category: FindingCategory;
  /** Detector group label, e.g. "Repeated openers". */
  label: string;
  /** The exact matched snippet from the source (for the list + highlight). */
  text: string;
  /** Character offset (inclusive) in the original input. */
  start: number;
  /** Character offset (exclusive) in the original input. */
  end: number;
  /** Plain-English "why this is a tell", with an optional cited source label. */
  why: string;
  /** Source/citation label shown beside the explanation. */
  source: string;
  /** For vocabulary hits: 2-3 plainer human swaps. */
  swaps?: string[];
}

/** Per-sentence cadence datum for the burstiness chart + jump-to. */
export interface SentenceBar {
  /** Word count of this sentence (the bar height). */
  words: number;
  /** Character offset of the sentence in the original input. */
  start: number;
  end: number;
}

/** Sentence-cadence / burstiness summary. */
export interface Burstiness {
  /** Per-sentence word counts, in document order. */
  bars: SentenceBar[];
  /** Mean words per sentence. */
  mean: number;
  /** Coefficient of variation (stdev / mean). Low = uniform = AI-leaning. */
  cv: number;
  /** Human-readable band for the CV. */
  band: 'uniform' | 'normal' | 'bursty';
  /** True when there is too little text for a reliable cadence read (<5 sents). */
  lowConfidence: boolean;
}

/** Tally for the grouped punch-list sidebar. */
export interface CategoryCount {
  category: FindingCategory;
  label: string;
  count: number;
}

/** Full, derived report returned by {@link analyze}. */
export interface Report {
  /** Every offset-aware finding, sorted by document position. */
  findings: Finding[];
  /** Findings grouped + counted for the punch-list. */
  counts: CategoryCount[];
  /** Sentence-cadence series + stats. */
  burstiness: Burstiness;
  /** 0 (reads human) – 100 (reads heavily AI). */
  score: number;
  band: 'human' | 'some' | 'heavy';
  /** One plain-language top-line verdict. */
  verdict: string;
  words: number;
  sentences: number;
}

// ---------------------------------------------------------------------------
// Tokenization (shared style with readability-grade-level-scorer.ts)
// ---------------------------------------------------------------------------

// Zero-width & invisible characters frequently left in AI / web-copied text.
// Mirrors cleaner.ts INVISIBLES so pasted AI text does not skew offsets/counts.
// NOTE: we do NOT strip these from the source (offsets must stay aligned); the
// inspector tool handles those - here we only avoid counting them as words.
const INVISIBLES = /[​-‏⁠﻿­‪-‮⁡-⁤]/g;

// Abbreviations whose trailing period must NOT end a sentence.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'inc',
  'ltd', 'co', 'corp', 'dept', 'est', 'fig', 'no', 'vol', 'pp', 'ed',
  'i.e', 'e.g', 'a.m', 'p.m', 'u.s', 'u.k', 'ph.d', 'd.c',
]);

/**
 * Split text into sentences with original character offsets. Prefers the native
 * Intl.Segmenter (modern browsers) and falls back to a regex splitter, then
 * re-glues splits that landed right after a known abbreviation / decimal /
 * single capital initial.
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
      /* fall through to regex */
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

/** Re-glue a sentence onto the previous one after an abbreviation / decimal / initial. */
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

/** Count word-like tokens (Unicode letters/digits, internal apostrophes/hyphens). */
function countWords(text: string): number {
  const cleaned = text.replace(INVISIBLES, '');
  const m = cleaned.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu);
  return m ? m.length : 0;
}

// ---------------------------------------------------------------------------
// Detection vocabulary (offset-aware variants of ai-tells.ts)
// ---------------------------------------------------------------------------

/**
 * One phrase detector. `category` drives highlight color; `why`/`source` power
 * the per-finding explainer; patterns carry the global flag so we can capture
 * `match.index` for inline highlighting.
 */
interface PhraseDetector {
  id: string;
  category: FindingCategory;
  label: string;
  why: string;
  source: string;
  patterns: RegExp[];
}

const PHRASE_DETECTORS: PhraseDetector[] = [
  {
    id: 'parallelism',
    category: 'structure',
    label: 'Negative parallelism ("not X but Y")',
    why: 'Models love the "It\'s not X, it\'s Y" rhythm. A little is fine; repeated, it reads scripted. Try just stating Y.',
    source: 'GPTZero · Wikipedia: Signs of AI writing',
    patterns: [
      /it'?s not just\b[^.?!]{1,60}?,?\s+it'?s\b/gi,
      /isn'?t just about\b[^.?!]{1,60}?,?\s+it'?s about\b/gi,
      /it'?s not about\b[^.?!]{1,50}?,\s+it'?s about\b/gi,
      /this isn'?t\b[^.?!]{1,50}?[.,]\s+this is\b/gi,
      /\bnot only\b[^.?!]{1,60}?\bbut(?:\s+also)?\b/gi,
    ],
  },
  {
    id: 'puffery',
    category: 'structure',
    label: 'Puffery / "AI voice"',
    why: 'Grand, abstract phrasing ("a testament to", "harness the power of") inflates prose without adding meaning. Swap in something concrete.',
    source: 'Wikipedia: Signs of AI writing',
    patterns: [
      /play(?:s|ed|ing)? an? (?:vital|crucial|key|pivotal|significant|central) role\b/gi,
      /(?:stands|serves|is) as a testament\b|a testament to\b/gi,
      /(?:rich )?tapestry of\b/gi,
      /navigat(?:e|ing) the (?:complexit|landscape|intricac)/gi,
      /ever-(?:evolving|changing|shifting|expanding) (?:landscape|world|field)\b/gi,
      /unlock(?:ing)? the (?:full )?potential\b/gi,
      /harness(?:ing)? the power of\b|unleash(?:ing)? the power of\b|the transformative power of\b/gi,
      /pav(?:e|ing) the way\b|at the forefront of\b|a beacon of\b|a cornerstone of\b/gi,
      /seamless integration\b|seamlessly (?:blend|integrat)/gi,
      /(?:cutting[- ]edge|state[- ]of[- ]the[- ]art)\b/gi,
    ],
  },
  {
    id: 'hedging',
    category: 'hedging',
    label: 'Hedging / throat-clearing',
    why: 'Preambles like "It\'s important to note" delay the point. Delete the preamble and start with the point itself.',
    source: 'conorbronsdon/avoid-ai-writing',
    patterns: [
      /it'?s important to note(?: that)?\b/gi,
      /it'?s worth (?:noting|mentioning)(?: that)?\b/gi,
      /it should be noted(?: that)?\b/gi,
      /keep in mind(?: that)?\b|(?:with that in mind|that being said)\b/gi,
      /one might argue(?: that)?\b/gi,
      /(?:cannot be overstated|more \w+ than ever)\b/gi,
    ],
  },
  {
    id: 'sycophancy',
    category: 'hedging',
    label: 'Sycophancy / prompt-restatement',
    why: 'Flattery and prompt-echo openers ("Great question!", "You\'re absolutely right") are chatbot habits, not human writing. Cut them.',
    source: 'Descript · AI sycophancy research',
    patterns: [
      /\b(?:that'?s|what) an? (?:great|excellent|fantastic|wonderful|insightful) (?:question|point)\b/gi,
      /you'?re absolutely right\b/gi,
      /i'?d be (?:happy|glad) to\b|i'?d be more than happy to\b/gi,
      /\bgreat (?:question|point)\b[!.]/gi,
      /\b(?:certainly|absolutely|of course)[!]/gi,
      /\bexcellent (?:question|point)\b/gi,
    ],
  },
  {
    id: 'cta',
    category: 'hedging',
    label: 'Filler CTA / sign-offs',
    why: 'Engagement filler ("Let\'s dive in", "I hope this helps") pads the piece. Trust the reader and drop it.',
    source: 'Wikipedia: Signs of AI writing',
    patterns: [
      /let'?s (?:dive in|dive into|deep dive|explore|break (?:this|it) down)\b/gi,
      /\bdive (?:into|deeper)\b/gi,
      /i hope this (?:helps|answers)\b|feel free to\b|let me know if\b|don'?t hesitate to\b/gi,
      /embark on (?:a|this) journey\b/gi,
      /(?:here'?s the (?:thing|kicker|catch)|here'?s the part most people miss)\b/gi,
    ],
  },
  {
    id: 'opener',
    category: 'structure',
    label: 'Scene-setting opener',
    why: '"In today\'s world…", "In the realm of…" are stock model openers. Open with a specific fact or claim instead.',
    source: 'Wikipedia: Signs of AI writing',
    patterns: [
      /in the (?:realm|world|landscape|domain|sphere|annals) of\b/gi,
      /in today'?s (?:world|fast-paced world|digital world|digital age|society)\b/gi,
      /in an (?:era|age) (?:where|of)\b/gi,
      /in the (?:dynamic|ever-evolving|ever-changing|vast) (?:world|landscape) of\b/gi,
    ],
  },
  {
    id: 'conclusion',
    category: 'structure',
    label: 'Conclusion-signaling',
    why: '"In conclusion", "At the end of the day" announce a wrap-up the reader can already see. Just write the conclusion.',
    source: 'Wikipedia: Signs of AI writing',
    patterns: [
      /\bin conclusion\b/gi,
      /\b(?:in summary|to summari[sz]e|to sum up)\b/gi,
      /at the end of the day\b|only time will tell\b/gi,
      /\b(?:in essence|all in all)\b/gi,
    ],
  },
];

/**
 * Overused-GPT-word dictionary → human swaps. Strong words flag at any count;
 * the swaps are surfaced in the per-finding popover. Curated from the published
 * "overused AI words" lists plus the Kobak et al. study.
 */
export const WORD_SWAPS: Record<string, string[]> = {
  delve: ['look at', 'dig into', 'get into'],
  delves: ['looks at', 'digs into'],
  delving: ['looking at', 'digging into'],
  underscore: ['show', 'highlight', 'stress'],
  underscores: ['shows', 'highlights'],
  underscoring: ['showing', 'highlighting'],
  showcase: ['show', 'present'],
  showcases: ['shows', 'presents'],
  tapestry: ['mix', 'blend', 'range'],
  testament: ['proof', 'sign'],
  realm: ['area', 'field', 'world'],
  intricate: ['complex', 'detailed'],
  meticulous: ['careful', 'thorough'],
  meticulously: ['carefully', 'thoroughly'],
  multifaceted: ['many-sided', 'complex'],
  cornerstone: ['basis', 'foundation'],
  pinnacle: ['peak', 'high point'],
  hallmark: ['sign', 'mark'],
  paramount: ['key', 'central', 'top'],
  myriad: ['many', 'countless'],
  plethora: ['plenty', 'a lot of'],
  bolster: ['support', 'strengthen'],
  leverage: ['use', 'draw on'],
  leveraging: ['using', 'drawing on'],
  harness: ['use', 'tap'],
  navigate: ['handle', 'deal with', 'work through'],
  navigating: ['handling', 'working through'],
  enhance: ['improve', 'boost'],
  foster: ['encourage', 'build'],
  fostering: ['encouraging', 'building'],
  utilize: ['use'],
  utilizing: ['using'],
  facilitate: ['help', 'make easier'],
  optimize: ['improve', 'tune'],
  empower: ['enable', 'help'],
  streamline: ['simplify', 'speed up'],
  elevate: ['raise', 'lift', 'improve'],
  robust: ['strong', 'reliable', 'solid'],
  seamless: ['smooth', 'easy'],
  seamlessly: ['smoothly', 'easily'],
  compelling: ['convincing', 'strong'],
  pivotal: ['key', 'central'],
  crucial: ['key', 'vital'],
  comprehensive: ['full', 'complete', 'thorough'],
  holistic: ['whole', 'overall'],
  nuanced: ['subtle', 'careful'],
  vibrant: ['lively', 'bright'],
};

// Signature words - rare in human prose, flagged at any count.
const AI_WORDS_STRONG = [
  'delve', 'delves', 'delving', 'underscore', 'underscores', 'underscoring',
  'showcase', 'showcases', 'tapestry', 'testament', 'realm',
  'intricate', 'meticulous', 'meticulously', 'multifaceted',
  'cornerstone', 'pinnacle', 'hallmark', 'paramount', 'myriad', 'plethora',
  'bolster',
];

// Common "AI accent" words - density-gated (flag only above a per-1k threshold).
const AI_WORDS_SOFT = [
  'leverage', 'leveraging', 'harness', 'navigate', 'navigating', 'enhance',
  'foster', 'fostering', 'utilize', 'utilizing', 'facilitate', 'optimize',
  'empower', 'streamline', 'elevate', 'robust', 'seamless', 'seamlessly',
  'compelling', 'pivotal', 'crucial', 'comprehensive', 'holistic', 'nuanced',
  'vibrant',
];

// Metronomic transition words - counted for opener-density, never per word.
const AI_TRANSITIONS = [
  'moreover', 'furthermore', 'additionally', 'consequently', 'nevertheless',
  'nonetheless', 'subsequently', 'accordingly', 'notably', 'importantly',
  'crucially', 'ultimately', 'essentially', 'indeed', 'firstly', 'whilst',
  'albeit', 'conversely',
];

// ---------------------------------------------------------------------------
// Offset-aware matching helpers
// ---------------------------------------------------------------------------

/** Escape a literal so it is safe inside a RegExp. */
function escapeRe(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Run a global regex over the text and collect every match with its offsets.
 * Guards against zero-width matches (would otherwise loop forever).
 */
function matchAll(text: string, re: RegExp): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = g.exec(text)) !== null) {
    if (m[0].length === 0) { g.lastIndex++; continue; }
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Burstiness / sentence cadence
// ---------------------------------------------------------------------------

/**
 * Promote the count-only burstiness helper to a full per-sentence series so the
 * chart + per-bar jump-to can render. CV bands (corroborating, never
 * conclusive): <0.4 uniform/AI-leaning, 0.4-0.7 normal, >0.7 bursty/human.
 */
export function computeBurstiness(
  sentenceSpans: { text: string; start: number; end: number }[],
): Burstiness {
  const bars: SentenceBar[] = sentenceSpans
    .map((s) => ({ words: countWords(s.text), start: s.start, end: s.end }))
    .filter((b) => b.words > 0);

  const n = bars.length;
  if (n < 5) {
    const mean = n ? bars.reduce((a, b) => a + b.words, 0) / n : 0;
    return { bars, mean: round1(mean), cv: 0, band: 'normal', lowConfidence: true };
  }

  const mean = bars.reduce((a, b) => a + b.words, 0) / n;
  const variance = bars.reduce((a, b) => a + (b.words - mean) ** 2, 0) / n;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const band: Burstiness['band'] = cv < 0.4 ? 'uniform' : cv <= 0.7 ? 'normal' : 'bursty';
  return { bars, mean: round1(mean), cv: round2(cv), band, lowConfidence: false };
}

// ---------------------------------------------------------------------------
// Repeated-opener detection
// ---------------------------------------------------------------------------

/** Lowercase a token, stripping surrounding punctuation. */
function normToken(tok: string): string {
  return tok.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
}

/**
 * Flag repeated sentence openers:
 *  (a) >=3 sentences whose first word is the same transition word, and
 *  (b) any first word repeated as the opener of >=35% of sentences (min 3),
 *      e.g. many sentences starting "This/It/There".
 * Pure string work, O(n). Each repeat group becomes one finding pinned to its
 * first occurrence (so the highlight + jump-to land somewhere meaningful).
 */
function detectOpeners(
  sentenceSpans: { text: string; start: number; end: number }[],
): Finding[] {
  if (sentenceSpans.length < 3) return [];

  // Record the first word + its offset span for each sentence.
  const firsts: { word: string; start: number; end: number }[] = [];
  for (const s of sentenceSpans) {
    const m = s.text.match(/^[\p{L}][\p{L}'’-]*/u);
    if (!m) continue;
    const word = normToken(m[0]);
    if (!word) continue;
    firsts.push({ word, start: s.start, end: s.start + m[0].length });
  }
  if (firsts.length < 3) return [];

  const transitionSet = new Set(AI_TRANSITIONS);
  const groups = new Map<string, { word: string; start: number; end: number }[]>();
  for (const f of firsts) {
    const arr = groups.get(f.word) || [];
    arr.push(f);
    groups.set(f.word, arr);
  }

  const findings: Finding[] = [];
  let idx = 0;
  for (const [word, hits] of groups) {
    const share = hits.length / firsts.length;
    const isTransition = transitionSet.has(word);
    const repeated =
      (isTransition && hits.length >= 3) ||
      (hits.length >= 3 && share >= 0.35);
    if (!repeated) continue;
    const first = hits[0];
    findings.push({
      id: `cadence-opener-${idx++}`,
      category: 'cadence',
      label: 'Repeated opener',
      text: capitalize(word),
      start: first.start,
      end: first.end,
      why: `${hits.length} sentences open with "${capitalize(word)}". Humans vary or drop their openers - try starting some of these differently.`,
      source: 'GPTZero · Wikipedia: Signs of AI writing',
    });
  }
  return findings;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// ---------------------------------------------------------------------------
// Rule-of-three detection
// ---------------------------------------------------------------------------

/**
 * Flag rule-of-three / tricolon clusters ("X, Y, and Z"). A single list is
 * fine; we only flag when >=2 appear, and surface each as its own finding so
 * the writer can decide which to vary. Always "consider", never "wrong".
 */
function detectRuleOfThree(text: string): Finding[] {
  const re = /\b[\p{L}-]+,\s+[\p{L}-]+,\s+(?:and|or)\s+[\p{L}-]+\b/giu;
  const hits = matchAll(text, re);
  if (hits.length < 2) return [];
  return hits.map((h, i) => ({
    id: `structure-three-${i}`,
    category: 'structure' as const,
    label: 'Rule-of-three',
    text: h.text,
    start: h.start,
    end: h.end,
    why: 'Three-item lists are a model favorite. One is fine; several in a row flatten the rhythm - vary the count or recast one as a sentence.',
    source: 'GPTZero: rule-of-three',
  }));
}

// ---------------------------------------------------------------------------
// Vocabulary detection (offset-aware, with swaps)
// ---------------------------------------------------------------------------

/** Find every word-list hit with offsets; attach swaps where we have them. */
function detectWords(
  text: string,
  words: string[],
  label: string,
  category: FindingCategory,
  why: string,
  source: string,
): Finding[] {
  const out: Finding[] = [];
  let idx = 0;
  for (const w of words) {
    const re = new RegExp(`\\b${escapeRe(w)}\\b`, 'gi');
    for (const h of matchAll(text, re)) {
      out.push({
        id: `vocabulary-${label}-${idx++}`,
        category,
        label,
        text: h.text,
        start: h.start,
        end: h.end,
        why,
        source,
        swaps: WORD_SWAPS[w.toLowerCase()],
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Number helpers
// ---------------------------------------------------------------------------

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  cadence: 'Cadence',
  structure: 'Structure',
  hedging: 'Hedging',
  vocabulary: 'Vocabulary',
};

// When two findings overlap, keep the higher-priority category's highlight.
const CATEGORY_PRIORITY: Record<FindingCategory, number> = {
  structure: 4,
  cadence: 3,
  hedging: 2,
  vocabulary: 1,
};

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

/**
 * Full, non-destructive Human-Voice / AI-Tell report for an input string.
 * Deterministic: same input -> same output. The input is never mutated.
 */
export function analyze(input: string): Report {
  const text = input;
  const words = countWords(text);
  const sentenceSpans = splitSentences(text);

  // --- gather findings from every detector ------------------------------
  let findings: Finding[] = [];

  // Phrase detectors (structure / hedging).
  for (const d of PHRASE_DETECTORS) {
    let i = 0;
    for (const re of d.patterns) {
      for (const h of matchAll(text, re)) {
        findings.push({
          id: `${d.category}-${d.id}-${i++}`,
          category: d.category,
          label: d.label,
          text: h.text,
          start: h.start,
          end: h.end,
          why: d.why,
          source: d.source,
        });
      }
    }
  }

  // Structural: rule-of-three clusters + repeated openers.
  findings.push(...detectRuleOfThree(text));
  findings.push(...detectOpeners(sentenceSpans));

  // Vocabulary: strong words at any count; soft words density-gated.
  findings.push(
    ...detectWords(
      text, AI_WORDS_STRONG, 'Signature AI word', 'vocabulary',
      'This word is rare in everyday human writing but common in AI output. A plainer swap usually reads more like you.',
      'overused-AI-words lists · Kobak et al.',
    ),
  );
  const softHits = detectWords(
    text, AI_WORDS_SOFT, 'Overused AI word', 'vocabulary',
    'Fine in moderation, but stacking these "AI-accent" words makes prose sound generated. Swap a few for plainer choices.',
    'overused-AI-words lists',
  );
  // Density-gate the soft words: only surface them once they cluster
  // (>= 8 per 1,000 words), so a single "robust" in a long doc is not nagged.
  const softPer1k = words > 0 ? (softHits.length / words) * 1000 : 0;
  if (softPer1k >= 8) findings.push(...softHits);

  // --- sort by document position ----------------------------------------
  findings.sort((a, b) => a.start - b.start || a.end - b.end);

  // --- burstiness series + uniform-cadence finding ----------------------
  const burst = computeBurstiness(sentenceSpans);
  if (!burst.lowConfidence && burst.band === 'uniform' && burst.bars.length) {
    const first = burst.bars[0];
    findings.push({
      id: 'cadence-uniform-0',
      category: 'cadence',
      label: 'Uniform sentence length',
      text: '',
      // Non-painting pin: zero-length span (end === start) so resolveHighlights
      // skips painting an arbitrary inline span, while the findings-list
      // jump-to (data-start) still lands on the first sentence.
      start: first.start,
      end: first.start,
      why: `Your sentences barely vary in length (variation ${burst.cv.toFixed(2)}). A flat skyline reads robotic - mix short punchy lines with longer ones.`,
      source: 'GPTZero · QuillBot: burstiness',
    });
    // re-sort so the uniform finding lands in position
    findings.sort((a, b) => a.start - b.start || a.end - b.end);
  }

  // --- grouped counts for the punch-list --------------------------------
  const counts: CategoryCount[] = (['cadence', 'structure', 'hedging', 'vocabulary'] as FindingCategory[])
    .map((c) => ({
      category: c,
      label: CATEGORY_LABELS[c],
      count: findings.filter((f) => f.category === c).length,
    }));

  // --- score: weighted tell density, scaled + capped --------------------
  // Weight by category so structural/cadence tells count more than a lone word.
  const catWeight: Record<FindingCategory, number> = { cadence: 3, structure: 3, hedging: 3, vocabulary: 2 };
  let weighted = findings.reduce((s, f) => s + catWeight[f.category], 0);
  // Uniform cadence is a single but strong signal already counted above.
  const per100 = words > 0 ? (weighted / words) * 100 : 0;
  const score = Math.min(100, Math.round(per100 * 3.5));
  const band: Report['band'] = score < 20 ? 'human' : score < 50 ? 'some' : 'heavy';

  return {
    findings,
    counts,
    burstiness: burst,
    score,
    band,
    verdict: buildVerdict(score, band, findings, burst, words),
    words,
    sentences: burst.bars.length,
  };
}

/**
 * Build the single plain-language top-line verdict shown above the gauge.
 * Names the top one or two things to fix; always quality-framed, never a
 * binary "AI/human" call.
 */
function buildVerdict(
  score: number,
  band: Report['band'],
  findings: Finding[],
  burst: Burstiness,
  words: number,
): string {
  if (words < 25) {
    return 'Add more text (about 25+ words) for a reliable human-voice read - no single tell is conclusive.';
  }
  if (findings.length === 0) {
    return 'Reads human - no strong tells found. Nothing here screams "model". Nice.';
  }

  // Pick the two most-common finding labels as the "fix these first" hooks.
  const byLabel = new Map<string, number>();
  for (const f of findings) byLabel.set(f.label, (byLabel.get(f.label) || 0) + 1);
  const top = [...byLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  const fixHints: string[] = [];
  if (!burst.lowConfidence && burst.band === 'uniform') fixHints.push('vary your sentence length');
  for (const [label, n] of top) {
    if (label === 'Uniform sentence length') continue;
    fixHints.push(`ease up on ${label.toLowerCase()}${n > 1 ? ` (${n}×)` : ''}`);
  }
  const lead =
    band === 'human' ? 'This mostly reads like you' :
    band === 'some' ? 'This reads somewhat AI' :
    'This reads heavily AI';
  const fix = fixHints.length ? ` - ${fixHints.slice(0, 2).join(' and ')} and it\'ll sound more human.` : '.';
  return `${lead}${fix} Remember: no single tell is conclusive - use this as a guide, not a verdict.`;
}

// ---------------------------------------------------------------------------
// Highlight span resolution
// ---------------------------------------------------------------------------

/** A non-overlapping span the UI paints, carrying its winning category + id. */
export interface HighlightSpan {
  start: number;
  end: number;
  category: FindingCategory;
  findingId: string;
}

/**
 * Resolve findings into a sorted, NON-OVERLAPPING set of highlight spans.
 * Where findings overlap, the higher-priority category wins (structure >
 * cadence > hedging > vocabulary), and we trim to avoid double-painting.
 * Zero-length findings (e.g. the uniform-cadence pin) are skipped for painting.
 */
export function resolveHighlights(findings: Finding[]): HighlightSpan[] {
  const candidates = findings
    .filter((f) => f.end > f.start)
    .map((f) => ({ start: f.start, end: f.end, category: f.category, findingId: f.id }))
    .sort((a, b) =>
      a.start - b.start ||
      CATEGORY_PRIORITY[b.category] - CATEGORY_PRIORITY[a.category] ||
      b.end - a.end,
    );

  const out: HighlightSpan[] = [];
  let lastEnd = -1;
  for (const c of candidates) {
    if (c.start >= lastEnd) {
      out.push(c);
      lastEnd = c.end;
    } else if (c.end > lastEnd) {
      // Partial overlap: keep the non-overlapping tail so nothing is lost.
      out.push({ ...c, start: lastEnd });
      lastEnd = c.end;
    }
    // Fully covered by a higher-priority span -> drop.
  }
  return out;
}

// ---------------------------------------------------------------------------
// Report export (Copy / Download as Markdown)
// ---------------------------------------------------------------------------

/** Build a clean Markdown report for "Copy report summary" / "Download .md". */
export function buildReport(report: Report): string {
  const lines: string[] = [];
  lines.push('# Human-Voice / AI-Tell Report');
  lines.push('');
  lines.push(report.verdict);
  lines.push('');
  lines.push(`- Human-voice read: **${report.score}/100** (${bandLabel(report.band)})`);
  lines.push(`- Words: ${report.words} · Sentences: ${report.sentences}`);
  if (!report.burstiness.lowConfidence) {
    lines.push(
      `- Sentence cadence (burstiness): CV ${report.burstiness.cv} - ${report.burstiness.band}` +
      ` (mean ${report.burstiness.mean} words/sentence)`,
    );
  } else {
    lines.push('- Sentence cadence: add more text for a reliable read');
  }
  lines.push('');
  lines.push('## Findings');
  for (const c of report.counts) {
    if (c.count === 0) continue;
    lines.push('');
    lines.push(`### ${c.label} (${c.count})`);
    const items = report.findings.filter((f) => f.category === c.category);
    // De-duplicate identical snippets to keep the checklist tight.
    const seen = new Set<string>();
    for (const f of items) {
      const key = `${f.label}::${f.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const snip = f.text ? `"${f.text.trim().slice(0, 60)}"` : f.label;
      const swap = f.swaps?.length ? ` → try: ${f.swaps.join(', ')}` : '';
      lines.push(`- [ ] ${f.label}: ${snip}${swap}`);
    }
  }
  if (report.findings.length === 0) {
    lines.push('');
    lines.push('No strong tells found - reads human.');
  }
  lines.push('');
  lines.push('---');
  lines.push('Generated locally in your browser. No text was uploaded. A guide for quality - no single tell is conclusive.');
  return lines.join('\n');
}

/** Friendly label for a band. */
export function bandLabel(band: Report['band']): string {
  return band === 'human' ? 'Reads fairly human' : band === 'some' ? 'Some AI tells' : 'Reads heavily AI';
}

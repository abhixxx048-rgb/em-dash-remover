/**
 * WebGPU / WebLLM Rewrite - pure logic module.
 *
 * Design goals (see docs/tools/webgpu-webllm-rewrite.md):
 *  - The flagship vision is an on-device LLM rewrite via WebLLM + WebGPU. That
 *    engine (@mlc-ai/web-llm) is NOT bundled here - it would add ~MBs and a hard
 *    dependency - so this module ships the *always-available* path instead:
 *      1. A WebGPU capability gate (feature-detection only, no network).
 *      2. A deterministic, model-free "rewrite" that applies readable, honest
 *         transforms per mode (Standard / Fluent / Formal / Casual / Shorten /
 *         Expand). It removes AI tells and tightens prose without inventing
 *         content - quality, not detector-bypass, and never a hallucination risk.
 *      3. Lightweight before/after metrics (word count, reading grade, AI-tell
 *         density) so the rewrite has a measurable, gamified payoff.
 *  - 100% in-browser. Nothing here touches the network. No DOM. Deterministic.
 *
 * The LLM path is feature-detected and clearly labelled experimental in the UI;
 * the deterministic rewrite below is what actually runs everywhere today.
 */

/** The rewrite "modes" offered as one-click chips. Each maps to a transform. */
export type RewriteMode =
  | 'standard'
  | 'fluent'
  | 'formal'
  | 'casual'
  | 'shorten'
  | 'expand';

export interface ModeMeta {
  id: RewriteMode;
  label: string;
  /** Short human description shown as a tooltip / helper line. */
  hint: string;
}

/** Ordered list used to render the mode chips and to cycle with [ and ]. */
export const MODES: ModeMeta[] = [
  { id: 'standard', label: 'Standard', hint: 'Clean AI tells, keep your meaning and length.' },
  { id: 'fluent', label: 'Fluent', hint: 'Smooth readability - simpler words, clearer flow.' },
  { id: 'formal', label: 'Formal', hint: 'Expand contractions, lift casual phrasing.' },
  { id: 'casual', label: 'Casual', hint: 'Loosen up - contractions and a friendlier tone.' },
  { id: 'shorten', label: 'Shorten', hint: 'Trim filler and hedging for a tighter draft.' },
  { id: 'expand', label: 'Expand', hint: 'Gently space out run-ons into clearer sentences.' },
];

export const DEFAULT_MODE: RewriteMode = 'standard';

/** Result of a deterministic rewrite. */
export interface RewriteResult {
  text: string;
  /** Number of discrete edits applied (for the "cleaned N items" pill). */
  edits: number;
}

/** Before/after measurements for the score meters. */
export interface TextMetrics {
  words: number;
  sentences: number;
  /** Flesch–Kincaid grade level, rounded to one decimal (0 for empty input). */
  grade: number;
  /** AI-tell density: tells per 100 words (0 for empty input). */
  aiTellDensity: number;
}

/** Reported capability of the current device/browser. */
export interface GpuSupport {
  /** navigator.gpu exists (the WebGPU JS API is present). */
  hasApi: boolean;
  /** A short, honest human-readable status line for the UI. */
  message: string;
}

// ---------------------------------------------------------------------------
// AI "tells" - the same family the deterministic cleaner targets. Each entry is
// a phrase/word pattern that LLM prose overuses. We use these both to *score*
// text and to *soften* it in the rewrite (replace with a plainer alternative or
// drop the empty connective entirely).
// ---------------------------------------------------------------------------

interface TellRule {
  /** Case-insensitive, global pattern. Must include word boundaries. */
  re: RegExp;
  /** Replacement; '' deletes the phrase (a trailing space is cleaned up later). */
  to: string;
}

// Hedging / filler openers that add no information - safe to delete.
const FILLER_OPENERS: TellRule[] = [
  { re: /\bit'?s\s+(?:important|worth)\s+(?:to\s+note|noting|mentioning)\s+that\s+/gi, to: '' },
  { re: /\bit\s+is\s+(?:important|worth)\s+(?:to\s+note|noting|mentioning)\s+that\s+/gi, to: '' },
  { re: /\b(?:in|at)\s+the\s+(?:realm|world|context|landscape)\s+of\s+/gi, to: '' },
  { re: /\bneedless\s+to\s+say,?\s*/gi, to: '' },
  { re: /\bwhen\s+it\s+comes\s+to\s+/gi, to: '' },
  { re: /\bin\s+today'?s\s+(?:fast-?paced\s+)?world,?\s*/gi, to: '' },
  { re: /\bat\s+the\s+end\s+of\s+the\s+day,?\s*/gi, to: '' },
];

// Inflated vocabulary → plain-English swaps. Quality over flourish.
const VOCAB_SWAPS: TellRule[] = [
  { re: /\bdelve\s+into\b/gi, to: 'look at' },
  { re: /\bdelve\b/gi, to: 'dig in' },
  { re: /\bleveraged\b/gi, to: 'used' },
  { re: /\bleverages\b/gi, to: 'uses' },
  { re: /\bleverage\b/gi, to: 'use' },
  { re: /\bharnessed\b/gi, to: 'used' },
  { re: /\bharnesses\b/gi, to: 'uses' },
  { re: /\bharness\b/gi, to: 'use' },
  { re: /\butilized\b/gi, to: 'used' },
  { re: /\butilizes\b/gi, to: 'uses' },
  { re: /\butilize\b/gi, to: 'use' },
  { re: /\bseamlessly\b/gi, to: 'smoothly' },
  { re: /\bseamless\b/gi, to: 'smooth' },
  { re: /\brobust\b/gi, to: 'solid' },
  { re: /\bmultifaceted\b/gi, to: 'many-sided' },
  { re: /\bplethora\s+of\b/gi, to: 'many' },
  { re: /\bmyriad\s+of\b/gi, to: 'many' },
  { re: /\bunderscored\b/gi, to: 'showed' },
  { re: /\bunderscores\b/gi, to: 'shows' },
  { re: /\bunderscore\b/gi, to: 'show' },
  { re: /\bpivotal\b/gi, to: 'key' },
  { re: /\bparamount\b/gi, to: 'vital' },
  { re: /\ba\s+testament\s+to\b/gi, to: 'a sign of' },
  { re: /\bpaved\s+the\s+way\s+for\b/gi, to: 'led to' },
  { re: /\bpaves\s+the\s+way\s+for\b/gi, to: 'leads to' },
  { re: /\bpave\s+the\s+way\s+for\b/gi, to: 'lead to' },
  { re: /\bcornerstone\b/gi, to: 'foundation' },
  { re: /\bunlock\s+(?:your|the|its)\s+(?:full\s+)?potential\b/gi, to: 'do more' },
  { re: /\bgame-?chang(er|ing)\b/gi, to: 'big shift' },
  { re: /\bin\s+order\s+to\b/gi, to: 'to' },
  { re: /\bdue\s+to\s+the\s+fact\s+that\b/gi, to: 'because' },
];

/** Empty connectives that pad sentences; trimmed in Shorten / Fluent modes. */
const CONNECTIVE_FILLER: TellRule[] = [
  { re: /\b(?:moreover|furthermore|additionally|notably|importantly|ultimately|essentially|basically|fundamentally),?\s+/gi, to: '' },
];

/** Contraction expansion for the Formal mode. */
const EXPAND_CONTRACTIONS: TellRule[] = [
  { re: /\bit'?s\b/gi, to: 'it is' },
  { re: /\bthat'?s\b/gi, to: 'that is' },
  { re: /\bthere'?s\b/gi, to: 'there is' },
  { re: /\bcan'?t\b/gi, to: 'cannot' },
  { re: /\bwon'?t\b/gi, to: 'will not' },
  { re: /\bdon'?t\b/gi, to: 'do not' },
  { re: /\bdoesn'?t\b/gi, to: 'does not' },
  { re: /\bdidn'?t\b/gi, to: 'did not' },
  { re: /\bisn'?t\b/gi, to: 'is not' },
  { re: /\baren'?t\b/gi, to: 'are not' },
  { re: /\bwasn'?t\b/gi, to: 'was not' },
  { re: /\bweren'?t\b/gi, to: 'were not' },
  { re: /\bi'?m\b/gi, to: 'I am' },
  { re: /\byou'?re\b/gi, to: 'you are' },
  { re: /\bwe'?re\b/gi, to: 'we are' },
  { re: /\bthey'?re\b/gi, to: 'they are' },
  { re: /\bwe'?ve\b/gi, to: 'we have' },
  { re: /\bi'?ve\b/gi, to: 'I have' },
  { re: /\blet'?s\b/gi, to: 'let us' },
];

/** Casual mode contraction map (the reverse, for a friendlier voice). */
const ADD_CONTRACTIONS: TellRule[] = [
  { re: /\bit\s+is\b/gi, to: "it's" },
  { re: /\bthat\s+is\b/gi, to: "that's" },
  { re: /\bthere\s+is\b/gi, to: "there's" },
  { re: /\bcannot\b/gi, to: "can't" },
  { re: /\bwill\s+not\b/gi, to: "won't" },
  { re: /\bdo\s+not\b/gi, to: "don't" },
  { re: /\bdoes\s+not\b/gi, to: "doesn't" },
  { re: /\bis\s+not\b/gi, to: "isn't" },
  { re: /\bare\s+not\b/gi, to: "aren't" },
  { re: /\byou\s+are\b/gi, to: "you're" },
  { re: /\bwe\s+are\b/gi, to: "we're" },
];

// All tells used purely for *scoring* (density). Order/replacement irrelevant.
const ALL_TELLS: RegExp[] = [
  ...FILLER_OPENERS,
  ...VOCAB_SWAPS,
  ...CONNECTIVE_FILLER,
].map((r) => r.re);

// ---------------------------------------------------------------------------
// WebGPU capability gate (feature-detection only - no adapter request here so
// the function stays synchronous and side-effect-free; the island may follow up
// with an async requestAdapter() check and a richer message).
// ---------------------------------------------------------------------------

/** Detect whether the WebGPU JS API surface exists on this device/browser. */
export function detectGpu(nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): GpuSupport {
  const hasApi = !!(nav && 'gpu' in nav && (nav as Navigator & { gpu?: unknown }).gpu);
  return {
    hasApi,
    message: hasApi
      ? 'WebGPU detected - on-device AI rewrite is possible on this device.'
      : 'WebGPU not available here. The instant deterministic rewrite below works everywhere.',
  };
}

// ---------------------------------------------------------------------------
// Sentence segmentation (Intl.Segmenter when available, regex fallback).
// ---------------------------------------------------------------------------

/** Split text into sentence strings (including trailing punctuation/space). */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  // Prefer the platform segmenter for correctness across locales.
  const Seg = (typeof Intl !== 'undefined' && (Intl as typeof Intl & { Segmenter?: unknown }).Segmenter) as
    | (new (locale?: string, opts?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> })
    | undefined;
  if (Seg) {
    try {
      const seg = new Seg('en', { granularity: 'sentence' });
      return Array.from(seg.segment(text), (s) => s.segment).filter((s) => s.length > 0);
    } catch {
      /* fall through to regex */
    }
  }
  // Fallback: split after . ! ? followed by whitespace.
  return text.match(/[^.!?]+[.!?]*\s*|\S+\s*$/g) ?? [text];
}

/** Count words (Unicode-aware), used by metrics and the live counter. */
export function countWords(text: string): number {
  const m = text.trim().match(/[\p{L}\p{N}']+/gu);
  return m ? m.length : 0;
}

/** Estimate syllables in a word - a deliberately simple, deterministic heuristic. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

// ---------------------------------------------------------------------------
// Metrics.
// ---------------------------------------------------------------------------

/** Compute word/sentence counts, Flesch–Kincaid grade, and AI-tell density. */
export function measure(text: string): TextMetrics {
  const words = countWords(text);
  if (!words) return { words: 0, sentences: 0, grade: 0, aiTellDensity: 0 };

  const sentenceList = splitSentences(text).filter((s) => s.trim().length > 0);
  const sentences = Math.max(1, sentenceList.length);

  const wordTokens = text.match(/[\p{L}']+/gu) ?? [];
  let syl = 0;
  for (const w of wordTokens) syl += syllables(w);

  // Flesch–Kincaid grade level.
  const grade =
    0.39 * (words / sentences) + 11.8 * (syl / Math.max(1, words)) - 15.59;

  // AI-tell density: matches per 100 words.
  let tells = 0;
  for (const re of ALL_TELLS) {
    re.lastIndex = 0;
    const matches = text.match(re);
    if (matches) tells += matches.length;
  }

  return {
    words,
    sentences,
    grade: Math.max(0, Math.round(grade * 10) / 10),
    aiTellDensity: Math.round((tells / words) * 1000) / 10,
  };
}

// ---------------------------------------------------------------------------
// Whitespace / punctuation tidy applied after every transform so deletions
// don't leave double spaces or orphaned punctuation.
// ---------------------------------------------------------------------------

function tidy(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ') // collapse runs of spaces
    .replace(/\s+([,.;:!?])/g, '$1') // no space before punctuation
    .replace(/([,;:])(?=[^\s])/g, '$1 ') // single space after a comma/semicolon
    .replace(/^[ \t]+/gm, (m, off, s) => (off === 0 || s[off - 1] === '\n' ? '' : m)) // trim line starts
    .replace(/[ \t]+$/gm, '') // trim line ends
    .replace(/(^|[.!?]\s+)([a-z])/g, (_m, p, c) => p + c.toUpperCase()); // re-capitalize sentence starts
}

/** Apply a list of tell rules, counting how many substitutions happened. */
function applyRules(text: string, rules: TellRule[]): { text: string; edits: number } {
  let edits = 0;
  let out = text;
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    out = out.replace(rule.re, () => {
      edits++;
      return rule.to;
    });
  }
  return { text: out, edits };
}

/**
 * Split very long sentences (Expand) on coordinating conjunctions / semicolons
 * so run-ons become readable. Only splits when a clause is long enough to stand
 * on its own - we never fabricate words.
 */
function expandRunOns(text: string): { text: string; edits: number } {
  let edits = 0;
  const out = splitSentences(text)
    .map((s) => {
      const trimmed = s.trimEnd();
      const tail = s.slice(trimmed.length); // preserved trailing whitespace
      if (countWords(trimmed) < 24) return s;
      // Turn a long "…, and …" or "…; …" join into two sentences.
      const split = trimmed.replace(/,\s+(and|but|so)\s+/i, (_m) => {
        edits++;
        return '. ';
      });
      return split + tail;
    })
    .join('');
  return { text: out, edits };
}

// ---------------------------------------------------------------------------
// The deterministic rewrite - the always-available engine.
// ---------------------------------------------------------------------------

/**
 * Rewrite `input` deterministically according to `mode`. This is the model-free
 * fallback that runs everywhere; it removes AI tells and adjusts tone without
 * inventing content. Returns the new text plus a count of edits applied.
 */
export function rewrite(input: string, mode: RewriteMode = DEFAULT_MODE): RewriteResult {
  if (!input.trim()) return { text: input, edits: 0 };

  let edits = 0;
  let text = input;

  // Step 1 - every mode strips empty filler openers and inflated vocabulary.
  // This is the "de-AI" core; it is what makes the rewrite read human.
  {
    const a = applyRules(text, FILLER_OPENERS);
    const b = applyRules(a.text, VOCAB_SWAPS);
    text = b.text;
    edits += a.edits + b.edits;
  }

  // Step 2 - mode-specific transforms.
  switch (mode) {
    case 'standard':
      // Nothing extra: keep meaning, length and voice; tells already removed.
      break;
    case 'fluent': {
      // Drop empty connectives for smoother flow.
      const r = applyRules(text, CONNECTIVE_FILLER);
      text = r.text;
      edits += r.edits;
      break;
    }
    case 'formal': {
      // Lift the register: expand contractions.
      const r = applyRules(text, EXPAND_CONTRACTIONS);
      text = r.text;
      edits += r.edits;
      break;
    }
    case 'casual': {
      // Warm it up: add contractions.
      const r = applyRules(text, ADD_CONTRACTIONS);
      text = r.text;
      edits += r.edits;
      break;
    }
    case 'shorten': {
      // Trim filler connectives AND collapse redundant intensifiers.
      const a = applyRules(text, CONNECTIVE_FILLER);
      const b = applyRules(a.text, [
        { re: /\b(?:very|really|quite|extremely|incredibly|truly|absolutely)\s+/gi, to: '' },
        { re: /\bin\s+my\s+(?:humble\s+)?opinion,?\s*/gi, to: '' },
      ]);
      text = b.text;
      edits += a.edits + b.edits;
      break;
    }
    case 'expand': {
      // Break long run-on sentences into clearer, separate ones.
      const r = expandRunOns(text);
      text = r.text;
      edits += r.edits;
      break;
    }
  }

  // Step 3 - tidy whitespace/punctuation left behind by deletions.
  text = tidy(text);

  return { text, edits };
}

/** Convenience: cycle to the next/previous mode (for the [ and ] shortcuts). */
export function cycleMode(current: RewriteMode, dir: 1 | -1): RewriteMode {
  const i = MODES.findIndex((m) => m.id === current);
  const n = (i + dir + MODES.length) % MODES.length;
  return MODES[n].id;
}

/**
 * On-Device AI Rewrite - pure, framework-free helpers.
 *
 * Design goals (see docs/tools/on-device-ai-rewrite.md):
 *  - The ACTUAL rewrite happens in the browser via Chrome's built-in Rewriter
 *    API (Gemini Nano). That API is DOM/host-bound and async, so it lives in the
 *    island's <script>, NOT here. This module holds everything that is pure,
 *    deterministic and testable: option<->API mapping, presets, the deterministic
 *    fallback "rewrite", local counters, and the local voice-match score.
 *  - 100% in-browser, synchronous, deterministic. Nothing here touches the DOM
 *    or the network. The Rewriter API is only ever referenced through types.
 *  - Pairs with our existing em-dash / AI-tell cleanup story: when on-device AI
 *    is unavailable we degrade to a deterministic clean-up pass, clearly labelled.
 */

// ---------------------------------------------------------------------------
// Rewriter API option types (mirror the Chrome built-in AI Rewriter shape).
// ---------------------------------------------------------------------------

/** Tone control, mapped 1:1 to the Rewriter API `tone` option. */
export type Tone = 'more-formal' | 'as-is' | 'more-casual';
/** Length control, mapped 1:1 to the Rewriter API `length` option. */
export type Length = 'shorter' | 'as-is' | 'longer';
/** Output format, mapped 1:1 to the Rewriter API `format` option. */
export type Format = 'as-is' | 'plain-text' | 'markdown';

/** The three segmented-control values the UI tracks for a rewrite request. */
export interface RewriteOptions {
  tone: Tone;
  length: Length;
  format: Format;
}

/** Sensible defaults: leave tone/length alone, normalize to plain text so the
 *  result pairs with our markdown-stripping story. */
export const DEFAULT_OPTIONS: RewriteOptions = {
  tone: 'as-is',
  length: 'as-is',
  format: 'plain-text',
};

/** Plain-English labels + tooltips for each control value (used by the UI so
 *  the underlying API enum is demystified - Section 5, feature 16). */
export const TONE_LABELS: Record<Tone, { label: string; hint: string }> = {
  'more-formal': { label: 'Formal', hint: 'Tightens contractions and slang; same meaning, more professional.' },
  'as-is': { label: 'As-is', hint: 'Keep the current tone; just rephrase for clarity.' },
  'more-casual': { label: 'Casual', hint: 'Loosens up the wording; friendlier and more conversational.' },
};

export const LENGTH_LABELS: Record<Length, { label: string; hint: string }> = {
  shorter: { label: 'Shorter', hint: 'Condense the text; cut filler while keeping the point.' },
  'as-is': { label: 'As-is', hint: 'Roughly the same length as the original.' },
  longer: { label: 'Longer', hint: 'Expand with a little more detail and supporting wording.' },
};

export const FORMAT_LABELS: Record<Format, { label: string; hint: string }> = {
  'as-is': { label: 'As-is', hint: 'Keep whatever formatting the input had.' },
  'plain-text': { label: 'Plain text', hint: 'Strip markdown; output clean prose.' },
  markdown: { label: 'Markdown', hint: 'Allow markdown (**bold**, lists) in the output.' },
};

// ---------------------------------------------------------------------------
// Presets - Section 5, feature 2. Named goals that set both selectors at once,
// because users think in goals ("tighten this"), not API enum values.
// ---------------------------------------------------------------------------

export interface Preset {
  id: string;
  label: string;
  hint: string;
  options: RewriteOptions;
  /** Run our deterministic de-AI-tell cleanup BEFORE the rewrite (Humanize). */
  cleanFirst?: boolean;
}

export const PRESETS: Preset[] = [
  {
    id: 'polish',
    label: 'Polish',
    hint: 'Formal, same length - tidy it up.',
    options: { tone: 'more-formal', length: 'as-is', format: 'plain-text' },
  },
  {
    id: 'tighten',
    label: 'Tighten',
    hint: 'Formal and shorter - cut the fat.',
    options: { tone: 'more-formal', length: 'shorter', format: 'plain-text' },
  },
  {
    id: 'soften',
    label: 'Soften',
    hint: 'Casual, same length - warmer voice.',
    options: { tone: 'more-casual', length: 'as-is', format: 'plain-text' },
  },
  {
    id: 'expand',
    label: 'Expand',
    hint: 'Same tone, longer - add detail.',
    options: { tone: 'as-is', length: 'longer', format: 'plain-text' },
  },
  {
    id: 'humanize',
    label: 'Humanize',
    hint: 'Casual + de-AI-tell cleanup pass.',
    options: { tone: 'more-casual', length: 'as-is', format: 'plain-text' },
    cleanFirst: true,
  },
];

// ---------------------------------------------------------------------------
// Capability model - Section 4 feature 4 + Section 5 feature 1.
// The island resolves real availability via `await Rewriter.availability()`;
// these helpers turn that raw status into honest, color-and-text UI copy.
// ---------------------------------------------------------------------------

/** The three states the Rewriter API can report, plus our pre-check states. */
export type Capability = 'checking' | 'available' | 'downloadable' | 'unavailable';

export interface CapabilityBadge {
  /** Short chip text shown in the header. */
  text: string;
  /** A leading glyph so status is conveyed by icon + text, never color alone. */
  icon: string;
  /** Which design token drives the chip color. */
  tone: 'ok' | 'warn' | 'muted';
  /** Whether the on-device model can be invoked (now or after a download). */
  canRewrite: boolean;
}

/** Map a raw capability into an accessible badge (icon + text + token color). */
export function capabilityBadge(cap: Capability): CapabilityBadge {
  switch (cap) {
    case 'checking':
      return { text: 'Checking on-device AI…', icon: '○', tone: 'muted', canRewrite: false };
    case 'available':
      return { text: 'On-device AI ready', icon: '●', tone: 'ok', canRewrite: true };
    case 'downloadable':
      return { text: 'Model downloads on first use (one-time)', icon: '◐', tone: 'warn', canRewrite: true };
    case 'unavailable':
    default:
      return { text: 'AI unavailable - using deterministic cleanup', icon: '◯', tone: 'muted', canRewrite: false };
  }
}

// ---------------------------------------------------------------------------
// Deterministic fallback "rewrite" - Section 4 feature 9.
// When the on-device model is unavailable (non-Chrome, unsupported hardware,
// origin-trial not active) we still give the user a useful result: a 100% local,
// rule-based clean-up. This is NOT an AI rewrite and the UI labels it as such.
// It reuses the same family of fixes as the em-dash cleaner.
// ---------------------------------------------------------------------------

/** Zero-width & invisible characters frequently left in AI / web-copied text. */
const INVISIBLES = /[​-‍⁠﻿­‎‏‪-‮⁡-⁤]/g;

/** Words/phrases that are common AI "tells"; the fallback trims a few hedges. */
const HEDGES = /\b(?:it'?s\s+(?:important|worth)\s+(?:to\s+)?not(?:e|ing)\s+that|it\s+is\s+worth\s+noting\s+that)\s+/gi;

export interface FallbackResult {
  text: string;
  /** Human-readable notes about what changed (Section 5 feature 4 chips). */
  notes: string[];
}

/**
 * Apply a deterministic, dependency-free clean-up pass. Deterministic so the
 * same input always yields the same output. Returns both the cleaned text and a
 * short list of "why this changed" notes for the education chips.
 */
export function deterministicRewrite(input: string): FallbackResult {
  let text = input;
  const notes: string[] = [];
  const note = (n: string) => { if (!notes.includes(n)) notes.push(n); };

  // Normalize typed "--"/"---" to a real em dash so the next step catches it.
  if (/-{2,}/.test(text)) text = text.replace(/-{2,}/g, '-');

  // Em / en dashes → a context-light comma (the full grammar-aware engine lives
  // in lib/cleaner.ts; the fallback here keeps a light touch).
  if (/[-–]/.test(text)) {
    text = text.replace(/\s*[-–]\s*/g, ', ');
    note('replaced em/en dash with a comma');
  }

  // Curly quotes / apostrophes → straight.
  if (/[‘’‚‛“”„‟]/.test(text)) {
    text = text
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"');
    note('converted curly quotes to straight quotes');
  }

  // Ellipsis character → three dots.
  if (/…/.test(text)) {
    text = text.replace(/…/g, '...');
    note('expanded the ellipsis character to "..."');
  }

  // Strip invisible / zero-width / watermark characters.
  if (INVISIBLES.test(text)) {
    text = text.replace(INVISIBLES, '');
    note('removed invisible / watermark characters');
  }

  // Trim a couple of the most common hedging AI tells.
  if (HEDGES.test(text)) {
    text = text.replace(HEDGES, '');
    // Re-capitalize a sentence that now starts mid-stream.
    text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre, c) => pre + c.toUpperCase());
    note('trimmed a hedging "it\'s worth noting that" phrase');
  }

  // Non-breaking spaces → normal; collapse runs; trim line ends.
  if (/ /.test(text)) { text = text.replace(/ /g, ' '); note('normalized non-breaking spaces'); }
  text = text.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '');

  return { text, notes };
}

// ---------------------------------------------------------------------------
// Local counters - Section 5 feature 5. No model needed.
// ---------------------------------------------------------------------------

export interface TextStats {
  chars: number;
  words: number;
  /** Estimated reading time in minutes (≈200 wpm), at least 1 when non-empty. */
  readingMin: number;
}

/** Live counters for a pane's stats line. Pure; counts on the raw text. */
export function stats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return {
    chars: text.length,
    words,
    readingMin: words ? Math.max(1, Math.round(words / 200)) : 0,
  };
}

/** Tokenize to lowercase word tokens for overlap scoring (no punctuation). */
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []);
}

/** Split into rough sentences for the rhythm component of voice-match. */
function sentences(text: string): string[] {
  return text.split(/[.!?]+\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Voice-match meter - Section 5 feature 6. A 0–100 score estimating how much of
// the author's original voice survived the rewrite, so users can avoid
// over-rewriting (brand promise: "keep your human voice"). Pure JS, <1ms.
// ---------------------------------------------------------------------------

export interface VoiceMatch {
  /** 0–100; higher = closer to the original voice. */
  score: number;
  /** A short, plain-English read on the score (icon+text, not color alone). */
  label: string;
}

/**
 * Voice-match score = blend of:
 *   - Jaccard token overlap (shared vocabulary), and
 *   - normalized average-sentence-length similarity (rhythm).
 * Both are bounded 0..1; we weight overlap a bit higher (it tracks meaning
 * preservation more directly), then scale to 0..100.
 */
export function voiceMatch(original: string, rewrite: string): VoiceMatch {
  if (!original.trim() || !rewrite.trim()) {
    return { score: 0, label: 'Rewrite to see how well your voice is preserved' };
  }

  // Jaccard overlap of the unique token sets.
  const a = new Set(tokenize(original));
  const b = new Set(tokenize(rewrite));
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  const union = a.size + b.size - shared;
  const overlap = union === 0 ? 1 : shared / union;

  // Sentence-rhythm similarity: compare average sentence lengths (in words).
  const avg = (text: string) => {
    const ss = sentences(text);
    if (!ss.length) return 0;
    return ss.reduce((sum, s) => sum + tokenize(s).length, 0) / ss.length;
  };
  const la = avg(original);
  const lb = avg(rewrite);
  const rhythm = la === 0 && lb === 0 ? 1 : 1 - Math.abs(la - lb) / Math.max(la, lb, 1);

  const blended = 0.7 * overlap + 0.3 * Math.max(0, rhythm);
  const score = Math.round(blended * 100);

  const label =
    score >= 75 ? 'Strong voice match - barely touched your style'
    : score >= 45 ? 'Moderate change - recognizably yours'
    : 'Heavy rewrite - quite different from the original';

  return { score, label };
}

// ---------------------------------------------------------------------------
// Shared context - Section 4 feature 7. A small, stable instruction handed to
// the Rewriter API on `create()` so the model stays on-brand (preserve voice,
// clean AI tells) without us ever positioning the tool as a detector bypass.
// ---------------------------------------------------------------------------

export const SHARED_CONTEXT =
  "Preserve the author's natural voice and meaning. Remove robotic AI tells " +
  '(em dashes, hedging filler, clichés) and write clean, human-sounding prose. ' +
  'Do not invent facts.';

// ---------------------------------------------------------------------------
// A deliberately AI-sounding sample - Section 5 feature 11 empty-state demo.
// ---------------------------------------------------------------------------

export const SAMPLES: Record<string, string> = {
  email:
    "Hi team - I wanted to delve into our Q3 results. It's not just about the " +
    "numbers, it's about the story they tell. We've leveraged a robust, " +
    'multifaceted strategy to unlock our full potential - and it’s a testament ' +
    "to everyone's hard work. Moreover, it's worth noting that our seamless " +
    'integration paved the way for success.',
  essay:
    'The Industrial Revolution stands as a testament to human ingenuity. It ' +
    'fundamentally reshaped society - transforming economies, redefining labor, ' +
    'and revolutionizing daily life. In the realm of manufacturing, it ' +
    'underscored the pivotal role of innovation. Ultimately, it is worth noting ' +
    'that this transformative era laid the cornerstone for the modern world.',
  cover:
    'Dear Hiring Manager - I am writing to express my profound enthusiasm for ' +
    'this role. Throughout my career, I have consistently leveraged a diverse ' +
    'skill set to drive impactful outcomes. It is important to note that I am a ' +
    'highly motivated individual who thrives in dynamic, fast-paced environments.',
};

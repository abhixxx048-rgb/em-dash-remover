/**
 * AI-tell scanner. Detects the "tells" that make text read as AI-generated.
 * 100% client-side. Based on the 2025-2026 taxonomy (Kobak et al. PubMed study,
 * Wikipedia "Signs of AI writing", GPTZero burstiness, curated corpora).
 *
 * Governing principle: no single tell is conclusive. Signal = clustering +
 * density. We output a confidence score, never a binary verdict.
 */

export interface Tell {
  id: string;
  label: string;
  count: number;
  weight: number;
  examples: string[];
}

export interface TellReport {
  tells: Tell[];
  /** 0 (reads human) – 100 (reads very AI). */
  score: number;
  band: 'human' | 'some' | 'heavy';
  words: number;
}

/* ---------------------------------------------------------------- word lists */

// Signature words - rare in human prose, so meaningful even at low counts.
// [E] = empirically validated (Kobak et al.); others curated.
const AI_WORDS_STRONG = [
  'delve', 'delves', 'delving', 'underscore', 'underscores', 'underscoring',
  'showcase', 'showcases', 'showcasing', 'tapestry', 'testament', 'beacon',
  'labyrinth', 'mosaic', 'symphony', 'crucible', 'gossamer', 'realm', 'realms',
  'intricate', 'intricacies', 'meticulous', 'meticulously', 'multifaceted',
  'cornerstone', 'pinnacle', 'hallmark', 'interplay', 'ethos', 'zeitgeist',
  'bolster', 'spearhead', 'epitomize', 'exemplify', 'illuminate', 'unravel',
  'commendable', 'paramount', 'indelible', 'unwavering', 'myriad', 'plethora',
];

// Common "AI accent" words - appear in real prose too, so density-gated.
const AI_WORDS_SOFT = [
  'leverage', 'leverages', 'leveraging', 'harness', 'harnessing', 'navigate',
  'navigating', 'enhance', 'enhancing', 'foster', 'fostering', 'embark',
  'unlock', 'unlocking', 'unleash', 'utilize', 'utilizing', 'facilitate',
  'optimize', 'empower', 'streamline', 'elevate', 'transform', 'revolutionize',
  'robust', 'seamless', 'seamlessly', 'vibrant', 'profound', 'compelling',
  'captivating', 'transformative', 'groundbreaking', 'cutting-edge',
  'innovative', 'pivotal', 'crucial', 'comprehensive', 'holistic', 'nuanced',
  'versatile', 'dynamic', 'invaluable', 'vital', 'remarkable', 'noteworthy',
  'notable', 'countless', 'vast', 'array', 'spectrum', 'landscape',
];

// Transitions / certainty - very high false-positive; counted for density only.
const AI_TRANSITIONS = [
  'moreover', 'furthermore', 'additionally', 'consequently', 'nevertheless',
  'nonetheless', 'subsequently', 'accordingly', 'notably', 'importantly',
  'crucially', 'ultimately', 'essentially', 'indeed', 'firstly', 'whilst',
  'albeit', 'conversely',
];

/* ------------------------------------------------------------ phrase regexes */

interface PhraseGroup {
  id: string;
  label: string;
  weight: number;
  patterns: RegExp[];
}

const PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: 'parallelism',
    label: '“It’s not X, it’s Y” pattern',
    weight: 4,
    patterns: [
      /it'?s not just\b[^.?!]{1,60}?,?\s+it'?s\b/gi,
      /isn'?t just about\b[^.?!]{1,60}?,?\s+it'?s about\b/gi,
      /it'?s not about\b[^.?!]{1,50}?,\s+it'?s about\b/gi,
      /this isn'?t\b[^.?!]{1,50}?[.,]\s+this is\b/gi,
      /the (?:real|actual|true)\s+\w+\s+(?:isn'?t|is not)\b/gi,
      /\bnot only\b[^.?!]{1,60}?\bbut(?:\s+also)?\b/gi,
    ],
  },
  {
    id: 'puffery',
    label: 'Puffery / “AI voice”',
    weight: 3,
    patterns: [
      /play(?:s|ed|ing)? an? (?:vital|crucial|key|pivotal|significant|central) role\b/gi,
      /(?:stands|serves|is) as a testament\b|a testament to\b/gi,
      /(?:rich )?tapestry of\b/gi,
      /navigat(?:e|ing) the (?:complexit|landscape|intricac)/gi,
      /ever-(?:evolving|changing|shifting|expanding) (?:landscape|world|field)\b/gi,
      /unlock(?:ing)? the (?:full )?potential\b/gi,
      /harness(?:ing)? the power of\b|unleash(?:ing)? the power of\b|the transformative power of\b/gi,
      /pav(?:e|ing) the way\b|at the forefront of\b|a beacon of\b|a cornerstone of\b/gi,
      /(?:left an? )?indelible mark\b|treasure trove of\b/gi,
      /master the art of\b|the art and science of\b/gi,
      /seamless integration\b|seamlessly (?:blend|integrat)/gi,
      /provid(?:e|es|ing) valuable insights\b/gi,
      /(?:cutting[- ]edge|state[- ]of[- ]the[- ]art)\b/gi,
      /has emerged as an?\b/gi,
    ],
  },
  {
    id: 'hedging',
    label: 'Hedging / throat-clearing',
    weight: 3,
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
    id: 'conclusion',
    label: 'Conclusion-signaling',
    weight: 2,
    patterns: [
      /\bin conclusion\b/gi,
      /\b(?:in summary|to summari[sz]e|to sum up)\b/gi,
      /at the end of the day\b|only time will tell\b/gi,
      /the future (?:looks bright|of \w+)\b/gi,
      /\b(?:in essence|all in all)\b/gi,
    ],
  },
  {
    id: 'cta',
    label: 'Engagement / CTA / sign-offs',
    weight: 3,
    patterns: [
      /let'?s (?:dive in|dive into|deep dive|explore|break (?:this|it) down)\b/gi,
      /\bdive (?:into|deeper)\b/gi,
      /i hope this (?:helps|answers)\b|feel free to\b|let me know if\b|don'?t hesitate to\b/gi,
      /embark on (?:a|this) journey\b/gi,
      /(?:here'?s the (?:thing|kicker|catch)|the kicker\?|here'?s the part most people miss)\b/gi,
    ],
  },
  {
    id: 'opener',
    label: 'Scene-setting openers',
    weight: 2,
    patterns: [
      /in the (?:realm|world|landscape|domain|sphere|annals) of\b/gi,
      /in today'?s (?:world|fast-paced world|digital world|digital age|society)\b/gi,
      /in an (?:era|age) (?:where|of)\b/gi,
      /in the (?:dynamic|ever-evolving|ever-changing|vast) (?:world|landscape) of\b/gi,
      /whether you'?re an?\b[^.?!]{1,50}?\bor an?\b/gi,
    ],
  },
  {
    id: 'participle',
    label: 'Editorializing “-ing” tail',
    weight: 3,
    patterns: [
      /,\s+(?:highlighting|underscoring|emphasizing|reflecting|symbolizing|showcasing|ensuring|cementing|solidifying|cultivating|fostering)\b[^.?!]+[.?!]/gi,
    ],
  },
];

/* -------------------------------------------------------------------- helpers */

function countMatches(text: string, re: RegExp): { count: number; examples: string[] } {
  const m = text.match(re);
  if (!m) return { count: 0, examples: [] };
  return { count: m.length, examples: m.slice(0, 3).map((s) => s.trim().slice(0, 48)) };
}

function countWordList(text: string, words: string[]): { count: number; examples: string[] } {
  const examples: string[] = [];
  let count = 0;
  for (const w of words) {
    const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const m = text.match(re);
    if (m) {
      count += m.length;
      if (examples.length < 6 && !examples.includes(w)) examples.push(w);
    }
  }
  return { count, examples };
}

/** Sentence-length coefficient of variation. Low CV (<0.4) leans AI. */
function burstiness(text: string): { cv: number; sentences: number } {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => (s.match(/\S+/g) || []).length).filter((n) => n > 0);
  if (sentences.length < 5) return { cv: 1, sentences: sentences.length };
  const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
  const variance = sentences.reduce((a, b) => a + (b - mean) ** 2, 0) / sentences.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  return { cv, sentences: sentences.length };
}

/* ---------------------------------------------------------------------- scan */

export function scan(text: string): TellReport {
  const words = (text.trim().match(/\S+/g) || []).length;
  const tells: Tell[] = [];
  const per1k = (n: number) => (words > 0 ? (n / words) * 1000 : 0);

  const push = (id: string, label: string, count: number, weight: number, examples: string[] = []) => {
    if (count > 0) tells.push({ id, label, count, weight, examples });
  };

  // Tier 0 - near-conclusive.
  push('invis', 'Invisible / watermark chars', countMatches(text, /[​-‏⁠﻿­ ]/g).count, 5);

  // Punctuation tells.
  push('emdash', 'Em dashes', countMatches(text, /-/g).count, 3);
  push('endash', 'En dashes', countMatches(text, /–/g).count, 1);
  push('curly', 'Curly quotes', countMatches(text, /[‘’“”]/g).count, 1);

  // Formatting tells.
  push('bold', 'Markdown bold', countMatches(text, /\*\*[^*\n]+\*\*/g).count, 1);
  const emoji = countMatches(text, /^\s*(?:#{1,6}\s*)?[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✅✨⚡⭐]/gmu);
  push('emoji', 'Emoji bullets / headers', emoji.count, 2);
  push('hr', 'Markdown horizontal rules', countMatches(text, /^\s*([-*_])\1{2,}\s*$/gm).count, 1);

  // Phrase groups.
  for (const g of PHRASE_GROUPS) {
    let count = 0;
    const examples: string[] = [];
    for (const re of g.patterns) {
      const r = countMatches(text, re);
      count += r.count;
      for (const e of r.examples) if (examples.length < 3) examples.push(e);
    }
    push(g.id, g.label, count, g.weight, examples);
  }

  // Vocabulary.
  const strong = countWordList(text, AI_WORDS_STRONG);
  push('words_strong', 'Signature AI words', strong.count, 3, strong.examples);
  const soft = countWordList(text, AI_WORDS_SOFT);
  push('words_soft', 'Overused AI vocabulary', soft.count, 1, soft.examples);

  // Transition density (only counts as a tell above ~15 per 1k words).
  const trans = countWordList(text, AI_TRANSITIONS);
  if (per1k(trans.count) > 15) push('transitions', 'Heavy transition words', trans.count, 1, trans.examples);

  // Rule-of-three lists.
  const three = countMatches(text, /\b[\w-]+,\s+[\w-]+,\s+and\s+[\w-]+\b/gi);
  if (three.count >= 2) push('three', 'Rule-of-three lists', three.count, 1, three.examples);

  // Burstiness (statistical, corroborating only - needs enough text).
  const { cv, sentences } = burstiness(text);
  if (sentences >= 6 && cv < 0.4) {
    push('burstiness', 'Uniform sentence length', 1, 2, [`variation ${cv.toFixed(2)}`]);
  }

  // Score: weighted density per 100 words, scaled and capped.
  const weighted = tells.reduce((s, t) => s + t.count * t.weight, 0);
  const per100 = words > 0 ? (weighted / words) * 100 : 0;
  const score = Math.min(100, Math.round(per100 * 3.5));
  const band: TellReport['band'] = score < 20 ? 'human' : score < 50 ? 'some' : 'heavy';

  return { tells, score, band, words };
}

/** Live text stats. */
export function stats(text: string) {
  const words = (text.trim().match(/\S+/g) || []).length;
  const chars = [...text].length;
  const sentences = (text.match(/[.!?]+(?:\s|$)/g) || []).length;
  const readingMin = Math.max(1, Math.ceil(words / 225));
  return { words, chars, sentences, readingMin };
}

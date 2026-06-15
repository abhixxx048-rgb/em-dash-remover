/**
 * Passive-Voice & Weasel-Word Highlighter - pure detection engine.
 *
 * Design goals (see docs/tools/passive-voice-weasel-word-highlighter.md):
 *  - Port the proven heuristics from write-good (`passive-voice`,
 *    `adverb-where`, `weasel-words`) and Hemingway, NOT a full POS tagger.
 *    These regex + small word-list shortcuts catch the vast majority of real
 *    English passives, weak -ly adverbs, and hedge/weasel phrases.
 *  - Three distinct categories so the UI can colour + underline + label each
 *    independently (never colour-only).
 *  - 100% in-browser, deterministic, no DOM and no network. Just string math.
 *  - Brand framing is "stronger, more human writing" - analysis only, we never
 *    auto-rewrite. We coach with a "why" + a fix pattern per category.
 */

/** The three weak-writing categories we flag. */
export type Category = 'passive' | 'adverb' | 'weasel';

/** A single flagged span in the source text. */
export interface Flag {
  /** Inclusive start index into the original string. */
  start: number;
  /** Exclusive end index into the original string. */
  end: number;
  /** Which weak-writing class this is. */
  category: Category;
  /** The exact matched substring (for tooltips / the issues list). */
  text: string;
  /** Plain-English reason this weakens the writing. */
  why: string;
  /** A concrete, non-destructive rewrite hint. */
  fix: string;
}

/** Per-category on/off toggles so a user can run one focused pass. */
export interface Toggles {
  passive: boolean;
  adverb: boolean;
  weasel: boolean;
}

export const DEFAULT_TOGGLES: Toggles = { passive: true, adverb: true, weasel: true };

/** Counts + the headline metrics the UI renders. */
export interface AnalysisStats {
  words: number;
  sentences: number;
  passive: number;
  adverb: number;
  weasel: number;
  /** passive sentences ÷ total sentences, 0–100, rounded. */
  passivePct: number;
  /**
   * Directness score 0–100 (higher = fewer flags per 100 words).
   * The headline gauge: 100 means nothing flagged.
   */
  directness: number;
}

export interface Analysis {
  flags: Flag[];
  stats: AnalysisStats;
  /**
   * The text the engine actually measured against: `raw` with invisibles
   * stripped. Flag indices map into THIS string, so the UI must render its
   * highlight overlay over `cleaned` (not the raw paste) to keep offsets and
   * rendered characters in one coordinate space.
   */
  cleaned: string;
}

/* ------------------------------------------------------------------ *
 * Word lists (vendored, English-calibrated).                          *
 * Kept small and inline - no JSON fetch, no dependency.               *
 * ------------------------------------------------------------------ */

// Be-verbs that begin a passive construction (write-good / Hemingway list).
const BE_VERBS = [
  'am', 'are', 'were', 'being', 'is', 'been', 'was', 'be',
];

// Irregular past participles that don't end in "ed". Trimmed-down but
// representative subset of write-good's ~190-entry `passive-voice` list -
// the high-frequency ones that actually show up in prose.
const IRREGULAR_PARTICIPLES = [
  'awoken', 'born', 'beaten', 'become', 'begun', 'bent', 'bound', 'bitten',
  'bled', 'blown', 'broken', 'brought', 'built', 'burnt', 'bought', 'caught',
  'chosen', 'come', 'cost', 'cut', 'dealt', 'done', 'drawn', 'dreamt',
  'driven', 'drunk', 'eaten', 'fallen', 'fed', 'felt', 'fought', 'found',
  'flown', 'forbidden', 'forgotten', 'forgiven', 'frozen', 'gotten', 'given',
  'gone', 'grown', 'hung', 'heard', 'hidden', 'hit', 'held', 'hurt', 'kept',
  'known', 'laid', 'led', 'left', 'lent', 'let', 'lost', 'made', 'meant',
  'met', 'paid', 'put', 'read', 'ridden', 'rung', 'risen', 'run', 'said',
  'seen', 'sold', 'sent', 'set', 'shaken', 'shed', 'shone', 'shot', 'shown',
  'shut', 'sung', 'sunk', 'sat', 'slept', 'slid', 'sold', 'sought', 'spoken',
  'spent', 'spread', 'sprung', 'stood', 'stolen', 'struck', 'sworn', 'swept',
  'swum', 'swung', 'taken', 'taught', 'torn', 'told', 'thought', 'thrown',
  'understood', 'woken', 'worn', 'won', 'withdrawn', 'written',
];

// Real -ly adverbs (Hemingway/`adverb-where`-style). We match a curated set of
// adverbs rather than naive /\w+ly\b/, so we don't flag non-adverbs like
// apply, Italy, only, family, reply, supply, ugly, rely, jolly, comply.
const ADVERBS = [
  'absolutely', 'actually', 'apparently', 'badly', 'barely', 'basically',
  'briefly', 'carefully', 'certainly', 'clearly', 'closely', 'completely',
  'constantly', 'deeply', 'definitely', 'easily', 'effectively', 'entirely',
  'especially', 'essentially', 'eventually', 'exactly', 'extremely', 'fairly',
  'finally', 'frankly', 'frequently', 'fully', 'generally', 'gently',
  'genuinely', 'gradually', 'greatly', 'hardly', 'heavily', 'highly',
  'honestly', 'hopefully', 'immediately', 'incredibly', 'instantly',
  'interestingly', 'largely', 'literally', 'mainly', 'mostly', 'nearly',
  'necessarily', 'obviously', 'occasionally', 'particularly', 'perfectly',
  'possibly', 'precisely', 'presumably', 'probably', 'quickly', 'quietly',
  'rapidly', 'rarely', 'really', 'relatively', 'remarkably', 'roughly',
  'seemingly', 'seriously', 'significantly', 'simply', 'slightly', 'slowly',
  'specifically', 'strongly', 'substantially', 'suddenly', 'surely',
  'surprisingly', 'terribly', 'totally', 'truly', 'typically', 'ultimately',
  'unfortunately', 'usually', 'utterly', 'vastly', 'virtually', 'widely',
];

// Single-word weasel words / qualifiers (write-good's `weasel-words`).
const WEASEL_WORDS = [
  'clearly', 'completely', 'exceedingly', 'excellent', 'extremely', 'fairly',
  'few', 'huge', 'interestingly', 'largely', 'many', 'mostly', 'obviously',
  'quite', 'relatively', 'remarkably', 'several', 'significantly',
  'substantially', 'surprisingly', 'tiny', 'various', 'vast', 'very',
];

// Multi-word vague attributions / hedges - the high-value "weasel" phrases
// users search for and that LLMs overuse. Not in write-good; our extension.
const WEASEL_PHRASES = [
  'studies suggest', 'studies show', 'research suggests', 'research shows',
  'researchers suggest', 'researchers believe', 'experts say', 'experts agree',
  'it is thought', 'it is said', 'it is believed', 'it is widely known',
  'it could be argued', 'it is important to note', 'it is worth noting',
  'many people believe', 'evidence suggests', 'some say', 'some argue',
  'some believe', 'critics say', 'sources say', 'a number of',
];

/* ------------------------------------------------------------------ *
 * Pre-compiled matchers (built once at module load).                  *
 * ------------------------------------------------------------------ */

/** Escape a literal string for safe insertion into a RegExp source. */
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Passive: a be-verb, optional intervening adverb, then a past participle
// (\w+ed OR an irregular). Captured groups let us locate the exact span.
const PASSIVE_RE = new RegExp(
  `\\b(${BE_VERBS.join('|')})\\b(\\s+\\w+ly)?\\s+(\\w*ed|${IRREGULAR_PARTICIPLES.join('|')})\\b`,
  'giu',
);

const ADVERB_RE = new RegExp(`\\b(${ADVERBS.map(esc).join('|')})\\b`, 'giu');

const WEASEL_WORD_RE = new RegExp(`\\b(${WEASEL_WORDS.map(esc).join('|')})\\b`, 'giu');

const WEASEL_PHRASE_RE = new RegExp(`(${WEASEL_PHRASES.map(esc).join('|')})`, 'giu');

/**
 * Zero-width / invisible characters frequently left in AI / web-copied text.
 * We strip them before tokenizing (same set as the main cleaner) so they can't
 * break word boundaries on pasted AI text. Kept here so the engine stays
 * dependency-free and self-contained.
 */
const INVISIBLES = /[​-‍⁠﻿­‎‏‪-‮⁡-⁤]/g;

/* ------------------------------------------------------------------ *
 * Per-category explanations (the "why" + a fix pattern).              *
 * ------------------------------------------------------------------ */

const PASSIVE_WHY = 'Passive voice hides who did the action.';
const PASSIVE_FIX = 'Name the actor: who did it? Rewrite to "[someone] [verb]…".';

const ADVERB_WHY = 'This -ly adverb usually props up a weak verb or adjective.';
const ADVERB_FIX = 'Cut it or pick a stronger word: "ran quickly" → "sprinted".';

const WEASEL_WHY = 'Weasel words and vague hedges dodge a concrete claim.';
const WEASEL_FIX = 'Be specific: replace with a number, a name, or a citation.';

/* ------------------------------------------------------------------ *
 * Tokenizing helpers.                                                 *
 * ------------------------------------------------------------------ */

/** Count words via Unicode-aware boundaries. */
export function countWords(text: string): number {
  const m = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return m ? m.length : 0;
}

/**
 * Split text into sentences, returning each sentence's {start, end, text}.
 * Guards against common abbreviations, decimals, ellipses and URLs so the
 * passive-percentage and sentence count stay sane. Deliberately simple - a
 * full parser is overkill for a static page.
 */
export interface Sentence {
  start: number;
  end: number;
  text: string;
}

const ABBREV = /\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|u\.s|a\.m|p\.m|inc|ltd|co|fig|no|vol)\.$/i;

export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  let start = 0;
  const n = text.length;

  for (let i = 0; i < n; i++) {
    const c = text[i];
    if (c === '.' || c === '!' || c === '?') {
      // Swallow runs of terminators / ellipses ("?!", "…", "...").
      let j = i;
      while (j + 1 < n && '.!?'.includes(text[j + 1])) j++;

      const next = text[j + 1] ?? '';
      const chunk = text.slice(start, j + 1);

      // Decimal like "3.5": digit on both sides of a single dot - not an end.
      const isDecimal =
        c === '.' && /\d$/.test(text.slice(0, i)) && /^\d/.test(text.slice(i + 1));
      // Known abbreviation immediately before the dot.
      const isAbbrev = c === '.' && ABBREV.test(chunk);

      // A real boundary: followed by whitespace/EOF and not a decimal/abbrev.
      if (!isDecimal && !isAbbrev && (next === '' || /\s/.test(next))) {
        const t = text.slice(start, j + 1).trim();
        if (t) {
          const lead = text.slice(start, j + 1).length - text.slice(start, j + 1).trimStart().length;
          out.push({ start: start + lead, end: j + 1, text: t });
        }
        // Advance past the trailing whitespace to the next sentence start.
        let k = j + 1;
        while (k < n && /\s/.test(text[k])) k++;
        start = k;
        i = k - 1;
      } else {
        i = j; // consumed the terminator run
      }
    }
  }

  // Trailing sentence with no terminator.
  if (start < n) {
    const t = text.slice(start).trim();
    if (t) {
      const lead = text.slice(start).length - text.slice(start).trimStart().length;
      out.push({ start: start + lead, end: n, text: t });
    }
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Core detection.                                                     *
 * ------------------------------------------------------------------ */

/**
 * Push every non-overlapping match of `re` in `text` as a flag.
 * `group` selects which capture group is the actual span to highlight
 * (0 = whole match). `skip` lets a caller reject a match (e.g. the
 * "too many / too few" exception).
 */
function collect(
  text: string,
  re: RegExp,
  category: Category,
  why: string,
  fix: string,
  group = 0,
  skip?: (m: RegExpExecArray) => boolean,
): Flag[] {
  const flags: Flag[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    // Guard against zero-width matches looping forever.
    if (m.index === re.lastIndex) re.lastIndex++;
    if (skip && skip(m)) continue;

    // Locate the chosen capture group within the whole match.
    let start = m.index;
    let matched = m[0];
    if (group > 0 && m[group]) {
      const rel = m[0].indexOf(m[group]);
      if (rel >= 0) {
        start = m.index + rel;
        matched = m[group];
      }
    }
    flags.push({
      start,
      end: start + matched.length,
      category,
      text: matched,
      why,
      fix,
    });
  }
  return flags;
}

// "indeed" must never be flagged as passive (write-good exception); and the
// "too many / too few" qualifier is allowed, so skip a weasel match preceded
// by "too ".
function weaselSkip(m: RegExpExecArray): boolean {
  const before = m.input.slice(Math.max(0, m.index - 5), m.index).toLowerCase();
  return /\btoo\s$/.test(before);
}

/**
 * Resolve overlaps so a single word is never double-wrapped. Precedence:
 * passive > weasel > adverb (matches the spec). Returns a sorted,
 * non-overlapping list.
 */
function dedupe(flags: Flag[]): Flag[] {
  const rank: Record<Category, number> = { passive: 0, weasel: 1, adverb: 2 };
  // Sort by start, then by precedence, then by longer span first.
  const sorted = [...flags].sort(
    (a, b) =>
      a.start - b.start ||
      rank[a.category] - rank[b.category] ||
      b.end - a.end,
  );
  const out: Flag[] = [];
  let lastEnd = -1;
  for (const f of sorted) {
    if (f.start >= lastEnd) {
      out.push(f);
      lastEnd = f.end;
    }
  }
  return out;
}

/**
 * Analyse `raw` text: return the flag spans (filtered by `toggles`) plus the
 * headline stats. Indices map into the ORIGINAL string, so callers can render
 * an overlay or jump to a span without re-tokenizing.
 */
export function analyze(raw: string, toggles: Toggles = DEFAULT_TOGGLES): Analysis {
  // Strip invisibles up front so word boundaries are reliable on AI paste.
  const text = raw.replace(INVISIBLES, '');

  let flags: Flag[] = [];

  if (toggles.passive) {
    flags.push(...collect(text, PASSIVE_RE, 'passive', PASSIVE_WHY, PASSIVE_FIX, 0,
      (m) => /\bindeed\b/i.test(m[0])));
  }
  if (toggles.weasel) {
    flags.push(...collect(text, WEASEL_PHRASE_RE, 'weasel', WEASEL_WHY, WEASEL_FIX));
    flags.push(...collect(text, WEASEL_WORD_RE, 'weasel', WEASEL_WHY, WEASEL_FIX, 0, weaselSkip));
  }
  if (toggles.adverb) {
    flags.push(...collect(text, ADVERB_RE, 'adverb', ADVERB_WHY, ADVERB_FIX));
  }

  flags = dedupe(flags);

  // Count passive *sentences* (not raw matches) for the percentage band.
  const sentences = splitSentences(text);
  const passiveFlags = flags.filter((f) => f.category === 'passive');
  let passiveSentences = 0;
  for (const s of sentences) {
    if (passiveFlags.some((f) => f.start >= s.start && f.start < s.end)) {
      passiveSentences++;
    }
  }

  const words = countWords(text);
  const passive = flags.filter((f) => f.category === 'passive').length;
  const adverb = flags.filter((f) => f.category === 'adverb').length;
  const weasel = flags.filter((f) => f.category === 'weasel').length;

  const passivePct = sentences.length
    ? Math.round((passiveSentences / sentences.length) * 100)
    : 0;

  // Directness: start at 100, subtract a weighted penalty per flag density.
  // ~1 flag per 12 words ≈ a meaningful hit. Clamp to 0–100.
  const total = passive + adverb + weasel;
  const per100 = words > 0 ? (total / words) * 100 : 0;
  const directness = words === 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - per100 * 6)));

  return {
    flags,
    stats: { words, sentences: sentences.length, passive, adverb, weasel, passivePct, directness },
    cleaned: text,
  };
}

/**
 * A compact, shareable one-line summary of an analysis
 * ("3 passive, 8 adverbs, 2 weasel - Directness 78/100").
 */
export function summarize(a: Analysis): string {
  const { passive, adverb, weasel, directness } = a.stats;
  return `${passive} passive, ${adverb} adverb${adverb === 1 ? '' : 's'}, ${weasel} weasel - Directness ${directness}/100`;
}

/** Human label for a category (UI legends, aria-labels, the issues list). */
export const CATEGORY_LABEL: Record<Category, string> = {
  passive: 'Passive voice',
  adverb: '-ly adverb',
  weasel: 'Weasel / vague',
};

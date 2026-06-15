/**
 * Case Converter - pure, framework-free transform engine.
 *
 * Design goals (see docs/tools/case-converter.md):
 *  - Correctness over a naive `.toUpperCase()` clone: real sentence-boundary
 *    detection, proper-noun / acronym preservation, and genuine style-guide
 *    small-word lists (AP / Chicago / APA / MLA) instead of "lowercase every
 *    short word."
 *  - Developer cases (camelCase, snake_case, …) with tokenization that handles
 *    acronym runs ("XMLParser" → "xml_parser", not "x_m_l_parser").
 *  - 100% in-browser, synchronous, deterministic. Nothing here touches the DOM
 *    or the network.
 */

/** Every case mode the UI can request. */
export type CaseMode =
  | 'upper'
  | 'lower'
  | 'sentence'
  | 'title'
  | 'capitalize' // Capitalize Each Word
  | 'alternating'
  | 'inverse'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'dot';

/** Title-case style guides, each with its own small-word handling. */
export type TitleStyle = 'ap' | 'chicago' | 'apa' | 'mla';

export interface ConvertOptions {
  /** Which case to produce. */
  mode: CaseMode;
  /** Style guide used only when mode === 'title'. Defaults to AP. */
  titleStyle: TitleStyle;
  /** Keep NASA / iPhone / JavaScript / New York intact rather than down-casing. */
  preserveProperNouns: boolean;
  /** Optional user "always keep as-is" terms, keyed lowercase → canonical. */
  customTerms?: Record<string, string>;
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  mode: 'title',
  titleStyle: 'ap',
  preserveProperNouns: true,
};

/** Human-readable label + short description for each mode (used by the UI). */
export const MODE_LABELS: Record<CaseMode, { label: string; hint: string }> = {
  upper: { label: 'UPPER CASE', hint: 'Every letter capitalized.' },
  lower: { label: 'lower case', hint: 'Every letter lowercased.' },
  sentence: { label: 'Sentence case', hint: 'Capitalize the first letter of each sentence.' },
  title: { label: 'Title Case', hint: 'Capitalize important words per a style guide.' },
  capitalize: { label: 'Capitalize Each Word', hint: 'First letter of every word capitalized.' },
  alternating: { label: 'aLtErNaTiNg', hint: 'Alternate lower/upper across letters.' },
  inverse: { label: 'InVeRsE', hint: 'Swap the case of every letter.' },
  camel: { label: 'camelCase', hint: 'firstWordLower, rest capitalized, no spaces.' },
  pascal: { label: 'PascalCase', hint: 'EveryWordCapitalized, no spaces.' },
  snake: { label: 'snake_case', hint: 'lowercase words joined by underscores.' },
  kebab: { label: 'kebab-case', hint: 'lowercase words joined by hyphens.' },
  constant: { label: 'CONSTANT_CASE', hint: 'UPPERCASE words joined by underscores.' },
  dot: { label: 'dot.case', hint: 'lowercase words joined by dots.' },
};

export const TITLE_STYLE_LABELS: Record<TitleStyle, string> = {
  ap: 'AP',
  chicago: 'Chicago',
  apa: 'APA 7',
  mla: 'MLA',
};

// ---------------------------------------------------------------------------
// Small-word lists for title casing.
// ---------------------------------------------------------------------------

/** Articles - lowercased mid-title in every style. */
const ARTICLES = new Set(['a', 'an', 'the']);

/** Coordinating conjunctions - lowercased mid-title in every style. */
const COORD_CONJUNCTIONS = new Set(['and', 'but', 'for', 'nor', 'or']);

/**
 * Common prepositions. Styles differ on how they treat these by length, so we
 * keep the full set and decide per style below.
 */
const PREPOSITIONS = new Set([
  'aboard', 'about', 'above', 'across', 'after', 'against', 'along', 'amid',
  'among', 'around', 'as', 'at', 'before', 'behind', 'below', 'beneath',
  'beside', 'besides', 'between', 'beyond', 'by', 'down', 'during', 'except',
  'for', 'from', 'in', 'inside', 'into', 'like', 'near', 'of', 'off', 'on',
  'onto', 'out', 'outside', 'over', 'past', 'per', 'since', 'than', 'through',
  'throughout', 'till', 'to', 'toward', 'towards', 'under', 'underneath',
  'until', 'unto', 'up', 'upon', 'via', 'with', 'within', 'without',
]);

/**
 * Decide whether a lowercase word should stay lowercase mid-title under a given
 * style guide. First/last word and after-colon handling is done by the caller.
 */
function isSmallWord(word: string, style: TitleStyle): boolean {
  const w = word.toLowerCase();

  // Articles are always lowercase mid-title.
  if (ARTICLES.has(w)) return true;

  // Coordinating conjunctions: all styles lowercase and/but/for/nor/or.
  if (COORD_CONJUNCTIONS.has(w)) return true;
  // AP additionally treats short "yet" and "so" as lowercase conjunctions;
  // Chicago capitalizes them.
  if ((w === 'yet' || w === 'so') && style === 'ap') return true;

  const isPrep = PREPOSITIONS.has(w);
  if (isPrep) {
    switch (style) {
      // AP: lowercase prepositions of 3 letters or fewer, capitalize 4+.
      case 'ap':
        return w.length <= 3;
      // Chicago (CMOS): lowercase all prepositions regardless of length.
      case 'chicago':
        return true;
      // APA 7: lowercase short (3-letter-or-fewer) prepositions, capitalize 4+.
      case 'apa':
        return w.length <= 3;
      // MLA: lowercase prepositions of any length.
      case 'mla':
        return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Proper-noun / acronym preservation.
// ---------------------------------------------------------------------------

/**
 * A small bundled set of well-known terms whose internal casing must survive.
 * (A full ~3k-entry dictionary would ship lazily; this MVP keeps the most
 * common offenders so casing isn't visibly wrong.)
 */
const KNOWN_TERMS: Record<string, string> = {};
for (const t of [
  'NASA', 'FBI', 'CIA', 'NATO', 'USA', 'UK', 'EU', 'UN', 'CEO', 'CTO',
  'iPhone', 'iPad', 'iPod', 'iOS', 'macOS', 'iMac', 'eBay', 'iTunes',
  'JavaScript', 'TypeScript', 'HTML', 'CSS', 'JSON', 'XML', 'SQL', 'API',
  'PostgreSQL', 'MySQL', 'GitHub', 'OpenAI', 'ChatGPT', 'YouTube', 'LinkedIn',
  'PhD', 'WiFi', 'PDF', 'URL', 'HTTP', 'HTTPS', 'AI', 'ML', 'UX', 'UI',
]) {
  KNOWN_TERMS[t.toLowerCase()] = t;
}

/**
 * A token already looks intentionally cased if it contains an internal capital
 * (iPhone, eBay) or is an all-caps run of 2+ letters (NASA, SQL). Such tokens
 * are left untouched and never down-cased.
 */
function looksIntentionallyCased(token: string): boolean {
  const letters = token.replace(/[^\p{L}]/gu, '');
  if (letters.length < 2) return false;
  // All-caps acronym.
  if (letters === letters.toUpperCase() && /[A-Z]/.test(letters)) return true;
  // Internal capital after a lowercase letter (iPhone, eBay, JavaScript).
  return /[a-z][A-Z]/.test(token);
}

/**
 * Look up a custom/known canonical spelling for a word (ignoring trailing
 * punctuation). Returns the canonical form re-attached to its punctuation, or
 * null if the word isn't a known term.
 */
function lookupKnown(
  token: string,
  custom: Record<string, string>,
): string | null {
  const m = token.match(/^(\p{P}*)(.*?)(\p{P}*)$/u);
  if (!m) return null;
  const [, pre, core, post] = m;
  if (!core) return null;
  const key = core.toLowerCase();
  const canonical = custom[key] ?? KNOWN_TERMS[key];
  return canonical ? pre + canonical + post : null;
}

/** Build a lowercase-keyed map from a user's custom term list. */
export function buildCustomTerms(terms: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of terms) {
    const trimmed = t.trim();
    if (trimmed) out[trimmed.toLowerCase()] = trimmed;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Word-level capitalization helpers.
// ---------------------------------------------------------------------------

/** Capitalize the first alphabetic char of a word, lowercase the rest. */
function capitalizeWord(word: string): string {
  const m = word.match(/\p{L}/u);
  if (!m) return word;
  const i = word.indexOf(m[0]);
  return word.slice(0, i) + m[0].toLocaleUpperCase() + word.slice(i + 1).toLocaleLowerCase();
}

/** Standalone "i" and its contractions become "I" / "I'm" etc. */
function fixStandaloneI(text: string): string {
  return text.replace(/\bi\b/g, 'I').replace(/\bi('(?:m|ll|ve|d|re))/gi, (_m, suf) => 'I' + suf);
}

// ---------------------------------------------------------------------------
// Title case.
// ---------------------------------------------------------------------------

/**
 * Capitalize one whitespace-delimited word for title case, honoring small-word
 * rules, hyphenated compounds, and proper-noun preservation. `force` capitalizes
 * regardless of the small-word list (used for first/last/after-colon words).
 */
function titleWord(
  word: string,
  style: TitleStyle,
  force: boolean,
  preserve: boolean,
  custom: Record<string, string>,
): string {
  if (!word) return word;

  // Preserve known terms and already-intentionally-cased tokens verbatim.
  if (preserve) {
    const known = lookupKnown(word, custom);
    if (known) return known;
    if (looksIntentionallyCased(word)) return word;
  }

  // Hyphenated compounds: cap each part against the small-word list.
  if (word.includes('-')) {
    const parts = word.split('-');
    return parts
      .map((part, idx) => {
        // AP capitalizes both parts; Chicago typically caps only the first.
        if (style === 'chicago' && idx > 0 && isSmallWord(part, style)) {
          return part.toLocaleLowerCase();
        }
        if (!force && idx > 0 && isSmallWord(part, style)) {
          return part.toLocaleLowerCase();
        }
        return capitalizeWord(part);
      })
      .join('-');
  }

  if (!force && isSmallWord(word, style)) return word.toLocaleLowerCase();
  return capitalizeWord(word);
}

/** Apply style-guide title casing to a single line. */
function titleCaseLine(
  line: string,
  style: TitleStyle,
  preserve: boolean,
  custom: Record<string, string>,
): string {
  // Split on whitespace but keep the separators so spacing is preserved.
  const parts = line.split(/(\s+)/);
  // Indexes of the actual word tokens (odd-index entries are whitespace).
  const wordIdx = parts.map((p, i) => (/\S/.test(p) ? i : -1)).filter((i) => i >= 0);
  const firstWord = wordIdx[0];
  const lastWord = wordIdx[wordIdx.length - 1];

  let prevEndedColon = false;
  return parts
    .map((part, i) => {
      if (!/\S/.test(part)) return part; // whitespace untouched
      const isFirst = i === firstWord;
      const isLast = i === lastWord;
      // Always capitalize first word, last word, and the first word of a subtitle.
      const force = isFirst || isLast || prevEndedColon;
      prevEndedColon = /:$/.test(part.trim());
      return titleWord(part, style, force, preserve, custom);
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Sentence case.
// ---------------------------------------------------------------------------

/**
 * Capitalize the first alphabetic character of each sentence. Sentences are
 * split on ., !, ? (plus line breaks). Proper nouns / acronyms are preserved
 * when the toggle is on; otherwise the body is lowercased.
 */
function sentenceCase(
  text: string,
  preserve: boolean,
  custom: Record<string, string>,
): string {
  // Process line by line so newlines (and empty lines) survive intact.
  return text
    .split('\n')
    .map((line) => {
      // Split into "sentence + following whitespace" chunks via the terminators.
      let capitalizeNext = true;
      let out = '';
      // Walk word by word, preserving punctuation/whitespace between them.
      const tokens = line.split(/(\s+)/);
      for (const tok of tokens) {
        if (!/\S/.test(tok)) {
          out += tok;
          continue;
        }
        let word = tok;
        const known = preserve ? lookupKnown(word, custom) : null;
        const intentional = preserve && looksIntentionallyCased(word);

        if (known) {
          word = known;
        } else if (intentional) {
          // leave as-is
        } else if (capitalizeNext) {
          word = capitalizeWord(word);
        } else if (preserve && /^\p{Lu}\p{Ll}/u.test(word)) {
          // Leading-capital + lowercase tail likely marks a proper noun
          // (John, Monday, Paris). Preserve it instead of down-casing.
        } else {
          word = word.toLocaleLowerCase();
        }

        out += word;
        // The next word starts a new sentence if this token ends in . ! ?
        // (allowing trailing quotes/brackets).
        capitalizeNext = /[.!?][)"'”’\]]*$/.test(tok);
      }
      return fixStandaloneI(out);
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Novelty cases.
// ---------------------------------------------------------------------------

/** aLtErNaTiNg: parity advances only on letters so spacing doesn't shift it. */
function alternatingCase(text: string): string {
  let upper = false; // first letter is lower in classic "mocking" form
  let out = '';
  for (const ch of text) {
    if (/\p{L}/u.test(ch)) {
      out += upper ? ch.toLocaleUpperCase() : ch.toLocaleLowerCase();
      upper = !upper;
    } else {
      out += ch;
    }
  }
  return out;
}

/** InVeRsE: swap the case of every letter. */
function inverseCase(text: string): string {
  let out = '';
  for (const ch of text) {
    const up = ch.toLocaleUpperCase();
    const lo = ch.toLocaleLowerCase();
    out += ch === lo && ch !== up ? up : ch === up && ch !== lo ? lo : ch;
  }
  return out;
}

/** Capitalize the first letter of every whitespace-delimited word. */
function capitalizeEachWord(text: string): string {
  return text.replace(/(\p{L})(\p{L}*)/gu, (_m, first, rest) =>
    first.toLocaleUpperCase() + rest,
  );
}

// ---------------------------------------------------------------------------
// Developer cases.
// ---------------------------------------------------------------------------

/**
 * Tokenize an identifier or phrase into lowercase word parts. Splits on spaces,
 * underscores, hyphens, and dots, plus camelCase boundaries. Acronym runs are
 * handled: "XMLParser" → ["xml", "parser"], not ["x","m","l","parser"].
 */
export function tokenizeWords(input: string): string[] {
  return input
    // Insert a boundary between a lowercase/digit and a following uppercase.
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // Insert a boundary between an uppercase run and an Uppercase+lowercase word.
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Treat separators as spaces.
    .replace(/[_\-.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function toCamel(words: string[]): string {
  return words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}
function toPascal(words: string[]): string {
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/**
 * Convert `input` to the requested case. Pure and synchronous; safe to call on
 * every keystroke. Developer cases operate per line so multi-line input keeps
 * its line structure.
 */
export function convert(input: string, opts: ConvertOptions = DEFAULT_OPTIONS): string {
  const custom = opts.customTerms ?? {};

  switch (opts.mode) {
    case 'upper':
      return input.toLocaleUpperCase();
    case 'lower':
      return input.toLocaleLowerCase();
    case 'capitalize':
      return capitalizeEachWord(input);
    case 'alternating':
      return alternatingCase(input);
    case 'inverse':
      return inverseCase(input);
    case 'sentence':
      return sentenceCase(input, opts.preserveProperNouns, custom);
    case 'title':
      // Normalize ALL-CAPS body to lowercase first so rules can re-apply.
      return input
        .split('\n')
        .map((line) => {
          const body = line === line.toUpperCase() ? line.toLowerCase() : line;
          return titleCaseLine(body, opts.titleStyle, opts.preserveProperNouns, custom);
        })
        .join('\n');
    // Developer cases: tokenize per line, re-emit with the target joiner.
    case 'camel':
      return input.split('\n').map((l) => toCamel(tokenizeWords(l))).join('\n');
    case 'pascal':
      return input.split('\n').map((l) => toPascal(tokenizeWords(l))).join('\n');
    case 'snake':
      return input.split('\n').map((l) => tokenizeWords(l).join('_')).join('\n');
    case 'kebab':
      return input.split('\n').map((l) => tokenizeWords(l).join('-')).join('\n');
    case 'constant':
      return input.split('\n').map((l) => tokenizeWords(l).map((w) => w.toUpperCase()).join('_')).join('\n');
    case 'dot':
      return input.split('\n').map((l) => tokenizeWords(l).join('.')).join('\n');
    default:
      return input;
  }
}

export interface TextStats {
  chars: number;
  words: number;
  sentences: number;
  lines: number;
  /** Estimated reading time in minutes (≈200 wpm), at least 1 when non-empty. */
  readingMin: number;
}

/** Live counters for the stats bar. Pure; counts on the raw input. */
export function stats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed ? (trimmed.match(/[.!?]+(\s|$)/g) || []).length || (words ? 1 : 0) : 0;
  const lines = text === '' ? 0 : text.split('\n').length;
  return {
    chars: text.length,
    words,
    sentences,
    lines,
    readingMin: words ? Math.max(1, Math.round(words / 200)) : 0,
  };
}

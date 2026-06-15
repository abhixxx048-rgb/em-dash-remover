/**
 * Straight-to-Curly Smart Quotes Converter - pure client-side engine.
 *
 * The deliberate inverse of the site's curly→straight cleaner: it "educates"
 * typewriter punctuation (straight quotes ", apostrophes ', `--`, `...`) into
 * typographically correct marks (directional curly quotes, true apostrophes,
 * en/em dashes, a real ellipsis, and optional feet/inch primes).
 *
 * Design goals (see docs/tools/straight-to-curly-quotes-converter.md):
 *  - Directional CORRECTNESS, not a naive find-replace. The headline wins are
 *    the famous SmartyPants misses: decades (’90s), leading contractions
 *    (’Twas, ’em), and feet/inch primes (6′2″) that Word turns into curly quotes.
 *  - A preserve guard so code spans, fenced blocks and URLs/paths keep their
 *    straight quotes (you do NOT want curled quotes inside a URL or code).
 *  - Locale presets (US/UK English, German, French guillemets).
 *  - 100% in-browser, synchronous, deterministic. Nothing touches the network.
 *
 * Adapted from the well-documented SmartyPants "educate" algorithm (Gruber),
 * hand-rolled (~no deps) so we can bolt on the decade/prime/locale extensions.
 */

// --- Unicode characters ----------------------------------------------------
// Directional double quotes.
const LDQUO = '“'; // “ opening double
const RDQUO = '”'; // ” closing double
// Directional single quotes / apostrophe.
const LSQUO = '‘'; // ‘ opening single
const RSQUO = '’'; // ’ closing single + apostrophe
// Dashes (mirrors the EM/EN constants in src/lib/cleaner.ts).
const EM = '-'; // - em dash
const EN = '–'; // – en dash
// Ellipsis + primes.
const HELLIP = '…'; // … ellipsis
const PRIME = '′'; // ′ feet
const DPRIME = '″'; // ″ inches
// Locale alternates.
const BDQUO = '„'; // „ German opening (low) double
const LAQUO = '«'; // « French opening guillemet
const RAQUO = '»'; // » French closing guillemet

/** Supported typographic locale/style presets. Quote direction is language-dependent. */
export type Locale = 'us' | 'uk' | 'de' | 'fr';

/** The four characters a given locale uses, in [openDouble, closeDouble, openSingle, closeSingle] order. */
interface QuoteSet {
  openDouble: string;
  closeDouble: string;
  openSingle: string;
  closeSingle: string;
}

/**
 * Per-locale quote characters.
 *  - us / uk: standard curly quotes. (UK historically used single-primary, but
 *    modern UK practice is double-primary; we keep the same glyphs and note the
 *    distinction in the UI rather than re-nesting, to stay deterministic.)
 *  - de: „…“ low-opening / high-closing double quotes.
 *  - fr: «…» guillemets for double; singles fall back to curly for nesting.
 */
const QUOTE_SETS: Record<Locale, QuoteSet> = {
  us: { openDouble: LDQUO, closeDouble: RDQUO, openSingle: LSQUO, closeSingle: RSQUO },
  uk: { openDouble: LDQUO, closeDouble: RDQUO, openSingle: LSQUO, closeSingle: RSQUO },
  de: { openDouble: BDQUO, closeDouble: LDQUO, openSingle: LSQUO, closeSingle: RSQUO },
  fr: { openDouble: LAQUO, closeDouble: RAQUO, openSingle: LSQUO, closeSingle: RSQUO },
};

export const LOCALE_LABELS: Record<Locale, string> = {
  us: 'US English “ ”',
  uk: 'UK English “ ”',
  de: 'German „ “',
  fr: 'French « »',
};

export interface EducateOptions {
  /** Quote/locale preset. Default 'us'. */
  locale: Locale;
  /** Detect feet/inch measurements (6'2") and emit primes ′ ″ instead of quotes. */
  primes: boolean;
  /** Convert `--`→en, `---`→em, and the ellipsis. Off = leave dashes/dots alone. */
  dashes: boolean;
  /** `...` and `. . .` → a single … character. */
  ellipsis: boolean;
  /** Output HTML numeric entities (&#8220;) instead of literal Unicode (for CMS storage). */
  htmlEntities: boolean;
}

export const DEFAULT_OPTIONS: EducateOptions = {
  locale: 'us',
  primes: true,
  dashes: true,
  ellipsis: true,
  htmlEntities: false,
};

/** A running scoreboard of what the educate pass changed. */
export interface EducateCounts {
  doubleQuotes: number; // straight " → “ ”
  singleQuotes: number; // straight ' → ‘ ’ (incl. apostrophes)
  dashes: number; // -- / --- upgraded
  ellipses: number; // ... → …
  primes: number; // feet/inch primes emitted
  decades: number; // ’90s-style closing apostrophes fixed
  contractions: number; // leading contractions (’Twas, ’em) fixed
  total: number;
}

/** Which "tricky case" patterns were detected - drives the spotlight chips in the UI. */
export interface EdgeCaseFlags {
  decade: boolean; // ’90s
  contraction: boolean; // ’Twas / ’em
  measurement: boolean; // 6'2" → primes
  nested: boolean; // single inside double
}

export interface EducateResult {
  text: string;
  counts: EducateCounts;
  flags: EdgeCaseFlags;
}

// Known leading contractions whose apostrophe must curl CLOSING (’), not opening.
// The canonical SmartyPants algorithm gets these wrong; handling them is our wedge.
const LEADING_CONTRACTIONS = [
  'twas', 'tis', 'em', 'cause', 'round', 'bout', 'til', 'n', 'nuff', 'fraid', 'gainst',
];

/**
 * Pre-pass tokenizer: split the input into PROSE and PRESERVED segments so we
 * never curl quotes inside fenced code, inline code, or URLs/paths. Mirrors how
 * SmartyPants skips <pre>/<code>/<kbd>. We educate prose tokens only, then rejoin.
 *
 * Order of the alternation matters: fenced blocks first (greedy across lines),
 * then inline backticks, then URLs/paths.
 */
const PRESERVE_RE =
  /(```[\s\S]*?```|`[^`]*`|\bhttps?:\/\/\S+|\bwww\.\S+|\b[\w.~-]+\/[\w./~-]*)/g;

interface Token {
  text: string;
  prose: boolean;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  PRESERVE_RE.lastIndex = 0;
  while ((m = PRESERVE_RE.exec(input)) !== null) {
    if (m.index > last) tokens.push({ text: input.slice(last, m.index), prose: true });
    tokens.push({ text: m[0], prose: false });
    last = m.index + m[0].length;
    // Guard against zero-length matches (shouldn't happen, but stay safe).
    if (m[0].length === 0) PRESERVE_RE.lastIndex++;
  }
  if (last < input.length) tokens.push({ text: input.slice(last), prose: true });
  return tokens;
}

/** Escape a literal mark to its HTML numeric entity when htmlEntities is on. */
function entity(ch: string): string {
  return '&#' + ch.codePointAt(0) + ';';
}

/**
 * Educate a single PROSE chunk. The passes run in a fixed order - primes and
 * the decade/contraction guards MUST run before the generic quote logic so a
 * measurement (6'2") or a decade (’90s) is not mis-curled into quotes.
 */
function educateProse(
  text: string,
  opts: EducateOptions,
  counts: EducateCounts,
  flags: EdgeCaseFlags,
): string {
  const q = QUOTE_SETS[opts.locale];

  // Sentinel placeholders keep already-decided marks out of later passes.
  // (Private-use code points; removed again at the very end.)
  const P_OPEN_D = '';
  const P_CLOSE_D = '';
  const P_OPEN_S = '';
  const P_CLOSE_S = '';
  const P_PRIME = '';
  const P_DPRIME = '';

  // --- 0) Dashes + ellipsis (do these first so a following quote sees the dash
  // as an "opening" context, e.g. an apostrophe right after an em dash).
  if (opts.dashes) {
    // `---` → em, `--` → en. Longest first.
    text = text.replace(/---/g, () => { counts.dashes++; return EM; });
    text = text.replace(/--/g, () => { counts.dashes++; return EN; });
  }
  if (opts.ellipsis) {
    // `....` → … + period; `...` and spaced `. . .` → a single … .
    text = text.replace(/\.\.\.\./g, () => { counts.ellipses++; return HELLIP + '.'; });
    text = text.replace(/\.\.\./g, () => { counts.ellipses++; return HELLIP; });
    text = text.replace(/\.\s\.\s\./g, () => { counts.ellipses++; return HELLIP; });
  }

  // --- 1) Feet/inch primes (before any quote rule). Combined foot-inch first
  // (6'2", 5' 10"), then lone inches (5"), then lone feet (5').
  if (opts.primes) {
    text = text.replace(/(\d)\s*'(\s*)(\d+(?:\.\d+)?)\s*"/g, (_m, ft, sp, inch) => {
      counts.primes += 2; flags.measurement = true;
      return ft + P_PRIME + sp + inch + P_DPRIME;
    });
    text = text.replace(/(\d(?:\.\d+)?)\s*"/g, (_m, n) => {
      counts.primes++; flags.measurement = true;
      return n + P_DPRIME;
    });
    text = text.replace(/(\d(?:\.\d+)?)\s*'(?![A-Za-z])/g, (_m, n) => {
      counts.primes++; flags.measurement = true;
      return n + P_PRIME;
    });
  }

  // --- 2) Decade / leading-contraction guard: force CLOSING apostrophe ’.
  // Decades: '90s, '08 - apostrophe + two digits + optional s.
  text = text.replace(/'(?=\d\d)/g, () => {
    counts.singleQuotes++; counts.decades++; flags.decade = true;
    return P_CLOSE_S;
  });
  // Leading contractions: '?word at a word boundary, case-insensitive.
  const contractionRe = new RegExp(
    "'(?=(?:" + LEADING_CONTRACTIONS.join('|') + ")\\b)",
    'gi',
  );
  text = text.replace(contractionRe, () => {
    counts.singleQuotes++; counts.contractions++; flags.contraction = true;
    return P_CLOSE_S;
  });

  // --- 3) Opening quotes: a " or ' is OPENING when it follows start-of-string,
  // whitespace, an opening bracket, or an em/en dash.
  text = text.replace(/(^|[\s([{–-])"/g, (_m, pre) => {
    counts.doubleQuotes++;
    return pre + P_OPEN_D;
  });
  text = text.replace(/(^|[\s([{–-])'/g, (_m, pre) => {
    counts.singleQuotes++;
    return pre + P_OPEN_S;
  });

  // --- 4) Closing quotes / apostrophes: every remaining straight mark.
  text = text.replace(/"/g, () => { counts.doubleQuotes++; return P_CLOSE_D; });
  text = text.replace(/'/g, () => { counts.singleQuotes++; return P_CLOSE_S; });

  // --- 5) Detect nesting for the spotlight chip (a single pair sitting inside
  // a double pair). Purely informational; does not change output.
  if (
    new RegExp(P_OPEN_D + '[^' + P_CLOSE_D + ']*' + P_OPEN_S).test(text) ||
    /‘[^’]*’/.test(text)
  ) {
    flags.nested = true;
  }

  // --- 6) Materialize placeholders into the locale's real glyphs (or entities).
  const map: Record<string, string> = {
    [P_OPEN_D]: q.openDouble,
    [P_CLOSE_D]: q.closeDouble,
    [P_OPEN_S]: q.openSingle,
    [P_CLOSE_S]: q.closeSingle,
    [P_PRIME]: PRIME,
    [P_DPRIME]: DPRIME,
  };
  text = text.replace(/[-]/g, (ch) => {
    const real = map[ch];
    return opts.htmlEntities ? entity(real) : real;
  });

  // When emitting entities, also encode the dash/ellipsis glyphs we inserted.
  if (opts.htmlEntities) {
    text = text
      .replace(/-/g, entity(EM))
      .replace(/–/g, entity(EN))
      .replace(/…/g, entity(HELLIP));
  }

  return text;
}

/**
 * Main entry point: educate `input` per `opts`, preserving code/URLs, and
 * return the curled text plus counts + edge-case flags for the UI.
 */
export function educate(input: string, opts: EducateOptions = DEFAULT_OPTIONS): EducateResult {
  const counts: EducateCounts = {
    doubleQuotes: 0, singleQuotes: 0, dashes: 0, ellipses: 0,
    primes: 0, decades: 0, contractions: 0, total: 0,
  };
  const flags: EdgeCaseFlags = { decade: false, contraction: false, measurement: false, nested: false };

  if (!input) return { text: '', counts, flags };

  // NFC-normalize first so combining marks don't break the regexes.
  const normalized = input.normalize('NFC');

  const out = tokenize(normalized)
    .map((tok) => (tok.prose ? educateProse(tok.text, opts, counts, flags) : tok.text))
    .join('');

  counts.total =
    counts.doubleQuotes + counts.singleQuotes + counts.dashes +
    counts.ellipses + counts.primes;

  return { text: out, counts, flags };
}

/** Lightweight word/char/reading-time stats for the counters bar. */
export function stats(text: string): { words: number; chars: number; readingMin: number } {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return {
    words,
    chars: text.length,
    readingMin: Math.max(words ? 1 : 0, Math.round(words / 220)),
  };
}

/** A deliberately gnarly demo string that exercises every hard case at once. */
export const DEMO_TEXT =
  `'Twas the '90s when she said, "He's 6'2\"... and that's it." ` +
  `The range was 10--20 degrees---a wild swing. ` +
  `Don't curl quotes in \`code = "x"\` or https://a.com/?q="z".`;

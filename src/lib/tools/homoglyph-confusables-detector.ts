/**
 * Homoglyph / Confusables Detector & Normalizer - pure analysis engine.
 *
 * Design goals (see docs/tools/homoglyph-confusables-detector.md):
 *  - Make invisible script-spoofing *visible and removable*. Given text, find
 *    every character that looks like an ordinary Latin/ASCII glyph but is really
 *    from another script (Cyrillic `а`, Greek `ο`, fullwidth `Ａ`, math `𝐀`),
 *    name it, map it back to its Latin prototype, and compute the UTS #39
 *    "skeleton" so users see what a machine really reads.
 *  - Data-driven, not a hand-rolled regex. A compact confusables table maps each
 *    source code point to { target, name, script } - bundled in the page, so the
 *    detection stays honest and the tooltips stay plain-English.
 *  - Dominant-script gating: text that is *legitimately* Cyrillic/Greek/CJK must
 *    NOT be flagged as an attack. We only flag look-alikes that mix into an
 *    otherwise-Latin document, which is the real spoof signature (`pаypаl`).
 *  - 100% in-browser, deterministic, no DOM and no network. Surrogate-safe: we
 *    always iterate by code point so astral chars (math alphanumerics) count as
 *    one character, never two surrogate halves.
 *
 * Brand stance: cleanup, never bypass. The job is to turn manipulated text back
 * into legitimate, all-Latin prose - never to "beat a detector," and we ship no
 * generator.
 */

/** Script families we recognise as Latin look-alikes (the high-value subset). */
export type ScriptClass = 'cyrillic' | 'greek' | 'fullwidth' | 'math' | 'other';

/**
 * Risk tier for a finding. Paired with an icon + label in the UI, never colour
 * alone (WCAG 1.4.1).
 *  - 'high'   Cyrillic / Greek letters mixed into Latin - the classic spoof.
 *  - 'medium' other cross-script look-alikes (Armenian, Cherokee, …).
 *  - 'low'    fullwidth / math-alphanumeric - usually cosmetic compatibility.
 */
export type Severity = 'high' | 'medium' | 'low';

/** Static metadata for a single confusable source code point. */
export interface Confusable {
  /** Numeric code point of the look-alike (e.g. 0x0430 for Cyrillic `а`). */
  cp: number;
  /** The plain ASCII/Latin string it maps to (usually 1 char, e.g. "a"). */
  target: string;
  /** Official-ish Unicode name (e.g. "CYRILLIC SMALL LETTER A"). */
  name: string;
  /** Which script family it belongs to. */
  script: ScriptClass;
}

/** A single detected occurrence within the scanned text. */
export interface Hit {
  /** Source look-alike code point. */
  cp: number;
  /** UTF-16 offset where this character starts (for click-to-jump). */
  index: number;
  /** Resolved confusable metadata. */
  info: Confusable;
  /** Severity for this hit (derived from script + mixing context). */
  severity: Severity;
}

/** Aggregated count for one distinct confusable code point. */
export interface CountRow {
  cp: number;
  info: Confusable;
  count: number;
  severity: Severity;
}

/** Counts in the shared CleanResult-style shape. */
export interface Counts {
  cyrillic: number;
  greek: number;
  fullwidth: number;
  math: number;
  other: number;
  /** Number of mixed-script word runs found. */
  runs: number;
  /** Total flagged characters. */
  total: number;
}

/** Full result of a detection pass. */
export interface DetectResult {
  /** Every flagged occurrence, in document order. */
  hits: Hit[];
  /** Per-code-point totals, sorted by count desc then code point asc. */
  rows: CountRow[];
  /** Counts in the shared shape. */
  counts: Counts;
  /** Highest severity present, or null when the text is clean. */
  topSeverity: Severity | null;
  /** Total code points scanned. */
  scanned: number;
  /** The document's dominant letter-script (drives gating). */
  dominant: DominantScript;
}

/* ------------------------------------------------------------------------- *
 * Confusables table.
 *
 * A pruned, hand-curated subset of Unicode confusables.txt (UTS #39) covering
 * the highest-value Latin look-alikes: the Cyrillic + Greek letters that share
 * a glyph with common Latin letters, plus the fullwidth ASCII block and the
 * mathematical-alphanumeric letters/digits (which we fold via NFKC at runtime,
 * so only their script tagging is hand-listed). Helper builders keep the prose
 * written once per family.
 * ------------------------------------------------------------------------- */

function c(cp: number, target: string, name: string, script: ScriptClass): Confusable {
  return { cp, target, name, script };
}

/**
 * Cyrillic letters that are confusable with a Latin letter. Source → Latin.
 * These are the ones that actually appear in spoofed Latin words; we don't list
 * every Cyrillic letter, only the look-alikes.
 */
const CYRILLIC: Array<[number, string, string]> = [
  [0x0430, 'a', 'CYRILLIC SMALL LETTER A'],
  [0x0410, 'A', 'CYRILLIC CAPITAL LETTER A'],
  [0x0435, 'e', 'CYRILLIC SMALL LETTER IE'],
  [0x0415, 'E', 'CYRILLIC CAPITAL LETTER IE'],
  [0x043e, 'o', 'CYRILLIC SMALL LETTER O'],
  [0x041e, 'O', 'CYRILLIC CAPITAL LETTER O'],
  [0x0440, 'p', 'CYRILLIC SMALL LETTER ER'],
  [0x0420, 'P', 'CYRILLIC CAPITAL LETTER ER'],
  [0x0441, 'c', 'CYRILLIC SMALL LETTER ES'],
  [0x0421, 'C', 'CYRILLIC CAPITAL LETTER ES'],
  [0x0443, 'y', 'CYRILLIC SMALL LETTER U'],
  [0x0445, 'x', 'CYRILLIC SMALL LETTER HA'],
  [0x0425, 'X', 'CYRILLIC CAPITAL LETTER HA'],
  [0x0456, 'i', 'CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I'],
  [0x0406, 'I', 'CYRILLIC CAPITAL LETTER BYELORUSSIAN-UKRAINIAN I'],
  [0x0458, 'j', 'CYRILLIC SMALL LETTER JE'],
  [0x0408, 'J', 'CYRILLIC CAPITAL LETTER JE'],
  [0x043d, 'H', 'CYRILLIC SMALL LETTER EN'],
  [0x041d, 'H', 'CYRILLIC CAPITAL LETTER EN'],
  [0x0432, 'B', 'CYRILLIC SMALL LETTER VE'],
  [0x0412, 'B', 'CYRILLIC CAPITAL LETTER VE'],
  [0x043c, 'M', 'CYRILLIC SMALL LETTER EM'],
  [0x041c, 'M', 'CYRILLIC CAPITAL LETTER EM'],
  [0x043a, 'k', 'CYRILLIC SMALL LETTER KA'],
  [0x041a, 'K', 'CYRILLIC CAPITAL LETTER KA'],
  [0x0442, 'T', 'CYRILLIC SMALL LETTER TE'],
  [0x0422, 'T', 'CYRILLIC CAPITAL LETTER TE'],
  [0x0455, 's', 'CYRILLIC SMALL LETTER DZE'],
  [0x0405, 'S', 'CYRILLIC CAPITAL LETTER DZE'],
  [0x04bb, 'h', 'CYRILLIC SMALL LETTER SHHA'],
  [0x0433, 'r', 'CYRILLIC SMALL LETTER GHE'],
  [0x0461, 'w', 'CYRILLIC SMALL LETTER OMEGA'],
];

/** Greek letters confusable with Latin. Source → Latin. */
const GREEK: Array<[number, string, string]> = [
  [0x03bf, 'o', 'GREEK SMALL LETTER OMICRON'],
  [0x039f, 'O', 'GREEK CAPITAL LETTER OMICRON'],
  [0x03b1, 'a', 'GREEK SMALL LETTER ALPHA'],
  [0x0391, 'A', 'GREEK CAPITAL LETTER ALPHA'],
  [0x0392, 'B', 'GREEK CAPITAL LETTER BETA'],
  [0x0395, 'E', 'GREEK CAPITAL LETTER EPSILON'],
  [0x0397, 'H', 'GREEK CAPITAL LETTER ETA'],
  [0x0399, 'I', 'GREEK CAPITAL LETTER IOTA'],
  [0x039a, 'K', 'GREEK CAPITAL LETTER KAPPA'],
  [0x039c, 'M', 'GREEK CAPITAL LETTER MU'],
  [0x039d, 'N', 'GREEK CAPITAL LETTER NU'],
  [0x039f, 'O', 'GREEK CAPITAL LETTER OMICRON'],
  [0x03a1, 'P', 'GREEK CAPITAL LETTER RHO'],
  [0x03a4, 'T', 'GREEK CAPITAL LETTER TAU'],
  [0x03a5, 'Y', 'GREEK CAPITAL LETTER UPSILON'],
  [0x03a7, 'X', 'GREEK CAPITAL LETTER CHI'],
  [0x0396, 'Z', 'GREEK CAPITAL LETTER ZETA'],
  [0x03b9, 'i', 'GREEK SMALL LETTER IOTA'],
  [0x03bd, 'v', 'GREEK SMALL LETTER NU'],
  [0x03c1, 'p', 'GREEK SMALL LETTER RHO'],
  [0x03c5, 'u', 'GREEK SMALL LETTER UPSILON'],
  [0x03c7, 'x', 'GREEK SMALL LETTER CHI'],
  [0x03c4, 't', 'GREEK SMALL LETTER TAU'],
  [0x03ba, 'k', 'GREEK SMALL LETTER KAPPA'],
];

/** A handful of "other-script" Latin look-alikes (Armenian, Cherokee, etc.). */
const OTHER: Array<[number, string, string]> = [
  [0x0501, 'd', 'CYRILLIC SMALL LETTER KOMI DE'], // Cyrillic-extended; tag as other-low impact
  [0x0578, 'n', 'ARMENIAN SMALL LETTER VO'],
  [0x0585, 'o', 'ARMENIAN SMALL LETTER OH'],
  [0x13a0, 'D', 'CHEROKEE LETTER A'],
  [0x13de, 'L', 'CHEROKEE LETTER TLE'],
  [0x13c0, 'G', 'CHEROKEE LETTER NAH'],
  [0x216c, 'L', 'ROMAN NUMERAL FIFTY'],
  [0x217c, 'l', 'SMALL ROMAN NUMERAL FIFTY'],
];

/**
 * Build the static portion of the table (Cyrillic + Greek + other). The
 * fullwidth and math-alphanumeric ranges are handled procedurally in `lookup`
 * because they are large, regular ranges that NFKC already folds correctly.
 */
function buildTable(): Map<number, Confusable> {
  const t = new Map<number, Confusable>();
  for (const [cp, target, name] of CYRILLIC) t.set(cp, c(cp, target, name, 'cyrillic'));
  for (const [cp, target, name] of GREEK) t.set(cp, c(cp, target, name, 'greek'));
  for (const [cp, target, name] of OTHER) t.set(cp, c(cp, target, name, 'other'));
  return t;
}

const TABLE: Map<number, Confusable> = buildTable();

/** Format a code point as the canonical U+XXXX string (min 4 hex digits). */
export function formatCp(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

/* ------------------------------------------------------------------------- *
 * Fullwidth & mathematical-alphanumeric handling.
 *
 * These are *compatibility* look-alikes: a single NFKC normalize folds them to
 * plain ASCII (Ａ→A, 𝐀→A, ０→0). We detect them by range and let NFKC produce
 * the target, so we don't have to enumerate hundreds of code points.
 * ------------------------------------------------------------------------- */

/** True for fullwidth ASCII forms U+FF01–U+FF5E (the visible printable block). */
function isFullwidth(cp: number): boolean {
  return cp >= 0xff01 && cp <= 0xff5e;
}

/** True for the mathematical-alphanumeric symbols block U+1D400–U+1D7FF. */
function isMathAlnum(cp: number): boolean {
  return cp >= 0x1d400 && cp <= 0x1d7ff;
}

/**
 * Resolve a single code point to confusable metadata, or null if it is not a
 * Latin look-alike. Handles the static table plus the fullwidth/math ranges.
 */
export function lookup(cp: number): Confusable | null {
  const direct = TABLE.get(cp);
  if (direct) return direct;

  const ch = String.fromCodePoint(cp);

  if (isFullwidth(cp)) {
    // NFKC turns Ａ→A, ！→!, etc. Only treat it as a confusable if the fold
    // actually produces a plain ASCII character (it always does in this range).
    const target = ch.normalize('NFKC');
    if (target && target !== ch) {
      return c(cp, target, 'FULLWIDTH FORM', 'fullwidth');
    }
  }

  if (isMathAlnum(cp)) {
    // Mathematical bold/italic/script/etc. letters & digits fold to ASCII.
    const target = ch.normalize('NFKC');
    if (target && /^[A-Za-z0-9]+$/.test(target)) {
      return c(cp, target, 'MATHEMATICAL ALPHANUMERIC SYMBOL', 'math');
    }
  }

  return null;
}

/* ------------------------------------------------------------------------- *
 * Script detection (native Unicode property escapes - no library).
 * ------------------------------------------------------------------------- */

export type DominantScript = 'latin' | 'cyrillic' | 'greek' | 'cjk' | 'other' | 'none';

// Per-script letter matchers. `Script_Extensions` is preferred where it changes
// the answer, but for these whole-script tests Script suffices and is supported
// more broadly. Wrapped in try/catch at module load so an old engine degrades.
const RE_LATIN = /\p{Script=Latin}/u;
const RE_CYRILLIC = /\p{Script=Cyrillic}/u;
const RE_GREEK = /\p{Script=Greek}/u;
const RE_CJK = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;
const RE_LETTER = /\p{L}/u;

/**
 * Determine the document's dominant *letter* script by counting letters per
 * script. Punctuation/digits/spaces (Common) are ignored. This is what lets us
 * leave legitimately non-Latin text alone - if the dominant script is Cyrillic,
 * we will not flag its Cyrillic letters as look-alikes.
 */
export function dominantScript(input: string): DominantScript {
  let latin = 0;
  let cyr = 0;
  let grk = 0;
  let cjk = 0;
  let other = 0;
  for (const ch of input) {
    if (!RE_LETTER.test(ch)) continue;
    if (RE_LATIN.test(ch)) latin++;
    else if (RE_CYRILLIC.test(ch)) cyr++;
    else if (RE_GREEK.test(ch)) grk++;
    else if (RE_CJK.test(ch)) cjk++;
    else other++;
  }
  const total = latin + cyr + grk + cjk + other;
  if (total === 0) return 'none';
  const max = Math.max(latin, cyr, grk, cjk, other);
  if (max === latin) return 'latin';
  if (max === cyr) return 'cyrillic';
  if (max === grk) return 'greek';
  if (max === cjk) return 'cjk';
  return 'other';
}

/** Pick the severity for a confusable given the dominant script context. */
function severityFor(info: Confusable): Severity {
  // Cyrillic/Greek in an otherwise-Latin doc = the classic, high-signal spoof.
  if (info.script === 'cyrillic' || info.script === 'greek') return 'high';
  // Fullwidth / math = cosmetic compatibility variants, low concern.
  if (info.script === 'fullwidth' || info.script === 'math') return 'low';
  return 'medium';
}

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

/** Human label per script class (legends, chips, toggles). */
export const SCRIPT_LABEL: Record<ScriptClass, string> = {
  cyrillic: 'Cyrillic',
  greek: 'Greek',
  fullwidth: 'Fullwidth',
  math: 'Math-alphanumeric',
  other: 'Other',
};

/** Compact icon per script class (paired with text - never colour-only). */
export const SCRIPT_ICON: Record<ScriptClass, string> = {
  cyrillic: 'Cyr',
  greek: 'Grk',
  fullwidth: 'Full',
  math: 'Math',
  other: '??',
};

/** Human label + icon per severity (paired text, never colour alone). */
export const SEVERITY_LABEL: Record<Severity, string> = {
  high: 'High: common spoof',
  medium: 'Medium',
  low: 'Low: cosmetic',
};

/* ------------------------------------------------------------------------- *
 * Detection pass.
 * ------------------------------------------------------------------------- */

/**
 * Should this confusable be flagged given the document's dominant script?
 * Gating rules:
 *  - If the dominant script *is* the confusable's source script, it is probably
 *    legitimate (a Cyrillic letter inside Russian prose) - don't flag it.
 *  - Fullwidth & math compatibility forms are always worth flagging regardless,
 *    since they're never the "real" content in normal prose.
 */
function shouldFlag(info: Confusable, dominant: DominantScript): boolean {
  if (info.script === 'fullwidth' || info.script === 'math') return true;
  if (dominant === 'cyrillic' && info.script === 'cyrillic') return false;
  if (dominant === 'greek' && info.script === 'greek') return false;
  // CJK / none / other dominant: still surface Latin look-alikes as informative.
  return true;
}

/** Options controlling detection & normalization. */
export interface DetectOptions {
  /** Restrict flagging to these script classes (default: all). */
  scripts?: Partial<Record<ScriptClass, boolean>>;
  /** Limit how many `hits` are returned (counts stay complete). */
  maxHits?: number;
}

export const DEFAULT_OPTIONS: DetectOptions = {
  scripts: { cyrillic: true, greek: true, fullwidth: true, math: true, other: true },
};

function scriptEnabled(script: ScriptClass, opts: DetectOptions): boolean {
  return opts.scripts?.[script] ?? true;
}

/**
 * Detect confusables in a single O(n) pass over code points (surrogate-safe).
 * Builds per-occurrence hits, per-code-point counts, the shared counts shape,
 * and the dominant-script verdict.
 */
export function detect(input: string, opts: DetectOptions = DEFAULT_OPTIONS): DetectResult {
  const dominant = dominantScript(input);
  const hits: Hit[] = [];
  const countMap = new Map<number, CountRow>();
  const counts: Counts = { cyrillic: 0, greek: 0, fullwidth: 0, math: 0, other: 0, runs: 0, total: 0 };
  let topSeverity: Severity | null = null;
  let scanned = 0;
  const maxHits = opts.maxHits ?? Infinity;

  let index = 0;
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    scanned++;
    const info = lookup(cp);
    if (info && scriptEnabled(info.script, opts) && shouldFlag(info, dominant)) {
      const severity = severityFor(info);
      counts.total++;
      counts[info.script]++;

      if (hits.length < maxHits) hits.push({ cp, index, info, severity });

      const row = countMap.get(cp);
      if (row) row.count++;
      else countMap.set(cp, { cp, info, count: 1, severity });

      if (!topSeverity || SEVERITY_RANK[severity] > SEVERITY_RANK[topSeverity]) {
        topSeverity = severity;
      }
    }
    index += ch.length;
  }

  counts.runs = countMixedRuns(input, dominant, opts);

  const rows = [...countMap.values()].sort((a, b) => b.count - a.count || a.cp - b.cp);
  return { hits, rows, counts, topSeverity, scanned, dominant };
}

/**
 * Count word-runs that mix the dominant letter-script with a flagged look-alike
 * script - the strongest spoof signal (`pаypаl` where one `а` is Cyrillic). We
 * tokenise on `\p{L}+` clusters and flag a run that contains at least one
 * dominant-script letter AND at least one flagged confusable.
 */
export function countMixedRuns(input: string, dominant: DominantScript, opts: DetectOptions = DEFAULT_OPTIONS): number {
  if (dominant !== 'latin') return 0; // mixed-run logic is meaningful against a Latin baseline
  let runs = 0;
  // Split into letter-runs; `\p{L}+` keeps words together across confusables.
  const words = input.match(/[\p{L}\p{M}]+/gu) || [];
  for (const word of words) {
    let hasLatin = false;
    let hasConfusable = false;
    for (const ch of word) {
      const cp = ch.codePointAt(0)!;
      const info = lookup(cp);
      if (info && scriptEnabled(info.script, opts)) hasConfusable = true;
      else if (RE_LATIN.test(ch)) hasLatin = true;
    }
    if (hasLatin && hasConfusable) runs++;
  }
  return runs;
}

/* ------------------------------------------------------------------------- *
 * UTS #39 skeleton + normalization.
 * ------------------------------------------------------------------------- */

/**
 * Compute the UTS #39 `skeleton` of the text - the canonical "what a machine
 * sees" form. Simplified to: NFD → map each confusable to its prototype → NFD.
 * (The Default_Ignorable strip step is handled by the sibling invisibles engine;
 * here we focus on the visible look-alike prototypes.) Idempotent:
 * `skeleton(skeleton(x)) === skeleton(x)`, which is a free self-check.
 */
export function skeleton(input: string): string {
  let out = '';
  for (const ch of input.normalize('NFD')) {
    const cp = ch.codePointAt(0)!;
    const info = lookup(cp);
    out += info ? info.target : ch;
  }
  return out.normalize('NFD');
}

/**
 * Normalize text: replace every *flagged* confusable with its Latin/ASCII
 * prototype, honoring the enabled-script filter and dominant-script gating, plus
 * an optional per-character "keep" set (code points the user chose to preserve).
 * Returns the cleaned text and how many characters were replaced.
 */
export interface NormalizeResult {
  text: string;
  replaced: number;
}

export function normalize(
  input: string,
  opts: DetectOptions = DEFAULT_OPTIONS,
  keep: Set<number> = new Set(),
): NormalizeResult {
  const dominant = dominantScript(input);
  let out = '';
  let replaced = 0;
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    const info = lookup(cp);
    if (info && !keep.has(cp) && scriptEnabled(info.script, opts) && shouldFlag(info, dominant)) {
      out += info.target;
      replaced++;
    } else {
      out += ch;
    }
  }
  return { text: out, replaced };
}

/* ------------------------------------------------------------------------- *
 * Rendering tokens (surrogate-safe, XSS-safe by construction).
 * ------------------------------------------------------------------------- */

/**
 * A token in the inline highlighted render. `text` = a run of ordinary visible
 * characters; `char` = a single flagged look-alike with metadata. The UI builds
 * DOM from these (never innerHTML with user text), so it is XSS-safe.
 */
export type Token =
  | { kind: 'text'; value: string }
  | { kind: 'char'; cp: number; index: number; info: Confusable; severity: Severity };

/** Tokenise text into visible runs + flagged confusables, in document order. */
export function tokenize(input: string, opts: DetectOptions = DEFAULT_OPTIONS): Token[] {
  const dominant = dominantScript(input);
  const tokens: Token[] = [];
  let buf = '';
  let index = 0;

  const flush = () => {
    if (buf) {
      tokens.push({ kind: 'text', value: buf });
      buf = '';
    }
  };

  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    const info = lookup(cp);
    if (info && scriptEnabled(info.script, opts) && shouldFlag(info, dominant)) {
      flush();
      tokens.push({ kind: 'char', cp, index, info, severity: severityFor(info) });
    } else {
      buf += ch;
    }
    index += ch.length;
  }
  flush();
  return tokens;
}

/* ------------------------------------------------------------------------- *
 * Verdict & report helpers.
 * ------------------------------------------------------------------------- */

/** Top-line plain-English verdict for the result. */
export function verdict(result: DetectResult): string {
  if (result.counts.total === 0) {
    return result.scanned === 0
      ? 'Paste text to scan for look-alike characters.'
      : 'No look-alike characters - your text is genuine Latin.';
  }
  const parts: string[] = [];
  if (result.counts.cyrillic) parts.push(`${result.counts.cyrillic} Cyrillic`);
  if (result.counts.greek) parts.push(`${result.counts.greek} Greek`);
  if (result.counts.fullwidth) parts.push(`${result.counts.fullwidth} fullwidth`);
  if (result.counts.math) parts.push(`${result.counts.math} math`);
  if (result.counts.other) parts.push(`${result.counts.other} other`);
  const list = parts.join(', ');
  const runNote = result.counts.runs
    ? ` across ${result.counts.runs} mixed-script word${result.counts.runs === 1 ? '' : 's'}`
    : '';
  return `Found ${list} look-alike${result.counts.total === 1 ? '' : 's'}${runNote} - mixed-script text detected.`;
}

/**
 * A "confusability" percentage: how much of the *letter* content is genuine
 * Latin (100 = entirely clean Latin). A small, honest gauge for the UI.
 */
export function confusabilityScore(input: string, result: DetectResult): number {
  let letters = 0;
  for (const ch of input) if (RE_LETTER.test(ch)) letters++;
  if (letters === 0) return 100;
  const clean = Math.max(0, letters - result.counts.total);
  return Math.round((clean / letters) * 100);
}

/** Build a shareable plaintext report. */
export function buildReport(result: DetectResult): string {
  if (result.counts.total === 0) {
    return 'No homoglyph / confusable characters detected - this text is genuine Latin.';
  }
  const rows = result.rows.map((row) => `${row.count}× ${formatCp(row.cp)} ${row.info.name} → "${row.info.target}"`);
  return `${verdict(result)}\n${rows.join('\n')}`;
}

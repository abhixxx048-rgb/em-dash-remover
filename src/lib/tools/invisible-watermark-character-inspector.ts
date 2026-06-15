/**
 * Invisible / Watermark Character Inspector - pure detection engine.
 *
 * Design goals (see docs/tools/invisible-watermark-character-inspector.md):
 *  - A "see it before you strip it" diagnostic. Given arbitrary text, classify
 *    every non-printing / zero-width / look-alike-whitespace / bidi / smuggling
 *    code point so a UI can render each one inline with a label and a count.
 *  - Data-driven, not one opaque regex: each interesting code point maps to a
 *    record { cp, name, category, severity, note } so tooltips stay honest and
 *    plain-English. The table is a small hand-curated map (no UCD dependency).
 *  - 100% in-browser, deterministic, no DOM and no network. Surrogate-safe: we
 *    always iterate by code point so astral chars (tags, variation selectors)
 *    count as one character, never two surrogate halves.
 *
 * Brand stance: invisible characters are *most likely* artifacts (web copy,
 * PDF exports, GPT spacing tells) and trivially removable - not a secret,
 * unbreakable watermark. We explain rather than alarm.
 */

/** Broad buckets used for grouping, coloring, and toggles in the UI. */
export type Category =
  | 'zero-width' // ZWSP / ZWNJ / ZWJ / word joiner / BOM / soft hyphen / invisible math
  | 'space' // look-alike whitespace: NBSP, NNBSP (U+202F), en/em/thin/hair, ideographic
  | 'bidi' // bidirectional controls - Trojan Source / RTL override risk
  | 'variation' // variation selectors - emoji presentation OR a smuggling vector
  | 'tag' // Unicode Tag chars (U+E0000–E007F) - ASCII smuggling / prompt injection
  | 'control' // C0/C1 control chars and other oddities (e.g. U+FFFD)
  | 'pua'; // Private Use Area - suspicious, app-specific glyphs

/**
 * Triage severity. Intentionally NOT color-only in the UI - every chip also
 * carries an icon + visible U+XXXX label + text category.
 *  - 'risk'   red:   security relevant (bidi overrides, tag chars).
 *  - 'tell'   amber: likely an AI/web spacing tell or layout-breaker (U+202F, NBSP).
 *  - 'benign' grey:  usually a harmless artifact (ZWSP, BOM, soft hyphen).
 */
export type Severity = 'risk' | 'tell' | 'benign';

/** Static metadata for a single interesting code point. */
export interface CharInfo {
  /** Numeric code point (e.g. 0x202f). */
  cp: number;
  /** Official-ish Unicode name (e.g. "NARROW NO-BREAK SPACE"). */
  name: string;
  category: Category;
  severity: Severity;
  /** One-line, plain-English "what & why" shown on hover/focus. */
  note: string;
}

/** A single detected occurrence within the scanned text. */
export interface Hit {
  /** Code point value. */
  cp: number;
  /** UTF-16 offset where this character starts (useful for click-to-jump). */
  index: number;
  /** Resolved metadata for the code point. */
  info: CharInfo;
}

/** Aggregated count for one distinct code point. */
export interface CountRow {
  cp: number;
  info: CharInfo;
  count: number;
}

/** Full result of an inspection pass. */
export interface InspectResult {
  /** Every detected occurrence, in document order. */
  hits: Hit[];
  /** Per-code-point totals, sorted by count desc then code point asc. */
  rows: CountRow[];
  /** Total number of invisible/flagged characters found. */
  total: number;
  /** Total grouped by category (only non-zero categories appear). */
  byCategory: Partial<Record<Category, number>>;
  /** Highest severity present, or null when the text is clean. */
  topSeverity: Severity | null;
  /** Total visible-ish length scanned (in code points). */
  scanned: number;
}

/* ------------------------------------------------------------------------- *
 * Curated code-point table.
 *
 * Built from explicit ranges so categories + notes stay data-driven. Helper
 * `r()` expands an inclusive range so we only write the prose once per family.
 * ------------------------------------------------------------------------- */

function rec(cp: number, name: string, category: Category, severity: Severity, note: string): CharInfo {
  return { cp, name, category, severity, note };
}

/** Expand an inclusive code-point range into per-cp records. */
function r(
  from: number,
  to: number,
  nameFor: (cp: number) => string,
  category: Category,
  severity: Severity,
  note: string,
): CharInfo[] {
  const out: CharInfo[] = [];
  for (let cp = from; cp <= to; cp++) out.push(rec(cp, nameFor(cp), category, severity, note));
  return out;
}

/** Format a code point as the canonical U+XXXX string (min 4 hex digits). */
export function formatCp(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

const TABLE_LIST: CharInfo[] = [
  // --- Zero-width / format -------------------------------------------------
  rec(0x200b, 'ZERO WIDTH SPACE', 'zero-width', 'benign', 'Invisible separator often left by web copy/paste. Safe to remove; it adds no spacing.'),
  rec(0x200c, 'ZERO WIDTH NON-JOINER', 'zero-width', 'benign', 'Controls letter joining in some scripts (e.g. Persian). Usually safe to remove in English text.'),
  rec(0x200d, 'ZERO WIDTH JOINER', 'zero-width', 'tell', 'Legitimately joins emoji (👨‍👩‍👧). Removing it can break combined emoji - review before stripping.'),
  rec(0x2060, 'WORD JOINER', 'zero-width', 'benign', 'A no-break, zero-width joiner. Harmless artifact in most prose; safe to remove.'),
  rec(0xfeff, 'ZERO WIDTH NO-BREAK SPACE (BOM)', 'zero-width', 'benign', 'Byte-order mark. Common at the start of files/exports; usually safe to strip.'),
  rec(0x00ad, 'SOFT HYPHEN', 'zero-width', 'benign', 'Invisible "you may hyphenate here" hint, often from PDFs. Usually safe to remove.'),
  rec(0x180e, 'MONGOLIAN VOWEL SEPARATOR', 'zero-width', 'benign', 'Zero-width format character; an artifact in non-Mongolian text.'),
  ...r(0x2061, 0x2064, () => 'INVISIBLE MATH OPERATOR', 'zero-width', 'benign', 'Invisible math operator (times/function application/separator). Artifact outside math; safe to remove.'),

  // --- Look-alike whitespace ----------------------------------------------
  rec(0x00a0, 'NO-BREAK SPACE (NBSP)', 'space', 'tell', 'Looks like a normal space but never breaks. Common from PDFs/Word; can break word counts and layout.'),
  rec(0x202f, 'NARROW NO-BREAK SPACE (NNBSP)', 'space', 'tell', 'The "GPT-5 tell": models often emit this instead of a normal space. Harmless but a giveaway; convert to a normal space.'),
  rec(0x2000, 'EN QUAD', 'space', 'tell', 'Fixed-width typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2001, 'EM QUAD', 'space', 'tell', 'Fixed-width typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2002, 'EN SPACE', 'space', 'tell', 'Half-em typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2003, 'EM SPACE', 'space', 'tell', 'Full-em typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2004, 'THREE-PER-EM SPACE', 'space', 'tell', 'Thin typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2005, 'FOUR-PER-EM SPACE', 'space', 'tell', 'Thin typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2006, 'SIX-PER-EM SPACE', 'space', 'tell', 'Very thin typographic space. Renders like a space; usually convert to a normal space.'),
  rec(0x2007, 'FIGURE SPACE', 'space', 'tell', 'Digit-width space used to align numbers. Convert to a normal space unless aligning figures.'),
  rec(0x2008, 'PUNCTUATION SPACE', 'space', 'tell', 'Punctuation-width space. Renders like a space; usually convert to a normal space.'),
  rec(0x2009, 'THIN SPACE', 'space', 'tell', 'Thin space, sometimes intentional French typography. Convert to a normal space if unwanted.'),
  rec(0x200a, 'HAIR SPACE', 'space', 'tell', 'The thinnest space. Renders like a space; usually convert to a normal space.'),
  rec(0x205f, 'MEDIUM MATHEMATICAL SPACE', 'space', 'tell', 'Math-layout space. Artifact in prose; convert to a normal space.'),
  rec(0x3000, 'IDEOGRAPHIC SPACE', 'space', 'tell', 'Full-width CJK space. Common from East-Asian input; convert to a normal space in English text.'),
  rec(0x2028, 'LINE SEPARATOR', 'space', 'tell', 'Invisible line break that is not a normal newline. Can confuse editors; usually convert to a newline.'),
  rec(0x2029, 'PARAGRAPH SEPARATOR', 'space', 'tell', 'Invisible paragraph break that is not a normal newline. Usually convert to a newline.'),

  // --- Bidirectional controls (security) ----------------------------------
  rec(0x200e, 'LEFT-TO-RIGHT MARK', 'bidi', 'risk', 'Invisible direction control. Mostly benign in mixed text, but can hide bidi reordering - review.'),
  rec(0x200f, 'RIGHT-TO-LEFT MARK', 'bidi', 'risk', 'Invisible direction control. Mostly benign, but can mask bidi reordering - review.'),
  rec(0x202a, 'LEFT-TO-RIGHT EMBEDDING', 'bidi', 'risk', 'Bidi embedding control. Can reorder text deceptively (Trojan Source, CVE-2021-42574).'),
  rec(0x202b, 'RIGHT-TO-LEFT EMBEDDING', 'bidi', 'risk', 'Bidi embedding control. Can reorder text deceptively (Trojan Source, CVE-2021-42574).'),
  rec(0x202c, 'POP DIRECTIONAL FORMATTING', 'bidi', 'risk', 'Ends a bidi override/embedding. Part of Trojan-Source-style reordering tricks.'),
  rec(0x202d, 'LEFT-TO-RIGHT OVERRIDE', 'bidi', 'risk', 'Forces text direction; can disguise filenames/code (Trojan Source). Treat as a security risk.'),
  rec(0x202e, 'RIGHT-TO-LEFT OVERRIDE', 'bidi', 'risk', 'Forces right-to-left rendering; classic spoofing/Trojan-Source vector. Treat as a security risk.'),
  rec(0x2066, 'LEFT-TO-RIGHT ISOLATE', 'bidi', 'risk', 'Bidi isolate control used in reordering attacks. Review before trusting the text.'),
  rec(0x2067, 'RIGHT-TO-LEFT ISOLATE', 'bidi', 'risk', 'Bidi isolate control used in reordering attacks. Review before trusting the text.'),
  rec(0x2068, 'FIRST STRONG ISOLATE', 'bidi', 'risk', 'Bidi isolate control. Can participate in deceptive reordering - review.'),
  rec(0x2069, 'POP DIRECTIONAL ISOLATE', 'bidi', 'risk', 'Ends a bidi isolate. Part of bidi reordering tricks - review.'),

  // --- Variation selectors (ambiguous: emoji vs smuggling) ----------------
  rec(0xfe0e, 'VARIATION SELECTOR-15 (text style)', 'variation', 'benign', 'Requests text-style rendering of the preceding glyph. Usually legitimate emoji styling.'),
  rec(0xfe0f, 'VARIATION SELECTOR-16 (emoji style)', 'variation', 'benign', 'Requests emoji-style rendering (e.g. ❤️). Usually legitimate; removing may change how emoji look.'),
  ...r(0xfe00, 0xfe0d, (cp) => `VARIATION SELECTOR-${cp - 0xfe00 + 1}`, 'variation', 'tell', 'Variation selector. Can be legitimate glyph styling - but a known invisible-smuggling vector. Review.'),
  ...r(0xe0100, 0xe01ef, (cp) => `VARIATION SELECTOR-${cp - 0xe0100 + 17}`, 'variation', 'tell', 'Supplementary variation selector. Invisible; a known data/instruction smuggling vector. Review.'),

  // --- Unicode Tag characters (ASCII smuggling / prompt injection) ---------
  rec(0xe0001, 'LANGUAGE TAG', 'tag', 'risk', 'Deprecated tag char. Invisible; abused to smuggle hidden ASCII into LLM prompts. Treat as a risk.'),
  ...r(0xe0020, 0xe007e, (cp) => `TAG ${String.fromCodePoint(cp - 0xe0000)} (smuggled "${String.fromCodePoint(cp - 0xe0000)}")`, 'tag', 'risk', 'Invisible Tag character that mirrors a printable ASCII byte. Used for hidden ASCII / prompt-injection smuggling.'),
  rec(0xe007f, 'CANCEL TAG', 'tag', 'risk', 'Terminates a Tag sequence. Part of the invisible ASCII-smuggling vector - treat as a risk.'),

  // --- Other controls / replacement ---------------------------------------
  rec(0xfffd, 'REPLACEMENT CHARACTER', 'control', 'benign', 'Marks a decoding error (broken bytes/encoding). Not invisible, but a sign something went wrong.'),
];

/** Fast lookup map: code point -> metadata. */
const TABLE: Map<number, CharInfo> = new Map(TABLE_LIST.map((c) => [c.cp, c]));

/**
 * Resolve a code point to its metadata, or null if it is not one of the
 * "interesting" invisible/flagged characters. Tab (U+0009) and other C0 control
 * characters are matched on demand below rather than bloating the table.
 */
export function lookup(cp: number, opts?: InspectOptions): CharInfo | null {
  const direct = TABLE.get(cp);
  if (direct) {
    // The two whitespace controls (tab/CR) are opt-in to avoid noise.
    if ((cp === 0x09 || cp === 0x0d) && !opts?.showTabs) return null;
    return direct;
  }

  // Optional: show tabs and carriage returns when explicitly requested.
  if (opts?.showTabs) {
    if (cp === 0x09) return rec(0x09, 'CHARACTER TABULATION (TAB)', 'space', 'benign', 'A tab character. Often intentional, but can look like spaces. Shown because "tabs" is enabled.');
    if (cp === 0x0d) return rec(0x0d, 'CARRIAGE RETURN', 'control', 'benign', 'Windows-style line-ending half. Usually safe to normalize to a plain newline.');
  }

  // Private Use Area - app-specific glyphs that often arrive as junk.
  if (opts?.includePua && ((cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xf0000 && cp <= 0xffffd) || (cp >= 0x100000 && cp <= 0x10fffd))) {
    return rec(cp, 'PRIVATE USE AREA CHARACTER', 'pua', 'benign', 'A Private Use Area code point with no standard meaning. Frequently a copy/paste artifact; review before trusting.');
  }

  // Other C0 control characters (excluding the normal whitespace we keep:
  // tab U+0009 and carriage return U+000D are only flagged via the explicit
  // showTabs path above; line feed U+000A is a real newline we leave alone).
  if (opts?.showControls && cp !== 0x0a && cp !== 0x09 && cp !== 0x0d && cp < 0x20) {
    return rec(cp, 'CONTROL CHARACTER', 'control', 'risk', 'A non-printing C0 control character. Unusual in prose and can confuse parsers - review.');
  }

  return null;
}

/** Options controlling which extra classes get flagged. */
export interface InspectOptions {
  /** Also flag tab (U+0009) and carriage return (U+000D). Default false. */
  showTabs?: boolean;
  /** Also flag other C0 control characters. Default false. */
  showControls?: boolean;
  /** Also flag Private Use Area code points. Default false. */
  includePua?: boolean;
  /** Limit how many `hits` are returned (counts are always complete). */
  maxHits?: number;
}

export const DEFAULT_OPTIONS: InspectOptions = {
  showTabs: false,
  showControls: false,
  includePua: false,
};

const SEVERITY_RANK: Record<Severity, number> = { risk: 3, tell: 2, benign: 1 };

/**
 * Inspect a string. Single O(n) pass over code points (surrogate-safe via the
 * string iterator), collecting per-occurrence hits and per-code-point counts.
 */
export function inspect(input: string, opts: InspectOptions = DEFAULT_OPTIONS): InspectResult {
  const hits: Hit[] = [];
  const countMap = new Map<number, CountRow>();
  const byCategory: Partial<Record<Category, number>> = {};
  let topSeverity: Severity | null = null;
  let scanned = 0;
  let total = 0;

  const maxHits = opts.maxHits ?? Infinity;

  // We need UTF-16 offsets (for click-to-jump in the editor) AND code-point
  // safety. Iterating the string yields whole code points; we advance the
  // index by the UTF-16 length of each so offsets stay correct for astral chars.
  let index = 0;
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    scanned++;
    const info = lookup(cp, opts);
    if (info) {
      total++;

      // Per-occurrence hit (optionally capped for very large documents).
      if (hits.length < maxHits) hits.push({ cp, index, info });

      // Per-code-point tally.
      const row = countMap.get(cp);
      if (row) row.count++;
      else countMap.set(cp, { cp, info, count: 1 });

      // Category + severity rollups.
      byCategory[info.category] = (byCategory[info.category] ?? 0) + 1;
      if (!topSeverity || SEVERITY_RANK[info.severity] > SEVERITY_RANK[topSeverity]) {
        topSeverity = info.severity;
      }
    }
    index += ch.length; // UTF-16 units (1 for BMP, 2 for astral)
  }

  const rows = [...countMap.values()].sort((a, b) => b.count - a.count || a.cp - b.cp);

  return { hits, rows, total, byCategory, topSeverity, scanned };
}

/**
 * Token in a rendered, surrogate-safe breakdown of the text. A `text` token is
 * a run of normal visible characters; a `char` token is a single flagged code
 * point with its metadata. The UI builds DOM from this - NEVER innerHTML with
 * user text - so it is XSS-safe by construction.
 */
export type Token =
  | { kind: 'text'; value: string }
  | { kind: 'char'; cp: number; index: number; info: CharInfo };

/**
 * Tokenize text into visible runs + flagged characters, in order. Lets the UI
 * render the exact same text with each invisible char turned into a labeled
 * chip in place, preserving surrounding context.
 */
export function tokenize(input: string, opts: InspectOptions = DEFAULT_OPTIONS): Token[] {
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
    const info = lookup(cp, opts);
    if (info) {
      flush();
      tokens.push({ kind: 'char', cp, index, info });
    } else {
      buf += ch;
    }
    index += ch.length;
  }
  flush();
  return tokens;
}

/* ------------------------------------------------------------------------- *
 * Cleaning. Mirrors the spec's category-level toggles. Pure string -> string.
 * Spaces/separators are *converted* to sensible equivalents; everything else
 * is *removed*. U+200D inside emoji is preserved unless the user opts to strip
 * zero-width chars explicitly.
 * ------------------------------------------------------------------------- */

export interface CleanOptions extends InspectOptions {
  /** Remove zero-width / format characters (ZWSP, BOM, soft hyphen, …). */
  zeroWidth?: boolean;
  /** Convert look-alike whitespace (NBSP, U+202F, …) to normal spaces/newlines. */
  spaces?: boolean;
  /** Remove bidirectional control characters. */
  bidi?: boolean;
  /** Remove variation selectors. */
  variation?: boolean;
  /** Remove Unicode Tag characters. */
  tags?: boolean;
  /** Remove other control / replacement characters. */
  controls?: boolean;
  /** Remove Private Use Area characters. */
  pua?: boolean;
}

export const DEFAULT_CLEAN: CleanOptions = {
  zeroWidth: true,
  spaces: true,
  bidi: true,
  variation: false, // ambiguous (emoji styling) - off by default to avoid breakage
  tags: true,
  controls: true,
  pua: false,
};

/** Map a category to its corresponding clean toggle. */
function categoryEnabled(category: Category, opts: CleanOptions): boolean {
  switch (category) {
    case 'zero-width':
      return opts.zeroWidth ?? true;
    case 'space':
      return opts.spaces ?? true;
    case 'bidi':
      return opts.bidi ?? true;
    case 'variation':
      return opts.variation ?? false;
    case 'tag':
      return opts.tags ?? true;
    case 'control':
      return opts.controls ?? true;
    case 'pua':
      return opts.pua ?? false;
  }
}

/** Result of a clean pass: the new text plus how many chars were removed/converted. */
export interface CleanResult {
  text: string;
  removed: number;
}

/**
 * Produce cleaned text by walking code points and applying the category
 * toggles. Look-alike whitespace becomes a normal space (line/paragraph
 * separators become "\n"); everything else in an enabled category is dropped.
 * Characters not flagged, or in a disabled category, pass through untouched.
 */
export function cleanText(input: string, opts: CleanOptions = DEFAULT_CLEAN): CleanResult {
  // We must surface PUA/tabs/controls to the cleaner regardless of the
  // *display* toggles, so detection here uses the cleaning intent.
  const detectOpts: InspectOptions = {
    showTabs: false,
    showControls: opts.controls ?? true,
    includePua: opts.pua ?? false,
  };

  let out = '';
  let removed = 0;

  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    const info = lookup(cp, detectOpts);
    if (info && categoryEnabled(info.category, opts)) {
      removed++;
      if (info.category === 'space') {
        // Convert separators to a newline, all other look-alikes to a space.
        out += cp === 0x2028 || cp === 0x2029 ? '\n' : ' ';
      }
      // zero-width / bidi / variation / tag / control / pua → dropped entirely.
      continue;
    }
    out += ch;
  }

  // Collapse any double spaces we may have introduced from adjacent NBSPs.
  out = out.replace(/[ \t]{2,}/g, ' ');

  return { text: out, removed };
}

/**
 * Build a shareable plaintext report, e.g.:
 *   "Found 12 hidden characters: 8× U+202F NARROW NO-BREAK SPACE, 3× U+200B …"
 * Returns a clean-bill string when nothing was found.
 */
export function buildReport(result: InspectResult): string {
  if (result.total === 0) {
    return 'No hidden or invisible characters detected - this text looks clean.';
  }
  const parts = result.rows.map((row) => `${row.count}× ${formatCp(row.cp)} ${row.info.name}`);
  const noun = result.total === 1 ? 'character' : 'characters';
  let header = `Found ${result.total} hidden ${noun}: ${parts.join(', ')}.`;
  if (result.topSeverity === 'risk') {
    header += ' ⚠ Includes characters that can be a security risk (bidi/tag).';
  }
  return header;
}

/** Human label for a category (for legends, chips, toggles). */
export const CATEGORY_LABEL: Record<Category, string> = {
  'zero-width': 'Zero-width',
  space: 'Spaces',
  bidi: 'Bidi',
  variation: 'Variation',
  tag: 'Tag chars',
  control: 'Control',
  pua: 'Private use',
};

/** Compact icon/glyph per category (paired with text - never color-only). */
export const CATEGORY_ICON: Record<Category, string> = {
  'zero-width': '◦',
  space: '␣',
  bidi: '⇄',
  variation: '◌',
  tag: '⚑',
  control: '⌃',
  pua: '?',
};

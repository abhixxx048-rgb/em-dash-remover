/**
 * Whitespace & Line-Break Reflow Fixer - pure client-side engine.
 *
 * Design goals (see docs/tools/whitespace-line-break-reflow-fixer.md):
 *  - Clean up text mangled by copying out of a PDF, email, terminal or code
 *    comment: collapse runaway spaces/tabs, trim trailing whitespace, normalize
 *    Unicode space variants, control blank lines, and unify newlines.
 *  - The headline feature is *smart reflow / unwrap*: tell a SOFT line break
 *    (one a PDF/editor inserted just to fit the margin) from a HARD one (a real
 *    paragraph or list boundary) using a weighted heuristic scorer, and remove
 *    only the soft ones - including rejoining hyphen-split words
 *    (`infor-\nmation` → `information`).
 *  - 100% in-browser. Nothing here touches the DOM or the network. Deterministic.
 *
 * Mirrors the pure-function pattern of src/lib/cleaner.ts.
 *
 * NOTE: every Unicode-whitespace table below is built with `new RegExp` from
 * `\u` escape strings rather than by pasting the raw characters into a regex
 * literal. Raw NBSP / line-separator / zero-width bytes in source either break
 * the literal (U+2028/U+2029 are JS line terminators) or are invisible and
 * un-auditable, so we keep the source ASCII-only.
 */

/** How to treat blank lines after reflow. */
export type BlankLineMode = 'keep' | 'collapse' | 'remove';

/** Newline convention for the output. */
export type NewlineStyle = 'lf' | 'crlf' | 'cr';

export interface ReflowOptions {
  /** Normalize Unicode space variants (NBSP, thin space, etc.) to a plain space
   *  and strip zero-width / BOM characters. */
  normalizeUnicode: boolean;
  /** Collapse runs of spaces/tabs inside a line to a single space. */
  collapseSpaces: boolean;
  /** Convert tabs to spaces (tabWidth) instead of collapsing them. */
  tabsToSpaces: boolean;
  /** Number of spaces a tab expands to when tabsToSpaces is on. */
  tabWidth: number;
  /** Trim trailing whitespace at the end of every line (almost always wanted). */
  trimTrailing: boolean;
  /** Trim leading whitespace at the start of every line. Turn OFF to keep code
   *  / list indentation intact. */
  trimLeading: boolean;
  /** Strip leading email quote markers (`>`, `>>`, `| `) before reflowing. */
  stripQuoteMarkers: boolean;
  /** Smart reflow: remove soft line breaks, keep hard paragraph breaks. */
  reflow: boolean;
  /** Rejoin words hyphen-split across a line break (`infor-\nmation`). */
  rejoinHyphens: boolean;
  /** Escape hatch: remove ALL line breaks (paragraphs → one line each, or the
   *  whole text → a single line). Overrides `reflow`. */
  removeAllBreaks: boolean;
  /** How to handle blank lines. */
  blankLines: BlankLineMode;
  /** Output newline convention. */
  newline: NewlineStyle;
}

export const DEFAULT_OPTIONS: ReflowOptions = {
  normalizeUnicode: true,
  collapseSpaces: true,
  tabsToSpaces: false,
  tabWidth: 4,
  trimTrailing: true,
  trimLeading: false,
  stripQuoteMarkers: false,
  reflow: true,
  rejoinHyphens: true,
  removeAllBreaks: false,
  blankLines: 'collapse',
  newline: 'lf',
};

/** A named bundle of options the UI exposes as a one-click "recipe". */
export type RecipeId = 'pdf' | 'email' | 'codeSafe' | 'collapse' | 'removeBreaks';

/** Recipe presets - each sets the whole option set at once (§5.5 of the spec). */
export const RECIPES: Record<RecipeId, { label: string; options: ReflowOptions }> = {
  pdf: {
    label: 'PDF paste cleanup',
    options: {
      ...DEFAULT_OPTIONS,
      reflow: true,
      rejoinHyphens: true,
      blankLines: 'collapse',
      normalizeUnicode: true,
    },
  },
  email: {
    label: 'Email cleanup',
    options: {
      ...DEFAULT_OPTIONS,
      stripQuoteMarkers: true,
      reflow: true,
      rejoinHyphens: false,
      blankLines: 'collapse',
    },
  },
  codeSafe: {
    label: 'Code-safe',
    options: {
      ...DEFAULT_OPTIONS,
      collapseSpaces: false,
      trimTrailing: true,
      trimLeading: false,
      reflow: false,
      rejoinHyphens: false,
      blankLines: 'keep',
    },
  },
  collapse: {
    label: 'Just collapse spaces',
    options: {
      ...DEFAULT_OPTIONS,
      reflow: false,
      rejoinHyphens: false,
      blankLines: 'keep',
    },
  },
  removeBreaks: {
    label: 'Remove all line breaks',
    options: {
      ...DEFAULT_OPTIONS,
      removeAllBreaks: true,
      blankLines: 'remove',
    },
  },
};

export interface ReflowResult {
  text: string;
  counts: {
    /** Soft line breaks removed (lines joined into paragraphs). */
    softBreaksRemoved: number;
    /** Hyphen-split words rejoined. */
    hyphensRejoined: number;
    /** Runs of multiple spaces/tabs collapsed to one. */
    spacesCollapsed: number;
    /** Lines that had trailing whitespace trimmed. */
    trailingTrimmed: number;
    /** Blank lines dropped by the blank-line policy. */
    blankLinesDropped: number;
    /** Unicode space / zero-width chars normalized or stripped. */
    unicodeNormalized: number;
    /** Email quote markers stripped. */
    quoteMarkersStripped: number;
    total: number;
  };
}

// --- Unicode whitespace tables ------------------------------------------------
// `\s` in JS does NOT reliably match the NBSP-class characters across engines,
// so we use explicit ranges (per the spec §7.2) rather than relying on `\s`.

/** Space-like characters that should become an ordinary space: NBSP (00A0),
 *  Ogham space (1680), the en/em/thin/hair space block (2000-200A), narrow NBSP
 *  (202F), medium math space (205F) and ideographic space (3000). */
const UNICODE_SPACES = () =>
  new RegExp('[\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]', 'g');
/** Line (2028) / paragraph (2029) separators that should become a newline. */
const UNICODE_SEPARATORS = () => new RegExp('[\\u2028\\u2029]', 'g');
/** Zero-width chars and BOM to strip: ZWSP (200B), ZWNJ (200C), ZWJ (200D),
 *  word joiner (2060), BOM / ZWNBSP (FEFF) and soft hyphen (00AD). */
const ZERO_WIDTH = () => new RegExp('[\\u200B-\\u200D\\u2060\\uFEFF\\u00AD]', 'g');

// --- Structure detection ------------------------------------------------------
// Lines matching these are structural boundaries: we never join ACROSS them,
// because that is the #1 way naive tools wreck a document.

/** A list item: bullet, numbered (1. / 1)) or lettered (a. / a)). */
const LIST_ITEM = new RegExp('^\\s*([-*\\u2022\\u2023\\u25E6]|\\d+[.)]|[a-zA-Z][.)])\\s');
/** A Markdown ATX heading. */
const MD_HEADING = /^\s{0,3}#{1,6}\s/;
/** A blockquote / quoted-email line. */
const BLOCKQUOTE = /^\s*>/;
/** A Markdown table row or ASCII-table line. */
const TABLE_ROW = /\|/;
/** A horizontal rule (---, ***, ___). */
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
/** An indented (code-block-like) line: leading tab or 4+ spaces. */
const INDENTED = /^(\t|\s{4,})/;

/** Leading email quote markers: any run of `>`/`|` with optional spaces. */
const QUOTE_PREFIX = /^(\s*[>|]+\s?)+/;

/** Count the leading `>` quote depth of a line (after optional spaces). */
function quoteDepth(line: string): number {
  const m = line.match(/^\s*((?:>\s*)+)/);
  if (!m) return 0;
  return (m[1].match(/>/g) || []).length;
}

/** True if the line is a structural boundary we must never join across. */
function isStructural(line: string): boolean {
  return (
    LIST_ITEM.test(line) ||
    MD_HEADING.test(line) ||
    BLOCKQUOTE.test(line) ||
    HR.test(line) ||
    TABLE_ROW.test(line) ||
    INDENTED.test(line)
  );
}

// --- The reflow scorer --------------------------------------------------------
// For a boundary between line `cur` and the following line `next`, sum signal
// weights. A positive total leans toward JOIN (soft break, remove it); a
// negative total leans toward KEEP (hard break, a real paragraph boundary).

/** Terminal punctuation that usually ends a real sentence / paragraph. */
const TERMINAL_PUNCT = /[.!?:;]["'”’)\]]?\s*$/u;

/**
 * Decide whether the break between `cur` and `next` is SOFT (joinable).
 * `dominantWidth` is a running estimate of the document's wrap column, used to
 * judge whether `cur` was "full" (and therefore likely soft-wrapped).
 */
function isSoftBreak(cur: string, next: string, dominantWidth: number): boolean {
  // Never join into or out of structural lines, or across a quote-depth change.
  if (next.trim() === '') return false; // blank line = hard paragraph break
  if (isStructural(cur) || isStructural(next)) return false;
  if (quoteDepth(cur) !== quoteDepth(next)) return false;

  const curTrim = cur.trimEnd();
  const nextTrim = next.trimStart();
  if (curTrim === '') return false;

  let score = 0;

  // Terminal punctuation on the current line → likely a real break (KEEP).
  const endsHard = TERMINAL_PUNCT.test(curTrim);
  if (endsHard) score -= 3;
  else score += 2; // ends mid-clause → JOIN

  // Hyphen at end of line is a classic soft-wrap signal → strong JOIN.
  if (/[\p{L}]-$/u.test(curTrim)) score += 3;

  // Next line starts lowercase → continuation → JOIN; uppercase after terminal
  // punctuation → new sentence → KEEP.
  if (/^[\p{Ll}]/u.test(nextTrim)) score += 2;
  else if (/^[\p{Lu}]/u.test(nextTrim) && endsHard) score -= 2;

  // Line-fill test: a "full" line (near the dominant wrap width) was probably
  // soft-wrapped → JOIN; a notably short line is likely an intentional break.
  if (dominantWidth > 0) {
    if (curTrim.length >= dominantWidth * 0.85) score += 2;
    else if (curTrim.length < dominantWidth * 0.5) score -= 2;
  }

  // Remaining-space test: if the leftover width on `cur` couldn't have fit the
  // first word of `next`, the break was forced (soft) → JOIN.
  if (dominantWidth > 0) {
    const firstWord = nextTrim.split(/\s/, 1)[0] || '';
    const leftover = dominantWidth - curTrim.length;
    if (firstWord.length > 0 && leftover < firstWord.length + 1) score += 1;
  }

  return score > 0;
}

/** Estimate the document's dominant wrap width from the longest "filled" lines. */
function estimateWidth(lines: string[]): number {
  const lengths = lines
    .map((l) => l.trimEnd().length)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  if (lengths.length === 0) return 0;
  // Use the ~80th percentile so a few very long lines don't skew it.
  const idx = Math.min(lengths.length - 1, Math.floor(lengths.length * 0.8));
  return lengths[idx];
}

// --- Counting helpers ---------------------------------------------------------

/** Count how many regex matches appear in a string. */
function countMatches(text: string, re: RegExp): number {
  return (text.match(re) || []).length;
}

// --- Main pipeline ------------------------------------------------------------

export function fix(input: string, opts: ReflowOptions = DEFAULT_OPTIONS): ReflowResult {
  const counts = {
    softBreaksRemoved: 0,
    hyphensRejoined: 0,
    spacesCollapsed: 0,
    trailingTrimmed: 0,
    blankLinesDropped: 0,
    unicodeNormalized: 0,
    quoteMarkersStripped: 0,
    total: 0,
  };

  let text = input;

  // 1. Newline normalization: collapse CRLF / CR to LF so all later logic sees
  //    only `\n`. (We re-emit the chosen convention at the very end.)
  text = text.replace(/\r\n?/g, '\n');

  // 2. Unicode whitespace normalization.
  if (opts.normalizeUnicode) {
    counts.unicodeNormalized =
      countMatches(text, UNICODE_SPACES()) +
      countMatches(text, UNICODE_SEPARATORS()) +
      countMatches(text, ZERO_WIDTH());
    text = text
      .replace(UNICODE_SPACES(), ' ')
      .replace(UNICODE_SEPARATORS(), '\n')
      .replace(ZERO_WIDTH(), '');
  }

  // Work line-by-line for the per-line transforms.
  let lines = text.split('\n');

  // 3. Strip email quote markers (before reflow - they block joins otherwise).
  if (opts.stripQuoteMarkers) {
    lines = lines.map((line) => {
      if (QUOTE_PREFIX.test(line)) {
        counts.quoteMarkersStripped++;
        return line.replace(QUOTE_PREFIX, '');
      }
      return line;
    });
  }

  // 4. Tab handling (before collapse so converted spaces collapse too).
  if (opts.tabsToSpaces) {
    const pad = ' '.repeat(Math.max(1, opts.tabWidth | 0));
    lines = lines.map((line) => line.replace(/\t/g, pad));
  }

  // 5. Collapse runs of spaces/tabs to a single space.
  if (opts.collapseSpaces) {
    lines = lines.map((line) => {
      // Count collapsed runs for the summary (each run of 2+ = one collapse).
      counts.spacesCollapsed += countMatches(line, /[ \t]{2,}/g);
      return line.replace(/[ \t]{2,}/g, ' ');
    });
  }

  // 6. Per-line trim.
  if (opts.trimTrailing) {
    lines = lines.map((line) => {
      const trimmed = line.replace(/[ \t]+$/, '');
      if (trimmed.length !== line.length) counts.trailingTrimmed++;
      return trimmed;
    });
  }
  if (opts.trimLeading) {
    lines = lines.map((line) => line.replace(/^[ \t]+/, ''));
  }

  // 7. Reflow / unwrap, or the "remove all breaks" escape hatch.
  if (opts.removeAllBreaks) {
    // Each blank-line-separated block becomes a single line; blocks stay split.
    const blocks: string[] = [];
    let cur: string[] = [];
    for (const line of lines) {
      if (line.trim() === '') {
        if (cur.length) { blocks.push(cur.join(' ')); cur = []; }
      } else {
        cur.push(line.trim());
      }
    }
    if (cur.length) blocks.push(cur.join(' '));
    counts.softBreaksRemoved = Math.max(
      0,
      lines.filter((l) => l.trim() !== '').length - blocks.length
    );
    lines = blocks;
  } else if (opts.reflow) {
    const dominantWidth = estimateWidth(lines);
    const out: string[] = [];
    let buffer = lines[0] ?? '';
    for (let i = 1; i < lines.length; i++) {
      const next = lines[i];
      if (isSoftBreak(buffer, next, dominantWidth)) {
        // Join: optionally rejoin a hyphen-split word, else join with a space.
        const left = buffer.trimEnd();
        const right = next.trimStart();
        const hyphenMatch =
          opts.rejoinHyphens && /[\p{L}]-$/u.test(left) && /^[\p{Ll}]/u.test(right);
        if (hyphenMatch) {
          buffer = left.slice(0, -1) + right; // drop the trailing hyphen
          counts.hyphensRejoined++;
        } else {
          buffer = left + ' ' + right;
        }
        counts.softBreaksRemoved++;
      } else {
        out.push(buffer);
        buffer = next;
      }
    }
    out.push(buffer);
    lines = out;
  }

  // 8. Blank-line policy.
  text = lines.join('\n');
  if (opts.blankLines === 'collapse') {
    counts.blankLinesDropped += countBlankReduction(text, 'collapse');
    text = text.replace(/\n{3,}/g, '\n\n');
  } else if (opts.blankLines === 'remove') {
    counts.blankLinesDropped += countBlankReduction(text, 'remove');
    text = text.replace(/\n[ \t]*(?=\n)/g, '').replace(/\n{2,}/g, '\n');
  }

  // 9. Re-emit the chosen newline convention.
  if (opts.newline === 'crlf') text = text.replace(/\n/g, '\r\n');
  else if (opts.newline === 'cr') text = text.replace(/\n/g, '\r');

  counts.total =
    counts.softBreaksRemoved +
    counts.hyphensRejoined +
    counts.spacesCollapsed +
    counts.trailingTrimmed +
    counts.blankLinesDropped +
    counts.unicodeNormalized +
    counts.quoteMarkersStripped;

  return { text, counts };
}

/** How many blank lines a given blank-line policy would drop from `text`. */
function countBlankReduction(text: string, mode: 'collapse' | 'remove'): number {
  const before = (text.match(/^[ \t]*$/gm) || []).length;
  if (before === 0) return 0;
  let after: number;
  if (mode === 'collapse') {
    after = (text.replace(/\n{3,}/g, '\n\n').match(/^[ \t]*$/gm) || []).length;
  } else {
    after = 0;
  }
  return Math.max(0, before - after);
}

// --- Stats (mirrors the counter pattern used across the suite) ---------------

export interface TextStats {
  chars: number;
  words: number;
  lines: number;
  paragraphs: number;
  blankLines: number;
}

/** Compute live counters for a pane. Cheap, deterministic, DOM-free. */
export function stats(text: string): TextStats {
  const normalized = text.replace(/\r\n?/g, '\n');
  const chars = text.length;
  const words = normalized.trim() ? normalized.trim().split(/\s+/).length : 0;
  const lines = text === '' ? 0 : normalized.split('\n').length;
  const blankLines = (normalized.match(/^[ \t]*$/gm) || []).length;
  // Paragraphs: blank-line-separated blocks containing non-whitespace text.
  const paragraphs = normalized
    .split(/\n[ \t]*\n/)
    .filter((p) => p.trim().length > 0).length;
  return { chars, words, lines, paragraphs, blankLines };
}

/**
 * A 0–100 "whitespace tidiness" score: the share of common messiness signals
 * the current text is free of. 100 = nothing to fix. Light gamification (§5.14).
 */
export function tidiness(text: string): number {
  if (text.trim() === '') return 0;
  const normalized = text.replace(/\r\n?/g, '\n');
  const totalLines = Math.max(1, normalized.split('\n').length);

  const doubleSpaces = countMatches(normalized, /[ \t]{2,}/g);
  const trailing = countMatches(normalized, /[ \t]+$/gm);
  const blankRuns = countMatches(normalized, /\n{3,}/g);
  const unicode =
    countMatches(normalized, UNICODE_SPACES()) + countMatches(normalized, ZERO_WIDTH());

  // Express each problem as a penalty proportional to the document size, then
  // subtract from a perfect score.
  const penalty =
    (doubleSpaces / totalLines) * 30 +
    (trailing / totalLines) * 30 +
    (blankRuns / totalLines) * 20 +
    (unicode / totalLines) * 20;

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

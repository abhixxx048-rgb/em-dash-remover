/**
 * Pure diff engine for the Before/After Diff Viewer.
 *
 * Design goals (mirror src/lib/cleaner.ts):
 *  - 100% framework-free + deterministic. No DOM, no network, no side effects.
 *  - Turns jsdiff's `{ value, added, removed }` part array into a list of
 *    reviewable SEGMENTS, where each change is one accept/reject unit.
 *  - Classifies WHY each change happened (em dash → comma, curly quote, invisible
 *    char, …) so the UI can show an educational "why" tooltip + filter chips.
 *  - Lossless merge: the final output is rebuilt from the accept/reject decisions
 *    so a user who rejects everything gets back their exact original text.
 *
 * The actual word/character diffing is delegated to the installed `diff`
 * package (jsdiff) in the island script; this module is given the resulting
 * parts so it stays free of any import and is trivially testable.
 */

/** One unit returned by jsdiff's diffWords / diffChars. */
export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/** A user-facing classification of what a change touched. */
export type ChangeKind =
  | 'dash'
  | 'quote'
  | 'ellipsis'
  | 'invisible'
  | 'whitespace'
  | 'markdown'
  | 'text';

/** The decision attached to each change segment. */
export type Decision = 'accepted' | 'rejected';

/**
 * A single segment of the diff.
 *  - `unchanged` segments are shared text (no decision needed).
 *  - `change` segments pair the removed original (`before`) with the inserted
 *    replacement (`after`); either may be empty (pure insert / pure delete).
 */
export interface Segment {
  /** Stable index - used as the segment's id for keyboard nav + DOM keys. */
  index: number;
  type: 'unchanged' | 'change';
  /** Original substring (what was removed). Empty for a pure insertion. */
  before: string;
  /** Replacement substring (what was added). Empty for a pure deletion. */
  after: string;
  /** Best-guess reason for the change (only meaningful for `change`). */
  kind: ChangeKind;
  /** Accept = keep `after`; reject = keep `before`. Defaults to accepted. */
  decision: Decision;
}

/** Summary counts for the header ("+N −M · K changes"). */
export interface DiffSummary {
  /** Number of distinct change segments. */
  changes: number;
  /** Segments that purely add text. */
  insertions: number;
  /** Segments that purely remove text. */
  deletions: number;
  /** Segments that swap one string for another. */
  replacements: number;
  /** True when before === after (no changes at all). */
  identical: boolean;
}

// Character classes reused from the cleaner so labels stay consistent.
const RE_EM = /[-–]/;                 // em / en dash
const RE_QUOTE = /[‘’‚‛“”„‟]/;        // curly quotes & apostrophes
const RE_ELLIPSIS = /…/;              // ellipsis character
// Zero-width / invisible / bidi marks - same set the cleaner strips.
const RE_INVISIBLE = /[​-‏⁠﻿­‪-‮⁦-⁩]/;
const RE_NBSP = /[ ]/;           // non-breaking space
const RE_MARKDOWN = /(\*\*|__|`|^#{1,6}\s|\*)/;

/**
 * Classify a change by inspecting what was removed vs. inserted.
 * Order matters: more specific (invisible, dash, quote) before generic text.
 */
export function classifyChange(before: string, after: string): ChangeKind {
  const both = before + after;
  // An invisible char that simply vanished is the highest-signal "AI artifact".
  if (RE_INVISIBLE.test(before)) return 'invisible';
  if (RE_EM.test(before) || RE_EM.test(after)) return 'dash';
  if (RE_QUOTE.test(before)) return 'quote';
  if (RE_ELLIPSIS.test(before)) return 'ellipsis';
  if (RE_NBSP.test(before)) return 'whitespace';
  if (RE_MARKDOWN.test(before)) return 'markdown';
  // Pure whitespace shuffle (collapsed runs, trimmed line ends).
  if (before.trim() === '' && after.trim() === '') return 'whitespace';
  if (RE_MARKDOWN.test(both)) return 'markdown';
  return 'text';
}

/** Human-readable label for a change kind (used in chips + the summary). */
export function kindLabel(kind: ChangeKind): string {
  switch (kind) {
    case 'dash': return 'Dashes';
    case 'quote': return 'Quotes';
    case 'ellipsis': return 'Ellipses';
    case 'invisible': return 'Invisibles';
    case 'whitespace': return 'Whitespace';
    case 'markdown': return 'Markdown';
    default: return 'Text';
  }
}

/**
 * A short educational explanation for a single change - the "why" tooltip.
 * Reinforces the brand promise: quality + keeping your voice, never bypass.
 */
export function explainChange(kind: ChangeKind, before: string, after: string): string {
  switch (kind) {
    case 'dash':
      return after.trim()
        ? `Em/en dash → "${after.trim()}" for smoother sentence flow.`
        : 'Removed an em/en dash.';
    case 'quote':
      return 'Curly "smart" quote → straight quote.';
    case 'ellipsis':
      return 'Ellipsis character (…) → three dots (...).';
    case 'invisible':
      return 'Removed an invisible / zero-width character (a common AI artifact).';
    case 'whitespace':
      return 'Normalised spacing (non-breaking space or collapsed run).';
    case 'markdown':
      return 'Stripped leftover markdown formatting.';
    default:
      return before && after
        ? `Replaced "${before.trim()}" with "${after.trim()}".`
        : before ? 'Removed text.' : 'Added text.';
  }
}

/**
 * Render an invisible/zero-width character as a visible chip token so a
 * "removed nothing-looking thing" is actually visible in the diff.
 * Returns the original string when there is nothing invisible to surface.
 */
export function visualizeInvisibles(s: string): string {
  return s
    .replace(/​/g, '[ZWSP]')
    .replace(/‌/g, '[ZWNJ]')
    .replace(/‍/g, '[ZWJ]')
    .replace(/⁠/g, '[WJ]')
    .replace(/﻿/g, '[BOM]')
    .replace(/­/g, '[SHY]')
    .replace(/ /g, '␣')
    .replace(/[‎‏‪-‮⁦-⁩]/g, '[BIDI]');
}

/**
 * Fold jsdiff parts into accept/reject SEGMENTS.
 *
 * jsdiff emits added/removed parts adjacent to each other; we coalesce a
 * removed-immediately-followed-by-added run into a single `change` segment so
 * one conceptual edit ("-" → ", ") is one reviewable unit rather than two.
 */
export function partsToSegments(parts: DiffPart[]): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let index = 0;

  while (i < parts.length) {
    const part = parts[i];

    if (!part.added && !part.removed) {
      // Shared text - no decision needed.
      segments.push({
        index: index++,
        type: 'unchanged',
        before: part.value,
        after: part.value,
        kind: 'text',
        decision: 'accepted',
      });
      i++;
      continue;
    }

    // Gather a contiguous removed/added run into one change segment.
    let before = '';
    let after = '';
    while (i < parts.length && (parts[i].added || parts[i].removed)) {
      if (parts[i].removed) before += parts[i].value;
      else after += parts[i].value;
      i++;
    }

    const kind = classifyChange(before, after);
    segments.push({
      index: index++,
      type: 'change',
      before,
      after,
      kind,
      // Default to accepting (the cleaned version) - the user reviews/rejects.
      decision: 'accepted',
    });
  }

  return segments;
}

/** Count distinct change kinds present (for the filter chips). */
export function kindsPresent(segments: Segment[]): ChangeKind[] {
  const seen = new Set<ChangeKind>();
  for (const s of segments) if (s.type === 'change') seen.add(s.kind);
  // Stable, meaningful display order.
  const order: ChangeKind[] = ['dash', 'quote', 'ellipsis', 'invisible', 'whitespace', 'markdown', 'text'];
  return order.filter((k) => seen.has(k));
}

/** Build the header summary from a segment list. */
export function summarize(segments: Segment[]): DiffSummary {
  let insertions = 0;
  let deletions = 0;
  let replacements = 0;
  let changes = 0;

  for (const s of segments) {
    if (s.type !== 'change') continue;
    changes++;
    if (s.before && s.after) replacements++;
    else if (s.after) insertions++;
    else deletions++;
  }

  return {
    changes,
    insertions,
    deletions,
    replacements,
    identical: changes === 0,
  };
}

/**
 * Rebuild the final text from the current accept/reject decisions.
 *  - unchanged → shared value
 *  - accepted change → the inserted (`after`) value
 *  - rejected change → the original (`before`) value
 * This is lossless: reject-all reproduces the exact original.
 */
export function mergeResult(segments: Segment[]): string {
  let out = '';
  for (const s of segments) {
    if (s.type === 'unchanged') out += s.before;
    else out += s.decision === 'accepted' ? s.after : s.before;
  }
  return out;
}

/** How many change segments have been touched (not in the default accepted state)? */
export function reviewedCount(segments: Segment[], touched: Set<number>): number {
  return [...touched].filter((i) => segments[i]?.type === 'change').length;
}

/** Escape a string for safe insertion into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Export the diff as Markdown using ~~strike~~ for removals and **bold** for
 * additions - a portable, paste-anywhere representation of the changes.
 */
export function toMarkdown(segments: Segment[]): string {
  let out = '';
  for (const s of segments) {
    if (s.type === 'unchanged') {
      out += s.before;
    } else {
      if (s.before) out += `~~${s.before}~~`;
      if (s.after) out += `**${s.after}**`;
    }
  }
  return out;
}

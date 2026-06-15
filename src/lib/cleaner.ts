/**
 * Core client-side cleaning engine.
 *
 * Design goals (see RESEARCH.md):
 *  - Grammar-aware em-dash replacement, NOT blind find-replace. An em dash does
 *    several jobs; we pick a context-appropriate fix instead of one global swap.
 *  - Consolidated "de-AI" cleanup: dashes + invisible chars + smart quotes +
 *    markdown artifacts in one pass.
 *  - 100% in-browser. Nothing here touches the network.
 */

export type DashStyle = 'smart' | 'comma' | 'period' | 'colon' | 'parentheses' | 'space' | 'remove';

export interface CleanOptions {
  /** How to handle em dashes (-). 'smart' = context-aware. */
  dashStyle: DashStyle;
  /** Convert en dashes (–) used as punctuation the same way as em dashes. */
  enDashes: boolean;
  /** Curly quotes/apostrophes → straight. */
  smartQuotes: boolean;
  /** Ellipsis char (…) → "..." */
  ellipsis: boolean;
  /** Strip zero-width / invisible characters (incl. AI "watermark" chars). */
  invisibles: boolean;
  /** Non-breaking spaces → normal spaces; collapse runs of spaces. */
  whitespace: boolean;
  /** Strip leftover markdown artifacts (**bold**, ## headings) from pasted prose. */
  markdown: boolean;
}

export const DEFAULT_OPTIONS: CleanOptions = {
  dashStyle: 'smart',
  enDashes: true,
  smartQuotes: true,
  ellipsis: true,
  invisibles: true,
  whitespace: true,
  markdown: false,
};

export interface CleanResult {
  text: string;
  counts: {
    emDashes: number;
    enDashes: number;
    smartQuotes: number;
    ellipses: number;
    invisibles: number;
    nbsp: number;
    markdown: number;
    total: number;
  };
}

const EM = '-'; // -
const EN = '–'; // –

// Zero-width & invisible characters frequently left in AI / web-copied text.
// Includes ZWSP, ZWNJ, ZWJ, word joiner, BOM, soft hyphen, and bidi marks.
const INVISIBLES = /[​‌‍⁠﻿­‎‏‪-‮⁡-⁤]/g;

/**
 * Decide a replacement for a SINGLE em/en dash given the text on either side.
 * Heuristics (no NLP, but a lot smarter than "replace all with comma"):
 *   - Both sides look like independent clauses  → "; " (avoids the comma-splice
 *     bug that every naive tool produces).
 *   - Right side is a short tail / fragment      → ", "
 *   - Left side ends a complete thought and the
 *     right side starts an explanation/list      → ": "
 */
function smartSingle(before: string, after: string, hadSpace: boolean): string {
  const left = before.trimEnd();
  const right = after.trimStart();

  // Range like "May-September" or "10-20" (no surrounding spaces, letters/digits
  // on both sides): this is really an en-dash usage, not a sentence break.
  if (!hadSpace && /[\p{L}\p{N}]$/u.test(left) && /^[\p{L}\p{N}]/u.test(right)) {
    return EN; // keep as a proper (unspaced) en dash range
  }

  const leftIsClause = looksIndependent(left);
  const rightIsClause = looksIndependent(right);

  if (leftIsClause && rightIsClause) return '; ';
  if (leftIsClause && /^(a|an|the|that is|i\.e\.|e\.g\.|namely)\b/i.test(right)) return ': ';
  return ', ';
}

/** Rough "is this an independent clause?" check: has a subject-ish + verb-ish token. */
function looksIndependent(seg: string): boolean {
  const words = seg.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  // Common verbs / auxiliaries as a cheap signal of a finite clause.
  return /\b(is|are|was|were|be|been|am|has|have|had|do|does|did|will|would|can|could|should|may|might|must|it'?s|that'?s|there'?s)\b/i.test(seg)
    || /\b\w+(ed|es|s)\b/i.test(seg); // crude verb-form fallback
}

function replaceDashes(text: string, style: DashStyle, includeEn: boolean): { text: string; em: number; en: number } {
  let em = 0;
  let en = 0;

  // Build a matcher for the dash chars in scope. We handle optional surrounding
  // spaces so " - " collapses cleanly to the replacement.
  const dashClass = includeEn ? `[${EM}${EN}]` : EM;
  // Capture surrounding whitespace so we can tell a real range ("May-September")
  // from a spaced sentence break (" - ").
  const re = new RegExp(`(\\s*)(${dashClass})(\\s*)`, 'gu');

  // First pass: detect parenthetical PAIRS within a sentence and convert both
  // to the same delimiter (commas by default, or parentheses on request).
  // We approximate "sentence" as text between . ! ? boundaries.
  if (style === 'smart' || style === 'comma' || style === 'parentheses') {
    text = text.replace(/[^.!?\n]*[.!?\n]?/g, (sentence) => {
      const dashes = (sentence.match(new RegExp(dashClass, 'gu')) || []).length;
      if (dashes === 2) {
        let first = true;
        return sentence.replace(re, (_m, _ws1, d) => {
          if (d === EM) em++; else en++;
          if (style === 'parentheses') {
            const out = first ? ' (' : ') ';
            first = false;
            return out;
          }
          first = false;
          return ', ';
        });
      }
      return sentence;
    });
  }

  // Second pass: any remaining single dashes.
  text = text.replace(re, (match, ws1: string, d, ws2: string, offset: number, full: string) => {
    if (d === EM) em++; else en++;
    const before = full.slice(0, offset);
    const after = full.slice(offset + match.length);
    const hadSpace = ws1.length > 0 || ws2.length > 0;
    switch (style) {
      case 'smart': {
        return smartSingle(before, after, hadSpace);
      }
      case 'comma': return ', ';
      case 'period': return '. ';
      case 'colon': return ': ';
      case 'parentheses': return ' '; // unmatched single: fall back to space
      case 'space': return ' ';
      case 'remove': return '';
      default: return ', ';
    }
  });

  return { text, em, en };
}

export function clean(input: string, opts: CleanOptions = DEFAULT_OPTIONS): CleanResult {
  let text = input;
  const counts = {
    emDashes: 0, enDashes: 0, smartQuotes: 0, ellipses: 0,
    invisibles: 0, nbsp: 0, markdown: 0, total: 0,
  };

  // Normalize "--" / "---" typed dashes to a real em dash first so they get
  // handled by the same logic.
  text = text.replace(/-{2,}/g, EM);

  if (opts.dashStyle) {
    const r = replaceDashes(text, opts.dashStyle, opts.enDashes);
    text = r.text;
    counts.emDashes = r.em;
    counts.enDashes = r.en;
  }

  if (opts.smartQuotes) {
    const before = text;
    text = text
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"');
    counts.smartQuotes = countDiff(before, text, /[‘’‚‛“”„‟]/g);
  }

  if (opts.ellipsis) {
    counts.ellipses = (text.match(/…/g) || []).length;
    text = text.replace(/…/g, '...');
  }

  if (opts.invisibles) {
    counts.invisibles = (text.match(INVISIBLES) || []).length;
    text = text.replace(INVISIBLES, '');
  }

  if (opts.whitespace) {
    counts.nbsp = (text.match(/ /g) || []).length;
    text = text.replace(/ /g, ' ');
    // Collapse runs of spaces/tabs (but preserve newlines) and trim line ends.
    text = text.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '');
  }

  if (opts.markdown) {
    const before = text;
    text = text
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')        // ATX headings
      .replace(/\*\*([^*]+)\*\*/g, '$1')          // bold
      .replace(/\*([^*]+)\*/g, '$1')              // italics
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1');               // inline code
    counts.markdown = before.length === text.length ? 0 : 1;
  }

  counts.total =
    counts.emDashes + counts.enDashes + counts.smartQuotes + counts.ellipses +
    counts.invisibles + counts.nbsp + counts.markdown;

  return { text, counts };
}

function countDiff(before: string, _after: string, re: RegExp): number {
  return (before.match(re) || []).length;
}

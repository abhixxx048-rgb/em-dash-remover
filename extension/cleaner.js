/**
 * Trimmed plain-JS port of src/lib/cleaner.ts - the SAME grammar-aware engine
 * the website uses, with zero DOM/network dependencies so it drops straight into
 * a Manifest V3 content script.
 *
 * Keep this in sync with src/lib/cleaner.ts. The build (TODO: wire up esbuild/Vite)
 * should ideally bundle the TS source directly so this hand-port can be deleted.
 */

const EM = '-'; // -
const EN = '–'; // –

// Zero-width & invisible characters frequently left in AI / web-copied text.
const INVISIBLES =
  /[​‌‍⁠﻿­‎‏‪-‮⁡-⁤]/g;

const DEFAULT_OPTIONS = {
  dashStyle: 'smart',
  enDashes: true,
  smartQuotes: true,
  ellipsis: true,
  invisibles: true,
  whitespace: true,
  markdown: false,
};

function looksIndependent(seg) {
  const words = seg.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  return (
    /\b(is|are|was|were|be|been|am|has|have|had|do|does|did|will|would|can|could|should|may|might|must|it'?s|that'?s|there'?s)\b/i.test(
      seg
    ) || /\b\w+(ed|es|s)\b/i.test(seg)
  );
}

function smartSingle(before, after, hadSpace) {
  const left = before.trimEnd();
  const right = after.trimStart();

  if (!hadSpace && /[\p{L}\p{N}]$/u.test(left) && /^[\p{L}\p{N}]/u.test(right)) {
    return EN;
  }

  const leftIsClause = looksIndependent(left);
  const rightIsClause = looksIndependent(right);

  if (leftIsClause && rightIsClause) return '; ';
  if (leftIsClause && /^(a|an|the|that is|i\.e\.|e\.g\.|namely)\b/i.test(right)) return ': ';
  return ', ';
}

function replaceDashes(text, style, includeEn) {
  let em = 0;
  let en = 0;

  const dashClass = includeEn ? `[${EM}${EN}]` : EM;
  const re = new RegExp(`(\\s*)(${dashClass})(\\s*)`, 'gu');

  if (style === 'smart' || style === 'comma' || style === 'parentheses') {
    text = text.replace(/[^.!?\n]*[.!?\n]?/g, (sentence) => {
      const dashes = (sentence.match(new RegExp(dashClass, 'gu')) || []).length;
      if (dashes === 2) {
        let first = true;
        return sentence.replace(re, (_m, _ws1, d) => {
          if (d === EM) em++;
          else en++;
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

  text = text.replace(re, (match, ws1, d, ws2, offset, full) => {
    if (d === EM) em++;
    else en++;
    const before = full.slice(0, offset);
    const after = full.slice(offset + match.length);
    const hadSpace = ws1.length > 0 || ws2.length > 0;
    switch (style) {
      case 'smart':
        return smartSingle(before, after, hadSpace);
      case 'comma':
        return ', ';
      case 'period':
        return '. ';
      case 'colon':
        return ': ';
      case 'parentheses':
        return ' ';
      case 'space':
        return ' ';
      case 'remove':
        return '';
      default:
        return ', ';
    }
  });

  return { text, em, en };
}

function clean(input, opts = DEFAULT_OPTIONS) {
  let text = input;
  const counts = {
    emDashes: 0,
    enDashes: 0,
    smartQuotes: 0,
    ellipses: 0,
    invisibles: 0,
    nbsp: 0,
    markdown: 0,
    total: 0,
  };

  text = text.replace(/-{2,}/g, EM);

  if (opts.dashStyle) {
    const r = replaceDashes(text, opts.dashStyle, opts.enDashes);
    text = r.text;
    counts.emDashes = r.em;
    counts.enDashes = r.en;
  }

  if (opts.smartQuotes) {
    const before = text;
    text = text.replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"');
    counts.smartQuotes = (before.match(/[‘’‚‛“”„‟]/g) || []).length;
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
    counts.nbsp = (text.match(/[  ]/g) || []).length;
    text = text.replace(/[  ]/g, ' ');
    text = text.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '');
  }

  if (opts.markdown) {
    const before = text;
    text = text
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
    counts.markdown = before.length === text.length ? 0 : 1;
  }

  counts.total =
    counts.emDashes +
    counts.enDashes +
    counts.smartQuotes +
    counts.ellipses +
    counts.invisibles +
    counts.nbsp +
    counts.markdown;

  return { text, counts };
}

// Export for both module and classic-script content-script contexts.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clean, DEFAULT_OPTIONS };
}
if (typeof self !== 'undefined') {
  self.EmDashCleaner = { clean, DEFAULT_OPTIONS };
}

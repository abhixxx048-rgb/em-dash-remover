/**
 * Paste-from-Word/Docs Cleaner - pure, framework-free engine.
 *
 * Design goals (see docs/tools/paste-from-word-docs-cleaner.md):
 *  - Strip the invisible cruft Word and Google Docs hide in the clipboard's
 *    `text/html` payload (`mso-*` styles, `MsoNormal` classes, `<o:p>`/`<w:>`/
 *    `<xml>` namespace junk, conditional comments, StartFragment/EndFragment
 *    markers, the Google Docs `docs-internal-guid` wrapper) - while KEEPING the
 *    real structure (paragraphs, headings, lists, bold/italic, links).
 *  - Repair the classic PDF-copy artifacts: words hyphenated across a line wrap
 *    (`com-\npany` -> `company`) and one-line-break-per-visual-row paragraphs.
 *  - Offer clean HTML, clean plain text, and clean Markdown as outputs.
 *  - 100% in-browser. Nothing here touches the network.
 *
 * Purity note: this module does NO DOM work and imports nothing. The browser's
 * `DOMParser` allow-list sanitization lives in the island's <script> (which has
 * a DOM); everything here is deterministic string/regex work so it stays easy to
 * reason about and test. The two halves meet at `sanitizeHtmlFragment`-shaped
 * data: this module pre-cleans the raw clipboard HTML (the junk that lives
 * OUTSIDE normal elements and that an allow-list cannot catch), promotes Docs
 * inline weight/style to semantic tags, then the island runs the allow-list, and
 * finally this module post-processes (empty-tag cleanup, HTML->text/Markdown).
 */

/* ------------------------------------------------------------------ *
 * Options & result contracts (mirrors cleaner.ts CleanResult.counts) *
 * ------------------------------------------------------------------ */

/** Output flavor the user wants back. */
export type OutputFormat = 'html' | 'text' | 'markdown';

export interface CleanPasteOptions {
  /** Keep <strong>/<b>/<em>/<i>/<u> formatting (off => flattened to text). */
  keepBold: boolean;
  /** Keep links (<a href>). */
  keepLinks: boolean;
  /** Keep list structure (<ul>/<ol>/<li>). */
  keepLists: boolean;
  /** Keep headings (<h1>-<h6>); off => demote to paragraphs. */
  keepHeadings: boolean;
  /** Keep tables; off => flatten cells to text rows. */
  keepTables: boolean;
  /** Run the PDF-artifact repair pass (de-hyphenate + reflow soft breaks). */
  repairPdf: boolean;
  /** Drop bare page-number lines when repairing PDF text. */
  dropPageNumbers: boolean;
}

export const DEFAULT_OPTIONS: CleanPasteOptions = {
  keepBold: true,
  keepLinks: true,
  keepLists: true,
  keepHeadings: true,
  keepTables: true,
  repairPdf: true,
  dropPageNumbers: true,
};

/** One-click aggressiveness profiles surfaced in the UI (spec §5.5). */
export type PresetName = 'keep' | 'plain' | 'markdown';

export const PRESETS: Record<PresetName, { format: OutputFormat; opts: Partial<CleanPasteOptions> }> = {
  // CMS author: strip junk, keep all real structure.
  keep: { format: 'html', opts: { keepBold: true, keepLinks: true, keepLists: true, keepHeadings: true, keepTables: true } },
  // Email / form writer: flatten to clean prose, drop everything but paragraphs.
  plain: { format: 'text', opts: { keepBold: false, keepLinks: false, keepLists: true, keepHeadings: false, keepTables: false } },
  // Dev / Notion user: GitHub-flavored Markdown, keep structure.
  markdown: { format: 'markdown', opts: { keepBold: true, keepLinks: true, keepLists: true, keepHeadings: true, keepTables: false } },
};

/** Where the pasted payload most likely came from (spec §5.3). */
export type PasteSource = 'word' | 'docs' | 'pdf' | 'html' | 'plain' | 'unknown';

export interface CleanCounts {
  inlineStyles: number;
  msoBlocks: number;
  emptyTags: number;
  docsWrapper: number;
  hyphenJoins: number;
  lineBreakJoins: number;
  pageNumbers: number;
  total: number;
}

/** The structural/semantic allow-list (spec §4.5). Used by the island's
 *  DOMPurify-style allow-list AND echoed here so both halves agree. */
export const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 'a',
  'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
] as const;

export const ALLOWED_ATTR = ['href'] as const;

/* ------------------------------------------------------------------ *
 * Source detection                                                   *
 * ------------------------------------------------------------------ */

/**
 * Guess where a paste came from using telltale markers (spec §5.3). Cheap and
 * deterministic; used only to label the result and choose sensible defaults.
 *
 * @param html The raw `text/html` clipboard payload ('' if none was present).
 * @param text The `text/plain` fallback (used for the PDF heuristic).
 */
export function detectSource(html: string, text: string): PasteSource {
  if (html && html.trim()) {
    // Word leaves `mso-`, `MsoNormal`, `<o:p>`, `urn:schemas-microsoft-com`.
    if (/mso-|MsoNormal|<o:p|urn:schemas-microsoft-com|<w:|<m:/i.test(html)) return 'word';
    // Google Docs wraps everything in a `docs-internal-guid-...` <b>.
    if (/docs-internal-guid/i.test(html)) return 'docs';
    return 'html';
  }
  // No HTML at all: likely a PDF/plain-text copy. If the plain text has the
  // PDF fingerprint (many short lines and/or hyphen-at-line-end), call it PDF.
  if (looksLikePdfCopy(text)) return 'pdf';
  return text.trim() ? 'plain' : 'unknown';
}

/** Heuristic: does this plain text look like it was copied out of a PDF? */
export function looksLikePdfCopy(text: string): boolean {
  const lines = text.split('\n');
  if (lines.length < 4) return false;
  // A soft hyphen at a line end (`com-\npany`) is the strongest single signal.
  const hyphenWraps = (text.match(/[A-Za-z]-\n[a-z]/g) || []).length;
  if (hyphenWraps >= 1) return true;
  // Otherwise: lots of medium lines that do NOT end in sentence punctuation
  // (one visual row per line) is the reflow fingerprint.
  let softBreaks = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i].trim();
    const b = lines[i + 1].trim();
    if (a && b && !/[.!?:;,)"'”’]$/.test(a) && a.length > 20) softBreaks++;
  }
  return softBreaks >= 3;
}

/** Human label for a detected source (paired with text, never color-only). */
export function sourceLabel(src: PasteSource): string {
  switch (src) {
    case 'word': return 'Microsoft Word';
    case 'docs': return 'Google Docs';
    case 'pdf': return 'PDF copy';
    case 'html': return 'Generic HTML';
    case 'plain': return 'Plain text';
    default: return 'Unknown';
  }
}

/* ------------------------------------------------------------------ *
 * Stage 1 - pre-sanitize regex pass (junk outside normal elements)   *
 * ------------------------------------------------------------------ */

/**
 * Strip the structural junk that lives OUTSIDE normal elements and that a tag
 * allow-list cannot catch on its own (spec §7.3): CF_HTML headers,
 * StartFragment/EndFragment markers, conditional comments, Word `<style>`
 * blocks, and `<xml>`/`<o:>`/`<w:>`/`<m:>`/`<v:>` namespace blocks.
 *
 * Returns the cleaned HTML plus a count of `mso-`/namespace blocks removed for
 * the "what we removed" inventory.
 */
export function preSanitizeHtml(html: string): { html: string; msoBlocks: number } {
  let out = html;
  let msoBlocks = 0;

  // CF_HTML clipboard header (Version:…StartHTML:… etc.) sits before the markup.
  out = out.replace(/^[\s\S]*?<html/i, '<html');

  // StartFragment / EndFragment markers and the generic fragment comments.
  out = out.replace(/<!--\s*(Start|End)Fragment\s*-->/gi, '');

  // Down-level conditional comments: <!--[if ...]> ... <![endif]-->.
  out = out.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, () => { msoBlocks++; return ''; });

  // Word's <style> blocks (which carry the `mso-` rule soup) and <xml> islands.
  out = out.replace(/<style[\s\S]*?<\/style>/gi, (m) => { if (/mso-|MsoNormal/i.test(m)) msoBlocks++; return ''; });
  out = out.replace(/<xml[\s\S]*?<\/xml>/gi, () => { msoBlocks++; return ''; });

  // Namespace element blocks: <o:p>…</o:p>, <w:…>, <m:…>, <v:…> (self-closing
  // and paired). Unwrap content for the common <o:p>&nbsp;</o:p> case by just
  // dropping the tags (their content is whitespace 99% of the time).
  out = out.replace(/<\/?(?:o|w|m|v|st1|st2):[^>]*>/gi, () => { msoBlocks++; return ''; });

  // Generic HTML comments left behind (Word scatters many).
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  return { html: out, msoBlocks };
}

/* ------------------------------------------------------------------ *
 * Stage 2 - Google Docs normalization (string-level, pre-allow-list) *
 * ------------------------------------------------------------------ */

/**
 * Promote Google Docs inline weight/style to SEMANTIC tags BEFORE the allow-list
 * strips `style=` (spec §7.4). Docs encodes bold as `style="font-weight:700"`
 * and italic as `style="font-style:italic"` on <span>s, and wraps the whole
 * paste in `<b style="font-weight:normal" id="docs-internal-guid-…">`. If we let
 * the allow-list run first the user would LOSE their bold/italic, so we convert
 * here while the inline styles are still present.
 *
 * Returns the rewritten HTML and whether a Docs wrapper was unwrapped.
 */
export function normalizeGoogleDocs(html: string): { html: string; docsWrapper: number } {
  let out = html;
  let docsWrapper = 0;

  // Unwrap the outer non-bold <b id="docs-internal-guid-…"> wrapper: turn its
  // open/close tags into nothing (keep the content). We match the opening tag
  // (which carries the id) and the *next* </b>... but a simpler, robust approach
  // is to neutralize the wrapper's bold by stripping that specific <b ...> tag.
  out = out.replace(/<b\b[^>]*\bid=["']?docs-internal-guid-[^>]*>/gi, () => { docsWrapper++; return ''; });
  // If we removed an opening wrapper, drop one matching trailing </b>. Hard to
  // pair perfectly with regex, so only strip a </b> that sits at the very end of
  // the fragment (the wrapper's close), which is the common Docs shape.
  if (docsWrapper > 0) out = out.replace(/<\/b>\s*$/i, '');

  // Promote inline bold spans -> <strong>. font-weight:600/700/bold.
  out = out.replace(
    /<span\b[^>]*style=["'][^"']*font-weight\s*:\s*(?:bold|[6-9]00)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    '<strong>$1</strong>',
  );
  // Promote inline italic spans -> <em>.
  out = out.replace(
    /<span\b[^>]*style=["'][^"']*font-style\s*:\s*italic[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    '<em>$1</em>',
  );

  return { html: out, docsWrapper };
}

/* ------------------------------------------------------------------ *
 * Stage 3 - post-allow-list cleanup (runs on already-sanitized HTML) *
 * ------------------------------------------------------------------ */

/**
 * Tidy the HTML the allow-list produced: drop empty `<p>`/`<span>`/`<li>`,
 * collapse `&nbsp;` runs, and squeeze blank lines. The allow-list already
 * removed `style`/`class`/`lang`/event handlers and unwrapped non-allowed tags
 * (keeping their text), so this is the final cosmetic pass (spec §4.7).
 *
 * Returns cleaned HTML and the count of empty tags removed.
 */
export function tidyHtml(html: string): { html: string; emptyTags: number } {
  let out = html;
  let emptyTags = 0;

  // &nbsp; (and the literal NBSP char) -> a normal space; collapse runs.
  out = out.replace(/(?:&nbsp;| )+/g, ' ');

  // Remove empty inline/block wrappers, repeatedly (nesting can leave layers).
  // An "empty" tag holds only whitespace/&nbsp; once the above ran.
  const emptyRe = /<(p|span|li|strong|em|b|i|u|h[1-6])>\s*<\/\1>/gi;
  let prev: string;
  do {
    prev = out;
    out = out.replace(emptyRe, () => { emptyTags++; return ''; });
  } while (out !== prev);

  // Drop leftover bare <span>/<font> wrappers (allow-list should have, but be
  // safe): unwrap, keeping their text.
  out = out.replace(/<\/?(?:span|font)\b[^>]*>/gi, '');

  // Collapse 3+ <br> in a row to a paragraph-ish double break.
  out = out.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>');

  return { html: out.trim(), emptyTags };
}

/** Count `style=` attributes present in a fragment (for the inventory). */
export function countInlineStyles(html: string): number {
  return (html.match(/\sstyle\s*=/gi) || []).length;
}

/* ------------------------------------------------------------------ *
 * Stage 4 - PDF-artifact repair (plain-text level)                   *
 * ------------------------------------------------------------------ */

export interface PdfRepairResult {
  text: string;
  hyphenJoins: number;
  lineBreakJoins: number;
  pageNumbers: number;
}

/**
 * Repair PDF-copy artifacts in PLAIN text (spec §7 "PDF-artifact repair"):
 *  - De-hyphenate words split across a line wrap (`com-\npany` -> `company`).
 *    Only join when the second part is lowercase (a real wrap, not a compound
 *    like `well-Known` at a line edge).
 *  - Reflow: join a single `\n` between two lines that don't end in sentence
 *    punctuation into a space, but KEEP blank-line paragraph breaks and breaks
 *    before list markers (so lists/poems survive). Reversible in the UI.
 *  - Optionally drop bare page-number lines (`^\s*\d+\s*$`).
 */
export function repairPdfText(input: string, dropPageNumbers: boolean): PdfRepairResult {
  let hyphenJoins = 0;
  let lineBreakJoins = 0;
  let pageNumbers = 0;

  // Normalize CRLF first so the line logic is simple.
  let text = input.replace(/\r\n?/g, '\n');

  // 1) De-hyphenation: `word-\n word` -> `word`. Lowercase second half only.
  text = text.replace(/([A-Za-z])-\s*\n\s*([a-z])/g, (_m, a, b) => { hyphenJoins++; return a + b; });

  // 2) Optionally drop bare page-number lines.
  if (dropPageNumbers) {
    // Remove the whole page-number line (and its trailing newline) directly;
    // the blank-line collapse below tidies any gap it leaves.
    text = text.replace(/^[ \t]*\d{1,4}[ \t]*$\n?/gm, () => { pageNumbers++; return ''; });
  }

  // 3) Reflow soft single line breaks into spaces.
  const lines = text.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    const next = i + 1 < lines.length ? lines[i + 1] : null;
    out.push(cur);
    if (next == null) break;

    const a = cur.trim();
    const b = next.trim();
    // Blank line => real paragraph break; keep it.
    if (a === '' || b === '') continue;
    // Don't join into a list/numbered marker (preserve list structure).
    if (/^([-*•‣◦]|\d+[.)]|[a-z][.)])\s/.test(b)) continue;
    // Don't join if the current line ends a sentence (paragraph boundary).
    if (/[.!?:;]["'”’)]?$/.test(a)) continue;
    // Otherwise this looks like a soft visual wrap: join with a space.
    out[out.length - 1] = cur.replace(/\s*$/, '') + ' ';
    lines[i + 1] = b; // trimmed-left continuation
    out.push(''); // placeholder removed below by the join logic
    out.pop();
    // Merge: append next onto current, and skip emitting next separately.
    out[out.length - 1] += b;
    lineBreakJoins++;
    i++; // consumed `next`
  }
  text = out.join('\n');

  // Tidy: collapse 3+ blank lines to a paragraph break, trim trailing spaces.
  text = text.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();

  return { text, hyphenJoins, lineBreakJoins, pageNumbers };
}

/* ------------------------------------------------------------------ *
 * Stage 5 - HTML -> plain text, HTML -> Markdown (no DOM, no deps)    *
 * ------------------------------------------------------------------ */

/** Decode the handful of HTML entities our outputs can contain. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”');
}

/**
 * Convert clean (already allow-listed) HTML to readable PLAIN text, preserving
 * paragraph and list-item boundaries. A tiny, dependency-free serializer - we
 * map block tags to newlines and list items to `- ` so the text reads naturally
 * (spec §4.8 / §7.5).
 */
export function htmlToText(html: string): string {
  let s = html;
  // Block-level closers become double newlines; <br> a single newline.
  s = s.replace(/<\/(p|div|h[1-6]|blockquote|tr|table|ul|ol|pre)>/gi, '\n\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  // List items: a leading dash + the text, then a newline.
  s = s.replace(/<li[^>]*>/gi, '- ').replace(/<\/li>/gi, '\n');
  // Drop every remaining tag.
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  // Tidy whitespace: trim line ends, collapse 3+ newlines.
  s = s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/**
 * Convert clean (already allow-listed) HTML to GitHub-flavored Markdown. A
 * small, local HTML->Markdown step (spec §5.5 / §10) - no Turndown dependency.
 * Handles headings, bold/italic, links, lists, blockquotes, code, and
 * paragraphs, which covers what the allow-list can emit.
 */
export function htmlToMarkdown(html: string): string {
  let s = html;

  // Inline emphasis.
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Links: <a href="x">text</a> -> [text](x).
  s = s.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Headings h1-h6 -> #..###### .
  for (let n = 1; n <= 6; n++) {
    const re = new RegExp(`<h${n}\\b[^>]*>([\\s\\S]*?)<\\/h${n}>`, 'gi');
    s = s.replace(re, `\n${'#'.repeat(n)} $1\n`);
  }

  // List items -> "- item" / "1. item" is non-trivial without a tree; use "-".
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  s = s.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');

  // Blockquote.
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, t) =>
    '\n' + String(t).replace(/<[^>]+>/g, '').trim().split('\n').map((l: string) => '> ' + l).join('\n') + '\n');

  // Paragraphs and breaks.
  s = s.replace(/<\/p>/gi, '\n\n').replace(/<p\b[^>]*>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '  \n');

  // Strip any remaining tags, decode entities, tidy.
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  s = s.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/* ------------------------------------------------------------------ *
 * Plain-text-only path (no HTML in the clipboard)                    *
 * ------------------------------------------------------------------ */

/**
 * When there is no `text/html` (PDF reader, Safari quirks, plain copy), there's
 * nothing to sanitize - we only run the PDF/whitespace passes. This convenience
 * wrapper returns text plus a counts object shaped like the HTML path so the UI
 * can render one inventory.
 */
export function cleanPlainText(
  text: string,
  opts: CleanPasteOptions = DEFAULT_OPTIONS,
): { text: string; counts: CleanCounts } {
  let out = text;
  const counts = blankCounts();
  if (opts.repairPdf) {
    const r = repairPdfText(out, opts.dropPageNumbers);
    out = r.text;
    counts.hyphenJoins = r.hyphenJoins;
    counts.lineBreakJoins = r.lineBreakJoins;
    counts.pageNumbers = r.pageNumbers;
  } else {
    // Still normalize whitespace even without PDF repair.
    out = out.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  }
  counts.total = totalCount(counts);
  return { text: out, counts };
}

/* ------------------------------------------------------------------ *
 * Counts helpers                                                     *
 * ------------------------------------------------------------------ */

export function blankCounts(): CleanCounts {
  return {
    inlineStyles: 0, msoBlocks: 0, emptyTags: 0, docsWrapper: 0,
    hyphenJoins: 0, lineBreakJoins: 0, pageNumbers: 0, total: 0,
  };
}

export function totalCount(c: CleanCounts): number {
  return c.inlineStyles + c.msoBlocks + c.emptyTags + c.docsWrapper +
    c.hyphenJoins + c.lineBreakJoins + c.pageNumbers;
}

/** Build the human "what we removed" inventory rows (label + count). */
export function inventoryRows(c: CleanCounts): { label: string; count: number }[] {
  const rows: { label: string; count: number }[] = [
    { label: 'inline styles', count: c.inlineStyles },
    { label: 'Word/mso blocks', count: c.msoBlocks },
    { label: 'empty tags', count: c.emptyTags },
    { label: 'Docs wrapper', count: c.docsWrapper },
    { label: 'hyphen joins', count: c.hyphenJoins },
    { label: 'line-break joins', count: c.lineBreakJoins },
    { label: 'page numbers', count: c.pageNumbers },
  ];
  return rows.filter((r) => r.count > 0);
}

/** Word / character / paragraph counts on the cleaned output (spec §5.15). */
export function textStats(text: string): { words: number; chars: number; paragraphs: number } {
  const trimmed = text.trim();
  const words = trimmed ? (trimmed.match(/\S+/g) || []).length : 0;
  const chars = text.length;
  const paragraphs = trimmed ? trimmed.split(/\n{2,}/).filter((p) => p.trim()).length : 0;
  return { words, chars, paragraphs };
}

/**
 * Detect residual em dashes / en dashes / curly quotes the cleaner deliberately
 * LEAVES alone (that's the main Em Dash Remover's job). Powers the cross-sell
 * handoff strip (spec §5.18). Returns 0 when the text is clean of them.
 */
export function residualTypography(text: string): { emDashes: number; curlyQuotes: number } {
  const emDashes = (text.match(/[-–]/g) || []).length;
  const curlyQuotes = (text.match(/[‘’“”]/g) || []).length;
  return { emDashes, curlyQuotes };
}

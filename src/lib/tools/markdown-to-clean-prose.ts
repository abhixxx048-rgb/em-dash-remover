/**
 * Markdown → Clean-Prose Converter - pure, framework-free engine.
 *
 * Design goals (companion to the shipped cleaner / reflow fixer):
 *  - Turn the markdown LLMs emit (##, **bold**, bullets, |tables|, `code`,
 *    [links](url), > quotes, --- rules) into clean prose that pastes correctly
 *    into Gmail, Google Docs, LinkedIn, Slack, and CRMs - which all render the
 *    raw asterisks and hashes literally.
 *  - Be SELECTIVE and predictable: keep the real words, paragraph structure, and
 *    optionally list shape; never mangle code the user wanted to keep.
 *  - Deterministic string work. 100% in-browser. No network, no DOM, no npm.
 *
 * The transform protects fenced/inline code via placeholders, runs block-level
 * line rewrites (headings, quotes, lists, rules, tables), then inline rewrites
 * (images, links, emphasis), then restores the protected code and tidies space.
 */

/* ------------------------------------------------------------------ *
 * Options & result contracts                                         *
 * ------------------------------------------------------------------ */

/** What a `[text](url)` link collapses to. */
export type LinkMode = 'text' | 'text-url' | 'keep';
/** What an `![alt](url)` image collapses to. */
export type ImageMode = 'alt' | 'remove' | 'keep';
/** How list markers are rendered. */
export type ListMode = 'dash' | 'bullet' | 'plain' | 'keep';
/** How fenced code blocks are handled. */
export type CodeBlockMode = 'unwrap' | 'remove' | 'keep';
/** How GFM tables are handled. */
export type TableMode = 'readable' | 'strip' | 'keep';

export interface MdOptions {
  /** Strip leading `#` markers from ATX headings (keep the heading text). */
  headings: boolean;
  /** Unwrap bold / italic / bold-italic / strikethrough to plain words. */
  emphasis: boolean;
  /** Unwrap `inline code` to its contents. When false, backticks are kept. */
  inlineCode: boolean;
  /** Fenced ``` code block handling. */
  codeBlocks: CodeBlockMode;
  /** `[text](url)` link handling. */
  links: LinkMode;
  /** `![alt](url)` image handling. */
  images: ImageMode;
  /** Strip `>` blockquote markers (keep the quoted text). */
  blockquotes: boolean;
  /** Bullet / numbered list marker handling. */
  lists: ListMode;
  /** Remove horizontal rules (`---`, `***`, `___`). */
  horizontalRules: boolean;
  /** GFM table handling. */
  tables: TableMode;
  /** Collapse leftover double spaces / blank-line runs / trailing space. */
  tidy: boolean;
}

export const DEFAULT_OPTIONS: MdOptions = {
  headings: true,
  emphasis: true,
  inlineCode: true,
  codeBlocks: 'unwrap',
  links: 'text',
  images: 'alt',
  blockquotes: true,
  lists: 'dash',
  horizontalRules: true,
  tables: 'readable',
  tidy: true,
};

/** One-click recipes surfaced in the UI. */
export type RecipeId = 'prose' | 'plain' | 'keepLinks' | 'keepLists';

export interface Recipe {
  label: string;
  options: MdOptions;
}

export const RECIPES: Record<RecipeId, Recipe> = {
  // Default: clean prose for email / Docs / LinkedIn. Lists become dashes,
  // links become their text, code blocks are unwrapped to plain lines.
  prose: { label: 'Clean prose', options: { ...DEFAULT_OPTIONS } },
  // Most aggressive plain-text: drop list markers and images entirely.
  plain: {
    label: 'Plain text',
    options: { ...DEFAULT_OPTIONS, lists: 'plain', images: 'remove' },
  },
  // Newsletter / reference use: keep the URL beside each link's text.
  keepLinks: {
    label: 'Keep link URLs',
    options: { ...DEFAULT_OPTIONS, links: 'text-url' },
  },
  // Chat paste: keep bullet shape (•) and the original code blocks.
  keepLists: {
    label: 'Keep list bullets',
    options: { ...DEFAULT_OPTIONS, lists: 'bullet', codeBlocks: 'keep' },
  },
};

export interface MdCounts {
  headings: number;
  emphasis: number;
  links: number;
  images: number;
  inlineCode: number;
  codeBlocks: number;
  blockquotes: number;
  listItems: number;
  tables: number;
  rules: number;
  total: number;
}

export interface MdResult {
  text: string;
  counts: MdCounts;
}

export interface MdStats {
  chars: number;
  words: number;
  lines: number;
}

const emptyCounts = (): MdCounts => ({
  headings: 0,
  emphasis: 0,
  links: 0,
  images: 0,
  inlineCode: 0,
  codeBlocks: 0,
  blockquotes: 0,
  listItems: 0,
  tables: 0,
  rules: 0,
  total: 0,
});

/* ------------------------------------------------------------------ *
 * Helpers                                                            *
 * ------------------------------------------------------------------ */

// Private sentinel for protected (code) regions. Uses a Private-Use-Area char
// that will never appear in normal pasted text, so restore is unambiguous.
const SENT = '\uF8FF';
const placeholder = (n: number) => `${SENT}${n}${SENT}`;

/** Live word/char/line counts for the before→after stats line. */
export function stats(text: string): MdStats {
  const trimmed = text.trim();
  return {
    chars: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text === '' ? 0 : text.split('\n').length,
  };
}

/** True when a line is a GFM table delimiter row (|---|:--:|---|). */
function isTableDelimiter(line: string): boolean {
  return /^[ \t]*\|?[ \t]*:?-{1,}:?[ \t]*(\|[ \t]*:?-{1,}:?[ \t]*)+\|?[ \t]*$/.test(line);
}

/** Split a table row into trimmed cells, ignoring the outer pipes. */
function tableCells(row: string): string[] {
  let s = row.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  // Split on unescaped pipes.
  return s.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
}

/* ------------------------------------------------------------------ *
 * Core transform                                                     *
 * ------------------------------------------------------------------ */

/**
 * Convert markdown `input` to clean prose per `opts`.
 * Returns the cleaned text and per-rule change counts.
 */
export function convert(input: string, opts: MdOptions = DEFAULT_OPTIONS): MdResult {
  const counts = emptyCounts();
  const protectedBlocks: string[] = [];
  const protect = (rendered: string): string => {
    const token = placeholder(protectedBlocks.length);
    protectedBlocks.push(rendered);
    return token;
  };

  let text = input.replace(/\r\n?/g, '\n');

  // --- Pass 1: fenced code blocks → placeholders (line scan). --------------
  {
    const lines = text.split('\n');
    const out: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const open = lines[i].match(/^[ \t]*(`{3,}|~{3,})(.*)$/);
      if (open) {
        const marker = open[1][0];
        const len = open[1].length;
        const inner: string[] = [];
        let j = i + 1;
        let closed = false;
        for (; j < lines.length; j++) {
          const close = lines[j].match(/^[ \t]*(`{3,}|~{3,})[ \t]*$/);
          if (close && close[1][0] === marker && close[1].length >= len) {
            closed = true;
            break;
          }
          inner.push(lines[j]);
        }
        counts.codeBlocks++;
        let rendered = '';
        if (opts.codeBlocks === 'unwrap') rendered = inner.join('\n');
        else if (opts.codeBlocks === 'keep')
          rendered = [lines[i], ...inner, ...(closed ? [lines[j]] : [])].join('\n');
        // 'remove' → rendered stays ''
        out.push(protect(rendered));
        i = closed ? j + 1 : j;
      } else {
        out.push(lines[i]);
        i++;
      }
    }
    text = out.join('\n');
  }

  // --- Pass 2: inline code spans → placeholders. ---------------------------
  text = text.replace(/`([^`\n]+)`/g, (m, code: string) => {
    if (opts.inlineCode) {
      counts.inlineCode++;
      return protect(code);
    }
    // Keep the backticks, but still protect contents from emphasis stripping.
    return protect(m);
  });

  // --- Pass 3: block-level, line by line (tables, headings, quotes, …). ----
  {
    const lines = text.split('\n');
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Tables: a header row followed by a delimiter row.
      if (
        opts.tables !== 'keep' &&
        line.includes('|') &&
        i + 1 < lines.length &&
        isTableDelimiter(lines[i + 1])
      ) {
        const rows: string[] = [line];
        let j = i + 1;
        // Consume the delimiter row + all following pipe rows.
        rows.push(lines[j]);
        j++;
        while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
          rows.push(lines[j]);
          j++;
        }
        counts.tables++;
        for (let r = 0; r < rows.length; r++) {
          if (r === 1) continue; // drop the delimiter row
          const cells = tableCells(rows[r]);
          if (opts.tables === 'readable') out.push(cells.join('\t'));
          else out.push(cells.join(' ')); // 'strip'
        }
        i = j - 1;
        continue;
      }

      // Horizontal rules.
      if (opts.horizontalRules && /^[ \t]{0,3}([-*_])([ \t]*\1){2,}[ \t]*$/.test(line)) {
        counts.rules++;
        out.push('');
        continue;
      }

      // Blockquotes: strip one-or-more leading `>` markers.
      if (opts.blockquotes && /^[ \t]{0,3}>/.test(line)) {
        let stripped = line;
        while (/^[ \t]*>[ \t]?/.test(stripped)) stripped = stripped.replace(/^[ \t]*>[ \t]?/, '');
        counts.blockquotes++;
        line = stripped;
      }

      // ATX headings.
      if (opts.headings) {
        const h = line.match(/^[ \t]{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/);
        if (h) {
          counts.headings++;
          line = h[2];
          out.push(line);
          continue;
        }
      }

      // Lists (unordered + ordered).
      if (opts.lists !== 'keep') {
        const ul = line.match(/^([ \t]*)([-*+])[ \t]+(.*)$/);
        const ol = line.match(/^([ \t]*)(\d+)[.)][ \t]+(.*)$/);
        if (ul) {
          counts.listItems++;
          const indent = ul[1];
          const body = ul[3];
          if (opts.lists === 'dash') line = `${indent}- ${body}`;
          else if (opts.lists === 'bullet') line = `${indent}• ${body}`;
          else line = `${indent}${body}`; // plain
        } else if (ol) {
          counts.listItems++;
          const indent = ol[1];
          const body = ol[3];
          // Only 'plain' drops the number; other modes normalise to "n. body".
          line = opts.lists === 'plain' ? `${indent}${body}` : `${indent}${ol[2]}. ${body}`;
        }
      }

      out.push(line);
    }
    text = out.join('\n');
  }

  // Reference-style link definitions: `[id]: https://… "title"` → drop.
  text = text.replace(/^[ \t]{0,3}\[[^\]]+\]:[ \t]*\S+.*$/gm, () => '');

  // --- Pass 4: inline images, links, emphasis (code already protected). ----
  // Images first (they share `[...]` with links).
  text = text.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (m, alt: string) => {
    if (opts.images === 'keep') return m;
    counts.images++;
    return opts.images === 'alt' ? alt : '';
  });

  if (opts.links !== 'keep') {
    // Inline links [text](url).
    text = text.replace(/\[([^\]]+)\]\(([^)\s]*)(?:[ \t]+"[^"]*")?\)/g, (_m, label: string, url: string) => {
      counts.links++;
      if (opts.links === 'text-url' && url) return `${label} (${url})`;
      return label;
    });
    // Reference-style links [text][id] / [text][] → text.
    text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, (_m, label: string) => {
      counts.links++;
      return label;
    });
  }

  if (opts.emphasis) {
    const patterns: RegExp[] = [
      /~~([^~]+)~~/g, // strikethrough
      /\*\*\*([^*]+)\*\*\*/g, // bold italic
      /___([^_]+)___/g,
      /\*\*([^*]+)\*\*/g, // bold
      /__([^_]+)__/g,
      /\*([^*\n]+)\*/g, // italic
      /(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, // underscore italic, not mid-word
    ];
    for (const re of patterns) {
      text = text.replace(re, (...args) => {
        // The underscore-italic pattern has a leading boundary capture group.
        if (re.source.startsWith('(^|')) {
          counts.emphasis++;
          return `${args[1]}${args[2]}`;
        }
        counts.emphasis++;
        return args[1];
      });
    }
    // Unescape backslash-escaped markdown punctuation: \* \_ \# …
    text = text.replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, '$1');
  }

  // --- Pass 5: tidy whitespace (before restoring code, so code is safe). ---
  if (opts.tidy) {
    text = text
      .replace(/([^\n ]) {2,}/g, '$1 ') // collapse mid-line space runs (keep indent)
      .replace(/[ \t]+$/gm, '') // trim trailing space
      .replace(/\n{3,}/g, '\n\n') // collapse blank-line runs
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
  }

  // --- Pass 6: restore protected code regions. -----------------------------
  text = text.replace(new RegExp(`${SENT}(\\d+)${SENT}`, 'g'), (_m, n: string) => protectedBlocks[+n] ?? '');

  counts.total =
    counts.headings +
    counts.emphasis +
    counts.links +
    counts.images +
    counts.inlineCode +
    counts.codeBlocks +
    counts.blockquotes +
    counts.listItems +
    counts.tables +
    counts.rules;

  return { text, counts };
}

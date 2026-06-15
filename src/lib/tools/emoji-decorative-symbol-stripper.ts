/**
 * Emoji & Decorative-Symbol Stripper - pure, framework-free engine.
 *
 * Design goals (see docs/tools/emoji-decorative-symbol-stripper.md):
 *  - Remove WHOLE emoji grapheme clusters (skin-tone, ZWJ families, flags,
 *    keycaps) - never leave orphaned ZWJ/VS16 or a bare `1`/`#` behind.
 *  - Remove the ornamental "AI bullet" glyphs LLMs sprinkle into lists/headings
 *    (✦ ▶ ➤ ❖ ● ✅ 🔹) - but be SELECTIVE: meaningful symbols (currency, math,
 *    ©/®/™, °) are kept by default so we never over-strip like naive tools do.
 *  - Deterministic string work. 100% in-browser. Nothing here touches the
 *    network, the DOM, or any npm package.
 */

/* ------------------------------------------------------------------ *
 * Options & result contracts (mirrors cleaner.ts CleanResult.counts) *
 * ------------------------------------------------------------------ */

/** What a stripped decorative bullet should be replaced with. */
export type BulletReplacement = '' | '- ' | '* ' | '• ';

export interface StripOptions {
  /** Remove emoji (full sequences: skin-tone, ZWJ, flags, keycaps). */
  emoji: boolean;
  /** Remove decorative symbols / dingbats / geometric bullets. */
  decorative: boolean;
  /**
   * "List bullets only" mode: when true, a decorative glyph is removed ONLY
   * when it sits at the start of a line (the LLM-bullet case). Inline
   * occurrences mid-sentence are left untouched.
   */
  bulletsOnly: boolean;
  /** What a stripped *leading* bullet becomes (only used in bulletsOnly mode). */
  bulletReplacement: BulletReplacement;
  /** Keep currency symbols ($ € £ ¥ ¢ etc.) - on by default. */
  keepCurrency: boolean;
  /** Keep math / sign symbols (° ± × ÷ ≈ ≤ ≥ µ → …) - on by default. */
  keepMath: boolean;
  /** Keep legal symbols (© ® ™ § ¶) - on by default. */
  keepLegal: boolean;
  /** Collapse double spaces / trim dangling whitespace left behind. */
  tidyWhitespace: boolean;
}

export const DEFAULT_OPTIONS: StripOptions = {
  emoji: true,
  decorative: true,
  bulletsOnly: false,
  bulletReplacement: '',
  keepCurrency: true,
  keepMath: true,
  keepLegal: true,
  tidyWhitespace: true,
};

/** Named presets surfaced in the UI (spec §5.3). */
export type PresetName = 'ai-bullets' | 'aggressive' | 'emoji-only';

export const PRESETS: Record<PresetName, Partial<StripOptions>> = {
  // Marketer default: kill decorative bullets + emoji, keep real symbols.
  'ai-bullets': { emoji: true, decorative: true, bulletsOnly: false, keepCurrency: true, keepMath: true, keepLegal: true },
  // Dev / "scrub everything decorative": still respects safe-keep classes.
  'aggressive': { emoji: true, decorative: true, bulletsOnly: false, keepCurrency: false, keepMath: false, keepLegal: false },
  // Formal-email user: only emoji, leave all symbols alone.
  'emoji-only': { emoji: true, decorative: false, bulletsOnly: false },
};

export interface StripCounts {
  emoji: number;
  decorative: number;
  bullets: number;
  total: number;
}

export interface StripResult {
  text: string;
  counts: StripCounts;
}

/** One row of the "what we removed" inventory table (spec §5.8). */
export interface InventoryItem {
  /** The user-perceived glyph (a full grapheme cluster). */
  glyph: string;
  /** "U+1F539" style codepoint label (first codepoint for sequences). */
  codepoint: string;
  /** Best-effort human name (e.g. "WHITE HEAVY CHECK MARK"), if known. */
  name: string;
  /** How many times this exact glyph appeared. */
  count: number;
  /** Whether it was classed as emoji vs decorative symbol. */
  kind: 'emoji' | 'decorative';
}

/* ------------------------------------------------------------------ *
 * Curated character data                                             *
 * ------------------------------------------------------------------ */

// Explicit list of ornamental bullet / star / arrow glyphs LLMs use as bullets.
// Kept explicit (not just ranges) so the set is auditable and predictable.
const BULLET_GLYPHS = '•‣◦▪▫▶►◄◀★☆✦✧✪✯✱❖➤➔➢➣➥➦➧➨◆◇○●◌□■☑☐❯❮»«';

// Currency / math / legal symbols that the keep-toggles gate. They live OUTSIDE
// the decorative ranges below, so they must be matched explicitly for isKept()
// to have anything to gate - otherwise the toggles & "Strip everything" preset
// would be no-ops for them. With the toggles ON (default) isKept() keeps them;
// with the toggles OFF they are stripped as decoration.
const GATED_SYMBOLS = '$¢£¤¥₠-₿°±×÷µ−≈≠≤≥∞←-⇒√∑∏©®™§¶℠';

// Decorative ranges we treat as "AI decoration" when `decorative` is on.
//  - Dingbats                U+2700–27BF  (✂ ✅ ✔ ✦ ➤ …)
//  - Misc Symbols & Arrows    U+2B00–2BFF  (⬅ ⭐ ⬛ …)
//  - Geometric Shapes         U+25A0–25FF  (■ ▶ ● ◆ …)
//  - Ornamental Dingbats      U+1F650–1F67F
// Plus the explicit bullet list and the keep-gated symbols above. The gated
// symbols are reintroduced via isKept() in the decorative pass. Built once.
const DECORATIVE_RE = new RegExp(
  '[' +
    '\\u2700-\\u27BF' +
    '\\u2B00-\\u2BFF' +
    '\\u25A0-\\u25FF' +
    escapeForClass(BULLET_GLYPHS) +
    GATED_SYMBOLS +
  ']' +
  '|[\\u{1F650}-\\u{1F67F}]',
  'gu',
);

// Safe-keep classes. These are subtracted from the decorative match so naive
// over-stripping (the #1 competitor failure) never happens.
const KEEP = {
  // $ ¢ £ ¤ ¥ + the Currency Symbols block U+20A0–20BF.
  currency: /[$¢-¥₠-₿]/u,
  // Degree, plus-minus, multiply, divide, micro, common math comparators &
  // the simple content arrows used in technical prose (→ ← ↔ ⇒).
  math: /[°±×÷µ−≈≠≤≥∞←-⇒√∑∏]/u,
  // Copyright, registered, trademark, section, pilcrow, service mark.
  legal: /[©®™§¶℠]/u,
};

/** A small lookup of common AI-tell glyph names so the inventory reads nicely. */
const KNOWN_NAMES: Record<string, string> = {
  '✅': 'WHITE HEAVY CHECK MARK',
  '✔': 'HEAVY CHECK MARK',
  '✔️': 'HEAVY CHECK MARK',
  '☑': 'BALLOT BOX WITH CHECK',
  '✦': 'BLACK FOUR POINTED STAR',
  '✧': 'WHITE FOUR POINTED STAR',
  '❖': 'BLACK DIAMOND MINUS WHITE X',
  '➤': 'BLACK RIGHTWARDS ARROWHEAD',
  '▶': 'BLACK RIGHT-POINTING TRIANGLE',
  '►': 'BLACK RIGHT-POINTING POINTER',
  '●': 'BLACK CIRCLE',
  '○': 'WHITE CIRCLE',
  '◆': 'BLACK DIAMOND',
  '■': 'BLACK SQUARE',
  '★': 'BLACK STAR',
  '☆': 'WHITE STAR',
  '•': 'BULLET',
  '🔹': 'SMALL BLUE DIAMOND',
  '🔸': 'SMALL ORANGE DIAMOND',
  '🚀': 'ROCKET',
  '✨': 'SPARKLES',
  '🔥': 'FIRE',
  '👉': 'WHITE RIGHT POINTING BACKHAND INDEX',
  '💡': 'LIGHT BULB',
  '⚠️': 'WARNING SIGN',
  '⚠': 'WARNING SIGN',
};

/* ------------------------------------------------------------------ *
 * Emoji matching (sequence-aware, with graceful fallback)            *
 * ------------------------------------------------------------------ */

/**
 * Build the best available emoji matcher for this runtime.
 *
 *  1. Prefer native `\p{RGI_Emoji}` with the `v` flag (ES2024) - it matches
 *     WHOLE RGI emoji sequences (families, skin tones, flags, keycaps), which
 *     is exactly what we need to avoid leaving fragments.
 *  2. If unavailable (older engine), fall back to a hand-built sequence-aware
 *     pattern: pictographic base + optional VS16 + optional skin-tone, then any
 *     number of ZWJ-joined continuations, OR a regional-indicator flag pair,
 *     OR a keycap sequence. This is a no-dependency approximation that still
 *     consumes full clusters instead of single code points.
 *
 * We never import an emoji-regex package (would add a dependency / break the
 * build); the fallback is intentionally self-contained.
 */
function buildEmojiRegex(): RegExp {
  try {
    // Feature-detect the `v` flag + RGI_Emoji property. Throws on old engines.
    const native = new RegExp('\\p{RGI_Emoji}', 'gv');
    // Sanity check it actually matches a known sequence.
    if ('👨‍👩‍👧'.match(native)) return new RegExp('\\p{RGI_Emoji}', 'gv');
  } catch {
    /* fall through to the manual fallback */
  }

  // Fallback building blocks (all with the `u` flag).
  const VS16 = '\\uFE0F';
  const ZWJ = '\\u200D';
  const KEYCAP = '\\u20E3';
  const SKIN = '[\\u{1F3FB}-\\u{1F3FF}]';
  // A pictographic "base". We deliberately exclude bare ASCII digits/# /* here
  // unless they form a keycap, to avoid the classic \p{Emoji} digit trap.
  const PICTO = '\\p{Extended_Pictographic}';
  const FLAG = '[\\u{1F1E6}-\\u{1F1FF}]{2}'; // regional-indicator pair
  const KEYCAP_SEQ = `[0-9#*]${VS16}?${KEYCAP}`;
  const UNIT = `${PICTO}${VS16}?(?:${SKIN})?`;
  const SEQUENCE = `${UNIT}(?:${ZWJ}${UNIT})*`;

  return new RegExp(`${FLAG}|${KEYCAP_SEQ}|${SEQUENCE}`, 'gu');
}

// Built once at module load (cheap, deterministic).
const EMOJI_RE = buildEmojiRegex();

/* ------------------------------------------------------------------ *
 * Helpers                                                            *
 * ------------------------------------------------------------------ */

/** Escape characters that are special inside a regex character class. */
function escapeForClass(s: string): string {
  return s.replace(/[\\\]\^\-]/g, '\\$&');
}

/** Is a single code point one we must KEEP given the safe-list options? */
function isKept(ch: string, opts: StripOptions): boolean {
  if (opts.keepCurrency && KEEP.currency.test(ch)) return true;
  if (opts.keepMath && KEEP.math.test(ch)) return true;
  if (opts.keepLegal && KEEP.legal.test(ch)) return true;
  return false;
}

/** "U+1F539" label for the FIRST code point of a glyph (handles surrogates). */
export function toCodepoint(glyph: string): string {
  const cp = glyph.codePointAt(0);
  if (cp == null) return '';
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

/** Best-effort human name for a glyph (known AI-tells; else generic). */
export function glyphName(glyph: string): string {
  if (KNOWN_NAMES[glyph]) return KNOWN_NAMES[glyph];
  // Strip a trailing VS16 and retry (so "✔️" maps to "✔").
  const bare = glyph.replace(/️$/, '');
  if (bare !== glyph && KNOWN_NAMES[bare]) return KNOWN_NAMES[bare];
  return `Symbol ${toCodepoint(glyph)}`;
}

/* ------------------------------------------------------------------ *
 * Core transform                                                     *
 * ------------------------------------------------------------------ */

/**
 * Strip emoji + decorative symbols from `input` per `opts`.
 * Returns the cleaned text and per-pass removal counts.
 */
export function strip(input: string, opts: StripOptions = DEFAULT_OPTIONS): StripResult {
  let text = input;
  const counts: StripCounts = { emoji: 0, decorative: 0, bullets: 0, total: 0 };

  // --- Pass 1: decorative LEADING bullets (only in bullets-only mode). ------
  // Runs first so the replacement (e.g. "- ") is preserved and not re-matched
  // by the general decorative pass.
  if (opts.decorative && opts.bulletsOnly) {
    // Match: line start, optional indent, ONE decorative bullet glyph, then
    // the trailing space(s). Replace with the chosen prefix.
    const bulletClass = '[' + escapeForClass(BULLET_GLYPHS) +
      '\\u2700-\\u27BF\\u25A0-\\u25FF]';
    const leadRe = new RegExp(`^([ \\t]*)${bulletClass}[ \\t]+`, 'gmu');
    text = text.replace(leadRe, (_m, indent: string) => {
      counts.bullets++;
      return indent + opts.bulletReplacement;
    });
  }

  // --- Pass 2: emoji (whole sequences). ------------------------------------
  if (opts.emoji) {
    text = text.replace(EMOJI_RE, (m) => {
      // Guard: the fallback can match a lone pictographic that is actually a
      // safe-kept symbol (rare). Respect the keep-list for single code points.
      // Strip a trailing VS16 first so ©️ ®️ ™️ (matched as base+U+FE0F by
      // RGI_Emoji) still hit the keep-list when their toggle is on.
      const core = m.replace(/️$/, '');
      if ([...core].length === 1 && isKept(core, opts)) return m;
      counts.emoji++;
      return '';
    });
  }

  // --- Pass 3: decorative symbols (inline + non-bullet), with safe-keep. ----
  if (opts.decorative && !opts.bulletsOnly) {
    text = text.replace(DECORATIVE_RE, (m) => {
      if (isKept(m, opts)) return m; // currency/math/legal survive
      counts.decorative++;
      return '';
    });
  }

  // --- Pass 4: whitespace tidy. --------------------------------------------
  if (opts.tidyWhitespace) {
    text = text
      // collapse double spaces left where an inline glyph was removed
      .replace(/[ \t]{2,}/g, ' ')
      // trim trailing spaces per line
      .replace(/[ \t]+$/gm, '')
      // collapse 3+ newlines (e.g. lines that became empty) to a max of 2
      .replace(/\n{3,}/g, '\n\n');
  }

  counts.total = counts.emoji + counts.decorative + counts.bullets;
  return { text, counts };
}

/* ------------------------------------------------------------------ *
 * Inventory (shows-its-work table)                                   *
 * ------------------------------------------------------------------ */

/**
 * Build a per-glyph inventory of everything `strip()` WOULD remove from the
 * given text under `opts`. Used for the transparency table and the AI-tell
 * meter. Aggregates identical glyphs and sorts by frequency.
 */
export function inventory(input: string, opts: StripOptions = DEFAULT_OPTIONS): InventoryItem[] {
  const map = new Map<string, InventoryItem>();

  const add = (glyph: string, kind: 'emoji' | 'decorative') => {
    const existing = map.get(glyph);
    if (existing) {
      existing.count++;
    } else {
      map.set(glyph, {
        glyph,
        codepoint: toCodepoint(glyph),
        name: glyphName(glyph),
        count: 1,
        kind,
      });
    }
  };

  // Run the SAME ordered passes as strip() against a mutating copy, so a glyph
  // consumed by the emoji pass (e.g. ✅, which is also pictographic) is not then
  // re-counted by the decorative pass - the inventory mirrors reality exactly.
  let work = input;
  if (opts.emoji) {
    work = work.replace(EMOJI_RE, (g) => {
      const core = g.replace(/️$/, '');
      if ([...core].length === 1 && isKept(core, opts)) return g;
      add(g, 'emoji');
      return '';
    });
  }
  if (opts.decorative) {
    work = work.replace(DECORATIVE_RE, (g) => {
      if (isKept(g, opts)) return g;
      add(g, 'decorative');
      return '';
    });
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Lightweight "how AI-flavored was this?" descriptor (spec §5.14).
 * Returns a short human label based on how much decoration was found.
 */
export function flavorLabel(counts: StripCounts): string {
  const t = counts.total;
  if (t === 0) return 'Clean - no emoji or decorative symbols found.';
  if (t <= 3) return 'Light - a few decorative symbols.';
  if (t <= 12) return 'Some AI formatting - noticeable emoji & bullets.';
  return 'Heavy AI formatting - lots of emoji & decorative bullets.';
}

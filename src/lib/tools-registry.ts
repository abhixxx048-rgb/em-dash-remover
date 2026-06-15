// Single source of truth for the tool suite. Every tool page, the tools hub,
// and the RelatedTools component read from here so slugs/titles/icons stay in sync.

export type ToolCategory = 'clean' | 'analyze' | 'power';

export interface Tool {
  slug: string;
  href: string;
  icon: string;
  title: string;
  desc: string;
  category: ToolCategory;
}

// Helper so we never desync slug and href.
const t = (
  slug: string,
  icon: string,
  title: string,
  desc: string,
  category: ToolCategory
): Tool => ({ slug, href: '/tools/' + slug, icon, title, desc, category });

export const TOOLS: Tool[] = [
  // Clean & convert
  t('invisible-watermark-character-inspector', '👻', 'Invisible Character Inspector', 'See and strip hidden zero-width, watermark and bidi characters.', 'clean'),
  t('word-reading-time-counter', '🔢', 'Word & Reading-Time Counter', 'Live word, character, sentence counts, reading time and platform limits.', 'clean'),
  t('before-after-diff-viewer', '🔬', 'Before/After Diff Viewer', 'Compare original vs cleaned text with per-change accept/reject.', 'clean'),
  t('readability-grade-level-scorer', '📊', 'Readability Scorer', 'Flesch, Flesch-Kincaid, Gunning Fog grade levels and hard sentences.', 'clean'),
  t('emoji-decorative-symbol-stripper', '🚫', 'Emoji & Symbol Stripper', 'Remove emoji and decorative bullets while keeping meaningful symbols.', 'clean'),
  t('case-converter', '🔠', 'Case Converter', 'UPPER, lower, Sentence, Title (AP/Chicago) and developer cases.', 'clean'),
  t('whitespace-line-break-reflow-fixer', '↹', 'Whitespace & Reflow Fixer', 'Collapse spaces and unwrap hard-wrapped PDF/email text into paragraphs.', 'clean'),
  t('paste-from-word-docs-cleaner', '📋', 'Paste-from-Word Cleaner', 'Strip Word/Docs formatting soup, keep real paragraphs.', 'clean'),
  t('straight-to-curly-quotes-converter', '“”', 'Straight-to-Curly Quotes', 'Add correct curly quotes, apostrophes and proper dashes for publishing.', 'clean'),
  t('sentence-splitter', '✂️', 'Sentence Splitter', 'One sentence per line with a cadence chart for auditing rhythm.', 'clean'),

  // Analyze & improve
  t('human-voice-ai-tell-report', '🫀', 'Human-Voice / AI-Tell Report', 'Flag cadence, clichés and patterns that make a draft read like AI.', 'analyze'),
  t('homoglyph-confusables-detector', '🕵️', 'Homoglyph Detector', 'Find Cyrillic/Greek look-alike characters hiding in Latin text.', 'analyze'),
  t('passive-voice-weasel-word-highlighter', '🎯', 'Passive-Voice Highlighter', 'Highlight passive voice, weak adverbs and weasel words.', 'analyze'),
  t('read-aloud-proofreader', '🔊', 'Read-Aloud Proofreader', 'Hear your text read aloud to catch run-ons and missing words.', 'analyze'),
  t('local-voice-style-memory', '🧠', 'Voice / Style Memory', 'Build a private style profile and flag where a draft stops sounding like you.', 'analyze'),

  // Power tools & apps
  t('bulk-multi-file-cleaner', '🗂️', 'Bulk / Multi-File Cleaner', 'Drop multiple files, clean each in-browser, download the results.', 'power'),
  t('on-device-ai-rewrite', '✨', 'On-Device AI Rewrite', 'One-click tone/length rewrite via your browser’s built-in AI.', 'power'),
  t('webgpu-webllm-rewrite', '⚡', 'WebGPU Rewrite', 'Experimental on-device rewrite that never uploads your text.', 'power'),
  t('browser-extension', '🧩', 'Browser Extension', 'Clean em dashes and AI tells in place, anywhere you type.', 'power'),
  t('obsidian-plugin', '🔮', 'Obsidian Plugin', 'Clean AI-chat pastes automatically inside your Obsidian vault.', 'power'),
];

// The core cleaner lives at the homepage, not under /tools. It's the hub of the
// suite, so it's surfaced as a related item for (almost) every tool.
export const CORE: Tool = {
  slug: 'core',
  href: '/',
  icon: '-',
  title: 'Em Dash Remover',
  desc: 'Remove em dashes, smart quotes & AI tells from your text.',
  category: 'clean',
};

const BY_SLUG: Record<string, Tool> = Object.fromEntries(
  [CORE, ...TOOLS].map((tool) => [tool.slug, tool])
);

// Hand-authored workflow neighbours: ordered by how naturally a user moves from
// one tool to the next. CORE is appended for non-core tools when there's room.
const RELATED: Record<string, string[]> = {
  // Core cleaner → the most common follow-ups after cleaning text.
  core: [
    'before-after-diff-viewer',
    'invisible-watermark-character-inspector',
    'human-voice-ai-tell-report',
    'straight-to-curly-quotes-converter',
  ],

  // Clean & convert
  'invisible-watermark-character-inspector': [
    'homoglyph-confusables-detector',
    'paste-from-word-docs-cleaner',
    'emoji-decorative-symbol-stripper',
  ],
  'word-reading-time-counter': [
    'readability-grade-level-scorer',
    'sentence-splitter',
    'human-voice-ai-tell-report',
  ],
  'before-after-diff-viewer': [
    'paste-from-word-docs-cleaner',
    'whitespace-line-break-reflow-fixer',
    'bulk-multi-file-cleaner',
  ],
  'readability-grade-level-scorer': [
    'word-reading-time-counter',
    'sentence-splitter',
    'passive-voice-weasel-word-highlighter',
  ],
  'emoji-decorative-symbol-stripper': [
    'invisible-watermark-character-inspector',
    'paste-from-word-docs-cleaner',
    'human-voice-ai-tell-report',
  ],
  'case-converter': [
    'straight-to-curly-quotes-converter',
    'whitespace-line-break-reflow-fixer',
    'paste-from-word-docs-cleaner',
  ],
  'whitespace-line-break-reflow-fixer': [
    'paste-from-word-docs-cleaner',
    'before-after-diff-viewer',
    'sentence-splitter',
  ],
  'paste-from-word-docs-cleaner': [
    'invisible-watermark-character-inspector',
    'whitespace-line-break-reflow-fixer',
    'straight-to-curly-quotes-converter',
  ],
  'straight-to-curly-quotes-converter': [
    'case-converter',
    'paste-from-word-docs-cleaner',
    'before-after-diff-viewer',
  ],
  'sentence-splitter': [
    'readability-grade-level-scorer',
    'human-voice-ai-tell-report',
    'word-reading-time-counter',
  ],

  // Analyze & improve
  'human-voice-ai-tell-report': [
    'passive-voice-weasel-word-highlighter',
    'sentence-splitter',
    'local-voice-style-memory',
  ],
  'homoglyph-confusables-detector': [
    'invisible-watermark-character-inspector',
    'paste-from-word-docs-cleaner',
    'emoji-decorative-symbol-stripper',
  ],
  'passive-voice-weasel-word-highlighter': [
    'human-voice-ai-tell-report',
    'readability-grade-level-scorer',
    'read-aloud-proofreader',
  ],
  'read-aloud-proofreader': [
    'sentence-splitter',
    'passive-voice-weasel-word-highlighter',
    'readability-grade-level-scorer',
  ],
  'local-voice-style-memory': [
    'human-voice-ai-tell-report',
    'passive-voice-weasel-word-highlighter',
    'on-device-ai-rewrite',
  ],

  // Power tools & apps
  'bulk-multi-file-cleaner': [
    'before-after-diff-viewer',
    'paste-from-word-docs-cleaner',
    'invisible-watermark-character-inspector',
  ],
  'on-device-ai-rewrite': [
    'webgpu-webllm-rewrite',
    'human-voice-ai-tell-report',
    'local-voice-style-memory',
  ],
  'webgpu-webllm-rewrite': [
    'on-device-ai-rewrite',
    'human-voice-ai-tell-report',
    'local-voice-style-memory',
  ],
  'browser-extension': [
    'obsidian-plugin',
    'on-device-ai-rewrite',
    'invisible-watermark-character-inspector',
  ],
  'obsidian-plugin': [
    'browser-extension',
    'paste-from-word-docs-cleaner',
    'on-device-ai-rewrite',
  ],
};

/**
 * Curated, intent-sensible related tools for a given slug.
 * Order: hand-authored neighbours → CORE cleaner (for non-core tools) →
 * same-category fallbacks. Never includes the tool itself; deduped; capped at n.
 */
export function relatedFor(slug: string, n = 4): Tool[] {
  const self = BY_SLUG[slug];
  const out: Tool[] = [];
  const seen = new Set<string>([slug]);

  const push = (s: string) => {
    if (out.length >= n || seen.has(s)) return;
    const tool = BY_SLUG[s];
    if (!tool) return;
    seen.add(s);
    out.push(tool);
  };

  // 1. Hand-authored neighbours.
  for (const s of RELATED[slug] ?? []) push(s);

  // 2. Always surface the core cleaner for non-core tools when there's room.
  if (slug !== 'core') push('core');

  // 3. Fall back to same-category tools to fill any remaining slots.
  if (out.length < n && self) {
    for (const tool of TOOLS) {
      if (tool.category === self.category) push(tool.slug);
    }
  }

  return out.slice(0, n);
}

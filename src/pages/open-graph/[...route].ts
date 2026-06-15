import { OGImageRoute } from 'astro-og-canvas';

// Build-time generated 1200×630 OG images, one per page. Tool pages use keys of
// the form `tools-<slug>` (see Base.astro, which maps /tools/<slug> → that key).
const pages = {
  index: { title: 'Em Dash Remover', description: 'Free AI text cleaner - remove em dashes, smart quotes & invisible characters. 100% in your browser.' },
  about: { title: 'About Em Dash Remover', description: 'A free, privacy-first, grammar-aware AI text cleaner.' },
  contact: { title: 'Contact Us', description: 'Feedback, bugs, and partnership enquiries.' },
  terms: { title: 'Terms & Conditions', description: 'Terms of use for Em Dash Remover.' },
  privacy: { title: 'Privacy Policy', description: 'Your text never leaves your browser.' },

  // Tool hub + individual tools.
  tools: { title: 'Free Text Tools', description: '20 free tools to clean, convert & improve writing - 100% in your browser.' },
  'tools-invisible-watermark-character-inspector': { title: 'Invisible Character Inspector', description: 'See & strip hidden zero-width, watermark and bidi characters.' },
  'tools-word-reading-time-counter': { title: 'Word & Reading-Time Counter', description: 'Live word, character & sentence counts, reading time and platform limits.' },
  'tools-before-after-diff-viewer': { title: 'Before/After Diff Viewer', description: 'Compare original vs cleaned text with per-change accept/reject.' },
  'tools-readability-grade-level-scorer': { title: 'Readability Scorer', description: 'Flesch-Kincaid grade levels and hard-sentence highlighting.' },
  'tools-emoji-decorative-symbol-stripper': { title: 'Emoji & Symbol Stripper', description: 'Remove emoji and decorative bullets, keep meaningful symbols.' },
  'tools-case-converter': { title: 'Case Converter', description: 'UPPER, lower, Sentence, Title (AP/Chicago) and developer cases.' },
  'tools-whitespace-line-break-reflow-fixer': { title: 'Whitespace & Reflow Fixer', description: 'Collapse spaces and unwrap hard-wrapped PDF/email text.' },
  'tools-paste-from-word-docs-cleaner': { title: 'Paste-from-Word Cleaner', description: 'Strip Word/Docs formatting soup, keep real paragraphs.' },
  'tools-straight-to-curly-quotes-converter': { title: 'Straight-to-Curly Quotes', description: 'Add correct curly quotes, apostrophes and proper dashes.' },
  'tools-sentence-splitter': { title: 'Sentence Splitter', description: 'One sentence per line with a cadence chart for auditing rhythm.' },
  'tools-human-voice-ai-tell-report': { title: 'Human-Voice / AI-Tell Report', description: 'Flag the cadence, clichés and patterns that read like AI.' },
  'tools-homoglyph-confusables-detector': { title: 'Homoglyph Detector', description: 'Find Cyrillic & Greek look-alike characters hiding in Latin text.' },
  'tools-passive-voice-weasel-word-highlighter': { title: 'Passive-Voice Highlighter', description: 'Highlight passive voice, weak adverbs and weasel words.' },
  'tools-read-aloud-proofreader': { title: 'Read-Aloud Proofreader', description: 'Hear your text read aloud to catch run-ons and missing words.' },
  'tools-local-voice-style-memory': { title: 'Voice / Style Memory', description: 'A private style profile that flags where a draft stops sounding like you.' },
  'tools-bulk-multi-file-cleaner': { title: 'Bulk / Multi-File Cleaner', description: 'Drop multiple files, clean each in-browser, download the results.' },
  'tools-on-device-ai-rewrite': { title: 'On-Device AI Rewrite', description: 'One-click tone/length rewrite via your browser’s built-in AI.' },
  'tools-webgpu-webllm-rewrite': { title: 'WebGPU Rewrite', description: 'Experimental on-device rewrite that never uploads your text.' },
  'tools-browser-extension': { title: 'Browser Extension', description: 'Clean em dashes and AI tells in place, anywhere you type.' },
  'tools-obsidian-plugin': { title: 'Obsidian Plugin', description: 'Clean AI-chat pastes automatically inside your Obsidian vault.' },
};

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[15, 16, 26], [40, 32, 90]],
    border: { color: [109, 94, 252], width: 16, side: 'inline-start' },
    padding: 80,
    font: {
      title: { color: [255, 255, 255], size: 72, weight: 'Bold' },
      description: { color: [200, 200, 215], size: 32 },
    },
  }),
});

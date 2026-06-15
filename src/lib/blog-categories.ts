// Curated blog taxonomy. We deliberately do NOT generate a tag page per
// frontmatter keyword — those keywords are unique long-tail phrases, so that
// produced ~135 one-post "doorway" pages (thin-content risk). Instead each post
// is assigned to a few real topics below, so every /blog/tag/<slug> page is a
// genuine multi-post hub. Add new posts to the relevant `ids` arrays.

export interface BlogCategory {
  slug: string;
  label: string;
  description: string;
  ids: string[]; // blog collection ids (filename without .md)
}

export const CATEGORIES: BlogCategory[] = [
  {
    slug: 'ai-writing',
    label: 'AI Writing & ChatGPT',
    description: 'Why AI text reads the way it does, the tells to look for, and how to edit ChatGPT, Claude and Gemini output back into your own voice.',
    ids: [
      'why-chatgpt-uses-em-dashes',
      'signs-of-ai-writing',
      'openai-fixed-the-em-dash',
      'does-removing-em-dashes-bypass-ai-detection',
      'passive-voice-as-an-ai-tell',
      'what-is-a-writing-voice-fingerprint',
      'private-ai-rewrite-in-your-browser',
      'in-browser-llm-with-webgpu',
      'clean-ai-text-anywhere-browser-extension',
    ],
  },
  {
    slug: 'em-dashes-punctuation',
    label: 'Em Dashes & Punctuation',
    description: 'The em dash explained — when to use it, how to type it, how it differs from the en dash and hyphen, and how to remove it.',
    ids: [
      'em-dash-punctuation-rules',
      'em-dash-vs-en-dash-vs-hyphen',
      'how-to-remove-em-dashes-in-word-and-google-docs',
      'how-to-type-an-em-dash',
      'why-chatgpt-uses-em-dashes',
      'openai-fixed-the-em-dash',
    ],
  },
  {
    slug: 'invisible-characters',
    label: 'Invisible & Hidden Characters',
    description: 'Zero-width spaces, watermark characters, homoglyphs and other hidden Unicode that sneaks into copied and AI-generated text.',
    ids: [
      'what-is-a-zero-width-character',
      'homoglyph-attacks-explained',
      'does-removing-em-dashes-bypass-ai-detection',
      'why-pasted-text-has-weird-formatting',
    ],
  },
  {
    slug: 'cleaning-formatting',
    label: 'Cleaning & Formatting Text',
    description: 'Fix messy text — strip Word/Docs formatting, repair PDF line breaks, remove emoji, compare versions and clean many files at once.',
    ids: [
      'how-to-remove-em-dashes-in-word-and-google-docs',
      'how-to-compare-two-versions-of-text',
      'how-to-remove-emojis-from-text',
      'how-to-fix-text-copied-from-a-pdf',
      'why-pasted-text-has-weird-formatting',
      'how-to-clean-multiple-files-at-once',
      'clean-ai-text-anywhere-browser-extension',
      'clean-ai-paste-in-obsidian',
    ],
  },
  {
    slug: 'readability-style',
    label: 'Readability & Writing Style',
    description: 'Make writing clearer — readability scores, sentence cadence, passive voice and keeping a consistent human voice.',
    ids: [
      'what-is-a-good-readability-score',
      'how-to-audit-sentence-cadence',
      'passive-voice-as-an-ai-tell',
      'proofreading-by-reading-aloud',
      'what-is-a-writing-voice-fingerprint',
    ],
  },
  {
    slug: 'typography-quotes',
    label: 'Typography & Quotes',
    description: 'Smart quotes, curly vs straight quotes, title case rules and the small typographic details that make writing look polished.',
    ids: [
      'how-to-type-an-em-dash',
      'how-to-remove-emojis-from-text',
      'title-case-rules-ap-vs-chicago',
      'curly-quotes-vs-straight-quotes',
    ],
  },
  {
    slug: 'privacy-on-device',
    label: 'Privacy & On-Device AI',
    description: 'Editing and rewriting that never leaves your browser — on-device AI, WebGPU and local-first tools that keep your text private.',
    ids: [
      'private-ai-rewrite-in-your-browser',
      'in-browser-llm-with-webgpu',
      'clean-ai-paste-in-obsidian',
      'what-is-a-zero-width-character',
    ],
  },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

/** Topics a given post id belongs to (for showing topic chips on a post). */
export const categoriesForPost = (id: string) => CATEGORIES.filter((c) => c.ids.includes(id));

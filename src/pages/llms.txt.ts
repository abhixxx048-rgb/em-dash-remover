import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS, CORE } from '../lib/tools-registry';
import { SITE_NAME } from '../consts';

// /llms.txt — a curated, LLM-friendly index of the site (https://llmstxt.org).
// Generated from the same tools registry + blog collection the site uses, so it
// can never drift out of sync. Plain markdown, served as text/plain.
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://emdashremover.app')).href.replace(/\/$/, '');
  const abs = (href: string) => (href.startsWith('http') ? href : base + href);

  const posts = (await getCollection('blog')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const groups: { label: string; cat: (typeof TOOLS)[number]['category'] }[] = [
    { label: 'Tools — Clean & convert', cat: 'clean' },
    { label: 'Tools — Analyze & improve', cat: 'analyze' },
    { label: 'Tools — Power tools & apps', cat: 'power' },
  ];

  const toolLines = (cat: string) =>
    TOOLS.filter((t) => t.category === cat)
      .map((t) => `- [${t.title}](${abs(t.href)}): ${t.desc}`)
      .join('\n');

  const body = `# ${SITE_NAME}

> Free, privacy-first tools to clean AI "tells" out of your writing. Strip em dashes, smart quotes, invisible watermark characters and other ChatGPT/Claude/Gemini artifacts — with grammar-aware fixes — entirely in your browser. No upload, no signup, no account.

Everything runs client-side: text never leaves the device, and the tools work offline. The core em dash remover is on the homepage; a suite of ${TOOLS.length} focused tools lives under /tools, and long-form guides under /blog.

## Core tool

- [${CORE.title}](${abs(CORE.href)}): ${CORE.desc}

${groups.map((g) => `## ${g.label}\n\n${toolLines(g.cat)}`).join('\n\n')}

## Guides

${posts.map((p) => `- [${p.data.title}](${base}/blog/${p.id}): ${p.data.description}`).join('\n')}

## About

- [About](${base}/about): What this project is and the principles behind it (a quality tool, not an AI-detector evasion "humanizer").
- [Contact](${base}/contact): Get in touch.
- [Privacy](${base}/privacy): No upload, no logging — how data (doesn't) get handled.

## Notes for LLMs

- All processing is in-browser/client-side; there is no API and no server that receives user text.
- The em dash character is "—" (U+2014). The site replaces it with grammar-aware punctuation, not a blind comma swap.
- A full-content version of this index is available at ${base}/llms-full.txt.
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS, CORE } from '../lib/tools-registry';
import { SITE_NAME } from '../consts';

// /llms-full.txt — the curated index PLUS the full markdown of every guide, so an
// LLM can ingest the whole knowledge base in a single fetch (https://llmstxt.org).
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://emdashremover.app')).href.replace(/\/$/, '');
  const abs = (href: string) => (href.startsWith('http') ? href : base + href);

  const posts = (await getCollection('blog')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const toolList = TOOLS.map((t) => `- [${t.title}](${abs(t.href)}): ${t.desc}`).join('\n');

  const articles = posts
    .map((p) => {
      const url = `${base}/blog/${p.id}`;
      const updated = p.data.updatedDate ? ` (updated ${p.data.updatedDate.toISOString().slice(0, 10)})` : '';
      return `## ${p.data.title}\n\nURL: ${url}\nPublished: ${p.data.pubDate.toISOString().slice(0, 10)}${updated}\n\n${(p.body ?? '').trim()}`;
    })
    .join('\n\n---\n\n');

  const body = `# ${SITE_NAME} — full content

> Free, privacy-first tools to clean AI "tells" out of your writing — em dashes, smart quotes, invisible characters and more — with grammar-aware fixes, 100% in your browser. No upload, no signup.

This file contains the curated index followed by the full text of every guide.

## Core tool

- [${CORE.title}](${abs(CORE.href)}): ${CORE.desc}

## Tools (${TOOLS.length})

${toolList}

---

# Guides — full text

${articles}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

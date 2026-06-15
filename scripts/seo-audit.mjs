// Deterministic SEO audit over the built dist/ HTML. Run after `npm run build`.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://emdashremover.app';

// ── collect all .html files ──────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}
const files = walk(DIST);

// path → canonical-style URL the page SHOULD have
function urlForFile(f) {
  let rel = relative(DIST, f).replace(/\\/g, '/').replace(/\.html$/, '');
  if (rel === 'index') rel = '';
  if (rel.endsWith('/index')) rel = rel.slice(0, -6);
  return (SITE + '/' + rel).replace(/\/$/, '') || SITE;
}

const decode = (s) => s == null ? s : s
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ');
const tag = (html, re) => { const m = html.match(re); return m ? decode(m[1].trim()) : null; };
// Quote-aware meta extraction: find the <meta> tag for the name, then read its
// content attr with a backreference so apostrophes inside don't truncate it.
const meta = (html, name, attr = 'name') => {
  const tagRe = new RegExp(`<meta\\b[^>]*\\b${attr}=(["'])${name}\\1[^>]*>`, 'i');
  const m = html.match(tagRe);
  if (!m) return null;
  const c = m[0].match(/\bcontent=(["'])([\s\S]*?)\1/i);
  return c ? decode(c[2].trim()) : null;
};
// HTML with <script>/<style> bodies removed — for scanning rendered elements only.
const strip = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const pages = [];
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const body = strip(html); // scripts/styles removed → only real rendered markup
  const jsonlds = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const ld = [];
  for (const block of jsonlds) {
    try { ld.push(JSON.parse(block)); } catch (e) { ld.push({ __parseError: e.message }); }
  }
  pages.push({
    file: relative(DIST, f),
    expectUrl: urlForFile(f),
    title: tag(html, /<title>([\s\S]*?)<\/title>/i),
    desc: meta(html, 'description'),
    canonical: tag(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i),
    robots: meta(html, 'robots'),
    ogTitle: meta(html, 'og:title', 'property'),
    ogUrl: meta(html, 'og:url', 'property'),
    ogImage: meta(html, 'og:image', 'property'),
    twImage: meta(html, 'twitter:image'),
    lang: tag(html, /<html[^>]*lang=["']([^"']*)["']/i),
    viewport: !!meta(html, 'viewport'),
    h1: [...body.matchAll(/<h1[\s>]/gi)].length,
    h2: [...body.matchAll(/<h2[\s>]/gi)].length,
    imgs: [...body.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]),
    ld,
    ldTypes: ld.flatMap(o => o.__parseError ? ['PARSE_ERROR'] : (o['@graph'] ? o['@graph'].map(g => g['@type']) : [o['@type']])).filter(Boolean),
    ldErrors: ld.filter(o => o.__parseError).map(o => o.__parseError),
  });
}

const indexable = pages.filter(p => !/noindex/i.test(p.robots || ''));
const issues = [];
const add = (sev, page, msg) => issues.push({ sev, page, msg });

// ── per-page checks ──
for (const p of pages) {
  const noi = /noindex/i.test(p.robots || '');
  if (!p.title) add('high', p.file, 'missing <title>');
  else if (p.title.length < 15 || p.title.length > 65) add('low', p.file, `title length ${p.title.length} (aim 30–60): "${p.title}"`);
  if (!p.desc) add('high', p.file, 'missing meta description');
  else if (p.desc.length < 70 || p.desc.length > 165) add('low', p.file, `description length ${p.desc.length} (aim 70–160)`);
  if (!p.canonical) add('high', p.file, 'missing canonical');
  else if (!noi && p.canonical !== p.expectUrl) add('high', p.file, `canonical "${p.canonical}" != expected "${p.expectUrl}"`);
  if (p.canonical && p.ogUrl && p.canonical !== p.ogUrl) add('med', p.file, `canonical != og:url (${p.ogUrl})`);
  if (!p.ogImage) add('med', p.file, 'missing og:image');
  if (!p.twImage) add('low', p.file, 'missing twitter:image');
  if (p.lang !== 'en') add('med', p.file, `html lang="${p.lang}"`);
  if (!p.viewport) add('high', p.file, 'missing viewport meta');
  if (p.h1 === 0) add('high', p.file, 'no <h1>');
  if (p.h1 > 1) add('med', p.file, `${p.h1} <h1> tags (should be 1)`);
  if (p.ldErrors.length) add('high', p.file, `JSON-LD parse error: ${p.ldErrors.join('; ')}`);
  const noAlt = p.imgs.filter(t => !/\balt=/i.test(t));
  if (noAlt.length) add('med', p.file, `${noAlt.length} <img> without alt`);
}

// ── duplicate titles / descriptions among indexable pages ──
const byTitle = {}, byDesc = {};
for (const p of indexable) {
  if (p.title) (byTitle[p.title] ??= []).push(p.file);
  if (p.desc) (byDesc[p.desc] ??= []).push(p.file);
}
for (const [t, fs] of Object.entries(byTitle)) if (fs.length > 1) add('high', fs.join(', '), `duplicate title: "${t}"`);
for (const [d, fs] of Object.entries(byDesc)) if (fs.length > 1) add('med', fs.join(', '), `duplicate description (${fs.length} pages)`);

// ── sitemap coverage ──
let sm = '';
for (const n of ['sitemap-0.xml', 'sitemap-index.xml']) if (existsSync(join(DIST, n))) sm += readFileSync(join(DIST, n), 'utf8');
// follow index → child sitemaps already concatenated above if present
const smUrls = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/\/$/, '')));
const expectedIndexable = new Set(indexable.filter(p => !/404/.test(p.file)).map(p => p.expectUrl));
const missingFromSitemap = [...expectedIndexable].filter(u => !smUrls.has(u) && !smUrls.has(u + '/'));
const noindexInSitemap = pages.filter(p => /noindex/i.test(p.robots || '')).filter(p => smUrls.has(p.expectUrl));

// ── robots.txt / ads.txt ──
const robotsTxt = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : null;
const adsTxt = existsSync(join(DIST, 'ads.txt')) ? readFileSync(join(DIST, 'ads.txt'), 'utf8') : null;

// ── internal link integrity ──
const builtUrls = new Set(pages.map(p => p.expectUrl.replace(SITE, '')));
const brokenLinks = {};
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let href = m[1];
    if (/^(https?:|mailto:|tel:|#|\/\/)/.test(href)) continue;
    href = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
    if (!builtUrls.has(href) && !existsSync(join(DIST, href.replace(/^\//, '')))) {
      (brokenLinks[relative(DIST, f)] ??= new Set()).add(m[1]);
    }
  }
}

// ── report ──
const bySev = s => issues.filter(i => i.sev === s);
console.log(`\n===== SEO AUDIT — ${pages.length} built pages (${indexable.length} indexable) =====`);
console.log(`Issues: ${bySev('high').length} high · ${bySev('med').length} medium · ${bySev('low').length} low\n`);
for (const sev of ['high', 'med', 'low']) {
  const list = bySev(sev);
  if (!list.length) continue;
  console.log(`── ${sev.toUpperCase()} ──`);
  for (const i of list) console.log(`  [${i.page}] ${i.msg}`);
  console.log('');
}
console.log('── SITEMAP ──');
console.log(`  sitemap URLs: ${smUrls.size}; indexable pages: ${expectedIndexable.size}`);
console.log(`  missing from sitemap: ${missingFromSitemap.length ? missingFromSitemap.join(', ') : 'none'}`);
console.log(`  noindex pages wrongly IN sitemap: ${noindexInSitemap.length ? noindexInSitemap.map(p=>p.file).join(', ') : 'none'}`);
console.log('\n── robots.txt ──\n  ' + (robotsTxt ? robotsTxt.trim().replace(/\n/g, '\n  ') : 'MISSING'));
console.log('\n── ads.txt ──\n  ' + (adsTxt ? adsTxt.trim().replace(/\n/g, '\n  ') : 'MISSING'));
console.log('\n── BROKEN INTERNAL LINKS ──');
const bl = Object.entries(brokenLinks);
if (!bl.length) console.log('  none');
else for (const [f, set] of bl) console.log(`  [${f}] ${[...set].join(', ')}`);

// ── structured-data inventory ──
console.log('\n── JSON-LD TYPES PER PAGE ──');
for (const p of pages) console.log(`  ${p.file.padEnd(48)} ${p.ldTypes.join(', ') || '(none)'}`);

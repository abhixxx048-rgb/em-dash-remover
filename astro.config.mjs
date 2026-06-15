// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Static, SEO-first site. One interactive island (the cleaner) ships only the
// JS it needs; everything else is zero-JS HTML.
export default defineConfig({
  site: 'https://emdashremover.app',
  trailingSlash: 'never',
  build: { format: 'file' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date('2026-06-15'),
      serialize(item) {
        const { pathname } = new URL(item.url);
        const path = pathname.replace(/\/$/, '') || '/';
        const legal = ['/about', '/contact', '/terms', '/privacy', '/cookies'];

        if (path === '/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (path === '/tools' || path.startsWith('/tools/')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (path === '/blog') {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/blog/')) {
          item.priority = 0.6;
          item.changefreq = 'weekly';
        } else if (legal.includes(path)) {
          item.priority = 0.3;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.5;
        }

        return item;
      },
    }),
  ],
});

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
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date('2026-06-15'),
    }),
  ],
});

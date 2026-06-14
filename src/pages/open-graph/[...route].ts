import { OGImageRoute } from 'astro-og-canvas';

// Build-time generated 1200×630 OG images, one per page.
const pages = {
  index: { title: 'Em Dash Remover', description: 'Free AI text cleaner — remove em dashes, smart quotes & invisible characters. 100% in your browser.' },
  about: { title: 'About Em Dash Remover', description: 'A free, privacy-first, grammar-aware AI text cleaner.' },
  contact: { title: 'Contact Us', description: 'Feedback, bugs, and partnership enquiries.' },
  terms: { title: 'Terms & Conditions', description: 'Terms of use for Em Dash Remover.' },
  privacy: { title: 'Privacy Policy', description: 'Your text never leaves your browser.' },
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

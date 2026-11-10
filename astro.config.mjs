import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Adresse définitive du site : à renseigner dans la variable SITE_URL (Cloudflare Pages) ou ici.
// Domaine principal : kov-atelier.com (kov-atelier.pages.dev reste accessible)
const SITE_URL = process.env.SITE_URL || 'https://kov-atelier.com';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
  build: { inlineStylesheets: 'auto' },
});

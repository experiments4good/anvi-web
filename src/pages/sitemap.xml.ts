// The sitemap: every public page, built with the site. Pages are listed
// here and from the guides collection, so a new guide is included on its own.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import stage2 from '../lib/stage2.json';

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://getanvi.app')).origin;
  const guides = (await getCollection('guides')).map((g) => `/dosha/${g.data.slug}/`).sort();
  const paths = ['/', '/quiz/', ...guides, '/six-tastes/', '/routine/', ...stage2.seasons.map((s) => `/season/${s.slug}/`), '/privacy/', '/terms/'];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

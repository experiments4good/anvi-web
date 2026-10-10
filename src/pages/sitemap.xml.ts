// The sitemap: every public page, from the same list the link-preview
// images use (src/lib/share.ts), so a page with an image is always listed.
import type { APIRoute } from 'astro';

import { sharePages } from '../lib/share';

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://getanvi.app')).origin;
  const paths = (await sharePages()).map((p) => p.path);
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

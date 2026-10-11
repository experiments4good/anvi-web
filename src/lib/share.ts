// Every public page, with what its link-preview image shows: the page's own
// heading, the glyph its header draws, and the quiz line. One list, used by
// the image generator (src/pages/og/[...image].png.ts), by Base.astro for the
// og:image tags, and by the sitemap, so they cannot drift apart.
import { getCollection } from 'astro:content';

import { proportionsFor, type Triple } from './glyph';
import stage2 from './stage2.json';

/** The line under every heading. Approved for the images; no dashes. */
export const QUIZ_LINE = 'Take the free dosha quiz at getanvi.app';

export const IMAGE_WIDTH = 1200;
export const IMAGE_HEIGHT = 630;

export interface SharePage {
  /** The page's path, as its canonical URL ends: "/dosha/pitta-kapha/". */
  path: string;
  /** The page's own heading, as its H1 reads (two-dosha guides: the type). */
  heading: string;
  glyph: Triple;
}

const BALANCED: Triple = [4, 4, 4];
const SEASON_DOSHA: Record<string, string> = { vata: 'Vata', pitta: 'Pitta', kapha: 'Kapha' };

export async function sharePages(): Promise<SharePage[]> {
  const ORDER = ['vata', 'pitta', 'kapha', 'vata-pitta', 'vata-kapha', 'pitta-kapha', 'tridoshic'];
  const guides = (await getCollection('guides')).sort((a, b) => ORDER.indexOf(a.data.slug) - ORDER.indexOf(b.data.slug));
  const legal = Object.fromEntries((await getCollection('legal')).map((e) => [e.id, e.data.title]));
  return [
    { path: '/', heading: 'Discover your dosha', glyph: BALANCED },
    { path: '/quiz/', heading: 'Discover your dosha', glyph: BALANCED },
    ...guides.map((g) => ({ path: `/dosha/${g.data.slug}/`, heading: g.data.type, glyph: proportionsFor(g.data.type) })),
    { path: '/six-tastes/', heading: stage2.sixTastes.heading, glyph: BALANCED },
    { path: '/routine/', heading: stage2.routine.heading, glyph: BALANCED },
    // A season page's header draws that season's dosha; its image does the same.
    ...stage2.seasons.map((s) => ({ path: `/season/${s.slug}/`, heading: s.heading, glyph: proportionsFor(SEASON_DOSHA[s.dosha]!) })),
    { path: '/privacy/', heading: legal['privacy']!, glyph: BALANCED },
    { path: '/terms/', heading: legal['terms']!, glyph: BALANCED },
  ];
}

/** "/" is og/home.png; "/dosha/pitta-kapha/" is og/dosha/pitta-kapha.png. */
export function imageSlug(path: string): string {
  const s = path.replace(/^\/|\/$/g, '');
  return s === '' ? 'home' : s;
}

export function imagePath(path: string): string {
  return `/og/${imageSlug(path)}.png`;
}

/** The words drawn on the image, as one line of alt text. */
export function imageAlt(page: SharePage): string {
  return `${page.heading}. ${QUIZ_LINE}`;
}

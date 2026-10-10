// What each link-preview image shows, for scripts/build-og.ts to draw after
// `astro build`. The script deletes this file from the build once the images
// exist, so it is never published.
import type { APIRoute } from 'astro';

import { IMAGE_HEIGHT, IMAGE_WIDTH, imagePath, QUIZ_LINE, sharePages } from '../../lib/share';

export const GET: APIRoute = async () => {
  const pages = (await sharePages()).map((p) => ({ path: p.path, image: imagePath(p.path), heading: p.heading, glyph: p.glyph }));
  return new Response(JSON.stringify({ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, line: QUIZ_LINE, pages }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};

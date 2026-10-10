// Draws the link-preview images, 1200 by 630, one per page in the sitemap,
// after `astro build`, from dist/client/og/manifest.json (written by
// src/pages/og/manifest.json.ts from src/lib/share.ts). Each shows the site's
// background, the page's glyph (src/lib/glyph.ts), its heading in Playfair
// Display and the quiz line in Lato. The fonts are the site's own woff2 files,
// converted to TrueType here for the layout engine. Run in Node, not in the
// build's worker runtime, because the renderer is native.
// Usage: node scripts/build-og.ts
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crc32 } from 'node:zlib';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { decompress } from 'wawoff2';

import { glyphSvg, type Triple } from '../src/lib/glyph.ts';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist/client');
const manifestPath = path.join(out, 'og/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
  width: number;
  height: number;
  line: string;
  pages: { path: string; image: string; heading: string; glyph: Triple }[];
};

// The app's tokens, as site.css declares them.
const BACKGROUND = '#FAFAF8';
const INK = '#1A2C2C';
const PRIMARY = '#1D5F5F';

async function ttf(file: string): Promise<ArrayBuffer> {
  const t = await decompress(await readFile(path.join(root, 'public/fonts', file)));
  return t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength) as ArrayBuffer;
}
const fonts = [
  { name: 'Playfair Display', data: await ttf('PlayfairDisplay-SemiBold.woff2'), weight: 600 as const, style: 'normal' as const },
  { name: 'Lato', data: await ttf('Lato-Regular.woff2'), weight: 400 as const, style: 'normal' as const },
];

/**
 * Records the words drawn on the image in a PNG tEXt chunk after the header,
 * so scripts/check-text.py can check them against the page.
 */
function withText(png: Buffer, keyword: string, text: string): Buffer {
  const data = Buffer.concat([Buffer.from(keyword, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')]);
  const type = Buffer.from('tEXt', 'latin1');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  type.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([type, data])) >>> 0, 8 + data.length);
  const headerEnd = 8 + 25; // signature, then the IHDR chunk
  return Buffer.concat([png.subarray(0, headerEnd), chunk, png.subarray(headerEnd)]);
}

for (const page of manifest.pages) {
  // Inline on a page the glyph needs no namespace; as a standalone image it does.
  const glyph = glyphSvg(page.glyph, { id: 'og' }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" ');
  const tree = {
    type: 'div',
    props: {
      style: {
        width: manifest.width,
        height: manifest.height,
        display: 'flex',
        alignItems: 'center',
        gap: 72,
        padding: '0 96px',
        backgroundColor: BACKGROUND,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', width: 340, height: 340, borderRadius: 170, boxShadow: '0 12px 40px rgba(26, 44, 44, 0.10)' },
            children: [{ type: 'img', props: { src: `data:image/svg+xml;base64,${Buffer.from(glyph).toString('base64')}`, width: 340, height: 340 } }],
          },
        },
        {
          type: 'div',
          props: {
            // A fixed width, so a long heading wraps rather than running off the edge.
            style: { display: 'flex', flexDirection: 'column', width: manifest.width - 2 * 96 - 340 - 72 },
            children: [
              { type: 'div', props: { style: { fontFamily: 'Playfair Display', fontWeight: 600, fontSize: 88, lineHeight: 1.08, color: INK }, children: page.heading } },
              { type: 'div', props: { style: { fontFamily: 'Lato', fontWeight: 400, fontSize: 34, lineHeight: 1.3, color: PRIMARY, marginTop: 32 }, children: manifest.line } },
            ],
          },
        },
      ],
    },
  };
  const svg = await satori(tree as never, { width: manifest.width, height: manifest.height, fonts });
  const drawn = new Resvg(svg, { fitTo: { mode: 'width', value: manifest.width }, font: { loadSystemFonts: false } }).render().asPng();
  const png = withText(Buffer.from(drawn), 'Description', `${page.heading}\n${manifest.line}`);
  const file = path.join(out, page.image);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, png);
}
await rm(manifestPath);
console.log(`share images: ${manifest.pages.length} drawn`);

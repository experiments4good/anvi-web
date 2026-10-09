// The glyph's stand-in proportions match the app's scoresFor for a type with
// no stored scores, and the SVG draws one shape per dosha with a share.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { glyphSvg, proportionsFor } from '../src/lib/glyph.ts';

test("type proportions are the app's 5/3/1, 5/1/1 and equal stand-ins", () => {
  assert.deepEqual(proportionsFor('Pitta-Kapha'), [1, 5, 3]);
  assert.deepEqual(proportionsFor('Kapha-Vata'), [3, 1, 5]);
  assert.deepEqual(proportionsFor('Vata'), [5, 1, 1]);
  assert.deepEqual(proportionsFor('Tridoshic'), [4, 4, 4]);
});

test('one shape per dosha with a share, none for a zero share, ids unique to the glyph', () => {
  const svg = glyphSvg([9, 7, 4], { id: 'g1', label: 'Vata-Pitta' });
  assert.equal(svg.match(/<path /g)?.length, 3);
  assert.match(svg, /role="img" aria-label="Vata-Pitta"/);
  assert.match(svg, /id="g1-c"/);
  assert.equal(glyphSvg([10, 10, 0], { id: 'g2' }).match(/<path /g)?.length, 2);
  assert.match(glyphSvg([1, 1, 1], { id: 'g3' }), /aria-hidden="true"/);
});

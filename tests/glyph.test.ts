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

test("idle motion is the app's: 7, 9 and 11 second drifts at its amplitudes, a 4 second breath", async () => {
  const { idleFrame, AMPLITUDES } = await import('../src/lib/glyph-motion.ts');
  // The app's 3.5, 3 and 4 points on a 96-point disc, as a share of the 100-unit box.
  assert.deepEqual(AMPLITUDES.map((a) => a.toFixed(3)), ['3.646', '3.125', '4.167']);
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
  for (const t of [0, 1.3, 7, 9, 11]) {
    const f = idleFrame(t);
    [7, 9, 11].forEach((period, i) => {
      const phase = (2 * Math.PI * t) / period;
      close(f.drift[i]![0], Math.cos(phase + i * 1.7) * AMPLITUDES[i]!);
      close(f.drift[i]![1], Math.sin(phase) * AMPLITUDES[i]!);
    });
  }
  close(idleFrame(0).scale, 1);
  close(idleFrame(2).scale, 1.03);
  close(idleFrame(4).scale, 1);
  // Each shape returns to its start after its own period.
  [7, 9, 11].forEach((period, i) => {
    close(idleFrame(period).drift[i]![0], idleFrame(0).drift[i]![0]);
    close(idleFrame(period).drift[i]![1], idleFrame(0).drift[i]![1]);
  });
});

test('every shape carries its dosha index for the motion script', () => {
  const svg = glyphSvg([1, 5, 3], { id: 'g4' });
  for (const i of [0, 1, 2]) assert.match(svg, new RegExp(`<path data-i="${i}" `));
});

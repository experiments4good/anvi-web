// The web quiz scores exactly as the app does. Runs the app's own scoring
// (anvi-expo src/lib/scoring.ts) and the web port over every possible score
// split and over random answer sets, and checks the label and every
// percentage match. APP_REPO points at the app checkout (default ../anvi-expo).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as web from '../src/lib/scoring.ts';

const appRepo = process.env.APP_REPO ?? path.resolve(import.meta.dirname, '../../anvi-expo');
const app = await import(pathToFileURL(path.join(appRepo, 'src/lib/scoring.ts')).href);

const TYPES = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Vata', 'Vata-Kapha', 'Kapha-Vata', 'Pitta-Kapha', 'Kapha-Pitta', 'Tridoshic'];

/** What the app shows: the label from getPrimaryDosha, and the breakdown rows as Results sorts them. */
function appResult(v: number, p: number, k: number) {
  const rows = [
    { dosha: 'Vata', score: v },
    { dosha: 'Pitta', score: p },
    { dosha: 'Kapha', score: k },
  ].sort((a, b) => b.score - a.score);
  return {
    label: app.getPrimaryDosha(v, p, k, ''),
    rows: rows.map((r) => ({ dosha: r.dosha, percent: app.getPercentage(r.score, v + p + k) })),
  };
}

function webResult(s: { vata: number; pitta: number; kapha: number }) {
  return { label: web.resultLabel(s), rows: web.breakdown(s) };
}

test('same constants as the app', () => {
  assert.equal(web.QUIZ_QUESTION_COUNT, app.QUIZ_QUESTION_COUNT);
  assert.deepEqual(web.ANSWER_ORDER, app.ANSWER_ORDER);
  assert.equal(web.SINGLE_LEAD, app.SINGLE_LEAD);
  assert.equal(web.TRIDOSHIC_SPREAD, app.TRIDOSHIC_SPREAD);
});

test('every score split of 20 answers gives the app result, covering all ten types', () => {
  const seen = new Set<string>();
  let n = 0;
  for (let v = 0; v <= 20; v++) {
    for (let p = 0; p + v <= 20; p++) {
      const k = 20 - v - p;
      const expected = appResult(v, p, k);
      assert.deepEqual(webResult({ vata: v, pitta: p, kapha: k }), expected, `${v}/${p}/${k}`);
      seen.add(expected.label);
      n++;
    }
  }
  assert.equal(n, 231);
  assert.deepEqual([...seen].sort(), [...TYPES].sort());
});

test('random answer sets give the app result', () => {
  let seed = 20261009;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 5000; i++) {
    const answers = Array.from({ length: 20 }, () => Math.floor(rand() * 3));
    const s = web.scoresFor(answers);
    const counted = { vata: answers.filter((a) => a === 0).length, pitta: answers.filter((a) => a === 1).length, kapha: answers.filter((a) => a === 2).length };
    assert.deepEqual(s, counted);
    assert.deepEqual(webResult(s), appResult(s.vata, s.pitta, s.kapha));
  }
});

test('one known answer set per type', () => {
  // [vata, pitta, kapha] answer counts that give each of the ten types.
  const cases: [number, number, number, string][] = [
    [12, 4, 4, 'Vata'],
    [4, 12, 4, 'Pitta'],
    [4, 4, 12, 'Kapha'],
    [9, 7, 4, 'Vata-Pitta'],
    [7, 9, 4, 'Pitta-Vata'],
    [9, 4, 7, 'Vata-Kapha'],
    [4, 7, 9, 'Kapha-Pitta'],
    [4, 9, 7, 'Pitta-Kapha'],
    [7, 4, 9, 'Kapha-Vata'],
    [7, 7, 6, 'Tridoshic'],
  ];
  for (const [v, p, k, label] of cases) {
    const answers = [...Array(v).fill(0), ...Array(p).fill(1), ...Array(k).fill(2)];
    const s = web.scoresFor(answers);
    assert.equal(web.resultLabel(s), label);
    assert.equal(app.getPrimaryDosha(v, p, k, ''), label);
    assert.deepEqual(webResult(s), appResult(v, p, k));
  }
});

test('each result opens its guide, pairs in either order sharing one', () => {
  assert.equal(web.guidePath('Vata'), '/dosha/vata/');
  assert.equal(web.guidePath('Tridoshic'), '/dosha/tridoshic/');
  assert.equal(web.guidePath('Vata-Pitta'), '/dosha/vata-pitta/');
  assert.equal(web.guidePath('Pitta-Vata'), '/dosha/vata-pitta/');
  assert.equal(web.guidePath('Kapha-Vata'), '/dosha/vata-kapha/');
  assert.equal(web.guidePath('Kapha-Pitta'), '/dosha/pitta-kapha/');
  assert.equal(web.guidePath('Pitta-Kapha'), '/dosha/pitta-kapha/');
});

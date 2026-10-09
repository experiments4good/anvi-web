// The guides' date lines use the app's windows: the same edge dates as the
// app's tests/routine.test.ts, and the app's month-based seasons.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { balancedFor, focusNow, rightNow, seasonForDate, windowEnd } from '../src/lib/windows.ts';

const on = (m: number, d: number) => new Date(2026, m - 1, d, 9, 0);

test('two-dosha windows on both sides of every edge', () => {
  const cases: [Parameters<typeof balancedFor>[0], number, number, string, string][] = [
    ['vata-pitta', 3, 20, 'vata', 'Mar 20'],
    ['vata-pitta', 3, 21, 'pitta', 'Sep 21'],
    ['vata-pitta', 9, 21, 'pitta', 'Sep 21'],
    ['vata-pitta', 9, 22, 'vata', 'Mar 20'],
    ['vata-kapha', 6, 20, 'kapha', 'Jun 20'],
    ['vata-kapha', 6, 21, 'vata', 'Dec 21'],
    ['vata-kapha', 12, 21, 'vata', 'Dec 21'],
    ['vata-kapha', 12, 22, 'kapha', 'Jun 20'],
    ['pitta-kapha', 4, 30, 'kapha', 'Apr 30'],
    ['pitta-kapha', 5, 1, 'pitta', 'Nov 1'],
    ['pitta-kapha', 11, 1, 'pitta', 'Nov 1'],
    ['pitta-kapha', 11, 2, 'kapha', 'Apr 30'],
  ];
  for (const [pair, m, d, balanced, end] of cases) {
    assert.equal(balancedFor(pair, on(m, d)), balanced, `${pair} ${m}/${d}`);
    assert.equal(windowEnd(pair, on(m, d)), end, `${pair} ${m}/${d}`);
  }
});

test('the date lines read as the approved text does', () => {
  assert.equal(rightNow('pitta-kapha', on(10, 9)), 'Right now that means balancing Pitta, through Nov 1.');
  assert.equal(rightNow('vata-pitta', on(1, 15)), 'Right now that means balancing Vata, through Mar 20.');
  assert.equal(rightNow('vata-kapha', on(10, 9)), 'Right now that means balancing Vata, through Dec 21.');
  assert.equal(rightNow('vata-pitta', on(10, 9)), 'Right now that means balancing Vata, through Mar 20.');
  assert.equal(rightNow('pitta-kapha', on(12, 1)), 'Right now that means balancing Kapha, through Apr 30.');
});

test("the app's month-based seasons", () => {
  for (const [m, s] of [[1, 'kapha'], [5, 'kapha'], [6, 'pitta'], [8, 'pitta'], [9, 'vata'], [11, 'vata'], [12, 'kapha']] as const) {
    assert.equal(seasonForDate(on(m, 15)), s);
  }
});

test("the quiz result's short line uses the same windows", () => {
  assert.deepEqual(focusNow('pitta-kapha', on(10, 9)), ['Pitta', 'Nov 1']);
  assert.deepEqual(focusNow('pitta-kapha', on(11, 2)), ['Kapha', 'Apr 30']);
  assert.deepEqual(focusNow('vata-pitta', on(3, 21)), ['Pitta', 'Sep 21']);
  assert.deepEqual(focusNow('vata-kapha', on(12, 22)), ['Kapha', 'Jun 20']);
});

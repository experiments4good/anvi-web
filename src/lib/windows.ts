// The date windows the guides use, the same as the app's daily routine
// (anvi-expo src/lib/routine.ts) and the app's month-based seasons
// (src/lib/scoring.ts seasonForMonth). All on the visitor's local date.
// tests/windows.test.ts checks them against the app's edge dates.

export type Balanced = 'vata' | 'pitta' | 'kapha';

/** March 21 is 321. */
function monthDay(date: Date): number {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

/** The app's seasons: vata September to November, pitta June to August, kapha December to May. */
export function seasonForDate(date: Date): Balanced {
  const m = date.getMonth() + 1;
  if (m >= 9 && m <= 11) return 'vata';
  if (m >= 6 && m <= 8) return 'pitta';
  return 'kapha';
}

export type Pair = 'vata-pitta' | 'vata-kapha' | 'pitta-kapha';

/** The dosha to balance on `date` for a two-dosha guide. Inclusive windows, as in routine.ts. */
export function balancedFor(pair: Pair, date: Date): Balanced {
  const md = monthDay(date);
  switch (pair) {
    case 'vata-pitta':
      return md >= 321 && md <= 921 ? 'pitta' : 'vata';
    case 'vata-kapha':
      return md >= 621 && md <= 1221 ? 'vata' : 'kapha';
    case 'pitta-kapha':
      return md >= 501 && md <= 1101 ? 'pitta' : 'kapha';
  }
}

/** The last day of the window in force, as the app's focus label: "Nov 1". */
export function windowEnd(pair: Pair, date: Date): string {
  const b = balancedFor(pair, date);
  switch (pair) {
    case 'vata-pitta':
      return b === 'pitta' ? 'Sep 21' : 'Mar 20';
    case 'vata-kapha':
      return b === 'vata' ? 'Dec 21' : 'Jun 20';
    case 'pitta-kapha':
      return b === 'pitta' ? 'Nov 1' : 'Apr 30';
  }
}

const NAME: Record<Balanced, string> = { vata: 'Vata', pitta: 'Pitta', kapha: 'Kapha' };

/** The dosha in force and its window's end, for the quiz result's short line: ["Pitta", "Nov 1"]. */
export function focusNow(pair: Pair, date: Date): [string, string] {
  return [NAME[balancedFor(pair, date)], windowEnd(pair, date)];
}

/** "Right now that means balancing Pitta, through Nov 1." */
export function rightNow(pair: Pair, date: Date): string {
  return `Right now that means balancing ${NAME[balancedFor(pair, date)]}, through ${windowEnd(pair, date)}.`;
}

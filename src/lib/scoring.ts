// Dosha scoring for the web quiz, ported from the app (anvi-expo
// src/lib/scoring.ts, the rule in anvi_quiz_20.md). Sort the three scores
// high to low, keeping Vata, Pitta, Kapha order on equal scores; single when
// the top leads the second by 4 or more, tridoshic when all three are within
// 2, otherwise dual (top-second). Percentages are rounded shares of 20.
// tests/scoring.parity.test.ts runs this against the app's own file.

export type Dosha = 'Vata' | 'Pitta' | 'Kapha';

export const QUIZ_QUESTION_COUNT = 20;
/** Answer index 0, 1, 2 adds one to this dosha. */
export const ANSWER_ORDER: readonly Dosha[] = ['Vata', 'Pitta', 'Kapha'];

export const SINGLE_LEAD = 4;
export const TRIDOSHIC_SPREAD = 2;

export interface Scores {
  vata: number;
  pitta: number;
  kapha: number;
}

/** Scores from the answer indexes chosen, one per question. */
export function scoresFor(answers: readonly number[]): Scores {
  const s: Scores = { vata: 0, pitta: 0, kapha: 0 };
  for (const a of answers) {
    if (a === 0) s.vata++;
    else if (a === 1) s.pitta++;
    else if (a === 2) s.kapha++;
  }
  return s;
}

/** The result label: "Vata", "Pitta-Kapha", "Tridoshic" and so on. */
export function resultLabel({ vata, pitta, kapha }: Scores): string {
  const ranked: { dosha: Dosha; score: number }[] = [
    { dosha: 'Vata', score: vata },
    { dosha: 'Pitta', score: pitta },
    { dosha: 'Kapha', score: kapha },
  ];
  ranked.sort((a, b) => b.score - a.score); // stable, so ties keep the fixed order
  const [top, second, third] = ranked as [(typeof ranked)[0], (typeof ranked)[0], (typeof ranked)[0]];
  if (top.score - second.score >= SINGLE_LEAD) return top.dosha;
  if (top.score - third.score <= TRIDOSHIC_SPREAD) return 'Tridoshic';
  return `${top.dosha}-${second.dosha}`;
}

/** Rounded percentage of the total, as the app's getPercentage. */
export function percentage(score: number, total: number = QUIZ_QUESTION_COUNT): number {
  return total > 0 ? Math.round((score * 100) / total) : 0;
}

/** The breakdown rows in the app's order: highest first, ties in Vata, Pitta, Kapha order. */
export function breakdown(s: Scores): { dosha: Dosha; percent: number }[] {
  const total = s.vata + s.pitta + s.kapha;
  return [
    { dosha: 'Vata' as Dosha, score: s.vata },
    { dosha: 'Pitta' as Dosha, score: s.pitta },
    { dosha: 'Kapha' as Dosha, score: s.kapha },
  ]
    .sort((a, b) => b.score - a.score)
    .map((r) => ({ dosha: r.dosha, percent: percentage(r.score, total) }));
}

/** The guide a result opens: two-dosha results in either order share one. */
export function guidePath(label: string): string {
  const pairs: Record<string, string> = {
    'Pitta-Vata': 'vata-pitta',
    'Kapha-Vata': 'vata-kapha',
    'Kapha-Pitta': 'pitta-kapha',
  };
  return `/dosha/${pairs[label] ?? label.toLowerCase()}/`;
}

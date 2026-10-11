// The app's idle glyph motion (anvi-expo src/components/Glyph.tsx, motion
// "idle"), as plain numbers: each shape drifts on its own 7, 9 or 11 second
// cycle and the disc breathes every 4 seconds. The app's amplitudes are 3.5,
// 3 and 4 points on its 96-point Home glyph; here they are the same share of
// the glyph's 100-unit box, so the drift scales with the drawn size.

const PERIODS = [7, 9, 11] as const;
const APP_AMPLITUDES = [3.5, 3, 4] as const;
const APP_DIAMETER = 96;
const BOX = 100;
export const AMPLITUDES = APP_AMPLITUDES.map((a) => (a / APP_DIAMETER) * BOX);

export interface IdleFrame {
  /** Offset of each shape (Vata, Pitta, Kapha) in glyph units. */
  drift: [number, number][];
  /** The disc's scale. */
  scale: number;
}

/** The idle pose `seconds` into the loop. */
export function idleFrame(seconds: number): IdleFrame {
  const drift = [0, 1, 2].map((i) => {
    const phase = (2 * Math.PI * seconds) / PERIODS[i]!;
    return [Math.cos(phase + i * 1.7) * AMPLITUDES[i]!, Math.sin(phase) * AMPLITUDES[i]!] as [number, number];
  });
  const scale = 1 + 0.015 * (1 - Math.cos((2 * Math.PI * seconds) / 4));
  return { drift, scale };
}

// The constitution glyph as SVG, ported from the app's Glyph component
// (anvi-expo src/components/Glyph.tsx): three superellipses in the glyph
// palette, each sized so its area is proportional to its dosha's share,
// laid out on a triangle, centred on their area-weighted centroid, scaled to
// 85% of the disc, drawn translucently on a white disc with the same fixed
// highlight and rim shadow. The app's dosha chip and idle drift are not
// ported; the page adds one settle on load in CSS instead.

// The app's glyph-only palette (not the theme tokens), and its fill alpha.
export const GLYPH_COLORS = ['#766AA1', '#A47446', '#287775'] as const;
const FILL_ALPHA = 0.82;
const CLUSTER_EXTENT = 0.85;

export type Triple = [number, number, number];

/** The stand-in proportions the app uses for a type with no scores: 5/3/1, single 5/1/1, tridoshic equal. */
export function proportionsFor(type: string): Triple {
  const t = type.trim().toLowerCase();
  if (t === 'tridoshic') return [4, 4, 4];
  const index = (d: string | undefined) => ['vata', 'pitta', 'kapha'].indexOf((d ?? '').trim());
  const [p, s] = t.split('-');
  const primary = index(p);
  if (primary < 0) return [1, 1, 1];
  const secondary = index(s);
  const at = (i: number) => (i === primary ? 5 : i === secondary ? 3 : 1);
  return [at(0), at(1), at(2)];
}

function layout(scores: Triple, radius: number) {
  const total = scores[0] + scores[1] + scores[2];
  const order = [0, 1, 2].sort((a, b) => scores[b]! - scores[a]!);
  if (total <= 0) return { centres: [[0, 0], [0, 0], [0, 0]] as [number, number][], radii: [0, 0, 0], order };
  const peak = Math.max(...scores);
  const unit = [0, 1, 2].map((i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    return [Math.cos(angle) * 0.4, Math.sin(angle) * 0.4] as [number, number];
  });
  const rawRadii = scores.map((s) => (s === 0 ? 0 : 0.6 * Math.sqrt(s / peak)));
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < 3; i++) {
    cx += unit[i]![0] * (scores[i]! / total);
    cy += unit[i]![1] * (scores[i]! / total);
  }
  const rel = unit.map(([x, y]) => [x - cx, y - cy] as [number, number]);
  let extent = 0;
  for (let i = 0; i < 3; i++) {
    if (scores[i] === 0) continue;
    extent = Math.max(extent, Math.hypot(rel[i]![0], rel[i]![1]) + rawRadii[i]!);
  }
  const scale = extent === 0 ? 0 : (radius * CLUSTER_EXTENT) / extent;
  return {
    centres: rel.map(([x, y]) => [x * scale, y * scale] as [number, number]),
    radii: rawRadii.map((r) => r * scale),
    order,
  };
}

function signedPow(v: number, e: number): number {
  return (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), e);
}

function superellipse(cx: number, cy: number, a: number, b: number, exponent: number, rotation: number): string {
  const steps = 96;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const k = 2 / exponent;
  let d = '';
  for (let i = 0; i < steps; i++) {
    const t = (i * 2 * Math.PI) / steps;
    const x = a * signedPow(Math.cos(t), k);
    const y = b * signedPow(Math.sin(t), k);
    const px = cx + x * cosR - y * sinR;
    const py = cy + x * sinR + y * cosR;
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)}`;
  }
  return d + 'Z';
}

export interface GlyphOptions {
  /** Unique within the page, for the gradient and clip ids. */
  id: string;
  /** Spoken name, for example "Pitta-Kapha"; omit for a decorative glyph. */
  label?: string;
  /** Adds the settle-on-load class. */
  settle?: boolean;
}

/** The glyph as an SVG string, drawn in a 100 by 100 box and sized by CSS. */
export function glyphSvg(scores: Triple, { id, label, settle = false }: GlyphOptions): string {
  const size = 100;
  const r = size / 2;
  const geo = layout(scores, r);
  const shapes = geo.order
    .filter((i) => scores[i]! > 0)
    .map((i) => {
      const rad = geo.radii[i]!;
      const wobble = Math.cos(i * 2.1);
      const d = superellipse(
        r + geo.centres[i]![0],
        r + geo.centres[i]![1],
        rad * (1 + 0.105 * wobble),
        rad * (1 - 0.09 * wobble),
        2.5,
        -Math.PI / 2 + (i * 2 * Math.PI) / 3 + 0.35 + 0.22 * i,
      );
      return `<path d="${d}" fill="${GLYPH_COLORS[i]}" fill-opacity="${FILL_ALPHA}"/>`;
    })
    .join('');
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return (
    `<svg class="glyph${settle ? ' settle' : ''}" viewBox="0 0 ${size} ${size}" ${a11y}>` +
    `<defs>` +
    `<clipPath id="${id}-c"><circle cx="${r}" cy="${r}" r="${r}"/></clipPath>` +
    // Highlight up and to the left, and a soft rim shadow, as the app's two radial gradients.
    `<radialGradient id="${id}-h" gradientUnits="userSpaceOnUse" cx="${r - 0.42 * r}" cy="${r - 0.5 * r}" r="${0.42 * size}">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0.275"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}-s" gradientUnits="userSpaceOnUse" cx="${r + 0.18 * r}" cy="${r + 0.22 * r}" r="${0.78 * size}">` +
    `<stop offset="0" stop-color="#1A2C2C" stop-opacity="0"/><stop offset="0.66" stop-color="#1A2C2C" stop-opacity="0"/><stop offset="1" stop-color="#1A2C2C" stop-opacity="0.15"/></radialGradient>` +
    `</defs>` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="#FFFFFF"/>` +
    `<g clip-path="url(#${id}-c)">${shapes}` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="url(#${id}-h)"/>` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="url(#${id}-s)"/>` +
    `</g></svg>`
  );
}

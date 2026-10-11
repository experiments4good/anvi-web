// Runs the app's idle motion (src/lib/glyph-motion.ts) on every glyph on the
// page, including one drawn later, such as the quiz result. Only glyphs on
// screen move, and only while the tab is visible; with reduced motion on,
// every glyph is drawn still in its rest pose.
import { idleFrame } from '../lib/glyph-motion';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const onScreen = new Set<HTMLElement>();
const start = performance.now();
let raf = 0;

function draw(now: number) {
  const { drift, scale } = idleFrame((now - start) / 1000);
  for (const disc of onScreen) {
    disc.style.transform = `scale(${scale.toFixed(4)})`;
    for (const shape of disc.querySelectorAll<SVGPathElement>('path[data-i]')) {
      const [x, y] = drift[Number(shape.dataset.i)]!;
      shape.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    }
  }
  raf = requestAnimationFrame(draw);
}

function rest() {
  for (const disc of document.querySelectorAll<HTMLElement>('.glyph-disc')) {
    disc.style.transform = '';
    for (const shape of disc.querySelectorAll('path[data-i]')) shape.removeAttribute('transform');
  }
}

function update() {
  const run = !reduce.matches && !document.hidden && onScreen.size > 0;
  if (run && !raf) raf = requestAnimationFrame(draw);
  if (!run && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  if (reduce.matches) rest();
}

const watcher = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) onScreen.add(e.target as HTMLElement);
    else onScreen.delete(e.target as HTMLElement);
  }
  update();
});

for (const disc of document.querySelectorAll('.glyph-disc')) watcher.observe(disc);
document.addEventListener('visibilitychange', update);
reduce.addEventListener('change', update);

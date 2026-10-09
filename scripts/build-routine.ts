// Writes src/lib/routine-steps.json from the app's own routine
// (anvi-expo src/lib/routine.ts), so the /routine page shows the app's text
// unchanged. routine.ts imports the phone's storage module, which is not
// needed for the step text; this loads a copy with that one import stubbed.
// Usage: node scripts/build-routine.ts [app repo, default ../anvi-expo]
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const app = process.argv[2] ?? path.resolve(import.meta.dirname, '../../anvi-expo');
const src = readFileSync(path.join(app, 'src/lib/routine.ts'), 'utf8');
const storage = "import AsyncStorage from '@react-native-async-storage/async-storage';";
const scoring = "from './scoring';";
if (!src.includes(storage) || !src.includes(scoring)) throw new Error('routine.ts imports changed; update this script');
const patched = src
  .replace(storage, 'const AsyncStorage: any = {};')
  .replace(scoring, `from ${JSON.stringify(pathToFileURL(path.join(app, 'src/lib/scoring.ts')).href)};`);
const dir = mkdtempSync(path.join(tmpdir(), 'anvi-routine-'));
const file = path.join(dir, 'routine.ts');
writeFileSync(file, patched);
const r = await import(pathToFileURL(file).href);

// One date is enough: single types balance their own dosha all year.
const date = new Date(2026, 9, 9);
const versions = { vata: r.routineSteps('Vata', date), pitta: r.routineSteps('Pitta', date), kapha: r.routineSteps('Kapha', date) };
const out = {
  from: 'anvi-expo src/lib/routine.ts',
  groups: r.GROUPS,
  steps: versions.vata.map((s: any, i: number) => ({
    id: s.id,
    group: s.group,
    title: s.title,
    versions: Object.fromEntries(
      Object.entries(versions).map(([k, list]: [string, any]) => [k, { howTo: list[i].howTo, reason: list[i].reason, source: list[i].source }]),
    ),
  })),
};
writeFileSync(path.resolve(import.meta.dirname, '../src/lib/routine-steps.json'), JSON.stringify(out, null, 2) + '\n');
const tailored = out.steps.filter((s: any) => new Set(Object.values(s.versions).map((v: any) => JSON.stringify(v))).size > 1).map((s: any) => s.id);
console.log('steps:', out.steps.map((s: any) => s.id).join(', '), '| differ by dosha:', tailored.join(', '));

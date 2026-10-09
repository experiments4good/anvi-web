// The web quiz asks the app's exact questions, hints and answers.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { QUIZ } from '../src/lib/quiz.ts';

const appRepo = process.env.APP_REPO ?? path.resolve(import.meta.dirname, '../../anvi-expo');
const app = await import(pathToFileURL(path.join(appRepo, 'src/content/quiz.ts')).href);

test('the same 20 questions, hints and answers as the app, in the same order', () => {
  assert.equal(QUIZ.length, 20);
  assert.deepEqual(QUIZ, app.QUIZ);
});

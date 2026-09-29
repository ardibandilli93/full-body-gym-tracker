import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import routine from '../src/routine.json' with { type: 'json' };

test('every exercise demonstration GIF is present and valid', async () => {
  const exerciseGifs = routine.exercises.map(exercise => exercise.gif);

  assert.ok(exerciseGifs.length > 0, 'The routine must contain exercise demonstrations');

  for (const relativePath of exerciseGifs) {
    const assetUrl = new URL(`../public/${relativePath}`, import.meta.url);
    const contents = await readFile(fileURLToPath(assetUrl));
    const signature = contents.subarray(0, 6).toString('ascii');

    assert.match(signature, /^GIF8[79]a$/, `${relativePath} must be a valid GIF`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompletion, previousCompletedSession, recapMood } from '../src/recap.js';
import { validateHistory } from '../src/validation.js';

const date = '2026-09-28';
const state = (weight, reps = 10, done = true) => ({ notes: '', sets: [{ weight: String(weight), reps: String(reps), done }] });
const completed = (exercises, progressPct = 0) => ({ session: 'A', exercises, completion: { finishedAt: '2026-09-21T17:00:00.000Z', minutes: 45, bodyWeightKg: 70, calories: 184, progressPct, comparedTo: null, comparedExercises: 0, completedSets: 1 } });

test('completion compares average work per completed set across matching exercises only', () => {
  const history = {
    '2026-09-21': completed({ 'leg-press': state(40), 'bench-press': state(20) }),
    '2026-09-25': { session: 'A', exercises: { 'leg-press': state(100) } },
    [date]: { session: 'A', exercises: { 'leg-press': { notes: '', sets: [state(44).sets[0], state(44).sets[0]] }, 'bench-press': state(22), 'lat-pulldown': state(30) } },
  };
  assert.equal(previousCompletedSession(history, date), '2026-09-21');
  const result = calculateCompletion(history, date, 45, 70);
  assert.equal(result.progressPct, 10);
  assert.equal(result.comparedExercises, 2);
  assert.equal(result.calories, 184);
  assert.equal(result.completedSets, 4);
  assert.equal(recapMood(result), 'up');
  assert.deepEqual(validateHistory({ [date]: { ...history[date], completion: result } })[date].completion, result);
});

test('first, unchanged, and lower sessions have distinct recaps', () => {
  const base = completed({ 'leg-press': state(40) });
  const first = calculateCompletion({ [date]: { session: 'A', exercises: { 'leg-press': state(40) } } }, date, 30, 70);
  assert.equal(first.progressPct, null);
  assert.equal(recapMood(first), 'first');
  for (const [weight, mood] of [[40, 'same'], [36, 'down']]) {
    const history = { '2026-09-21': base, [date]: { session: 'A', exercises: { 'leg-press': state(weight) } } };
    assert.equal(recapMood(calculateCompletion(history, date, 30, 70)), mood);
  }
});

test('completion requires usable inputs and at least one done set', () => {
  const history = { [date]: { session: 'A', exercises: { 'leg-press': state(40, 10, false) } } };
  assert.throws(() => calculateCompletion(history, date, 30, 70), /Mark at least one set/);
  history[date].exercises['leg-press'].sets[0].done = true;
  assert.throws(() => calculateCompletion(history, date, 0, 70), /duration/);
  assert.throws(() => calculateCompletion(history, date, 30, 0), /body weight/);
  history[date].completion = calculateCompletion(history, date, 30, 70);
  assert.throws(() => calculateCompletion(history, date, 30, 70), /cannot be finished again/);
});

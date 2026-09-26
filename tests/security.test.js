import test from 'node:test';
import assert from 'node:assert/strict';
import { readBackup, validateHistory, MAX_BACKUP_BYTES } from '../src/validation.js';
import { readHistory, hasWorkout, totalVolume } from '../src/workout.js';

const date = '2026-09-25';
const day = () => ({ session: 'A', exercises: { 'leg-press': { notes: 'Good session', sets: [{ weight: '50', reps: '10', done: true }] } } });
const validate = item => validateHistory({ [date]: item });

test('valid backups preserve workouts and normalize missing legacy fields', async () => {
  const history = { [date]: day() };
  const result = await readBackup(new Blob([JSON.stringify({ app: '3-day-full-body-gym-tracker', history })]));
  assert.equal(totalVolume(result, date), 500);
  assert.ok(hasWorkout(result[date]));
  assert.deepEqual(validate({ exercises: { 'leg-press': {} } })[date].exercises['leg-press'], { sets: [], notes: '' });
});

test('reject malformed sets, object notes, invalid session and unsafe numeric values', () => {
  for (const sets of [[null], ['bad'], [{} , null], Array(13).fill({}), [{ weight: {} }], [{ reps: -1 }], [{ weight: 'Infinity' }], [{ done: 'false' }]]) {
    const item = day(); item.exercises['leg-press'].sets = sets;
    assert.throws(() => validate(item));
  }
  for (const notes of [{}, ['bad'], 'x'.repeat(2001)]) {
    const item = day(); item.exercises['leg-press'].notes = notes;
    assert.throws(() => validate(item));
  }
  assert.throws(() => validate({ ...day(), session: 'constructor' }));
});

test('reject invalid dates and prototype keys without polluting objects', () => {
  for (const key of ['2026-02-30', '2026-13-01', '__proto__', 'constructor']) assert.throws(() => validateHistory({ [key]: day() }));
  const item = day(); item.exercises = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => validate(item));
  assert.equal({}.polluted, undefined);
});

test('oversized backups are rejected before reading their contents', async () => {
  await assert.rejects(readBackup({ size: MAX_BACKUP_BYTES + 1, text() { assert.fail('Must not read oversized input'); } }), /smaller than/);
});

test('corrupt cached or cloud days cannot persistently crash rendering', () => {
  const history = { [date]: day(), '2026-09-24': { exercises: { 'leg-press': { sets: [null] } } } };
  globalThis.localStorage = { getItem: () => JSON.stringify(history) };
  assert.deepEqual(Object.keys(readHistory('test')), [date]);
  assert.deepEqual(Object.keys(validateHistory(history, { skipInvalid: true })), [date]);
});

test('HTML-looking notes remain plain strings, unknown fields are discarded', () => {
  const item = day(); item.exercises['leg-press'].notes = '<img src=x onerror=alert(1)>';
  item.user_id = 'another-user';
  const result = validate(item)[date];
  assert.equal(result.user_id, undefined);
  assert.equal(result.exercises['leg-press'].notes, item.exercises['leg-press'].notes);
});

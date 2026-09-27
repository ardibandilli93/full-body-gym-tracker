import routine from './routine.json' with { type: 'json' };

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const ids = new Set(routine.exercises.map(exercise => exercise.id));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = () => { throw new Error('Invalid workout backup or workout data'); };
const safeKeys = value => {
  if (!record(value) || Object.keys(value).some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) fail();
};
const numeric = (value, max) => {
  if (value === '' || value === undefined) return '';
  if (!['string', 'number'].includes(typeof value) || String(value).length > 16 || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > max) fail();
  return String(value);
};

export function validateDay(date, day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01' || date > '2200-12-31') fail();
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) fail();
  safeKeys(day);
  const result = { exercises: {} };
  if (Object.hasOwn(day, 'session')) {
    if (!['', 'A', 'B', 'C'].includes(day.session)) fail();
    result.session = day.session;
  }
  if (day.updatedAt !== undefined) {
    if (typeof day.updatedAt !== 'string' || day.updatedAt.length > 40 || !Number.isFinite(Date.parse(day.updatedAt))) fail();
    result.updatedAt = new Date(day.updatedAt).toISOString();
  }
  const exercises = day.exercises ?? {};
  safeKeys(exercises);
  const completion = day.completion ?? exercises._completion;
  if (completion !== undefined) {
    safeKeys(completion);
    const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    if (typeof completion.finishedAt !== 'string' || completion.finishedAt.length > 40 || !Number.isFinite(Date.parse(completion.finishedAt)) ||
      !integer(completion.minutes, 5, 300) || typeof completion.bodyWeightKg !== 'number' || !Number.isFinite(completion.bodyWeightKg) || completion.bodyWeightKg < 20 || completion.bodyWeightKg > 400 ||
      !integer(completion.calories, 1, 7000) || !(completion.progressPct === null || integer(completion.progressPct, -100, 100)) ||
      !(completion.comparedTo === null || typeof completion.comparedTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(completion.comparedTo) && completion.comparedTo < date) ||
      !integer(completion.comparedExercises, 0, 20) || !integer(completion.completedSets, 1, 240)) fail();
    result.completion = {
      finishedAt: new Date(completion.finishedAt).toISOString(), minutes: completion.minutes, bodyWeightKg: completion.bodyWeightKg,
      calories: completion.calories, progressPct: completion.progressPct, comparedTo: completion.comparedTo,
      comparedExercises: completion.comparedExercises, completedSets: completion.completedSets,
    };
  }
  for (const [id, state] of Object.entries(exercises)) {
    if (id === '_completion') continue;
    if (!ids.has(id)) fail();
    safeKeys(state);
    const notes = state.notes ?? '';
    const sets = state.sets ?? [];
    if (typeof notes !== 'string' || notes.length > 2000 || !Array.isArray(sets) || sets.length > 12) fail();
    result.exercises[id] = { notes, sets: sets.map(set => {
      safeKeys(set);
      if (set.done !== undefined && typeof set.done !== 'boolean') fail();
      return { weight: numeric(set.weight, 9999), reps: numeric(set.reps, 999), done: set.done ?? false };
    }) };
  }
  if (new TextEncoder().encode(JSON.stringify(result.exercises)).length > 60000) fail();
  return result;
}

export function validateHistory(history, { skipInvalid = false } = {}) {
  safeKeys(history);
  if (Object.keys(history).length > 5000) fail();
  const result = {};
  for (const [date, day] of Object.entries(history)) {
    try { result[date] = validateDay(date, day); }
    catch (error) { if (!skipInvalid) throw error; }
  }
  return result;
}

export async function readBackup(file) {
  if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup must be smaller than 5 MB');
  const data = JSON.parse(await file.text());
  if (!record(data) || data.app !== '3-day-full-body-gym-tracker') fail();
  return validateHistory(data.history);
}

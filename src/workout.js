import routine from './routine.json' with { type: 'json' };
import { validateHistory, MAX_BACKUP_BYTES } from './validation.js';

export const exercises = routine.exercises;
export const plan = routine.plan;
export const exerciseById = Object.fromEntries(exercises.map(exercise => [exercise.id, exercise]));
export const legacyHistoryKey = 'gym-video-workout:sceYELRojak:history:v2';
export const guestHistoryKey = 'full-body:guest-history:v1';
export const userHistoryKey = id => `full-body:history:${id}:v1`;

export const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = key => { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day); };
export const addDays = (key, count) => { const date = parseDate(key); date.setDate(date.getDate() + count); return dateKey(date); };
export const prettyDate = key => parseDate(key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
export const scheduledSession = key => ({ 1: 'A', 3: 'B', 5: 'C' })[parseDate(key).getDay()] || '';
export const sessionFor = (history, key) => Object.hasOwn(history[key] || {}, 'session') ? history[key].session : scheduledSession(key);
export const sessionExercises = session => (plan[session] || []).map(id => exerciseById[id]);
export const emptySets = exercise => Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '', done: false }));
export const validNumber = value => { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : 0; };
export const hasValidSetValues = set => Number(set?.weight) > 0 && Number(set?.reps) > 0;
export const isCompletedSet = set => !!set?.done && hasValidSetValues(set);
export const volume = state => (state?.sets || []).reduce((sum, set) => sum + validNumber(set.weight) * validNumber(set.reps), 0);
export const hasWorkout = day => Object.values(day?.exercises || {}).some(state => !!state.notes || (state.sets || []).some(set => set.done || set.weight || set.reps));
export const previousExercise = (history, date, id) => Object.keys(history).filter(key => key < date && history[key]?.exercises?.[id] && hasWorkout({ exercises: { [id]: history[key].exercises[id] } })).sort().reverse().map(key => ({ date: key, state: history[key].exercises[id] }))[0];
export const totalVolume = (history, key) => Object.values(history[key]?.exercises || {}).reduce((sum, state) => sum + volume(state), 0);
export const weekStart = key => { const d = parseDate(key); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dateKey(d); };
export function weekStats(history, key) {
  const start = weekStart(key);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return { start, days: dates.filter(date => hasWorkout(history[date])).length, volume: dates.reduce((sum, date) => sum + totalVolume(history, date), 0) };
}
export const format = (value, digits = 0) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
export function readHistory(key) {
  try { const raw = localStorage.getItem(key) || '{}'; if (raw.length > MAX_BACKUP_BYTES) return {}; return validateHistory(JSON.parse(raw), { skipInvalid: true }); } catch { return {}; }
}
export function updateHistory(history, date, change) {
  const day = structuredClone(history[date] || { session: scheduledSession(date), exercises: {} });
  change(day);
  day.updatedAt = new Date().toISOString();
  return { ...history, [date]: day };
}

export function exerciseWeekVolume(history, key, exerciseId) {
  const start = weekStart(key);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index)).reduce((sum, date) => sum + volume(history[date]?.exercises?.[exerciseId]), 0);
}

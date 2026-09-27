import { sessionFor, sessionExercises } from './workout.js';

const comparableSet = set => set.done && Number(set.weight) > 0 && Number(set.reps) > 0;

export function averageSetWork(state) {
  const sets = (state?.sets || []).filter(comparableSet);
  return sets.length ? sets.reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0) / sets.length : null;
}

export function previousCompletedSession(history, date) {
  const session = sessionFor(history, date);
  return Object.keys(history).filter(key => key < date && history[key]?.completion && sessionFor(history, key) === session).sort().pop() || null;
}

export function calculateCompletion(history, date, minutes, bodyWeightKg, finishedAt = new Date().toISOString()) {
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 300) throw new Error('Enter a workout duration from 5 to 300 minutes.');
  if (!Number.isFinite(bodyWeightKg) || bodyWeightKg < 20 || bodyWeightKg > 400) throw new Error('Enter a body weight from 20 to 400 kg.');
  const day = history[date];
  if (!day || day.completion) throw new Error('This workout cannot be finished again.');
  const session = sessionFor(history, date);
  if (!session) throw new Error('Choose a workout session first.');
  const completedSets = sessionExercises(session).flatMap(exercise => day.exercises?.[exercise.id]?.sets || []).filter(set => set.done).length;
  if (!completedSets) throw new Error('Mark at least one set done first.');

  const comparedTo = previousCompletedSession(history, date);
  const previous = history[comparedTo];
  const changes = comparedTo ? sessionExercises(session)
    .filter(exercise => exercise.id !== 'assisted-pull-up')
    .map(exercise => {
      const current = averageSetWork(day.exercises?.[exercise.id]);
      const baseline = averageSetWork(previous.exercises?.[exercise.id]);
      return current !== null && baseline ? Math.max(-100, Math.min(100, (current / baseline - 1) * 100)) : null;
    }).filter(change => change !== null) : [];
  const progressPct = changes.length ? Math.round(changes.reduce((sum, change) => sum + change, 0) / changes.length) : null;
  return {
    finishedAt,
    minutes,
    bodyWeightKg,
    calories: Math.round(3.5 * bodyWeightKg * minutes / 60),
    progressPct,
    comparedTo: changes.length ? comparedTo : null,
    comparedExercises: changes.length,
    completedSets,
  };
}

export const recapMood = completion => completion?.progressPct == null ? 'first' : completion.progressPct > 0 ? 'up' : completion.progressPct < 0 ? 'down' : 'same';

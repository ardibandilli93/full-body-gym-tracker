import { exerciseById } from './exercises';
import type { RoutineDay, WorkoutComparison, WorkoutMetrics, WorkoutSession, WorkoutSet } from './types';

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createSet(): WorkoutSet {
  return { id: createId('set'), weightKg: null, reps: null, seconds: null, complete: false };
}

export function createSession(routineDay: RoutineDay): WorkoutSession {
  const now = new Date().toISOString();
  return {
    id: createId('session'),
    localDate: localDateKey(),
    planDayId: routineDay.id,
    planDayName: routineDay.name,
    status: 'in_progress',
    exercises: routineDay.exerciseIds.map((exerciseId) => {
      const exercise = exerciseById.get(exerciseId);
      return {
        exerciseId,
        sets: Array.from({ length: exercise?.defaultSets ?? 3 }, createSet),
      };
    }),
    caloriesBurned: null,
    notes: '',
    startedAt: now,
    finishedAt: null,
    updatedAt: now,
  };
}

export function metricsFor(session: WorkoutSession): WorkoutMetrics {
  return session.exercises.reduce<WorkoutMetrics>((metrics, entry) => {
    for (const set of entry.sets) {
      if (!set.complete) continue;
      metrics.completedSets += 1;
      metrics.completedReps += set.reps ?? 0;
      metrics.durationSeconds += set.seconds ?? 0;
      metrics.totalVolumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
    }
    return metrics;
  }, { totalVolumeKg: 0, completedSets: 0, completedReps: 0, durationSeconds: 0 });
}

function effortScore(metrics: WorkoutMetrics): number {
  return metrics.totalVolumeKg + metrics.completedReps * 2 + metrics.durationSeconds * 0.5;
}

export function compareWorkout(current: WorkoutSession, previous: WorkoutSession | null): WorkoutComparison {
  const currentMetrics = metricsFor(current);
  if (!previous) return { mood: 'first', changePercent: null, current: currentMetrics, previous: null };

  const previousMetrics = metricsFor(previous);
  const priorScore = effortScore(previousMetrics);
  const currentScore = effortScore(currentMetrics);
  if (priorScore === 0) {
    return { mood: currentScore > 0 ? 'up' : 'same', changePercent: currentScore > 0 ? 100 : 0, current: currentMetrics, previous: previousMetrics };
  }

  const changePercent = ((currentScore - priorScore) / priorScore) * 100;
  const mood = Math.abs(changePercent) < 0.5 ? 'same' : changePercent > 0 ? 'up' : 'down';
  return { mood, changePercent, current: currentMetrics, previous: previousMetrics };
}

export function previousComparableSession(session: WorkoutSession, sessions: WorkoutSession[]): WorkoutSession | null {
  return sessions
    .filter((candidate) => candidate.status === 'complete' && candidate.planDayId === session.planDayId && candidate.id !== session.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
}

import type { RoutineDay, RoutinePlan } from './types';

const updatedAt = new Date(0).toISOString();

const day = (id: string, name: string, exerciseIds: string[], isRest = false): RoutineDay => ({
  id,
  name,
  shortName: name.split(' ')[0] ?? name,
  exerciseIds,
  isRest,
});

export const routineTemplates: RoutinePlan[] = [
  {
    id: 'full-body-3',
    name: '3 Day Full Body',
    description: 'A balanced start with recovery between every session.',
    daysPerWeek: 3,
    isCustom: false,
    updatedAt,
    days: [
      day('full-body-a', 'Full Body A', ['leg-press', 'bench-press', 'lat-pulldown', 'lateral-raise', 'cable-crunch']),
      day('full-body-b', 'Full Body B', ['romanian-deadlift', 'incline-dumbbell-press', 'one-arm-dumbbell-row', 'dumbbell-biceps-curl', 'pallof-press']),
      day('full-body-c', 'Full Body C', ['goblet-squat', 'dumbbell-shoulder-press', 'assisted-pull-up', 'cable-triceps-pushdown', 'plank']),
    ],
  },
  {
    id: 'ppla-4',
    name: '4 Day Push Pull Legs Arms',
    description: 'Focused volume with a dedicated arms session.',
    daysPerWeek: 4,
    isCustom: false,
    updatedAt,
    days: [
      day('push', 'Push', ['bench-press', 'incline-dumbbell-press', 'machine-shoulder-press', 'lateral-raise', 'cable-triceps-pushdown']),
      day('pull', 'Pull', ['pull-up', 'barbell-bent-over-row', 'seated-cable-row', 'reverse-pec-deck', 'preacher-curl']),
      day('legs', 'Legs', ['barbell-back-squat', 'romanian-deadlift', 'walking-lunge', 'seated-leg-curl', 'seated-calf-raise']),
      day('arms-core', 'Arms & Core', ['lying-triceps-extension', 'overhead-triceps-extension', 'dumbbell-biceps-curl', 'hammer-curl', 'cable-crunch']),
    ],
  },
  {
    id: 'upper-lower-core-5',
    name: '5 Day Upper Lower',
    description: 'Two upper, two lower, then a focused core session.',
    daysPerWeek: 5,
    isCustom: false,
    updatedAt,
    days: [
      day('upper-a', 'Upper A', ['bench-press', 'lat-pulldown', 'dumbbell-shoulder-press', 'chest-supported-dumbbell-row', 'cable-triceps-pushdown']),
      day('lower-a', 'Lower A', ['barbell-back-squat', 'romanian-deadlift', 'leg-extension', 'lying-leg-curl', 'standing-calf-raise']),
      day('upper-b', 'Upper B', ['dumbbell-bench-press', 'pull-up', 'barbell-bent-over-row', 'lateral-raise', 'preacher-curl']),
      day('lower-b', 'Lower B', ['hack-squat', 'barbell-hip-thrust', 'walking-lunge', 'seated-leg-curl', 'seated-calf-raise']),
      day('core', 'Core', ['cable-crunch', 'pallof-press', 'plank', 'side-plank', 'ab-wheel-rollout', 'reverse-crunch']),
    ],
  },
];

export function createCustomWeek(): RoutinePlan {
  const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return {
    id: `custom-${Date.now()}`,
    name: 'My Custom Week',
    description: 'Choose training or rest for every day.',
    daysPerWeek: 0,
    isCustom: true,
    updatedAt: new Date().toISOString(),
    days: weekdayNames.map((name, index) => day(`custom-day-${index + 1}`, name, [], true)),
  };
}

export function cloneRoutine(template: RoutinePlan): RoutinePlan {
  return {
    ...template,
    id: `${template.id}-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    days: template.days.map((routineDay) => ({ ...routineDay, exerciseIds: [...routineDay.exerciseIds] })),
  };
}

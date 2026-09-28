export type Gender = 'male' | 'female' | 'other';
export type UnitSystem = 'metric' | 'imperial';
export type WorkoutMode = 'weighted_reps' | 'assisted_reps' | 'bodyweight_reps' | 'duration';
export type SessionStatus = 'in_progress' | 'complete';
export type RecapMood = 'first' | 'up' | 'down' | 'same';

export type UserProfile = {
  id: string;
  preferredName: string;
  gender: Gender;
  age: number;
  unitSystem: UnitSystem;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  mode: WorkoutMode;
  defaultSets: number;
  target: string;
  instructions: string;
};

export type RoutineDay = {
  id: string;
  name: string;
  shortName: string;
  exerciseIds: string[];
  isRest: boolean;
};

export type RoutinePlan = {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  days: RoutineDay[];
  isCustom: boolean;
  updatedAt: string;
};

export type WorkoutSet = {
  id: string;
  weightKg: number | null;
  reps: number | null;
  seconds: number | null;
  complete: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  localDate: string;
  planDayId: string;
  planDayName: string;
  status: SessionStatus;
  exercises: WorkoutExercise[];
  caloriesBurned: number | null;
  notes: string;
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
};

export type WorkoutMetrics = {
  totalVolumeKg: number;
  completedSets: number;
  completedReps: number;
  durationSeconds: number;
};

export type WorkoutComparison = {
  mood: RecapMood;
  changePercent: number | null;
  current: WorkoutMetrics;
  previous: WorkoutMetrics | null;
};

export type AppSnapshot = {
  profile: UserProfile | null;
  activePlan: RoutinePlan | null;
  sessions: WorkoutSession[];
};

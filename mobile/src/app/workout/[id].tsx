import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { exerciseById } from '@/domain/exercises';
import type { WorkoutSession, WorkoutSet } from '@/domain/types';
import { createId, metricsFor } from '@/domain/workout';
import { useApp } from '@/providers/app-provider';
import { palette, radius, spacing } from '@/theme';

function numericValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, saveSession } = useApp();
  const source = sessions.find((item) => item.id === id);
  const [draft, setDraft] = useState<WorkoutSession | null>(source ?? null);
  const [caloriesText, setCaloriesText] = useState(source?.caloriesBurned?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const initialRender = useRef(true);

  useEffect(() => {
    if (!draft) return;
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    const timeout = setTimeout(() => void saveSession(draft), 250);
    return () => clearTimeout(timeout);
  }, [draft, saveSession]);

  const metrics = useMemo(() => draft ? metricsFor(draft) : null, [draft]);
  const totalSets = draft?.exercises.reduce((sum, entry) => sum + entry.sets.length, 0) ?? 0;

  if (!draft) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink }}><AppText>Workout not found.</AppText></View>;
  }

  function patchSet(exerciseId: string, setId: string, changes: Partial<WorkoutSet>) {
    setDraft((current) => current ? ({
      ...current,
      exercises: current.exercises.map((entry) => entry.exerciseId === exerciseId
        ? { ...entry, sets: entry.sets.map((set) => set.id === setId ? { ...set, ...changes } : set) }
        : entry),
    }) : current);
  }

  function addSet(exerciseId: string) {
    setDraft((current) => current ? ({
      ...current,
      exercises: current.exercises.map((entry) => entry.exerciseId === exerciseId
        ? { ...entry, sets: [...entry.sets, { id: createId('set'), weightKg: null, reps: null, seconds: null, complete: false }] }
        : entry),
    }) : current);
  }

  async function finish() {
    if (!metrics?.completedSets) {
      setError('Complete at least one set before finishing.');
      return;
    }
    const calories = numericValue(caloriesText);
    if (!calories || calories <= 0) {
      setError('Add the calories from your watch or gym equipment.');
      return;
    }
    const currentDraft = draft;
    if (!currentDraft) return;
    setFinishing(true);
    const now = new Date().toISOString();
    const finished: WorkoutSession = { ...currentDraft, status: 'complete', caloriesBurned: calories, finishedAt: now, updatedAt: now };
    await saveSession(finished);
    router.replace({ pathname: '/recap/[id]', params: { id: finished.id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink }}>
      <AppScreen contentContainerStyle={{ paddingBottom: 170 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}><AppText variant="heading">‹</AppText></Pressable>
          <View style={{ flex: 1 }}><AppText variant="caption" tone="accent">LIVE WORKOUT</AppText><AppText variant="title">{draft.planDayName}</AppText></View>
          <View style={{ alignItems: 'flex-end' }}><AppText variant="heading" tone="accent">{metrics?.completedSets ?? 0}</AppText><AppText variant="caption" tone="muted">OF {totalSets} SETS</AppText></View>
        </View>

        {draft.exercises.map((entry, exerciseIndex) => {
          const exercise = exerciseById.get(entry.exerciseId);
          if (!exercise) return null;
          const showWeight = exercise.mode === 'weighted_reps' || exercise.mode === 'assisted_reps';
          const showReps = exercise.mode !== 'duration';
          return (
            <Card key={entry.exerciseId} style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: `${palette.lime}18` }}><AppText variant="label" tone="accent">{exerciseIndex + 1}</AppText></View>
                <View style={{ flex: 1, gap: 3 }}><AppText variant="heading">{exercise.name}</AppText><AppText variant="caption" tone="muted">{exercise.target} · {exercise.muscleGroups.join(' / ')}</AppText></View>
              </View>
              <AppText variant="caption" tone="muted">{exercise.instructions}</AppText>

              <View style={{ gap: spacing.sm }}>
                {entry.sets.map((set, setIndex) => (
                  <View key={set.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <View style={{ width: 30 }}><AppText variant="caption" tone="muted">{setIndex + 1}</AppText></View>
                    {showWeight ? (
                      <TextInput
                        accessibilityLabel={exercise.mode === 'assisted_reps' ? 'Assistance kilograms' : 'Weight kilograms'}
                        value={set.weightKg?.toString() ?? ''}
                        onChangeText={(value) => patchSet(entry.exerciseId, set.id, { weightKg: numericValue(value), complete: false })}
                        keyboardType="decimal-pad"
                        placeholder={exercise.mode === 'assisted_reps' ? 'Assist kg' : 'kg'}
                        placeholderTextColor={palette.muted}
                        selectionColor={palette.lime}
                        style={{ flex: 1, height: 48, textAlign: 'center', color: palette.text, backgroundColor: palette.elevated, borderRadius: radius.md, borderWidth: 1, borderColor: set.complete ? palette.lime : palette.line }}
                      />
                    ) : null}
                    {showReps ? (
                      <TextInput
                        accessibilityLabel="Repetitions"
                        value={set.reps?.toString() ?? ''}
                        onChangeText={(value) => patchSet(entry.exerciseId, set.id, { reps: numericValue(value), complete: false })}
                        keyboardType="number-pad"
                        placeholder="reps"
                        placeholderTextColor={palette.muted}
                        selectionColor={palette.lime}
                        style={{ flex: 1, height: 48, textAlign: 'center', color: palette.text, backgroundColor: palette.elevated, borderRadius: radius.md, borderWidth: 1, borderColor: set.complete ? palette.lime : palette.line }}
                      />
                    ) : (
                      <TextInput
                        accessibilityLabel="Duration in seconds"
                        value={set.seconds?.toString() ?? ''}
                        onChangeText={(value) => patchSet(entry.exerciseId, set.id, { seconds: numericValue(value), complete: false })}
                        keyboardType="number-pad"
                        placeholder="seconds"
                        placeholderTextColor={palette.muted}
                        selectionColor={palette.lime}
                        style={{ flex: 1, height: 48, textAlign: 'center', color: palette.text, backgroundColor: palette.elevated, borderRadius: radius.md, borderWidth: 1, borderColor: set.complete ? palette.lime : palette.line }}
                      />
                    )}
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={`${exercise.name}, set ${setIndex + 1}, complete`}
                      accessibilityState={{ checked: set.complete }}
                      onPress={() => patchSet(entry.exerciseId, set.id, { complete: !set.complete })}
                      style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: set.complete ? palette.lime : palette.elevated, borderWidth: 1, borderColor: set.complete ? palette.lime : palette.line }}
                    >
                      <AppText variant="label" style={{ color: set.complete ? palette.ink : palette.muted }}>✓</AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Add a set to ${exercise.name}`} onPress={() => addSet(entry.exerciseId)} hitSlop={10}><AppText variant="label" tone="accent">+ Add set</AppText></Pressable>
            </Card>
          );
        })}

        <Card style={{ gap: spacing.sm }}>
          <AppText variant="heading">Calories burned</AppText>
          <AppText tone="muted">Enter the reading from your watch, cardio machine, or gym equipment.</AppText>
          <TextInput
            accessibilityLabel="Calories burned"
            value={caloriesText}
            onChangeText={setCaloriesText}
            keyboardType="number-pad"
            placeholder="e.g. 420 kcal"
            placeholderTextColor={palette.muted}
            selectionColor={palette.lime}
            style={{ height: 54, color: palette.text, fontSize: 20, fontWeight: '700', backgroundColor: palette.elevated, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: palette.line }}
          />
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <AppText variant="label">Session notes</AppText>
          <TextInput
            accessibilityLabel="Session notes"
            value={draft.notes}
            onChangeText={(notes) => setDraft((current) => current ? { ...current, notes } : current)}
            multiline
            placeholder="Energy, form cues, anything to remember…"
            placeholderTextColor={palette.muted}
            selectionColor={palette.lime}
            style={{ minHeight: 90, color: palette.text, textAlignVertical: 'top' }}
          />
        </Card>
        {error ? <AppText accessibilityLiveRegion="polite" role="alert" tone="danger">{error}</AppText> : null}
      </AppScreen>

      <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: `${palette.panel}F2`, borderWidth: 1, borderColor: palette.line }}>
        <AppButton label="Done for today" loading={finishing} onPress={() => void finish()} />
      </View>
    </View>
  );
}

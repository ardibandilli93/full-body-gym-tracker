import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ExerciseThumbnail } from '@/components/exercise-thumbnail';
import { FormField } from '@/components/form-field';
import { exerciseFilters, exerciseMatchesFilter, exercises, type ExerciseFilter } from '@/domain/exercises';
import { createCustomWeek } from '@/domain/routines';
import type { RoutineDay, RoutinePlan } from '@/domain/types';
import { useApp } from '@/providers/app-provider';
import { palette, radius, spacing } from '@/theme';

function copyPlan(plan: RoutinePlan): RoutinePlan {
  return { ...plan, days: plan.days.map((day) => ({ ...day, exerciseIds: [...day.exerciseIds] })) };
}

export default function CustomRoutineScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const app = useApp();
  const [plan, setPlan] = useState(() => source === 'onboarding' && app.activePlan?.isCustom ? copyPlan(app.activePlan) : createCustomWeek());
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ExerciseFilter>('All');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedDay = plan.days[selectedDayIndex]!;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesQuery = !needle || `${exercise.name} ${exercise.muscleGroups.join(' ')} ${exercise.equipment}`.toLowerCase().includes(needle);
      return matchesQuery && exerciseMatchesFilter(exercise, filter);
    });
  }, [filter, query]);

  if (!app.profile?.onboardingComplete) return <Redirect href="/onboarding" />;

  function updateDay(changes: Partial<RoutineDay>) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day, index) => index === selectedDayIndex ? { ...day, ...changes } : day),
    }));
  }

  function toggleExercise(exerciseId: string) {
    const checked = selectedDay.exerciseIds.includes(exerciseId);
    updateDay({ exerciseIds: checked ? selectedDay.exerciseIds.filter((id) => id !== exerciseId) : [...selectedDay.exerciseIds, exerciseId] });
  }

  async function saveCustomSplit() {
    const trainingDays = plan.days.filter((day) => !day.isRest);
    if (plan.name.trim().length < 2) {
      setError('Give your split a name.');
      return;
    }
    if (trainingDays.length === 0) {
      setError('Choose at least one training day.');
      return;
    }
    if (trainingDays.some((day) => day.exerciseIds.length === 0)) {
      setError('Every training day needs at least one exercise.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await app.savePlan({
        ...plan,
        name: plan.name.trim(),
        description: `${trainingDays.length} training ${trainingDays.length === 1 ? 'day' : 'days'}, built by you.`,
        daysPerWeek: trainingDays.length,
        updatedAt: new Date().toISOString(),
      });
      router.replace('/(tabs)/today');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your custom split.');
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <>
      {error ? <AppText accessibilityLiveRegion="polite" role="alert" tone="danger">{error}</AppText> : null}
      <AppButton label="Save custom split" loading={saving} onPress={() => void saveCustomSplit()} />
    </>
  );

  return (
    <AppScreen scroll={false} footer={footer} contentContainerStyle={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {source !== 'onboarding' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
            <AppText variant="heading">‹</AppText>
          </Pressable>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" tone="accent">CUSTOM SPLIT</AppText>
          <AppText variant="title">Build your week.</AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="heading" tone="accent">{plan.days.filter((day) => !day.isRest).length}</AppText>
          <AppText variant="caption" tone="muted">TRAINING DAYS</AppText>
        </View>
      </View>

      <FormField label="Split name" value={plan.name} onChangeText={(name) => setPlan((current) => ({ ...current, name }))} maxLength={40} returnKeyType="done" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, minHeight: 62, maxHeight: 62 }}
        contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}
      >
        {plan.days.map((day, index) => {
          const selected = selectedDayIndex === index;
          return (
            <Pressable
              key={day.id}
              accessibilityRole="tab"
              accessibilityLabel={`${day.name}, ${day.isRest ? 'rest' : `${day.exerciseIds.length} exercises`}`}
              accessibilityState={{ selected }}
              onPress={() => { setSelectedDayIndex(index); setQuery(''); }}
              style={{
                minWidth: 68,
                minHeight: 60,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                paddingHorizontal: spacing.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selected ? palette.lime : palette.line,
                backgroundColor: selected ? `${palette.lime}16` : palette.panel,
              }}
            >
              <AppText variant="label" tone={selected ? 'accent' : 'primary'}>{day.name.slice(0, 3)}</AppText>
              <AppText variant="caption" tone="muted">{day.isRest ? 'REST' : `${day.exerciseIds.length} MOVES`}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><AppText variant="heading">{selectedDay.name}</AppText></View>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: !selectedDay.isRest }}
          onPress={() => updateDay({ isRest: false })}
          style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: !selectedDay.isRest ? palette.lime : palette.elevated }}
        >
          <AppText variant="label" style={{ color: !selectedDay.isRest ? palette.ink : palette.text }}>Training</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedDay.isRest }}
          onPress={() => updateDay({ isRest: true, exerciseIds: [] })}
          style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: selectedDay.isRest ? palette.lime : palette.elevated }}
        >
          <AppText variant="label" style={{ color: selectedDay.isRest ? palette.ink : palette.text }}>Rest</AppText>
        </Pressable>
      </View>

      {selectedDay.isRest ? (
        <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
          <AppText variant="display">Recover.</AppText>
          <AppText tone="muted" style={{ maxWidth: 320, textAlign: 'center' }}>This day is protected for rest. Pick another day or switch it to Training.</AppText>
        </Card>
      ) : (
        <>
          <TextInput
            accessibilityLabel="Search exercises"
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${exercises.length} exercises`}
            placeholderTextColor={palette.muted}
            selectionColor={palette.lime}
            style={{ height: 48, borderRadius: radius.md, paddingHorizontal: spacing.md, color: palette.text, backgroundColor: palette.panel, borderWidth: 1, borderColor: palette.line }}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, minHeight: 38, maxHeight: 38 }}
            contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}
          >
            {exerciseFilters.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected: filter === item }}
                onPress={() => setFilter(item)}
                style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: filter === item ? palette.lime : palette.elevated }}
              >
                <AppText variant="caption" style={{ color: filter === item ? palette.ink : palette.text }}>{item}</AppText>
              </Pressable>
            ))}
          </ScrollView>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
            ListEmptyComponent={<AppText tone="muted" style={{ textAlign: 'center', padding: spacing.lg }}>No exercises match that search.</AppText>}
            renderItem={({ item }) => {
              const checked = selectedDay.exerciseIds.includes(item.id);
              return (
                <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include ${item.name} on ${selectedDay.name}`} accessibilityState={{ checked }} onPress={() => toggleExercise(item.id)}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderColor: checked ? palette.lime : palette.line }}>
                    <ExerciseThumbnail exerciseId={item.id} size={76} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <AppText variant="label">{item.name}</AppText>
                      <AppText variant="caption" tone="muted">{item.muscleGroups.join(' · ')}</AppText>
                      <AppText variant="caption" tone="accent">{item.equipment} · {item.target}</AppText>
                    </View>
                    <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: checked ? palette.lime : palette.elevated }}>
                      <AppText variant="label" style={{ color: checked ? palette.ink : palette.muted }}>{checked ? '✓' : '+'}</AppText>
                    </View>
                  </Card>
                </Pressable>
              );
            }}
          />
        </>
      )}
    </AppScreen>
  );
}

import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { exercises } from '@/domain/exercises';
import { useApp } from '@/providers/app-provider';
import { palette, radius, spacing } from '@/theme';

export default function EditRoutineDayScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const { activePlan, savePlan } = useApp();
  const day = activePlan?.days.find((item) => item.id === dayId);
  const [isRest, setIsRest] = useState(day?.isRest ?? false);
  const [selected, setSelected] = useState<string[]>(day?.exerciseIds ?? []);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return exercises;
    return exercises.filter((exercise) => `${exercise.name} ${exercise.muscleGroups.join(' ')} ${exercise.equipment}`.toLowerCase().includes(needle));
  }, [query]);

  if (!activePlan || !day) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink }}><AppText>Training day not found.</AppText></View>;
  }

  async function save() {
    const nextDay = { ...day!, isRest, exerciseIds: isRest ? [] : selected };
    await savePlan({ ...activePlan!, days: activePlan!.days.map((item) => item.id === dayId ? nextDay : item), updatedAt: new Date().toISOString() });
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink, paddingTop: 58 }}>
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.md, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}><AppText variant="heading">‹</AppText></Pressable>
          <View style={{ flex: 1 }}><AppText variant="caption" tone="accent">EDIT DAY</AppText><AppText variant="title">{day.name}</AppText></View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}><AppButton label="Training" variant={!isRest ? 'primary' : 'secondary'} onPress={() => setIsRest(false)} /></View>
          <View style={{ flex: 1 }}><AppButton label="Rest" variant={isRest ? 'primary' : 'secondary'} onPress={() => setIsRest(true)} /></View>
        </View>
        {!isRest ? (
          <TextInput
            accessibilityLabel="Search exercises"
            value={query}
            onChangeText={setQuery}
            placeholder="Search 30 exercises"
            placeholderTextColor={palette.muted}
            selectionColor={palette.lime}
            style={{ height: 48, borderRadius: radius.md, paddingHorizontal: spacing.md, color: palette.text, backgroundColor: palette.panel, borderWidth: 1, borderColor: palette.line }}
          />
        ) : null}
      </View>

      {isRest ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm }}>
          <AppText variant="display">Rest.</AppText>
          <AppText tone="muted" style={{ textAlign: 'center' }}>Recovery belongs in the plan. Save this day and come back stronger.</AppText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 110, gap: spacing.sm }}
          renderItem={({ item }) => {
            const checked = selected.includes(item.id);
            return (
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include ${item.name}`} accessibilityState={{ checked }} onPress={() => setSelected((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: checked ? palette.lime : palette.line }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: checked ? palette.lime : palette.elevated }}>
                    <AppText variant="label" style={{ color: checked ? palette.ink : palette.muted }}>{checked ? '✓' : '+'}</AppText>
                  </View>
                  <View style={{ flex: 1 }}><AppText variant="label">{item.name}</AppText><AppText variant="caption" tone="muted">{item.muscleGroups.join(' · ')} · {item.equipment}</AppText></View>
                  <AppText variant="caption" tone="accent">{item.target}</AppText>
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg }}>
        <AppButton label={isRest ? 'Save rest day' : `Save ${selected.length} exercises`} disabled={!isRest && selected.length === 0} onPress={() => void save()} />
      </View>
    </View>
  );
}

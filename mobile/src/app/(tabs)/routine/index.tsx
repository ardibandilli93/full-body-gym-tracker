import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { exerciseById } from '@/domain/exercises';
import { cloneRoutine, routineTemplates } from '@/domain/routines';
import { useApp } from '@/providers/app-provider';
import { palette, radius, spacing } from '@/theme';

export default function RoutineScreen() {
  const { activePlan, savePlan } = useApp();

  return (
    <AppScreen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="accent">ROUTINE</AppText>
        <AppText variant="title">Design the week.</AppText>
        <AppText tone="muted">Choose a routine template or open any day to make it yours.</AppText>
      </View>

      <Card style={{ gap: spacing.sm, borderColor: palette.lime }}>
        <AppText variant="caption" tone="accent">ACTIVE PLAN</AppText>
        <AppText variant="heading">{activePlan?.name ?? 'No plan selected'}</AppText>
        <AppText tone="muted">{activePlan?.description}</AppText>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="heading">Training days</AppText>
        {activePlan?.days.map((day, index) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${day.name}`} key={day.id} onPress={() => router.push({ pathname: '/(tabs)/routine/[dayId]', params: { dayId: day.id } })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: day.isRest ? palette.elevated : `${palette.lime}18` }}>
                <AppText variant="label" tone={day.isRest ? 'muted' : 'accent'}>{index + 1}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="label">{day.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {day.isRest ? 'Rest' : day.exerciseIds.slice(0, 3).map((id) => exerciseById.get(id)?.name).join(' · ')}
                </AppText>
              </View>
              <AppText tone="muted">›</AppText>
            </Card>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="heading">Switch template</AppText>
        {routineTemplates.map((template) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Use ${template.name} routine`} key={template.id} onPress={() => void savePlan(cloneRoutine(template))}>
            <Card style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="label">{template.name}</AppText>
                <AppText variant="caption" tone="accent">{template.daysPerWeek} DAYS</AppText>
              </View>
              <AppText variant="caption" tone="muted">{template.description}</AppText>
            </Card>
          </Pressable>
        ))}
        <AppButton label="Build a custom split" variant="secondary" onPress={() => router.push('/custom-routine?source=routine' as Href)} />
      </View>
    </AppScreen>
  );
}

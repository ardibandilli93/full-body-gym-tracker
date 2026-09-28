import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { exerciseById } from '@/domain/exercises';
import { metricsFor } from '@/domain/workout';
import { useApp } from '@/providers/app-provider';
import { palette, radius, spacing } from '@/theme';

export default function TodayScreen() {
  const { profile, activePlan, sessions, startWorkout } = useApp();
  const trainingDays = activePlan?.days.filter((day) => !day.isRest && day.exerciseIds.length > 0) ?? [];
  const complete = sessions.filter((session) => session.status === 'complete');
  const inProgress = sessions.find((session) => session.status === 'in_progress');
  const suggestedDay = trainingDays[complete.length % Math.max(trainingDays.length, 1)];
  const latest = complete[0];

  async function begin(dayId: string) {
    const id = await startWorkout(dayId);
    router.push({ pathname: '/workout/[id]', params: { id } });
  }

  return (
    <AppScreen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="accent">TODAY</AppText>
        <AppText variant="title">Ready, {profile?.preferredName ?? 'athlete'}?</AppText>
        <AppText tone="muted">A clean session starts with one deliberate set.</AppText>
      </View>

      {inProgress ? (
        <Card style={{ gap: spacing.md, borderColor: palette.lime }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" tone="accent">SESSION IN PROGRESS</AppText>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.lime }} />
          </View>
          <AppText variant="heading">{inProgress.planDayName}</AppText>
          <AppText tone="muted">Your entries are saved on this device after every change.</AppText>
          <AppButton label="Resume workout" onPress={() => router.push({ pathname: '/workout/[id]', params: { id: inProgress.id } })} />
        </Card>
      ) : suggestedDay ? (
        <Card style={{ gap: spacing.md, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -60, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: `${palette.lime}12` }} />
          <AppText variant="caption" tone="accent">NEXT IN YOUR PLAN</AppText>
          <AppText variant="display" style={{ fontSize: 36 }}>{suggestedDay.name}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {suggestedDay.exerciseIds.slice(0, 5).map((id) => (
              <View key={id} style={{ paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: palette.elevated }}>
                <AppText variant="caption">{exerciseById.get(id)?.name ?? id}</AppText>
              </View>
            ))}
          </View>
          <AppButton label="Start workout" onPress={() => void begin(suggestedDay.id)} />
        </Card>
      ) : (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="heading">Build your first training day</AppText>
          <AppText tone="muted">Your custom week currently contains only rest days.</AppText>
          <AppButton label="Open routine" variant="secondary" onPress={() => router.push('/(tabs)/routine')} />
        </Card>
      )}

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="heading">Your week</AppText>
          <AppText variant="caption" tone="muted">{activePlan?.name}</AppText>
        </View>
        {activePlan?.days.map((day) => (
          <Pressable accessibilityRole="button" accessibilityLabel={day.isRest ? `${day.name}, rest day` : `Start ${day.name}`} accessibilityState={{ disabled: day.isRest || day.exerciseIds.length === 0 || Boolean(inProgress) }} key={day.id} disabled={day.isRest || day.exerciseIds.length === 0 || Boolean(inProgress)} onPress={() => void begin(day.id)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: day.isRest ? 0.55 : 1 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: day.isRest ? palette.elevated : `${palette.lime}18` }}>
                <AppText variant="label" tone={day.isRest ? 'muted' : 'accent'}>{day.shortName.slice(0, 2).toUpperCase()}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label">{day.name}</AppText>
                <AppText variant="caption" tone="muted">{day.isRest ? 'Recovery day' : `${day.exerciseIds.length} exercises`}</AppText>
              </View>
              <AppText tone="muted">{day.isRest ? 'Rest' : '›'}</AppText>
            </Card>
          </Pressable>
        ))}
      </View>

      {latest ? (() => {
        const metrics = metricsFor(latest);
        return (
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="muted">LAST SESSION</AppText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View><AppText variant="heading">{latest.planDayName}</AppText><AppText tone="muted">{latest.localDate}</AppText></View>
              <View style={{ alignItems: 'flex-end' }}><AppText variant="heading" tone="accent">{metrics.completedSets}</AppText><AppText variant="caption" tone="muted">SETS</AppText></View>
            </View>
          </Card>
        );
      })() : null}
    </AppScreen>
  );
}

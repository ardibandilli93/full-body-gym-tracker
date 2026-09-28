import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { metricsFor } from '@/domain/workout';
import { useApp } from '@/providers/app-provider';
import { motion, palette, radius, spacing } from '@/theme';

function ProgressBar({ value, max, index }: { value: number; max: number; index: number }) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    progress.value = withDelay(reduceMotion ? 0 : index * 55, withTiming(max > 0 ? value / max : 0, { duration: reduceMotion ? 0 : motion.enter }));
  }, [value, max, index, progress, reduceMotion]);
  const style = useAnimatedStyle(() => ({ width: `${Math.max(3, progress.value * 100)}%` }));
  return <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: palette.elevated }}><Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: palette.lime }, style]} /></View>;
}

export default function ProgressScreen() {
  const { sessions } = useApp();
  const [weekStart] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const complete = sessions.filter((session) => session.status === 'complete');
  const thisWeek = complete.filter((session) => new Date(session.startedAt).getTime() >= weekStart);
  const totalSets = complete.reduce((sum, session) => sum + metricsFor(session).completedSets, 0);
  const totalVolume = complete.reduce((sum, session) => sum + metricsFor(session).totalVolumeKg, 0);
  const recent = complete.slice(0, 8).reverse();
  const recentValues = recent.map((session) => {
    const metrics = metricsFor(session);
    return metrics.totalVolumeKg > 0 ? metrics.totalVolumeKg : metrics.completedSets * 100;
  });
  const maximum = Math.max(...recentValues, 1);

  return (
    <AppScreen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="accent">PROGRESS</AppText>
        <AppText variant="title">Work that adds up.</AppText>
        <AppText tone="muted">Comparisons use the previous session from the same training day.</AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Card style={{ flex: 1, gap: spacing.xs }}><AppText variant="display" tone="accent">{thisWeek.length}</AppText><AppText variant="caption" tone="muted">SESSIONS / 7 DAYS</AppText></Card>
        <Card style={{ flex: 1, gap: spacing.xs }}><AppText variant="display" tone="accent">{complete.length}</AppText><AppText variant="caption" tone="muted">ALL-TIME SESSIONS</AppText></Card>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Card style={{ flex: 1, gap: spacing.xs }}><AppText variant="title">{totalSets}</AppText><AppText variant="caption" tone="muted">SETS LOGGED</AppText></Card>
        <Card style={{ flex: 1, gap: spacing.xs }}><AppText variant="title">{Math.round(totalVolume).toLocaleString()}</AppText><AppText variant="caption" tone="muted">KG VOLUME</AppText></Card>
      </View>

      <Card style={{ gap: spacing.md }}>
        <View><AppText variant="heading">Recent workload</AppText><AppText variant="caption" tone="muted">Last {recent.length || 0} completed sessions</AppText></View>
        {recent.length ? recent.map((session, index) => {
          const metrics = metricsFor(session);
          const value = recentValues[index] ?? 0;
          return (
            <View key={session.id} style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>{session.planDayName}</AppText>
                <AppText variant="caption" tone="muted">{metrics.totalVolumeKg ? `${Math.round(metrics.totalVolumeKg).toLocaleString()} kg` : `${metrics.completedSets} sets`}</AppText>
              </View>
              <ProgressBar value={value} max={maximum} index={index} />
            </View>
          );
        }) : <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}><AppText tone="muted">Complete a workout to draw your first trend.</AppText></View>}
      </Card>

      <View style={{ padding: spacing.md, borderRadius: radius.lg, backgroundColor: `${palette.lime}12` }}>
        <AppText variant="label" tone="accent">A useful comparison</AppText>
        <AppText tone="muted">Volume, reps, and timed core work are combined into a consistent effort score. Calories are shown separately because device estimates vary.</AppText>
      </View>
    </AppScreen>
  );
}

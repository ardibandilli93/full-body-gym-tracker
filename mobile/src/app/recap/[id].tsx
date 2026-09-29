import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { compareWorkout, previousComparableSession } from '@/domain/workout';
import { useApp } from '@/providers/app-provider';
import { palette, spacing } from '@/theme';

const animations = {
  first: require('../../../assets/lottie/first.json'),
  up: require('../../../assets/lottie/up.json'),
  down: require('../../../assets/lottie/down.json'),
  same: require('../../../assets/lottie/same.json'),
};

const messages = {
  first: { eyebrow: 'FIRST MARK SET', title: 'Now you have a baseline.', body: 'The next session has something real to build on.' },
  up: { eyebrow: 'PROGRESS UP', title: 'You moved the line.', body: 'More quality work than last time. Keep the form sharp and let consistency compound.' },
  down: { eyebrow: 'LIGHTER DAY', title: 'You still showed up.', body: 'Today landed below your last matching session. Recover, reset, and give tomorrow a fair chance.' },
  same: { eyebrow: 'STEADY WORK', title: 'The baseline held.', body: 'Consistency counts. We will look for the next small win tomorrow.' },
};

export default function RecapScreen() {
  const reduceMotion = useReducedMotion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useApp();
  const session = sessions.find((item) => item.id === id);
  if (!session) return <View style={{ flex: 1, backgroundColor: palette.ink }} />;

  const comparison = compareWorkout(session, previousComparableSession(session, sessions));
  const copy = messages[comparison.mood];

  return (
    <AppScreen contentContainerStyle={{ paddingTop: spacing.lg, gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: `${palette.lime}0D`, borderWidth: 1, borderColor: `${palette.lime}33` }}>
          <AppText variant="display" tone="accent">✓</AppText>
          <LottieView source={animations[comparison.mood]} autoPlay={!reduceMotion} loop={false} style={{ position: 'absolute', width: 220, height: 220 }} />
        </View>
      </View>
      <View style={{ gap: spacing.sm, alignItems: 'center' }}>
        <AppText variant="caption" tone="accent">{copy.eyebrow}</AppText>
        <AppText variant="display" style={{ textAlign: 'center' }}>{copy.title}</AppText>
        <AppText tone="muted" style={{ textAlign: 'center' }}>{copy.body}</AppText>
      </View>

      <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center', gap: 2 }}><AppText variant="title" tone="accent">{comparison.current.completedSets}</AppText><AppText variant="caption" tone="muted">SETS</AppText></View>
        <View style={{ width: 1, backgroundColor: palette.line }} />
        <View style={{ alignItems: 'center', gap: 2 }}><AppText variant="title" tone="accent">{Math.round(comparison.current.totalVolumeKg).toLocaleString()}</AppText><AppText variant="caption" tone="muted">KG VOLUME</AppText></View>
        <View style={{ width: 1, backgroundColor: palette.line }} />
        <View style={{ alignItems: 'center', gap: 2 }}><AppText variant="title" tone="accent">{session.caloriesBurned ?? '—'}</AppText><AppText variant="caption" tone="muted">KCAL</AppText></View>
      </Card>

      {comparison.changePercent !== null ? (
        <AppText variant="label" tone={comparison.mood === 'down' ? 'muted' : 'accent'} style={{ textAlign: 'center' }}>
          {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent.toFixed(1)}% compared with your previous {session.planDayName} session
        </AppText>
      ) : null}
      <AppButton label="Back to today" onPress={() => router.replace('/(tabs)/today')} />
    </AppScreen>
  );
}

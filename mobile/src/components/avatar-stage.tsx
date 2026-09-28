import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { Gender } from '@/domain/types';
import { palette, radius, spacing } from '@/theme';

import { AppText } from './app-text';

export type AvatarStageProps = {
  gender: Gender;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
};

const ATHLETES = {
  male: {
    lean: require('../../assets/art/athlete-male-lean.png'),
    neutral: require('../../assets/art/athlete-male.png'),
    build: require('../../assets/art/athlete-male-build.png'),
    accent: palette.lime,
    glow: '#95D629',
  },
  female: {
    lean: require('../../assets/art/athlete-female-lean.png'),
    neutral: require('../../assets/art/athlete-female.png'),
    build: require('../../assets/art/athlete-female-build.png'),
    accent: '#E8FF80',
    glow: '#C8EB46',
  },
  other: {
    lean: require('../../assets/art/athlete-other-lean.png'),
    neutral: require('../../assets/art/athlete-other.png'),
    build: require('../../assets/art/athlete-other-build.png'),
    accent: palette.blue,
    glow: '#437BE8',
  },
} as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function bodyGoalProgress(currentWeightKg: number, goalWeightKg: number) {
  const percentageChange = (goalWeightKg - currentWeightKg) / Math.max(currentWeightKg, 1);
  return Math.max(-1, Math.min(1, percentageChange / 0.15));
}

function goalCopy(currentWeightKg: number, goalWeightKg: number) {
  const difference = goalWeightKg - currentWeightKg;
  if (difference < -2) return { label: 'LEAN', detail: `${Math.abs(Math.round(difference))} KG CUT` };
  if (difference > 2) return { label: 'BUILD', detail: `+${Math.round(difference)} KG` };
  return { label: 'HOLD', detail: 'MAINTAIN' };
}

const HEIGHT_TICKS = [0, 1, 2, 3, 4, 5];

export function AvatarStage({ gender, heightCm, currentWeightKg, goalWeightKg }: AvatarStageProps) {
  const heightProgress = useSharedValue(clamp((heightCm - 140) / 80));
  const bodyProgress = useSharedValue(bodyGoalProgress(currentWeightKg, goalWeightKg));
  const idleProgress = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const athlete = ATHLETES[gender];
  const goal = goalCopy(currentWeightKg, goalWeightKg);

  useEffect(() => {
    const target = clamp((heightCm - 140) / 80);
    heightProgress.value = reduceMotion
      ? target
      : withSpring(target, { damping: 18, stiffness: 150, mass: 0.75 });
  }, [heightCm, heightProgress, reduceMotion]);

  useEffect(() => {
    const target = bodyGoalProgress(currentWeightKg, goalWeightKg);
    bodyProgress.value = reduceMotion
      ? target
      : withSpring(target, { damping: 19, stiffness: 112, mass: 0.9 });
  }, [currentWeightKg, goalWeightKg, bodyProgress, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      idleProgress.value = 0;
      return;
    }

    idleProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [idleProgress, reduceMotion]);

  const figureStyle = useAnimatedStyle(() => ({
    width: interpolate(heightProgress.value, [0, 1], [172, 222]),
    height: interpolate(heightProgress.value, [0, 1], [258, 333]),
    transform: [
      { translateY: interpolate(idleProgress.value, [0, 1], [0, -4]) },
    ],
  }));

  const leanStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bodyProgress.value, [-1, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const neutralStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bodyProgress.value, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP),
  }));

  const buildStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bodyProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const auraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(idleProgress.value, [0, 1], [0.48, 0.72]),
    transform: [{ scale: interpolate(idleProgress.value, [0, 1], [0.94, 1.05]) }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: interpolate(idleProgress.value, [0, 0.5, 1], [0.1, 0.42, 0.1]),
    transform: [{ translateY: interpolate(idleProgress.value, [0, 1], [42, 244]) }],
  }));

  return (
    <View
      accessibilityLabel={`Realistic animated ${gender} training avatar at ${heightCm} centimetres, goal ${goalWeightKg} kilograms`}
      style={styles.stage}
    >
      <LinearGradient
        colors={['#182018', '#0A0E0B', '#060807']}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerRow}>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: athlete.accent }]} />
          <AppText variant="caption" tone="muted" style={styles.eyebrow}>BODY PROJECTION</AppText>
        </View>
        <View style={[styles.goalPill, { borderColor: `${athlete.accent}66` }]}>
          <AppText variant="caption" style={[styles.goalText, { color: athlete.accent }]}>{goal.label}</AppText>
          <AppText variant="caption" tone="muted" style={styles.goalDetail}>{goal.detail}</AppText>
        </View>
      </View>

      <View style={styles.visualArea}>
        <View style={styles.heightScale}>
          {HEIGHT_TICKS.map((tick) => (
            <View key={tick} style={styles.tickRow}>
              <View style={[styles.tick, tick % 2 === 0 && styles.tickLong]} />
              {tick === 0 || tick === HEIGHT_TICKS.length - 1 ? (
                <AppText variant="caption" tone="muted" style={styles.tickLabel}>
                  {tick === 0 ? '140' : '220'}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>

        <Animated.View style={[styles.aura, auraStyle]}>
          <LinearGradient colors={[`${athlete.glow}55`, `${athlete.glow}00`]} style={styles.auraFill} />
        </Animated.View>
        <View style={[styles.orbit, { borderColor: `${athlete.accent}26` }]} />
        <View style={[styles.orbit, styles.orbitInner, { borderColor: `${athlete.accent}18` }]} />
        <View style={styles.platformShadow} />
        <View style={[styles.platformEdge, { backgroundColor: `${athlete.accent}66` }]} />

        <Animated.View pointerEvents="none" style={[styles.scanLine, { backgroundColor: athlete.accent }, scanStyle]} />
        <Animated.View style={[styles.figure, figureStyle]}>
          <Animated.View style={[styles.variantLayer, leanStyle]}>
            <Image accessible={false} source={athlete.lean} style={styles.athleteImage} contentFit="contain" />
          </Animated.View>
          <Animated.View style={[styles.variantLayer, neutralStyle]}>
            <Image accessible={false} source={athlete.neutral} style={styles.athleteImage} contentFit="contain" />
          </Animated.View>
          <Animated.View style={[styles.variantLayer, buildStyle]}>
            <Image accessible={false} source={athlete.build} style={styles.athleteImage} contentFit="contain" />
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.measureRow}>
        <View>
          <AppText variant="caption" tone="muted" style={styles.measureLabel}>HEIGHT</AppText>
          <AppText variant="heading" style={styles.measureValue}>
            {heightCm}<AppText variant="label" style={{ color: athlete.accent }}> CM</AppText>
          </AppText>
        </View>
        <View style={styles.measureDivider} />
        <View style={styles.measureRight}>
          <AppText variant="caption" tone="muted" style={styles.measureLabel}>GOAL WEIGHT</AppText>
          <AppText variant="heading" style={styles.measureValue}>
            {goalWeightKg}<AppText variant="label" style={{ color: athlete.accent }}> KG</AppText>
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 410,
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#344036',
    backgroundColor: '#090D0A',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.46,
    shadowRadius: 32,
    elevation: 16,
    paddingTop: spacing.md,
  },
  headerRow: {
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    shadowColor: palette.lime,
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: radius.pill,
    backgroundColor: '#101612CC',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  goalText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  goalDetail: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  visualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -2,
  },
  heightScale: {
    position: 'absolute',
    left: spacing.md,
    top: 30,
    bottom: 28,
    justifyContent: 'space-between',
    zIndex: 4,
  },
  tickRow: {
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tick: {
    width: 8,
    height: 1,
    backgroundColor: '#657066',
  },
  tickLong: {
    width: 14,
    backgroundColor: '#9EA99F',
  },
  tickLabel: {
    fontSize: 8,
    opacity: 0.64,
  },
  aura: {
    position: 'absolute',
    bottom: 14,
    width: 248,
    height: 248,
    borderRadius: 124,
    overflow: 'hidden',
  },
  auraFill: {
    flex: 1,
    borderRadius: 124,
  },
  orbit: {
    position: 'absolute',
    bottom: 11,
    width: 254,
    height: 254,
    borderWidth: 1,
    borderRadius: 127,
  },
  orbitInner: {
    bottom: 31,
    width: 212,
    height: 212,
    borderRadius: 106,
  },
  platformShadow: {
    position: 'absolute',
    bottom: 9,
    width: 190,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: '#000',
    opacity: 0.7,
    transform: [{ scaleY: 0.45 }],
  },
  platformEdge: {
    position: 'absolute',
    bottom: 12,
    width: 124,
    height: 2,
    borderRadius: radius.pill,
  },
  scanLine: {
    position: 'absolute',
    zIndex: 4,
    top: 0,
    width: 204,
    height: 1,
    shadowColor: palette.lime,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  figure: {
    zIndex: 3,
  },
  variantLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  athleteImage: {
    width: '100%',
    height: '100%',
  },
  measureRow: {
    zIndex: 5,
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2B352D',
    backgroundColor: '#0D130FEE',
    paddingHorizontal: spacing.md,
  },
  measureLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  measureValue: {
    fontVariant: ['tabular-nums'],
  },
  measureDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.lg,
    backgroundColor: palette.line,
  },
  measureRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
});

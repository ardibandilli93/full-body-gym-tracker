import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion, palette, radius, spacing } from '@/theme';
import { AppText } from './app-text';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  leading?: React.ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppButton({ label, variant = 'primary', loading, leading, disabled, onPress, ...props }: AppButtonProps) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.025 }],
    opacity: 1 - pressed.value * 0.08,
  }));
  const duration = reduceMotion ? 0 : motion.tap;
  const primary = variant === 'primary';
  const danger = variant === 'danger';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPressIn={() => { pressed.value = withTiming(1, { duration }); }}
      onPressOut={() => { pressed.value = withTiming(0, { duration }); }}
      onPress={(event) => {
        onPress?.(event);
        if (process.env.EXPO_OS !== 'web') {
          void Haptics.impactAsync(primary ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
      }}
      style={[
        {
          minHeight: 54,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? palette.lime : danger ? palette.coral : variant === 'secondary' ? palette.elevated : 'transparent',
          borderWidth: primary || danger || variant === 'ghost' ? 0 : 1,
          borderColor: palette.line,
          opacity: disabled ? 0.45 : 1,
          shadowColor: primary ? palette.lime : danger ? palette.coral : palette.black,
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: primary || danger ? 0.24 : 0.14,
          shadowRadius: primary || danger ? 16 : 12,
          elevation: primary || danger ? 8 : 3,
        },
        animatedStyle,
      ]}
      {...props}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {loading ? <ActivityIndicator color={primary ? palette.ink : palette.text} /> : leading}
        <AppText variant="label" style={{ color: primary || danger ? palette.ink : palette.text }}>
          {label}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}

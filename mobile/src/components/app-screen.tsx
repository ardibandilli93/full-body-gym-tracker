import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, spacing } from '@/theme';

type AppScreenProps = ScrollViewProps & {
  scroll?: boolean;
  /** Pinned to the bottom of the screen, above the home indicator, and lifted with the keyboard. */
  footer?: ReactNode;
};

function ScreenFooter({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, spacing.md);

  return (
    <KeyboardStickyView offset={{ opened: paddingBottom - spacing.sm }}>
      <View
        style={{
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom,
          backgroundColor: palette.ink,
        }}
      >
        {children}
      </View>
    </KeyboardStickyView>
  );
}

function ScreenBackdrop() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <LinearGradient
        colors={['#0F1711', palette.ink, '#050706']}
        locations={[0, 0.38, 1]}
        style={{ position: 'absolute', inset: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          top: -150,
          right: -145,
          width: 310,
          height: 310,
          borderRadius: 155,
          backgroundColor: `${palette.lime}0D`,
          shadowColor: palette.lime,
          shadowOpacity: 0.18,
          shadowRadius: 70,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 160,
          left: -150,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: `${palette.blue}08`,
          shadowColor: palette.blue,
          shadowOpacity: 0.12,
          shadowRadius: 60,
        }}
      />
    </View>
  );
}

export function AppScreen({ children, contentContainerStyle, scroll = true, footer, ...props }: AppScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.ink }} edges={['top']}>
        <ScreenBackdrop />
        <View style={[{ flex: 1, paddingHorizontal: spacing.md }, contentContainerStyle]}>{children}</View>
        {footer ? <ScreenFooter>{footer}</ScreenFooter> : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.ink }} edges={['top']}>
      <ScreenBackdrop />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: footer ? spacing.lg : 120, gap: spacing.md },
          contentContainerStyle,
        ]}
        {...props}
      >
        {children}
      </ScrollView>
      {footer ? <ScreenFooter>{footer}</ScreenFooter> : null}
    </SafeAreaView>
  );
}

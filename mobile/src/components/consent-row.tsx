import { Pressable, View } from 'react-native';

import { palette, radius, spacing } from '@/theme';
import { AppText } from './app-text';

type ConsentRowProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function ConsentRow({ checked, label, onChange }: ConsentRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        minHeight: 48,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          marginTop: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.sm,
          borderWidth: 1.5,
          borderColor: checked ? palette.lime : palette.muted,
          backgroundColor: checked ? palette.lime : 'transparent',
        }}
      >
        {checked ? <AppText variant="label" style={{ color: palette.ink, lineHeight: 19 }}>✓</AppText> : null}
      </View>
      <AppText style={{ flex: 1 }}>{label}</AppText>
    </Pressable>
  );
}

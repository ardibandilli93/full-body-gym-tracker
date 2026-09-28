import { LinearGradient } from 'expo-linear-gradient';
import type { ViewProps } from 'react-native';

import { palette, radius, spacing } from '@/theme';

export function Card({ style, ...props }: ViewProps) {
  return (
    <LinearGradient
      {...props}
      colors={['rgba(25,33,27,0.97)', 'rgba(14,19,15,0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          backgroundColor: palette.panel,
          borderColor: '#303B32',
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.md,
          shadowColor: palette.black,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.26,
          shadowRadius: 22,
          elevation: 8,
        },
        style,
      ]}
    />
  );
}

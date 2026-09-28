import { useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { palette, radius, spacing, typeScale } from '@/theme';
import { AppText } from './app-text';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function FormField({ label, error, style, onFocus, onBlur, accessibilityLabel, ...props }: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={palette.muted}
        selectionColor={palette.lime}
        style={[
          {
            minHeight: 54,
            paddingHorizontal: spacing.md,
            color: palette.text,
            fontSize: typeScale.body,
            backgroundColor: '#0D130F',
            borderWidth: 1,
            borderColor: error ? palette.coral : focused ? `${palette.lime}AA` : palette.line,
            borderRadius: radius.md,
            shadowColor: focused ? palette.lime : palette.black,
            shadowOpacity: focused ? 0.16 : 0,
            shadowRadius: 12,
          },
          style,
        ]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {error ? <AppText accessibilityLiveRegion="polite" role="alert" variant="caption" tone="danger">{error}</AppText> : null}
    </View>
  );
}

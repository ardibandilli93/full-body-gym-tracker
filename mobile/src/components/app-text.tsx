import { Text, type TextProps, type TextStyle } from 'react-native';

import { palette, typeScale } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const variantStyles: Record<Variant, TextStyle> = {
  display: { fontSize: typeScale.display, lineHeight: 46, fontWeight: '900', letterSpacing: -1.5 },
  title: { fontSize: typeScale.title, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  heading: { fontSize: typeScale.heading, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: typeScale.body, lineHeight: 23, fontWeight: '400' },
  label: { fontSize: typeScale.label, lineHeight: 18, fontWeight: '700', letterSpacing: 0.2 },
  caption: { fontSize: typeScale.caption, lineHeight: 16, fontWeight: '600', letterSpacing: 0.3 },
};

type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: 'primary' | 'muted' | 'accent' | 'danger';
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
  const color = tone === 'muted'
    ? palette.muted
    : tone === 'accent'
      ? palette.lime
      : tone === 'danger'
        ? palette.coral
        : palette.text;
  return <Text {...props} style={[variantStyles[variant], { color }, style]} />;
}

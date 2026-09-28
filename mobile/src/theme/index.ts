export const palette = {
  ink: '#080B09',
  panel: '#111612',
  elevated: '#182019',
  line: '#29332B',
  text: '#F4F8F2',
  muted: '#9BA79E',
  lime: '#C7FF4A',
  limeDim: '#7FA62C',
  coral: '#FF7B6B',
  amber: '#FFC45E',
  blue: '#71B7FF',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const colors = {
  background: palette.ink,
  surface: palette.panel,
  elevated: palette.elevated,
  border: palette.line,
  text: palette.text,
  muted: palette.muted,
  tint: palette.lime,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typeScale = {
  display: 42,
  title: 30,
  heading: 22,
  body: 16,
  label: 14,
  caption: 12,
} as const;

export const motion = {
  tap: 120,
  quick: 220,
  enter: 420,
  celebration: 900,
} as const;

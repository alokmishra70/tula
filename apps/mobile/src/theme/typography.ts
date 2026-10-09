import type { TextStyle } from 'react-native';

export const fonts = {
  serif: 'Fraunces_600SemiBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Tabular figures keep changing numbers from jittering. */
export const numeric: TextStyle = { fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] };

/** Upper bound for dynamic type, per the accessibility spec. */
export const MAX_FONT_SCALE = 1.3;

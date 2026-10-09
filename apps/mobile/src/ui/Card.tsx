import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '@/theme';

export type CardVariant = 'default' | 'sunken' | 'accent';

export interface CardProps {
  variant?: CardVariant;
  /** Thin accent stripe on the left edge. */
  accentBorder?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ variant = 'default', accentBorder, children, style }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], accentBorder && styles.accentBorder, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  default: {
    backgroundColor: colors.surface,
    borderWidth: layout.hairline,
    borderColor: colors.line,
  },
  sunken: { backgroundColor: colors.surfaceSunken },
  accent: { backgroundColor: colors.accentSoft },
  accentBorder: { borderLeftWidth: layout.accentBorder, borderLeftColor: colors.accent },
});

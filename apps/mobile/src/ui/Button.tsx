import type { LucideIcon } from './icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, opacity, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'm' | 'l';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

const TEXT_COLOR = { primary: 'onAccent', secondary: 'accent', ghost: 'accent' } as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'm',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        { minHeight: layout.buttonHeight[size] },
        fullWidth && styles.fullWidth,
        pressed && !inactive && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[TEXT_COLOR[variant]]} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon icon={icon} color={TEXT_COLOR[variant]} /> : null}
          <Text variant="bodyStrong" color={TEXT_COLOR[variant]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: {
    borderWidth: layout.hairline,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});

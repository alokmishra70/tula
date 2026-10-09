import { X } from './icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type ChipStatus = 'good' | 'warn' | 'alert';

export interface ChipProps {
  label: string;
  selected?: boolean;
  /** Status chips always carry a word, never colour alone. */
  status?: ChipStatus;
  onPress?: () => void;
  onRemove?: () => void;
}

export function Chip({ label, selected = false, status, onPress, onRemove }: ChipProps) {
  const textColor = status ?? (selected ? 'accent' : 'ink');
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      style={[styles.base, selected && styles.selected, status && styles[status]]}
    >
      <Text variant="caption" color={textColor}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityLabel={`Remove ${label}`}
          hitSlop={spacing.sm}
          style={styles.remove}
        >
          <Icon icon={X} size={spacing.md} color="inkMuted" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: layout.minTouchTarget - spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  selected: { backgroundColor: colors.accentSoft },
  good: { backgroundColor: colors.surface, borderWidth: layout.hairline, borderColor: colors.good },
  warn: { backgroundColor: colors.surface, borderWidth: layout.hairline, borderColor: colors.warn },
  alert: {
    backgroundColor: colors.surface,
    borderWidth: layout.hairline,
    borderColor: colors.alert,
  },
  remove: { marginLeft: spacing.xxs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});

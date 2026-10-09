import { Pressable, StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { colors, layout, radius, spacing } from '@/theme';
import { Text } from './Text';

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.selection();
              onChange(option.value);
            }}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text variant="caption" color={selected ? 'ink' : 'inkMuted'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    padding: spacing.xxs,
  },
  segment: {
    flex: 1,
    minHeight: layout.minTouchTarget - spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: colors.surface },
});

import { StyleSheet, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { colors, layout, radius, spacing } from '@/theme';
import { Text } from './Text';

export type Macro = keyof typeof colors.macro;

const LABELS: Record<Macro, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fibre',
};

export interface MacroBarProps {
  macro: Macro;
  consumed: number;
  target: number;
}

export function MacroBar({ macro, consumed, target }: MacroBarProps) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={`${LABELS[macro]} ${formatNumber(consumed)} of ${formatNumber(target)} grams`}
    >
      <View style={styles.labels}>
        <Text variant="caption" color="inkMuted">
          {LABELS[macro]}
        </Text>
        <Text variant="caption" numeric>
          {formatNumber(consumed)} / {formatNumber(target)} g
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: colors.macro[macro] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxs },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: {
    height: layout.bar.height,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});

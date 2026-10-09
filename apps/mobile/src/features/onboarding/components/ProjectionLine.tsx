import type { Projection } from '@tula/shared';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { formatShortDate } from '@/lib/format';
import { colors, layout, spacing } from '@/theme';
import { Text } from '@/ui';

const WIDTH = 240;
const HEIGHT = 48;
const PAD = layout.sparkline.dot * 2;

/** A small line from today's weight to the target date. */
export function ProjectionLine({ projection }: { projection: Projection }) {
  const { startWeightKg, targetWeightKg, projectedDate } = projection;
  if (targetWeightKg === null || !projectedDate) return null;
  const descending = targetWeightKg < startWeightKg;
  const startY = descending ? PAD : HEIGHT - PAD;
  const endY = descending ? HEIGHT - PAD : PAD;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={`From ${startWeightKg} kg today to ${targetWeightKg} kg around ${formatShortDate(projectedDate)}`}
    >
      <Text variant="caption" color="inkMuted" numeric>
        {startWeightKg} kg
      </Text>
      <Svg width={WIDTH} height={HEIGHT}>
        <Line
          x1={PAD}
          y1={startY}
          x2={WIDTH - PAD}
          y2={endY}
          stroke={colors.accent}
          strokeWidth={layout.iconStroke}
          strokeDasharray="4 4"
        />
        <Circle cx={PAD} cy={startY} r={layout.sparkline.dot} fill={colors.inkMuted} />
        <Circle cx={WIDTH - PAD} cy={endY} r={layout.sparkline.dot + 1} fill={colors.accent} />
      </Svg>
      <Text variant="caption" numeric>
        {targetWeightKg} kg · {formatShortDate(projectedDate)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
});

import type { MarkerStatus } from '@tula/shared';
import { StyleSheet, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { colors, layout, radius, spacing } from '@/theme';
import { Text } from './Text';

export interface RangeBarProps {
  value: number;
  low: number | null;
  high: number | null;
  status: MarkerStatus;
  unit: string;
}

const DOT_COLOR: Record<MarkerStatus, string> = {
  low: colors.warn,
  high: colors.warn,
  critical: colors.alert,
  in_range: colors.good,
  unclassified: colors.inkFaint,
};

/** Computes a display domain that always contains the range and the value with some margin. */
export function rangeDomain(value: number, low: number | null, high: number | null) {
  const lo = low ?? 0;
  const hi = high ?? lo * 2;
  const span = Math.max(hi - lo, Math.abs(value) * 0.2, 1);
  const min = Math.max(0, Math.min(value, lo) - span * 0.5);
  const max = Math.max(value, hi) + span * 0.5;
  const at = (v: number) => ((v - min) / (max - min)) * 100;
  return {
    lowPct: low === null ? 0 : at(low),
    highPct: high === null ? 100 : at(high),
    valuePct: at(value),
  };
}

export function RangeBar({ value, low, high, status, unit }: RangeBarProps) {
  const { lowPct, highPct, valuePct } = rangeDomain(value, low, high);
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={`Value ${formatNumber(value, 1)} ${unit}. Healthy range ${low ?? 'none'} to ${high ?? 'none'}.`}
    >
      <View style={styles.track}>
        <View style={[styles.normal, { left: `${lowPct}%`, width: `${highPct - lowPct}%` }]} />
        <View style={[styles.dot, { left: `${valuePct}%`, backgroundColor: DOT_COLOR[status] }]} />
      </View>
      <View style={styles.labels}>
        <Text
          variant="caption"
          color="inkFaint"
          numeric
          style={[styles.label, { left: `${lowPct}%` }]}
        >
          {low ?? ''}
        </Text>
        <Text
          variant="caption"
          color="inkFaint"
          numeric
          style={[styles.label, { left: `${highPct}%` }]}
        >
          {high ?? ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxs, paddingVertical: spacing.xxs },
  track: {
    height: layout.bar.height,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'center',
  },
  normal: { position: 'absolute', height: '100%', backgroundColor: colors.accentSoft },
  dot: {
    position: 'absolute',
    width: layout.bar.dot,
    height: layout.bar.dot,
    marginLeft: -layout.bar.dot / 2,
    borderRadius: radius.pill,
    borderWidth: layout.dotBorder,
    borderColor: colors.surface,
  },
  labels: { height: spacing.md },
  label: { position: 'absolute', transform: [{ translateX: -spacing.xs }] },
});

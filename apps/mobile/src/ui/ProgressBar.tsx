import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export function ProgressBar({
  progress,
  accessibilityLabel,
}: {
  progress: number;
  accessibilityLabel: string;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
});

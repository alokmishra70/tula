import { Pressable, StyleSheet, View } from 'react-native';
import { formatDayHeader, formatNumber, greeting } from '@/lib/format';
import { spacing } from '@/theme';
import { Flame, Icon, Text } from '@/ui';

export interface TodayHeaderProps {
  date: string;
  name: string;
  targetKcal: number;
  consumedKcal: number;
  streak: number;
  onOpenPlan: () => void;
}

export function TodayHeader({
  date,
  name,
  targetKcal,
  consumedKcal,
  streak,
  onOpenPlan,
}: TodayHeaderProps) {
  const subline =
    consumedKcal === 0
      ? `${formatNumber(targetKcal)} kcal to play with today.`
      : `${formatNumber(consumedKcal)} of ${formatNumber(targetKcal)} kcal so far.`;
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text variant="caption" color="inkMuted">
          {formatDayHeader(date)}
        </Text>
        {streak > 0 ? (
          <View style={styles.streak} accessible accessibilityLabel={`${streak} day streak`}>
            <Icon icon={Flame} color="accent" size={spacing.md + spacing.xxs} />
            <Text variant="bodyStrong" numeric>
              {streak}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="title" accessibilityRole="header">
        {greeting(new Date().getHours(), name)}
      </Text>
      <Pressable
        onPress={onOpenPlan}
        accessibilityRole="button"
        accessibilityHint="Opens your plan"
        hitSlop={spacing.xs}
      >
        <Text variant="body" color="inkMuted">
          {subline}{' '}
          <Text variant="body" color="accent">
            Plan
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxs, paddingTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});

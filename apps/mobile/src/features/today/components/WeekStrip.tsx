import type { TodayResponse } from '@tula/shared';
import { StyleSheet, View } from 'react-native';
import { colors, layout, radius, spacing } from '@/theme';
import { Card, Text } from '@/ui';

const INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOT = layout.bar.dot;

const weekday = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export function WeekStrip({ week }: { week: TodayResponse['week'] }) {
  const onTarget = week.filter((day) => day.onTarget).length;
  return (
    <Card>
      <View style={styles.header}>
        <Text variant="heading">This week</Text>
        <Text variant="caption" color="inkMuted">
          {onTarget} of 7 on target
        </Text>
      </View>
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`${onTarget} of the last 7 days on target`}
      >
        {week.map((day) => (
          <View key={day.date} style={styles.day}>
            <View
              style={[
                styles.dot,
                day.onTarget
                  ? styles.filled
                  : day.onTarget === false
                    ? styles.missed
                    : styles.empty,
              ]}
            />
            <Text variant="caption" color="inkFaint">
              {INITIALS[weekday(day.date)]}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: spacing.xxs },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
  filled: { backgroundColor: colors.accent },
  missed: { borderWidth: layout.dotBorder, borderColor: colors.line },
  empty: { backgroundColor: colors.surfaceSunken },
});

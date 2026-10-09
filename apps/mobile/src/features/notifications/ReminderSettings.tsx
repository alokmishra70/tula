import { StyleSheet, Switch, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Card, Text } from '@/ui';
import { useReminderPrefs, type ReminderPrefs } from './prefs-store';

const ROWS: Array<{ key: keyof ReminderPrefs; label: string; detail: string }> = [
  { key: 'mealReminders', label: 'Meal reminders', detail: 'Only when a meal is not logged yet' },
  { key: 'eveningRecap', label: 'Evening recap', detail: 'At 9 pm, with one tip for tomorrow' },
  { key: 'weeklySummary', label: 'Sunday summary', detail: 'Days on target and one thing to try' },
];

export function ReminderSettings() {
  const prefs = useReminderPrefs();
  return (
    <Card>
      <Text variant="heading">Reminders</Text>
      <Text variant="caption" color="inkMuted">
        At most three a day.
      </Text>
      {ROWS.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.text}>
            <Text variant="body">{row.label}</Text>
            <Text variant="caption" color="inkMuted">
              {row.detail}
            </Text>
          </View>
          <Switch
            value={prefs[row.key]}
            onValueChange={() => prefs.toggle(row.key)}
            trackColor={{ true: colors.accent, false: colors.line }}
            accessibilityLabel={row.label}
          />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  text: { flex: 1 },
});

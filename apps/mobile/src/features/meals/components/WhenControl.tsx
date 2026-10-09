import { StyleSheet, View } from 'react-native';
import { formatTime } from '@/lib/dates';
import { spacing } from '@/theme';
import { NumberStepper, SegmentedControl, Text } from '@/ui';

const HALF_HOUR_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type Day = 'today' | 'yesterday';
const DAYS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
] as const;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Late logging: earlier today or yesterday, in half-hour steps. Future times are not allowed. */
export function WhenControl({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const now = new Date();
  const day: Day =
    startOfDay(value).getTime() === startOfDay(now).getTime() ? 'today' : 'yesterday';
  const slot = Math.round((value.getTime() - startOfDay(value).getTime()) / HALF_HOUR_MS);
  const maxSlot =
    day === 'today' ? Math.floor((now.getTime() - startOfDay(now).getTime()) / HALF_HOUR_MS) : 47;

  const setDay = (next: Day) => {
    const shift = next === day ? 0 : next === 'yesterday' ? -DAY_MS : DAY_MS;
    const moved = new Date(value.getTime() + shift);
    onChange(moved > now ? now : moved);
  };

  return (
    <View style={styles.root}>
      <SegmentedControl
        options={DAYS}
        value={day}
        onChange={setDay}
        accessibilityLabel="Day eaten"
      />
      <NumberStepper
        label={`Time · ${formatTime(value)}`}
        value={slot}
        unit=""
        min={0}
        max={maxSlot}
        onChange={(next) => onChange(new Date(startOfDay(value).getTime() + next * HALF_HOUR_MS))}
      />
      <Text variant="caption" color="inkFaint">
        Logging an earlier meal? Pick the day and time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
});

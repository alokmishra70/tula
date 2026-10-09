import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { colors, layout, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Minus, Plus, type LucideIcon } from './icons';
import { Text } from './Text';

const REPEAT_DELAY_MS = 350;
const REPEAT_INTERVAL_MS = 70;

export interface NumberStepperProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/** Numeric input without a keyboard; hold a button to keep stepping. */
export function NumberStepper({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: NumberStepperProps) {
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const change = (direction: 1 | -1) => {
    const next = Math.min(
      max,
      Math.max(min, Math.round((latest.current + direction * step) * 10) / 10),
    );
    if (next === latest.current) return;
    latest.current = next;
    onChange(next);
  };

  return (
    <View style={styles.root}>
      <Text variant="caption" color="inkMuted">
        {label}
      </Text>
      <View style={styles.row}>
        <RepeatButton
          icon={Minus}
          label={`Decrease ${label}`}
          disabled={value <= min}
          onStep={() => change(-1)}
        />
        <Text
          variant="title"
          numeric
          style={styles.value}
          accessibilityLabel={`${label} ${value} ${unit}`}
          accessibilityLiveRegion="polite"
        >
          {value}{' '}
          <Text variant="body" color="inkMuted">
            {unit}
          </Text>
        </Text>
        <RepeatButton
          icon={Plus}
          label={`Increase ${label}`}
          disabled={value >= max}
          onStep={() => change(1)}
        />
      </View>
    </View>
  );
}

function RepeatButton({
  icon,
  label,
  disabled,
  onStep,
}: {
  icon: LucideIcon;
  label: string;
  disabled: boolean;
  onStep: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    clearTimeout(timer.current ?? undefined);
    clearInterval(timer.current ?? undefined);
    timer.current = null;
  };
  useEffect(() => stop, []);

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPressIn={() => {
        haptics.selection();
        onStep();
        timer.current = setTimeout(() => {
          timer.current = setInterval(onStep, REPEAT_INTERVAL_MS);
        }, REPEAT_DELAY_MS);
      }}
      onPressOut={stop}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Icon icon={icon} color={disabled ? 'inkFaint' : 'ink'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: layout.hairline,
    borderColor: colors.line,
  },
  value: { flex: 1, textAlign: 'center' },
  button: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { backgroundColor: colors.bg },
});

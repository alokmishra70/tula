import type { PortionUnit } from '@tula/shared';
import { Minus, Plus } from './icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { colors, layout, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export const PORTION_STEP = 0.5;
const MIN = PORTION_STEP;
const MAX = 20;

const UNIT_LABELS: Record<PortionUnit, [singular: string, plural: string]> = {
  katori: ['katori', 'katoris'],
  roti: ['roti', 'rotis'],
  piece: ['piece', 'pieces'],
  glass: ['glass', 'glasses'],
  plate: ['plate', 'plates'],
  bowl: ['bowl', 'bowls'],
  cup: ['cup', 'cups'],
  slice: ['slice', 'slices'],
  tbsp: ['tbsp', 'tbsp'],
  serving: ['serving', 'servings'],
  g: ['g', 'g'],
  ml: ['ml', 'ml'],
};

/** 1.5 -> "1½", 0.5 -> "½" */
export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity);
  const half = quantity - whole >= PORTION_STEP;
  if (!half) return String(whole);
  return whole === 0 ? '½' : `${whole}½`;
}

export function unitLabel(unit: PortionUnit, quantity: number): string {
  const [singular, plural] = UNIT_LABELS[unit];
  return quantity > 1 ? plural : singular;
}

export interface PortionStepperProps {
  value: number;
  unit: PortionUnit;
  onChange: (value: number) => void;
  itemName: string;
}

export function PortionStepper({ value, unit, onChange, itemName }: PortionStepperProps) {
  const change = (delta: number) => {
    const next = Math.min(MAX, Math.max(MIN, value + delta));
    if (next === value) return;
    haptics.selection();
    onChange(next);
  };
  return (
    <View style={styles.root}>
      <StepButton
        icon={Minus}
        label={`Less ${itemName}`}
        disabled={value <= MIN}
        onPress={() => change(-PORTION_STEP)}
      />
      <Text
        variant="bodyStrong"
        numeric
        style={styles.value}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${value} ${unitLabel(unit, value)}`}
      >
        {formatQuantity(value)} {unitLabel(unit, value)}
      </Text>
      <StepButton
        icon={Plus}
        label={`More ${itemName}`}
        disabled={value >= MAX}
        onPress={() => change(PORTION_STEP)}
      />
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: typeof Plus;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={spacing.xxs}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Icon
        icon={icon}
        size={layout.iconSize - spacing.xxs}
        color={disabled ? 'inkFaint' : 'ink'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  value: { minWidth: spacing.xxxl + spacing.xxl, textAlign: 'center' },
  button: {
    width: layout.stepperButton,
    height: layout.stepperButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { backgroundColor: colors.bg },
});

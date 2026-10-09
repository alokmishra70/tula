import { ONBOARDING_BOUNDS, type Sex } from '@tula/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';
import { needsTargetWeight, StepLayout, useOnboarding } from '@/features/onboarding';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Button, NumberStepper, SegmentedControl, Text } from '@/ui';

const SEXES = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const;
const { age, heightCm, weightKg } = ONBOARDING_BOUNDS;
const DEFAULT_LOSS_KG = 5;
const DEFAULT_GAIN_KG = 3;

export default function BasicsStep() {
  const router = useRouter();
  const { draft, update, goTo } = useOnboarding();
  const wantsTarget = needsTargetWeight(draft.goalType);
  const losing = draft.goalType === 'lose_weight';
  const target =
    draft.targetWeightKg ?? draft.weightKg + (losing ? -DEFAULT_LOSS_KG : DEFAULT_GAIN_KG);
  const targetInvalid =
    wantsTarget && (losing ? target >= draft.weightKg : target <= draft.weightKg);
  const nameMissing = draft.name.trim().length === 0;

  const next = () => {
    if (wantsTarget) update({ targetWeightKg: target });
    goTo('activity');
    router.push('/activity');
  };

  return (
    <StepLayout
      step="basics"
      question="A little about you"
      footer={
        <Button
          label="Next"
          size="l"
          fullWidth
          disabled={nameMissing || targetInvalid}
          onPress={next}
        />
      }
    >
      <View style={styles.field}>
        <Text variant="caption" color="inkMuted">
          Name
        </Text>
        <TextInput
          value={draft.name}
          onChangeText={(name) => update({ name })}
          placeholder="What should I call you?"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="words"
          maxLength={40}
          accessibilityLabel="Name"
          style={styles.input}
        />
      </View>
      <SegmentedControl
        options={SEXES}
        value={draft.sex}
        onChange={(sex: Sex) => update({ sex })}
        accessibilityLabel="Sex"
      />
      <NumberStepper
        label="Age"
        unit="years"
        value={draft.age}
        min={age.min}
        max={age.max}
        onChange={(v) => update({ age: v })}
      />
      <NumberStepper
        label="Height"
        unit="cm"
        value={draft.heightCm}
        min={heightCm.min}
        max={heightCm.max}
        onChange={(v) => update({ heightCm: v })}
      />
      <NumberStepper
        label="Weight"
        unit="kg"
        step={0.5}
        value={draft.weightKg}
        min={weightKg.min}
        max={weightKg.max}
        onChange={(v) => update({ weightKg: v })}
      />
      {wantsTarget ? (
        <>
          <NumberStepper
            label="Target weight"
            unit="kg"
            step={0.5}
            value={target}
            min={weightKg.min}
            max={weightKg.max}
            onChange={(v) => update({ targetWeightKg: v })}
          />
          {targetInvalid ? (
            <Text variant="caption" color="alert">
              {losing
                ? 'Target should be below your current weight.'
                : 'Target should be above your current weight.'}
            </Text>
          ) : null}
        </>
      ) : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    ...typography.body,
    minHeight: layout.buttonHeight.m,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    color: colors.ink,
  },
});

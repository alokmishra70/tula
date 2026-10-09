import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { ReminderSettings } from '@/features/notifications';
import { PlanView, useOnboarding, usePlan, useProfile } from '@/features/onboarding';
import { spacing } from '@/theme';
import { ArrowLeft, Button, Icon, Screen, Skeleton } from '@/ui';

export default function PlanScreen() {
  const router = useRouter();
  const plan = usePlan();
  const profile = useProfile();
  const start = useOnboarding((state) => state.start);

  const editPlan = () => {
    if (!profile.data || !plan.data) return;
    const { name, sex, age, heightCm, weightKg, activityLevel } = profile.data;
    start('edit', {
      goalType: plan.data.goalType,
      name,
      sex,
      age,
      heightCm,
      weightKg,
      activityLevel,
      targetWeightKg: plan.data.projection.targetWeightKg,
    });
    router.push('/goal');
  };

  return (
    <Screen
      header={
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={spacing.sm}
          style={styles.back}
        >
          <Icon icon={ArrowLeft} />
        </Pressable>
      }
      title="Your plan"
    >
      {plan.data ? (
        <PlanView plan={plan.data}>
          <Button
            label="Change goal or details"
            variant="secondary"
            onPress={editPlan}
            disabled={!profile.data}
          />
        </PlanView>
      ) : (
        <Skeleton height={spacing.xxxl * 2} />
      )}
      <ReminderSettings />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { paddingTop: spacing.md, alignSelf: 'flex-start' },
});

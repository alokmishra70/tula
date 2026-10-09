import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useLogFlow } from '@/features/meals';
import { requestNotificationPermission } from '@/features/notifications';
import { PlanView, useOnboarding, usePlan } from '@/features/onboarding';
import { track } from '@/lib/analytics';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';
import { Button, Screen, Skeleton, Text } from '@/ui';

export default function YourPlanScreen() {
  const router = useRouter();
  const plan = usePlan();
  const { startedAt, draft, reportId, reset } = useOnboarding();

  const begin = () => {
    void track({
      name: 'onboarding_completed',
      props: {
        seconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
        goal: draft.goalType ?? 'maintain',
        withReport: reportId !== null,
      },
    });
    useSession.getState().setOnboarded(true);
    reset();
    void requestNotificationPermission();
    router.replace('/today');
    useLogFlow.getState().openLog();
  };

  return (
    <Screen
      footer={
        <Button
          label="Log my first meal"
          size="l"
          fullWidth
          onPress={begin}
          disabled={!plan.data}
        />
      }
    >
      {plan.data ? (
        <PlanView plan={plan.data}>
          <View style={styles.how}>
            <Text variant="heading">Just photograph your meals. I&apos;ll do the maths.</Text>
          </View>
        </PlanView>
      ) : (
        <View style={styles.loading}>
          <Skeleton height={spacing.xxxl} width="80%" />
          <Skeleton height={spacing.xxxl * 2} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  how: { paddingTop: spacing.sm },
  loading: { gap: spacing.md, paddingTop: spacing.xxxl },
});

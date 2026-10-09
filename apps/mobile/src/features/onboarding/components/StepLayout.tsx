import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { ArrowLeft, Icon, ProgressBar, Screen, Text } from '@/ui';
import { ONBOARDING_STEPS, type OnboardingStep } from '../onboarding-store';

export interface StepLayoutProps {
  step: OnboardingStep;
  question: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const QUESTION_STEPS = ONBOARDING_STEPS.length - 1;

export function StepLayout({ step, question, hint, children, footer }: StepLayoutProps) {
  const router = useRouter();
  const index = ONBOARDING_STEPS.indexOf(step);
  return (
    <Screen
      footer={footer}
      header={
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={spacing.sm}
          >
            <Icon icon={ArrowLeft} />
          </Pressable>
          <View style={styles.progress}>
            <ProgressBar
              progress={index / QUESTION_STEPS}
              accessibilityLabel={`Step ${index} of ${QUESTION_STEPS}`}
            />
          </View>
        </View>
      }
    >
      <Text variant="title" accessibilityRole="header" style={styles.question}>
        {question}
      </Text>
      {hint ? (
        <Text variant="body" color="inkMuted">
          {hint}
        </Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  progress: { flex: 1 },
  question: { marginTop: spacing.xl },
  body: { gap: spacing.sm, marginTop: spacing.md },
});

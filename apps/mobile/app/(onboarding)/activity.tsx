import type { ActivityLevel } from '@tula/shared';
import { useRouter } from 'expo-router';
import {
  OptionCard,
  StepLayout,
  useAutoAdvance,
  useCreatePlan,
  useOnboarding,
  useSaveProfile,
} from '@/features/onboarding';
import { Text } from '@/ui';

const LEVELS: Array<{ value: ActivityLevel; title: string; description: string }> = [
  { value: 'sedentary', title: 'Mostly sitting', description: 'Desk job, little walking' },
  { value: 'light', title: 'On my feet', description: 'Walking or standing much of the day' },
  { value: 'moderate', title: 'Exercise 3 to 4 days', description: 'Gym, sport or brisk walks' },
  {
    value: 'very_active',
    title: 'Very active',
    description: 'Training most days or physical work',
  },
];

export default function ActivityStep() {
  const router = useRouter();
  const { draft, mode, update, goTo } = useOnboarding();
  const saveProfile = useSaveProfile();
  const createPlan = useCreatePlan();
  const advance = useAutoAdvance();
  const failed = saveProfile.isError || createPlan.isError;

  const finish = async (activityLevel: ActivityLevel) => {
    const next = { ...draft, activityLevel };
    await saveProfile.mutateAsync(next);
    if (mode === 'edit') {
      await createPlan.mutateAsync(next);
      useOnboarding.getState().reset();
      router.replace('/plan');
      return;
    }
    goTo('report');
    router.push('/report');
  };

  return (
    <StepLayout step="activity" question="How active is a usual day?">
      {LEVELS.map((level) => (
        <OptionCard
          key={level.value}
          title={level.title}
          description={level.description}
          selected={draft.activityLevel === level.value}
          onSelect={() => {
            update({ activityLevel: level.value });
            advance(() => void finish(level.value).catch(() => undefined));
          }}
        />
      ))}
      {failed ? (
        <Text variant="caption" color="alert" accessibilityRole="alert">
          Couldn&apos;t save that. Check your connection and tap your choice again.
        </Text>
      ) : null}
    </StepLayout>
  );
}

import type { GoalType } from '@tula/shared';
import { useRouter } from 'expo-router';
import { OptionCard, StepLayout, useAutoAdvance, useOnboarding } from '@/features/onboarding';

const GOALS: Array<{ value: GoalType; title: string; description: string }> = [
  { value: 'lose_weight', title: 'Lose weight', description: 'Steady, about half a kilo a week' },
  { value: 'maintain', title: 'Maintain', description: 'Eat well and stay where I am' },
  { value: 'build_muscle', title: 'Build muscle', description: 'More protein, a small surplus' },
  {
    value: 'improve_marker',
    title: 'Improve a health marker',
    description: 'Cholesterol, sugar, vitamins',
  },
];

export default function GoalStep() {
  const router = useRouter();
  const { draft, update, goTo } = useOnboarding();
  const advance = useAutoAdvance();
  return (
    <StepLayout step="goal" question="What would you like to work on?">
      {GOALS.map((goal) => (
        <OptionCard
          key={goal.value}
          title={goal.title}
          description={goal.description}
          selected={draft.goalType === goal.value}
          onSelect={() => {
            update({ goalType: goal.value });
            advance(() => {
              goTo('basics');
              router.push('/basics');
            });
          }}
        />
      ))}
    </StepLayout>
  );
}

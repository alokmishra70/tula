import type { NudgeContext, NudgeProposal, NudgeRule } from '../nudge-rule';

const FROM_HOUR = 20;
const MIN_STREAK = 2;

export class StreakProtectionRule implements NudgeRule {
  readonly id = 'streak_protection';
  readonly priority = 80;

  evaluate({ clock, streakDays, onTarget, loggedMealTypes }: NudgeContext): NudgeProposal | null {
    if (clock.hour < FROM_HOUR || streakDays < MIN_STREAK) return null;
    if (onTarget || loggedMealTypes.has('dinner')) return null;
    return {
      action: 'log_meal',
      actionLabel: 'Log dinner',
      mealType: 'dinner',
      facts: { streakDays },
      fallbackMessage: `Log dinner to keep your ${streakDays}-day streak.`,
    };
  }
}

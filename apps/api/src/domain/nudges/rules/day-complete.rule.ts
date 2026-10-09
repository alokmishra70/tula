import type { MealType } from '@tula/shared';
import type { NudgeContext, NudgeProposal, NudgeRule } from '../nudge-rule';

const MAIN_MEALS: readonly MealType[] = ['breakfast', 'lunch', 'dinner'];

export class DayCompleteRule implements NudgeRule {
  readonly id = 'day_complete';
  readonly priority = 90;

  evaluate({ loggedMealTypes, onTarget }: NudgeContext): NudgeProposal | null {
    if (!onTarget || !MAIN_MEALS.every((meal) => loggedMealTypes.has(meal))) return null;
    return {
      action: 'none',
      actionLabel: null,
      mealType: null,
      facts: {},
      fallbackMessage: 'Day complete. Same again tomorrow.',
    };
  }
}

import { guessMealType } from '@tula/shared';
import type { NudgeContext, NudgeProposal, NudgeRule } from '../nudge-rule';

export class FirstMealRule implements NudgeRule {
  readonly id = 'first_meal';
  readonly priority = 100;

  evaluate({ hasEverLogged, clock }: NudgeContext): NudgeProposal | null {
    if (hasEverLogged) return null;
    return {
      action: 'log_meal',
      actionLabel: 'Snap a meal',
      mealType: guessMealType(clock.hour),
      facts: {},
      fallbackMessage: "Photograph your first meal and I'll start learning your habits.",
    };
  }
}

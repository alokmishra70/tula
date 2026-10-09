import { MEAL_REMINDER_TIMES, MEAL_TYPES, type MealType } from '@tula/shared';
import { minutesOfDay, type NudgeContext, type NudgeProposal, type NudgeRule } from '../nudge-rule';

const REMINDED_MEALS = Object.keys(MEAL_REMINDER_TIMES) as Array<keyof typeof MEAL_REMINDER_TIMES>;
const LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
};

export class MissingMealRule implements NudgeRule {
  readonly id = 'missing_meal';
  readonly priority = 70;

  evaluate({ clock, loggedMealTypes }: NudgeContext): NudgeProposal | null {
    const now = minutesOfDay(clock);
    const overdue = REMINDED_MEALS.filter(
      (meal) => now >= minutesOfDay(MEAL_REMINDER_TIMES[meal]),
    ).at(-1);
    if (!overdue || loggedMealTypes.has(overdue)) return null;

    // A later meal already logged means the user has moved on; don't nag backwards.
    const laterLogged = MEAL_TYPES.slice(MEAL_TYPES.indexOf(overdue) + 1).some((meal) =>
      loggedMealTypes.has(meal),
    );
    if (laterLogged) return null;

    return {
      action: 'log_meal',
      actionLabel: `Add ${overdue}`,
      mealType: overdue,
      facts: { meal: overdue },
      fallbackMessage: `${LABEL[overdue]} not logged yet. Snap it now?`,
    };
  }
}

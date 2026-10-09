import type { DailySummary, Macros, Meal, TodayResponse } from '@tula/shared';

const add = (a: Macros, b: Macros, sign: 1 | -1 = 1): Macros => ({
  kcal: Math.max(0, a.kcal + sign * b.kcal),
  proteinG: Math.max(0, a.proteinG + sign * b.proteinG),
  carbsG: Math.max(0, a.carbsG + sign * b.carbsG),
  fatG: Math.max(0, a.fatG + sign * b.fatG),
  fiberG: Math.max(0, a.fiberG + sign * b.fiberG),
});

const byTime = (a: Meal, b: Meal) => a.eatenAt.localeCompare(b.eatenAt);

/** Pure updates for the cached Today response, so the ring moves before the server answers. */
export const todayCache = {
  addMeal(today: TodayResponse, meal: Meal): TodayResponse {
    return {
      ...today,
      meals: [...today.meals.filter((m) => m.id !== meal.id), meal].sort(byTime),
      summary: {
        ...today.summary,
        consumed: add(today.summary.consumed, meal.totals),
        mealsCount: today.summary.mealsCount + 1,
      },
    };
  },

  removeMeal(today: TodayResponse, mealId: string): TodayResponse {
    const meal = today.meals.find((m) => m.id === mealId);
    if (!meal) return today;
    return {
      ...today,
      meals: today.meals.filter((m) => m.id !== mealId),
      summary: {
        ...today.summary,
        consumed: add(today.summary.consumed, meal.totals, -1),
        mealsCount: Math.max(0, today.summary.mealsCount - 1),
      },
    };
  },

  /** Swaps a local placeholder for the saved meal and trusts the server's totals. */
  confirmMeal(
    today: TodayResponse,
    placeholderId: string,
    meal: Meal,
    summary: DailySummary,
  ): TodayResponse {
    return {
      ...today,
      meals: [...today.meals.filter((m) => m.id !== placeholderId && m.id !== meal.id), meal].sort(
        byTime,
      ),
      summary,
    };
  },

  setSummary(today: TodayResponse, summary: DailySummary): TodayResponse {
    return { ...today, summary };
  },
};

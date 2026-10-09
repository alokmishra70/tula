import type { Macros, Targets } from '@tula/shared';

export const ON_TARGET_RULES = {
  minMeals: 2,
  kcalRatio: { min: 0.8, max: 1.1 },
} as const;

export function isDayOnTarget(consumed: Macros, targets: Targets, mealsCount: number): boolean {
  if (mealsCount < ON_TARGET_RULES.minMeals || targets.kcal <= 0) return false;
  const ratio = consumed.kcal / targets.kcal;
  return ratio >= ON_TARGET_RULES.kcalRatio.min && ratio <= ON_TARGET_RULES.kcalRatio.max;
}

export function sumMacros(items: readonly Macros[]): Macros {
  const total = items.reduce<Macros>(
    (sum, item) => ({
      kcal: sum.kcal + item.kcal,
      proteinG: sum.proteinG + item.proteinG,
      carbsG: sum.carbsG + item.carbsG,
      fatG: sum.fatG + item.fatG,
      fiberG: sum.fiberG + item.fiberG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
  return {
    kcal: Math.round(total.kcal),
    proteinG: round1(total.proteinG),
    carbsG: round1(total.carbsG),
    fatG: round1(total.fatG),
    fiberG: round1(total.fiberG),
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

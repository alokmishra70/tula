import type { Macros, Targets } from '@tula/shared';

const fmt = (value: number) => Math.round(value).toLocaleString('en-IN');

/** One calm line shown in the toast after logging. */
export function mealInsight(meal: Macros, dayConsumed: Macros, targets: Targets | null): string {
  if (!targets) return `${fmt(meal.kcal)} kcal and ${fmt(meal.proteinG)} g protein.`;
  const remaining = targets.kcal - dayConsumed.kcal;
  if (remaining < 0) {
    return `About ${fmt(Math.round(-remaining / 10) * 10)} kcal over today. Tomorrow's a fresh ring.`;
  }
  return `${fmt(meal.proteinG)} g protein in this meal. ${fmt(remaining)} kcal left today.`;
}

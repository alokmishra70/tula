import type { MealItemInput, MealType, QuickMeal } from '@tula/shared';
import { sumMacros } from '../../domain/nutrition';
import type { IsoDate } from '../../domain/time';
import type { MealItemRecord, MealRecord } from './meal.repository';

export const FREQUENT_MEALS_LIMIT = 2;

const signature = (items: MealItemRecord[]) =>
  items
    .map((item) => `${item.name.toLowerCase()}|${item.quantity}|${item.unit}`)
    .sort()
    .join(';');

const toInputs = (items: MealItemRecord[]): MealItemInput[] =>
  items.map(({ id: _id, ...item }) => ({ ...item, edited: false }));

const describe = (items: MealItemRecord[]) => items.map((item) => item.name).join(', ');

/** "Same as yesterday" for the meal type, plus the most repeated meals overall. */
export function buildQuickMeals(
  meals: MealRecord[],
  mealType: MealType,
  yesterday: IsoDate,
): QuickMeal[] {
  const withItems = meals.filter((meal) => meal.items.length > 0);
  const quick: QuickMeal[] = [];

  const yesterdays = withItems
    .filter((meal) => meal.localDate === yesterday && meal.mealType === mealType)
    .at(-1);
  if (yesterdays) {
    quick.push({
      kind: 'same_as_yesterday',
      label: `Same ${mealType} as yesterday`,
      mealType,
      items: toInputs(yesterdays.items),
      totals: yesterdays.totals,
    });
  }

  const groups = new Map<string, { count: number; latest: MealRecord }>();
  for (const meal of withItems) {
    const key = signature(meal.items);
    const group = groups.get(key);
    groups.set(key, { count: (group?.count ?? 0) + 1, latest: meal });
  }
  const excluded = yesterdays ? signature(yesterdays.items) : null;
  const frequent = [...groups.entries()]
    .filter(([key, group]) => key !== excluded && group.count > 1)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, FREQUENT_MEALS_LIMIT);

  for (const [, { latest }] of frequent) {
    quick.push({
      kind: 'frequent',
      label: describe(latest.items),
      mealType: latest.mealType,
      items: toInputs(latest.items),
      totals: sumMacros(latest.items),
    });
  }
  return quick;
}

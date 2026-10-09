import type { Macros, MealItemDraft, MealItemInput } from '@tula/shared';

const round1 = (value: number) => Math.round(value * 10) / 10;

export function sumItems(items: ReadonlyArray<Macros>): Macros {
  return items.reduce<Macros>(
    (total, item) => ({
      kcal: Math.round(total.kcal + item.kcal),
      proteinG: round1(total.proteinG + item.proteinG),
      carbsG: round1(total.carbsG + item.carbsG),
      fatG: round1(total.fatG + item.fatG),
      fiberG: round1(total.fiberG + item.fiberG),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

/** Portions scale linearly: 1½ katori has 1.5× the nutrients of 1 katori. */
export function scaleItem(item: MealItemDraft, quantity: number): MealItemDraft {
  const factor = item.quantity > 0 ? quantity / item.quantity : 1;
  return {
    ...item,
    quantity,
    kcal: Math.round(item.kcal * factor),
    proteinG: round1(item.proteinG * factor),
    carbsG: round1(item.carbsG * factor),
    fatG: round1(item.fatG * factor),
    fiberG: round1(item.fiberG * factor),
  };
}

export function toItemInput(item: MealItemDraft, edited: boolean): MealItemInput {
  const { clarification: _clarification, ...rest } = item;
  return { ...rest, edited };
}

import type { Macros, PortionUnit } from '@tula/shared';

const VOLUME_ML: Partial<Record<PortionUnit, number>> = {
  katori: 150,
  cup: 150,
  bowl: 250,
  glass: 250,
  tbsp: 15,
  ml: 1,
};

// Countable units that mean "one of these" interchangeably.
const COUNT_UNITS: ReadonlySet<PortionUnit> = new Set(['piece', 'roti']);

/** Converts a quantity between units, or null when the units aren't comparable. */
export function convertQuantity(
  quantity: number,
  from: PortionUnit,
  to: PortionUnit,
): number | null {
  if (from === to) return quantity;
  if (COUNT_UNITS.has(from) && COUNT_UNITS.has(to)) return quantity;
  const fromMl = VOLUME_ML[from];
  const toMl = VOLUME_ML[to];
  if (fromMl === undefined || toMl === undefined) return null;
  return (quantity * fromMl) / toMl;
}

export interface PerUnitNutrition {
  unit: PortionUnit;
  kcalPerUnit: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export function nutritionForPortion(
  dish: PerUnitNutrition,
  quantity: number,
  unit: PortionUnit,
): Macros | null {
  const units = convertQuantity(quantity, unit, dish.unit);
  if (units === null) return null;
  const round1 = (value: number) => Math.round(value * units * 10) / 10;
  return {
    kcal: Math.round(dish.kcalPerUnit * units),
    proteinG: round1(dish.proteinG),
    carbsG: round1(dish.carbsG),
    fatG: round1(dish.fatG),
    fiberG: round1(dish.fiberG),
  };
}

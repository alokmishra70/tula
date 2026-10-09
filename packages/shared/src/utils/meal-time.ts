import type { MealType } from '../enums';

// Indian meal windows, by local hour [start, end).
const MEAL_WINDOWS: ReadonlyArray<{ mealType: MealType; startHour: number; endHour: number }> = [
  { mealType: 'breakfast', startHour: 5, endHour: 11 },
  { mealType: 'lunch', startHour: 11, endHour: 16 },
  { mealType: 'snack', startHour: 16, endHour: 19 },
];

export function guessMealType(localHour: number): MealType {
  const window = MEAL_WINDOWS.find((w) => localHour >= w.startHour && localHour < w.endHour);
  return window?.mealType ?? 'dinner';
}

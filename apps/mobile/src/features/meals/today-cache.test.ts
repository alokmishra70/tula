import type { Meal, TodayResponse } from '@tula/shared';
import { todayCache } from './today-cache';

const macros = (kcal: number) => ({ kcal, proteinG: kcal / 20, carbsG: 0, fatG: 0, fiberG: 0 });
const meal = (id: string, eatenAt: string, kcal: number): Meal => ({
  id,
  mealType: 'lunch',
  eatenAt,
  source: 'text',
  status: 'confirmed',
  rawText: null,
  mediaUrl: null,
  items: [],
  totals: macros(kcal),
});

const today = {
  date: '2026-10-08',
  meals: [meal('a', '2026-10-08T03:00:00.000Z', 300)],
  summary: { date: '2026-10-08', consumed: macros(300), mealsCount: 1, onTarget: false },
} as unknown as TodayResponse;

describe('todayCache', () => {
  it('adds a meal in time order and moves the totals', () => {
    const next = todayCache.addMeal(today, meal('b', '2026-10-08T01:00:00.000Z', 200));
    expect(next.meals.map((m) => m.id)).toEqual(['b', 'a']);
    expect(next.summary).toMatchObject({ consumed: { kcal: 500, proteinG: 25 }, mealsCount: 2 });
  });

  it('removes a meal without going negative', () => {
    const next = todayCache.removeMeal(today, 'a');
    expect(next.meals).toEqual([]);
    expect(next.summary).toMatchObject({ consumed: { kcal: 0 }, mealsCount: 0 });
    expect(todayCache.removeMeal(today, 'missing')).toBe(today);
  });

  it('replaces the placeholder with the saved meal and server totals', () => {
    const optimistic = todayCache.addMeal(today, meal('local:k', '2026-10-08T07:00:00.000Z', 400));
    const serverSummary = {
      date: '2026-10-08',
      consumed: macros(690),
      mealsCount: 2,
      onTarget: false,
    };
    const next = todayCache.confirmMeal(
      optimistic,
      'local:k',
      meal('saved', '2026-10-08T07:00:00.000Z', 390),
      serverSummary,
    );
    expect(next.meals.map((m) => m.id)).toEqual(['a', 'saved']);
    expect(next.summary).toBe(serverSummary);
  });
});

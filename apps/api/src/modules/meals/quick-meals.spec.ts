import type { MealType } from '@tula/shared';
import type { MealItemRecord, MealRecord } from './meal.repository';
import { buildQuickMeals } from './quick-meals';

const item = (name: string, quantity = 1): MealItemRecord => ({
  id: `${name}-${Math.random()}`,
  name,
  quantity,
  unit: 'katori',
  kcal: 100,
  proteinG: 5,
  carbsG: 10,
  fatG: 2,
  fiberG: 1,
  confidence: 0.9,
  dishRefId: null,
  edited: false,
});

const meal = (localDate: string, mealType: MealType, items: MealItemRecord[]): MealRecord => ({
  id: `${localDate}-${mealType}`,
  userId: 'u',
  mealType,
  eatenAt: new Date(`${localDate}T08:00:00Z`),
  localDate,
  source: 'photo',
  mediaKey: null,
  rawText: null,
  status: 'confirmed',
  idempotencyKey: 'k',
  requestHash: 'h',
  totals: { kcal: items.length * 100, proteinG: 5, carbsG: 10, fatG: 2, fiberG: 1 },
  items,
});

describe('buildQuickMeals', () => {
  const history = [
    meal('2026-10-05', 'breakfast', [item('Poha'), item('Masala chai')]),
    meal('2026-10-06', 'breakfast', [item('Masala chai'), item('Poha')]),
    meal('2026-10-06', 'lunch', [item('Roti', 2), item('Dal tadka')]),
    meal('2026-10-07', 'lunch', [item('Roti', 2), item('Dal tadka')]),
    meal('2026-10-07', 'breakfast', [item('Idli', 3), item('Sambar')]),
    meal('2026-10-07', 'snack', []),
  ];

  it("offers yesterday's meal of the same type first", () => {
    const [first] = buildQuickMeals(history, 'breakfast', '2026-10-07');
    expect(first).toMatchObject({
      kind: 'same_as_yesterday',
      label: 'Same breakfast as yesterday',
    });
    expect(first?.items.map((i) => i.name)).toEqual(['Idli', 'Sambar']);
  });

  it('adds repeated meals, matching regardless of item order', () => {
    const frequent = buildQuickMeals(history, 'breakfast', '2026-10-07').filter(
      (q) => q.kind === 'frequent',
    );
    expect(frequent.map((q) => q.label).sort()).toEqual(['Masala chai, Poha', 'Roti, Dal tadka']);
  });

  it('does not repeat yesterday as a frequent meal', () => {
    const quick = buildQuickMeals(history, 'lunch', '2026-10-07');
    expect(quick.map((q) => q.kind)).toEqual(['same_as_yesterday', 'frequent']);
    expect(quick[1]?.label).toBe('Masala chai, Poha');
  });

  it('marks quick items as unedited', () => {
    expect(
      buildQuickMeals(history, 'lunch', '2026-10-07')[0]?.items.every((i) => i.edited === false),
    ).toBe(true);
  });
});

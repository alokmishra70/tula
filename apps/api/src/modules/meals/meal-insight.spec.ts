import type { Targets } from '@tula/shared';
import { mealInsight } from './meal-insight';

const targets = { kcal: 1850 } as Targets;
const macros = (kcal: number, proteinG = 22) => ({ kcal, proteinG, carbsG: 0, fatG: 0, fiberG: 0 });

describe('mealInsight', () => {
  it('reports protein and calories left', () => {
    expect(mealInsight(macros(540), macros(1240), targets)).toBe(
      '22 g protein in this meal. 610 kcal left today.',
    );
  });

  it('stays calm when over target', () => {
    expect(mealInsight(macros(540), macros(2057), targets)).toBe(
      "About 210 kcal over today. Tomorrow's a fresh ring.",
    );
  });

  it('works without a plan', () => {
    expect(mealInsight(macros(540), macros(540), null)).toBe('540 kcal and 22 g protein.');
  });
});

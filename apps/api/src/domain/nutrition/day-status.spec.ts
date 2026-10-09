import type { Targets } from '@tula/shared';
import { isDayOnTarget, sumMacros } from './day-status';

const targets: Targets = {
  kcal: 1800,
  proteinG: 90,
  carbsG: 200,
  fatG: 60,
  fiberG: 30,
  waterMl: 2800,
  saturatedFatMaxG: null,
  addedSugarMaxG: null,
};
const macros = (kcal: number) => ({ kcal, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });

describe('isDayOnTarget', () => {
  it.each([
    [1500, 3, true],
    [1980, 3, true],
    [1400, 3, false],
    [2000, 3, false],
    [1700, 1, false],
  ])('%i kcal over %i meals -> %s', (kcal, meals, expected) => {
    expect(isDayOnTarget(macros(kcal), targets, meals)).toBe(expected);
  });
});

describe('sumMacros', () => {
  it('adds and rounds', () => {
    expect(
      sumMacros([
        { kcal: 120.4, proteinG: 3.55, carbsG: 20, fatG: 3, fiberG: 2.5 },
        { kcal: 160, proteinG: 9, carbsG: 22, fatG: 4, fiberG: 5 },
      ]),
    ).toEqual({ kcal: 280, proteinG: 12.6, carbsG: 42, fatG: 7, fiberG: 7.5 });
  });
});

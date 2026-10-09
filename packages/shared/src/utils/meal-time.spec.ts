import { guessMealType } from './meal-time';

describe('guessMealType', () => {
  it.each([
    [5, 'breakfast'],
    [10, 'breakfast'],
    [11, 'lunch'],
    [15, 'lunch'],
    [16, 'snack'],
    [18, 'snack'],
    [19, 'dinner'],
    [23, 'dinner'],
    [2, 'dinner'],
  ])('hour %i -> %s', (hour, expected) => {
    expect(guessMealType(hour)).toBe(expected);
  });
});

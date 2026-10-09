import { addDays } from '../time';
import { computeStreak } from './streak';

// 2026-10-08 is a Thursday; its ISO week runs Mon 10-05 to Sun 10-11.
const TODAY = '2026-10-08';

function history(mealsPerDayEndingYesterday: number[], todayMeals = 0) {
  const map = new Map<string, number>([[TODAY, todayMeals]]);
  mealsPerDayEndingYesterday
    .slice()
    .reverse()
    .forEach((meals, index) => map.set(addDays(TODAY, -(index + 1)), meals));
  return map;
}

describe('computeStreak', () => {
  it('is zero with no history', () => {
    expect(computeStreak(new Map(), TODAY)).toEqual({
      current: 0,
      restDayAvailable: true,
      milestoneReached: null,
    });
  });

  it('counts consecutive days with at least two meals', () => {
    expect(computeStreak(history([2, 3, 2], 2), TODAY).current).toBe(4);
  });

  it('does not break the streak while today is still in progress', () => {
    expect(computeStreak(history([2, 2, 2], 1), TODAY).current).toBe(3);
  });

  it('forgives one missed day per ISO week', () => {
    // Mon 2, Tue 0 (rest), Wed 2, Thu today 2
    const streak = computeStreak(history([2, 0, 2], 2), TODAY);
    expect(streak.current).toBe(3);
    expect(streak.restDayAvailable).toBe(false);
  });

  it('breaks on a second miss in the same week', () => {
    // Mon 0, Tue 0, Wed 2, Thu today 2
    expect(computeStreak(history([0, 0, 2], 2), TODAY).current).toBe(2);
  });

  it('allows one rest day in each week', () => {
    // Previous week Sun 0 (rest), this week Mon 0 (rest)
    const meals = [2, 2, 2, 2, 2, 2, 0, 0, 2, 2];
    expect(computeStreak(history(meals, 2), TODAY).current).toBe(9);
  });

  it('does not spend a rest day before the streak started', () => {
    const streak = computeStreak(history([0, 0, 2], 2), TODAY);
    expect(streak.restDayAvailable).toBe(true);
  });

  it('reports a milestone on the day it is reached', () => {
    expect(computeStreak(history([2, 2, 2, 2, 2, 2], 2), TODAY).milestoneReached).toBe(7);
    expect(computeStreak(history([2, 2, 2, 2, 2, 2], 1), TODAY).milestoneReached).toBeNull();
  });
});

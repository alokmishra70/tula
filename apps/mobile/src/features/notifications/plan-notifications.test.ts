import type { TodayResponse } from '@tula/shared';
import { planNotifications } from './plan-notifications';

const allOn = { mealReminders: true, eveningRecap: true, weeklySummary: true };
const today = (mealTypes: string[] = []): TodayResponse =>
  ({
    meals: mealTypes.map((mealType) => ({ mealType })),
    summary: { consumed: { kcal: 1240, proteinG: 40, carbsG: 0, fatG: 0, fiberG: 0 } },
    targets: { proteinG: 98 },
    week: Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-0${i + 1}`, onTarget: i < 5 })),
  }) as unknown as TodayResponse;

// Thursday 8 Oct 2026, 07:00 local.
const morning = new Date(2026, 9, 8, 7, 0);

describe('planNotifications', () => {
  it('reminds only for meals not yet logged, in time order, capped at three', () => {
    const planned = planNotifications(today(['breakfast']), allOn, morning);
    expect(planned.map((n) => n.id)).toEqual(['meal-lunch', 'meal-dinner', 'recap']);
  });

  it('never schedules in the past', () => {
    const evening = new Date(2026, 9, 8, 20, 45);
    expect(
      planNotifications(today(['breakfast', 'lunch']), allOn, evening).map((n) => n.id),
    ).toEqual(['recap']);
  });

  it('respects per-type toggles', () => {
    const planned = planNotifications(
      today(),
      { mealReminders: false, eveningRecap: true, weeklySummary: true },
      morning,
    );
    expect(planned.map((n) => n.id)).toEqual(['recap']);
  });

  it('suggests protein for tomorrow when the day ran short', () => {
    const recap = planNotifications(today(['breakfast', 'lunch', 'dinner']), allOn, morning).find(
      (n) => n.id === 'recap',
    );
    expect(recap?.body).toBe(
      '1,240 kcal, 40 g protein. Tomorrow, try eggs or paneer at breakfast.',
    );
  });

  it('adds the weekly summary on Sundays', () => {
    const sunday = new Date(2026, 9, 11, 7, 0);
    const planned = planNotifications(today(['breakfast', 'lunch', 'dinner']), allOn, sunday);
    expect(planned.find((n) => n.id === 'weekly')?.body).toContain('5 of 7 days on target');
  });
});

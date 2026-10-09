import { EVENING_RECAP_TIME, LIMITS, MEAL_REMINDER_TIMES, type TodayResponse } from '@tula/shared';
import { formatNumber } from '@/lib/format';
import type { ReminderPrefs } from './prefs-store';

export interface PlannedNotification {
  id: string;
  at: Date;
  title: string;
  body: string;
}

const SUNDAY = 0;
const WEEKLY_HOUR = 19;
const MEAL_COPY = {
  breakfast: 'Breakfast not logged yet. Snap it now?',
  lunch: 'Lunch not logged yet. Snap it now?',
  dinner: 'Dinner not logged yet. One photo is enough.',
} as const;

const at = (now: Date, hour: number, minute: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

/**
 * Today's local reminders: only for meals not yet logged, an evening recap and a Sunday
 * summary, capped at three so they stay useful rather than noisy.
 */
export function planNotifications(
  today: TodayResponse,
  prefs: ReminderPrefs,
  now: Date,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  const logged = new Set(today.meals.map((meal) => meal.mealType));

  if (prefs.mealReminders) {
    for (const [meal, time] of Object.entries(MEAL_REMINDER_TIMES) as Array<
      [keyof typeof MEAL_COPY, { hour: number; minute: number }]
    >) {
      if (!logged.has(meal))
        planned.push({
          id: `meal-${meal}`,
          at: at(now, time.hour, time.minute),
          title: 'Tula',
          body: MEAL_COPY[meal],
        });
    }
  }

  if (prefs.eveningRecap) {
    const { consumed } = today.summary;
    const proteinShort = consumed.proteinG < today.targets.proteinG * 0.8;
    planned.push({
      id: 'recap',
      at: at(now, EVENING_RECAP_TIME.hour, EVENING_RECAP_TIME.minute),
      title: 'Your day',
      body: `${formatNumber(consumed.kcal)} kcal, ${formatNumber(consumed.proteinG)} g protein. ${
        proteinShort ? 'Tomorrow, try eggs or paneer at breakfast.' : 'Same again tomorrow.'
      }`,
    });
  }

  if (prefs.weeklySummary && now.getDay() === SUNDAY) {
    const onTarget = today.week.filter((day) => day.onTarget).length;
    planned.push({
      id: 'weekly',
      at: at(now, WEEKLY_HOUR, 0),
      title: 'Your week',
      body: `${onTarget} of 7 days on target. Open Tula for one thing to try next week.`,
    });
  }

  return planned
    .filter((notification) => notification.at > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, LIMITS.notificationsPerDay);
}

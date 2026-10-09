import { STREAK_MILESTONES, type Streak } from '@tula/shared';
import { addDays, isoWeekKey, type IsoDate } from '../time';

export const STREAK_RULES = {
  minMealsPerDay: 2,
  restDaysPerIsoWeek: 1,
  maxLookbackDays: 400,
} as const;

/**
 * Counts consecutive qualifying days ending today. Today counts only once it qualifies
 * (the day isn't over yet). One missed day per ISO week is forgiven but not counted.
 */
export function computeStreak(mealsByDate: ReadonlyMap<IsoDate, number>, today: IsoDate): Streak {
  const qualifies = (date: IsoDate) => (mealsByDate.get(date) ?? 0) >= STREAK_RULES.minMealsPerDay;
  const todayQualifies = qualifies(today);

  let current = todayQualifies ? 1 : 0;
  const restDaysUsed = new Map<string, number>();
  // Misses become rest days only once an earlier qualifying day proves they bridge a streak.
  let pendingMisses: string[] = [];

  for (let offset = 1; offset <= STREAK_RULES.maxLookbackDays; offset++) {
    const date = addDays(today, -offset);
    if (qualifies(date)) {
      current++;
      for (const week of pendingMisses) restDaysUsed.set(week, (restDaysUsed.get(week) ?? 0) + 1);
      pendingMisses = [];
      continue;
    }
    const week = isoWeekKey(date);
    const used = (restDaysUsed.get(week) ?? 0) + pendingMisses.filter((w) => w === week).length;
    if (used >= STREAK_RULES.restDaysPerIsoWeek) break;
    pendingMisses.push(week);
  }

  const isMilestone = (STREAK_MILESTONES as readonly number[]).includes(current);
  return {
    current,
    restDayAvailable: (restDaysUsed.get(isoWeekKey(today)) ?? 0) < STREAK_RULES.restDaysPerIsoWeek,
    milestoneReached: todayQualifies && isMilestone ? current : null,
  };
}

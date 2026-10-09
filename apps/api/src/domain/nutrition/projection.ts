import type { Projection } from '@tula/shared';
import { addDays, type IsoDate } from '../time';
import { KCAL_PER_KG_BODY_FAT } from './energy';

export function projectGoalDate(
  currentWeightKg: number,
  targetWeightKg: number | null,
  dailyEnergyDelta: number,
  today: IsoDate,
): Projection {
  const dailyChangeKg = dailyEnergyDelta / KCAL_PER_KG_BODY_FAT;
  const weeklyChangeKg = Math.round(dailyChangeKg * 7 * 100) / 100;
  const base = { startWeightKg: currentWeightKg, targetWeightKg, weeklyChangeKg };

  if (targetWeightKg === null || dailyChangeKg === 0) return { ...base, projectedDate: null };

  const remainingKg = targetWeightKg - currentWeightKg;
  const movingTowardTarget = Math.sign(remainingKg) === Math.sign(dailyChangeKg);
  if (!movingTowardTarget) return { ...base, projectedDate: null };

  const days = Math.ceil((remainingKg * KCAL_PER_KG_BODY_FAT) / dailyEnergyDelta);
  return { ...base, projectedDate: addDays(today, days) };
}

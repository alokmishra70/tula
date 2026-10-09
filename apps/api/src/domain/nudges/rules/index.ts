import type { NudgeRule } from '../nudge-rule';
import { CalorieRoomRule } from './calorie-room.rule';
import { DayCompleteRule } from './day-complete.rule';
import { FiberGapRule } from './fiber-gap.rule';
import { FirstMealRule } from './first-meal.rule';
import { MissingMealRule } from './missing-meal.rule';
import { ProteinGapRule } from './protein-gap.rule';
import { StreakProtectionRule } from './streak-protection.rule';

export const DEFAULT_NUDGE_RULES: readonly NudgeRule[] = [
  new FirstMealRule(),
  new DayCompleteRule(),
  new StreakProtectionRule(),
  new MissingMealRule(),
  new FiberGapRule(),
  new ProteinGapRule(),
  new CalorieRoomRule(),
];

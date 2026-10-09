import { z } from 'zod';
import { TargetsSchema } from './goal';
import { IsoDateSchema, MacrosSchema } from './common';
import { MealSchema } from './meal';
import { NudgeSchema } from './nudge';
import { FlaggedMarkerSchema } from './report';

export const DailySummarySchema = z.object({
  date: IsoDateSchema,
  consumed: MacrosSchema,
  mealsCount: z.number().int().nonnegative(),
  onTarget: z.boolean(),
});
export type DailySummary = z.infer<typeof DailySummarySchema>;

export const StreakSchema = z.object({
  current: z.number().int().nonnegative(),
  restDayAvailable: z.boolean(),
  milestoneReached: z.number().int().nullable(),
});
export type Streak = z.infer<typeof StreakSchema>;

export const WeekDaySchema = z.object({
  date: IsoDateSchema,
  onTarget: z.boolean().nullable(),
});

export const TodayResponseSchema = z.object({
  date: IsoDateSchema,
  name: z.string(),
  targets: TargetsSchema,
  summary: DailySummarySchema,
  meals: z.array(MealSchema),
  nudge: NudgeSchema.nullable(),
  streak: StreakSchema,
  flaggedMarkers: z.array(FlaggedMarkerSchema),
  week: z.array(WeekDaySchema).length(7),
});
export type TodayResponse = z.infer<typeof TodayResponseSchema>;

export const MealWriteResponseSchema = z.object({
  meal: MealSchema,
  summary: DailySummarySchema,
  insight: z.string().nullable(),
});
export type MealWriteResponse = z.infer<typeof MealWriteResponseSchema>;

export const DeleteMealResponseSchema = z.object({
  summary: DailySummarySchema,
});
export type DeleteMealResponse = z.infer<typeof DeleteMealResponseSchema>;

export const TodayQuerySchema = z.object({
  date: IsoDateSchema.optional(),
});
export type TodayQuery = z.infer<typeof TodayQuerySchema>;

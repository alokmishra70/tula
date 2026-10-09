import { z } from 'zod';
import { ONBOARDING_BOUNDS } from '../constants';
import { GoalTypeSchema } from '../enums';
import { IdSchema, IsoDateSchema } from './common';

export const PlanRequestSchema = z.object({
  goalType: GoalTypeSchema,
  targetWeightKg: z
    .number()
    .min(ONBOARDING_BOUNDS.weightKg.min)
    .max(ONBOARDING_BOUNDS.weightKg.max)
    .optional(),
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const TargetsSchema = z.object({
  kcal: z.number().int(),
  proteinG: z.number().int(),
  carbsG: z.number().int(),
  fatG: z.number().int(),
  fiberG: z.number().int(),
  waterMl: z.number().int(),
  saturatedFatMaxG: z.number().int().nullable(),
  addedSugarMaxG: z.number().int().nullable(),
});
export type Targets = z.infer<typeof TargetsSchema>;

export const PLAN_ADJUSTMENTS = [
  'calorie_floor_applied',
  'loss_rate_capped',
  'target_weight_raised_to_healthy_bmi',
  'fiber_raised_for_ldl',
  'saturated_fat_capped_for_ldl',
  'added_sugar_capped_for_hba1c',
  'carbs_shifted_earlier_for_hba1c',
  'vitamin_d_foods_suggested',
  'vitamin_b12_foods_suggested',
] as const;
export const PlanAdjustmentSchema = z.enum(PLAN_ADJUSTMENTS);
export type PlanAdjustment = z.infer<typeof PlanAdjustmentSchema>;

export const ProjectionSchema = z.object({
  startWeightKg: z.number(),
  targetWeightKg: z.number().nullable(),
  weeklyChangeKg: z.number(),
  projectedDate: IsoDateSchema.nullable(),
});
export type Projection = z.infer<typeof ProjectionSchema>;

export const PlanSchema = z.object({
  goalId: IdSchema,
  goalType: GoalTypeSchema,
  targets: TargetsSchema,
  projection: ProjectionSchema,
  adjustments: z.array(PlanAdjustmentSchema),
  foodSuggestions: z.array(z.string()),
  reasoning: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;

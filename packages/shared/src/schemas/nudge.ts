import { z } from 'zod';
import { MealTypeSchema, NudgeActionSchema, NudgeRuleSchema } from '../enums';
import { IdSchema } from './common';

export const NudgeSchema = z.object({
  id: IdSchema,
  rule: NudgeRuleSchema,
  message: z.string(),
  action: NudgeActionSchema,
  actionLabel: z.string().nullable(),
  mealType: MealTypeSchema.nullable(),
});
export type Nudge = z.infer<typeof NudgeSchema>;

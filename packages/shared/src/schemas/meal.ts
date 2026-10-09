import { z } from 'zod';
import { LIMITS } from '../constants';
import { MealSourceSchema, MealStatusSchema, MealTypeSchema, PortionUnitSchema } from '../enums';
import { IdSchema, IsoDateTimeSchema, MacrosSchema } from './common';

export const ClarificationSchema = z.object({
  question: z.string().max(120),
  options: z.array(z.string().max(40)).min(2).max(3),
});
export type Clarification = z.infer<typeof ClarificationSchema>;

export const MealItemDraftSchema = MacrosSchema.extend({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(50),
  unit: PortionUnitSchema,
  confidence: z.number().min(0).max(1),
  dishRefId: IdSchema.nullable(),
  clarification: ClarificationSchema.nullable(),
});
export type MealItemDraft = z.infer<typeof MealItemDraftSchema>;

export const MealItemInputSchema = MealItemDraftSchema.omit({ clarification: true }).extend({
  edited: z.boolean(),
});
export type MealItemInput = z.infer<typeof MealItemInputSchema>;

export const MealItemSchema = MealItemInputSchema.extend({ id: IdSchema });
export type MealItem = z.infer<typeof MealItemSchema>;

export const ParseMealRequestSchema = z
  .object({
    source: z.enum(['photo', 'voice', 'text']),
    mealType: MealTypeSchema,
    eatenAt: IsoDateTimeSchema,
    mediaKey: z.string().min(1).optional(),
    text: z.string().trim().min(1).max(LIMITS.mealTextMaxChars).optional(),
  })
  .refine(({ source, mediaKey, text }) => (source === 'text' ? !!text : !!mediaKey), {
    message: 'Text input needs text; photo and voice need a mediaKey',
  });
export type ParseMealRequest = z.infer<typeof ParseMealRequestSchema>;

export const MealSchema = z.object({
  id: IdSchema,
  mealType: MealTypeSchema,
  eatenAt: IsoDateTimeSchema,
  source: MealSourceSchema,
  status: MealStatusSchema,
  rawText: z.string().nullable(),
  mediaUrl: z.url().nullable(),
  items: z.array(MealItemSchema),
  totals: MacrosSchema,
});
export type Meal = z.infer<typeof MealSchema>;

export const ParseMealResponseSchema = z.discriminatedUnion('outcome', [
  z.object({ outcome: z.literal('parsed'), items: z.array(MealItemDraftSchema).min(1) }),
  z.object({ outcome: z.literal('not_food') }),
  z.object({ outcome: z.literal('nothing_recognised') }),
  // AI was unavailable; the raw input was saved and will be enriched later.
  z.object({ outcome: z.literal('pending'), meal: MealSchema }),
]);
export type ParseMealResponse = z.infer<typeof ParseMealResponseSchema>;

export const CreateMealRequestSchema = z.object({
  mealType: MealTypeSchema,
  eatenAt: IsoDateTimeSchema,
  source: MealSourceSchema,
  mediaKey: z.string().min(1).nullable(),
  rawText: z.string().max(LIMITS.mealTextMaxChars).nullable(),
  items: z.array(MealItemInputSchema).max(LIMITS.mealItemsMax),
});
export type CreateMealRequest = z.infer<typeof CreateMealRequestSchema>;

export const UpdateMealRequestSchema = z
  .object({
    mealType: MealTypeSchema,
    eatenAt: IsoDateTimeSchema,
    items: z.array(MealItemInputSchema).min(1).max(LIMITS.mealItemsMax),
  })
  .partial();
export type UpdateMealRequest = z.infer<typeof UpdateMealRequestSchema>;

export const QuickMealSchema = z.object({
  kind: z.enum(['same_as_yesterday', 'frequent']),
  label: z.string(),
  mealType: MealTypeSchema,
  items: z.array(MealItemInputSchema).min(1),
  totals: MacrosSchema,
});
export type QuickMeal = z.infer<typeof QuickMealSchema>;

export const QuickMealsQuerySchema = z.object({
  mealType: MealTypeSchema.optional(),
});
export type QuickMealsQuery = z.infer<typeof QuickMealsQuerySchema>;

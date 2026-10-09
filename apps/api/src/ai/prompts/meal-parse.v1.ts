import { LIMITS, MealItemDraftSchema, type MealType } from '@tula/shared';
import { z } from 'zod';
import type { InputPart, MediaPartType, PromptTemplate } from '../llm-provider';
import { asUserData, DATA_ONLY_RULE } from './user-data';

export const MealParseOutputSchema = z.object({
  isFood: z.boolean(),
  items: z.array(MealItemDraftSchema.omit({ dishRefId: true })).max(LIMITS.mealItemsMax),
});
export type MealParseOutput = z.infer<typeof MealParseOutputSchema>;

export const mealParsePrompt: PromptTemplate<MealParseOutput> = {
  id: 'meal-parse',
  version: 1,
  schema: MealParseOutputSchema,
  system: [
    'You estimate nutrition for meals eaten in India from a photo, a voice note or a short description.',
    'List each distinct food as one item. Use Indian portion units: katori (about 150 g cooked), roti, piece, glass (250 ml), plate, bowl, cup, slice, tbsp, serving; use g or ml only when nothing else fits.',
    'Use common Indian names, for example "Dal tadka", "Aloo sabzi", "Roti", "Curd".',
    'Give kcal, protein, carbs, fat and fibre for the whole quantity, not per unit.',
    'confidence is 0 to 1 for how sure you are about the dish and portion together.',
    'When confidence is below 0.6, add a clarification with one short question and two or three short answer options, for example "Paneer or tofu?". Otherwise clarification is null.',
    'Voice notes may be English, Hindi or Hinglish.',
    'If the input is not food or drink, set isFood to false and return no items.',
    DATA_ONLY_RULE,
  ].join('\n'),
};

export interface MealParseInput {
  mealType: MealType;
  text?: string;
  media?: { type: Extract<MediaPartType, 'image' | 'audio'>; mimeType: string; data: Buffer };
}

export function mealParseInputs({ mealType, text, media }: MealParseInput): InputPart[] {
  const parts: InputPart[] = [{ type: 'text', text: `Meal: ${mealType}.` }];
  if (text) parts.push({ type: 'text', text: asUserData('meal_description', text) });
  if (media) parts.push({ type: media.type, mimeType: media.mimeType, data: media.data });
  return parts;
}

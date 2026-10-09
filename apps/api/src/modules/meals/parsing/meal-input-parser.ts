import type { MealSource, ParseMealRequest } from '@tula/shared';
import type { MealParseInput } from '../../../ai/prompts';

export type ParseSource = Extract<MealSource, 'photo' | 'voice' | 'text'>;

export interface RawMealInput {
  source: ParseSource;
  mealType: ParseMealRequest['mealType'];
  mediaKey: string | null;
  text: string | null;
}

/** Strategy per input type; each turns a raw input into a model-ready request. */
export abstract class MealInputParser {
  abstract readonly source: ParseSource;
  abstract toModelInput(userId: string, input: RawMealInput): Promise<MealParseInput>;
}

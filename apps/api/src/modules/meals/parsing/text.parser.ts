import { Injectable } from '@nestjs/common';
import type { MealParseInput } from '../../../ai/prompts';
import { AppException } from '../../../common/errors/app.exception';
import { MealInputParser, type RawMealInput } from './meal-input-parser';

@Injectable()
export class TextParser extends MealInputParser {
  readonly source = 'text';

  async toModelInput(_userId: string, { mealType, text }: RawMealInput): Promise<MealParseInput> {
    if (!text) throw AppException.validation([{ path: 'text', message: 'Describe what you ate' }]);
    return { mealType, text };
  }
}

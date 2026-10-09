import { Injectable } from '@nestjs/common';
import type { MealParseInput } from '../../../ai/prompts';
import { MediaService } from '../../media/media.service';
import { MealInputParser, type RawMealInput } from './meal-input-parser';

@Injectable()
export class PhotoParser extends MealInputParser {
  readonly source = 'photo';

  constructor(private readonly media: MediaService) {
    super();
  }

  async toModelInput(
    userId: string,
    { mealType, mediaKey, text }: RawMealInput,
  ): Promise<MealParseInput> {
    const { mimeType, data } = await this.media.read(mediaKey ?? '', 'meal_photo', userId);
    return { mealType, text: text ?? undefined, media: { type: 'image', mimeType, data } };
  }
}

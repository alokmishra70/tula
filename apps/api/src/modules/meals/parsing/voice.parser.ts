import { Injectable } from '@nestjs/common';
import type { MealParseInput } from '../../../ai/prompts';
import { MediaService } from '../../media/media.service';
import { MealInputParser, type RawMealInput } from './meal-input-parser';

@Injectable()
export class VoiceParser extends MealInputParser {
  readonly source = 'voice';

  constructor(private readonly media: MediaService) {
    super();
  }

  async toModelInput(
    userId: string,
    { mealType, mediaKey }: RawMealInput,
  ): Promise<MealParseInput> {
    const { mimeType, data } = await this.media.read(mediaKey ?? '', 'meal_audio', userId);
    return { mealType, media: { type: 'audio', mimeType, data } };
  }
}

import { Injectable } from '@nestjs/common';
import type { Meal } from '@tula/shared';
import { MediaService } from '../media/media.service';
import type { MealRecord } from './meal.repository';

@Injectable()
export class MealMapper {
  constructor(private readonly media: MediaService) {}

  async toDto(meal: MealRecord): Promise<Meal> {
    return {
      id: meal.id,
      mealType: meal.mealType,
      eatenAt: meal.eatenAt.toISOString(),
      source: meal.source,
      status: meal.status,
      rawText: meal.rawText,
      mediaUrl: meal.mediaKey ? await this.media.readUrl(meal.mediaKey) : null,
      items: meal.items,
      totals: meal.totals,
    };
  }

  toDtos(meals: MealRecord[]): Promise<Meal[]> {
    return Promise.all(meals.map((meal) => this.toDto(meal)));
  }
}

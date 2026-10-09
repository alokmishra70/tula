import { Injectable } from '@nestjs/common';
import { THRESHOLDS, type MealItemDraft } from '@tula/shared';
import type { MealParseOutput } from '../../ai/prompts';
import { nutritionForPortion } from '../../domain/nutrition';
import { DishCatalog } from './dish-catalog';

type ParsedItem = MealParseOutput['items'][number];

/** Snaps model estimates to the curated table so "1 katori dal" always gives the same numbers. */
@Injectable()
export class MealEnricher {
  constructor(private readonly dishes: DishCatalog) {}

  enrich(items: ParsedItem[]): Promise<MealItemDraft[]> {
    return Promise.all(items.map((item) => this.enrichItem(item)));
  }

  private async enrichItem(item: ParsedItem): Promise<MealItemDraft> {
    const clarification = item.confidence < THRESHOLDS.lowConfidence ? item.clarification : null;
    const match = await this.dishes.match(item.name);
    if (!match) return { ...item, dishRefId: null, clarification };

    const { dish } = match;
    let unit = item.unit;
    let nutrition = nutritionForPortion(dish, item.quantity, unit);
    // A generic "serving" from the model maps onto the dish's natural unit.
    if (!nutrition && unit === 'serving') {
      unit = dish.unit;
      nutrition = nutritionForPortion(dish, item.quantity, unit);
    }
    if (!nutrition) return { ...item, dishRefId: dish.id, clarification };

    return { ...item, ...nutrition, name: dish.name, unit, dishRefId: dish.id, clarification };
  }
}

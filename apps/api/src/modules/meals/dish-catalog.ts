import { Injectable } from '@nestjs/common';
import type { PortionUnit } from '@tula/shared';
import { DishMatcher, type DishMatch, type PerUnitNutrition } from '../../domain/nutrition';
import { DbContext } from '../../infrastructure/database/db-context';

export interface Dish extends PerUnitNutrition {
  id: string;
  name: string;
  aliases: string[];
}

export abstract class DishCatalog {
  abstract match(name: string): Promise<DishMatch<Dish> | null>;
}

/** Curated dish table, loaded once; it only changes through seeding. */
@Injectable()
export class PrismaDishCatalog extends DishCatalog {
  private matcher?: Promise<DishMatcher<Dish>>;

  constructor(private readonly db: DbContext) {
    super();
  }

  async match(name: string): Promise<DishMatch<Dish> | null> {
    this.matcher ??= this.load();
    return (await this.matcher).match(name);
  }

  private async load(): Promise<DishMatcher<Dish>> {
    const rows = await this.db.client.dishRef.findMany();
    return new DishMatcher(rows.map((row) => ({ ...row, unit: row.unit as PortionUnit })));
  }
}

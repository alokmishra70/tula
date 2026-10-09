import { Injectable } from '@nestjs/common';
import type { DailySummary } from '@tula/shared';
import { isDayOnTarget, sumMacros } from '../../domain/nutrition';
import type { IsoDate } from '../../domain/time';
import { GoalsService } from '../goals/goals.service';
import { DailySummaryRepository } from './daily-summary.repository';
import { MealRepository } from './meal.repository';

export const emptySummary = (date: IsoDate): DailySummary => ({
  date,
  consumed: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  mealsCount: 0,
  onTarget: false,
});

@Injectable()
export class SummaryService {
  constructor(
    private readonly summaries: DailySummaryRepository,
    private readonly meals: MealRepository,
    private readonly goals: GoalsService,
  ) {}

  /** Rebuilds a day's totals from its meals. Call inside the meal write's transaction. */
  async recompute(userId: string, date: IsoDate): Promise<DailySummary> {
    const meals = await this.meals.listByDates(userId, date, date);
    const consumed = sumMacros(meals.map((meal) => meal.totals));
    const targets = await this.goals.activeTargets(userId);
    const summary: DailySummary = {
      date,
      consumed,
      mealsCount: meals.length,
      onTarget: targets !== null && isDayOnTarget(consumed, targets, meals.length),
    };
    await this.summaries.upsert(userId, summary);
    return summary;
  }

  async forDate(userId: string, date: IsoDate): Promise<DailySummary> {
    const [summary] = await this.summaries.findRange(userId, date, date);
    return summary ?? emptySummary(date);
  }

  range(userId: string, from: IsoDate, to: IsoDate): Promise<DailySummary[]> {
    return this.summaries.findRange(userId, from, to);
  }
}

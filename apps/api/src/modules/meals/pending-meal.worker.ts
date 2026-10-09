import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { AiUnavailableError } from '../../ai/llm-errors';
import { Clock } from '../../common/clock';
import { AppConfig } from '../../config/app-config';
import { MealRepository, type MealRecord } from './meal.repository';
import { MealsService } from './meals.service';
import type { ParseSource } from './parsing/meal-input-parser';
import { MealParsingService } from './parsing/meal-parsing.service';

const INTERVAL_MS = 60_000;
const MIN_AGE_MS = 30_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 10;
const PARSEABLE: ReadonlySet<string> = new Set<ParseSource>(['photo', 'voice', 'text']);

/** Fills in meals that were saved raw because the model was down or the phone was offline. */
@Injectable()
export class PendingMealWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(PendingMealWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly meals: MealRepository,
    private readonly mealsService: MealsService,
    private readonly parsing: MealParsingService,
    private readonly config: AppConfig,
    private readonly clock: Clock,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.config.backgroundJobs) return;
    this.timer = setInterval(() => void this.runOnce(), INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  async runOnce(): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let enriched = 0;
    try {
      const now = this.clock.now().getTime();
      const pending = await this.meals.listPending(
        new Date(now - MAX_AGE_MS),
        new Date(now - MIN_AGE_MS),
        BATCH_SIZE,
      );
      for (const meal of pending) {
        if (!(await this.enrich(meal))) break;
        enriched++;
      }
    } finally {
      this.running = false;
    }
    return enriched;
  }

  /** Returns false when the model is still unavailable, to stop this run early. */
  private async enrich(meal: MealRecord): Promise<boolean> {
    const source = PARSEABLE.has(meal.source) ? (meal.source as ParseSource) : 'text';
    if (!meal.mediaKey && !meal.rawText) {
      await this.mealsService.applyEnrichment(meal, []);
      return true;
    }
    try {
      const result = await this.parsing.parse(meal.userId, {
        source,
        mealType: meal.mealType,
        mediaKey: meal.mediaKey,
        text: meal.rawText,
      });
      const items =
        result.outcome === 'parsed'
          ? result.items.map(({ clarification: _c, ...item }) => ({ ...item, edited: false }))
          : [];
      await this.mealsService.applyEnrichment(meal, items);
      this.logger.log({ event: 'pending_meal_enriched', mealId: meal.id, outcome: result.outcome });
      return true;
    } catch (error) {
      if (error instanceof AiUnavailableError) return false;
      this.logger.error({ event: 'pending_meal_failed', mealId: meal.id, error: String(error) });
      await this.mealsService.applyEnrichment(meal, []);
      return true;
    }
  }
}

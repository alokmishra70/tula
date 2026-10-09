import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  guessMealType,
  type CreateMealRequest,
  type DeleteMealResponse,
  type Meal,
  type MealItemInput,
  type MealSource,
  type MealType,
  type MediaKind,
  type ParseMealRequest,
  type ParseMealResponse,
  type QuickMeal,
  type UpdateMealRequest,
  type MealWriteResponse,
} from '@tula/shared';
import { AiUnavailableError } from '../../ai/llm-errors';
import type { RequestUser } from '../../common/auth/request-user';
import { Clock } from '../../common/clock';
import { AppException } from '../../common/errors/app.exception';
import { stableHash } from '../../common/stable-hash';
import { sumMacros } from '../../domain/nutrition';
import { addDays, localClock, toLocalDate, type IsoDate } from '../../domain/time';
import { isUniqueViolation } from '../../infrastructure/database/prisma-errors';
import { TransactionManager } from '../../infrastructure/database/transaction-manager';
import { GoalsService } from '../goals/goals.service';
import { MediaService } from '../media/media.service';
import { mealInsight } from './meal-insight';
import { MealMapper } from './meal.mapper';
import { MealRepository, type MealRecord, type NewMealItem } from './meal.repository';
import { MealParsingService } from './parsing/meal-parsing.service';
import { buildQuickMeals } from './quick-meals';
import { SummaryService } from './summary.service';

const MAX_BACKDATE_DAYS = 2;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const QUICK_MEAL_LOOKBACK_DAYS = 30;
const MEDIA_KIND_BY_SOURCE: Partial<Record<MealSource, MediaKind>> = {
  photo: 'meal_photo',
  voice: 'meal_audio',
};

@Injectable()
export class MealsService {
  constructor(
    private readonly meals: MealRepository,
    private readonly summaries: SummaryService,
    private readonly parsing: MealParsingService,
    private readonly goals: GoalsService,
    private readonly media: MediaService,
    private readonly mapper: MealMapper,
    private readonly tx: TransactionManager,
    private readonly clock: Clock,
  ) {}

  async parse(user: RequestUser, request: ParseMealRequest): Promise<ParseMealResponse> {
    const input = {
      source: request.source,
      mealType: request.mealType,
      mediaKey: request.mediaKey ?? null,
      text: request.text ?? null,
    };
    try {
      return await this.parsing.parse(user.id, input);
    } catch (error) {
      if (!(error instanceof AiUnavailableError)) throw error;
      // Keep the raw input; the pending-meal worker fills in numbers later.
      const { meal } = await this.create(user, `parse:${randomUUID()}`, {
        mealType: request.mealType,
        eatenAt: request.eatenAt,
        source: request.source,
        mediaKey: input.mediaKey,
        rawText: input.text,
        items: [],
      });
      return { outcome: 'pending', meal };
    }
  }

  async create(
    user: RequestUser,
    idempotencyKey: string,
    request: CreateMealRequest,
  ): Promise<MealWriteResponse> {
    const requestHash = stableHash(request);
    const existing = await this.meals.findByIdempotencyKey(user.id, idempotencyKey);
    if (existing) return this.replay(existing, requestHash);

    const eatenAt = this.validatedEatenAt(request.eatenAt, user.timezone);
    this.assertMediaAllowed(user.id, request.source, request.mediaKey);
    const items = request.items.map(toNewItem);

    try {
      const { meal, summary } = await this.tx.run(async () => {
        const meal = await this.meals.create({
          userId: user.id,
          mealType: request.mealType,
          eatenAt,
          localDate: toLocalDate(eatenAt, user.timezone),
          source: request.source,
          mediaKey: request.mediaKey,
          rawText: request.rawText,
          status: items.length > 0 ? 'confirmed' : 'pending',
          idempotencyKey,
          requestHash,
          totals: sumMacros(items),
          items,
        });
        return { meal, summary: await this.summaries.recompute(user.id, meal.localDate) };
      });
      return this.writeResponse(user.id, meal, summary);
    } catch (error) {
      // A concurrent request with the same key won the race.
      if (!isUniqueViolation(error)) throw error;
      const winner = await this.meals.findByIdempotencyKey(user.id, idempotencyKey);
      if (!winner) throw error;
      return this.replay(winner, requestHash);
    }
  }

  async update(
    user: RequestUser,
    id: string,
    request: UpdateMealRequest,
  ): Promise<MealWriteResponse> {
    const meal = await this.requireMeal(id, user.id);
    const eatenAt = request.eatenAt
      ? this.validatedEatenAt(request.eatenAt, user.timezone)
      : meal.eatenAt;
    const localDate = toLocalDate(eatenAt, user.timezone);
    const items = request.items?.map(toNewItem);

    const { updated, summary } = await this.tx.run(async () => {
      const updated = await this.meals.update(meal.id, {
        mealType: request.mealType,
        eatenAt,
        localDate,
        ...(items && { items, totals: sumMacros(items), status: 'confirmed' as const }),
      });
      if (meal.localDate !== localDate) await this.summaries.recompute(user.id, meal.localDate);
      return { updated, summary: await this.summaries.recompute(user.id, localDate) };
    });
    return this.writeResponse(user.id, updated, summary);
  }

  async remove(user: RequestUser, id: string): Promise<DeleteMealResponse> {
    const meal = await this.requireMeal(id, user.id);
    const summary = await this.tx.run(async () => {
      await this.meals.delete(meal.id);
      return this.summaries.recompute(user.id, meal.localDate);
    });
    return { summary };
  }

  /** Called by the pending-meal worker once the model is reachable again. */
  async applyEnrichment(meal: MealRecord, items: NewMealItem[]): Promise<void> {
    await this.tx.run(async () => {
      await this.meals.update(meal.id, { items, totals: sumMacros(items), status: 'parsed' });
      await this.summaries.recompute(meal.userId, meal.localDate);
    });
  }

  async listForDate(userId: string, date: IsoDate): Promise<Meal[]> {
    return this.mapper.toDtos(await this.meals.listByDates(userId, date, date));
  }

  async hasEverLogged(userId: string): Promise<boolean> {
    return (await this.meals.countForUser(userId)) > 0;
  }

  async quickMeals(user: RequestUser, mealType?: MealType): Promise<QuickMeal[]> {
    const clock = localClock(this.clock.now(), user.timezone);
    const meals = await this.meals.listByDates(
      user.id,
      addDays(clock.date, -QUICK_MEAL_LOOKBACK_DAYS),
      clock.date,
    );
    return buildQuickMeals(meals, mealType ?? guessMealType(clock.hour), addDays(clock.date, -1));
  }

  private async replay(meal: MealRecord, requestHash: string): Promise<MealWriteResponse> {
    if (meal.requestHash !== requestHash) {
      throw AppException.conflict(
        'idempotency_mismatch',
        'This Idempotency-Key was used for a different meal',
      );
    }
    return this.writeResponse(
      meal.userId,
      meal,
      await this.summaries.forDate(meal.userId, meal.localDate),
    );
  }

  private async writeResponse(
    userId: string,
    meal: MealRecord,
    summary: MealWriteResponse['summary'],
  ): Promise<MealWriteResponse> {
    const targets = await this.goals.activeTargets(userId);
    return {
      meal: await this.mapper.toDto(meal),
      summary,
      insight: meal.items.length > 0 ? mealInsight(meal.totals, summary.consumed, targets) : null,
    };
  }

  private async requireMeal(id: string, userId: string): Promise<MealRecord> {
    const meal = await this.meals.findForUser(id, userId);
    if (!meal) throw AppException.notFound('Meal');
    return meal;
  }

  private validatedEatenAt(value: string, timezone: string): Date {
    const eatenAt = new Date(value);
    const now = this.clock.now();
    const earliest = addDays(toLocalDate(now, timezone), -MAX_BACKDATE_DAYS);
    if (
      eatenAt.getTime() > now.getTime() + MAX_CLOCK_SKEW_MS ||
      toLocalDate(eatenAt, timezone) < earliest
    ) {
      throw AppException.validation([
        { path: 'eatenAt', message: 'Meals can be logged for today or yesterday' },
      ]);
    }
    return eatenAt;
  }

  private assertMediaAllowed(userId: string, source: MealSource, mediaKey: string | null): void {
    if (!mediaKey) return;
    const kind = MEDIA_KIND_BY_SOURCE[source];
    if (!kind)
      throw AppException.validation([
        { path: 'mediaKey', message: `No media allowed for ${source}` },
      ]);
    this.media.assertOwned(mediaKey, kind, userId);
  }
}

const toNewItem = (item: MealItemInput): NewMealItem => ({ ...item });

import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { guessMealType, MealTypeSchema, type Biomarker, type ChatCard } from '@tula/shared';
import { z } from 'zod';
import { AiUnavailableError } from '../../ai/llm-errors';
import type { ToolCall, ToolDefinition } from '../../ai/llm-provider';
import type { RequestUser } from '../../common/auth/request-user';
import { Clock } from '../../common/clock';
import { getMarkerDefinition, isFlagged } from '../../domain/biomarkers';
import { addDays, localClock } from '../../domain/time';
import { GoalsService } from '../goals/goals.service';
import { MarkerQueryService } from '../markers/marker-query.service';
import { MealsService } from '../meals/meals.service';
import { MealParsingService } from '../meals/parsing/meal-parsing.service';
import { SummaryService } from '../meals/summary.service';

export interface ToolOutcome {
  /** JSON handed back to the model. */
  result: string;
  cards: ChatCard[];
}

const MAX_MARKER_CARDS = 3;
const LogMealArgsSchema = z.object({
  description: z.string().trim().min(1).max(500),
  mealType: MealTypeSchema.optional(),
});

export const CHAT_TOOLS: ToolDefinition[] = [
  {
    name: 'get_today_summary',
    description: "Today's calories and macros eaten, the daily targets and which meals are logged.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_week_history',
    description: 'Calories, protein and on-target status for each of the last 7 days.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_report_markers',
    description: "The user's latest lab marker values with their status (low, in range, high).",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'log_meal',
    description:
      'Log food the user says they ate, from a short description such as "2 idli and chutney".',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'What was eaten, with quantities if given' },
        mealType: { type: 'string', enum: MealTypeSchema.options },
      },
      required: ['description'],
    },
  },
];

const json = (value: unknown) => JSON.stringify(value);

/** Executes chat tools against the user's own data; the model never sees other users. */
@Injectable()
export class ChatToolbox {
  constructor(
    private readonly summaries: SummaryService,
    private readonly goals: GoalsService,
    private readonly markers: MarkerQueryService,
    private readonly meals: MealsService,
    private readonly parsing: MealParsingService,
    private readonly clock: Clock,
  ) {}

  async execute(user: RequestUser, call: ToolCall): Promise<ToolOutcome> {
    switch (call.name) {
      case 'get_today_summary':
        return this.todaySummary(user);
      case 'get_week_history':
        return this.weekHistory(user);
      case 'get_report_markers':
        return this.reportMarkers(user);
      case 'log_meal':
        return this.logMeal(user, call);
      default:
        return { result: json({ error: `Unknown tool ${call.name}` }), cards: [] };
    }
  }

  private async todaySummary(user: RequestUser): Promise<ToolOutcome> {
    const { date } = localClock(this.clock.now(), user.timezone);
    const [summary, targets, meals] = await Promise.all([
      this.summaries.forDate(user.id, date),
      this.goals.activeTargets(user.id),
      this.meals.listForDate(user.id, date),
    ]);
    const targetKcal = targets?.kcal ?? 0;
    return {
      result: json({
        date,
        eaten: summary.consumed,
        targets,
        kcalRemaining: targetKcal - summary.consumed.kcal,
        mealsLogged: meals.map((meal) => meal.mealType),
      }),
      cards: [{ type: 'day', consumed: summary.consumed, targetKcal }],
    };
  }

  private async weekHistory(user: RequestUser): Promise<ToolOutcome> {
    const { date } = localClock(this.clock.now(), user.timezone);
    const days = await this.summaries.range(user.id, addDays(date, -6), date);
    return {
      result: json(
        days.map((day) => ({
          date: day.date,
          kcal: day.consumed.kcal,
          proteinG: day.consumed.proteinG,
          meals: day.mealsCount,
          onTarget: day.onTarget,
        })),
      ),
      cards: [],
    };
  }

  private async reportMarkers(user: RequestUser): Promise<ToolOutcome> {
    const readings = await this.markers.latestReadings(user.id);
    const cards: ChatCard[] = readings
      .filter((reading) => isFlagged(reading.status))
      .slice(0, MAX_MARKER_CARDS)
      .map(({ reportId: _reportId, takenAt: _takenAt, ...marker }) => ({
        type: 'marker',
        marker: { ...marker, trend: [] } satisfies Biomarker,
      }));
    return {
      result: json(
        readings.map((reading) => ({
          marker: getMarkerDefinition(reading.code).label,
          value: reading.normalizedValue,
          unit: reading.canonicalUnit,
          status: reading.status,
          date: reading.takenAt.toISOString().slice(0, 10),
        })),
      ),
      cards,
    };
  }

  private async logMeal(user: RequestUser, call: ToolCall): Promise<ToolOutcome> {
    const args = LogMealArgsSchema.safeParse(call.arguments);
    if (!args.success)
      return { result: json({ error: 'A meal description is required' }), cards: [] };

    const now = this.clock.now();
    const mealType = args.data.mealType ?? guessMealType(localClock(now, user.timezone).hour);
    try {
      const parsed = await this.parsing.parse(user.id, {
        source: 'text',
        mealType,
        mediaKey: null,
        text: args.data.description,
      });
      if (parsed.outcome !== 'parsed')
        return { result: json({ logged: false, reason: parsed.outcome }), cards: [] };

      const response = await this.meals.create(user, idempotencyKeyFor(user.id, call), {
        mealType,
        eatenAt: now.toISOString(),
        source: 'chat',
        mediaKey: null,
        rawText: args.data.description,
        items: parsed.items.map(({ clarification: _c, ...item }) => ({ ...item, edited: false })),
      });
      const targets = await this.goals.activeTargets(user.id);
      return {
        result: json({
          logged: true,
          items: response.meal.items.map((item) => `${item.quantity} ${item.unit} ${item.name}`),
          mealKcal: response.meal.totals.kcal,
          kcalRemainingToday: targets ? targets.kcal - response.summary.consumed.kcal : null,
        }),
        cards: [{ type: 'meal', meal: response.meal }],
      };
    } catch (error) {
      if (error instanceof AiUnavailableError)
        return { result: json({ logged: false, reason: 'unavailable' }), cards: [] };
      throw error;
    }
  }
}

const idempotencyKeyFor = (userId: string, call: ToolCall) =>
  `chat:${createHash('sha256').update(`${userId}:${call.id}`).digest('hex').slice(0, 40)}`;

import { AiUnavailableError } from '../../ai/llm-errors';
import type { Clock } from '../../common/clock';
import type { AppConfig } from '../../config/app-config';
import type { MealRecord, MealRepository } from './meal.repository';
import type { MealsService } from './meals.service';
import type { MealParsingService, ParseResult } from './parsing/meal-parsing.service';
import { PendingMealWorker } from './pending-meal.worker';

const pending = (id: string, overrides: Partial<MealRecord> = {}): MealRecord => ({
  id,
  userId: 'u',
  mealType: 'lunch',
  eatenAt: new Date(),
  localDate: '2026-10-08',
  source: 'text',
  mediaKey: null,
  rawText: '2 roti',
  status: 'pending',
  idempotencyKey: id,
  requestHash: 'h',
  totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  items: [],
  ...overrides,
});

const parsedRoti: ParseResult = {
  outcome: 'parsed',
  items: [
    {
      name: 'Roti',
      quantity: 2,
      unit: 'roti',
      kcal: 240,
      proteinG: 7,
      carbsG: 40,
      fatG: 6,
      fiberG: 5,
      confidence: 0.9,
      dishRefId: 'r',
      clarification: null,
    },
  ],
};

function setup(meals: MealRecord[], parse: jest.Mock) {
  const applied: Array<{ id: string; items: unknown[] }> = [];
  const worker = new PendingMealWorker(
    { listPending: async () => meals } as unknown as MealRepository,
    {
      applyEnrichment: async (meal: MealRecord, items: unknown[]) =>
        applied.push({ id: meal.id, items }),
    } as unknown as MealsService,
    { parse } as unknown as MealParsingService,
    { backgroundJobs: false } as AppConfig,
    { now: () => new Date('2026-10-08T10:00:00Z') } as Clock,
  );
  return { worker, applied };
}

describe('PendingMealWorker', () => {
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));

  it('fills in pending meals with parsed, unedited items', async () => {
    const { worker, applied } = setup([pending('a')], jest.fn().mockResolvedValue(parsedRoti));
    await expect(worker.runOnce()).resolves.toBe(1);
    expect(applied).toEqual([
      { id: 'a', items: [expect.objectContaining({ name: 'Roti', edited: false })] },
    ]);
    expect(applied[0]?.items[0]).not.toHaveProperty('clarification');
  });

  it('stops early while the model is still unavailable', async () => {
    const parse = jest.fn().mockRejectedValue(new AiUnavailableError([]));
    const { worker, applied } = setup([pending('a'), pending('b')], parse);
    await expect(worker.runOnce()).resolves.toBe(0);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(applied).toEqual([]);
  });

  it('closes out meals with nothing to parse or no food', async () => {
    const parse = jest.fn().mockResolvedValue({ outcome: 'not_food' });
    const { worker, applied } = setup(
      [pending('empty', { rawText: null }), pending('shoe')],
      parse,
    );
    await worker.runOnce();
    expect(applied).toEqual([
      { id: 'empty', items: [] },
      { id: 'shoe', items: [] },
    ]);
  });
});

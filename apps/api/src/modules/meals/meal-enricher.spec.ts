import type { MealParseOutput } from '../../ai/prompts';
import { DishMatcher } from '../../domain/nutrition';
import { DishCatalog, type Dish } from './dish-catalog';
import { MealEnricher } from './meal-enricher';

const dishes: Dish[] = [
  {
    id: 'dal',
    name: 'Dal tadka',
    aliases: ['dal'],
    unit: 'katori',
    kcalPerUnit: 160,
    proteinG: 9,
    carbsG: 22,
    fatG: 4,
    fiberG: 5,
  },
  {
    id: 'roti',
    name: 'Roti',
    aliases: ['chapati'],
    unit: 'roti',
    kcalPerUnit: 120,
    proteinG: 3.5,
    carbsG: 20,
    fatG: 3,
    fiberG: 2.5,
  },
];

class InMemoryCatalog extends DishCatalog {
  private readonly matcher = new DishMatcher(dishes);
  async match(name: string) {
    return this.matcher.match(name);
  }
}

type Item = MealParseOutput['items'][number];
const item = (overrides: Partial<Item>): Item => ({
  name: 'Dal',
  quantity: 1,
  unit: 'katori',
  kcal: 999,
  proteinG: 1,
  carbsG: 1,
  fatG: 1,
  fiberG: 1,
  confidence: 0.9,
  clarification: { question: 'Which dal?', options: ['Toor', 'Moong'] },
  ...overrides,
});

describe('MealEnricher', () => {
  const enricher = new MealEnricher(new InMemoryCatalog());

  it('replaces model estimates with curated values', async () => {
    const [dal] = await enricher.enrich([item({ quantity: 1.5 })]);
    expect(dal).toMatchObject({ name: 'Dal tadka', dishRefId: 'dal', kcal: 240, proteinG: 13.5 });
  });

  it('maps a generic serving onto the dish unit', async () => {
    const [roti] = await enricher.enrich([item({ name: 'chapati', quantity: 2, unit: 'serving' })]);
    expect(roti).toMatchObject({ name: 'Roti', unit: 'roti', kcal: 240 });
  });

  it('keeps the estimate when units cannot be converted', async () => {
    const [dal] = await enricher.enrich([item({ unit: 'plate', kcal: 300 })]);
    expect(dal).toMatchObject({ dishRefId: 'dal', kcal: 300 });
  });

  it('keeps unknown dishes as estimated', async () => {
    const [sushi] = await enricher.enrich([item({ name: 'Sushi platter', kcal: 420 })]);
    expect(sushi).toMatchObject({ name: 'Sushi platter', dishRefId: null, kcal: 420 });
  });

  it('only asks a clarifying question when confidence is low', async () => {
    const [confident, unsure] = await enricher.enrich([
      item({ confidence: 0.9 }),
      item({ confidence: 0.4 }),
    ]);
    expect(confident?.clarification).toBeNull();
    expect(unsure?.clarification).toEqual({ question: 'Which dal?', options: ['Toor', 'Moong'] });
  });
});

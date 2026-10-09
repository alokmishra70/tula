import type { MealItemDraft } from '@tula/shared';
import { scaleItem, sumItems, toItemInput } from './meal-math';

const dal: MealItemDraft = {
  name: 'Dal tadka',
  quantity: 1,
  unit: 'katori',
  kcal: 160,
  proteinG: 9,
  carbsG: 22,
  fatG: 4,
  fiberG: 5,
  confidence: 0.9,
  dishRefId: 'd',
  clarification: null,
};

describe('meal maths', () => {
  it('scales nutrients with the portion', () => {
    expect(scaleItem(dal, 1.5)).toMatchObject({
      quantity: 1.5,
      kcal: 240,
      proteinG: 13.5,
      fiberG: 7.5,
    });
  });

  it('sums a meal', () => {
    expect(sumItems([dal, scaleItem(dal, 0.5)])).toEqual({
      kcal: 240,
      proteinG: 13.5,
      carbsG: 33,
      fatG: 6,
      fiberG: 7.5,
    });
  });

  it('drops the clarification and records whether the item was edited', () => {
    const input = toItemInput(
      { ...dal, clarification: { question: 'Which dal?', options: ['Toor', 'Moong'] } },
      true,
    );
    expect(input).not.toHaveProperty('clarification');
    expect(input.edited).toBe(true);
  });
});

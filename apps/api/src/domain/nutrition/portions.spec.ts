import { convertQuantity, nutritionForPortion } from './portions';

describe('convertQuantity', () => {
  it('converts between volume units', () => {
    expect(convertQuantity(1, 'bowl', 'katori')).toBeCloseTo(1.667, 2);
    expect(convertQuantity(2, 'tbsp', 'ml')).toBe(30);
  });

  it('treats piece and roti as the same count', () => {
    expect(convertQuantity(2, 'piece', 'roti')).toBe(2);
  });

  it('refuses incomparable units', () => {
    expect(convertQuantity(1, 'plate', 'katori')).toBeNull();
    expect(convertQuantity(1, 'piece', 'katori')).toBeNull();
  });
});

describe('nutritionForPortion', () => {
  const dal = {
    unit: 'katori' as const,
    kcalPerUnit: 160,
    proteinG: 9,
    carbsG: 22,
    fatG: 4,
    fiberG: 5,
  };

  it('scales per-unit values so "1 katori dal" is always the same', () => {
    expect(nutritionForPortion(dal, 1, 'katori')).toEqual({
      kcal: 160,
      proteinG: 9,
      carbsG: 22,
      fatG: 4,
      fiberG: 5,
    });
    expect(nutritionForPortion(dal, 1.5, 'katori')?.kcal).toBe(240);
  });

  it('returns null when the unit cannot be converted', () => {
    expect(nutritionForPortion(dal, 1, 'plate')).toBeNull();
  });
});

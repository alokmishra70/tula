import { classify, hasImproved } from './classify';

const ldlRange = { low: null, high: 129 };
const noCritical = { low: null, high: null };

describe('classify', () => {
  it('returns low, in range and high', () => {
    const range = { low: 30, high: 100 };
    expect(classify(20, range, noCritical)).toBe('low');
    expect(classify(30, range, noCritical)).toBe('in_range');
    expect(classify(100, range, noCritical)).toBe('in_range');
    expect(classify(101, range, noCritical)).toBe('high');
  });

  it('checks critical bounds first', () => {
    expect(classify(251, { low: 70, high: 99 }, { low: 54, high: 250 })).toBe('critical');
    expect(classify(50, { low: 70, high: 99 }, { low: 54, high: 250 })).toBe('critical');
  });
});

describe('hasImproved', () => {
  it('detects a value moving toward the range', () => {
    expect(hasImproved(152, 138, ldlRange)).toBe(true);
    expect(hasImproved(152, 120, ldlRange)).toBe(true);
  });

  it('ignores noise and regressions', () => {
    expect(hasImproved(152, 151.5, ldlRange)).toBe(false);
    expect(hasImproved(138, 152, ldlRange)).toBe(false);
    expect(hasImproved(110, 100, ldlRange)).toBe(false);
  });
});

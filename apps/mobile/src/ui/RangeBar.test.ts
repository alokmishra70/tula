import { rangeDomain } from './RangeBar';

describe('rangeDomain', () => {
  it('places the value inside the bar with the healthy zone around the range', () => {
    const { lowPct, highPct, valuePct } = rangeDomain(152, null, 129);
    expect(lowPct).toBe(0);
    expect(highPct).toBeGreaterThan(0);
    expect(valuePct).toBeGreaterThan(highPct);
    expect(valuePct).toBeLessThan(100);
  });

  it('keeps low values on the left of the range', () => {
    const { lowPct, valuePct } = rangeDomain(18, 30, 100);
    expect(valuePct).toBeLessThan(lowPct);
    expect(valuePct).toBeGreaterThanOrEqual(0);
  });
});

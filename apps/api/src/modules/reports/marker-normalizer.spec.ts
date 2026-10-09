import { toNewBiomarker, userEnteredBiomarker } from './marker-normalizer';

describe('marker normalizer', () => {
  it('stores canonical values, range and explanation', () => {
    const marker = toNewBiomarker(
      { rawName: 'LDL Cholesterol', value: 3.9, unit: 'mmol/L', refLow: null, refHigh: 3.36 },
      'male',
    );
    expect(marker).toMatchObject({ code: 'ldl', status: 'high', canonicalUnit: 'mg/dL' });
    expect(marker.normalizedValue).toBeCloseTo(150.8, 1);
    expect(marker.explanation?.action).toContain('Fibre target raised to 30 g');
  });

  it('gives a doctor referral instead of tips for critical values', () => {
    const marker = toNewBiomarker(
      { rawName: 'FBS', value: 280, unit: 'mg/dL', refLow: 70, refHigh: 100 },
      'female',
    );
    expect(marker.status).toBe('critical');
    expect(marker.explanation).toMatchObject({
      why: 'Please see a doctor soon about this value.',
      action: null,
    });
  });

  it('accepts a user correction, keeping the printed range', () => {
    const stored = { rawName: 'HbA1c', refLow: 4, refHigh: 6 };
    const corrected = userEnteredBiomarker(stored, 6.5, '%', 'male');
    expect(corrected).toMatchObject({ status: 'high', needsConfirmation: false, refHigh: 6 });
  });

  it('trusts a confirmed value even when it looked implausible', () => {
    const corrected = userEnteredBiomarker(
      { rawName: 'HbA1c', refLow: null, refHigh: null },
      21,
      '%',
      'male',
    );
    expect(corrected.needsConfirmation).toBe(false);
  });

  it('still flags unknown units for review', () => {
    const corrected = userEnteredBiomarker(
      { rawName: 'LDL', refLow: null, refHigh: null },
      150,
      'bananas',
      'male',
    );
    expect(corrected).toMatchObject({ status: 'unclassified', needsConfirmation: true });
  });
});

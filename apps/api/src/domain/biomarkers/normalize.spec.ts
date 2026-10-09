import { normalizeMarker, resolveMarker, type RawMarker } from './normalize';

const raw = (overrides: Partial<RawMarker>): RawMarker => ({
  rawName: 'LDL Cholesterol',
  value: 152,
  unit: 'mg/dL',
  refLow: null,
  refHigh: null,
  ...overrides,
});

describe('resolveMarker', () => {
  it.each([
    ['Glycated Haemoglobin (HbA1c)', 'hba1c'],
    ['A1C', 'hba1c'],
    ['LDL Cholesterol - Direct', 'ldl'],
    ['HDL-C', 'hdl'],
    ['Cholesterol, Total', 'total_cholesterol'],
    ['25-OH Vitamin D (Total)', 'vitamin_d'],
    ['Vitamin B12', 'vitamin_b12'],
    ['Hemoglobin', 'haemoglobin'],
    ['TSH - Ultrasensitive', 'tsh'],
    ['Serum Creatinine', 'creatinine'],
    ['Fasting Blood Sugar (FBS)', 'fasting_glucose'],
  ])('%s -> %s', (name, code) => {
    expect(resolveMarker(name)?.code).toBe(code);
  });

  it.each(['Non-HDL Cholesterol', 'VLDL Cholesterol', 'LDL/HDL Ratio', 'Serum Ferritin'])(
    'does not misread %s',
    (name) => {
      expect(resolveMarker(name)).toBeNull();
    },
  );
});

describe('normalizeMarker', () => {
  it('flags high LDL against the default range', () => {
    expect(normalizeMarker(raw({}), 'male')).toMatchObject({
      code: 'ldl',
      normalizedValue: 152,
      canonicalUnit: 'mg/dL',
      status: 'high',
      needsConfirmation: false,
    });
  });

  it('converts mmol/L to mg/dL, including the printed range', () => {
    const result = normalizeMarker(
      raw({ rawName: 'Fasting Glucose', value: 5.5, unit: 'mmol/L', refLow: 3.9, refHigh: 5.5 }),
      'female',
    );
    expect(result.normalizedValue).toBeCloseTo(99.09, 1);
    expect(result.range.high).toBeCloseTo(99.09, 1);
    expect(result.status).toBe('in_range');
  });

  it('converts HbA1c from mmol/mol', () => {
    const result = normalizeMarker(raw({ rawName: 'HbA1c', value: 42, unit: 'mmol/mol' }), 'male');
    expect(result.normalizedValue).toBeCloseTo(6.0, 1);
    expect(result.status).toBe('high');
  });

  it('prefers the printed range over the default', () => {
    const result = normalizeMarker(raw({ value: 140, refHigh: 160 }), 'male');
    expect(result.status).toBe('in_range');
  });

  it('uses sex-specific defaults', () => {
    const hdl = raw({ rawName: 'HDL', value: 45 });
    expect(normalizeMarker(hdl, 'male').status).toBe('in_range');
    expect(normalizeMarker(hdl, 'female').status).toBe('low');
  });

  it('marks critical fasting glucose', () => {
    expect(normalizeMarker(raw({ rawName: 'FBS', value: 260 }), 'male').status).toBe('critical');
  });

  it('holds implausible values for confirmation', () => {
    const result = normalizeMarker(raw({ rawName: 'HbA1c', value: 65, unit: '%' }), 'male');
    expect(result).toMatchObject({ needsConfirmation: true, reviewReason: 'implausible_value' });
  });

  it('holds unknown units for review without classifying', () => {
    const result = normalizeMarker(raw({ unit: 'furlongs' }), 'male');
    expect(result).toMatchObject({
      code: 'ldl',
      normalizedValue: null,
      status: 'unclassified',
      needsConfirmation: true,
      reviewReason: 'unknown_unit',
    });
  });

  it('stores unknown markers without explaining them', () => {
    const result = normalizeMarker(
      raw({ rawName: 'Serum Ferritin', value: 80, unit: 'ng/mL' }),
      'male',
    );
    expect(result).toMatchObject({ code: null, status: 'unclassified', needsConfirmation: false });
  });

  it('accepts unit spelling variants', () => {
    const result = normalizeMarker(raw({ rawName: 'TSH', value: 5.8, unit: 'μIU/mL' }), 'female');
    expect(result.status).toBe('high');
  });
});

import type { MarkerCode, Sex } from '@tula/shared';

export interface Range {
  low: number | null;
  high: number | null;
}

type Converter = (value: number) => number;

export interface MarkerGuidance {
  why: string;
  action: string | null;
}

export interface MarkerDefinition {
  code: MarkerCode;
  label: string;
  /** Matched as whole-word phrases, longest first. */
  aliases: readonly string[];
  canonicalUnit: string;
  /** Normalised unit -> converter into the canonical unit. */
  units: Readonly<Record<string, Converter>>;
  range: Range | Readonly<Record<Sex, Range>>;
  critical: Range;
  /** Values outside these limits are almost certainly extraction errors. */
  plausible: { min: number; max: number };
  what: string;
  guidance: { low?: MarkerGuidance; high?: MarkerGuidance };
}

const identity: Converter = (value) => value;
const times =
  (factor: number): Converter =>
  (value) =>
    value * factor;
const none: Range = { low: null, high: null };

const DEFINITIONS: readonly MarkerDefinition[] = [
  {
    code: 'hba1c',
    label: 'HbA1c',
    aliases: [
      'hba1c',
      'hb a1c',
      'a1c',
      'glycated haemoglobin',
      'glycated hemoglobin',
      'glycosylated haemoglobin',
      'glycosylated hemoglobin',
    ],
    canonicalUnit: '%',
    units: { '%': identity, 'mmol/mol': (v) => v / 10.929 + 2.15 },
    range: { low: null, high: 5.6 },
    critical: { low: null, high: 10 },
    plausible: { min: 3, max: 20 },
    what: 'Your average blood sugar over the last three months.',
    guidance: {
      high: {
        why: 'Steadier blood sugar lowers long-term risk.',
        action: 'Added sugar capped and carbs moved earlier in the day.',
      },
    },
  },
  {
    code: 'fasting_glucose',
    label: 'Fasting glucose',
    aliases: [
      'fasting glucose',
      'fasting blood sugar',
      'fasting blood glucose',
      'fasting plasma glucose',
      'glucose fasting',
      'blood sugar fasting',
      'fbs',
      'fbg',
      'fpg',
    ],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'mmol/l': times(18.016) },
    range: { low: 70, high: 99 },
    critical: { low: 54, high: 250 },
    plausible: { min: 20, max: 1000 },
    what: 'Blood sugar after not eating overnight.',
    guidance: {
      high: {
        why: 'Balanced meals keep morning sugar steadier.',
        action: 'Pair every carb with dal, paneer or eggs.',
      },
      low: { why: 'Low fasting sugar can leave you shaky.', action: null },
    },
  },
  {
    code: 'total_cholesterol',
    label: 'Total cholesterol',
    aliases: ['total cholesterol', 'cholesterol total', 'serum cholesterol', 'cholesterol serum'],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'mmol/l': times(38.67) },
    range: { low: null, high: 199 },
    critical: none,
    plausible: { min: 50, max: 700 },
    what: 'All the cholesterol carried in your blood.',
    guidance: { high: { why: 'Fibre and less fried food bring it down.', action: null } },
  },
  {
    code: 'ldl',
    label: 'LDL',
    aliases: [
      'ldl',
      'ldl cholesterol',
      'ldl c',
      'cholesterol ldl',
      'low density lipoprotein',
      'ldl direct',
    ],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'mmol/l': times(38.67) },
    range: { low: null, high: 129 },
    critical: none,
    plausible: { min: 10, max: 500 },
    what: 'The cholesterol that builds up in arteries.',
    guidance: {
      high: {
        why: 'Soluble fibre and less saturated fat lower LDL.',
        action: 'Fibre target raised to 30 g; saturated fat capped.',
      },
    },
  },
  {
    code: 'hdl',
    label: 'HDL',
    aliases: [
      'hdl',
      'hdl cholesterol',
      'hdl c',
      'cholesterol hdl',
      'high density lipoprotein',
      'hdl direct',
    ],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'mmol/l': times(38.67) },
    range: { male: { low: 40, high: null }, female: { low: 50, high: null } },
    critical: none,
    plausible: { min: 5, max: 200 },
    what: 'The cholesterol that helps clear the bad kind.',
    guidance: { low: { why: 'Movement and healthy fats help raise HDL.', action: null } },
  },
  {
    code: 'triglycerides',
    label: 'Triglycerides',
    aliases: ['triglycerides', 'triglyceride', 'serum triglycerides', 'tg', 'trigs'],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'mmol/l': times(88.57) },
    range: { low: null, high: 149 },
    critical: { low: null, high: 500 },
    plausible: { min: 10, max: 5000 },
    what: 'Fat in the blood, linked to sugar and refined carbs.',
    guidance: { high: { why: 'Less sugar and maida lowers triglycerides.', action: null } },
  },
  {
    code: 'vitamin_d',
    label: 'Vitamin D',
    aliases: [
      'vitamin d',
      'vitamin d3',
      'vit d',
      'vitamin d total',
      '25 oh vitamin d',
      '25 hydroxy vitamin d',
      '25 oh d',
      '25 hydroxyvitamin d',
    ],
    canonicalUnit: 'ng/mL',
    units: { 'ng/ml': identity, 'nmol/l': times(0.4006), 'ug/l': identity },
    range: { low: 30, high: 100 },
    critical: none,
    plausible: { min: 2, max: 250 },
    what: 'Helps bones, muscles and immunity.',
    guidance: {
      low: {
        why: 'Low vitamin D often shows up as tiredness.',
        action: 'Vitamin D foods added to your suggestions.',
      },
      high: { why: 'Very high levels usually come from supplements.', action: null },
    },
  },
  {
    code: 'vitamin_b12',
    label: 'Vitamin B12',
    aliases: ['vitamin b12', 'vit b12', 'b12', 'cobalamin', 'cyanocobalamin', 'vitamin b 12'],
    canonicalUnit: 'pg/mL',
    units: { 'pg/ml': identity, 'pmol/l': times(1.355), 'ng/l': identity },
    range: { low: 200, high: 900 },
    critical: none,
    plausible: { min: 20, max: 5000 },
    what: 'Needed for energy and healthy nerves.',
    guidance: {
      low: {
        why: 'Vegetarian diets often run low on B12.',
        action: 'B12 foods added to your suggestions.',
      },
    },
  },
  {
    code: 'haemoglobin',
    label: 'Haemoglobin',
    aliases: ['haemoglobin', 'hemoglobin', 'hb', 'hgb', 'haemoglobin hb', 'hemoglobin hb'],
    canonicalUnit: 'g/dL',
    units: { 'g/dl': identity, 'g/l': times(0.1) },
    range: { male: { low: 13, high: 17 }, female: { low: 12, high: 15.5 } },
    critical: { low: 7, high: null },
    plausible: { min: 3, max: 25 },
    what: 'Carries oxygen in your blood.',
    guidance: { low: { why: 'Iron-rich foods help build haemoglobin.', action: null } },
  },
  {
    code: 'tsh',
    label: 'TSH',
    aliases: [
      'tsh',
      'thyroid stimulating hormone',
      'tsh ultrasensitive',
      'ultrasensitive tsh',
      'tsh 3rd generation',
    ],
    canonicalUnit: 'µIU/mL',
    units: { 'uiu/ml': identity, 'miu/l': identity, 'mu/l': identity, 'uu/ml': identity },
    range: { low: 0.4, high: 4.5 },
    critical: none,
    plausible: { min: 0.005, max: 150 },
    what: 'Shows how hard your thyroid is being pushed.',
    guidance: {
      high: { why: 'Thyroid levels affect energy and weight.', action: null },
      low: { why: 'Thyroid levels affect energy and weight.', action: null },
    },
  },
  {
    code: 'creatinine',
    label: 'Creatinine',
    aliases: ['creatinine', 'serum creatinine', 'creatinine serum'],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'umol/l': times(0.0113) },
    range: { male: { low: 0.7, high: 1.3 }, female: { low: 0.6, high: 1.1 } },
    critical: { low: null, high: 4 },
    plausible: { min: 0.1, max: 20 },
    what: 'A waste product your kidneys filter out.',
    guidance: { high: { why: 'Water through the day supports your kidneys.', action: null } },
  },
  {
    code: 'uric_acid',
    label: 'Uric acid',
    aliases: ['uric acid', 'serum uric acid', 'urate', 'uric acid serum'],
    canonicalUnit: 'mg/dL',
    units: { 'mg/dl': identity, 'umol/l': times(0.0168) },
    range: { male: { low: 3.4, high: 7 }, female: { low: 2.4, high: 6 } },
    critical: none,
    plausible: { min: 0.5, max: 20 },
    what: 'Builds up from purines in some foods and drinks.',
    guidance: { high: { why: 'Water and fewer sugary drinks help lower it.', action: null } },
  },
];

export const MARKER_REGISTRY: ReadonlyMap<MarkerCode, MarkerDefinition> = new Map(
  DEFINITIONS.map((definition) => [definition.code, definition]),
);

export function getMarkerDefinition(code: MarkerCode): MarkerDefinition {
  const definition = MARKER_REGISTRY.get(code);
  if (!definition) throw new Error(`No marker definition for ${code}`);
  return definition;
}

export function defaultRange(definition: MarkerDefinition, sex: Sex): Range {
  return 'male' in definition.range ? definition.range[sex] : (definition.range as Range);
}

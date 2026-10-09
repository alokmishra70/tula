import type { MarkerCode, MarkerStatus } from '@tula/shared';

export const MARKER_LABELS: Record<MarkerCode, string> = {
  hba1c: 'HbA1c',
  fasting_glucose: 'Fasting glucose',
  total_cholesterol: 'Total cholesterol',
  ldl: 'LDL',
  hdl: 'HDL',
  triglycerides: 'Triglycerides',
  vitamin_d: 'Vitamin D',
  vitamin_b12: 'Vitamin B12',
  haemoglobin: 'Haemoglobin',
  tsh: 'TSH',
  creatinine: 'Creatinine',
  uric_acid: 'Uric acid',
};

/** Status always has a word, never colour alone. */
export const STATUS_WORD: Record<MarkerStatus, string> = {
  low: 'Low',
  high: 'High',
  critical: 'See a doctor',
  in_range: 'In range',
  unclassified: 'Check',
};

export const STATUS_CHIP: Record<MarkerStatus, 'good' | 'warn' | 'alert' | undefined> = {
  low: 'warn',
  high: 'warn',
  critical: 'alert',
  in_range: 'good',
  unclassified: undefined,
};

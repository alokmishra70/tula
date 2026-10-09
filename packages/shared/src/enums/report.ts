import { z } from 'zod';

export const MARKER_CODES = [
  'hba1c',
  'fasting_glucose',
  'total_cholesterol',
  'ldl',
  'hdl',
  'triglycerides',
  'vitamin_d',
  'vitamin_b12',
  'haemoglobin',
  'tsh',
  'creatinine',
  'uric_acid',
] as const;
export const MarkerCodeSchema = z.enum(MARKER_CODES);
export type MarkerCode = z.infer<typeof MarkerCodeSchema>;

// 'unclassified' covers unknown markers or units we can't normalise.
export const MARKER_STATUSES = ['low', 'in_range', 'high', 'critical', 'unclassified'] as const;
export const MarkerStatusSchema = z.enum(MARKER_STATUSES);
export type MarkerStatus = z.infer<typeof MarkerStatusSchema>;

export const REPORT_STATUSES = ['processing', 'ready', 'failed'] as const;
export const ReportStatusSchema = z.enum(REPORT_STATUSES);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const REPORT_ERROR_CODES = [
  'not_a_report',
  'unreadable',
  'extraction_failed',
  'file_too_large',
] as const;
export const ReportErrorCodeSchema = z.enum(REPORT_ERROR_CODES);
export type ReportErrorCode = z.infer<typeof ReportErrorCodeSchema>;

import { z } from 'zod';
import {
  MarkerCodeSchema,
  MarkerStatusSchema,
  ReportErrorCodeSchema,
  ReportStatusSchema,
} from '../enums';
import { IdSchema, IsoDateSchema, IsoDateTimeSchema } from './common';

export const RegisterReportRequestSchema = z.object({
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(200),
  fileHash: z.string().regex(/^[a-f0-9]{64}$/, 'Expected a SHA-256 hex digest'),
});
export type RegisterReportRequest = z.infer<typeof RegisterReportRequestSchema>;

export const MarkerExplanationSchema = z.object({
  what: z.string(),
  why: z.string(),
  action: z.string().nullable(),
});
export type MarkerExplanation = z.infer<typeof MarkerExplanationSchema>;

export const MarkerTrendPointSchema = z.object({
  reportDate: IsoDateSchema,
  value: z.number(),
});
export type MarkerTrendPoint = z.infer<typeof MarkerTrendPointSchema>;

export const BiomarkerSchema = z.object({
  id: IdSchema,
  code: MarkerCodeSchema.nullable(),
  rawName: z.string(),
  value: z.number(),
  unit: z.string(),
  normalizedValue: z.number().nullable(),
  canonicalUnit: z.string().nullable(),
  refLow: z.number().nullable(),
  refHigh: z.number().nullable(),
  status: MarkerStatusSchema,
  needsConfirmation: z.boolean(),
  explanation: MarkerExplanationSchema.nullable(),
  /** Earlier normalised values for the same marker, oldest first. */
  trend: z.array(MarkerTrendPointSchema),
});
export type Biomarker = z.infer<typeof BiomarkerSchema>;

export const ReportSummarySchema = z.object({
  id: IdSchema,
  fileName: z.string(),
  labName: z.string().nullable(),
  reportDate: IsoDateSchema.nullable(),
  status: ReportStatusSchema,
  errorCode: ReportErrorCodeSchema.nullable(),
  watchCount: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
});
export type ReportSummary = z.infer<typeof ReportSummarySchema>;

export const ReportDetailSchema = ReportSummarySchema.extend({
  markers: z.array(BiomarkerSchema),
});
export type ReportDetail = z.infer<typeof ReportDetailSchema>;

export const UpdateBiomarkerRequestSchema = z.object({
  value: z.number().nonnegative(),
  unit: z.string().min(1).max(20).optional(),
});
export type UpdateBiomarkerRequest = z.infer<typeof UpdateBiomarkerRequestSchema>;

export const AddBiomarkerRequestSchema = z.object({
  code: MarkerCodeSchema,
  value: z.number().nonnegative(),
  unit: z.string().min(1).max(20),
});
export type AddBiomarkerRequest = z.infer<typeof AddBiomarkerRequestSchema>;

export const FlaggedMarkerSchema = z.object({
  code: MarkerCodeSchema,
  reportId: IdSchema,
  value: z.number(),
  unit: z.string(),
  status: MarkerStatusSchema,
  improved: z.boolean(),
});
export type FlaggedMarker = z.infer<typeof FlaggedMarkerSchema>;

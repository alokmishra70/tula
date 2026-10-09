import { z } from 'zod';

export const ERROR_CODES = [
  'validation_failed',
  'unknown_device',
  'not_found',
  'conflict',
  'duplicate_report',
  'idempotency_mismatch',
  'payload_too_large',
  'rate_limited',
  'ai_unavailable',
  'service_unavailable',
  'internal_error',
] as const;
export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

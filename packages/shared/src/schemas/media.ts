import { z } from 'zod';
import { LIMITS } from '../constants';
import { MediaKindSchema } from '../enums';
import { IsoDateTimeSchema } from './common';

export const ALLOWED_CONTENT_TYPES = {
  meal_photo: ['image/jpeg', 'image/png', 'image/webp'],
  meal_audio: ['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/webm', 'audio/wav'],
  report: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

export const UploadUrlRequestSchema = z
  .object({
    kind: MediaKindSchema,
    contentType: z.string(),
    sizeBytes: z.number().int().positive().max(LIMITS.uploadMaxBytes),
  })
  .refine(
    ({ kind, contentType }) =>
      (ALLOWED_CONTENT_TYPES[kind] as readonly string[]).includes(contentType),
    { message: 'Unsupported content type for this media kind', path: ['contentType'] },
  );
export type UploadUrlRequest = z.infer<typeof UploadUrlRequestSchema>;

export const UploadUrlResponseSchema = z.object({
  key: z.string(),
  uploadUrl: z.url(),
  method: z.literal('PUT'),
  headers: z.record(z.string(), z.string()),
  expiresAt: IsoDateTimeSchema,
});
export type UploadUrlResponse = z.infer<typeof UploadUrlResponseSchema>;

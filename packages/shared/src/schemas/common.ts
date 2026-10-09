import { z } from 'zod';

export const IdSchema = z.uuid();
export const IsoDateSchema = z.iso.date();
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

const grams = z.number().nonnegative().max(5000);

export const MacrosSchema = z.object({
  kcal: z.number().nonnegative().max(20000),
  proteinG: grams,
  carbsG: grams,
  fatG: grams,
  fiberG: grams,
});
export type Macros = z.infer<typeof MacrosSchema>;

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

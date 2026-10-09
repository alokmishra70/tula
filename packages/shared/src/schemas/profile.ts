import { z } from 'zod';
import { ONBOARDING_BOUNDS } from '../constants';
import { ActivityLevelSchema, SexSchema } from '../enums';
import { IdSchema } from './common';

const { age, heightCm, weightKg } = ONBOARDING_BOUNDS;

export const UpsertProfileRequestSchema = z.object({
  name: z.string().trim().min(1).max(40),
  sex: SexSchema,
  age: z.number().int().min(age.min).max(age.max),
  heightCm: z.number().min(heightCm.min).max(heightCm.max),
  weightKg: z.number().min(weightKg.min).max(weightKg.max),
  activityLevel: ActivityLevelSchema,
  timezone: z.string().min(1).max(64),
});
export type UpsertProfileRequest = z.infer<typeof UpsertProfileRequestSchema>;

export const ProfileSchema = UpsertProfileRequestSchema.extend({
  id: IdSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

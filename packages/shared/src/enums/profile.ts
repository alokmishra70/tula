import { z } from 'zod';

export const SEXES = ['male', 'female'] as const;
export const SexSchema = z.enum(SEXES);
export type Sex = z.infer<typeof SexSchema>;

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'very_active'] as const;
export const ActivityLevelSchema = z.enum(ACTIVITY_LEVELS);
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;

export const GOAL_TYPES = ['lose_weight', 'maintain', 'build_muscle', 'improve_marker'] as const;
export const GoalTypeSchema = z.enum(GOAL_TYPES);
export type GoalType = z.infer<typeof GoalTypeSchema>;

import { z } from 'zod';

export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export const MealTypeSchema = z.enum(MEAL_TYPES);
export type MealType = z.infer<typeof MealTypeSchema>;

export const MEAL_SOURCES = ['photo', 'voice', 'text', 'chat', 'repeat'] as const;
export const MealSourceSchema = z.enum(MEAL_SOURCES);
export type MealSource = z.infer<typeof MealSourceSchema>;

export const MEAL_STATUSES = ['pending', 'parsed', 'confirmed'] as const;
export const MealStatusSchema = z.enum(MEAL_STATUSES);
export type MealStatus = z.infer<typeof MealStatusSchema>;

export const PORTION_UNITS = [
  'katori',
  'roti',
  'piece',
  'glass',
  'plate',
  'bowl',
  'cup',
  'slice',
  'tbsp',
  'serving',
  'g',
  'ml',
] as const;
export const PortionUnitSchema = z.enum(PORTION_UNITS);
export type PortionUnit = z.infer<typeof PortionUnitSchema>;

import type { MealType } from '@tula/shared';

/** One place for cache keys, so features can update each other's data without importing each other. */
export const queryKeys = {
  today: (date: string) => ['today', date] as const,
  todayAll: ['today'] as const,
  plan: ['plan'] as const,
  profile: ['profile'] as const,
  quickMeals: (mealType: MealType) => ['quick-meals', mealType] as const,
  reports: ['reports'] as const,
  report: (id: string) => ['report', id] as const,
  chatHistory: ['chat-history'] as const,
};

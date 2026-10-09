import { z } from 'zod';

export const NUDGE_RULES = [
  'first_meal',
  'missing_meal',
  'protein_gap',
  'fiber_gap',
  'calorie_room',
  'streak_protection',
  'day_complete',
] as const;
export const NudgeRuleSchema = z.enum(NUDGE_RULES);
export type NudgeRule = z.infer<typeof NudgeRuleSchema>;

export const NUDGE_ACTIONS = ['log_meal', 'open_reports', 'none'] as const;
export const NudgeActionSchema = z.enum(NUDGE_ACTIONS);
export type NudgeAction = z.infer<typeof NudgeActionSchema>;

export const CHAT_ROLES = ['user', 'assistant'] as const;
export const ChatRoleSchema = z.enum(CHAT_ROLES);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const MEDIA_KINDS = ['meal_photo', 'meal_audio', 'report'] as const;
export const MediaKindSchema = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof MediaKindSchema>;

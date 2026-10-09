import { z } from 'zod';
import { LIMITS } from '../constants';
import { ChatRoleSchema } from '../enums';
import { IdSchema, IsoDateTimeSchema, MacrosSchema } from './common';
import { MealSchema } from './meal';
import { BiomarkerSchema } from './report';

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(LIMITS.chatMessageMaxChars),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatCardSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('meal'), meal: MealSchema }),
  z.object({ type: z.literal('marker'), marker: BiomarkerSchema }),
  z.object({ type: z.literal('day'), consumed: MacrosSchema, targetKcal: z.number() }),
]);
export type ChatCard = z.infer<typeof ChatCardSchema>;

export const ChatMessageSchema = z.object({
  id: IdSchema,
  role: ChatRoleSchema,
  content: z.string(),
  cards: z.array(ChatCardSchema),
  createdAt: IsoDateTimeSchema,
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('token'), text: z.string() }),
  z.object({ type: z.literal('card'), card: ChatCardSchema }),
  z.object({ type: z.literal('done'), messageId: IdSchema }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
]);
export type ChatStreamEvent = z.infer<typeof ChatStreamEventSchema>;

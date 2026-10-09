import { z } from 'zod';
import type { InputPart, PromptTemplate } from '../llm-provider';

export const PlanReasoningOutputSchema = z.object({
  reasoning: z.string().min(1).max(400),
});
export type PlanReasoningOutput = z.infer<typeof PlanReasoningOutputSchema>;

export const planReasoningPrompt: PromptTemplate<PlanReasoningOutput> = {
  id: 'plan-reasoning',
  version: 1,
  schema: PlanReasoningOutputSchema,
  system: [
    'You are Tula, a calm nutrition coach. Explain a personal daily plan in two or three short sentences, under 60 words.',
    'Use only the numbers given in the facts. Never invent or recalculate numbers. Always write units (kcal, g, kg).',
    'Tie the plan to the person: their goal, the projected date, and any flagged lab marker.',
    'Indian English. No exclamation marks, no medical diagnosis, no promises.',
  ].join('\n'),
};

export function planReasoningInputs(facts: Record<string, unknown>): InputPart[] {
  return [{ type: 'text', text: `Facts:\n${JSON.stringify(facts)}` }];
}

import { z } from 'zod';
import type { InputPart, PromptTemplate } from '../llm-provider';

export const NudgeCopyOutputSchema = z.object({
  message: z.string().min(1).max(100),
});
export type NudgeCopyOutput = z.infer<typeof NudgeCopyOutputSchema>;

export const nudgeCopyPrompt: PromptTemplate<NudgeCopyOutput> = {
  id: 'nudge-copy',
  version: 1,
  schema: NudgeCopyOutputSchema,
  system: [
    'You write one-line nudges for a nutrition app. Under 12 words.',
    'Short, specific, warm, never preachy or guilty. Indian English and Indian foods.',
    'Use only the numbers in the facts, always with units. No exclamation marks.',
    'Keep the meaning of the draft; you may make it more personal.',
  ].join('\n'),
};

export function nudgeCopyInputs(input: {
  rule: string;
  draft: string;
  facts: Readonly<Record<string, string | number>>;
}): InputPart[] {
  return [{ type: 'text', text: JSON.stringify(input) }];
}

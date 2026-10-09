import { z } from 'zod';
import type { PromptTemplate } from '../llm-provider';
import { structuredCacheKey } from './cache-key';

const prompt = (version: number): PromptTemplate<unknown> => ({
  id: 'meal-parse',
  version,
  system: '',
  schema: z.unknown(),
});
const photo = (bytes: string) => ({
  type: 'image' as const,
  mimeType: 'image/jpeg',
  data: Buffer.from(bytes),
});

describe('structuredCacheKey', () => {
  it('is stable for the same prompt and input', () => {
    expect(structuredCacheKey(prompt(1), [photo('abc')])).toBe(
      structuredCacheKey(prompt(1), [photo('abc')]),
    );
  });

  it('changes with the image bytes or the prompt version', () => {
    const base = structuredCacheKey(prompt(1), [photo('abc')]);
    expect(structuredCacheKey(prompt(1), [photo('abd')])).not.toBe(base);
    expect(structuredCacheKey(prompt(2), [photo('abc')])).not.toBe(base);
  });
});

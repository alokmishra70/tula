import { z } from 'zod';
import { LlmInvalidOutputError } from './llm-errors';

const FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;

export function parseStructuredOutput<T>(provider: string, raw: string, schema: z.ZodType<T>): T {
  const text = raw.trim().replace(FENCE, '$1');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new LlmInvalidOutputError(provider, 'Response was not valid JSON');
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new LlmInvalidOutputError(provider, z.prettifyError(result.error));
  return result.data;
}

const schemaCache = new WeakMap<z.ZodType, string>();

export function jsonSchemaFor(schema: z.ZodType): string {
  let cached = schemaCache.get(schema);
  if (!cached) {
    cached = JSON.stringify(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }));
    schemaCache.set(schema, cached);
  }
  return cached;
}

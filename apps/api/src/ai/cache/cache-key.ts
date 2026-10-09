import { createHash } from 'node:crypto';
import type { InputPart, PromptTemplate } from '../llm-provider';

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

/** Prompt version is part of the key, so editing a prompt invalidates old results. */
export function structuredCacheKey(prompt: PromptTemplate<unknown>, inputs: InputPart[]): string {
  const fingerprint = inputs.map((part) =>
    part.type === 'text' ? { text: part.text } : { media: part.mimeType, hash: sha256(part.data) },
  );
  return sha256(
    JSON.stringify({ prompt: prompt.id, version: prompt.version, inputs: fingerprint }),
  );
}

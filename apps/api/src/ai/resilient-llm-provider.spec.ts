import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { AiCacheStore } from './cache/ai-cache.store';
import {
  AiUnavailableError,
  LlmInvalidOutputError,
  LlmRateLimitError,
  LlmServerError,
  LlmTimeoutError,
} from './llm-errors';
import type { PromptTemplate, StructuredRequest } from './llm-provider';
import { ResilientLlmProvider } from './resilient-llm-provider';
import { ScriptedProvider } from './testing/scripted-provider';

class MemoryCache extends AiCacheStore {
  readonly entries = new Map<string, unknown>();
  async get(key: string) {
    return this.entries.get(key) ?? null;
  }
  async set(key: string, value: unknown) {
    this.entries.set(key, value);
  }
}

const prompt: PromptTemplate<{ answer: number }> = {
  id: 'probe',
  version: 1,
  system: '',
  schema: z.object({ answer: z.number() }),
};
const request: StructuredRequest<{ answer: number }> = {
  prompt,
  inputs: [{ type: 'text', text: 'question' }],
  timeoutMs: 1000,
};
const ok = { answer: 42 };

function setup(...providers: ScriptedProvider[]) {
  const cache = new MemoryCache();
  const sleeps: number[] = [];
  const resilient = new ResilientLlmProvider(providers, cache, {
    backoffMs: [500, 1500],
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  return { resilient, cache, sleeps };
}

describe('ResilientLlmProvider.generateStructured', () => {
  beforeAll(() => Logger.overrideLogger(false));

  it('returns the primary result and caches it', async () => {
    const primary = new ScriptedProvider('primary', [ok]);
    const { resilient, cache } = setup(primary);
    await expect(resilient.generateStructured(request)).resolves.toEqual(ok);
    expect(cache.entries.size).toBe(1);
  });

  it('serves repeats from cache without calling a model', async () => {
    const primary = new ScriptedProvider('primary', [ok]);
    const { resilient } = setup(primary);
    await resilient.generateStructured(request);
    await expect(resilient.generateStructured(request)).resolves.toEqual(ok);
    expect(primary.calls).toBe(1);
  });

  it('ignores cache entries that no longer match the schema', async () => {
    const primary = new ScriptedProvider('primary', [ok]);
    const { resilient, cache } = setup(primary);
    await resilient.generateStructured(request);
    for (const key of cache.entries.keys()) cache.entries.set(key, { answer: 'stale' });
    await resilient.generateStructured(request);
    expect(primary.calls).toBe(2);
  });

  it('backs off on rate limits and server errors before succeeding', async () => {
    const primary = new ScriptedProvider('primary', [
      new LlmRateLimitError('primary', '429'),
      new LlmServerError('primary', '503'),
      ok,
    ]);
    const { resilient, sleeps } = setup(primary);
    await expect(resilient.generateStructured(request)).resolves.toEqual(ok);
    expect(sleeps).toEqual([500, 1500]);
  });

  it('falls back after retries are exhausted', async () => {
    const primary = new ScriptedProvider('primary', [
      new LlmRateLimitError('primary', '429'),
      new LlmRateLimitError('primary', '429'),
      new LlmRateLimitError('primary', '429'),
    ]);
    const fallback = new ScriptedProvider('fallback', [ok]);
    const { resilient } = setup(primary, fallback);
    await expect(resilient.generateStructured(request)).resolves.toEqual(ok);
    expect(primary.calls).toBe(3);
  });

  it('falls back immediately on timeout', async () => {
    const primary = new ScriptedProvider('primary', [new LlmTimeoutError('primary', 'slow')]);
    const fallback = new ScriptedProvider('fallback', [ok]);
    const { resilient, sleeps } = setup(primary, fallback);
    await expect(resilient.generateStructured(request)).resolves.toEqual(ok);
    expect(sleeps).toEqual([]);
  });

  it('retries once with the validation error, then falls back', async () => {
    const invalid = new LlmInvalidOutputError('primary', 'answer: expected number');
    const primary = new ScriptedProvider('primary', [invalid, invalid]);
    const fallback = new ScriptedProvider('fallback', [ok]);
    const { resilient } = setup(primary, fallback);
    await expect(resilient.generateStructured(request)).resolves.toEqual(ok);
    expect(primary.corrections).toEqual([undefined, 'answer: expected number']);
  });

  it('ends in AiUnavailableError when every provider fails', async () => {
    const { resilient } = setup(
      new ScriptedProvider('primary', [new LlmTimeoutError('primary', 'slow')]),
      new ScriptedProvider('fallback', [new LlmTimeoutError('fallback', 'slow')]),
    );
    const error = await resilient.generateStructured(request).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiUnavailableError);
    expect((error as AiUnavailableError).causes).toHaveLength(2);
  });
});

describe('ResilientLlmProvider.streamText', () => {
  const chat = { system: '', messages: [], tools: [], timeoutMs: 1000 };
  const collect = async (iterable: AsyncIterable<unknown>) => {
    const out: unknown[] = [];
    for await (const chunk of iterable) out.push(chunk);
    return out;
  };

  it('falls back when a provider fails before streaming', async () => {
    const { resilient } = setup(
      new ScriptedProvider('primary', [], [new LlmServerError('primary', 'down')]),
      new ScriptedProvider('fallback', [], [{ type: 'text', text: 'hi' }]),
    );
    await expect(collect(resilient.streamText(chat))).resolves.toEqual([
      { type: 'text', text: 'hi' },
    ]);
  });

  it('does not switch providers mid-reply', async () => {
    const { resilient } = setup(
      new ScriptedProvider(
        'primary',
        [],
        [{ type: 'text', text: 'Hal' }, new LlmServerError('primary', 'cut')],
      ),
      new ScriptedProvider('fallback', [], [{ type: 'text', text: 'never' }]),
    );
    await expect(collect(resilient.streamText(chat))).rejects.toBeInstanceOf(LlmServerError);
  });
});

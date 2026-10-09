import { Logger } from '@nestjs/common';
import type { AiCacheStore } from './cache/ai-cache.store';
import { structuredCacheKey } from './cache/cache-key';
import { AiUnavailableError, LlmError, LlmInvalidOutputError } from './llm-errors';
import {
  LlmProvider,
  type LlmChatChunk,
  type LlmChatRequest,
  type StructuredRequest,
} from './llm-provider';

export interface ResilienceOptions {
  /** Waits before each retry of a rate-limited or failing provider. */
  backoffMs: readonly number[];
  sleep: (ms: number) => Promise<void>;
}

export const DEFAULT_RESILIENCE: ResilienceOptions = {
  backoffMs: [500, 1500],
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** Decorator adding caching, retries, one corrective retry and provider fallback. */
export class ResilientLlmProvider extends LlmProvider {
  readonly name: string;
  private readonly logger = new Logger(ResilientLlmProvider.name);

  constructor(
    private readonly providers: readonly LlmProvider[],
    private readonly cache: AiCacheStore,
    private readonly options: ResilienceOptions = DEFAULT_RESILIENCE,
  ) {
    super();
    if (providers.length === 0) throw new Error('At least one LLM provider is required');
    this.name = `resilient(${providers.map((p) => p.name).join(',')})`;
  }

  async generateStructured<T>(request: StructuredRequest<T>): Promise<T> {
    const key = structuredCacheKey(request.prompt, request.inputs);
    const cached = await this.readCache(key, request);
    if (cached !== null) return cached;

    const failures: string[] = [];
    for (const provider of this.providers) {
      try {
        const value = await this.withRetries(provider, request);
        await this.cache.set(key, value).catch((error: unknown) => {
          this.logger.warn({ event: 'ai_cache_write_failed', error: String(error) });
        });
        return value;
      } catch (error) {
        failures.push(describe(error));
        this.logger.warn({
          event: 'ai_provider_failed',
          provider: provider.name,
          prompt: request.prompt.id,
          error: describe(error),
        });
      }
    }
    throw new AiUnavailableError(failures);
  }

  async *streamText(request: LlmChatRequest): AsyncIterable<LlmChatChunk> {
    const failures: string[] = [];
    for (const provider of this.providers) {
      let started = false;
      try {
        for await (const chunk of provider.streamText(request)) {
          started = true;
          yield chunk;
        }
        return;
      } catch (error) {
        // Once text reached the user, switching models would produce a garbled reply.
        if (started) throw error;
        failures.push(describe(error));
        this.logger.warn({
          event: 'ai_stream_failed',
          provider: provider.name,
          error: describe(error),
        });
      }
    }
    throw new AiUnavailableError(failures);
  }

  private async withRetries<T>(provider: LlmProvider, request: StructuredRequest<T>): Promise<T> {
    let attempt = 0;
    let correction: string | undefined;
    for (;;) {
      try {
        return await provider.generateStructured(correction ? { ...request, correction } : request);
      } catch (error) {
        if (error instanceof LlmInvalidOutputError && correction === undefined) {
          correction = error.issues;
          continue;
        }
        const delay = this.options.backoffMs[attempt];
        if (error instanceof LlmError && error.retryable && delay !== undefined) {
          attempt++;
          await this.options.sleep(delay);
          continue;
        }
        throw error;
      }
    }
  }

  private async readCache<T>(key: string, request: StructuredRequest<T>): Promise<T | null> {
    try {
      const raw = await this.cache.get(key);
      if (raw === null) return null;
      const parsed = request.prompt.schema.safeParse(raw);
      this.logger.log({ event: 'ai_cache', prompt: request.prompt.id, hit: parsed.success });
      return parsed.success ? parsed.data : null;
    } catch (error) {
      this.logger.warn({ event: 'ai_cache_read_failed', error: String(error) });
      return null;
    }
  }
}

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

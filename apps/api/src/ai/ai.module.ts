import { Global, Module } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import type { LlmProviderName } from '../config/env.schema';
import { AiCacheStore } from './cache/ai-cache.store';
import { PrismaAiCacheStore } from './cache/prisma-ai-cache.store';
import { LlmProvider } from './llm-provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MockLlmProvider } from './providers/mock.provider';
import { ResilientLlmProvider } from './resilient-llm-provider';

function createProvider(name: LlmProviderName, config: AppConfig): LlmProvider {
  switch (name) {
    case 'gemini':
      return new GeminiProvider(config.ai.gemini!);
    case 'groq':
      return new GroqProvider(config.ai.groq!);
    case 'mock':
      return new MockLlmProvider();
  }
}

@Global()
@Module({
  providers: [
    { provide: AiCacheStore, useClass: PrismaAiCacheStore },
    {
      provide: LlmProvider,
      inject: [AppConfig, AiCacheStore],
      useFactory: (config: AppConfig, cache: AiCacheStore) =>
        new ResilientLlmProvider(
          config.ai.providers.map((name) => createProvider(name, config)),
          cache,
        ),
    },
  ],
  exports: [LlmProvider],
})
export class AiModule {}

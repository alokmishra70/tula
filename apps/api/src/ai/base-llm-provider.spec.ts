import { z } from 'zod';
import {
  BaseLlmProvider,
  type JsonCompletion,
  type JsonCompletionRequest,
} from './base-llm-provider';
import { LlmInvalidOutputError } from './llm-errors';
import type { LlmChatChunk, PromptTemplate } from './llm-provider';

class CannedProvider extends BaseLlmProvider {
  readonly name = 'canned';
  lastRequest?: JsonCompletionRequest;

  constructor(private readonly reply: string) {
    super();
  }

  protected async completeJson(request: JsonCompletionRequest): Promise<JsonCompletion> {
    this.lastRequest = request;
    return { text: this.reply, usage: { inputTokens: 10, outputTokens: 5 } };
  }

  async *streamText(): AsyncIterable<LlmChatChunk> {}
}

const prompt: PromptTemplate<{ ok: boolean }> = {
  id: 'probe',
  version: 3,
  system: 'Be helpful.',
  schema: z.object({ ok: z.boolean() }),
};

describe('BaseLlmProvider', () => {
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));

  it('appends the output schema to the system prompt and validates the reply', async () => {
    const provider = new CannedProvider('{"ok":true}');
    await expect(
      provider.generateStructured({ prompt, inputs: [], timeoutMs: 1000 }),
    ).resolves.toEqual({ ok: true });
    expect(provider.lastRequest?.system).toContain('Be helpful.');
    expect(provider.lastRequest?.system).toContain('"ok"');
  });

  it('includes a correction when retrying', async () => {
    const provider = new CannedProvider('{"ok":true}');
    await provider.generateStructured({
      prompt,
      inputs: [],
      timeoutMs: 1000,
      correction: 'ok must be boolean',
    });
    expect(provider.lastRequest?.system).toContain('ok must be boolean');
  });

  it('throws invalid output errors for bad replies', async () => {
    const provider = new CannedProvider('{"ok":"yes"}');
    await expect(
      provider.generateStructured({ prompt, inputs: [], timeoutMs: 1000 }),
    ).rejects.toBeInstanceOf(LlmInvalidOutputError);
  });
});

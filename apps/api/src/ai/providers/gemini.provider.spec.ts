import { z } from 'zod';
import { LlmRateLimitError, LlmTimeoutError } from '../llm-errors';
import type { LlmChatChunk } from '../llm-provider';
import { fakeFetch, jsonResponse, sseResponse } from '../testing/fake-fetch';
import { GeminiProvider } from './gemini.provider';

const prompt = { id: 'probe', version: 1, system: 'sys', schema: z.object({ ok: z.boolean() }) };
const create = (fetchFn: ReturnType<typeof fakeFetch>['fn']) =>
  new GeminiProvider({ apiKey: 'key', model: 'gemini-test', fetchFn });

describe('GeminiProvider', () => {
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));

  it('sends text and media parts and parses JSON output', async () => {
    const fetch = fakeFetch(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 3 },
      }),
    );
    const result = await create(fetch.fn).generateStructured({
      prompt,
      timeoutMs: 1000,
      inputs: [
        { type: 'text', text: 'hello' },
        { type: 'image', mimeType: 'image/jpeg', data: Buffer.from('img') },
      ],
    });

    expect(result).toEqual({ ok: true });
    const [request] = fetch.requests;
    expect(request?.url).toContain('/gemini-test:generateContent');
    expect(request?.init.headers).toMatchObject({ 'x-goog-api-key': 'key' });
    expect(request?.json()).toMatchObject({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'hello' },
            { inlineData: { mimeType: 'image/jpeg', data: Buffer.from('img').toString('base64') } },
          ],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    });
  });

  it('maps HTTP 429 to a retryable rate limit error', async () => {
    const fetch = fakeFetch(new Response('quota', { status: 429 }));
    await expect(
      create(fetch.fn).generateStructured({ prompt, inputs: [], timeoutMs: 1000 }),
    ).rejects.toBeInstanceOf(LlmRateLimitError);
  });

  it('maps aborted requests to timeouts', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const fetch = fakeFetch(timeout);
    await expect(
      create(fetch.fn).generateStructured({ prompt, inputs: [], timeoutMs: 1 }),
    ).rejects.toBeInstanceOf(LlmTimeoutError);
  });

  it('streams text and function calls', async () => {
    const fetch = fakeFetch(
      sseResponse([
        { candidates: [{ content: { parts: [{ text: 'Let me ' }] } }] },
        {
          candidates: [
            {
              content: {
                parts: [
                  { text: 'check.' },
                  { functionCall: { name: 'get_today_summary', args: {} } },
                ],
              },
            },
          ],
        },
      ]),
    );
    const chunks: LlmChatChunk[] = [];
    for await (const chunk of create(fetch.fn).streamText({
      system: 's',
      messages: [{ role: 'user', content: 'how am I doing?' }],
      tools: [
        {
          name: 'get_today_summary',
          description: 'd',
          parameters: { type: 'object', properties: {} },
        },
      ],
      timeoutMs: 1000,
    })) {
      chunks.push(chunk);
    }
    expect(chunks.slice(0, 2)).toEqual([
      { type: 'text', text: 'Let me ' },
      { type: 'text', text: 'check.' },
    ]);
    expect(chunks[2]).toMatchObject({ type: 'tool_call', call: { name: 'get_today_summary' } });
    expect(fetch.requests[0]?.json()).toMatchObject({
      tools: [{ functionDeclarations: [{ name: 'get_today_summary' }] }],
    });
  });
});

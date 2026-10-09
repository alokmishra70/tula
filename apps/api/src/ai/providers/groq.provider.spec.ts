import { z } from 'zod';
import { LlmUnsupportedInputError } from '../llm-errors';
import type { LlmChatChunk } from '../llm-provider';
import { fakeFetch, jsonResponse, sseResponse } from '../testing/fake-fetch';
import { GroqProvider } from './groq.provider';

const prompt = { id: 'probe', version: 1, system: 'sys', schema: z.object({ ok: z.boolean() }) };
const create = (fetchFn: ReturnType<typeof fakeFetch>['fn']) =>
  new GroqProvider({
    apiKey: 'key',
    model: 'llama-test',
    transcriptionModel: 'whisper-test',
    fetchFn,
  });
const completion = (content: string) =>
  jsonResponse({
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 9, completion_tokens: 2 },
  });

describe('GroqProvider', () => {
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));

  it('sends images as data URLs in JSON mode', async () => {
    const fetch = fakeFetch(completion('{"ok":true}'));
    await create(fetch.fn).generateStructured({
      prompt,
      timeoutMs: 1000,
      inputs: [{ type: 'image', mimeType: 'image/png', data: Buffer.from('px') }],
    });
    const body = fetch.requests[0]?.json();
    expect(body).toMatchObject({ model: 'llama-test', response_format: { type: 'json_object' } });
    expect(JSON.stringify(body)).toContain('data:image/png;base64,');
  });

  it('transcribes audio before parsing', async () => {
    const fetch = fakeFetch(jsonResponse({ text: 'do roti aur dal' }), completion('{"ok":true}'));
    await create(fetch.fn).generateStructured({
      prompt,
      timeoutMs: 1000,
      inputs: [{ type: 'audio', mimeType: 'audio/m4a', data: Buffer.from('aud') }],
    });
    expect(fetch.requests[0]?.url).toContain('/audio/transcriptions');
    expect(fetch.requests[1]?.init.body).toContain('do roti aur dal');
  });

  it('refuses PDFs so the caller falls back', async () => {
    const fetch = fakeFetch();
    await expect(
      create(fetch.fn).generateStructured({
        prompt,
        timeoutMs: 1000,
        inputs: [{ type: 'pdf', mimeType: 'application/pdf', data: Buffer.from('%PDF') }],
      }),
    ).rejects.toBeInstanceOf(LlmUnsupportedInputError);
  });

  it('assembles streamed tool call fragments', async () => {
    const fetch = fakeFetch(
      sseResponse([
        { choices: [{ delta: { content: 'Logging ' } }] },
        {
          choices: [
            {
              delta: {
                tool_calls: [
                  { index: 0, id: 'call_1', function: { name: 'log_meal', arguments: '{"descr' } },
                ],
              },
            },
          ],
        },
        {
          choices: [
            { delta: { tool_calls: [{ index: 0, function: { arguments: 'iption":"2 idli"}' } }] } },
          ],
        },
        '[DONE]',
      ]),
    );
    const chunks: LlmChatChunk[] = [];
    for await (const chunk of create(fetch.fn).streamText({
      system: 's',
      messages: [{ role: 'user', content: 'log 2 idli' }],
      tools: [],
      timeoutMs: 1000,
    })) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual([
      { type: 'text', text: 'Logging ' },
      {
        type: 'tool_call',
        call: { id: 'call_1', name: 'log_meal', arguments: { description: '2 idli' } },
      },
    ]);
  });
});

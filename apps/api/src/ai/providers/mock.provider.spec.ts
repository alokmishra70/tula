import type { LlmChatChunk } from '../llm-provider';
import { mealParseInputs, mealParsePrompt, nudgeCopyPrompt, reportExtractPrompt } from '../prompts';
import { LlmUnsupportedInputError } from '../llm-errors';
import { MockLlmProvider } from './mock.provider';

describe('MockLlmProvider', () => {
  const mock = new MockLlmProvider();

  it('parses a typed Indian meal into items', async () => {
    const result = await mock.generateStructured({
      prompt: mealParsePrompt,
      inputs: mealParseInputs({ mealType: 'lunch', text: '2 rotis, 1 katori dal and aloo sabzi' }),
      timeoutMs: 1000,
    });
    expect(result.items.map(({ name, quantity, unit }) => ({ name, quantity, unit }))).toEqual([
      { name: 'Roti', quantity: 2, unit: 'serving' },
      { name: 'Dal', quantity: 1, unit: 'katori' },
      { name: 'Aloo sabzi', quantity: 1, unit: 'serving' },
    ]);
  });

  it('returns a thali for photos', async () => {
    const result = await mock.generateStructured({
      prompt: mealParsePrompt,
      inputs: mealParseInputs({
        mealType: 'lunch',
        media: { type: 'image', mimeType: 'image/jpeg', data: Buffer.from('x') },
      }),
      timeoutMs: 1000,
    });
    expect(result.isFood).toBe(true);
    expect(result.items.length).toBeGreaterThan(2);
  });

  it('returns a sample lab report', async () => {
    const result = await mock.generateStructured({
      prompt: reportExtractPrompt,
      inputs: [],
      timeoutMs: 1000,
    });
    expect(result.rows.find((row) => row.rawName.startsWith('LDL'))?.value).toBe(152);
  });

  it('has no copywriting handler so callers use their fallback text', async () => {
    await expect(
      mock.generateStructured({ prompt: nudgeCopyPrompt, inputs: [], timeoutMs: 1000 }),
    ).rejects.toBeInstanceOf(LlmUnsupportedInputError);
  });

  it('calls tools for data questions and answers tool results', async () => {
    const collect = async (iterable: AsyncIterable<LlmChatChunk>) => {
      const out: LlmChatChunk[] = [];
      for await (const chunk of iterable) out.push(chunk);
      return out;
    };
    const first = await collect(
      mock.streamText({
        system: '',
        tools: [],
        timeoutMs: 1000,
        messages: [{ role: 'user', content: 'Log 2 idlis and chutney' }],
      }),
    );
    expect(first).toEqual([
      {
        type: 'tool_call',
        call: expect.objectContaining({
          name: 'log_meal',
          arguments: { description: '2 idlis and chutney' },
        }),
      },
    ]);
  });
});

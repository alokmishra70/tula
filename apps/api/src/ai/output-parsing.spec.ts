import { z } from 'zod';
import { LlmInvalidOutputError } from './llm-errors';
import { jsonSchemaFor, parseStructuredOutput } from './output-parsing';

const schema = z.object({ message: z.string().max(10) });

describe('parseStructuredOutput', () => {
  it('parses plain and fenced JSON', () => {
    expect(parseStructuredOutput('p', '{"message":"hi"}', schema)).toEqual({ message: 'hi' });
    expect(parseStructuredOutput('p', '```json\n{"message":"hi"}\n```', schema)).toEqual({
      message: 'hi',
    });
  });

  it('rejects non-JSON', () => {
    expect(() => parseStructuredOutput('p', 'Sure! Here you go', schema)).toThrow(
      LlmInvalidOutputError,
    );
  });

  it('reports schema issues so they can be sent back to the model', () => {
    try {
      parseStructuredOutput('p', '{"message":"far too long here"}', schema);
      fail('expected error');
    } catch (error) {
      expect((error as LlmInvalidOutputError).issues).toMatch(/message/);
    }
  });
});

describe('jsonSchemaFor', () => {
  it('renders and caches a JSON schema', () => {
    const rendered = jsonSchemaFor(schema);
    expect(JSON.parse(rendered)).toMatchObject({ type: 'object', required: ['message'] });
    expect(jsonSchemaFor(schema)).toBe(rendered);
  });
});

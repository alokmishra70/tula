import { randomUUID } from 'node:crypto';
import {
  BaseLlmProvider,
  type JsonCompletion,
  type JsonCompletionRequest,
} from '../base-llm-provider';
import type { ChatTurn, InputPart, LlmChatChunk, LlmChatRequest } from '../llm-provider';
import { postJson, readSseData, send, type FetchFn } from './http';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export interface GeminiOptions {
  apiKey: string;
  model: string;
  fetchFn?: FetchFn;
}

export class GeminiProvider extends BaseLlmProvider {
  readonly name = 'gemini';
  private readonly fetchFn: FetchFn;

  constructor(private readonly options: GeminiOptions) {
    super();
    this.fetchFn = options.fetchFn ?? fetch;
  }

  protected async completeJson({
    system,
    inputs,
    timeoutMs,
  }: JsonCompletionRequest): Promise<JsonCompletion> {
    const response = await postJson<GeminiResponse>(this.fetchFn, {
      provider: this.name,
      url: `${BASE_URL}/${this.options.model}:generateContent`,
      headers: this.headers(),
      timeoutMs,
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: inputs.map(toGeminiPart) }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      },
    });
    const text = textOf(response);
    const usage = response.usageMetadata;
    return {
      text,
      usage: usage
        ? {
            inputTokens: usage.promptTokenCount ?? 0,
            outputTokens: usage.candidatesTokenCount ?? 0,
          }
        : null,
    };
  }

  async *streamText(request: LlmChatRequest): AsyncIterable<LlmChatChunk> {
    const response = await send(this.fetchFn, {
      provider: this.name,
      url: `${BASE_URL}/${this.options.model}:streamGenerateContent?alt=sse`,
      headers: { ...this.headers(), 'content-type': 'application/json' },
      timeoutMs: request.timeoutMs,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.system }] },
        contents: request.messages.map(toGeminiContent),
        tools: request.tools.length
          ? [
              {
                functionDeclarations: request.tools.map(({ name, description, parameters }) => ({
                  name,
                  description,
                  parameters,
                })),
              },
            ]
          : undefined,
        generationConfig: { temperature: 0.4 },
      }),
    });

    for await (const data of readSseData(response)) {
      const event = JSON.parse(data) as GeminiResponse;
      for (const part of event.candidates?.[0]?.content?.parts ?? []) {
        if (part.text) yield { type: 'text', text: part.text };
        if (part.functionCall) {
          yield {
            type: 'tool_call',
            call: {
              id: randomUUID(),
              name: part.functionCall.name,
              arguments: part.functionCall.args ?? {},
            },
          };
        }
      }
    }
  }

  private headers(): Record<string, string> {
    return { 'x-goog-api-key': this.options.apiKey };
  }
}

function toGeminiPart(part: InputPart): GeminiPart {
  if (part.type === 'text') return { text: part.text };
  return { inlineData: { mimeType: part.mimeType, data: part.data.toString('base64') } };
}

function toGeminiContent(turn: ChatTurn): GeminiContent {
  switch (turn.role) {
    case 'user':
      return { role: 'user', parts: [{ text: turn.content }] };
    case 'assistant':
      return {
        role: 'model',
        parts: [
          ...(turn.content ? [{ text: turn.content }] : []),
          ...(turn.toolCalls ?? []).map((call) => ({
            functionCall: { name: call.name, args: call.arguments },
          })),
        ],
      };
    case 'tool':
      return {
        role: 'user',
        parts: [{ functionResponse: { name: turn.name, response: { result: turn.content } } }],
      };
  }
}

function textOf(response: GeminiResponse): string {
  return (response.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
}

import {
  BaseLlmProvider,
  type JsonCompletion,
  type JsonCompletionRequest,
} from '../base-llm-provider';
import { LlmUnsupportedInputError } from '../llm-errors';
import type { ChatTurn, InputPart, LlmChatChunk, LlmChatRequest } from '../llm-provider';
import { postJson, readSseData, send, type FetchFn } from './http';

const BASE_URL = 'https://api.groq.com/openai/v1';
const TRANSCRIBE_TIMEOUT_MS = 20_000;

type ContentPart =
  { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[] | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface CompletionResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

interface StreamDelta {
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

export interface GroqOptions {
  apiKey: string;
  model: string;
  transcriptionModel: string;
  fetchFn?: FetchFn;
}

/** OpenAI-compatible fallback. Audio is transcribed with Whisper first; PDFs are not supported. */
export class GroqProvider extends BaseLlmProvider {
  readonly name = 'groq';
  private readonly fetchFn: FetchFn;

  constructor(private readonly options: GroqOptions) {
    super();
    this.fetchFn = options.fetchFn ?? fetch;
  }

  protected async completeJson({
    system,
    inputs,
    timeoutMs,
  }: JsonCompletionRequest): Promise<JsonCompletion> {
    const content = await Promise.all(inputs.map((part) => this.toContentPart(part)));
    const response = await postJson<CompletionResponse>(this.fetchFn, {
      provider: this.name,
      url: `${BASE_URL}/chat/completions`,
      headers: this.authHeader(),
      timeoutMs,
      body: {
        model: this.options.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content },
        ],
      },
    });
    return {
      text: response.choices[0]?.message.content ?? '',
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : null,
    };
  }

  async *streamText(request: LlmChatRequest): AsyncIterable<LlmChatChunk> {
    const response = await send(this.fetchFn, {
      provider: this.name,
      url: `${BASE_URL}/chat/completions`,
      headers: { ...this.authHeader(), 'content-type': 'application/json' },
      timeoutMs: request.timeoutMs,
      body: JSON.stringify({
        model: this.options.model,
        stream: true,
        temperature: 0.4,
        messages: [
          { role: 'system', content: request.system },
          ...request.messages.map(toOpenAiMessage),
        ],
        tools: request.tools.length
          ? request.tools.map(({ name, description, parameters }) => ({
              type: 'function',
              function: { name, description, parameters },
            }))
          : undefined,
      }),
    });

    // Tool call arguments arrive in fragments keyed by index.
    const pending = new Map<number, { id: string; name: string; args: string }>();
    for await (const data of readSseData(response)) {
      const choice = (JSON.parse(data) as StreamDelta).choices?.[0];
      if (choice?.delta?.content) yield { type: 'text', text: choice.delta.content };
      for (const fragment of choice?.delta?.tool_calls ?? []) {
        const call = pending.get(fragment.index) ?? { id: '', name: '', args: '' };
        call.id ||= fragment.id ?? '';
        call.name ||= fragment.function?.name ?? '';
        call.args += fragment.function?.arguments ?? '';
        pending.set(fragment.index, call);
      }
    }
    for (const call of pending.values()) {
      yield {
        type: 'tool_call',
        call: { id: call.id, name: call.name, arguments: parseArguments(call.args) },
      };
    }
  }

  private async toContentPart(part: InputPart): Promise<ContentPart> {
    switch (part.type) {
      case 'text':
        return { type: 'text', text: part.text };
      case 'image':
        return {
          type: 'image_url',
          image_url: { url: `data:${part.mimeType};base64,${part.data.toString('base64')}` },
        };
      case 'audio':
        return {
          type: 'text',
          text: `Transcript of the user's voice note: ${await this.transcribe(part.data, part.mimeType)}`,
        };
      case 'pdf':
        throw new LlmUnsupportedInputError(this.name, 'PDF input is not supported');
    }
  }

  private async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const form = new FormData();
    form.append('model', this.options.transcriptionModel);
    form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), 'voice.m4a');
    const response = await send(this.fetchFn, {
      provider: this.name,
      url: `${BASE_URL}/audio/transcriptions`,
      headers: this.authHeader(),
      body: form,
      timeoutMs: TRANSCRIBE_TIMEOUT_MS,
    });
    return ((await response.json()) as { text: string }).text;
  }

  private authHeader(): Record<string, string> {
    return { authorization: `Bearer ${this.options.apiKey}` };
  }
}

function toOpenAiMessage(turn: ChatTurn): OpenAiMessage {
  switch (turn.role) {
    case 'user':
      return { role: 'user', content: turn.content };
    case 'assistant':
      return {
        role: 'assistant',
        content: turn.content || null,
        tool_calls: turn.toolCalls?.map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })),
      };
    case 'tool':
      return { role: 'tool', content: turn.content, tool_call_id: turn.toolCallId };
  }
}

function parseArguments(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

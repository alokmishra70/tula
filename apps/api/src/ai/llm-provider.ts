import type { z } from 'zod';

export type MediaPartType = 'image' | 'audio' | 'pdf';

export type InputPart =
  { type: 'text'; text: string } | { type: MediaPartType; mimeType: string; data: Buffer };

export interface PromptTemplate<T> {
  id: string;
  version: number;
  system: string;
  schema: z.ZodType<T>;
}

export interface StructuredRequest<T> {
  prompt: PromptTemplate<T>;
  inputs: InputPart[];
  timeoutMs: number;
  /** Validation error from a previous attempt, sent back so the model can fix it. */
  correction?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the arguments object. */
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type ChatTurn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; name: string; content: string };

export interface LlmChatRequest {
  system: string;
  messages: ChatTurn[];
  tools: ToolDefinition[];
  timeoutMs: number;
}

export type LlmChatChunk = { type: 'text'; text: string } | { type: 'tool_call'; call: ToolCall };

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Port for every language model call. Domain services never know which model runs. */
export abstract class LlmProvider {
  abstract readonly name: string;
  abstract generateStructured<T>(request: StructuredRequest<T>): Promise<T>;
  abstract streamText(request: LlmChatRequest): AsyncIterable<LlmChatChunk>;
}

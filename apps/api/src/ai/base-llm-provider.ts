import { Logger } from '@nestjs/common';
import { LlmError } from './llm-errors';
import {
  LlmProvider,
  type InputPart,
  type LlmChatChunk,
  type LlmChatRequest,
  type StructuredRequest,
  type TokenUsage,
} from './llm-provider';
import { jsonSchemaFor, parseStructuredOutput } from './output-parsing';

export interface JsonCompletionRequest {
  system: string;
  inputs: InputPart[];
  timeoutMs: number;
}

export interface JsonCompletion {
  text: string;
  usage: TokenUsage | null;
}

/** Template method: subclasses talk to a model API, this class owns schema prompting and validation. */
export abstract class BaseLlmProvider extends LlmProvider {
  protected readonly logger = new Logger(this.constructor.name);

  protected abstract completeJson(request: JsonCompletionRequest): Promise<JsonCompletion>;
  abstract override streamText(request: LlmChatRequest): AsyncIterable<LlmChatChunk>;

  async generateStructured<T>(request: StructuredRequest<T>): Promise<T> {
    const { prompt } = request;
    const startedAt = Date.now();
    const log = (outcome: string, usage: TokenUsage | null = null) =>
      this.logger.log({
        event: 'ai_call',
        provider: this.name,
        prompt: `${prompt.id}.v${prompt.version}`,
        latencyMs: Date.now() - startedAt,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        corrective: Boolean(request.correction),
        outcome,
      });

    try {
      const completion = await this.completeJson({
        system: this.buildSystemInstruction(request),
        inputs: request.inputs,
        timeoutMs: request.timeoutMs,
      });
      const value = parseStructuredOutput(this.name, completion.text, prompt.schema);
      log('success', completion.usage);
      return value;
    } catch (error) {
      log(error instanceof LlmError ? error.name : 'unexpected_error');
      throw error;
    }
  }

  private buildSystemInstruction<T>({ prompt, correction }: StructuredRequest<T>): string {
    const sections = [
      prompt.system,
      `Reply with a single JSON object only, matching this JSON Schema:\n${jsonSchemaFor(prompt.schema)}`,
    ];
    if (correction) {
      sections.push(`Your previous reply failed validation. Fix these problems:\n${correction}`);
    }
    return sections.join('\n\n');
  }
}

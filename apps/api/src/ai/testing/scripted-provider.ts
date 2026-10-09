import { LlmProvider, type LlmChatChunk, type StructuredRequest } from '../llm-provider';

type Step = unknown | Error;

/** Provider that replays a script of results or errors; records corrective prompts. */
export class ScriptedProvider extends LlmProvider {
  readonly corrections: Array<string | undefined> = [];
  calls = 0;

  constructor(
    readonly name: string,
    private readonly steps: Step[],
    private readonly chunks: Array<LlmChatChunk | Error> = [],
  ) {
    super();
  }

  async generateStructured<T>(request: StructuredRequest<T>): Promise<T> {
    this.calls++;
    this.corrections.push(request.correction);
    const step = this.steps.shift();
    if (step instanceof Error) throw step;
    return step as T;
  }

  async *streamText(): AsyncIterable<LlmChatChunk> {
    for (const chunk of this.chunks) {
      if (chunk instanceof Error) throw chunk;
      yield chunk;
    }
  }
}

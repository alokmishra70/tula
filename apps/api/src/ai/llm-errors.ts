import { HttpStatus } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception';

export abstract class LlmError extends Error {
  abstract readonly retryable: boolean;

  constructor(
    readonly provider: string,
    message: string,
  ) {
    super(`[${provider}] ${message}`);
    this.name = new.target.name;
  }
}

export class LlmRateLimitError extends LlmError {
  readonly retryable = true;
}

export class LlmServerError extends LlmError {
  readonly retryable = true;
}

export class LlmTimeoutError extends LlmError {
  readonly retryable = false;
}

export class LlmRequestError extends LlmError {
  readonly retryable = false;
}

export class LlmUnsupportedInputError extends LlmError {
  readonly retryable = false;
}

export class LlmInvalidOutputError extends LlmError {
  readonly retryable = false;

  constructor(
    provider: string,
    readonly issues: string,
  ) {
    super(provider, `Invalid model output: ${issues}`);
  }
}

/** Every provider failed; callers fall back to a defined state (pending meal, failed report). */
export class AiUnavailableError extends AppException {
  constructor(readonly causes: string[]) {
    super(
      'ai_unavailable',
      'The assistant is unavailable right now.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    this.name = 'AiUnavailableError';
  }
}

export function errorForStatus(provider: string, status: number, body: string): LlmError {
  const detail = `HTTP ${status}: ${body.slice(0, 300)}`;
  if (status === 429) return new LlmRateLimitError(provider, detail);
  if (status >= 500) return new LlmServerError(provider, detail);
  return new LlmRequestError(provider, detail);
}

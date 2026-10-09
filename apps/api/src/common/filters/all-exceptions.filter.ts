import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { ApiError, ErrorCode } from '@tula/shared';
import type { FastifyReply } from 'fastify';
import { AppException } from '../errors/app.exception';

interface ErrorResponse {
  status: number;
  body: ApiError;
}

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'validation_failed',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'payload_too_large',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'validation_failed',
  [HttpStatus.TOO_MANY_REQUESTS]: 'rate_limited',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service_unavailable',
};

// Fastify raises plain errors carrying a statusCode (e.g. body too large).
function isHttpLikeError(error: unknown): error is Error & { statusCode: number } {
  return (
    error instanceof Error && typeof (error as { statusCode?: unknown }).statusCode === 'number'
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = this.toResponse(exception);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception }, body.message);
    }
    host.switchToHttp().getResponse<FastifyReply>().status(status).send(body);
  }

  private toResponse(exception: unknown): ErrorResponse {
    if (exception instanceof AppException) {
      return {
        status: exception.status,
        body: { code: exception.code, message: exception.message, details: exception.details },
      };
    }
    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: { code: 'rate_limited', message: 'Too many requests. Try again later.' },
      };
    }
    if (exception instanceof HttpException) {
      return this.fromStatus(exception.getStatus(), exception.message);
    }
    if (isHttpLikeError(exception) && exception.statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
      return this.fromStatus(exception.statusCode, exception.message);
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'internal_error', message: 'Something went wrong on our side.' },
    };
  }

  private fromStatus(status: number, message: string): ErrorResponse {
    const code = STATUS_TO_CODE[status] ?? 'internal_error';
    return { status, body: { code, message } };
  }
}

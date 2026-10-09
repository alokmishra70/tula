import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@tula/shared';

export interface ValidationIssue {
  path: string;
  message: string;
}

export class AppException extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: HttpStatus,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppException';
  }

  static validation(issues: ValidationIssue[]): AppException {
    return new AppException(
      'validation_failed',
      'Request validation failed',
      HttpStatus.BAD_REQUEST,
      issues,
    );
  }

  static unknownDevice(message: string): AppException {
    return new AppException('unknown_device', message, HttpStatus.UNAUTHORIZED);
  }

  static notFound(resource: string): AppException {
    return new AppException('not_found', `${resource} not found`, HttpStatus.NOT_FOUND);
  }

  static conflict(code: ErrorCode, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.CONFLICT, details);
  }

  static serviceUnavailable(message: string): AppException {
    return new AppException('service_unavailable', message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

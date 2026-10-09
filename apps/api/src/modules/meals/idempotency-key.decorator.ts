import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { HEADERS } from '@tula/shared';
import type { FastifyRequest } from 'fastify';
import { AppException } from '../../common/errors/app.exception';

const PATTERN = /^[A-Za-z0-9:_-]{8,128}$/;

export const IdempotencyKey = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const value = ctx.switchToHttp().getRequest<FastifyRequest>().headers[HEADERS.idempotencyKey];
  if (typeof value !== 'string' || !PATTERN.test(value)) {
    throw AppException.validation([
      { path: 'Idempotency-Key', message: 'Header must be 8-128 URL-safe characters' },
    ]);
  }
  return value;
});

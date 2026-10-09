import { Body, createParamDecorator, Query, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { RequestUser } from '../auth/request-user';
import { AppException } from '../errors/app.exception';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

export const ZodBody = (schema: z.ZodType) => Body(new ZodValidationPipe(schema));

export const ZodQuery = (schema: z.ZodType) => Query(new ZodValidationPipe(schema));

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser => {
    const user = ctx.switchToHttp().getRequest<FastifyRequest>().user;
    if (!user) throw AppException.unknownDevice('No profile for this device');
    return user;
  },
);

export const DeviceId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const deviceId = ctx.switchToHttp().getRequest<FastifyRequest>().deviceId;
  if (!deviceId) throw AppException.unknownDevice('Missing X-Device-Id header');
  return deviceId;
});

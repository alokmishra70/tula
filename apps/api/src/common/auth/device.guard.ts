import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HEADERS } from '@tula/shared';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppException } from '../errors/app.exception';
import { ALLOW_UNREGISTERED, IS_PUBLIC } from './auth.metadata';
import { DeviceUserResolver } from './device-user-resolver';

const DeviceIdSchema = z.uuid();

@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolver: DeviceUserResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.hasMetadata(context, IS_PUBLIC)) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const deviceId = DeviceIdSchema.safeParse(request.headers[HEADERS.deviceId]);
    if (!deviceId.success) {
      throw AppException.unknownDevice('Missing or malformed X-Device-Id header');
    }
    request.deviceId = deviceId.data;

    if (this.hasMetadata(context, ALLOW_UNREGISTERED)) return true;

    const user = await this.resolver.resolve(deviceId.data);
    if (!user) {
      throw AppException.unknownDevice('No profile for this device. Complete onboarding first.');
    }
    request.user = user;
    return true;
  }

  private hasMetadata(context: ExecutionContext, key: string): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]) ??
      false
    );
  }
}

import { Injectable, SetMetadata, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { HEADERS, LIMITS } from '@tula/shared';

const AI_RATE_LIMITED = 'throttle:ai';
const reflector = new Reflector();
const ONE_MINUTE_MS = 60_000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

/** Counts the route against the per-device hourly AI quota. */
export const AiRateLimited = () => SetMetadata(AI_RATE_LIMITED, true);

export const throttlerOptions: ThrottlerModuleOptions = {
  throttlers: [
    { name: 'default', ttl: ONE_MINUTE_MS, limit: 300 },
    {
      name: 'ai',
      ttl: ONE_HOUR_MS,
      limit: LIMITS.aiCallsPerHour,
      skipIf: (ctx: ExecutionContext) => !reflector.get<boolean>(AI_RATE_LIMITED, ctx.getHandler()),
    },
  ],
};

@Injectable()
export class DeviceThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as Record<string, string | undefined>;
    return headers[HEADERS.deviceId] ?? (req.ip as string);
  }
}

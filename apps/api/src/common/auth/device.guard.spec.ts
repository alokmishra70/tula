import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../errors/app.exception';
import { ALLOW_UNREGISTERED, IS_PUBLIC } from './auth.metadata';
import { DeviceGuard } from './device.guard';
import { DeviceUserResolver } from './device-user-resolver';
import type { RequestUser } from './request-user';

const DEVICE_ID = '7b0f0f0e-3c43-4a53-9d6a-2f1d1c1a5e11';

class FakeResolver extends DeviceUserResolver {
  constructor(private readonly user: RequestUser | null) {
    super();
  }
  async resolve(): Promise<RequestUser | null> {
    return this.user;
  }
}

function contextFor(headers: Record<string, string>, metadata: Record<string, boolean> = {}) {
  const request: Record<string, unknown> = { headers };
  const handler = () => undefined;
  for (const [key, value] of Object.entries(metadata)) Reflect.defineMetadata(key, value, handler);
  const context = {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('DeviceGuard', () => {
  const user: RequestUser = { id: 'user-1', deviceId: DEVICE_ID, timezone: 'Asia/Kolkata' };
  const guardWith = (resolved: RequestUser | null) =>
    new DeviceGuard(new Reflector(), new FakeResolver(resolved));

  it('lets public routes through without a device header', async () => {
    const { context } = contextFor({}, { [IS_PUBLIC]: true });
    await expect(guardWith(null).canActivate(context)).resolves.toBe(true);
  });

  it('rejects a malformed device id', async () => {
    const { context } = contextFor({ 'x-device-id': 'not-a-uuid' });
    await expect(guardWith(user).canActivate(context)).rejects.toMatchObject({
      code: 'unknown_device',
    });
  });

  it('allows unregistered devices where marked, attaching only the device id', async () => {
    const { context, request } = contextFor(
      { 'x-device-id': DEVICE_ID },
      { [ALLOW_UNREGISTERED]: true },
    );
    await expect(guardWith(null).canActivate(context)).resolves.toBe(true);
    expect(request.deviceId).toBe(DEVICE_ID);
    expect(request.user).toBeUndefined();
  });

  it('rejects a device without a profile', async () => {
    const { context } = contextFor({ 'x-device-id': DEVICE_ID });
    await expect(guardWith(null).canActivate(context)).rejects.toBeInstanceOf(AppException);
  });

  it('attaches the resolved user', async () => {
    const { context, request } = contextFor({ 'x-device-id': DEVICE_ID });
    await expect(guardWith(user).canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });
});

import type { RequestUser } from './request-user';

// Port implemented by the profile module; keeps the guard free of persistence details.
export abstract class DeviceUserResolver {
  abstract resolve(deviceId: string): Promise<RequestUser | null>;
}

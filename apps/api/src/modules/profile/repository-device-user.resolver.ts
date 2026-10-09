import { Injectable } from '@nestjs/common';
import { DeviceUserResolver } from '../../common/auth/device-user-resolver';
import type { RequestUser } from '../../common/auth/request-user';
import { UserRepository } from './user.repository';

@Injectable()
export class RepositoryDeviceUserResolver extends DeviceUserResolver {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async resolve(deviceId: string): Promise<RequestUser | null> {
    const user = await this.users.findByDeviceId(deviceId);
    return user && { id: user.id, deviceId: user.deviceId, timezone: user.timezone };
  }
}

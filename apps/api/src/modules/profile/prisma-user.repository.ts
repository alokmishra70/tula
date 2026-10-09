import { Injectable } from '@nestjs/common';
import { DbContext } from '../../infrastructure/database/db-context';
import type { User } from '../../generated/prisma/client';
import { UserRepository, type UpsertUserData, type UserRecord } from './user.repository';

const toRecord = (user: User): UserRecord => ({
  id: user.id,
  deviceId: user.deviceId,
  name: user.name,
  sex: user.sex,
  birthYear: user.birthYear,
  heightCm: user.heightCm,
  activityLevel: user.activityLevel,
  timezone: user.timezone,
});

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async findByDeviceId(deviceId: string): Promise<UserRecord | null> {
    const user = await this.db.client.user.findUnique({ where: { deviceId } });
    return user && toRecord(user);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.db.client.user.findUnique({ where: { id } });
    return user && toRecord(user);
  }

  async upsertByDeviceId(data: UpsertUserData): Promise<UserRecord> {
    const user = await this.db.client.user.upsert({
      where: { deviceId: data.deviceId },
      create: data,
      update: data,
    });
    return toRecord(user);
  }
}

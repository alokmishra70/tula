import type { ActivityLevel, Sex } from '@tula/shared';

export interface UserRecord {
  id: string;
  deviceId: string;
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  timezone: string;
}

export type UpsertUserData = Omit<UserRecord, 'id'>;

export abstract class UserRepository {
  abstract findByDeviceId(deviceId: string): Promise<UserRecord | null>;
  abstract findById(id: string): Promise<UserRecord | null>;
  abstract upsertByDeviceId(data: UpsertUserData): Promise<UserRecord>;
}

import { Injectable } from '@nestjs/common';
import type { Profile, UpsertProfileRequest } from '@tula/shared';
import { Clock } from '../../common/clock';
import { AppException } from '../../common/errors/app.exception';
import { isValidTimeZone } from '../../domain/time';
import type { BodyProfile } from '../../domain/nutrition';
import { TransactionManager } from '../../infrastructure/database/transaction-manager';
import { UserRepository, type UserRecord } from './user.repository';
import { WeightRepository } from './weight.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly weights: WeightRepository,
    private readonly tx: TransactionManager,
    private readonly clock: Clock,
  ) {}

  async upsert(deviceId: string, request: UpsertProfileRequest): Promise<Profile> {
    if (!isValidTimeZone(request.timezone)) {
      throw AppException.validation([{ path: 'timezone', message: 'Unknown time zone' }]);
    }
    const now = this.clock.now();
    return this.tx.run(async () => {
      const user = await this.users.upsertByDeviceId({
        deviceId,
        name: request.name,
        sex: request.sex,
        birthYear: now.getUTCFullYear() - request.age,
        heightCm: request.heightCm,
        activityLevel: request.activityLevel,
        timezone: request.timezone,
      });
      if ((await this.weights.latest(user.id)) !== request.weightKg) {
        await this.weights.record(user.id, request.weightKg, now);
      }
      return this.toProfile(user, request.weightKg);
    });
  }

  async get(userId: string): Promise<Profile> {
    const user = await this.requireUser(userId);
    return this.toProfile(user, await this.requireWeight(userId));
  }

  async bodyProfile(userId: string): Promise<BodyProfile & { name: string; timezone: string }> {
    const user = await this.requireUser(userId);
    return {
      name: user.name,
      timezone: user.timezone,
      sex: user.sex,
      age: this.ageOf(user),
      heightCm: user.heightCm,
      weightKg: await this.requireWeight(userId),
      activityLevel: user.activityLevel,
    };
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) throw AppException.notFound('Profile');
    return user;
  }

  private async requireWeight(userId: string): Promise<number> {
    const weight = await this.weights.latest(userId);
    if (weight === null) throw AppException.notFound('Weight');
    return weight;
  }

  private ageOf(user: UserRecord): number {
    return this.clock.now().getUTCFullYear() - user.birthYear;
  }

  private toProfile(user: UserRecord, weightKg: number): Profile {
    return {
      id: user.id,
      name: user.name,
      sex: user.sex,
      age: this.ageOf(user),
      heightCm: user.heightCm,
      weightKg,
      activityLevel: user.activityLevel,
      timezone: user.timezone,
    };
  }
}

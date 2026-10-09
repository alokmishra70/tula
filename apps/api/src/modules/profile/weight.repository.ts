import { Injectable } from '@nestjs/common';
import { DbContext } from '../../infrastructure/database/db-context';

export abstract class WeightRepository {
  abstract latest(userId: string): Promise<number | null>;
  abstract record(userId: string, weightKg: number, loggedAt: Date): Promise<void>;
}

@Injectable()
export class PrismaWeightRepository extends WeightRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async latest(userId: string): Promise<number | null> {
    const log = await this.db.client.weightLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });
    return log?.weightKg ?? null;
  }

  async record(userId: string, weightKg: number, loggedAt: Date): Promise<void> {
    await this.db.client.weightLog.create({ data: { userId, weightKg, loggedAt } });
  }
}

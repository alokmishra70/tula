import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { DatabaseHealth } from '../../infrastructure/database/database-health';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
  uptimeSeconds: number;
}

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseHealth) {}

  async check(): Promise<HealthStatus> {
    if (!(await this.database.ping())) {
      throw AppException.serviceUnavailable('Database is unreachable');
    }
    return { status: 'ok', database: 'up', uptimeSeconds: Math.round(process.uptime()) };
  }
}

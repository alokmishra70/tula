import { Injectable } from '@nestjs/common';
import type { DailySummary, Macros } from '@tula/shared';
import type { DailySummary as SummaryRow } from '../../generated/prisma/client';
import type { IsoDate } from '../../domain/time';
import { DbContext } from '../../infrastructure/database/db-context';

export abstract class DailySummaryRepository {
  abstract upsert(userId: string, summary: DailySummary): Promise<void>;
  abstract findRange(userId: string, from: IsoDate, to: IsoDate): Promise<DailySummary[]>;
}

const toDate = (isoDate: IsoDate) => new Date(`${isoDate}T00:00:00Z`);

const toSummary = (row: SummaryRow): DailySummary => ({
  date: row.date.toISOString().slice(0, 10),
  consumed: {
    kcal: row.kcal,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    fiberG: row.fiberG,
  },
  mealsCount: row.mealsCount,
  onTarget: row.onTarget,
});

const toColumns = ({ consumed, mealsCount, onTarget }: DailySummary) => ({
  ...(consumed satisfies Macros),
  mealsCount,
  onTarget,
});

@Injectable()
export class PrismaDailySummaryRepository extends DailySummaryRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async upsert(userId: string, summary: DailySummary): Promise<void> {
    const date = toDate(summary.date);
    await this.db.client.dailySummary.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...toColumns(summary) },
      update: toColumns(summary),
    });
  }

  async findRange(userId: string, from: IsoDate, to: IsoDate): Promise<DailySummary[]> {
    const rows = await this.db.client.dailySummary.findMany({
      where: { userId, date: { gte: toDate(from), lte: toDate(to) } },
      orderBy: { date: 'asc' },
    });
    return rows.map(toSummary);
  }
}

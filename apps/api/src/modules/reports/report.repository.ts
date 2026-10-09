import { Injectable } from '@nestjs/common';
import type { ReportErrorCode, ReportStatus } from '@tula/shared';
import type { Prisma, Report as ReportRow } from '../../generated/prisma/client';
import type { IsoDate } from '../../domain/time';
import { DbContext } from '../../infrastructure/database/db-context';

export interface ReportRecord {
  id: string;
  userId: string;
  fileKey: string;
  fileHash: string;
  fileName: string;
  labName: string | null;
  reportDate: IsoDate | null;
  status: ReportStatus;
  errorCode: ReportErrorCode | null;
  createdAt: Date;
  watchCount: number;
}

export interface ReportOutcome {
  status: ReportStatus;
  labName?: string | null;
  reportDate?: IsoDate | null;
  errorCode?: ReportErrorCode | null;
}

export abstract class ReportRepository {
  abstract create(
    data: Pick<ReportRecord, 'userId' | 'fileKey' | 'fileHash' | 'fileName'>,
  ): Promise<ReportRecord>;
  abstract findForUser(id: string, userId: string): Promise<ReportRecord | null>;
  abstract findById(id: string): Promise<ReportRecord | null>;
  abstract findByHash(userId: string, fileHash: string): Promise<ReportRecord | null>;
  abstract listForUser(userId: string): Promise<ReportRecord[]>;
  abstract setOutcome(id: string, outcome: ReportOutcome): Promise<void>;
}

const include = {
  _count: { select: { biomarkers: { where: { status: { in: ['low', 'high', 'critical'] } } } } },
} satisfies Prisma.ReportInclude;

type RowWithCount = ReportRow & { _count: { biomarkers: number } };

const toRecord = (row: RowWithCount): ReportRecord => ({
  id: row.id,
  userId: row.userId,
  fileKey: row.fileKey,
  fileHash: row.fileHash,
  fileName: row.fileName,
  labName: row.labName,
  reportDate: row.reportDate?.toISOString().slice(0, 10) ?? null,
  status: row.status,
  errorCode: row.errorCode as ReportErrorCode | null,
  createdAt: row.createdAt,
  watchCount: row._count.biomarkers,
});

@Injectable()
export class PrismaReportRepository extends ReportRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async create(
    data: Pick<ReportRecord, 'userId' | 'fileKey' | 'fileHash' | 'fileName'>,
  ): Promise<ReportRecord> {
    return toRecord(
      await this.db.client.report.create({ data: { ...data, status: 'processing' }, include }),
    );
  }

  async findForUser(id: string, userId: string): Promise<ReportRecord | null> {
    const row = await this.db.client.report.findFirst({ where: { id, userId }, include });
    return row && toRecord(row);
  }

  async findById(id: string): Promise<ReportRecord | null> {
    const row = await this.db.client.report.findUnique({ where: { id }, include });
    return row && toRecord(row);
  }

  async findByHash(userId: string, fileHash: string): Promise<ReportRecord | null> {
    const row = await this.db.client.report.findUnique({
      where: { userId_fileHash: { userId, fileHash } },
      include,
    });
    return row && toRecord(row);
  }

  async listForUser(userId: string): Promise<ReportRecord[]> {
    const rows = await this.db.client.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include,
    });
    return rows.map(toRecord);
  }

  async setOutcome(id: string, { reportDate, ...outcome }: ReportOutcome): Promise<void> {
    await this.db.client.report.update({
      where: { id },
      data: {
        ...outcome,
        reportDate:
          reportDate === undefined ? undefined : reportDate && new Date(`${reportDate}T00:00:00Z`),
      },
    });
  }
}

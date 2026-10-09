import { Injectable } from '@nestjs/common';
import type { MarkerCode, MarkerExplanation, MarkerStatus } from '@tula/shared';
import type { Biomarker as BiomarkerRow, Prisma, Report } from '../../generated/prisma/client';
import { DbContext } from '../../infrastructure/database/db-context';

export interface BiomarkerRecord {
  id: string;
  reportId: string;
  code: MarkerCode | null;
  rawName: string;
  value: number;
  unit: string;
  normalizedValue: number | null;
  canonicalUnit: string | null;
  refLow: number | null;
  refHigh: number | null;
  status: MarkerStatus;
  needsConfirmation: boolean;
  explanation: MarkerExplanation | null;
}

export type NewBiomarker = Omit<BiomarkerRecord, 'id' | 'reportId'>;

/** A confirmed, normalised reading with the date it was taken. */
export interface MarkerReading extends BiomarkerRecord {
  code: MarkerCode;
  normalizedValue: number;
  takenAt: Date;
}

export abstract class BiomarkerRepository {
  abstract createMany(reportId: string, userId: string, markers: NewBiomarker[]): Promise<void>;
  abstract create(reportId: string, userId: string, marker: NewBiomarker): Promise<BiomarkerRecord>;
  abstract findForUser(id: string, userId: string): Promise<BiomarkerRecord | null>;
  abstract findByReport(reportId: string): Promise<BiomarkerRecord[]>;
  abstract update(id: string, changes: Partial<NewBiomarker>): Promise<BiomarkerRecord>;
  /** Confirmed readings from ready reports, oldest first. */
  abstract confirmedReadings(userId: string): Promise<MarkerReading[]>;
}

const toRecord = (row: BiomarkerRow): BiomarkerRecord => ({
  id: row.id,
  reportId: row.reportId,
  code: row.code as MarkerCode | null,
  rawName: row.rawName,
  value: row.value,
  unit: row.unit,
  normalizedValue: row.normalizedValue,
  canonicalUnit: row.canonicalUnit,
  refLow: row.refLow,
  refHigh: row.refHigh,
  status: row.status,
  needsConfirmation: row.needsConfirmation,
  explanation: row.explanation as MarkerExplanation | null,
});

const toData = (marker: Partial<NewBiomarker>) => ({
  ...marker,
  explanation:
    marker.explanation === undefined
      ? undefined
      : ((marker.explanation ?? undefined) as Prisma.InputJsonValue | undefined),
});

const toCreateData = (marker: NewBiomarker) => ({
  ...toData(marker),
  rawName: marker.rawName,
  value: marker.value,
  unit: marker.unit,
  status: marker.status,
});

const takenAt = (report: Report) => report.reportDate ?? report.createdAt;

@Injectable()
export class PrismaBiomarkerRepository extends BiomarkerRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async createMany(reportId: string, userId: string, markers: NewBiomarker[]): Promise<void> {
    await this.db.client.biomarker.createMany({
      data: markers.map((marker) => ({ ...toCreateData(marker), reportId, userId })),
    });
  }

  async create(reportId: string, userId: string, marker: NewBiomarker): Promise<BiomarkerRecord> {
    return toRecord(
      await this.db.client.biomarker.create({
        data: { ...toCreateData(marker), reportId, userId },
      }),
    );
  }

  async findForUser(id: string, userId: string): Promise<BiomarkerRecord | null> {
    const row = await this.db.client.biomarker.findFirst({ where: { id, userId } });
    return row && toRecord(row);
  }

  async findByReport(reportId: string): Promise<BiomarkerRecord[]> {
    const rows = await this.db.client.biomarker.findMany({
      where: { reportId },
      orderBy: { rawName: 'asc' },
    });
    return rows.map(toRecord);
  }

  async update(id: string, changes: Partial<NewBiomarker>): Promise<BiomarkerRecord> {
    return toRecord(
      await this.db.client.biomarker.update({ where: { id }, data: toData(changes) }),
    );
  }

  async confirmedReadings(userId: string): Promise<MarkerReading[]> {
    const rows = await this.db.client.biomarker.findMany({
      where: {
        userId,
        needsConfirmation: false,
        code: { not: null },
        normalizedValue: { not: null },
        report: { status: 'ready' },
      },
      include: { report: true },
    });
    return rows
      .map((row) => ({ ...(toRecord(row) as MarkerReading), takenAt: takenAt(row.report) }))
      .sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  }
}

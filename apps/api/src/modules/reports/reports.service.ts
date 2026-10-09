import { Injectable } from '@nestjs/common';
import type {
  AddBiomarkerRequest,
  Biomarker,
  MarkerTrendPoint,
  RegisterReportRequest,
  ReportDetail,
  ReportSummary,
  UpdateBiomarkerRequest,
} from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { AppException } from '../../common/errors/app.exception';
import { getMarkerDefinition } from '../../domain/biomarkers';
import { isUniqueViolation } from '../../infrastructure/database/prisma-errors';
import { GoalsService } from '../goals/goals.service';
import { BiomarkerRepository, type BiomarkerRecord } from '../markers/biomarker.repository';
import { MarkerQueryService } from '../markers/marker-query.service';
import { MediaService } from '../media/media.service';
import { ProfileService } from '../profile/profile.service';
import { userEnteredBiomarker } from './marker-normalizer';
import { ReportExtractionService } from './report-extraction.service';
import { ReportRepository, type ReportRecord } from './report.repository';

const STATUS_ORDER: Record<Biomarker['status'], number> = {
  critical: 0,
  high: 1,
  low: 1,
  in_range: 2,
  unclassified: 3,
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly reports: ReportRepository,
    private readonly biomarkers: BiomarkerRepository,
    private readonly markers: MarkerQueryService,
    private readonly extraction: ReportExtractionService,
    private readonly media: MediaService,
    private readonly profiles: ProfileService,
    private readonly goals: GoalsService,
  ) {}

  async register(user: RequestUser, request: RegisterReportRequest): Promise<ReportSummary> {
    this.media.assertOwned(request.fileKey, 'report', user.id);
    await this.assertNotDuplicate(user.id, request.fileHash);
    let report: ReportRecord;
    try {
      report = await this.reports.create({ userId: user.id, ...request });
    } catch (error) {
      if (isUniqueViolation(error)) await this.assertNotDuplicate(user.id, request.fileHash);
      throw error;
    }
    this.extraction.schedule(report);
    return toSummary(report);
  }

  async list(userId: string): Promise<ReportSummary[]> {
    return (await this.reports.listForUser(userId)).map(toSummary);
  }

  async detail(userId: string, id: string): Promise<ReportDetail> {
    const report = await this.requireReport(id, userId);
    const [markers, trends] = await Promise.all([
      this.biomarkers.findByReport(id),
      this.markers.trends(userId),
    ]);
    return {
      ...toSummary(report),
      markers: markers
        .map((marker) => toDto(marker, marker.code ? (trends.get(marker.code) ?? []) : []))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    };
  }

  async updateBiomarker(
    user: RequestUser,
    id: string,
    request: UpdateBiomarkerRequest,
  ): Promise<Biomarker> {
    const marker = await this.biomarkers.findForUser(id, user.id);
    if (!marker) throw AppException.notFound('Marker');
    const { sex } = await this.profiles.bodyProfile(user.id);
    const changes = userEnteredBiomarker(marker, request.value, request.unit ?? marker.unit, sex);
    const updated = await this.biomarkers.update(id, changes);
    await this.goals.refreshAfterMarkerChange(user.id);
    return toDto(updated, []);
  }

  async addBiomarker(
    user: RequestUser,
    reportId: string,
    request: AddBiomarkerRequest,
  ): Promise<Biomarker> {
    const report = await this.requireReport(reportId, user.id);
    if (report.status !== 'ready') {
      throw AppException.conflict('conflict', 'Values can be added once the report has been read');
    }
    const { sex } = await this.profiles.bodyProfile(user.id);
    const base = { rawName: getMarkerDefinition(request.code).label, refLow: null, refHigh: null };
    const created = await this.biomarkers.create(
      report.id,
      user.id,
      userEnteredBiomarker(base, request.value, request.unit, sex),
    );
    await this.goals.refreshAfterMarkerChange(user.id);
    return toDto(created, []);
  }

  private async assertNotDuplicate(userId: string, fileHash: string): Promise<void> {
    const existing = await this.reports.findByHash(userId, fileHash);
    if (existing) {
      throw AppException.conflict('duplicate_report', 'This report was already uploaded', {
        reportId: existing.id,
        uploadedAt: existing.createdAt.toISOString(),
      });
    }
  }

  private async requireReport(id: string, userId: string): Promise<ReportRecord> {
    const report = await this.reports.findForUser(id, userId);
    if (!report) throw AppException.notFound('Report');
    return report;
  }
}

const toSummary = (report: ReportRecord): ReportSummary => ({
  id: report.id,
  fileName: report.fileName,
  labName: report.labName,
  reportDate: report.reportDate,
  status: report.status,
  errorCode: report.errorCode,
  watchCount: report.watchCount,
  createdAt: report.createdAt.toISOString(),
});

const toDto = (
  { reportId: _reportId, ...marker }: BiomarkerRecord,
  trend: MarkerTrendPoint[],
): Biomarker => ({
  ...marker,
  trend,
});

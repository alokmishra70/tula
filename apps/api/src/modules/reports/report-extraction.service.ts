import { Injectable, Logger } from '@nestjs/common';
import type { MarkerCode, ReportErrorCode } from '@tula/shared';
import { AI_TIMEOUTS_MS } from '../../ai/ai.constants';
import { LlmProvider } from '../../ai/llm-provider';
import { reportExtractInputs, reportExtractPrompt } from '../../ai/prompts';
import { TransactionManager } from '../../infrastructure/database/transaction-manager';
import { GoalsService } from '../goals/goals.service';
import { BiomarkerRepository, type NewBiomarker } from '../markers/biomarker.repository';
import { MediaService } from '../media/media.service';
import { ProfileService } from '../profile/profile.service';
import { toNewBiomarker } from './marker-normalizer';
import { ReportRepository, type ReportRecord } from './report.repository';

/** Reads an uploaded report and stores its markers. Every failure ends in a failed report with a code. */
@Injectable()
export class ReportExtractionService {
  private readonly logger = new Logger(ReportExtractionService.name);

  constructor(
    private readonly reports: ReportRepository,
    private readonly biomarkers: BiomarkerRepository,
    private readonly media: MediaService,
    private readonly profiles: ProfileService,
    private readonly goals: GoalsService,
    private readonly llm: LlmProvider,
    private readonly tx: TransactionManager,
  ) {}

  /** Fire-and-forget; the client polls the report status. */
  schedule(report: ReportRecord): void {
    void this.run(report).catch((error: unknown) => {
      this.logger.error({
        event: 'report_extraction_crashed',
        reportId: report.id,
        error: String(error),
      });
    });
  }

  async run(report: ReportRecord): Promise<void> {
    const outcome = await this.extract(report).catch((error: unknown) => {
      this.logger.warn({
        event: 'report_extraction_failed',
        reportId: report.id,
        error: String(error),
      });
      return 'extraction_failed' as const;
    });
    if (typeof outcome === 'string') {
      await this.reports.setOutcome(report.id, { status: 'failed', errorCode: outcome });
      return;
    }
    await this.goals.refreshAfterMarkerChange(report.userId).catch((error: unknown) => {
      this.logger.warn({ event: 'replan_failed', userId: report.userId, error: String(error) });
    });
  }

  private async extract(report: ReportRecord): Promise<ReportErrorCode | { stored: number }> {
    const file = await this.media.read(report.fileKey, 'report', report.userId);
    const type = file.mimeType === 'application/pdf' ? 'pdf' : 'image';
    const extraction = await this.llm.generateStructured({
      prompt: reportExtractPrompt,
      inputs: reportExtractInputs({ type, mimeType: file.mimeType, data: file.data }),
      timeoutMs: AI_TIMEOUTS_MS.reportExtract,
    });
    if (!extraction.isLabReport) return 'not_a_report';
    if (!extraction.readable || extraction.rows.length === 0) return 'unreadable';

    const { sex } = await this.profiles.bodyProfile(report.userId);
    const markers = dedupeByCode(extraction.rows.map((row) => toNewBiomarker(row, sex)));
    await this.tx.run(async () => {
      await this.biomarkers.createMany(report.id, report.userId, markers);
      await this.reports.setOutcome(report.id, {
        status: 'ready',
        labName: extraction.labName,
        reportDate: extraction.reportDate,
        errorCode: null,
      });
    });
    return { stored: markers.length };
  }
}

/** Reports sometimes repeat a test (e.g. on a summary page); keep the first of each known marker. */
function dedupeByCode(markers: NewBiomarker[]): NewBiomarker[] {
  const seen = new Set<MarkerCode>();
  return markers.filter((marker) => {
    if (!marker.code) return true;
    if (seen.has(marker.code)) return false;
    seen.add(marker.code);
    return true;
  });
}

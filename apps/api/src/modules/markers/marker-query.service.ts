import { Injectable } from '@nestjs/common';
import type { FlaggedMarker, MarkerCode, MarkerTrendPoint } from '@tula/shared';
import { hasImproved, isFlagged } from '../../domain/biomarkers';
import type { MarkerSignal } from '../../domain/nutrition';
import { BiomarkerRepository, type MarkerReading } from './biomarker.repository';

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

@Injectable()
export class MarkerQueryService {
  constructor(private readonly biomarkers: BiomarkerRepository) {}

  /** Most recent confirmed reading per marker. */
  async latestReadings(userId: string): Promise<MarkerReading[]> {
    const latest = new Map<MarkerCode, MarkerReading>();
    for (const reading of await this.biomarkers.confirmedReadings(userId))
      latest.set(reading.code, reading);
    return [...latest.values()];
  }

  async signals(userId: string): Promise<MarkerSignal[]> {
    return (await this.latestReadings(userId)).map(({ code, status }) => ({ code, status }));
  }

  /** Flagged markers plus any that improved since the previous report (for the celebration card). */
  async highlights(userId: string): Promise<FlaggedMarker[]> {
    const byCode = new Map<MarkerCode, MarkerReading[]>();
    for (const reading of await this.biomarkers.confirmedReadings(userId)) {
      byCode.set(reading.code, [...(byCode.get(reading.code) ?? []), reading]);
    }
    const highlights: FlaggedMarker[] = [];
    for (const readings of byCode.values()) {
      const current = readings.at(-1)!;
      const previous = readings.at(-2);
      const improved =
        !!previous &&
        previous.reportId !== current.reportId &&
        hasImproved(previous.normalizedValue, current.normalizedValue, {
          low: current.refLow,
          high: current.refHigh,
        });
      if (isFlagged(current.status) || improved) {
        highlights.push({
          code: current.code,
          reportId: current.reportId,
          value: current.normalizedValue,
          unit: current.canonicalUnit ?? current.unit,
          status: current.status,
          improved,
        });
      }
    }
    return highlights;
  }

  async trends(userId: string): Promise<Map<MarkerCode, MarkerTrendPoint[]>> {
    const trends = new Map<MarkerCode, MarkerTrendPoint[]>();
    for (const reading of await this.biomarkers.confirmedReadings(userId)) {
      const points = trends.get(reading.code) ?? [];
      points.push({ reportDate: toIsoDate(reading.takenAt), value: reading.normalizedValue });
      trends.set(reading.code, points);
    }
    return trends;
  }
}

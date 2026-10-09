import type { Sex } from '@tula/shared';
import {
  classify,
  explainMarker,
  getMarkerDefinition,
  normalizeMarker,
  type RawMarker,
} from '../../domain/biomarkers';
import type { NewBiomarker } from '../markers/biomarker.repository';

/** Normalises an extracted row into a stored biomarker. */
export function toNewBiomarker(raw: RawMarker, sex: Sex): NewBiomarker {
  const normalized = normalizeMarker(raw, sex);
  return {
    code: normalized.code,
    rawName: raw.rawName,
    value: raw.value,
    unit: raw.unit,
    normalizedValue: normalized.normalizedValue,
    canonicalUnit: normalized.canonicalUnit,
    refLow: normalized.range.low,
    refHigh: normalized.range.high,
    status: normalized.status,
    needsConfirmation: normalized.needsConfirmation,
    explanation: explainMarker(normalized.code, normalized.status),
  };
}

/**
 * Builds a biomarker from a value the user typed or confirmed. The stored (canonical) range
 * is kept and plausibility is not re-checked: the user has vouched for the number.
 */
export function userEnteredBiomarker(
  base: { rawName: string; refLow: number | null; refHigh: number | null },
  value: number,
  unit: string,
  sex: Sex,
): NewBiomarker {
  const fresh = toNewBiomarker(
    { rawName: base.rawName, value, unit, refLow: null, refHigh: null },
    sex,
  );
  if (!fresh.code || fresh.normalizedValue === null) return fresh;

  const hasStoredRange = base.refLow !== null || base.refHigh !== null;
  const range = hasStoredRange
    ? { low: base.refLow, high: base.refHigh }
    : { low: fresh.refLow, high: fresh.refHigh };
  const status = classify(fresh.normalizedValue, range, getMarkerDefinition(fresh.code).critical);
  return {
    ...fresh,
    refLow: range.low,
    refHigh: range.high,
    status,
    needsConfirmation: false,
    explanation: explainMarker(fresh.code, status),
  };
}

import type { MarkerStatus } from '@tula/shared';
import type { Range } from './marker-registry';

export function classify(value: number, range: Range, critical: Range): MarkerStatus {
  if (critical.low !== null && value < critical.low) return 'critical';
  if (critical.high !== null && value > critical.high) return 'critical';
  if (range.low !== null && value < range.low) return 'low';
  if (range.high !== null && value > range.high) return 'high';
  return 'in_range';
}

export function distanceFromRange(value: number, range: Range): number {
  if (range.low !== null && value < range.low) return range.low - value;
  if (range.high !== null && value > range.high) return value - range.high;
  return 0;
}

/** True when the newer value sits meaningfully closer to the healthy range. */
export function hasImproved(previous: number, current: number, range: Range): boolean {
  const before = distanceFromRange(previous, range);
  const after = distanceFromRange(current, range);
  const minimumChange = Math.max(before * 0.05, Number.EPSILON);
  return before > 0 && before - after >= minimumChange;
}

export const isFlagged = (status: MarkerStatus) =>
  status === 'low' || status === 'high' || status === 'critical';

import type { MarkerStatus, ReportErrorCode } from '@tula/shared';

export const REPORT_ERROR_COPY: Record<ReportErrorCode, string> = {
  not_a_report: "This doesn't look like a lab report.",
  unreadable: "Couldn't read this clearly. Try a sharper photo.",
  extraction_failed: "Couldn't read this report right now. Try again later.",
  file_too_large: 'This file is over 10 MB.',
};

export { MARKER_LABELS, STATUS_CHIP, STATUS_WORD } from '@/lib/markers';

export const isWatchStatus = (status: MarkerStatus) =>
  status === 'low' || status === 'high' || status === 'critical';

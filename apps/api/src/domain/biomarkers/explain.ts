import type { MarkerCode, MarkerExplanation, MarkerStatus } from '@tula/shared';
import { getMarkerDefinition } from './marker-registry';

export const DOCTOR_REFERRAL = 'Please see a doctor soon about this value.';

/** Plain-language card copy; critical values get a referral instead of diet tips. */
export function explainMarker(
  code: MarkerCode | null,
  status: MarkerStatus,
): MarkerExplanation | null {
  if (!code) return null;
  const definition = getMarkerDefinition(code);
  if (status === 'critical') return { what: definition.what, why: DOCTOR_REFERRAL, action: null };
  if (status === 'low' || status === 'high') {
    const guidance = definition.guidance[status];
    return {
      what: definition.what,
      why: guidance?.why ?? 'Worth a chat with your doctor.',
      action: guidance?.action ?? null,
    };
  }
  if (status === 'in_range')
    return { what: definition.what, why: 'In the healthy range.', action: null };
  return {
    what: definition.what,
    why: 'Check the value and unit to see where it sits.',
    action: null,
  };
}

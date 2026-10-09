import { formatNumber, type NudgeContext, type NudgeProposal, type NudgeRule } from '../nudge-rule';

const FROM_HOUR = 18;
const THRESHOLD = 0.6;

export class FiberGapRule implements NudgeRule {
  readonly id = 'fiber_gap';
  readonly priority = 60;

  evaluate({ clock, flaggedMarkers, consumed, targets }: NudgeContext): NudgeProposal | null {
    if (!flaggedMarkers.has('ldl') || clock.hour < FROM_HOUR) return null;
    if (consumed.fiberG >= targets.fiberG * THRESHOLD) return null;
    const fiberToGoG = targets.fiberG - consumed.fiberG;
    return {
      action: 'log_meal',
      actionLabel: 'Log dinner',
      mealType: 'dinner',
      facts: { fiberToGoG: formatNumber(fiberToGoG), fiberTargetG: targets.fiberG },
      fallbackMessage: 'Add a salad or sprouts at dinner for your fibre target.',
    };
  }
}

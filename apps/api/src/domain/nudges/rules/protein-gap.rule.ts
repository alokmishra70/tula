import { formatNumber, type NudgeContext, type NudgeProposal, type NudgeRule } from '../nudge-rule';

const FROM_HOUR = 16;
const THRESHOLD = 0.5;

export class ProteinGapRule implements NudgeRule {
  readonly id = 'protein_gap';
  readonly priority = 50;

  evaluate({ clock, consumed, targets, hasEverLogged }: NudgeContext): NudgeProposal | null {
    if (!hasEverLogged || clock.hour < FROM_HOUR) return null;
    if (consumed.proteinG >= targets.proteinG * THRESHOLD) return null;
    const proteinToGoG = formatNumber(targets.proteinG - consumed.proteinG);
    return {
      action: 'log_meal',
      actionLabel: 'Log a snack',
      mealType: 'snack',
      facts: { proteinToGoG },
      fallbackMessage: `${proteinToGoG} g protein to go. Curd or roasted chana would help.`,
    };
  }
}

import type { NudgeRule as NudgeRuleId } from '@tula/shared';
import type { NudgeCandidate, NudgeContext, NudgeRule } from './nudge-rule';

export interface NudgeHistoryEntry {
  rule: NudgeRuleId;
  shownAt: Date;
  /** Acted on or dismissed. */
  resolved: boolean;
}

export const NUDGE_COOLDOWN_MS = 3 * 60 * 60 * 1000;

export class NudgeEngine {
  constructor(
    private readonly rules: readonly NudgeRule[],
    private readonly cooldownMs = NUDGE_COOLDOWN_MS,
  ) {}

  select(
    context: NudgeContext,
    history: readonly NudgeHistoryEntry[],
    now: Date,
  ): NudgeCandidate | null {
    const candidates = this.rules
      .map((rule) => {
        const proposal = rule.evaluate(context);
        return proposal && { ...proposal, rule: rule.id, priority: rule.priority };
      })
      .filter((candidate): candidate is NudgeCandidate => candidate !== null)
      .sort((a, b) => b.priority - a.priority);

    const recent = history.filter(
      (entry) => now.getTime() - entry.shownAt.getTime() < this.cooldownMs,
    );

    // Keep showing the current nudge while it is still relevant, so Today doesn't flicker.
    const active = recent.find((entry) => !entry.resolved);
    const sticky = active && candidates.find((candidate) => candidate.rule === active.rule);
    if (sticky) return sticky;

    const cooling = new Set(recent.map((entry) => entry.rule));
    return candidates.find((candidate) => !cooling.has(candidate.rule)) ?? null;
  }
}

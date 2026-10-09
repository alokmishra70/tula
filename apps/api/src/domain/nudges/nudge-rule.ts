import type {
  Macros,
  MarkerCode,
  MealType,
  NudgeAction,
  NudgeRule as NudgeRuleId,
  Targets,
} from '@tula/shared';
import type { LocalClock } from '../time';

export interface NudgeContext {
  clock: LocalClock;
  targets: Targets;
  consumed: Macros;
  loggedMealTypes: ReadonlySet<MealType>;
  hasEverLogged: boolean;
  onTarget: boolean;
  streakDays: number;
  flaggedMarkers: ReadonlySet<MarkerCode>;
}

export interface NudgeProposal {
  action: NudgeAction;
  actionLabel: string | null;
  mealType: MealType | null;
  /** Numbers the copywriter may use; it must not invent others. */
  facts: Readonly<Record<string, string | number>>;
  fallbackMessage: string;
}

export interface NudgeCandidate extends NudgeProposal {
  rule: NudgeRuleId;
  priority: number;
}

export interface NudgeRule {
  readonly id: NudgeRuleId;
  readonly priority: number;
  evaluate(context: NudgeContext): NudgeProposal | null;
}

export const minutesOfDay = ({ hour, minute }: { hour: number; minute: number }) =>
  hour * 60 + minute;

export const formatNumber = (value: number) => Math.round(value).toLocaleString('en-IN');

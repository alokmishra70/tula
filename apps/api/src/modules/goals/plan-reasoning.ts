import type { GoalType, MarkerCode, PlanAdjustment, Targets } from '@tula/shared';

export interface PlanFacts {
  name: string;
  goalType: GoalType;
  targets: Targets;
  dailyEnergyDelta: number;
  currentWeightKg: number;
  targetWeightKg: number | null;
  projectedDate: string | null;
  adjustments: PlanAdjustment[];
  flaggedMarkers: Array<{
    code: MarkerCode;
    label: string;
    value: number;
    unit: string;
    status: string;
  }>;
}

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
const kcal = (value: number) => `${Math.abs(Math.round(value)).toLocaleString('en-IN')} kcal`;

function goalSentence(facts: PlanFacts): string {
  const { goalType, targets, dailyEnergyDelta, targetWeightKg, projectedDate } = facts;
  if (goalType === 'lose_weight' && targetWeightKg !== null && projectedDate) {
    return `A ${kcal(dailyEnergyDelta)} daily gap gets you to ${targetWeightKg} kg around ${formatDate(projectedDate)}.`;
  }
  if (goalType === 'build_muscle') {
    return `A ${kcal(dailyEnergyDelta)} surplus with ${targets.proteinG} g protein supports muscle gain.`;
  }
  return `${kcal(targets.kcal)} a day keeps your weight steady.`;
}

function markerSentence({ flaggedMarkers, targets }: PlanFacts): string | null {
  const byCode = new Map(flaggedMarkers.map((marker) => [marker.code, marker]));
  const ldl = byCode.get('ldl');
  if (ldl)
    return `Your LDL is ${ldl.value}, so the ${targets.fiberG} g fibre target matters more than calories.`;
  const hba1c = byCode.get('hba1c');
  if (hba1c && targets.addedSugarMaxG !== null) {
    return `Your HbA1c is ${hba1c.value}%, so added sugar stays under ${targets.addedSugarMaxG} g.`;
  }
  const lowVitamin = flaggedMarkers.find((m) => m.code === 'vitamin_d' || m.code === 'vitamin_b12');
  if (lowVitamin) return `Your ${lowVitamin.label} is low, so I've added foods that help.`;
  return null;
}

/** Deterministic copy used when the language model is unavailable. */
export function fallbackPlanReasoning(facts: PlanFacts): string {
  const sentences = [goalSentence(facts)];
  if (facts.adjustments.includes('target_weight_raised_to_healthy_bmi')) {
    sentences.push(`I set your target to ${facts.targetWeightKg} kg to stay in a healthy range.`);
  } else if (facts.adjustments.includes('calorie_floor_applied')) {
    sentences.push('I kept calories at a safe minimum, so progress is steady rather than fast.');
  }
  sentences.push(
    markerSentence(facts) ??
      `${facts.targets.proteinG} g protein keeps you full and protects muscle.`,
  );
  return sentences.slice(0, 3).join(' ');
}

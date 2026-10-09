import type { GoalType, MarkerCode, MarkerStatus, PlanAdjustment, Targets } from '@tula/shared';
import { bmi, calculateBmr, calculateTdee, KCAL_PER_KG_BODY_FAT, type BodyProfile } from './energy';

export interface MarkerSignal {
  code: MarkerCode;
  status: MarkerStatus;
}

export interface GoalInput {
  type: GoalType;
  targetWeightKg: number | null;
}

export interface TargetPlan {
  bmr: number;
  tdee: number;
  targets: Targets;
  /** kcal/day relative to TDEE; negative means a deficit. */
  dailyEnergyDelta: number;
  targetWeightKg: number | null;
  adjustments: PlanAdjustment[];
  foodSuggestions: string[];
}

export const PLAN_RULES = {
  lossDeficitKcal: 500,
  muscleSurplusKcal: 250,
  calorieFloor: { female: 1200, male: 1500 },
  maxWeeklyLossKg: 0.75,
  minHealthyBmi: 18.5,
  proteinPerKg: { default: 1.2, build_muscle: 1.6 },
  fiberPer1000Kcal: 14,
  fiberRange: { min: 25, max: 30 },
  fatShareOfKcal: 0.3,
  saturatedFatShareForLdl: 0.07,
  addedSugarShareForHba1c: 0.05,
  waterMlPerKg: 35,
} as const;

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

const FOOD_SUGGESTIONS: Partial<Record<MarkerCode, string[]>> = {
  ldl: ['Oats or dalia at breakfast', 'Sprouts or salad with lunch', 'A handful of almonds'],
  hba1c: ['Roti and rice earlier in the day', 'Dal or paneer with every carb', 'Fruit over sweets'],
  vitamin_d: ['Eggs with the yolk', 'Fortified milk', 'Mushrooms', '15 minutes of morning sun'],
  vitamin_b12: ['Curd and paneer', 'Eggs', 'Milk', 'Fish or chicken'],
};

const isElevated = (status: MarkerStatus) => status === 'high' || status === 'critical';
const isLow = (status: MarkerStatus) => status === 'low' || status === 'critical';
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function hasMarker(markers: MarkerSignal[], code: MarkerCode, test: (s: MarkerStatus) => boolean) {
  return markers.some((marker) => marker.code === code && test(marker.status));
}

export function healthyMinimumWeightKg(heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.ceil(PLAN_RULES.minHealthyBmi * heightM * heightM * 2) / 2;
}

function resolveTargetWeight(
  profile: BodyProfile,
  goal: GoalInput,
  adjustments: PlanAdjustment[],
): number | null {
  if (goal.targetWeightKg === null) return null;
  if (
    goal.type === 'lose_weight' &&
    bmi(goal.targetWeightKg, profile.heightCm) < PLAN_RULES.minHealthyBmi
  ) {
    adjustments.push('target_weight_raised_to_healthy_bmi');
    return healthyMinimumWeightKg(profile.heightCm);
  }
  return goal.targetWeightKg;
}

function energyDelta(
  profile: BodyProfile,
  goal: GoalInput,
  tdee: number,
  adjustments: PlanAdjustment[],
) {
  if (goal.type === 'build_muscle') return PLAN_RULES.muscleSurplusKcal;
  if (goal.type !== 'lose_weight') return 0;

  const maxDeficit = (PLAN_RULES.maxWeeklyLossKg * KCAL_PER_KG_BODY_FAT) / 7;
  let deficit: number = PLAN_RULES.lossDeficitKcal;
  if (deficit > maxDeficit) {
    deficit = maxDeficit;
    adjustments.push('loss_rate_capped');
  }

  const floor = PLAN_RULES.calorieFloor[profile.sex];
  if (tdee - deficit < floor) {
    deficit = Math.max(0, tdee - floor);
    adjustments.push('calorie_floor_applied');
  }
  return -deficit;
}

function applyMarkerAdjustments(markers: MarkerSignal[], adjustments: PlanAdjustment[]) {
  const highLdl = hasMarker(markers, 'ldl', isElevated);
  const highHba1c = hasMarker(markers, 'hba1c', isElevated);
  const lowVitaminD = hasMarker(markers, 'vitamin_d', isLow);
  const lowB12 = hasMarker(markers, 'vitamin_b12', isLow);

  if (highLdl) adjustments.push('fiber_raised_for_ldl', 'saturated_fat_capped_for_ldl');
  if (highHba1c)
    adjustments.push('added_sugar_capped_for_hba1c', 'carbs_shifted_earlier_for_hba1c');
  if (lowVitaminD) adjustments.push('vitamin_d_foods_suggested');
  if (lowB12) adjustments.push('vitamin_b12_foods_suggested');

  const flagged: MarkerCode[] = [];
  if (highLdl) flagged.push('ldl');
  if (highHba1c) flagged.push('hba1c');
  if (lowVitaminD) flagged.push('vitamin_d');
  if (lowB12) flagged.push('vitamin_b12');
  return { highLdl, highHba1c, foodSuggestions: flagged.flatMap((c) => FOOD_SUGGESTIONS[c] ?? []) };
}

export function buildTargets(
  profile: BodyProfile,
  goal: GoalInput,
  markers: MarkerSignal[],
): TargetPlan {
  const adjustments: PlanAdjustment[] = [];
  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(bmr, profile.activityLevel);
  const targetWeightKg = resolveTargetWeight(profile, goal, adjustments);
  const dailyEnergyDelta = energyDelta(profile, goal, tdee, adjustments);
  const { highLdl, highHba1c, foodSuggestions } = applyMarkerAdjustments(markers, adjustments);

  const kcal = roundTo(tdee + dailyEnergyDelta, 10);
  const proteinPerKg =
    goal.type === 'build_muscle'
      ? PLAN_RULES.proteinPerKg.build_muscle
      : PLAN_RULES.proteinPerKg.default;
  const proteinG = Math.round(profile.weightKg * proteinPerKg);
  const fatG = Math.round((kcal * PLAN_RULES.fatShareOfKcal) / KCAL_PER_G.fat);
  const carbsG = Math.max(
    0,
    Math.round((kcal - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs),
  );

  const { min, max } = PLAN_RULES.fiberRange;
  const scaledFiber = Math.round((kcal / 1000) * PLAN_RULES.fiberPer1000Kcal);
  const fiberG = highLdl ? max : Math.min(max, Math.max(min, scaledFiber));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyEnergyDelta: Math.round(dailyEnergyDelta),
    targetWeightKg,
    adjustments,
    foodSuggestions,
    targets: {
      kcal,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      waterMl: roundTo(profile.weightKg * PLAN_RULES.waterMlPerKg, 50),
      saturatedFatMaxG: highLdl
        ? Math.round((kcal * PLAN_RULES.saturatedFatShareForLdl) / KCAL_PER_G.fat)
        : null,
      addedSugarMaxG: highHba1c
        ? Math.round((kcal * PLAN_RULES.addedSugarShareForHba1c) / KCAL_PER_G.carbs)
        : null,
    },
  };
}

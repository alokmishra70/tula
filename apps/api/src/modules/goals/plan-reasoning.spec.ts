import type { Targets } from '@tula/shared';
import { fallbackPlanReasoning, type PlanFacts } from './plan-reasoning';

const targets: Targets = {
  kcal: 1620,
  proteinG: 98,
  carbsG: 186,
  fatG: 54,
  fiberG: 30,
  waterMl: 2850,
  saturatedFatMaxG: 13,
  addedSugarMaxG: 20,
};

const facts = (overrides: Partial<PlanFacts> = {}): PlanFacts => ({
  name: 'Rohan',
  goalType: 'lose_weight',
  targets,
  dailyEnergyDelta: -500,
  currentWeightKg: 82,
  targetWeightKg: 72,
  projectedDate: '2027-01-20',
  adjustments: [],
  flaggedMarkers: [],
  ...overrides,
});

describe('fallbackPlanReasoning', () => {
  it('ties the plan to the projected date and protein', () => {
    expect(fallbackPlanReasoning(facts())).toBe(
      'A 500 kcal daily gap gets you to 72 kg around 20 Jan. 98 g protein keeps you full and protects muscle.',
    );
  });

  it('mentions a flagged LDL with its fibre target', () => {
    const text = fallbackPlanReasoning(
      facts({
        flaggedMarkers: [{ code: 'ldl', label: 'LDL', value: 152, unit: 'mg/dL', status: 'high' }],
      }),
    );
    expect(text).toContain('Your LDL is 152, so the 30 g fibre target matters more than calories.');
  });

  it('explains a raised target weight', () => {
    const text = fallbackPlanReasoning(
      facts({ adjustments: ['target_weight_raised_to_healthy_bmi'], targetWeightKg: 57.5 }),
    );
    expect(text).toContain('I set your target to 57.5 kg to stay in a healthy range.');
  });

  it('describes maintenance plans without a date', () => {
    expect(
      fallbackPlanReasoning(
        facts({ goalType: 'maintain', dailyEnergyDelta: 0, projectedDate: null }),
      ),
    ).toMatch(/^1,620 kcal a day keeps your weight steady\./);
  });
});

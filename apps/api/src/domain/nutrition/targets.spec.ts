import { calculateBmr, calculateTdee, type BodyProfile } from './energy';
import { buildTargets, healthyMinimumWeightKg } from './targets';

const rohan: BodyProfile = {
  sex: 'male',
  age: 31,
  heightCm: 176,
  weightKg: 82,
  activityLevel: 'sedentary',
};

describe('energy', () => {
  it('uses Mifflin-St Jeor with sex offsets', () => {
    expect(calculateBmr(rohan)).toBe(1770);
    expect(calculateBmr({ ...rohan, sex: 'female' })).toBe(1604);
  });

  it('multiplies by the activity factor', () => {
    expect(calculateTdee(1000, 'moderate')).toBeCloseTo(1550);
  });
});

describe('buildTargets', () => {
  it('builds a 500 kcal deficit plan for weight loss', () => {
    const plan = buildTargets(rohan, { type: 'lose_weight', targetWeightKg: 72 }, []);
    expect(plan.tdee).toBe(2124);
    expect(plan.dailyEnergyDelta).toBe(-500);
    expect(plan.targets).toMatchObject({
      kcal: 1620,
      proteinG: 98,
      fatG: 54,
      carbsG: 186,
      waterMl: 2850,
      saturatedFatMaxG: null,
      addedSugarMaxG: null,
    });
    expect(plan.adjustments).toEqual([]);
  });

  it('never cuts below the calorie floor', () => {
    const small: BodyProfile = {
      sex: 'female',
      age: 55,
      heightCm: 150,
      weightKg: 52,
      activityLevel: 'sedentary',
    };
    const plan = buildTargets(small, { type: 'lose_weight', targetWeightKg: 48 }, []);
    expect(plan.adjustments).toContain('calorie_floor_applied');
    expect(plan.dailyEnergyDelta).toBeGreaterThan(-500);
    expect(plan.tdee + plan.dailyEnergyDelta).toBeGreaterThanOrEqual(1200 - 1);
  });

  it('raises a target weight that would fall below BMI 18.5', () => {
    const plan = buildTargets(rohan, { type: 'lose_weight', targetWeightKg: 50 }, []);
    expect(plan.adjustments).toContain('target_weight_raised_to_healthy_bmi');
    expect(plan.targetWeightKg).toBe(healthyMinimumWeightKg(176));
    expect(plan.targetWeightKg).toBe(57.5);
  });

  it('adds a surplus and higher protein for muscle gain', () => {
    const plan = buildTargets(rohan, { type: 'build_muscle', targetWeightKg: null }, []);
    expect(plan.dailyEnergyDelta).toBe(250);
    expect(plan.targets.proteinG).toBe(Math.round(82 * 1.6));
  });

  it('keeps maintenance calories for marker-focused goals', () => {
    const plan = buildTargets(rohan, { type: 'improve_marker', targetWeightKg: null }, []);
    expect(plan.dailyEnergyDelta).toBe(0);
    expect(plan.targets.kcal).toBe(2120);
  });

  it('applies lab adjustments for high LDL and HbA1c', () => {
    const plan = buildTargets(rohan, { type: 'lose_weight', targetWeightKg: 72 }, [
      { code: 'ldl', status: 'high' },
      { code: 'hba1c', status: 'high' },
    ]);
    expect(plan.targets.fiberG).toBe(30);
    expect(plan.targets.saturatedFatMaxG).toBe(13);
    expect(plan.targets.addedSugarMaxG).toBe(20);
    expect(plan.adjustments).toEqual([
      'fiber_raised_for_ldl',
      'saturated_fat_capped_for_ldl',
      'added_sugar_capped_for_hba1c',
      'carbs_shifted_earlier_for_hba1c',
    ]);
  });

  it('suggests foods for low vitamin D and B12 without changing calories', () => {
    const base = buildTargets(rohan, { type: 'maintain', targetWeightKg: null }, []);
    const plan = buildTargets(rohan, { type: 'maintain', targetWeightKg: null }, [
      { code: 'vitamin_d', status: 'low' },
      { code: 'vitamin_b12', status: 'low' },
    ]);
    expect(plan.targets.kcal).toBe(base.targets.kcal);
    expect(plan.foodSuggestions).toEqual(
      expect.arrayContaining(['Fortified milk', 'Curd and paneer']),
    );
  });

  it('keeps fibre between 25 and 30 g', () => {
    const light = buildTargets(
      { ...rohan, sex: 'female', weightKg: 50, heightCm: 152 },
      { type: 'maintain', targetWeightKg: null },
      [],
    );
    const heavy = buildTargets(
      { ...rohan, weightKg: 120, activityLevel: 'very_active' },
      { type: 'maintain', targetWeightKg: null },
      [],
    );
    expect(light.targets.fiberG).toBe(25);
    expect(heavy.targets.fiberG).toBe(30);
  });
});

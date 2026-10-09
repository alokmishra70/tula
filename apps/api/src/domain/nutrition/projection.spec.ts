import { projectGoalDate } from './projection';

describe('projectGoalDate', () => {
  it('projects the date a deficit reaches the target', () => {
    expect(projectGoalDate(82, 72, -500, '2026-10-08')).toEqual({
      startWeightKg: 82,
      targetWeightKg: 72,
      weeklyChangeKg: -0.45,
      projectedDate: '2027-03-11',
    });
  });

  it('returns no date when there is no target or no energy change', () => {
    expect(projectGoalDate(82, null, -500, '2026-10-08').projectedDate).toBeNull();
    expect(projectGoalDate(82, 72, 0, '2026-10-08').projectedDate).toBeNull();
  });

  it('returns no date when moving away from the target', () => {
    expect(projectGoalDate(70, 75, -500, '2026-10-08').projectedDate).toBeNull();
  });
});

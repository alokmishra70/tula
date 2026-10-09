import { DeviceClient, ROHAN_PROFILE } from './support/client';
import { createTestApp, type TestApp } from './support/test-app';

describe('Onboarding (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it('requires a device id', async () => {
    const response = await new DeviceClient(t.app)
      .post('/profile', ROHAN_PROFILE)
      .set('x-device-id', '')
      .expect(401);
    expect(response.body.code).toBe('unknown_device');
  });

  it('rejects devices without a profile on protected routes', async () => {
    const response = await new DeviceClient(t.app).get('/today').expect(401);
    expect(response.body.code).toBe('unknown_device');
  });

  it('validates fields and time zone', async () => {
    const client = new DeviceClient(t.app);
    const invalid = await client.post('/profile', { ...ROHAN_PROFILE, age: 12 }).expect(400);
    expect(invalid.body.details).toEqual([expect.objectContaining({ path: 'age' })]);
    await client.post('/profile', { ...ROHAN_PROFILE, timezone: 'Mars/Base' }).expect(400);
  });

  it('creates a profile and a personal plan', async () => {
    const client = new DeviceClient(t.app);
    const profile = await client.post('/profile', ROHAN_PROFILE).expect(200);
    expect(profile.body).toMatchObject({ name: 'Rohan', age: 31, weightKg: 82 });

    const plan = await client
      .post('/goals/plan', { goalType: 'lose_weight', targetWeightKg: 72 })
      .expect(200);
    expect(plan.body).toMatchObject({
      goalType: 'lose_weight',
      targets: { kcal: 1620, proteinG: 98 },
      projection: { targetWeightKg: 72, projectedDate: '2027-03-11' },
    });
    expect(plan.body.reasoning).toContain('72 kg');

    const active = await client.get('/goals/plan').expect(200);
    expect(active.body.goalId).toBe(plan.body.goalId);
  });

  it('is resumable: re-submitting the profile updates rather than duplicates', async () => {
    const client = new DeviceClient(t.app);
    await client.post('/profile', ROHAN_PROFILE).expect(200);
    const updated = await client.post('/profile', { ...ROHAN_PROFILE, weightKg: 81 }).expect(200);
    expect(updated.body.weightKg).toBe(81);
    expect(await t.prisma.user.count({ where: { deviceId: client.deviceId } })).toBe(1);
  });

  it('adjusts unrealistic goals and rejects contradictory ones', async () => {
    const client = new DeviceClient(t.app);
    await client.post('/profile', ROHAN_PROFILE).expect(200);
    const healthy = await client
      .post('/goals/plan', { goalType: 'lose_weight', targetWeightKg: 50 })
      .expect(200);
    expect(healthy.body.adjustments).toContain('target_weight_raised_to_healthy_bmi');
    expect(healthy.body.projection.targetWeightKg).toBe(57.5);

    await client.post('/goals/plan', { goalType: 'lose_weight', targetWeightKg: 90 }).expect(400);
  });

  it('keeps exactly one active plan', async () => {
    const client = await new DeviceClient(t.app).onboard();
    await client.post('/goals/plan', { goalType: 'maintain' }).expect(200);
    const user = await t.prisma.user.findUniqueOrThrow({ where: { deviceId: client.deviceId } });
    expect(await t.prisma.goal.count({ where: { userId: user.id, active: true } })).toBe(1);
  });
});

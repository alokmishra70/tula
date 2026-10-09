import { DeviceClient } from './support/client';
import { createTestApp, type TestApp } from './support/test-app';

describe('Today and nudges (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  const logMeal = (
    client: DeviceClient,
    mealType: string,
    eatenAt: string,
    key: string,
    kcal = 400,
  ) =>
    client
      .post('/meals', {
        mealType,
        eatenAt,
        source: 'text',
        mediaKey: null,
        rawText: null,
        items: [
          {
            name: 'Thali',
            quantity: 1,
            unit: 'plate',
            kcal,
            proteinG: 20,
            carbsG: 50,
            fatG: 10,
            fiberG: 6,
            confidence: 0.9,
            dishRefId: null,
            edited: false,
          },
        ],
      })
      .set('idempotency-key', key)
      .expect(201);

  it('greets a new user with the first-meal nudge and an empty week', async () => {
    t.clock.set('2026-10-08T03:30:00Z');
    const client = await new DeviceClient(t.app).onboard();
    const { body } = await client.get('/today').expect(200);

    expect(body).toMatchObject({
      date: '2026-10-08',
      name: 'Rohan',
      targets: { kcal: 1620 },
      summary: { mealsCount: 0 },
      streak: { current: 0 },
      nudge: { rule: 'first_meal', action: 'log_meal' },
    });
    expect(body.week).toHaveLength(7);
    expect(body.week.every((day: { onTarget: unknown }) => day.onTarget === null)).toBe(true);
  });

  it('nudges a missed lunch, keeps it stable, and respects dismissal', async () => {
    t.clock.set('2026-10-08T03:30:00Z');
    const client = await new DeviceClient(t.app).onboard();
    await logMeal(client, 'breakfast', '2026-10-08T03:00:00Z', 'today-bf-001');

    t.clock.set('2026-10-08T08:30:00Z');
    const first = await client.get('/today').expect(200);
    expect(first.body.nudge).toMatchObject({ rule: 'missing_meal', mealType: 'lunch' });
    expect(first.body.nudge.message).toBe('Lunch not logged yet. Snap it now?');

    const again = await client.get('/today').expect(200);
    expect(again.body.nudge.id).toBe(first.body.nudge.id);

    await client.post(`/nudges/${first.body.nudge.id}/dismiss`).expect(204);
    expect((await client.get('/today').expect(200)).body.nudge).toBeNull();
  });

  it('counts a streak and fills the week strip', async () => {
    t.clock.set('2026-10-08T15:00:00Z');
    const client = await new DeviceClient(t.app).onboard();
    for (const [index, date] of ['2026-10-06', '2026-10-07', '2026-10-08'].entries()) {
      t.clock.set(`${date}T15:00:00Z`);
      await logMeal(client, 'lunch', `${date}T07:30:00Z`, `streak-l-${index}`, 800);
      await logMeal(client, 'dinner', `${date}T14:30:00Z`, `streak-d-${index}`, 700);
    }
    const { body } = await client.get('/today').expect(200);
    expect(body.streak).toMatchObject({ current: 3, milestoneReached: 3 });
    expect(body.week.slice(-3).map((d: { onTarget: boolean }) => d.onTarget)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('serves past days without a nudge and refuses future dates', async () => {
    t.clock.set('2026-10-08T08:30:00Z');
    const client = await new DeviceClient(t.app).onboard();
    const past = await client.get('/today?date=2026-10-07').expect(200);
    expect(past.body.nudge).toBeNull();
    await client.get('/today?date=2026-10-09').expect(400);
  });
});

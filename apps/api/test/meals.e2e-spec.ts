import { AiUnavailableError } from '../src/ai/llm-errors';
import { LlmProvider, type LlmChatChunk } from '../src/ai/llm-provider';
import { DeviceClient, uploadFile } from './support/client';
import { createTestApp, type TestApp } from './support/test-app';

const NOW = '2026-10-08T08:30:00.000Z';

async function parsedItems(client: DeviceClient, text: string) {
  const { body } = await client
    .post('/meals/parse', { source: 'text', mealType: 'lunch', eatenAt: NOW, text })
    .expect(200);
  expect(body.outcome).toBe('parsed');
  return (body.items as Array<Record<string, unknown> & { kcal: number }>).map(
    ({ clarification: _c, ...item }) => ({
      ...item,
      edited: false,
    }),
  );
}

const mealBody = (items: unknown[], overrides: object = {}) => ({
  mealType: 'lunch',
  eatenAt: NOW,
  source: 'text',
  mediaKey: null,
  rawText: null,
  items,
  ...overrides,
});

describe('Meals (e2e)', () => {
  let t: TestApp;
  let client: DeviceClient;

  beforeAll(async () => {
    t = await createTestApp();
    client = await new DeviceClient(t.app).onboard();
  });
  afterAll(() => t.close());

  it('parses text into curated Indian dishes', async () => {
    const items = await parsedItems(client, '2 roti, 1 katori dal');
    expect(items).toEqual([
      expect.objectContaining({ name: 'Roti', quantity: 2, unit: 'roti', kcal: 240 }),
      expect.objectContaining({ name: 'Dal tadka', unit: 'katori', kcal: 160 }),
    ]);
  });

  it('logs a meal once per idempotency key and updates the day', async () => {
    const items = await parsedItems(client, '2 roti, 1 katori dal');
    const first = await client
      .post('/meals', mealBody(items))
      .set('idempotency-key', 'lunch-key-001')
      .expect(201);
    expect(first.body.summary).toMatchObject({
      date: '2026-10-08',
      mealsCount: 1,
      consumed: { kcal: 400 },
    });
    expect(first.body.insight).toBe('16 g protein in this meal. 1,220 kcal left today.');

    const replay = await client
      .post('/meals', mealBody(items))
      .set('idempotency-key', 'lunch-key-001')
      .expect(201);
    expect(replay.body.meal.id).toBe(first.body.meal.id);

    const mismatch = await client
      .post('/meals', mealBody(items, { mealType: 'dinner' }))
      .set('idempotency-key', 'lunch-key-001')
      .expect(409);
    expect(mismatch.body.code).toBe('idempotency_mismatch');
  });

  it('handles concurrent double taps as one meal', async () => {
    const items = await parsedItems(client, '1 katori curd');
    const send = () =>
      client
        .post('/meals', mealBody(items, { mealType: 'snack' }))
        .set('idempotency-key', 'double-tap-01');
    const [a, b] = await Promise.all([send(), send()]);
    expect(a.body.meal.id).toBe(b.body.meal.id);
  });

  it('requires an idempotency key', async () => {
    await client.post('/meals', mealBody([])).expect(400);
  });

  it('edits and deletes meals, keeping summaries in step', async () => {
    const items = await parsedItems(client, '1 katori poha');
    const created = await client
      .post(
        '/meals',
        mealBody(items, { mealType: 'breakfast', eatenAt: '2026-10-08T03:00:00.000Z' }),
      )
      .set('idempotency-key', 'edit-delete-01')
      .expect(201);
    const before = created.body.summary.consumed.kcal as number;

    const doubled = items.map((item) => ({
      ...item,
      quantity: 2,
      kcal: item.kcal * 2,
      edited: true,
    }));
    const edited = await client
      .patch(`/meals/${created.body.meal.id}`, { items: doubled })
      .expect(200);
    expect(edited.body.summary.consumed.kcal).toBe(before + 250);

    const moved = await client
      .patch(`/meals/${created.body.meal.id}`, { eatenAt: '2026-10-07T03:00:00.000Z' })
      .expect(200);
    expect(moved.body.summary.date).toBe('2026-10-07');

    const deleted = await client.delete(`/meals/${created.body.meal.id}`).expect(200);
    expect(deleted.body.summary).toMatchObject({ date: '2026-10-07', mealsCount: 0 });
    await client.delete(`/meals/${created.body.meal.id}`).expect(404);
  });

  it('only allows logging for today or the previous days', async () => {
    const items = await parsedItems(client, '1 banana');
    await client
      .post('/meals', mealBody(items, { eatenAt: '2026-10-01T08:00:00.000Z' }))
      .set('idempotency-key', 'too-old-0001')
      .expect(400);
    await client
      .post('/meals', mealBody(items, { eatenAt: '2026-10-09T08:00:00.000Z' }))
      .set('idempotency-key', 'future-0001')
      .expect(400);
  });

  it('parses an uploaded photo and returns a signed photo URL', async () => {
    const key = await uploadFile(client, 'meal_photo', 'image/jpeg', Buffer.from('fake-jpeg'));
    const parsed = await client
      .post('/meals/parse', { source: 'photo', mealType: 'dinner', eatenAt: NOW, mediaKey: key })
      .expect(200);
    expect(parsed.body.items.length).toBeGreaterThan(2);

    const items = (parsed.body.items as Array<Record<string, unknown>>).map(
      ({ clarification: _c, ...i }) => ({ ...i, edited: false }),
    );
    const saved = await client
      .post('/meals', mealBody(items, { source: 'photo', mediaKey: key, mealType: 'dinner' }))
      .set('idempotency-key', 'photo-meal-01')
      .expect(201);
    expect(saved.body.meal.mediaUrl).toContain('/v1/media/local?token=');
  });

  it("refuses another user's media", async () => {
    const other = await new DeviceClient(t.app).onboard();
    const key = await uploadFile(other, 'meal_photo', 'image/jpeg', Buffer.from('theirs'));
    await client
      .post('/meals/parse', { source: 'photo', mealType: 'lunch', eatenAt: NOW, mediaKey: key })
      .expect(404);
  });

  it("suggests yesterday's meal as a quick add", async () => {
    const items = await parsedItems(client, '1 katori upma');
    await client
      .post(
        '/meals',
        mealBody(items, { mealType: 'breakfast', eatenAt: '2026-10-07T03:00:00.000Z' }),
      )
      .set('idempotency-key', 'yesterday-01')
      .expect(201);
    const quick = await client.get('/meals/frequent?mealType=breakfast').expect(200);
    expect(quick.body[0]).toMatchObject({
      kind: 'same_as_yesterday',
      label: 'Same breakfast as yesterday',
    });
  });
});

class DownProvider extends LlmProvider {
  readonly name = 'down';
  async generateStructured<T>(): Promise<T> {
    throw new AiUnavailableError(['down']);
  }
  // eslint-disable-next-line require-yield
  async *streamText(): AsyncIterable<LlmChatChunk> {
    throw new AiUnavailableError(['down']);
  }
}

describe('Meals when the model is unavailable (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp({ llm: new DownProvider() });
  });
  afterAll(() => t.close());

  it('saves the raw input as a pending meal instead of failing', async () => {
    const client = await new DeviceClient(t.app).onboard();
    const { body } = await client
      .post('/meals/parse', {
        source: 'text',
        mealType: 'lunch',
        eatenAt: NOW,
        text: '2 roti and dal',
      })
      .expect(200);
    expect(body).toMatchObject({
      outcome: 'pending',
      meal: { status: 'pending', rawText: '2 roti and dal', items: [] },
    });

    const today = await client.get('/today').expect(200);
    expect(today.body.meals).toHaveLength(1);
    expect(today.body.summary.mealsCount).toBe(1);
  });
});

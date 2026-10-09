import type { ChatStreamEvent } from '@tula/shared';
import { DeviceClient } from './support/client';
import { createTestApp, type TestApp } from './support/test-app';

const parseEvents = (text: string): ChatStreamEvent[] =>
  text
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.slice(6)) as ChatStreamEvent);

describe('Chat (e2e)', () => {
  let t: TestApp;
  let client: DeviceClient;

  beforeAll(async () => {
    t = await createTestApp();
    client = await new DeviceClient(t.app).onboard();
  });
  afterAll(() => t.close());

  it("streams a reply grounded in today's data", async () => {
    const response = await client
      .post('/chat', { message: 'How am I doing today?' })
      .buffer(true)
      .parse((res, done) => {
        let text = '';
        res.on('data', (chunk: Buffer) => (text += chunk.toString()));
        res.on('end', () => done(null, text));
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    const events = parseEvents(response.body as string);
    expect(events[0]).toMatchObject({ type: 'card', card: { type: 'day', targetKcal: 1620 } });
    expect(events.some((e) => e.type === 'token')).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: 'done' });
  });

  it('logs a meal from chat', async () => {
    t.clock.set('2026-10-08T08:35:00Z');
    const response = await client
      .post('/chat', { message: 'log 2 idli and sambar' })
      .buffer(true)
      .parse((res, done) => {
        let text = '';
        res.on('data', (chunk: Buffer) => (text += chunk.toString()));
        res.on('end', () => done(null, text));
      })
      .expect(200);
    const card = parseEvents(response.body as string).find((e) => e.type === 'card');
    expect(card).toMatchObject({ card: { type: 'meal', meal: { source: 'chat' } } });

    const today = await client.get('/today').expect(200);
    expect(today.body.meals.map((m: { source: string }) => m.source)).toContain('chat');
  });

  it('keeps the conversation history', async () => {
    const { body } = await client.get('/chat/messages').expect(200);
    expect(body.map((m: { role: string }) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ]);
    expect(body[1].cards[0].type).toBe('day');
  });

  it('validates message length', async () => {
    await client.post('/chat', { message: 'x'.repeat(1001) }).expect(400);
  });
});

import { TodayQuerySchema } from '@tula/shared';
import { z } from 'zod';
import { ApiError, createApiClient } from './api-client';

function clientReturning(response: Response | Error) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (response instanceof Error) throw response;
    return response;
  }) as unknown as typeof fetch;
  const client = createApiClient({
    baseUrl: 'http://api.test',
    getDeviceId: async () => 'device-1',
    fetchFn,
  });
  return { client, calls };
}

describe('createApiClient', () => {
  it('sends the device id and builds versioned URLs with a query', async () => {
    const { client, calls } = clientReturning(Response.json({ ok: true }));
    await client.get('/today', { query: { date: '2026-10-08', skip: undefined } });
    expect(calls[0]?.url).toBe('http://api.test/v1/today?date=2026-10-08');
    expect(calls[0]?.init.headers).toMatchObject({ 'x-device-id': 'device-1' });
  });

  it('serialises JSON bodies', async () => {
    const { client, calls } = clientReturning(Response.json({}));
    await client.post('/meals', { a: 1 }, { headers: { 'idempotency-key': 'k' } });
    expect(calls[0]?.init).toMatchObject({ method: 'POST', body: '{"a":1}' });
    expect(calls[0]?.init.headers).toMatchObject({
      'content-type': 'application/json',
      'idempotency-key': 'k',
    });
  });

  it('maps the API error shape', async () => {
    const { client } = clientReturning(
      Response.json({ code: 'duplicate_report', message: 'Already uploaded' }, { status: 409 }),
    );
    await expect(client.post('/reports', {})).rejects.toMatchObject({
      code: 'duplicate_report',
      status: 409,
      isRetryable: false,
    });
  });

  it('reports network failures as offline and retryable', async () => {
    const { client } = clientReturning(new TypeError('Network request failed'));
    const error = (await client.get('/today').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.isOffline).toBe(true);
    expect(error.isRetryable).toBe(true);
  });

  it('validates responses against the shared contract', async () => {
    const { client } = clientReturning(Response.json({ date: 'not-a-date' }));
    await expect(client.get('/today', { schema: TodayQuerySchema })).rejects.toMatchObject({
      code: 'contract_mismatch',
    });
  });

  it('returns undefined for 204 responses', async () => {
    const { client } = clientReturning(new Response(null, { status: 204 }));
    await expect(
      client.post('/nudges/1/act', undefined, { schema: z.undefined() }),
    ).resolves.toBeUndefined();
  });
});

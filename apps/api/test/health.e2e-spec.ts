import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { createTestApp, type TestApp } from './support/test-app';

describe('Platform (e2e)', () => {
  let harness: TestApp;
  let app: NestFastifyApplication;

  beforeAll(async () => {
    harness = await createTestApp();
    app = harness.app;
  });

  afterAll(() => harness.close());

  it('GET /v1/health reports the database as up', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('echoes a caller-provided request id', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .set('x-request-id', 'req-123');
    expect(response.headers['x-request-id']).toBe('req-123');
  });

  it('returns the standard error shape for unknown routes', async () => {
    const response = await request(app.getHttpServer()).get('/v1/nope').expect(404);
    expect(response.body).toEqual({ code: 'not_found', message: expect.any(String) });
  });
});

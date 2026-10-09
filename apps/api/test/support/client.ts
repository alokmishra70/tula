import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { PlanRequest, UpsertProfileRequest } from '@tula/shared';
import request from 'supertest';

export const ROHAN_PROFILE: UpsertProfileRequest = {
  name: 'Rohan',
  sex: 'male',
  age: 31,
  heightCm: 176,
  weightKg: 82,
  activityLevel: 'sedentary',
  timezone: 'Asia/Kolkata',
};

/** Supertest bound to one device id. */
export class DeviceClient {
  readonly deviceId = randomUUID();

  constructor(readonly app: NestFastifyApplication) {}

  get(path: string) {
    return request(this.app.getHttpServer()).get(`/v1${path}`).set('x-device-id', this.deviceId);
  }

  post(path: string, body?: object) {
    return request(this.app.getHttpServer())
      .post(`/v1${path}`)
      .set('x-device-id', this.deviceId)
      .send(body);
  }

  patch(path: string, body: object) {
    return request(this.app.getHttpServer())
      .patch(`/v1${path}`)
      .set('x-device-id', this.deviceId)
      .send(body);
  }

  delete(path: string) {
    return request(this.app.getHttpServer()).delete(`/v1${path}`).set('x-device-id', this.deviceId);
  }

  async onboard(
    profile: Partial<UpsertProfileRequest> = {},
    plan: PlanRequest = { goalType: 'lose_weight', targetWeightKg: 72 },
  ): Promise<this> {
    await this.post('/profile', { ...ROHAN_PROFILE, ...profile }).expect(200);
    await this.post('/goals/plan', plan).expect(200);
    return this;
  }
}

export async function uploadFile(
  client: DeviceClient,
  kind: 'meal_photo' | 'meal_audio' | 'report',
  contentType: string,
  data: Buffer,
): Promise<string> {
  const { body } = await client
    .post('/media/upload-url', { kind, contentType, sizeBytes: data.length })
    .expect(200);
  const url = new URL(body.uploadUrl as string);
  const path = `${url.pathname}${url.search}`;
  await request(client.app.getHttpServer())
    .put(path)
    .set('content-type', contentType)
    .send(data)
    .expect(204);
  return body.key as string;
}

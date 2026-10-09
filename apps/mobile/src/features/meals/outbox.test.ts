import type { CreateMealRequest } from '@tula/shared';
import { ApiError } from '@/lib/api-client';
import { mealsApi } from './api';
import { drainOutbox, enqueueMeal, MAX_ATTEMPTS, useOutboxStore } from './outbox';

jest.mock('./api', () => ({ mealsApi: { create: jest.fn() } }));
jest.mock('@/lib/upload', () => ({
  uploadFile: jest.fn(async () => ({ key: 'meal_photo/u/1.jpg', bytes: new Uint8Array() })),
}));

const create = mealsApi.create as jest.Mock;
const request: CreateMealRequest = {
  mealType: 'lunch',
  eatenAt: '2026-10-08T07:00:00.000Z',
  source: 'text',
  mediaKey: null,
  rawText: '2 roti',
  items: [],
};

describe('outbox', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await drainOutbox();
    create.mockReset();
    useOutboxStore.setState({ items: [], hydrated: true });
  });

  afterEach(() => jest.useRealTimers());

  it('sends queued meals with their idempotency key and clears them', async () => {
    create.mockResolvedValue({});
    await enqueueMeal({ idempotencyKey: 'k1', request: { ...request }, localMedia: null });
    await drainOutbox();
    expect(create).toHaveBeenCalledWith(request, 'k1');
    expect(useOutboxStore.getState().items).toEqual([]);
  });

  it('keeps draining after an empty run', async () => {
    create.mockResolvedValue({});
    await drainOutbox();
    await enqueueMeal({ idempotencyKey: 'k0', request: { ...request }, localMedia: null });
    await drainOutbox();
    expect(create).toHaveBeenCalledWith(request, 'k0');
  });

  it('uploads local media before saving', async () => {
    create.mockResolvedValue({});
    await enqueueMeal({
      idempotencyKey: 'k2',
      request: { ...request, source: 'photo' },
      localMedia: { uri: 'file:///meal.jpg', mimeType: 'image/jpeg', kind: 'meal_photo' },
    });
    await drainOutbox();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ mediaKey: 'meal_photo/u/1.jpg' }),
      'k2',
    );
  });

  it('retries with backoff while offline, then marks the meal as failed', async () => {
    create.mockRejectedValue(new ApiError('offline', 'offline', 0));
    await enqueueMeal({ idempotencyKey: 'k3', request: { ...request }, localMedia: null });
    await drainOutbox();
    expect(useOutboxStore.getState().items[0]).toMatchObject({ state: 'queued', attempts: 1 });

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++)
      await jest.advanceTimersByTimeAsync(120_000);
    expect(useOutboxStore.getState().items[0]).toMatchObject({
      state: 'failed',
      attempts: MAX_ATTEMPTS,
    });
  });

  it('fails immediately on a non-retryable error', async () => {
    create.mockRejectedValue(new ApiError('validation_failed', 'bad', 400));
    await enqueueMeal({ idempotencyKey: 'k4', request: { ...request }, localMedia: null });
    await drainOutbox();
    expect(useOutboxStore.getState().items[0]).toMatchObject({ state: 'failed', attempts: 1 });
  });
});

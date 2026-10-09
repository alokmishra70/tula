import NetInfo from '@react-native-community/netinfo';
import type { CreateMealRequest, MediaKind } from '@tula/shared';
import { create } from 'zustand';
import { ApiError } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { readJson, writeJson } from '@/lib/storage';
import { uploadFile } from '@/lib/upload';
import { mealsApi } from './api';

export interface OutboxItem {
  idempotencyKey: string;
  request: CreateMealRequest;
  localMedia: { uri: string; mimeType: string; kind: MediaKind } | null;
  attempts: number;
  state: 'queued' | 'failed';
  nextAttemptAt: number;
}

const STORAGE_KEY = 'tula.outbox';
export const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000, 60_000];

interface OutboxState {
  items: OutboxItem[];
  hydrated: boolean;
}

export const useOutboxStore = create<OutboxState>(() => ({ items: [], hydrated: false }));

async function save(items: OutboxItem[]): Promise<void> {
  useOutboxStore.setState({ items });
  await writeJson(STORAGE_KEY, items);
}

export async function enqueueMeal(
  item: Omit<OutboxItem, 'attempts' | 'state' | 'nextAttemptAt'>,
): Promise<void> {
  const items = useOutboxStore
    .getState()
    .items.filter((i) => i.idempotencyKey !== item.idempotencyKey);
  await save([...items, { ...item, attempts: 0, state: 'queued', nextAttemptAt: 0 }]);
  void drainOutbox();
}

export async function retryFailed(): Promise<void> {
  await save(
    useOutboxStore
      .getState()
      .items.map((i) => ({ ...i, state: 'queued', attempts: 0, nextAttemptAt: 0 })),
  );
  await drainOutbox();
}

/** Uploads media if needed, then saves; idempotency keys make every retry safe. */
async function send(item: OutboxItem): Promise<void> {
  let request = item.request;
  if (item.localMedia && !request.mediaKey) {
    const { key } = await uploadFile(item.localMedia.kind, item.localMedia);
    request = { ...request, mediaKey: key };
  }
  await mealsApi.create(request, item.idempotencyKey);
}

let draining: Promise<void> | null = null;

async function drainOnce(): Promise<void> {
  for (const item of [...useOutboxStore.getState().items]) {
    if (item.state === 'failed' || item.nextAttemptAt > Date.now()) continue;
    try {
      await send(item);
      await save(
        useOutboxStore.getState().items.filter((i) => i.idempotencyKey !== item.idempotencyKey),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayAll });
    } catch (error) {
      const retryable = !(error instanceof ApiError) || error.isRetryable;
      const attempts = item.attempts + 1;
      const failed = !retryable || attempts >= MAX_ATTEMPTS;
      await save(
        useOutboxStore.getState().items.map((i) =>
          i.idempotencyKey === item.idempotencyKey
            ? {
                ...i,
                attempts,
                state: failed ? 'failed' : 'queued',
                nextAttemptAt: Date.now() + (BACKOFF_MS[attempts - 1] ?? 0),
              }
            : i,
        ),
      );
      // Offline: keep order and stop until the connection returns.
      if (error instanceof ApiError && error.isOffline) break;
    }
  }
}

/** Sends queued meals in order; concurrent calls share one run. */
export function drainOutbox(): Promise<void> {
  // Assign before clearing: an empty run settles synchronously, and must not leave a stale promise behind.
  draining ??= drainOnce().finally(() => {
    draining = null;
    scheduleRetry();
  });
  return draining;
}

let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry(): void {
  const waiting = useOutboxStore.getState().items.filter((i) => i.state === 'queued');
  if (waiting.length === 0) return;
  const delay = Math.max(0, Math.min(...waiting.map((i) => i.nextAttemptAt)) - Date.now());
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void drainOutbox(), delay);
}

let started = false;

/** Loads the queue and drains it whenever the device comes back online. */
export async function startOutbox(): Promise<void> {
  if (started) return;
  started = true;
  useOutboxStore.setState({
    items: (await readJson<OutboxItem[]>(STORAGE_KEY)) ?? [],
    hydrated: true,
  });
  NetInfo.addEventListener((state) => {
    if (state.isConnected) void drainOutbox();
  });
  void drainOutbox();
}

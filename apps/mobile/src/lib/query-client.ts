import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';
import { keyValueStore } from './storage';

const DAY_MS = 24 * 60 * 60 * 1000;
export const QUERY_CACHE_MAX_AGE_MS = DAY_MS;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: DAY_MS,
      retry: (failures, error) =>
        error instanceof ApiError && !error.isRetryable ? false : failures < 2,
    },
    mutations: { retry: false },
  },
});

/** Persisted cache lets Today render the last known state when the server is unreachable. */
export const queryPersister = createAsyncStoragePersister({
  storage: keyValueStore,
  key: 'tula.queryCache',
  throttleTime: 1000,
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

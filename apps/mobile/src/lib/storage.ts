import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { createMMKV as CreateMMKV } from 'react-native-mmkv';

/** Async key-value port shared by the query cache, outbox and small app state. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function createMmkvStore(): KeyValueStore | null {
  if (Platform.OS === 'web') return null;
  try {
    // MMKV needs a development build; Expo Go falls back to AsyncStorage.
    const { createMMKV } = require('react-native-mmkv') as { createMMKV: typeof CreateMMKV };
    const mmkv = createMMKV({ id: 'tula' });
    return {
      getItem: async (key) => mmkv.getString(key) ?? null,
      setItem: async (key, value) => mmkv.set(key, value),
      removeItem: async (key) => {
        mmkv.remove(key);
      },
    };
  } catch {
    return null;
  }
}

export const keyValueStore: KeyValueStore = createMmkvStore() ?? AsyncStorage;

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await keyValueStore.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): Promise<void> {
  return keyValueStore.setItem(key, JSON.stringify(value));
}

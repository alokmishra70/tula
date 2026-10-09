import { randomUUID } from 'expo-crypto';
import { secureStore } from './secure-store';

const KEY = 'tula.deviceId';
let cached: string | null = null;

/** Anonymous identity: a UUID created on first launch and kept in the keychain. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  cached = (await secureStore.get(KEY)) ?? randomUUID();
  await secureStore.set(KEY, cached);
  return cached;
}

/** Used by the hidden demo switcher to load a seeded profile. */
export async function setDeviceId(deviceId: string): Promise<void> {
  cached = deviceId;
  await secureStore.set(KEY, deviceId);
}

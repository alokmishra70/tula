// The browser has no keychain; the device id is not a secret, so localStorage is acceptable.
export const secureStore = {
  get: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  set: async (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
};

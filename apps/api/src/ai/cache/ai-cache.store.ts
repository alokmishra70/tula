export abstract class AiCacheStore {
  abstract get(key: string): Promise<unknown | null>;
  abstract set(key: string, value: unknown): Promise<void>;
}

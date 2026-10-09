import { ApiErrorSchema, HEADERS } from '@tula/shared';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isOffline(): boolean {
    return this.status === 0;
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

type Query = Record<string, string | number | undefined>;

export interface RequestOptions<T> {
  schema?: z.ZodType<T>;
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiClientOptions {
  baseUrl: string;
  getDeviceId: () => Promise<string>;
  fetchFn?: typeof fetch;
}

const OFFLINE_MESSAGE = "You're offline. We'll try again when you're back.";

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const params = Object.entries(query ?? {}).filter(([, value]) => value !== undefined);
  const search = params.length
    ? `?${params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`
    : '';
  return `${baseUrl}/v1${path}${search}`;
}

export function createApiClient({ baseUrl, getDeviceId, fetchFn = fetch }: ApiClientOptions) {
  async function headersFor(extra: Record<string, string> = {}, hasBody = false) {
    return {
      accept: 'application/json',
      [HEADERS.deviceId]: await getDeviceId(),
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...extra,
    };
  }

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions<T> = {},
  ): Promise<T> {
    const hasBody = options.body !== undefined;
    let response: Response;
    try {
      response = await fetchFn(buildUrl(baseUrl, path, options.query), {
        method,
        headers: await headersFor(options.headers, hasBody),
        body: hasBody ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      throw new ApiError('offline', OFFLINE_MESSAGE, 0);
    }

    if (response.status === 204) return undefined as T;
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = ApiErrorSchema.safeParse(payload);
      throw parsed.success
        ? new ApiError(parsed.data.code, parsed.data.message, response.status, parsed.data.details)
        : new ApiError('http_error', `Request failed with ${response.status}`, response.status);
    }
    if (!options.schema) return payload as T;
    const result = options.schema.safeParse(payload);
    if (!result.success) {
      throw new ApiError(
        'contract_mismatch',
        `Unexpected response from ${path}`,
        response.status,
        result.error.issues,
      );
    }
    return result.data;
  }

  return {
    get: <T>(path: string, options?: RequestOptions<T>) => request<T>('GET', path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions<T>) =>
      request<T>('POST', path, { ...options, body }),
    patch: <T>(path: string, body: unknown, options?: RequestOptions<T>) =>
      request<T>('PATCH', path, { ...options, body }),
    delete: <T>(path: string, options?: RequestOptions<T>) => request<T>('DELETE', path, options),
    url: (path: string) => buildUrl(baseUrl, path),
    headers: headersFor,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

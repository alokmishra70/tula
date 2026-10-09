import { fetch as expoFetch } from 'expo/fetch';
import { ApiError } from './api-client';
import { api } from './api';
import { drainSseBuffer } from './sse';

/** POSTs and reads a server-sent-event stream; expo/fetch exposes streaming bodies on native too. */
export async function streamPost(
  path: string,
  body: unknown,
  onEvent: (data: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Awaited<ReturnType<typeof expoFetch>>;
  try {
    response = await expoFetch(api.url(path), {
      method: 'POST',
      headers: { ...(await api.headers({}, true)), accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError('offline', "You're offline. Your message is still here.", 0);
  }
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    throw new ApiError(
      payload?.code ?? 'http_error',
      payload?.message ?? 'Request failed',
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = drainSseBuffer(buffer);
    buffer = rest;
    events.forEach(onEvent);
  }
}

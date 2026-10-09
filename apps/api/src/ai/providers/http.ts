import { errorForStatus, LlmServerError, LlmTimeoutError } from '../llm-errors';

export type FetchFn = typeof fetch;

export interface HttpRequest {
  provider: string;
  url: string;
  headers: Record<string, string>;
  body: string | FormData;
  timeoutMs: number;
}

export async function send(fetchFn: FetchFn, request: HttpRequest): Promise<Response> {
  let response: Response;
  try {
    response = await fetchFn(request.url, {
      method: 'POST',
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    const name = (error as Error).name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new LlmTimeoutError(request.provider, `No response within ${request.timeoutMs} ms`);
    }
    throw new LlmServerError(request.provider, `Network error: ${(error as Error).message}`);
  }
  if (!response.ok) {
    throw errorForStatus(request.provider, response.status, await response.text().catch(() => ''));
  }
  return response;
}

export async function postJson<T>(
  fetchFn: FetchFn,
  request: Omit<HttpRequest, 'body'> & { body: unknown },
): Promise<T> {
  const response = await send(fetchFn, {
    ...request,
    headers: { 'content-type': 'application/json', ...request.headers },
    body: JSON.stringify(request.body),
  });
  return (await response.json()) as T;
}

/** Yields the `data:` payload of each server-sent event, stopping at `[DONE]`. */
export async function* readSseData(response: Response): AsyncGenerator<string> {
  if (!response.body) return;
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = event
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (!data) continue;
      if (data === '[DONE]') return;
      yield data;
    }
  }
}

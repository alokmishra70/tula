import type { FetchFn } from '../providers/http';

export interface RecordedRequest {
  url: string;
  init: RequestInit;
  json: () => Record<string, unknown>;
}

/** Returns queued responses in order and records each request. */
export function fakeFetch(...responses: Array<Response | Error>) {
  const requests: RecordedRequest[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    requests.push({ url, init, json: () => JSON.parse(init.body as string) });
    const next = responses.shift();
    if (!next) throw new Error('No fake response queued');
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as FetchFn;
  return { fn, requests };
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const sseResponse = (events: unknown[]) =>
  new Response(
    events
      .map((event) => `data: ${typeof event === 'string' ? event : JSON.stringify(event)}\n\n`)
      .join(''),
  );

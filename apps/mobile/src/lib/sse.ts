/** Splits a growing server-sent-events buffer into complete `data:` payloads. */
export function drainSseBuffer(buffer: string): { events: string[]; rest: string } {
  const events: string[] = [];
  let rest = buffer;
  let boundary: number;
  while ((boundary = rest.indexOf('\n\n')) !== -1) {
    const block = rest.slice(0, boundary);
    rest = rest.slice(boundary + 2);
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (data) events.push(data);
  }
  return { events, rest };
}

import { drainSseBuffer } from './sse';

describe('drainSseBuffer', () => {
  it('returns complete events and keeps the partial tail', () => {
    const { events, rest } = drainSseBuffer('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"');
    expect(events).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('data: {"c"');
  });

  it('ignores comments and blank blocks', () => {
    expect(drainSseBuffer(': ping\n\n\n\ndata: x\n\n').events).toEqual(['x']);
  });
});

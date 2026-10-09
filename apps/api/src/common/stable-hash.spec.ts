import { stableHash } from './stable-hash';

describe('stableHash', () => {
  it('ignores key order and undefined values', () => {
    expect(stableHash({ a: 1, b: { c: 2, d: 3 } })).toBe(
      stableHash({ b: { d: 3, c: 2 }, a: 1, e: undefined }),
    );
  });

  it('distinguishes different payloads and array order', () => {
    expect(stableHash({ items: [1, 2] })).not.toBe(stableHash({ items: [2, 1] }));
  });
});

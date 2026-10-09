import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TokenClaims {
  op: 'put' | 'get';
  key: string;
  contentType?: string;
  maxBytes?: number;
  exp: number;
}

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export function createToken(claims: TokenClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyToken(token: string, secret: string, nowMs: number): TokenClaims | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as TokenClaims;
    return claims.exp * 1000 > nowMs ? claims : null;
  } catch {
    return null;
  }
}

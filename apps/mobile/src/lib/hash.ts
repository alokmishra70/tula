import { CryptoDigestAlgorithm, digest } from 'expo-crypto';

export async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, bytes));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

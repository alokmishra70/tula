import type { MediaKind } from '@tula/shared';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/m4a': 'm4a',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'application/pdf': 'pdf',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  webm: 'audio/webm',
  wav: 'audio/wav',
  pdf: 'application/pdf',
};

export function buildMediaKey(
  kind: MediaKind,
  userId: string,
  id: string,
  contentType: string,
): string {
  return `${kind}/${userId}/${id}.${EXTENSIONS[contentType] ?? 'bin'}`;
}

export function isOwnedKey(key: string, kind: MediaKind, userId: string): boolean {
  return key.startsWith(`${kind}/${userId}/`) && !key.includes('..');
}

export function mimeTypeOf(key: string): string {
  return MIME_BY_EXTENSION[key.split('.').pop() ?? ''] ?? 'application/octet-stream';
}

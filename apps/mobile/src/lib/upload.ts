import type { MediaKind, UploadUrlResponse } from '@tula/shared';
import { UploadUrlResponseSchema } from '@tula/shared';
import { fetch as expoFetch } from 'expo/fetch';
import { ApiError } from './api-client';
import { api } from './api';
import { readFileBytes } from './read-file';

export interface LocalFile {
  uri: string;
  mimeType: string;
}

export interface UploadedFile {
  key: string;
  bytes: Uint8Array<ArrayBuffer>;
}

/** Signed direct upload: ask the API for a URL, then PUT the bytes straight to storage. */
export async function uploadFile(kind: MediaKind, file: LocalFile): Promise<UploadedFile> {
  const bytes = await readFileBytes(file.uri);
  const target: UploadUrlResponse = await api.post(
    '/media/upload-url',
    { kind, contentType: file.mimeType, sizeBytes: bytes.byteLength },
    { schema: UploadUrlResponseSchema },
  );
  let response: Awaited<ReturnType<typeof expoFetch>>;
  try {
    response = await expoFetch(target.uploadUrl, {
      method: target.method,
      headers: target.headers,
      body: bytes,
    });
  } catch {
    throw new ApiError('offline', "You're offline. We'll upload when you're back.", 0);
  }
  if (!response.ok)
    throw new ApiError('upload_failed', 'Upload failed. Try again.', response.status);
  return { key: target.key, bytes };
}

import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { MediaKind, UploadUrlRequest, UploadUrlResponse } from '@tula/shared';
import { AppException } from '../../common/errors/app.exception';
import { buildMediaKey, isOwnedKey, mimeTypeOf } from './media-keys';
import { ObjectStorage } from './storage/object-storage';

export interface StoredMedia {
  key: string;
  mimeType: string;
  data: Buffer;
}

@Injectable()
export class MediaService {
  constructor(private readonly storage: ObjectStorage) {}

  async createUploadUrl(userId: string, request: UploadUrlRequest): Promise<UploadUrlResponse> {
    const key = buildMediaKey(request.kind, userId, randomUUID(), request.contentType);
    const signed = await this.storage.createUploadUrl({
      key,
      contentType: request.contentType,
      sizeBytes: request.sizeBytes,
    });
    return {
      key,
      uploadUrl: signed.url,
      method: 'PUT',
      headers: signed.headers,
      expiresAt: signed.expiresAt.toISOString(),
    };
  }

  assertOwned(key: string, kind: MediaKind, userId: string): void {
    if (!isOwnedKey(key, kind, userId)) throw AppException.notFound('Media');
  }

  async read(key: string, kind: MediaKind, userId: string): Promise<StoredMedia> {
    this.assertOwned(key, kind, userId);
    const data = await this.storage.read(key);
    if (!data) throw AppException.notFound('Media');
    return { key, mimeType: mimeTypeOf(key), data };
  }

  readUrl(key: string): Promise<string> {
    return this.storage.createReadUrl(key);
  }
}

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { Clock } from '../../../common/clock';
import {
  ObjectStorage,
  SIGNED_URL_TTL_SECONDS,
  type SignedUpload,
  type UploadTarget,
} from './object-storage';
import { createToken, verifyToken, type TokenClaims } from './signed-token';

export interface LocalDiskOptions {
  directory: string;
  publicApiUrl: string;
  signingSecret: string;
}

export const LOCAL_MEDIA_ROUTE = 'media/local';

/** Development stand-in for Supabase Storage; files are served by LocalMediaController. */
export class LocalDiskStorage extends ObjectStorage {
  private readonly root: string;

  constructor(
    private readonly options: LocalDiskOptions,
    private readonly clock: Clock,
  ) {
    super();
    this.root = resolve(options.directory);
  }

  async createUploadUrl({ key, contentType, sizeBytes }: UploadTarget): Promise<SignedUpload> {
    const exp = this.expiry();
    const token = createToken(
      { op: 'put', key, contentType, maxBytes: sizeBytes, exp },
      this.options.signingSecret,
    );
    return {
      url: this.urlFor(token),
      headers: { 'content-type': contentType },
      expiresAt: new Date(exp * 1000),
    };
  }

  async createReadUrl(key: string): Promise<string> {
    return this.urlFor(
      createToken({ op: 'get', key, exp: this.expiry() }, this.options.signingSecret),
    );
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.pathFor(key));
    } catch {
      return null;
    }
  }

  async write(key: string, data: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  verify(token: string): TokenClaims | null {
    return verifyToken(token, this.options.signingSecret, this.clock.now().getTime());
  }

  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep))
      throw new Error('Storage key escapes the root directory');
    return path;
  }

  private urlFor(token: string): string {
    return `${this.options.publicApiUrl}/v1/${LOCAL_MEDIA_ROUTE}?token=${encodeURIComponent(token)}`;
  }

  private expiry(): number {
    return Math.floor(this.clock.now().getTime() / 1000) + SIGNED_URL_TTL_SECONDS;
  }
}

import type { Clock } from '../../../common/clock';
import {
  ObjectStorage,
  SIGNED_URL_TTL_SECONDS,
  type SignedUpload,
  type UploadTarget,
} from './object-storage';

export interface SupabaseOptions {
  url: string;
  serviceKey: string;
  bucket: string;
  fetchFn?: typeof fetch;
}

/** Supabase Storage over its REST API; the service key never leaves the server. */
export class SupabaseStorage extends ObjectStorage {
  private readonly api: string;
  private readonly fetchFn: typeof fetch;

  constructor(
    private readonly options: SupabaseOptions,
    private readonly clock: Clock,
  ) {
    super();
    this.api = `${options.url.replace(/\/$/, '')}/storage/v1`;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async createUploadUrl({ key, contentType }: UploadTarget): Promise<SignedUpload> {
    const { url } = await this.post<{ url: string }>(`/object/upload/sign/${this.path(key)}`, {});
    return {
      url: `${this.api}${url}`,
      headers: { 'content-type': contentType },
      expiresAt: new Date(this.clock.now().getTime() + SIGNED_URL_TTL_SECONDS * 1000),
    };
  }

  async createReadUrl(key: string): Promise<string> {
    const { signedURL } = await this.post<{ signedURL: string }>(`/object/sign/${this.path(key)}`, {
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });
    return `${this.api}${signedURL}`;
  }

  async read(key: string): Promise<Buffer | null> {
    const response = await this.fetchFn(`${this.api}/object/${this.path(key)}`, {
      headers: this.auth(),
    });
    if (response.status === 400 || response.status === 404) return null;
    if (!response.ok) throw new Error(`Supabase read failed with HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.api}${path}`, {
      method: 'POST',
      headers: { ...this.auth(), 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Supabase ${path} failed with HTTP ${response.status}`);
    return (await response.json()) as T;
  }

  private path(key: string): string {
    return `${this.options.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  private auth(): Record<string, string> {
    return { apikey: this.options.serviceKey, authorization: `Bearer ${this.options.serviceKey}` };
  }
}

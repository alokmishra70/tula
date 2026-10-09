export interface SignedUpload {
  url: string;
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface UploadTarget {
  key: string;
  contentType: string;
  sizeBytes: number;
}

export const SIGNED_URL_TTL_SECONDS = 5 * 60;

/** Private object store; clients only ever see short-lived signed URLs. */
export abstract class ObjectStorage {
  abstract createUploadUrl(target: UploadTarget): Promise<SignedUpload>;
  abstract createReadUrl(key: string): Promise<string>;
  abstract read(key: string): Promise<Buffer | null>;
}

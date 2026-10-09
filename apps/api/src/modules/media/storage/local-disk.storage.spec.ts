import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Clock } from '../../../common/clock';
import { LocalDiskStorage } from './local-disk.storage';

class FixedClock extends Clock {
  constructor(public current: Date) {
    super();
  }
  now() {
    return this.current;
  }
}

describe('LocalDiskStorage', () => {
  let directory: string;
  const clock = new FixedClock(new Date('2026-10-08T08:00:00Z'));
  const storage = () =>
    new LocalDiskStorage(
      { directory, publicApiUrl: 'http://api.test', signingSecret: 'test-secret-1234567890' },
      clock,
    );

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'tula-storage-'));
  });
  afterEach(() => rm(directory, { recursive: true, force: true }));

  const tokenOf = (url: string) => decodeURIComponent(new URL(url).searchParams.get('token') ?? '');

  it('signs upload URLs carrying the key, type and size limit', async () => {
    const upload = await storage().createUploadUrl({
      key: 'meal_photo/u/1.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 100,
    });
    expect(upload.url).toMatch(/^http:\/\/api\.test\/v1\/media\/local\?token=/);
    expect(storage().verify(tokenOf(upload.url))).toMatchObject({
      op: 'put',
      key: 'meal_photo/u/1.jpg',
      maxBytes: 100,
    });
  });

  it('rejects tampered and expired tokens', async () => {
    const { url } = await storage().createUploadUrl({
      key: 'k/u/1.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1,
    });
    const token = tokenOf(url);
    expect(storage().verify(`${token}x`)).toBeNull();
    clock.current = new Date('2026-10-08T08:06:00Z');
    expect(storage().verify(token)).toBeNull();
    clock.current = new Date('2026-10-08T08:00:00Z');
  });

  it('round-trips files and refuses keys outside its root', async () => {
    await storage().write('report/u/a.pdf', Buffer.from('pdf'));
    expect((await storage().read('report/u/a.pdf'))?.toString()).toBe('pdf');
    expect(await storage().read('report/u/missing.pdf')).toBeNull();
    await expect(storage().write('../escape.txt', Buffer.from('x'))).rejects.toThrow(/escapes/);
  });
});

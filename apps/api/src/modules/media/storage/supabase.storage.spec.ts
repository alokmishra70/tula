import { SystemClock } from '../../../common/clock';
import { SupabaseStorage } from './supabase.storage';

describe('SupabaseStorage', () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchFn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/upload/sign/'))
      return Response.json({ url: '/object/upload/sign/bucket/k.jpg?token=up' });
    if (url.includes('/object/sign/'))
      return Response.json({ signedURL: '/object/sign/bucket/k.jpg?token=read' });
    if (url.endsWith('/missing.jpg')) return new Response('not found', { status: 400 });
    return new Response(Buffer.from('bytes'));
  }) as unknown as typeof fetch;

  const storage = new SupabaseStorage(
    { url: 'https://proj.supabase.co/', serviceKey: 'service', bucket: 'bucket', fetchFn },
    new SystemClock(),
  );

  it('creates signed upload and read URLs with the service key', async () => {
    const upload = await storage.createUploadUrl({
      key: 'meal_photo/u/k.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 10,
    });
    expect(upload.url).toBe(
      'https://proj.supabase.co/storage/v1/object/upload/sign/bucket/k.jpg?token=up',
    );
    expect(calls[0]?.init?.headers).toMatchObject({ authorization: 'Bearer service' });
    expect(await storage.createReadUrl('meal_photo/u/k.jpg')).toContain('token=read');
  });

  it('reads objects and treats missing ones as null', async () => {
    expect((await storage.read('meal_photo/u/k.jpg'))?.toString()).toBe('bytes');
    expect(await storage.read('meal_photo/u/missing.jpg')).toBeNull();
  });
});

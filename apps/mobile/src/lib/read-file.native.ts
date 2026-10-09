import { File } from 'expo-file-system';

export async function readFileBytes(uri: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new File(uri).arrayBuffer());
}

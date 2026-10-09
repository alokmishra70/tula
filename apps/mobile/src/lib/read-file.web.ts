export async function readFileBytes(uri: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await (await fetch(uri)).arrayBuffer());
}

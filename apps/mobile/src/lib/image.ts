import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.7;

/** About 150 KB per meal photo: enough for the model, cheap on mobile data. */
export async function compressPhoto(uri: string): Promise<{ uri: string; mimeType: string }> {
  const image = await ImageManipulator.manipulate(uri).resize({ width: MAX_WIDTH }).renderAsync();
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { uri: result.uri, mimeType: 'image/jpeg' };
}

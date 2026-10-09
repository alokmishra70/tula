import * as ImagePicker from 'expo-image-picker';

/** Gallery on phones, file chooser on web. Returns null when the user cancels. */
export async function pickPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

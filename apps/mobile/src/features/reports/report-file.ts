import { LIMITS } from '@tula/shared';
import * as DocumentPicker from 'expo-document-picker';

export interface PickedReport {
  uri: string;
  name: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  size: number | null;
}

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'] as const;

function mimeFor(name: string, reported?: string | null): PickedReport['mimeType'] | null {
  const type = reported ?? '';
  if ((ACCEPTED as readonly string[]).includes(type)) return type as PickedReport['mimeType'];
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  if (/\.png$/i.test(name)) return 'image/png';
  return null;
}

export type PickResult =
  | { kind: 'picked'; file: PickedReport }
  | { kind: 'cancelled' }
  | { kind: 'invalid'; message: string };

export async function pickReportFile(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...ACCEPTED],
    copyToCacheDirectory: true,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return { kind: 'cancelled' };

  const mimeType = mimeFor(asset.name, asset.mimeType);
  if (!mimeType) return { kind: 'invalid', message: 'Choose a PDF or a photo of the report.' };
  if (asset.size && asset.size > LIMITS.uploadMaxBytes)
    return { kind: 'invalid', message: 'This file is over 10 MB.' };
  return {
    kind: 'picked',
    file: { uri: asset.uri, name: asset.name, mimeType, size: asset.size ?? null },
  };
}

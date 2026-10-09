import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Button, Skeleton, Text } from '@/ui';

const LINES = [
  'Spotting the dal',
  'Counting rotis',
  'Checking portions',
  'Matching Indian portions',
];
const LINE_MS = 1400;
const THUMB = 160;

export interface AnalysingStageProps {
  previewUri: string | null;
  timedOut: boolean;
  onSaveForLater: () => void;
}

/** No generic spinner: a thumbnail, a shimmer and food-specific progress lines. */
export function AnalysingStage({ previewUri, timedOut, onSaveForLater }: AnalysingStageProps) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLine((index) => (index + 1) % LINES.length), LINE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.thumb} contentFit="cover" />
      ) : (
        <Skeleton height={THUMB} width={THUMB} radius={radius.md} />
      )}
      <Text variant="heading">{LINES[line]}…</Text>
      <Skeleton height={spacing.sm} width="70%" />
      <Skeleton height={spacing.sm} width="50%" />
      {timedOut ? (
        <View style={styles.timeout}>
          <Text variant="body" color="inkMuted" align="center">
            This is taking longer than usual.
          </Text>
          <Button
            label="Save as text and finish later"
            variant="secondary"
            onPress={onSaveForLater}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  timeout: { gap: spacing.sm, alignItems: 'center' },
});

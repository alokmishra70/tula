import type { FlaggedMarker } from '@tula/shared';
import { ScrollView, StyleSheet, View } from 'react-native';
import { formatNumber, joinWithAnd } from '@/lib/format';
import { MARKER_LABELS, STATUS_CHIP, STATUS_WORD } from '@/lib/markers';
import { spacing } from '@/theme';
import { Card, Chip, LeafMark, Text } from '@/ui';

export function MarkersStrip({
  markers,
  onOpen,
}: {
  markers: FlaggedMarker[];
  onOpen: (marker: FlaggedMarker) => void;
}) {
  const flagged = markers.filter((m) => m.status !== 'in_range');
  if (flagged.length === 0) return null;
  return (
    <View style={styles.root}>
      <Text variant="heading" accessibilityRole="header">
        From your report
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {flagged.map((marker) => (
          <Chip
            key={marker.code}
            label={`${MARKER_LABELS[marker.code]} ${formatNumber(marker.value, 1)} ${STATUS_WORD[marker.status]}`}
            status={STATUS_CHIP[marker.status]}
            onPress={() => onOpen(marker)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** Celebrates a marker that moved toward its healthy range since the last report. */
export function ImprovedMarkers({ markers }: { markers: FlaggedMarker[] }) {
  const improved = markers.filter((m) => m.improved);
  if (improved.length === 0) return null;
  const names = joinWithAnd(improved.map((m) => MARKER_LABELS[m.code]));
  return (
    <Card variant="accent">
      <View style={styles.improved}>
        <LeafMark />
        <Text variant="body" style={styles.flex}>
          {names} improved since your last report. The daily changes are working.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  chips: { gap: spacing.xs },
  improved: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  flex: { flex: 1 },
});

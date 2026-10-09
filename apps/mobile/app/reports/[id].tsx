import type { MarkerCode } from '@tula/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AddMarkerForm,
  isWatchStatus,
  MarkerCard,
  useAddMarker,
  useReport,
  useUpdateMarker,
} from '@/features/reports';
import { formatShortDate } from '@/lib/format';
import { spacing } from '@/theme';
import { ArrowLeft, Button, Icon, Screen, Skeleton, Text } from '@/ui';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id, marker: focus } = useLocalSearchParams<{ id: string; marker?: MarkerCode }>();
  const report = useReport(id);
  const updateMarker = useUpdateMarker(id);
  const addMarker = useAddMarker(id);
  const [showInRange, setShowInRange] = useState(false);

  const header = (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/reports'))}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={spacing.sm}
      style={styles.back}
    >
      <Icon icon={ArrowLeft} />
    </Pressable>
  );

  if (!report.data) {
    return (
      <Screen header={header}>
        <Skeleton height={spacing.xxxl} />
        <Skeleton height={spacing.xxxl * 2} />
      </Screen>
    );
  }

  const data = report.data;
  const watch = data.markers.filter((m) => isWatchStatus(m.status) || m.needsConfirmation);
  const rest = data.markers.filter((m) => !watch.includes(m));
  const card = (m: (typeof data.markers)[number]) => (
    <MarkerCard
      key={m.id}
      marker={m}
      initiallyExpanded={m.code === focus}
      onCorrect={(body) => updateMarker.mutateAsync({ id: m.id, body })}
    />
  );

  return (
    <Screen header={header} title={data.labName ?? data.fileName}>
      <Text variant="caption" color="inkMuted">
        {data.reportDate ? formatShortDate(data.reportDate) : 'Date not printed'} ·{' '}
        {data.markers.length} values
      </Text>
      {watch.length > 0 ? (
        <>
          <Text variant="heading">To watch</Text>
          {watch.map(card)}
        </>
      ) : null}
      {rest.length > 0 ? (
        <>
          <Button
            label={showInRange ? 'Hide in range' : `In range (${rest.length})`}
            variant="ghost"
            onPress={() => setShowInRange((open) => !open)}
          />
          {showInRange ? rest.map(card) : null}
        </>
      ) : null}
      {data.status === 'ready' ? (
        <AddMarkerForm
          present={data.markers.flatMap((m) => (m.code ? [m.code] : []))}
          onAdd={(body) => addMarker.mutateAsync(body)}
        />
      ) : null}
      <View style={styles.footer}>
        <Text variant="caption" color="inkMuted">
          For understanding only. Discuss results with your doctor.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { paddingTop: spacing.md, alignSelf: 'flex-start' },
  footer: { paddingTop: spacing.lg },
});

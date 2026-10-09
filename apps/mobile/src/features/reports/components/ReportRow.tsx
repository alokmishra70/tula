import type { ReportSummary } from '@tula/shared';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatShortDate } from '@/lib/format';
import { colors, layout, radius, spacing } from '@/theme';
import { ChevronRight, Icon, Skeleton, Text } from '@/ui';
import { REPORT_ERROR_COPY } from '../copy';

export function ReportRow({ report, onPress }: { report: ReportSummary; onPress: () => void }) {
  const title = report.labName ?? report.fileName;
  const date = report.reportDate ?? report.createdAt.slice(0, 10);

  if (report.status === 'processing') {
    return (
      <View style={styles.row} accessibilityLabel={`Reading ${title}`} accessible>
        <View style={styles.text}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="caption" color="inkMuted">
            Reading your report…
          </Text>
          <Skeleton height={spacing.xs} width="60%" />
        </View>
      </View>
    );
  }

  const subtitle =
    report.status === 'failed'
      ? REPORT_ERROR_COPY[report.errorCode ?? 'extraction_failed']
      : report.watchCount > 0
        ? `${formatShortDate(date)} · ${report.watchCount} to watch`
        : `${formatShortDate(date)} · All in range`;

  return (
    <Pressable
      onPress={onPress}
      disabled={report.status === 'failed'}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color={report.status === 'failed' ? 'alert' : 'inkMuted'}>
          {subtitle}
        </Text>
      </View>
      {report.status === 'ready' ? <Icon icon={ChevronRight} color="inkFaint" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouchTarget + spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: layout.hairline,
    borderColor: colors.line,
  },
  text: { flex: 1, gap: spacing.xxs },
});

import { useRouter } from 'expo-router';
import { formatShortDate } from '@/lib/format';
import {
  pickReportFile,
  ReportRow,
  UploadCard,
  useReports,
  useUploadReport,
} from '@/features/reports';
import { EmptyState, Screen, Skeleton, Text, toast } from '@/ui';
import { layout, radius, spacing } from '@/theme';

export default function ReportsScreen() {
  const router = useRouter();
  const reports = useReports();
  const upload = useUploadReport();

  const choose = async () => {
    const picked = await pickReportFile();
    if (picked.kind === 'invalid') return toast.error(picked.message);
    if (picked.kind === 'cancelled') return;
    try {
      const outcome = await upload.mutateAsync(picked.file);
      if (outcome.kind === 'duplicate') {
        toast.info(`Already uploaded on ${formatShortDate(outcome.uploadedAt.slice(0, 10))}.`, {
          label: 'Open',
          onPress: () =>
            router.push({ pathname: '/reports/[id]', params: { id: outcome.reportId } }),
        });
      }
    } catch {
      toast.error("Couldn't upload that. Try again.");
    }
  };

  return (
    <Screen
      title="Reports"
      onRefresh={() => void reports.refetch()}
      refreshing={reports.isRefetching}
    >
      <UploadCard onUpload={() => void choose()} uploading={upload.isPending} />
      {reports.isPending ? (
        [0, 1].map((row) => (
          <Skeleton key={row} height={layout.thumbnail + spacing.lg} radius={radius.md} />
        ))
      ) : reports.data && reports.data.length > 0 ? (
        reports.data.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            onPress={() => router.push({ pathname: '/reports/[id]', params: { id: report.id } })}
          />
        ))
      ) : reports.isError ? (
        <Text variant="body" color="inkMuted">
          Couldn&apos;t load your reports. Pull down to retry.
        </Text>
      ) : (
        <EmptyState
          illustration="labTube"
          message="Upload a blood report and I'll explain it in plain words."
        />
      )}
    </Screen>
  );
}

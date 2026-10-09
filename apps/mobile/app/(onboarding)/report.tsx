import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { StepLayout, useCreatePlan, useOnboarding } from '@/features/onboarding';
import {
  pickReportFile,
  REPORT_ERROR_COPY,
  UploadCard,
  useReport,
  useUploadReport,
} from '@/features/reports';
import { spacing } from '@/theme';
import { Button, Card, Skeleton, Text, toast } from '@/ui';

export default function ReportStep() {
  const router = useRouter();
  const { draft, reportId, setReportId } = useOnboarding();
  const upload = useUploadReport();
  const report = useReport(reportId);
  const createPlan = useCreatePlan();
  const processing = report.data?.status === 'processing';

  const choose = async () => {
    const picked = await pickReportFile();
    if (picked.kind === 'invalid') return toast.error(picked.message);
    if (picked.kind === 'cancelled') return;
    try {
      const outcome = await upload.mutateAsync(picked.file);
      setReportId(outcome.kind === 'uploaded' ? outcome.report.id : outcome.reportId);
    } catch {
      toast.error("Couldn't upload that. Try again or skip for now.");
    }
  };

  const buildPlan = async () => {
    try {
      await createPlan.mutateAsync(draft);
      router.replace('/your-plan');
    } catch {
      toast.error("Couldn't build your plan. Check your connection.");
    }
  };

  return (
    <StepLayout
      step="report"
      question="Have a recent blood report?"
      hint="I'll use it to personalise your plan. Optional."
      footer={
        <View style={styles.footer}>
          <Button
            label="Build my plan"
            size="l"
            fullWidth
            loading={createPlan.isPending}
            disabled={processing}
            onPress={() => void buildPlan()}
          />
          {!reportId ? (
            <Button label="Skip for now" variant="ghost" onPress={() => void buildPlan()} />
          ) : null}
        </View>
      }
    >
      {!reportId ? (
        <UploadCard onUpload={() => void choose()} uploading={upload.isPending} />
      ) : null}
      {reportId && report.data ? (
        <Card>
          <Text variant="heading">{report.data.labName ?? report.data.fileName}</Text>
          {processing ? (
            <>
              <Text variant="body" color="inkMuted">
                Reading your report…
              </Text>
              <Skeleton height={spacing.xs} width="60%" />
            </>
          ) : report.data.status === 'failed' ? (
            <Text variant="body" color="alert">
              {REPORT_ERROR_COPY[report.data.errorCode ?? 'extraction_failed']} You can skip it for
              now.
            </Text>
          ) : (
            <Text variant="body">
              Found {report.data.markers.length} values
              {report.data.watchCount > 0
                ? `, ${report.data.watchCount} to watch.`
                : '. All in range.'}
            </Text>
          )}
        </Card>
      ) : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.xs },
});

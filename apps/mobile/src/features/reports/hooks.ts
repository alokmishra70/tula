import type { AddBiomarkerRequest, ReportSummary, UpdateBiomarkerRequest } from '@tula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { track } from '@/lib/analytics';
import { ApiError } from '@/lib/api-client';
import { sha256Hex } from '@/lib/hash';
import { queryKeys } from '@/lib/query-keys';
import { uploadFile } from '@/lib/upload';
import { reportsApi } from './api';
import type { PickedReport } from './report-file';

const POLL_MS = 2000;

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: reportsApi.list,
    refetchInterval: (query) =>
      query.state.data?.some((r) => r.status === 'processing') ? POLL_MS : false,
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: queryKeys.report(id ?? 'none'),
    queryFn: () => reportsApi.detail(id!),
    enabled: id !== null,
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? POLL_MS : false),
  });
}

export type UploadOutcome =
  | { kind: 'uploaded'; report: ReportSummary }
  | { kind: 'duplicate'; reportId: string; uploadedAt: string };

export function useUploadReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file: PickedReport): Promise<UploadOutcome> => {
      const { key, bytes } = await uploadFile('report', { uri: file.uri, mimeType: file.mimeType });
      try {
        const report = await reportsApi.register({
          fileKey: key,
          fileName: file.name,
          fileHash: await sha256Hex(bytes),
        });
        void track({
          name: 'report_uploaded',
          props: { fileType: file.mimeType === 'application/pdf' ? 'pdf' : 'image' },
        });
        return { kind: 'uploaded', report };
      } catch (error) {
        if (error instanceof ApiError && error.code === 'duplicate_report') {
          const details = error.details as { reportId: string; uploadedAt: string };
          return { kind: 'duplicate', ...details };
        }
        throw error;
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.reports }),
  });
}

/** Marker changes can change targets, so the plan and Today are refreshed too. */
function useMarkerMutation<TArgs>(reportId: string, mutate: (args: TArgs) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mutate,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.report(reportId) }),
        client.invalidateQueries({ queryKey: queryKeys.reports }),
        client.invalidateQueries({ queryKey: queryKeys.plan }),
        client.invalidateQueries({ queryKey: queryKeys.todayAll }),
      ]),
  });
}

export const useUpdateMarker = (reportId: string) =>
  useMarkerMutation(reportId, ({ id, body }: { id: string; body: UpdateBiomarkerRequest }) =>
    reportsApi.updateMarker(id, body),
  );

export const useAddMarker = (reportId: string) =>
  useMarkerMutation(reportId, (body: AddBiomarkerRequest) => reportsApi.addMarker(reportId, body));

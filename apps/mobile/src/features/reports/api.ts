import {
  BiomarkerSchema,
  ReportDetailSchema,
  ReportSummarySchema,
  type AddBiomarkerRequest,
  type Biomarker,
  type RegisterReportRequest,
  type ReportDetail,
  type ReportSummary,
  type UpdateBiomarkerRequest,
} from '@tula/shared';
import { z } from 'zod';
import { api } from '@/lib/api';

export const reportsApi = {
  list: (): Promise<ReportSummary[]> =>
    api.get('/reports', { schema: z.array(ReportSummarySchema) }),
  detail: (id: string): Promise<ReportDetail> =>
    api.get(`/reports/${id}`, { schema: ReportDetailSchema }),
  register: (body: RegisterReportRequest): Promise<ReportSummary> =>
    api.post('/reports', body, { schema: ReportSummarySchema }),
  updateMarker: (id: string, body: UpdateBiomarkerRequest): Promise<Biomarker> =>
    api.patch(`/biomarkers/${id}`, body, { schema: BiomarkerSchema }),
  addMarker: (reportId: string, body: AddBiomarkerRequest): Promise<Biomarker> =>
    api.post(`/reports/${reportId}/biomarkers`, body, { schema: BiomarkerSchema }),
};

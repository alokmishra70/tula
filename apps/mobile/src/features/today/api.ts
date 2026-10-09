import { TodayResponseSchema, type TodayResponse } from '@tula/shared';
import { api } from '@/lib/api';

export const todayApi = {
  get: (date: string): Promise<TodayResponse> =>
    api.get('/today', { query: { date }, schema: TodayResponseSchema }),
  act: (id: string): Promise<void> => api.post(`/nudges/${id}/act`),
  dismiss: (id: string): Promise<void> => api.post(`/nudges/${id}/dismiss`),
};

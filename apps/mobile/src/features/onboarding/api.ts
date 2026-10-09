import {
  PlanSchema,
  ProfileSchema,
  type Plan,
  type PlanRequest,
  type Profile,
  type UpsertProfileRequest,
} from '@tula/shared';
import { api } from '@/lib/api';

export const onboardingApi = {
  upsertProfile: (body: UpsertProfileRequest): Promise<Profile> =>
    api.post('/profile', body, { schema: ProfileSchema }),
  getProfile: (): Promise<Profile> => api.get('/profile', { schema: ProfileSchema }),
  createPlan: (body: PlanRequest): Promise<Plan> =>
    api.post('/goals/plan', body, { schema: PlanSchema }),
  getPlan: (): Promise<Plan> => api.get('/goals/plan', { schema: PlanSchema }),
};

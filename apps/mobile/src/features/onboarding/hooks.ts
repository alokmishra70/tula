import type { Plan, PlanRequest, UpsertProfileRequest } from '@tula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceTimeZone } from '@/lib/dates';
import { queryKeys } from '@/lib/query-keys';
import { onboardingApi } from './api';
import { needsTargetWeight, type OnboardingDraft } from './onboarding-store';

export function toProfileRequest(draft: OnboardingDraft): UpsertProfileRequest {
  if (!draft.activityLevel) throw new Error('Activity level is required');
  return {
    name: draft.name.trim(),
    sex: draft.sex,
    age: draft.age,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    activityLevel: draft.activityLevel,
    timezone: deviceTimeZone(),
  };
}

export function toPlanRequest(draft: OnboardingDraft): PlanRequest {
  if (!draft.goalType) throw new Error('Goal is required');
  return {
    goalType: draft.goalType,
    targetWeightKg: needsTargetWeight(draft.goalType)
      ? (draft.targetWeightKg ?? undefined)
      : undefined,
  };
}

export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: OnboardingDraft) => onboardingApi.upsertProfile(toProfileRequest(draft)),
    onSuccess: (profile) => client.setQueryData(queryKeys.profile, profile),
  });
}

export function useCreatePlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: OnboardingDraft) => onboardingApi.createPlan(toPlanRequest(draft)),
    onSuccess: (plan) => {
      client.setQueryData<Plan>(queryKeys.plan, plan);
      void client.invalidateQueries({ queryKey: queryKeys.todayAll });
    },
  });
}

export function usePlan() {
  return useQuery({ queryKey: queryKeys.plan, queryFn: onboardingApi.getPlan });
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: onboardingApi.getProfile });
}

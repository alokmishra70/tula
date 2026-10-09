import type { ActivityLevel, GoalType, Sex } from '@tula/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { keyValueStore } from '@/lib/storage';

export const ONBOARDING_STEPS = ['welcome', 'goal', 'basics', 'activity', 'report'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingDraft {
  goalType: GoalType | null;
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number | null;
  activityLevel: ActivityLevel | null;
}

/** 'edit' re-runs the questions from the plan screen and skips the report step. */
export type OnboardingMode = 'setup' | 'edit';

interface OnboardingState {
  step: OnboardingStep;
  mode: OnboardingMode;
  draft: OnboardingDraft;
  startedAt: number | null;
  reportId: string | null;
  start: (mode: OnboardingMode, draft?: Partial<OnboardingDraft>) => void;
  goTo: (step: OnboardingStep) => void;
  update: (changes: Partial<OnboardingDraft>) => void;
  setReportId: (reportId: string | null) => void;
  reset: () => void;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  goalType: null,
  name: '',
  sex: 'female',
  age: 30,
  heightCm: 165,
  weightKg: 70,
  targetWeightKg: null,
  activityLevel: null,
};

const initial = {
  step: 'welcome' as const,
  mode: 'setup' as const,
  draft: EMPTY_DRAFT,
  startedAt: null,
  reportId: null,
};

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      start: (mode, draft) =>
        set({
          mode,
          step: 'goal',
          startedAt: Date.now(),
          draft: { ...EMPTY_DRAFT, ...draft },
          reportId: null,
        }),
      goTo: (step) => set({ step }),
      update: (changes) => set((state) => ({ draft: { ...state.draft, ...changes } })),
      setReportId: (reportId) => set({ reportId }),
      reset: () => set(initial),
    }),
    {
      name: 'tula.onboarding',
      storage: createJSONStorage(() => keyValueStore),
      partialize: ({ step, mode, draft, startedAt, reportId }) => ({
        step,
        mode,
        draft,
        startedAt,
        reportId,
      }),
    },
  ),
);

/** Goals with a weight direction ask for a target weight. */
export const needsTargetWeight = (goal: GoalType | null) =>
  goal === 'lose_weight' || goal === 'build_muscle';

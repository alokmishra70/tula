import {
  guessMealType,
  type Meal,
  type MealItemDraft,
  type MealSource,
  type MealType,
} from '@tula/shared';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

export type LogStage =
  'choose' | 'camera' | 'voice' | 'type' | 'analysing' | 'confirm' | 'not_food';

export interface CapturedInput {
  source: Extract<MealSource, 'photo' | 'voice' | 'text'>;
  localUri: string | null;
  mimeType: string | null;
  text: string | null;
}

export interface LogFlowState {
  open: boolean;
  stage: LogStage;
  mealType: MealType;
  eatenAt: Date;
  /** Reused across retries so a double tap or a resend logs once. */
  idempotencyKey: string;
  startedAt: number;
  input: CapturedInput | null;
  mediaKey: string | null;
  items: MealItemDraft[];
  editingMeal: Meal | null;
  notFoodReason: 'not_food' | 'nothing_recognised' | null;

  openLog: (mealType?: MealType) => void;
  openEdit: (meal: Meal) => void;
  close: () => void;
  setStage: (stage: LogStage) => void;
  setMealType: (mealType: MealType) => void;
  setEatenAt: (eatenAt: Date) => void;
  capture: (input: CapturedInput) => void;
  showItems: (items: MealItemDraft[], mediaKey: string | null) => void;
  setItems: (items: MealItemDraft[]) => void;
  showNotFood: (reason: 'not_food' | 'nothing_recognised') => void;
}

const fresh = (mealType?: MealType) => {
  const now = new Date();
  return {
    stage: 'choose' as LogStage,
    mealType: mealType ?? guessMealType(now.getHours()),
    eatenAt: now,
    idempotencyKey: randomUUID(),
    startedAt: Date.now(),
    input: null,
    mediaKey: null,
    items: [],
    editingMeal: null,
    notFoodReason: null,
  };
};

export const useLogFlow = create<LogFlowState>((set) => ({
  open: false,
  ...fresh(),
  openLog: (mealType) => set({ open: true, ...fresh(mealType) }),
  openEdit: (meal) =>
    set({
      open: true,
      ...fresh(meal.mealType),
      stage: 'confirm',
      eatenAt: new Date(meal.eatenAt),
      editingMeal: meal,
      mediaKey: null,
      items: meal.items.map(({ id: _id, edited: _edited, ...item }) => ({
        ...item,
        clarification: null,
      })),
    }),
  close: () => set({ open: false }),
  setStage: (stage) => set({ stage }),
  setMealType: (mealType) => set({ mealType }),
  setEatenAt: (eatenAt) => set({ eatenAt }),
  capture: (input) => set({ input, stage: 'analysing' }),
  showItems: (items, mediaKey) => set({ items, mediaKey, stage: 'confirm' }),
  setItems: (items) => set({ items }),
  showNotFood: (reason) => set({ stage: 'not_food', notFoodReason: reason }),
}));

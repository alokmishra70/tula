import type {
  CreateMealRequest,
  Meal,
  MealType,
  MediaKind,
  TodayResponse,
  UpdateMealRequest,
} from '@tula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { localIsoDate } from '@/lib/dates';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/ui';
import { mealsApi } from './api';
import { sumItems } from './meal-math';
import { enqueueMeal } from './outbox';
import { todayCache } from './today-cache';

const UNDO_WINDOW_MS = 5000;

export function useQuickMeals(mealType: MealType, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.quickMeals(mealType),
    queryFn: () => mealsApi.quick(mealType),
    enabled,
  });
}

export interface LogMealInput {
  request: CreateMealRequest;
  idempotencyKey: string;
  /** Kept on device until uploaded, so offline photos still sync later. */
  localMedia: { uri: string; mimeType: string; kind: MediaKind } | null;
}

export type LogMealResult =
  { kind: 'saved'; meal: Meal; insight: string | null } | { kind: 'queued' };

function placeholderFor({ request, idempotencyKey, localMedia }: LogMealInput): Meal {
  return {
    id: `local:${idempotencyKey}`,
    mealType: request.mealType,
    eatenAt: request.eatenAt,
    source: request.source,
    status: 'pending',
    rawText: request.rawText,
    mediaUrl: localMedia?.uri ?? null,
    items: request.items.map((item, index) => ({
      ...item,
      id: `local:${idempotencyKey}:${index}`,
    })),
    totals: sumItems(request.items),
  };
}

/** Optimistic: the ring moves at once; offline saves go to the outbox and sync later. */
export function useLogMeal() {
  const client = useQueryClient();
  return useMutation({
    onMutate: async (input: LogMealInput) => {
      const key = queryKeys.today(localIsoDate(new Date(input.request.eatenAt)));
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<TodayResponse>(key);
      const placeholder = placeholderFor(input);
      if (previous) client.setQueryData(key, todayCache.addMeal(previous, placeholder));
      return { key, previous, placeholder };
    },
    mutationFn: async (input: LogMealInput): Promise<LogMealResult> => {
      try {
        if (input.localMedia && !input.request.mediaKey)
          throw new ApiError('offline', 'Media not uploaded', 0);
        const saved = await mealsApi.create(input.request, input.idempotencyKey);
        return { kind: 'saved', meal: saved.meal, insight: saved.insight };
      } catch (error) {
        if (!(error instanceof ApiError) || !error.isOffline) throw error;
        await enqueueMeal({
          idempotencyKey: input.idempotencyKey,
          request: input.request,
          localMedia: input.localMedia,
        });
        return { kind: 'queued' };
      }
    },
    onSuccess: (result, _input, context) => {
      if (result.kind === 'queued' || !context) return;
      void client.invalidateQueries({ queryKey: context.key });
      void client.invalidateQueries({ queryKey: ['quick-meals'] });
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(context.key, context.previous);
      toast.error("Couldn't save that meal. Try again.");
    },
  });
}

export function useUpdateMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMealRequest }) =>
      mealsApi.update(id, body),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.todayAll }),
    onError: () => toast.error("Couldn't save changes. Try again."),
  });
}

const pendingDeletes = new Map<string, ReturnType<typeof setTimeout>>();

/** Removes at once, deletes on the server after five seconds unless the user taps Undo. */
export function useDeleteMealWithUndo() {
  const client = useQueryClient();
  return (meal: Meal) => {
    const key = queryKeys.today(localIsoDate(new Date(meal.eatenAt)));
    const previous = client.getQueryData<TodayResponse>(key);
    if (previous) client.setQueryData(key, todayCache.removeMeal(previous, meal.id));

    const restore = () => {
      if (previous) client.setQueryData(key, previous);
    };
    const timer = setTimeout(() => {
      pendingDeletes.delete(meal.id);
      mealsApi
        .remove(meal.id)
        .then(() => client.invalidateQueries({ queryKey: key }))
        .catch(() => {
          restore();
          toast.error("Couldn't delete that meal.");
        });
    }, UNDO_WINDOW_MS);
    pendingDeletes.set(meal.id, timer);

    toast.info('Meal removed.', {
      label: 'Undo',
      onPress: () => {
        clearTimeout(pendingDeletes.get(meal.id));
        pendingDeletes.delete(meal.id);
        restore();
      },
    });
  };
}

/** Undo right after logging: the meal is already saved, so delete it now. */
export function useUndoLog() {
  const client = useQueryClient();
  return (meal: Meal) =>
    mealsApi
      .remove(meal.id)
      .then(() => client.invalidateQueries({ queryKey: queryKeys.todayAll }))
      .catch(() => toast.error("Couldn't undo. Delete it from Today."));
}

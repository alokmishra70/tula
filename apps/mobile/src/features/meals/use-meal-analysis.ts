import { onlineManager, useQueryClient } from '@tanstack/react-query';
import type { MealItemDraft } from '@tula/shared';
import { useRef, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { compressPhoto } from '@/lib/image';
import { queryKeys } from '@/lib/query-keys';
import { uploadFile } from '@/lib/upload';
import { toast } from '@/ui';
import { mealsApi } from './api';
import { useLogMeal } from './hooks';
import { useLogFlow, type CapturedInput } from './log-flow-store';

const PARSE_TIMEOUT_MS = 15_000;
const SAVED_FOR_LATER = "Saved as text. I'll add the numbers in a minute.";

/** Runs upload and parse for the captured input; every failure ends in a saved, pending meal. */
export function useMealAnalysis() {
  const client = useQueryClient();
  const logMeal = useLogMeal();
  const flow = useLogFlow();
  const [timedOut, setTimedOut] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const prepared = useRef<{ uri: string; mimeType: string } | null>(null);
  const uploadedKey = useRef<string | null>(null);

  const saveForLater = (input: CapturedInput) => {
    abort.current?.abort();
    const { mealType, eatenAt, idempotencyKey } = useLogFlow.getState();
    const media = prepared.current;
    logMeal.mutate({
      idempotencyKey,
      request: {
        mealType,
        eatenAt: eatenAt.toISOString(),
        source: input.source,
        mediaKey: uploadedKey.current,
        rawText: input.text,
        items: [],
      },
      localMedia:
        media && !uploadedKey.current
          ? { ...media, kind: input.source === 'voice' ? 'meal_audio' : 'meal_photo' }
          : null,
    });
    useLogFlow.getState().close();
    toast.info(SAVED_FOR_LATER);
  };

  const run = async (input: CapturedInput) => {
    setTimedOut(false);
    uploadedKey.current = null;
    prepared.current = null;
    if (input.source === 'photo' && input.localUri) {
      prepared.current = await compressPhoto(input.localUri);
      setPreviewUri(prepared.current.uri);
    } else if (input.source === 'voice' && input.localUri) {
      prepared.current = { uri: input.localUri, mimeType: input.mimeType ?? 'audio/mp4' };
      setPreviewUri(null);
    }
    if (!onlineManager.isOnline()) return saveForLater(input);

    const controller = new AbortController();
    abort.current = controller;
    const timer = setTimeout(() => setTimedOut(true), PARSE_TIMEOUT_MS);
    try {
      if (prepared.current) {
        const kind = input.source === 'voice' ? 'meal_audio' : 'meal_photo';
        uploadedKey.current = (await uploadFile(kind, prepared.current)).key;
      }
      const { mealType, eatenAt } = useLogFlow.getState();
      const result = await mealsApi.parse(
        {
          source: input.source,
          mealType,
          eatenAt: eatenAt.toISOString(),
          mediaKey: uploadedKey.current ?? undefined,
          text: input.text ?? undefined,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      switch (result.outcome) {
        case 'parsed':
          useLogFlow.getState().showItems(result.items, uploadedKey.current);
          break;
        case 'pending':
          void client.invalidateQueries({ queryKey: queryKeys.todayAll });
          useLogFlow.getState().close();
          toast.info(SAVED_FOR_LATER);
          break;
        default:
          useLogFlow.getState().showNotFood(result.outcome);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.isOffline) return saveForLater(input);
      toast.error(
        error instanceof ApiError && error.code === 'rate_limited'
          ? 'Too many tries. Type it instead?'
          : "Couldn't read that. Try again.",
      );
      useLogFlow.getState().setStage('choose');
    } finally {
      clearTimeout(timer);
    }
  };

  const start = (input: CapturedInput) => {
    abort.current?.abort();
    useLogFlow.getState().capture(input);
    void run(input);
  };

  /** Parses one extra typed item for the confirm list. */
  const parseExtraItem = async (text: string): Promise<MealItemDraft[]> => {
    const { mealType, eatenAt } = useLogFlow.getState();
    const result = await mealsApi.parse({
      source: 'text',
      mealType,
      eatenAt: eatenAt.toISOString(),
      text,
    });
    return result.outcome === 'parsed' ? result.items : [];
  };

  return {
    start,
    cancel: () => abort.current?.abort(),
    timedOut,
    previewUri: previewUri ?? flow.input?.localUri ?? null,
    saveForLater: () => flow.input && saveForLater(flow.input),
    parseExtraItem,
  };
}

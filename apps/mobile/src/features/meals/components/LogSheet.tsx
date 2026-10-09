import type { QuickMeal } from '@tula/shared';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { track } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { formatGrams, formatKcal } from '@/lib/format';
import { spacing } from '@/theme';
import { Button, Sheet, Text, toast } from '@/ui';
import { CameraCapture } from '../capture/CameraCapture';
import { pickPhoto } from '../capture/photo-picker';
import { VoiceCapture } from '../capture/VoiceCapture';
import { useDeleteMealWithUndo, useLogMeal, useUndoLog, useUpdateMeal } from '../hooks';
import { useLogFlow, type LogStage } from '../log-flow-store';
import { sumItems, toItemInput } from '../meal-math';
import { useMealAnalysis } from '../use-meal-analysis';
import { AnalysingStage } from './AnalysingStage';
import { ChooseStage } from './ChooseStage';
import { ConfirmStage } from './ConfirmStage';
import { NotFoodStage } from './NotFoodStage';
import { TypeStage } from './TypeStage';

const TITLES: Record<LogStage, string> = {
  choose: 'Log a meal',
  camera: 'Log a meal',
  voice: 'Say what you ate',
  type: 'What did you eat?',
  analysing: 'Working it out',
  confirm: 'Check and log',
  not_food: 'Hmm',
};

const secondsSince = (startedAt: number) => Math.round((Date.now() - startedAt) / 1000);

/** The whole logging flow in one sheet: choose input, capture, analyse, confirm. */
export function LogSheet() {
  const flow = useLogFlow();
  const analysis = useMealAnalysis();
  const logMeal = useLogMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMealWithUndo();
  const undoLog = useUndoLog();
  const [edited, setEdited] = useState<Set<number>>(new Set());
  const [addingItem, setAddingItem] = useState(false);

  const editing = flow.editingMeal;
  const totals = sumItems(flow.items);

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      const uri = await pickPhoto();
      if (uri) analysis.start({ source: 'photo', localUri: uri, mimeType: null, text: null });
      return;
    }
    flow.setStage('camera');
  };

  const afterLog = (
    result: Awaited<ReturnType<typeof logMeal.mutateAsync>>,
    source: string,
    itemCount: number,
  ) => {
    haptics.light();
    flow.close();
    if (result.kind === 'queued') {
      toast.info("Saved offline. It'll sync when you're back.");
      return;
    }
    void track({
      name: 'meal_logged',
      props: { source: source as never, secondsToLog: secondsSince(flow.startedAt), itemCount },
    });
    toast.success(result.insight ?? 'Logged.', {
      label: 'Undo',
      onPress: () => void undoLog(result.meal),
    });
  };

  const logQuick = async (meal: QuickMeal) => {
    const result = await logMeal.mutateAsync({
      idempotencyKey: flow.idempotencyKey,
      localMedia: null,
      request: {
        mealType: meal.mealType,
        eatenAt: new Date().toISOString(),
        source: 'repeat',
        mediaKey: null,
        rawText: null,
        items: meal.items,
      },
    });
    afterLog(result, 'repeat', meal.items.length);
  };

  const submit = async () => {
    const items = flow.items.map((item, index) => toItemInput(item, edited.has(index)));
    if (editing) {
      await updateMeal.mutateAsync({
        id: editing.id,
        body: { mealType: flow.mealType, eatenAt: flow.eatenAt.toISOString(), items },
      });
      haptics.light();
      flow.close();
      toast.success('Changes saved.');
      return;
    }
    const source = flow.input?.source ?? 'text';
    const result = await logMeal.mutateAsync({
      idempotencyKey: flow.idempotencyKey,
      localMedia: null,
      request: {
        mealType: flow.mealType,
        eatenAt: flow.eatenAt.toISOString(),
        source,
        mediaKey: flow.mediaKey,
        rawText: flow.input?.text ?? null,
        items,
      },
    });
    afterLog(result, source, items.length);
  };

  const addItem = async (text: string) => {
    setAddingItem(true);
    try {
      const extra = await analysis.parseExtraItem(text);
      if (extra.length === 0) {
        toast.info("Couldn't recognise that. Try a dish name.");
        return;
      }
      void track({ name: 'item_edited', props: { change: 'added' } });
      flow.setItems([...flow.items, ...extra]);
    } catch {
      toast.error("Couldn't add that right now.");
    } finally {
      setAddingItem(false);
    }
  };

  const saving = logMeal.isPending || updateMeal.isPending;
  const footer =
    flow.stage === 'confirm' ? (
      <View style={styles.footer}>
        <Text variant="body" numeric>
          This meal: {formatKcal(totals.kcal)}, {formatGrams(totals.proteinG)} protein
        </Text>
        <Button
          label={editing ? 'Save changes' : 'Log meal'}
          onPress={() => void submit()}
          loading={saving}
          disabled={flow.items.length === 0}
          size="l"
          fullWidth
        />
        {editing ? (
          <Button
            label="Delete meal"
            variant="ghost"
            onPress={() => {
              flow.close();
              deleteMeal(editing);
            }}
          />
        ) : null}
      </View>
    ) : undefined;

  return (
    <>
      <Sheet
        open={flow.open && flow.stage !== 'camera'}
        onClose={() => {
          analysis.cancel();
          flow.close();
        }}
        title={editing ? 'Edit meal' : TITLES[flow.stage]}
        footer={footer}
      >
        {flow.stage === 'choose' ? (
          <ChooseStage
            mealType={flow.mealType}
            onMealType={flow.setMealType}
            onCamera={() => void openCamera()}
            onVoice={() => flow.setStage('voice')}
            onType={() => flow.setStage('type')}
            onPhotoFile={(uri) =>
              analysis.start({ source: 'photo', localUri: uri, mimeType: null, text: null })
            }
            onQuickMeal={(meal) => void logQuick(meal)}
          />
        ) : null}
        {flow.stage === 'type' ? (
          <TypeStage
            onSubmit={(text) =>
              analysis.start({ source: 'text', localUri: null, mimeType: null, text })
            }
          />
        ) : null}
        {flow.stage === 'voice' ? (
          <VoiceCapture
            onRecorded={(uri, mimeType) =>
              analysis.start({ source: 'voice', localUri: uri, mimeType, text: null })
            }
            onTypeInstead={() => flow.setStage('type')}
          />
        ) : null}
        {flow.stage === 'analysing' ? (
          <AnalysingStage
            previewUri={analysis.previewUri}
            timedOut={analysis.timedOut}
            onSaveForLater={analysis.saveForLater}
          />
        ) : null}
        {flow.stage === 'not_food' ? (
          <NotFoodStage
            reason={flow.notFoodReason ?? 'not_food'}
            onRetry={() => void openCamera()}
            onType={() => flow.setStage('type')}
          />
        ) : null}
        {flow.stage === 'confirm' ? (
          <ConfirmStage
            items={flow.items}
            onItems={(items, editedIndex) => {
              if (editedIndex !== undefined) setEdited((set) => new Set(set).add(editedIndex));
              flow.setItems(items);
            }}
            mealType={flow.mealType}
            onMealType={flow.setMealType}
            eatenAt={flow.eatenAt}
            onEatenAt={flow.setEatenAt}
            previewUri={editing?.mediaUrl ?? analysis.previewUri}
            onAddItem={addItem}
            addingItem={addingItem}
          />
        ) : null}
      </Sheet>
      {flow.open && flow.stage === 'camera' ? (
        <CameraCapture
          onCaptured={(uri) =>
            analysis.start({ source: 'photo', localUri: uri, mimeType: null, text: null })
          }
          onCancel={() => flow.setStage('choose')}
          onTypeInstead={() => flow.setStage('type')}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.sm },
});

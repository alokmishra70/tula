import type { MealItemDraft, MealType } from '@tula/shared';
import { MEAL_TYPES } from '@tula/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { track } from '@/lib/analytics';
import { formatTime } from '@/lib/dates';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Button, Chip, ChipRow } from '@/ui';
import { scaleItem } from '../meal-math';
import { ItemRow } from './ItemRow';
import { WhenControl } from './WhenControl';

const VISIBLE_ITEMS = 8;
const THUMB = layout.thumbnail + spacing.md;

export interface ConfirmStageProps {
  items: MealItemDraft[];
  onItems: (items: MealItemDraft[], editedIndex?: number) => void;
  mealType: MealType;
  onMealType: (mealType: MealType) => void;
  eatenAt: Date;
  onEatenAt: (date: Date) => void;
  previewUri: string | null;
  onAddItem: (text: string) => Promise<void>;
  addingItem: boolean;
}

export function ConfirmStage(props: ConfirmStageProps) {
  const {
    items,
    onItems,
    mealType,
    onMealType,
    eatenAt,
    onEatenAt,
    previewUri,
    onAddItem,
    addingItem,
  } = props;
  const [showAll, setShowAll] = useState(false);
  const [showWhen, setShowWhen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const visible = showAll ? items : items.slice(0, VISIBLE_ITEMS);

  const replace = (
    index: number,
    next: MealItemDraft,
    change: 'quantity' | 'clarified' | 'renamed',
  ) => {
    if (change !== 'renamed') void track({ name: 'item_edited', props: { change } });
    onItems(
      items.map((item, i) => (i === index ? next : item)),
      index,
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.thumb} contentFit="cover" />
        ) : null}
        <View style={styles.headerText}>
          <ChipRow>
            {MEAL_TYPES.map((type) => (
              <Chip
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                selected={type === mealType}
                onPress={() => onMealType(type)}
              />
            ))}
          </ChipRow>
          <Chip label={formatTime(eatenAt)} onPress={() => setShowWhen((open) => !open)} />
        </View>
      </View>
      {showWhen ? <WhenControl value={eatenAt} onChange={onEatenAt} /> : null}

      <View>
        {visible.map((item, index) => (
          <ItemRow
            key={`${index}-${item.dishRefId ?? item.name}`}
            item={item}
            onQuantity={(quantity) => replace(index, scaleItem(item, quantity), 'quantity')}
            onRename={(name) => replace(index, { ...item, name }, 'renamed')}
            onClarify={(answer) =>
              replace(
                index,
                { ...item, name: answer, confidence: 1, clarification: null },
                'clarified',
              )
            }
            onRemove={() => {
              void track({ name: 'item_edited', props: { change: 'removed' } });
              onItems(items.filter((_, i) => i !== index));
            }}
          />
        ))}
        {items.length > VISIBLE_ITEMS && !showAll ? (
          <Button
            label={`Show ${items.length - VISIBLE_ITEMS} more`}
            variant="ghost"
            onPress={() => setShowAll(true)}
          />
        ) : null}
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add item, e.g. 1 katori curd"
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel="Add an item"
          style={styles.input}
          onSubmitEditing={() =>
            newItem.trim() && void onAddItem(newItem.trim()).then(() => setNewItem(''))
          }
        />
        <Button
          label="Add"
          variant="secondary"
          loading={addingItem}
          disabled={!newItem.trim()}
          onPress={() => void onAddItem(newItem.trim()).then(() => setNewItem(''))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  header: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm },
  headerText: { flex: 1, gap: spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    color: colors.ink,
  },
});

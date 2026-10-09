import type { MealItemDraft } from '@tula/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { formatKcal } from '@/lib/format';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Chip, ChipRow, Icon, PortionStepper, Text, X } from '@/ui';

export interface ItemRowProps {
  item: MealItemDraft;
  onQuantity: (quantity: number) => void;
  onRename: (name: string) => void;
  onClarify: (answer: string) => void;
  onRemove: () => void;
}

export function ItemRow({ item, onQuantity, onRename, onClarify, onRemove }: ItemRowProps) {
  const [asking, setAsking] = useState(false);
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <TextInput
          value={item.name}
          onChangeText={onRename}
          accessibilityLabel="Food name"
          style={styles.name}
          maxLength={80}
        />
        <Text variant="bodyStrong" numeric>
          {formatKcal(item.kcal)}
        </Text>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
          hitSlop={spacing.sm}
        >
          <Icon icon={X} color="inkMuted" />
        </Pressable>
      </View>
      <View style={styles.bottom}>
        <PortionStepper
          value={item.quantity}
          unit={item.unit}
          onChange={onQuantity}
          itemName={item.name}
        />
        {item.clarification ? (
          <Chip label="Not sure" status="warn" onPress={() => setAsking((open) => !open)} />
        ) : null}
      </View>
      {asking && item.clarification ? (
        <View style={styles.question}>
          <Text variant="caption" color="inkMuted">
            {item.clarification.question}
          </Text>
          <ChipRow>
            {item.clarification.options.map((option) => (
              <Chip
                key={option}
                label={option}
                onPress={() => {
                  setAsking(false);
                  onClarify(option);
                }}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.ink,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  question: { gap: spacing.xs },
});

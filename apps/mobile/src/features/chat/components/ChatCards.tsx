import type { ChatCard } from '@tula/shared';
import { StyleSheet, View } from 'react-native';
import { capitalise, describeMealItems, formatKcal, formatNumber } from '@/lib/format';
import { MARKER_LABELS, STATUS_CHIP, STATUS_WORD } from '@/lib/markers';
import { layout, spacing } from '@/theme';
import { Card, Chip, ProgressRing, RangeBar, Text } from '@/ui';

/** Rich replies: a logged meal, a lab marker, or a mini ring for the day. */
export function ChatCardView({ card }: { card: ChatCard }) {
  switch (card.type) {
    case 'meal':
      return (
        <Card>
          <Text variant="caption" color="inkMuted">
            Logged · {capitalise(card.meal.mealType)}
          </Text>
          <Text variant="bodyStrong">{describeMealItems(card.meal.items)}</Text>
          <Text variant="body" numeric>
            {formatKcal(card.meal.totals.kcal)} · {formatNumber(card.meal.totals.proteinG)} g
            protein
          </Text>
        </Card>
      );
    case 'marker': {
      const { marker } = card;
      const value = marker.normalizedValue ?? marker.value;
      const unit = marker.canonicalUnit ?? marker.unit;
      return (
        <Card>
          <View style={styles.row}>
            <Text variant="bodyStrong" style={styles.flex}>
              {marker.code ? MARKER_LABELS[marker.code] : marker.rawName} {formatNumber(value, 1)}{' '}
              {unit}
            </Text>
            <Chip label={STATUS_WORD[marker.status]} status={STATUS_CHIP[marker.status]} />
          </View>
          <RangeBar
            value={value}
            low={marker.refLow}
            high={marker.refHigh}
            status={marker.status}
            unit={unit}
          />
        </Card>
      );
    }
    case 'day': {
      const left = card.targetKcal - card.consumed.kcal;
      return (
        <Card>
          <View style={styles.row}>
            <ProgressRing
              consumed={card.consumed.kcal}
              target={card.targetKcal}
              size={layout.ring.miniSize}
              strokeWidth={layout.ring.miniStroke}
            />
            <View style={styles.flex}>
              <Text variant="bodyStrong" numeric>
                {left >= 0 ? `${formatNumber(left)} kcal left` : `${formatNumber(-left)} kcal over`}
              </Text>
              <Text variant="caption" color="inkMuted" numeric>
                {formatNumber(card.consumed.proteinG)} g protein ·{' '}
                {formatNumber(card.consumed.fiberG)} g fibre
              </Text>
            </View>
          </View>
        </Card>
      );
    }
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});

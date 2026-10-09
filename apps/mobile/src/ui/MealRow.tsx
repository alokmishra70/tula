import { Image } from 'expo-image';
import { Clock, Pencil, Plus, Trash } from './icons';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { formatKcal } from '@/lib/format';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { colors, layout, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export interface MealRowProps {
  title: string;
  summary: string;
  kcal: number;
  thumbnailUri?: string | null;
  /** Queued offline or waiting for numbers. */
  pending?: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MealRow({
  title,
  summary,
  kcal,
  thumbnailUri,
  pending,
  onPress,
  onEdit,
  onDelete,
}: MealRowProps) {
  const breakpoint = useBreakpoint();
  const row = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${summary}. ${formatKcal(kcal)}${pending ? '. Waiting to sync' : ''}`}
      style={styles.row}
    >
      {thumbnailUri ? (
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder]} />
      )}
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="inkMuted" numberOfLines={1}>
          {summary}
        </Text>
      </View>
      {pending ? <Icon icon={Clock} color="inkMuted" size={layout.iconSize - spacing.xxs} /> : null}
      <Text variant="bodyStrong" numeric>
        {formatKcal(kcal)}
      </Text>
    </Pressable>
  );

  if (breakpoint === 'desktop' || (!onEdit && !onDelete)) return row;

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={layout.minTouchTarget}
      renderRightActions={() => (
        <View style={styles.actions}>
          {onEdit ? <SwipeAction icon={Pencil} label="Edit" onPress={onEdit} /> : null}
          {onDelete ? (
            <SwipeAction icon={Trash} label="Delete" onPress={onDelete} destructive />
          ) : null}
        </View>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
}

function SwipeAction({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: typeof Pencil;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.action, destructive && styles.destructive]}
    >
      <Icon icon={icon} color={destructive ? 'onAccent' : 'ink'} />
    </Pressable>
  );
}

/** Dashed slot for a meal that hasn't been logged yet. */
export function EmptyMealRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.row, styles.empty]}
    >
      <Icon icon={Plus} color="inkMuted" />
      <Text variant="body" color="inkMuted">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.thumbnail + spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  thumbnail: { width: layout.thumbnail, height: layout.thumbnail, borderRadius: radius.sm },
  placeholder: { backgroundColor: colors.surfaceSunken },
  text: { flex: 1, gap: spacing.xxs / 2 },
  empty: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: layout.hairline,
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
  },
  actions: { flexDirection: 'row' },
  action: {
    width: layout.minTouchTarget + spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  destructive: { backgroundColor: colors.alert },
});

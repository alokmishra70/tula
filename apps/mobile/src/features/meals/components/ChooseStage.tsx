import { MEAL_TYPES, type MealType, type QuickMeal } from '@tula/shared';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radius, spacing } from '@/theme';
import {
  Camera,
  Chip,
  ChipRow,
  Icon,
  Keyboard,
  Mic,
  SegmentedControl,
  Text,
  type LucideIcon,
} from '@/ui';
import { DropZone } from '../capture/DropZone';
import { useQuickMeals } from '../hooks';

const MEAL_OPTIONS = MEAL_TYPES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export interface ChooseStageProps {
  mealType: MealType;
  onMealType: (mealType: MealType) => void;
  onCamera: () => void;
  onVoice: () => void;
  onType: () => void;
  onPhotoFile: (uri: string) => void;
  onQuickMeal: (meal: QuickMeal) => void;
}

export function ChooseStage({
  mealType,
  onMealType,
  onCamera,
  onVoice,
  onType,
  onPhotoFile,
  onQuickMeal,
}: ChooseStageProps) {
  const quick = useQuickMeals(mealType, true);
  return (
    <View style={styles.root}>
      <SegmentedControl
        options={MEAL_OPTIONS}
        value={mealType}
        onChange={onMealType}
        accessibilityLabel="Meal type"
      />
      <View style={styles.tiles}>
        <Tile icon={Camera} label={Platform.OS === 'web' ? 'Photo' : 'Camera'} onPress={onCamera} />
        <Tile icon={Mic} label="Voice" onPress={onVoice} />
        <Tile icon={Keyboard} label="Type" onPress={onType} />
      </View>
      <DropZone onFile={onPhotoFile} />
      {quick.data && quick.data.length > 0 ? (
        <View style={styles.quick}>
          <Text variant="caption" color="inkMuted">
            Quick add
          </Text>
          <ChipRow>
            {quick.data.map((meal) => (
              <Chip
                key={`${meal.kind}-${meal.label}`}
                label={meal.label}
                onPress={() => onQuickMeal(meal)}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}
    </View>
  );
}

function Tile({ icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.tile}
    >
      <Icon icon={icon} color="accent" />
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    height: layout.tile,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  quick: { gap: spacing.xs },
});

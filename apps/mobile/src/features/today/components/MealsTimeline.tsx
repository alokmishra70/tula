import { MEAL_TYPES, type Meal, type MealType } from '@tula/shared';
import { StyleSheet, View } from 'react-native';
import { capitalise, describeMealItems } from '@/lib/format';
import { spacing } from '@/theme';
import { EmptyMealRow, MealRow, Text } from '@/ui';

const ADD_LABEL: Record<MealType, string> = {
  breakfast: 'Add breakfast',
  lunch: 'Add lunch',
  snack: 'Add a snack',
  dinner: 'Add dinner',
};

export interface MealsTimelineProps {
  meals: Meal[];
  onAdd: (mealType: MealType) => void;
  onOpen: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
}

const isPending = (meal: Meal) => meal.status === 'pending' || meal.id.startsWith('local:');

export function MealsTimeline({ meals, onAdd, onOpen, onDelete }: MealsTimelineProps) {
  return (
    <View style={styles.root}>
      <Text variant="heading" accessibilityRole="header">
        Meals
      </Text>
      {MEAL_TYPES.map((mealType) => {
        const logged = meals.filter((meal) => meal.mealType === mealType);
        if (logged.length === 0)
          return (
            <EmptyMealRow
              key={mealType}
              label={ADD_LABEL[mealType]}
              onPress={() => onAdd(mealType)}
            />
          );
        return logged.map((meal) => (
          <MealRow
            key={meal.id}
            title={capitalise(meal.mealType)}
            summary={
              meal.items.length > 0
                ? describeMealItems(meal.items)
                : (meal.rawText ?? 'Saved. Numbers coming soon.')
            }
            kcal={meal.totals.kcal}
            thumbnailUri={meal.mediaUrl}
            pending={isPending(meal)}
            onPress={() => !isPending(meal) && onOpen(meal)}
            onEdit={isPending(meal) ? undefined : () => onOpen(meal)}
            onDelete={isPending(meal) ? undefined : () => onDelete(meal)}
          />
        ));
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
});

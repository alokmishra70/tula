import { Redirect } from 'expo-router';
import { Camera } from '@/ui/icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { formatKcal } from '@/lib/format';
import { spacing } from '@/theme';
import {
  Button,
  Card,
  ChatBubble,
  Chip,
  ChipRow,
  EmptyMealRow,
  EmptyState,
  MacroBar,
  MealRow,
  NudgeCard,
  PortionStepper,
  ProgressBar,
  ProgressRing,
  RangeBar,
  Screen,
  SegmentedControl,
  Sheet,
  Skeleton,
  Sparkline,
  Text,
  toast,
  TypingIndicator,
  useCountUp,
} from '@/ui';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
  { value: 'dinner', label: 'Dinner' },
] as const;

/** Development-only gallery of the component kit. */
export default function KitScreen() {
  const [consumed, setConsumed] = useState(1240);
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]['value']>('lunch');
  const [sheetOpen, setSheetOpen] = useState(false);
  const hero = useCountUp(1850);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen title="Component kit">
      <Text variant="display" numeric>
        {formatKcal(hero)}
      </Text>
      <Text variant="caption" color="inkMuted">
        Thursday, 8 Oct
      </Text>

      <Card>
        <View style={styles.center}>
          <ProgressRing consumed={consumed} target={1850} wash>
            <Text variant="display" numeric>
              {Math.abs(1850 - consumed)}
            </Text>
            <Text variant="caption" color="inkMuted">
              {consumed > 1850 ? 'kcal over' : 'kcal left'}
            </Text>
          </ProgressRing>
        </View>
        <MacroBar macro="protein" consumed={52} target={98} />
        <MacroBar macro="carbs" consumed={150} target={186} />
        <MacroBar macro="fat" consumed={40} target={54} />
        <MacroBar macro="fiber" consumed={14} target={30} />
        <ChipRow>
          <Button
            label="+300 kcal"
            variant="secondary"
            onPress={() => setConsumed((c) => c + 300)}
          />
          <Button label="Reset" variant="ghost" onPress={() => setConsumed(1240)} />
        </ChipRow>
      </Card>

      <NudgeCard
        message="40 g protein to go. Curd or roasted chana would do it."
        actionLabel="Log a snack"
        onAction={() =>
          toast.success('Logged. 22 g protein in this meal.', {
            label: 'Undo',
            onPress: () => undefined,
          })
        }
        onDismiss={() => toast.info('Dismissed')}
      />

      <MealRow
        title="Lunch"
        summary="2 Roti, Dal tadka, Aloo sabzi"
        kcal={570}
        onPress={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
      <MealRow title="Snack" summary="Saved as text" kcal={0} pending onPress={() => undefined} />
      <EmptyMealRow label="Add dinner" onPress={() => undefined} />

      <SegmentedControl
        options={MEAL_TYPES}
        value={mealType}
        onChange={setMealType}
        accessibilityLabel="Meal type"
      />
      <PortionStepper value={quantity} unit="katori" onChange={setQuantity} itemName="Dal tadka" />

      <ChipRow>
        <Chip label="Same breakfast as yesterday" onPress={() => undefined} />
        <Chip label="Lunch" selected onPress={() => undefined} />
        <Chip label="LDL 152 High" status="warn" />
        <Chip label="Not sure" status="alert" onPress={() => undefined} />
        <Chip label="Curd" onRemove={() => undefined} />
      </ChipRow>

      <Card>
        <Text variant="heading">LDL</Text>
        <RangeBar value={152} low={null} high={129} status="high" unit="mg/dL" />
        <Sparkline values={[168, 152]} accessibilityLabel="LDL went from 168 to 152" />
      </Card>

      <ProgressBar progress={0.4} accessibilityLabel="Step 2 of 5" />
      <Skeleton height={spacing.xxxl} />

      <ChatBubble role="user" text="How am I doing today?" />
      <ChatBubble role="tula" text="650 kcal left. A normal thali fits." />
      <TypingIndicator />

      <EmptyState
        illustration="labTube"
        message="Upload a blood report and I'll explain it in plain words."
      />

      <Button label="Open sheet" icon={Camera} onPress={() => setSheetOpen(true)} />
      <Button label="Saving" loading onPress={() => undefined} />
      <Button label="Disabled" disabled onPress={() => undefined} />

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Lunch"
        footer={<Button label="Log meal" onPress={() => setSheetOpen(false)} fullWidth />}
      >
        <Text variant="body">This meal: 540 kcal, 22 g protein</Text>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});

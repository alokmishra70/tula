import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button, KatoriIllustration, Text } from '@/ui';

export function NotFoodStage({
  reason,
  onRetry,
  onType,
}: {
  reason: 'not_food' | 'nothing_recognised';
  onRetry: () => void;
  onType: () => void;
}) {
  return (
    <View style={styles.root}>
      <KatoriIllustration />
      <Text variant="heading" align="center">
        {reason === 'not_food'
          ? "That doesn't look like food. Try another shot?"
          : "I couldn't make out the dishes."}
      </Text>
      <Button label="Try another shot" onPress={onRetry} />
      <Button label="Type instead" variant="ghost" onPress={onType} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
});

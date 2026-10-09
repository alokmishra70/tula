import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button } from './Button';
import { KatoriIllustration, LabTubeIllustration, LeafIllustration } from './illustrations';
import { Text } from './Text';

const ILLUSTRATIONS = {
  katori: KatoriIllustration,
  labTube: LabTubeIllustration,
  leaf: LeafIllustration,
} as const;

export interface EmptyStateProps {
  illustration: keyof typeof ILLUSTRATIONS;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ illustration, message, action }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[illustration];
  return (
    <View style={styles.root}>
      <Illustration />
      <Text variant="body" color="inkMuted" align="center">
        {message}
      </Text>
      {action ? <Button label={action.label} onPress={action.onPress} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
});

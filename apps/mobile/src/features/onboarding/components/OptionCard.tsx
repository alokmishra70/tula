import { Pressable, StyleSheet } from 'react-native';
import { haptics } from '@/lib/haptics';
import { colors, layout, motion, radius, spacing } from '@/theme';
import { Text } from '@/ui';

export interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export function OptionCard({ title, description, selected, onSelect }: OptionCardProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onSelect();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && { transform: [{ scale: motion.pressedScale }] },
      ]}
    >
      <Text variant="heading" color={selected ? 'accent' : 'ink'}>
        {title}
      </Text>
      {description ? (
        <Text variant="caption" color="inkMuted">
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xxs,
    padding: spacing.lg,
    minHeight: layout.buttonHeight.l + spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: layout.hairline,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
});

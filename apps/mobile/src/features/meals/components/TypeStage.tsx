import { LIMITS } from '@tula/shared';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Button } from '@/ui';

export function TypeStage({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <View style={styles.root}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="2 roti, 1 katori dal and aloo sabzi"
        placeholderTextColor={colors.inkFaint}
        multiline
        autoFocus
        maxLength={LIMITS.mealTextMaxChars}
        accessibilityLabel="What did you eat?"
        style={styles.input}
      />
      <Button
        label="Work it out"
        onPress={() => onSubmit(text.trim())}
        disabled={!text.trim()}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  input: {
    ...typography.body,
    minHeight: layout.tile,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});

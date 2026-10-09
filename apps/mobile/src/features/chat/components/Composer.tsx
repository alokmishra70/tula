import { LIMITS } from '@tula/shared';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Icon, Send, Text } from '@/ui';

export interface ComposerProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  error: string | null;
}

export function Composer({ value, onChange, onSend, sending, error }: ComposerProps) {
  const canSend = value.trim().length > 0 && !sending;
  return (
    <View style={styles.root}>
      {error ? (
        <Text variant="caption" color="alert" accessibilityRole="alert">
          {error} Tap send to retry.
        </Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Ask Tula or log a meal"
          placeholderTextColor={colors.inkFaint}
          maxLength={LIMITS.chatMessageMaxChars}
          multiline
          accessibilityLabel="Message"
          style={styles.input}
          onSubmitEditing={() => canSend && onSend()}
          submitBehavior="submit"
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend }}
          style={[styles.send, !canSend && styles.sendDisabled]}
        >
          <Icon icon={Send} color="onAccent" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxs, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: layout.minTouchTarget,
    maxHeight: layout.tile,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: layout.hairline,
    borderColor: colors.line,
    color: colors.ink,
  },
  send: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.inkFaint },
});

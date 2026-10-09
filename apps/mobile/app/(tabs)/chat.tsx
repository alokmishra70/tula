import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatThread, Composer, useChat } from '@/features/chat';
import { colors, layout, spacing } from '@/theme';
import { Skeleton, Text } from '@/ui';

export default function ChatScreen() {
  const chat = useChat();
  // The floating add button sits above the phone tab bar; keep the composer clear of it.
  const bottomInset = useBreakpoint() === 'mobile' ? layout.addButtonSize + spacing.md : 0;
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.column, { paddingBottom: bottomInset }]}>
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            Tula
          </Text>
          <View style={styles.thread}>
            {chat.loading ? (
              <Skeleton height={spacing.xxxl} />
            ) : (
              <ChatThread entries={chat.entries} onSuggestion={(text) => void chat.send(text)} />
            )}
          </View>
          <Composer
            value={chat.draft}
            onChange={chat.setDraft}
            onSend={() => void chat.send(chat.draft)}
            sending={chat.sending}
            error={chat.error}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  title: { marginTop: spacing.md },
  thread: { flex: 1 },
});

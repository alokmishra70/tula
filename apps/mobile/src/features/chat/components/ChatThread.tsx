import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { layout, spacing } from '@/theme';
import { ChatBubble, Chip, ChipRow, EmptyState, TypingIndicator } from '@/ui';
import type { ChatEntry } from '../use-chat';
import { ChatCardView } from './ChatCards';

const SUGGESTIONS = [
  'How am I doing this week?',
  'What should I eat for dinner?',
  'Explain my report',
  'Log 2 idlis and chutney',
];

export function ChatThread({
  entries,
  onSuggestion,
}: {
  entries: ChatEntry[];
  onSuggestion: (text: string) => void;
}) {
  const scroll = useRef<ScrollView>(null);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <EmptyState illustration="leaf" message="Ask about your day, your plan or your report." />
        <ChipRow>
          {SUGGESTIONS.map((text) => (
            <Chip key={text} label={text} onPress={() => onSuggestion(text)} />
          ))}
        </ChipRow>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scroll}
      contentContainerStyle={styles.thread}
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      keyboardShouldPersistTaps="handled"
    >
      {entries.map((entry) =>
        entry.streaming && !entry.content && entry.cards.length === 0 ? (
          <TypingIndicator key={entry.id} />
        ) : (
          <ChatBubble
            key={entry.id}
            role={entry.role === 'user' ? 'user' : 'tula'}
            text={entry.content || undefined}
          >
            {entry.cards.map((card, index) => (
              <ChatCardView key={index} card={card} />
            ))}
          </ChatBubble>
        ),
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', gap: spacing.md },
  thread: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
});

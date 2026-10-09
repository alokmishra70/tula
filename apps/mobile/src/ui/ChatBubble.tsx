import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, layout, motion, radius, spacing } from '@/theme';
import { LeafMark } from './illustrations';
import { Text } from './Text';

export interface ChatBubbleProps {
  role: 'user' | 'tula';
  text?: string;
  /** Embedded rich cards (meal, marker, mini ring). */
  children?: ReactNode;
}

export function ChatBubble({ role, text, children }: ChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {isUser ? null : <LeafMark />}
      <View style={[styles.column, isUser && styles.columnUser]}>
        {text ? (
          <View style={[styles.bubble, isUser ? styles.user : styles.tula]}>
            <Text variant="body">{text}</Text>
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const DOTS = [0, 1, 2];

export function TypingIndicator() {
  return (
    <View style={styles.row} accessibilityLabel="Tula is typing" accessible>
      <LeafMark />
      <View style={[styles.bubble, styles.tula, styles.dots]}>
        {DOTS.map((index) => (
          <Dot key={index} delay={index * (motion.shimmerMs / 3)} />
        ))}
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withDelay(
        delay,
        withRepeat(withTiming(0.3, { duration: motion.shimmerMs / 2 }), -1, true),
      );
    }
  }, [delay, opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  rowUser: { justifyContent: 'flex-end' },
  column: { flexShrink: 1, gap: spacing.xs, maxWidth: '85%' },
  columnUser: { alignItems: 'flex-end' },
  bubble: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  user: { backgroundColor: colors.accentSoft },
  tula: { backgroundColor: colors.surface, borderWidth: layout.hairline, borderColor: colors.line },
  dots: { flexDirection: 'row', gap: spacing.xxs, paddingVertical: spacing.md },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});

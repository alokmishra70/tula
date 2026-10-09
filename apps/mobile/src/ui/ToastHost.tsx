import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { colors, elevation, layout, motion, radius, spacing } from '@/theme';
import { Text } from './Text';
import { useToastStore } from './toast-store';

const KIND_COLOR = { success: colors.good, info: colors.accent, error: colors.alert } as const;

export function ToastHost() {
  const { current, hide } = useToastStore();
  const breakpoint = useBreakpoint();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => hide(current.id), motion.toastMs);
    return () => clearTimeout(timer);
  }, [current, hide]);

  if (!current) return null;
  const position =
    breakpoint === 'desktop'
      ? { left: layout.sidebarWidth + spacing.xl, bottom: spacing.xl }
      : {
          left: spacing.md,
          right: spacing.md,
          bottom: insets.bottom + layout.tabBarHeight + spacing.md,
        };

  return (
    <Animated.View
      key={current.id}
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={[styles.toast, position, { borderLeftColor: KIND_COLOR[current.kind] }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text variant="body" style={styles.message}>
        {current.message}
      </Text>
      {current.action ? (
        <View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              current.action?.onPress();
              hide(current.id);
            }}
            hitSlop={spacing.sm}
          >
            <Text variant="bodyStrong" color="accent">
              {current.action.label}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    maxWidth: layout.modalWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderLeftWidth: layout.accentBorder,
    ...elevation,
  },
  message: { flex: 1 },
});

import type { Href } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { FlaskConical, MessageCircle, Plus, Sun, type LucideIcon } from '@/ui/icons';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { colors, elevation, layout, radius, spacing } from '@/theme';
import { Button, Icon, LeafMark, OfflineBanner, Text } from '@/ui';

interface Destination {
  name: string;
  href: Href;
  label: string;
  icon: LucideIcon;
}

const DESTINATIONS: Destination[] = [
  { name: 'today', href: '/today', label: 'Today', icon: Sun },
  { name: 'reports', href: '/reports', label: 'Reports', icon: FlaskConical },
  { name: 'chat', href: '/chat', label: 'Tula', icon: MessageCircle },
];

type TabButtonProps = TabTriggerSlotProps & {
  destination: Destination;
  variant: 'bar' | 'sidebar';
};

const TabButton = forwardRef<View, TabButtonProps>(function TabButton(
  { destination, variant, isFocused, ...props },
  ref,
) {
  const color = isFocused ? 'accent' : 'inkMuted';
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={destination.label}
      accessibilityState={{ selected: isFocused }}
      style={[styles[variant], variant === 'sidebar' && isFocused && styles.sidebarActive]}
    >
      <Icon icon={destination.icon} color={color} />
      <Text variant="caption" color={color}>
        {destination.label}
      </Text>
    </Pressable>
  );
});

export interface TabShellProps {
  onLogPress: () => void;
}

/** Three destinations: bottom tabs with a floating add button on phones, a sidebar on wide screens. */
export function TabShell({ onLogPress }: TabShellProps) {
  const desktop = useBreakpoint() === 'desktop';
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={desktop ? styles.desktopRoot : styles.mobileRoot}>
      {desktop ? (
        <TabList style={[styles.sidebarList, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.brand}>
            <LeafMark />
            <Text variant="title">Tula</Text>
          </View>
          {DESTINATIONS.map((destination) => (
            <TabTrigger
              key={destination.name}
              name={destination.name}
              href={destination.href}
              asChild
            >
              <TabButton destination={destination} variant="sidebar" />
            </TabTrigger>
          ))}
          <View style={styles.sidebarAction}>
            <Button label="Log a meal" icon={Plus} onPress={onLogPress} fullWidth />
          </View>
        </TabList>
      ) : null}

      <View style={styles.content}>
        <OfflineBanner />
        <TabSlot />
      </View>

      {desktop ? null : (
        <TabList style={[styles.barList, { paddingBottom: insets.bottom }]}>
          {DESTINATIONS.map((destination) => (
            <TabTrigger
              key={destination.name}
              name={destination.name}
              href={destination.href}
              asChild
            >
              <TabButton destination={destination} variant="bar" />
            </TabTrigger>
          ))}
          <Pressable
            onPress={onLogPress}
            accessibilityRole="button"
            accessibilityLabel="Log a meal"
            style={styles.addButton}
          >
            <Icon icon={Plus} color="onAccent" />
          </Pressable>
        </TabList>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  mobileRoot: { flex: 1, backgroundColor: colors.bg },
  desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  content: { flex: 1 },
  barList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: layout.tabBarHeight,
    backgroundColor: colors.surface,
    borderTopWidth: layout.hairline,
    borderTopColor: colors.line,
  },
  bar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs / 2,
    minHeight: layout.tabBarHeight,
  },
  addButton: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    top: -layout.addButtonSize - spacing.sm,
    marginLeft: -layout.addButtonSize / 2,
    width: layout.addButtonSize,
    height: layout.addButtonSize,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation,
  },
  sidebarList: {
    width: layout.sidebarWidth,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRightWidth: layout.hairline,
    borderRightColor: colors.line,
    backgroundColor: colors.bg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  sidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  sidebarActive: { backgroundColor: colors.accentSoft },
  sidebarAction: { marginTop: spacing.xl },
});

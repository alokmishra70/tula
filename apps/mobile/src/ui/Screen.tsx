import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { colors, layout, spacing } from '@/theme';
import { Text } from './Text';

export interface ScreenProps {
  title?: string;
  header?: ReactNode;
  children: ReactNode;
  /** Pinned below the scroll area, e.g. the onboarding primary button. */
  footer?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
  edges?: Edge[];
  /** Secondary column shown beside the content on wide screens (e.g. the week view on Today). */
  aside?: ReactNode;
}

export function Screen({
  title,
  header,
  children,
  footer,
  onRefresh,
  refreshing = false,
  scroll = true,
  edges = ['top'],
  aside,
}: ScreenProps) {
  // Leave room for the floating add button above the phone tab bar.
  const bottomInset = useBreakpoint() === 'mobile' ? layout.addButtonSize + spacing.md : 0;
  const column = (
    <View style={[styles.column, aside ? styles.columnBesideAside : null]}>
      {header}
      {title ? (
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
  const content = aside ? (
    <View style={styles.withAside}>
      {column}
      <View style={styles.aside}>{aside}</View>
    </View>
  ) : (
    column
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.xxxl + bottomInset },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{content}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  column: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: layout.cardGap,
  },
  columnBesideAside: { width: layout.contentMaxWidth },
  withAside: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  aside: { width: layout.sideColumnWidth, gap: layout.cardGap, paddingTop: spacing.xxxl * 2 },
  title: { marginTop: spacing.md, marginBottom: spacing.xs },
  footer: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
  },
});

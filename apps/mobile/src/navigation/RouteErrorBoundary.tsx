import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Button, KatoriIllustration, Text } from '@/ui';

/** Friendly per-route fallback; re-renders the route on retry. */
export function RouteErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.root} accessibilityRole="alert">
      <KatoriIllustration />
      <Text variant="title" align="center">
        That didn&apos;t load.
      </Text>
      <Text variant="body" color="inkMuted" align="center">
        Your data is safe. Try again in a moment.
      </Text>
      <Button label="Try again" onPress={() => void retry()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
});

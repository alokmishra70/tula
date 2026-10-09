import { WifiOff } from './icons';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { useOnline } from './use-online';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon icon={WifiOff} color="inkMuted" size={spacing.md} />
      <Text variant="caption" color="inkMuted">
        Offline. Logs will sync when you&apos;re back.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSunken,
  },
});

import { StyleSheet, View } from 'react-native';
import { layout, radius, spacing } from '@/theme';
import { Card, Skeleton } from '@/ui';

export function TodaySkeleton() {
  return (
    <View style={styles.root} accessibilityLabel="Loading today" accessible>
      <Skeleton height={spacing.md} width="40%" />
      <Skeleton height={spacing.xxl} width="70%" />
      <Card>
        <View style={styles.ring}>
          <Skeleton height={layout.ring.size} width={layout.ring.size} radius={radius.pill} />
        </View>
        <Skeleton height={layout.bar.height * 2} />
        <Skeleton height={layout.bar.height * 2} />
      </Card>
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} height={layout.thumbnail + spacing.md} radius={radius.md} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm, paddingTop: spacing.md },
  ring: { alignItems: 'center' },
});

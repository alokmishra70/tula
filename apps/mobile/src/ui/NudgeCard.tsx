import { X } from './icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { layout, spacing } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { LeafMark } from './illustrations';
import { Text } from './Text';

export interface NudgeCardProps {
  message: string;
  actionLabel: string | null;
  onAction?: () => void;
  onDismiss?: () => void;
}

export function NudgeCard({ message, actionLabel, onAction, onDismiss }: NudgeCardProps) {
  return (
    <Card variant="accent">
      <View style={styles.row}>
        <LeafMark />
        <Text variant="body" style={styles.message} accessibilityRole="summary">
          {message}
        </Text>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            hitSlop={spacing.sm}
            style={styles.dismiss}
          >
            <Icon icon={X} color="inkMuted" />
          </Pressable>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="ghost" />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  message: { flex: 1 },
  dismiss: { minWidth: layout.minTouchTarget / 2, alignItems: 'flex-end' },
  action: { alignItems: 'flex-start', marginLeft: layout.leafMark },
});

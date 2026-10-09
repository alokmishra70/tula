import type { DailySummary, Targets } from '@tula/shared';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { formatNumber } from '@/lib/format';
import { motion, spacing } from '@/theme';
import { Card, MacroBar, ProgressRing, Text } from '@/ui';

const PULSE_SCALE = 1.03;

export function RingCard({ summary, targets }: { summary: DailySummary; targets: Targets }) {
  const { consumed } = summary;
  const remaining = targets.kcal - consumed.kcal;
  const over = remaining < 0;
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasOnTarget = useRef(summary.onTarget);

  // One soft pulse when the day first reaches its target.
  useEffect(() => {
    if (summary.onTarget && !wasOnTarget.current) {
      haptics.success();
      if (!reduceMotion) {
        scale.value = withSequence(
          withTiming(PULSE_SCALE, { duration: motion.ringSpringMs / 2 }),
          withTiming(1, { duration: motion.ringSpringMs / 2 }),
        );
      }
    }
    wasOnTarget.current = summary.onTarget;
  }, [summary.onTarget, reduceMotion, scale]);

  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Card>
      <Animated.View style={[styles.ring, pulse]}>
        <ProgressRing consumed={consumed.kcal} target={targets.kcal} wash>
          <Text variant="display" numeric color={over ? 'warn' : 'ink'}>
            {formatNumber(Math.abs(remaining))}
          </Text>
          <Text variant="caption" color="inkMuted">
            {over ? 'kcal over' : 'kcal left'}
          </Text>
        </ProgressRing>
      </Animated.View>
      {over ? (
        <Text variant="caption" color="inkMuted" align="center">
          Tomorrow&apos;s a fresh ring.
        </Text>
      ) : null}
      <View style={styles.bars}>
        <MacroBar macro="protein" consumed={consumed.proteinG} target={targets.proteinG} />
        <MacroBar macro="carbs" consumed={consumed.carbsG} target={targets.carbsG} />
        <MacroBar macro="fat" consumed={consumed.fatG} target={targets.fatG} />
        <MacroBar macro="fiber" consumed={consumed.fiberG} target={targets.fiberG} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', paddingVertical: spacing.sm },
  bars: { gap: spacing.sm },
});

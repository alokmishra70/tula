import { useEffect } from 'react';
import { StyleSheet, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion, radius as radii } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
}

export function Skeleton({ width = '100%', height, radius = radii.sm }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion)
      opacity.value = withRepeat(withTiming(0.5, { duration: motion.shimmerMs }), -1, true);
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius: radius }, style]}
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceSunken },
});

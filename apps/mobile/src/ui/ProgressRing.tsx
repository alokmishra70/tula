import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { formatNumber } from '@/lib/format';
import { colors, layout, motion } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  /** Soft radial wash behind the ring; only used on Today. */
  wash?: boolean;
  children?: ReactNode;
}

export function ProgressRing({
  consumed,
  target,
  size = layout.ring.size,
  strokeWidth = layout.ring.stroke,
  wash = false,
  children,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = consumed > target;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = reduceMotion
      ? progress
      : withSpring(progress, { duration: motion.ringSpringMs, dampingRatio: 0.9 });
  }, [animated, progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${formatNumber(consumed)} of ${formatNumber(target)} kilocalories eaten`}
    >
      <Svg width={size} height={size}>
        {wash ? (
          <>
            <Defs>
              <RadialGradient id="wash" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.accentSoft} stopOpacity={0.9} />
                <Stop offset="100%" stopColor={colors.accentSoft} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#wash)" />
          </>
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceSunken}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over ? colors.warn : colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

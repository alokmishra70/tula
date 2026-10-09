import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, layout, motion } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Hides line drawings from screen readers on every platform. */
function Decorative({ children }: { children: ReactNode }) {
  return (
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  );
}
const STROKE = 2;
const VIEWBOX = '0 0 96 96';
const LEAF_PATH = 'M24 72 C24 40 44 22 76 20 C76 52 58 72 24 72 Z M24 72 C38 58 50 46 64 34';
const LEAF_LENGTH = 220;

interface IllustrationProps {
  size?: number;
}

/** A katori (small steel bowl) with steam: empty Today. */
export function KatoriIllustration({ size = layout.illustration }: IllustrationProps) {
  return (
    <Decorative>
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <Path
          d="M18 50 H78 C78 64 66 74 48 74 C30 74 18 64 18 50 Z"
          stroke={colors.accent}
          strokeWidth={STROKE}
          fill="none"
        />
        <Path d="M30 78 H66" stroke={colors.accent} strokeWidth={STROKE} strokeLinecap="round" />
        <Path
          d="M38 40 C34 34 42 30 38 24 M50 40 C46 34 54 30 50 24 M62 40 C58 34 66 30 62 24"
          stroke={colors.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Decorative>
  );
}

/** A lab tube: empty Reports. */
export function LabTubeIllustration({ size = layout.illustration }: IllustrationProps) {
  return (
    <Decorative>
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <Path
          d="M38 16 H58 M42 16 V70 C42 76 46 80 48 80 C50 80 54 76 54 70 V16"
          stroke={colors.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M42 50 H54" stroke={colors.accent} strokeWidth={STROKE} />
        <Path
          d="M64 36 L72 28 M66 46 H76"
          stroke={colors.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      </Svg>
    </Decorative>
  );
}

/** A leaf: onboarding finale. Draws itself in unless reduced motion is on. */
export function LeafIllustration({
  size = layout.illustration,
  drawIn = false,
}: IllustrationProps & { drawIn?: boolean }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(drawIn && !reduceMotion ? 0 : 1);

  useEffect(() => {
    if (drawIn && !reduceMotion) progress.value = withTiming(1, { duration: motion.countUpMs * 2 });
  }, [drawIn, progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: LEAF_LENGTH * (1 - progress.value),
  }));

  return (
    <Decorative>
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <AnimatedPath
          d={LEAF_PATH}
          stroke={colors.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={LEAF_LENGTH}
          animatedProps={animatedProps}
        />
      </Svg>
    </Decorative>
  );
}

/** Tula's presence next to its messages; there is no avatar face. */
export function LeafMark({ size = layout.leafMark }: IllustrationProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Tula">
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <Path
          d={LEAF_PATH}
          stroke={colors.accent}
          strokeWidth={STROKE * 4}
          strokeLinecap="round"
          fill={colors.accentSoft}
        />
      </Svg>
    </View>
  );
}

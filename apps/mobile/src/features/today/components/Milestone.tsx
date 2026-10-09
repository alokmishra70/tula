import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { readJson, writeJson } from '@/lib/storage';
import { colors, layout, radius } from '@/theme';
import { toast } from '@/ui';

const PIECES = 14;
const BURST_MS = 900;
const DISTANCE = 120;
const PALETTE = [colors.accent, colors.good, colors.warn, colors.macro.protein, colors.macro.fiber];
const SEEN_KEY = 'tula.milestonesSeen';

/** Small confetti burst in brand colours, once per milestone and day. */
export function Milestone({ days, date }: { days: number | null; date: string }) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!days) return;
    const id = `${date}:${days}`;
    void readJson<string[]>(SEEN_KEY).then((seen) => {
      if (seen?.includes(id)) return;
      void writeJson(SEEN_KEY, [...(seen ?? []), id]);
      haptics.success();
      toast.success(`${days}-day streak! Nice work.`);
      if (!reduceMotion) {
        setActive(true);
        setTimeout(() => setActive(false), BURST_MS);
      }
    });
  }, [days, date, reduceMotion]);

  if (!active) return null;
  return (
    <View pointerEvents="none" style={styles.layer}>
      {Array.from({ length: PIECES }, (_, index) => (
        <Piece
          key={index}
          angle={(index / PIECES) * Math.PI * 2}
          color={PALETTE[index % PALETTE.length]!}
        />
      ))}
    </View>
  );
}

function Piece({ angle, color }: { angle: number; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: BURST_MS });
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * DISTANCE * progress.value },
      { translateY: Math.sin(angle) * DISTANCE * progress.value },
    ],
  }));
  return <Animated.View style={[styles.piece, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: '30%', left: '50%' },
  piece: {
    position: 'absolute',
    width: layout.bar.dot / 2,
    height: layout.bar.dot,
    borderRadius: radius.sm,
  },
});

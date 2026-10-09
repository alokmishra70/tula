import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { motion } from '@/theme';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Counts from the previous value to the next one; shows the target at once under reduced motion. */
export function useCountUp(target: number, durationMs: number = motion.countUpMs): number {
  const reduceMotion = useReducedMotion();
  const [animated, setAnimated] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduceMotion) return;
    const start = Date.now();
    const origin = from.current;
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const next = origin + (target - origin) * easeOutCubic(t);
      from.current = next;
      setAnimated(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduceMotion]);

  return reduceMotion ? target : animated;
}

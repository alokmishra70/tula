import { useEffect, useRef } from 'react';
import { motion } from '@/theme';

/** Runs `next` shortly after a choice so the selected state is seen before moving on. */
export function useAutoAdvance() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);
  return (next: () => void) => {
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(next, motion.autoAdvanceMs);
  };
}

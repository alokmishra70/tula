import { useWindowDimensions } from 'react-native';
import { layout } from '@/theme';

export type Breakpoint = 'mobile' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return width >= layout.desktopBreakpoint ? 'desktop' : 'mobile';
}

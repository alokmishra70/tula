import type { LucideIcon } from './icons';
import { colors, layout } from '@/theme';

type IconColor = 'ink' | 'inkMuted' | 'inkFaint' | 'accent' | 'onAccent' | 'warn' | 'alert';

export interface IconProps {
  icon: LucideIcon;
  color?: IconColor;
  size?: number;
}

export function Icon({ icon: Glyph, color = 'ink', size = layout.iconSize }: IconProps) {
  return <Glyph size={size} color={colors[color]} strokeWidth={layout.iconStroke} />;
}

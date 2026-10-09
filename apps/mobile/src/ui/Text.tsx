import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, MAX_FONT_SCALE, numeric, typography, type TypographyVariant } from '@/theme';

type InkColor = 'ink' | 'inkMuted' | 'inkFaint' | 'accent' | 'onAccent' | 'alert' | 'warn' | 'good';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: InkColor;
  /** Tabular figures for numbers that change. */
  numeric?: boolean;
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  color = 'ink',
  numeric: isNumeric,
  align,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        typography[variant],
        { color: colors[color], textAlign: align },
        isNumeric && numeric,
        style,
      ]}
      {...props}
    />
  );
}

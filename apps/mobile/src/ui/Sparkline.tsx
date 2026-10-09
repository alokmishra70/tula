import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { colors, layout } from '@/theme';

export function Sparkline({
  values,
  accessibilityLabel,
}: {
  values: number[];
  accessibilityLabel: string;
}) {
  if (values.length < 2) return null;
  const { width, height, dot } = layout.sparkline;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values.map((value, index) => ({
    x: dot + (index / (values.length - 1)) * (width - dot * 2),
    y: dot + (1 - (value - min) / spread) * (height - dot * 2),
  }));
  const last = points.at(-1)!;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height}>
        <Polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          stroke={colors.inkMuted}
          strokeWidth={layout.iconStroke}
          fill="none"
        />
        <Circle cx={last.x} cy={last.y} r={dot} fill={colors.accent} />
      </Svg>
    </View>
  );
}

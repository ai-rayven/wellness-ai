import { Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import colors from '../../colors';

const W = 140;
const H = 44;
const PAD = 5;

/** A small line with a point per value, as on the mockup's Dashboard cards. */
export function Sparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  if (values.length < 2) return <Text className="py-3 text-xs text-text-2">Not enough data yet.</Text>;

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => PAD + (i / (values.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo || 1)) * (H - 2 * PAD);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} accessibilityLabel={label}>
      <Path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {values.map((v, i) => (
        <Circle key={i} cx={x(i)} cy={y(v)} r={3} fill={colors.card} stroke={color} strokeWidth={2} />
      ))}
    </Svg>
  );
}

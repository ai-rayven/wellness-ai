import { Text } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { addDays } from '@/lib/dates';
import type { IsoDate, WeightEntry } from '@/lib/types';

import colors from '../../colors';

const W = 320;
const H = 150;
const PAD = { left: 4, right: 36, top: 10, bottom: 20 };

interface WeightChartProps {
  /** Entries inside the range, oldest first. */
  entries: WeightEntry[];
  days: number;
  today: IsoDate;
}

const dayMillis = (date: IsoDate) => new Date(`${date}T00:00:00`).getTime();

/** Weight over the last `days` days, as in the mockup: a line with a point per entry. */
export function WeightChart({ entries, days, today }: WeightChartProps) {
  if (entries.length < 2) return <Text className="text-base text-text-2">Log at least two days to see a trend.</Text>;

  const start = dayMillis(addDays(today, -days + 1));
  const span = dayMillis(today) - start;
  const values = entries.map((e) => e.weightLb);
  const lo = Math.floor(Math.min(...values)) - 1;
  const hi = Math.ceil(Math.max(...values)) + 1;
  const x = (date: IsoDate) => PAD.left + ((dayMillis(date) - start) / span) * (W - PAD.left - PAD.right);
  const y = (lb: number) => PAD.top + (1 - (lb - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const line = entries.map((e, i) => `${i ? 'L' : 'M'}${x(e.date).toFixed(1)},${y(e.weightLb).toFixed(1)}`).join('');

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} accessibilityLabel={`Weight, last ${days} days`}>
      {ticks.map((v) => (
        <Line key={`l${v}`} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={colors.grid} />
      ))}
      {ticks.map((v) => (
        <SvgText key={`t${v}`} x={W - PAD.right + 6} y={y(v) + 4} fontSize={10} fill={colors['text-2']}>
          {v}
        </SvgText>
      ))}
      <SvgText x={PAD.left} y={H - 4} fontSize={10} fill={colors['text-2']}>
        {days} days ago
      </SvgText>
      <SvgText x={W - PAD.right} y={H - 4} fontSize={10} fill={colors['text-2']} textAnchor="end">
        Today
      </SvgText>
      <Path d={line} fill="none" stroke={colors.brand} strokeWidth={2} strokeLinejoin="round" />
      {entries.map((e) => (
        <Circle key={e.date} cx={x(e.date)} cy={y(e.weightLb)} r={3} fill={colors.brand} />
      ))}
    </Svg>
  );
}

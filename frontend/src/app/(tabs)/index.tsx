import { useRouter } from 'expo-router';
import { ChevronRight, Flame } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { nutrientColor } from '@/components/nutrient-dot';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Sparkline } from '@/components/sparkline';
import { addDays, daysFrom, formatDay, toIsoDate, weekStart } from '@/lib/dates';
import { NUTRIENTS, averageKcal, remainingNutrients, totalsByDay } from '@/lib/nutrients';
import type { IsoDate, LogEntry, Nutrients, WeightEntry } from '@/lib/types';
import { watchRange } from '@/services/log';
import { useSessionWith } from '@/services/session';
import { WEIGHT_HISTORY_DAYS } from '@/lib/weight';
import { watchWeights } from '@/services/weight';

import colors from '../../../colors';

/** Rows of the week grid, in the mockup's order. */
const ROWS: { key: keyof Nutrients; suffix: string }[] = [
  { key: 'kcal', suffix: '' },
  { key: 'proteinG', suffix: 'P' },
  { key: 'fatG', suffix: 'F' },
  { key: 'carbsG', suffix: 'C' },
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MODES = [
  { value: 'consumed', label: 'Consumed' },
  { value: 'remaining', label: 'Remaining' },
] as const;
const WEIGHT_POINTS = 7;

/** This week's calories and macros per day against the targets, then the calorie and weight trends. */
export default function Dashboard() {
  const session = useSessionWith('ready');
  const router = useRouter();
  const today = toIsoDate(new Date());
  const [selected, setSelected] = useState<IsoDate>(today);
  const [mode, setMode] = useState<'consumed' | 'remaining'>('consumed');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const uid = session?.account.uid;

  const week = daysFrom(weekStart(today), 7);
  const lastSeven = daysFrom(addDays(today, -6), 7);
  const from = week[0] < lastSeven[0] ? week[0] : lastSeven[0];

  useEffect(() => {
    if (!uid) return;
    const onError = (e: Error) => setError(e.message);
    const stopEntries = watchRange(uid, from, today, setEntries, onError);
    // An ascending range on the document id needs no index. A descending one (for "latest N") does.
    const stopWeights = watchWeights(uid, addDays(today, -WEIGHT_HISTORY_DAYS + 1), today, setWeights, onError);
    return () => {
      stopEntries();
      stopWeights();
    };
  }, [uid, from, today]);

  if (!session) return null;

  const targets = session.user.targets;
  const totals = totalsByDay([...new Set([...week, ...lastSeven])], entries);
  const dayTotals = totals.get(selected)!;
  const left = remainingNutrients(dayTotals, targets);
  const recentKcal = lastSeven.map((d) => totals.get(d)!.kcal).filter((kcal) => kcal > 0);
  const recentWeights = weights.slice(-WEIGHT_POINTS);
  const latestWeight = recentWeights.at(-1);

  return (
    <Screen inTabs>
      <Text className="text-[30px] font-extrabold text-ink">Dashboard</Text>
      {error && <Text className="text-sm text-carbs">Could not load your data: {error}</Text>}

      <View className="gap-4 rounded-[18px] bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-ink">This week</Text>
          <Text className="text-sm text-text-2">{formatDay(selected, today)}</Text>
        </View>

        <View className="flex-row gap-1.5">
          {week.map((day, i) => (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={formatDay(day, today)}
              accessibilityState={{ selected: day === selected, disabled: day > today }}
              disabled={day > today}
              onPress={() => setSelected(day)}
              className={`flex-1 gap-2 rounded-xl border-2 p-0.5 ${day === selected ? 'border-text' : 'border-transparent'}`}
            >
              {ROWS.map((row) => {
                const percent = Math.min(100, (totals.get(day)![row.key] / targets[row.key]) * 100);
                return (
                  <View key={row.key} className={`h-14 justify-end overflow-hidden rounded-md bg-card-2 ${day > today ? 'opacity-50' : ''}`}>
                    <View style={{ height: `${percent}%`, backgroundColor: nutrientColor(row.key) }} className="rounded-md" />
                  </View>
                );
              })}
              <Text className={`text-center text-[13px] font-semibold text-text-2 ${day > today ? 'opacity-45' : ''}`}>
                {WEEKDAYS[i]}
              </Text>
            </Pressable>
          ))}

          <View className="w-[78px] gap-2 py-0.5 pl-1.5">
            {ROWS.map((row) => {
              const consumed = Math.round(dayTotals[row.key]);
              const remaining = Math.round(left[row.key]);
              const big = mode === 'consumed' ? consumed : Math.abs(remaining);
              const small = mode === 'consumed' ? `of ${targets[row.key]}` : remaining >= 0 ? 'left' : 'over';
              const name = NUTRIENTS.find((n) => n.key === row.key)?.label;
              return (
                <View
                  key={row.key}
                  accessible
                  accessibilityLabel={`${name}: ${big.toLocaleString('en-US')} ${small}`}
                  className="h-14 justify-center"
                >
                  <View className="flex-row items-center gap-1">
                    <Text className="text-lg font-bold text-ink">
                      {big.toLocaleString('en-US')}
                      {row.suffix ? ` ${row.suffix}` : ''}
                    </Text>
                    {row.key === 'kcal' && <Flame color={colors.sun} size={15} />}
                  </View>
                  <Text className="text-xs text-text-2">{small}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="mx-auto w-full max-w-[280px]">
          <Segmented options={[...MODES]} value={mode} onChange={setMode} />
        </View>
      </View>

      <Text className="text-[19px] font-bold text-ink">Insights</Text>
      <View className="flex-row gap-3">
        <InsightCard
          title="Calories"
          subtitle="Last 7 days"
          onPress={() => router.navigate('/log')}
          chart={<Sparkline values={recentKcal} color={colors.sun} label="Calories, last 7 days" />}
          value={averageKcal(lastSeven.map((d) => totals.get(d)!)).toLocaleString('en-US')}
          unit="kcal avg"
        />
        <InsightCard
          title="Weight trend"
          subtitle={`Last ${WEIGHT_POINTS} entries`}
          onPress={() => router.push('/weight')}
          chart={<Sparkline values={recentWeights.map((w) => w.weightLb)} color={colors.brand} label="Weight, last entries" />}
          value={latestWeight ? String(latestWeight.weightLb) : '–'}
          unit="lb"
        />
      </View>
    </Screen>
  );
}

interface InsightCardProps {
  title: string;
  subtitle: string;
  chart: ReactNode;
  value: string;
  unit: string;
  onPress: () => void;
}

function InsightCard({ title, subtitle, chart, value, unit, onPress }: InsightCardProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} className="flex-1 gap-0.5 rounded-[18px] bg-card p-4">
      <Text className="text-[15px] font-bold text-ink">{title}</Text>
      <Text className="text-xs text-text-2">{subtitle}</Text>
      <View className="my-2.5">{chart}</View>
      <View className="flex-row items-center justify-between border-t border-grid pt-2">
        <Text className="text-sm text-text">
          <Text className="text-xl font-bold text-ink">{value}</Text> {unit}
        </Text>
        <ChevronRight color={colors.muted} size={18} />
      </View>
    </Pressable>
  );
}

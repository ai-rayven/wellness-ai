import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { WeightChart } from '@/components/weight-chart';
import { WeightSheet } from '@/components/weight-sheet';
import { addDays, formatDay, toIsoDate } from '@/lib/dates';
import type { IsoDate, WeightEntry } from '@/lib/types';
import { WEIGHT_HISTORY_DAYS, withChanges } from '@/lib/weight';
import { watchWeights } from '@/services/weight';
import { useSessionWith } from '@/services/session';

import colors from '../../colors';

const RANGES = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
] as const;

/** The weight trend and entries. Logging and changes happen in the WeightSheet. */
export default function Weight() {
  const session = useSessionWith('ready');
  const router = useRouter();
  const today = toIsoDate(new Date());
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [range, setRange] = useState<'30' | '90'>('30');
  const [sheetDate, setSheetDate] = useState<IsoDate | null>(null);
  const uid = session?.account.uid;

  useEffect(() => {
    if (!uid) return;
    return watchWeights(uid, addDays(today, -WEIGHT_HISTORY_DAYS + 1), today, setEntries, (e) => setLoadError(e.message));
  }, [uid, today]);

  if (!session) return null;

  const days = Number(range);
  const inRange = entries.filter((e) => e.date >= addDays(today, -days + 1));
  const newestFirst = withChanges(entries).reverse();

  return (
    <Screen>
      <ScreenHeader title="Weight" icon="back" onPress={() => router.back()} />

      <Button label="Log weight" onPress={() => setSheetDate(today)} />

      <View className="gap-3 rounded-[18px] bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-ink">Trend</Text>
          <View className="w-32">
            <Segmented options={[...RANGES]} value={range} onChange={setRange} />
          </View>
        </View>
        <WeightChart entries={inRange} days={days} today={today} />
      </View>

      <View className="gap-1 rounded-[18px] bg-card p-4">
        <View className="flex-row items-center justify-between pb-1">
          <Text className="text-base font-semibold text-ink">Entries</Text>
          <Text className="text-sm text-text-2">{entries.length}</Text>
        </View>
        {loadError && <Text className="text-sm text-carbs">Could not load weights: {loadError}</Text>}
        {newestFirst.length === 0 && <Text className="text-base text-text-2">No entries yet.</Text>}
        {newestFirst.map(({ entry, changeLb }) => (
          <Pressable
            key={entry.date}
            accessibilityRole="button"
            accessibilityLabel={`Change ${formatDay(entry.date, today)}`}
            onPress={() => setSheetDate(entry.date)}
            className="flex-row items-center gap-2 border-t border-grid py-2.5"
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink">{formatDay(entry.date, today)}</Text>
              {changeLb !== null && (
                <Text className="text-xs text-text-2">
                  {changeLb > 0 ? '+' : ''}
                  {changeLb} lb
                </Text>
              )}
            </View>
            <Text className="text-base text-text">{entry.weightLb} lb</Text>
            <ChevronRight color={colors['text-2']} size={18} />
          </Pressable>
        ))}
      </View>

      {uid && <WeightSheet uid={uid} date={sheetDate} onClose={() => setSheetDate(null)} />}
    </Screen>
  );
}

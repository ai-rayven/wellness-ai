import { useRouter } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { Field } from '@/components/field';
import { NumberField } from '@/components/number-field';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { WeightChart } from '@/components/weight-chart';
import { addDays, formatDay, isIsoDate, toIsoDate } from '@/lib/dates';
import type { IsoDate, WeightEntry } from '@/lib/types';
import { parseWeightLb, withChanges } from '@/lib/weight';
import { removeWeight, setWeight, watchWeights } from '@/services/weight';
import { useSessionWith } from '@/services/session';

import colors from '../../colors';

/** The list and the longest chart range. */
const HISTORY_DAYS = 90;
const RANGES = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
] as const;

/** Log a weight for a day (one per day), see the trend, and edit or delete entries. */
export default function Weight() {
  const session = useSessionWith('ready');
  const router = useRouter();
  const today = toIsoDate(new Date());
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [date, setDate] = useState<IsoDate>(today);
  const [text, setText] = useState('');
  const [range, setRange] = useState<'30' | '90'>('30');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const uid = session?.account.uid;

  useEffect(() => {
    if (!uid) return;
    return watchWeights(uid, addDays(today, -HISTORY_DAYS + 1), today, setEntries, (e) => setLoadError(e.message));
  }, [uid, today]);

  if (!session) return null;

  const existing = entries.find((e) => e.date === date);
  const weightLb = parseWeightLb(text);
  const days = Number(range);
  const inRange = entries.filter((e) => e.date >= addDays(today, -days + 1));
  const newestFirst = withChanges(entries).reverse();

  async function save() {
    if (!uid || weightLb === null) return;
    setBusy(true);
    setSaveError(null);
    try {
      await setWeight(uid, { date, weightLb }, today);
      setText('');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function edit(entry: WeightEntry) {
    setDate(entry.date);
    setText(String(entry.weightLb));
  }

  const pickDate = (value: string) => setDate(isIsoDate(value) && value <= today ? value : today);

  return (
    <Screen>
      <ScreenHeader title="Weight" icon="back" onPress={() => router.back()} />

      <View className="gap-3 rounded-[18px] bg-card p-4">
        <Text className="text-base font-semibold text-ink">Log weight</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Field label="Date">
              <DateField label="Date" value={date} max={today} onChange={pickDate} />
            </Field>
          </View>
          <View className="flex-1 justify-end">
            <NumberField label="Weight" unit="lb" decimal value={text} onChange={setText} />
          </View>
        </View>
        <Text className="text-xs text-text-2">
          {existing
            ? `Replaces ${existing.weightLb} lb already logged for ${formatDay(date, today)}.`
            : 'One entry per day.'}
        </Text>
        <Button label="Save" disabled={weightLb === null || busy} onPress={save} />
        {saveError && <Text className="text-center text-sm text-carbs">{saveError}</Text>}
      </View>

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
          <View key={entry.date} className="flex-row items-center gap-2 border-t border-grid py-2.5">
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
            <IconButton label={`Edit ${formatDay(entry.date, today)}`} onPress={() => edit(entry)} icon="edit" />
            <IconButton
              label={`Delete ${formatDay(entry.date, today)}`}
              onPress={() => uid && removeWeight(uid, entry.date)}
              icon="delete"
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

function IconButton({ label, icon, onPress }: { label: string; icon: 'edit' | 'delete'; onPress: () => void }) {
  const Icon = icon === 'edit' ? Pencil : Trash2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-9 items-center justify-center rounded-full bg-card-2"
    >
      <Icon color={colors.text} size={16} />
    </Pressable>
  );
}

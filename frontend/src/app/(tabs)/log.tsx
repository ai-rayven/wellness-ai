import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { addDays, formatDay, toIsoDate } from '@/lib/dates';
import { MEALS } from '@/lib/meals';
import { NutrientDot, nutrientColor } from '@/components/nutrient-dot';
import { MACROS, remainingNutrients, sumNutrients, summarizeDay } from '@/lib/nutrients';
import type { IsoDate, LogEntry, MealType } from '@/lib/types';
import { watchDay } from '@/services/log';
import { useSessionWith } from '@/services/session';

import colors from '../../../colors';

const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

/** A day's entries grouped by meal, with totals against the targets. Future days can't be opened. */
export default function FoodLog() {
  const session = useSessionWith('ready');
  const router = useRouter();
  const today = toIsoDate(new Date());
  const [date, setDate] = useState<IsoDate>(today);
  const [day, setDay] = useState<{ date: IsoDate; entries: LogEntry[]; error: string | null } | null>(null);
  const uid = session?.account.uid;

  useEffect(() => {
    if (!uid) return;
    return watchDay(
      uid,
      date,
      (entries) => setDay({ date, entries, error: null }),
      (e) => setDay({ date, entries: [], error: e.message }),
    );
  }, [uid, date]);

  if (!session) return null;

  // Until the selected day has loaded, show it empty instead of the previous day.
  const loaded = day?.date === date ? day : null;
  const entries = loaded?.entries;
  const error = loaded?.error;

  const targets = session.user.targets;
  const summary = summarizeDay(date, entries ?? []);
  const left = remainingNutrients(summary.totals, targets).kcal;

  const addFood = (meal: MealType) => router.push({ pathname: '/food/search', params: { meal, date } });
  const editEntry = (entry: LogEntry) =>
    router.push({ pathname: '/food/[id]', params: { id: entry.foodId, entry: entry.id } });

  return (
    <Screen inTabs>
      <Text className="text-[30px] font-extrabold text-ink">Food log</Text>

      <View className="flex-row items-center justify-between">
        <DayButton label="Previous day" direction="back" onPress={() => setDate(addDays(date, -1))} />
        <Text className="text-lg font-bold text-ink">{formatDay(date, today)}</Text>
        <DayButton
          label="Next day"
          direction="forward"
          disabled={date >= today}
          onPress={() => setDate(addDays(date, 1))}
        />
      </View>

      {error && <Text className="text-center text-sm text-carbs">Could not load this day: {error}</Text>}

      <View className="gap-3 rounded-[18px] bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-ink">Calories</Text>
          <Text className="text-sm text-text-2">
            {left >= 0 ? `${formatNumber(left)} left` : `${formatNumber(-left)} over`}
          </Text>
        </View>
        <Text className="text-[34px] font-extrabold text-ink">
          {formatNumber(summary.totals.kcal)}
          <Text className="text-base font-semibold text-muted"> / {formatNumber(targets.kcal)} kcal</Text>
        </Text>
        {MACROS.map((m) => (
          <View key={m.key} className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <NutrientDot nutrient={m.key} />
                <Text className="text-sm text-text">{m.label}</Text>
              </View>
              <Text className="text-sm text-text">
                <Text className="font-bold">{formatNumber(summary.totals[m.key])}</Text> / {targets[m.key]} g
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-card-2">
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: nutrientColor(m.key),
                  width: `${Math.min(100, (summary.totals[m.key] / targets[m.key]) * 100)}%`,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      {MEALS.map((meal) => {
        const mealEntries = summary.entries.filter((e) => e.meal === meal.value);
        const kcal = sumNutrients(mealEntries.map((e) => e.nutrients)).kcal;
        return (
          <View key={meal.value} className="gap-2 rounded-[18px] bg-card p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-ink">{meal.label}</Text>
              {mealEntries.length > 0 && <Text className="text-sm text-text-2">{formatNumber(kcal)} kcal</Text>}
            </View>
            {mealEntries.map((entry) => (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                onPress={() => editEntry(entry)}
                className="flex-row items-center justify-between border-b border-grid py-2.5"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-ink">{entry.food.name}</Text>
                  <Text className="text-xs text-text-2">{entry.grams} g</Text>
                </View>
                <Text className="text-sm text-text">{formatNumber(entry.nutrients.kcal)} kcal</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add food to ${meal.label}`}
              onPress={() => addFood(meal.value)}
              className="min-h-12 flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed border-grid"
            >
              <Plus color={colors.accent} size={18} />
              <Text className="text-base font-semibold text-accent">Add food</Text>
            </Pressable>
          </View>
        );
      })}
    </Screen>
  );
}

interface DayButtonProps {
  label: string;
  direction: 'back' | 'forward';
  disabled?: boolean;
  onPress: () => void;
}

function DayButton({ label, direction, disabled = false, onPress }: DayButtonProps) {
  const Icon = direction === 'back' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`size-10 items-center justify-center rounded-full bg-card-2 ${disabled ? 'opacity-40' : ''}`}
    >
      <Icon color={colors.text} size={20} />
    </Pressable>
  );
}

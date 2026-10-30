import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { NumberField } from '@/components/number-field';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { formatDay, isIsoDate, toIsoDate } from '@/lib/dates';
import { MEALS, isMealType } from '@/lib/meals';
import { NutrientDot } from '@/components/nutrient-dot';
import { NUTRIENTS, nutrientsForGrams } from '@/lib/nutrients';
import type { Food, FoodSnapshot, IsoDate, LogEntry, MealType } from '@/lib/types';
import { getFood } from '@/services/food';
import { addEntry, getEntry, removeEntry, updateEntry } from '@/services/log';
import { useSessionWith } from '@/services/session';

/** `grams`, from a recent food, is the default amount; otherwise 100 g. */
type Params = { id: string; entry?: string; meal?: string; date?: string; grams?: string };

const DEFAULT_GRAMS = 100;

/** What the screen works on: a food to log to a day, or an existing entry to edit. */
type Target =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'new'; food: Food; date: IsoDate; meal: MealType; grams: number }
  | { status: 'edit'; entry: LogEntry };

/** Amount and meal for a food, then log it, or edit and delete an entry. */
export default function FoodDetail() {
  const session = useSessionWith('ready');
  const { id, entry, meal, date, grams } = useLocalSearchParams<Params>();
  const [target, setTarget] = useState<Target>({ status: 'loading' });
  const uid = session?.account.uid;

  useEffect(() => {
    if (!uid) return;
    let current = true;
    loadTarget(uid, { id, entry, meal, date, grams }, toIsoDate(new Date())).then(
      (t) => current && setTarget(t),
      (e: Error) => current && setTarget({ status: 'error', message: e.message }),
    );
    return () => {
      current = false;
    };
  }, [uid, id, entry, meal, date, grams]);

  if (!session) return null;
  if (target.status === 'loading') return <Message title="Add food" text="Loading…" />;
  if (target.status === 'error') return <Message title="Add food" text={target.message} />;
  return <EntryForm key={target.status} uid={session.account.uid} target={target} />;
}

async function loadTarget(uid: string, params: Params, today: IsoDate): Promise<Target> {
  if (params.entry) {
    const entry = await getEntry(uid, params.entry);
    if (!entry || entry.foodId !== params.id) return { status: 'error', message: 'This entry no longer exists.' };
    return { status: 'edit', entry };
  }

  const { meal, date } = params;
  if (!isMealType(meal) || !date || !isIsoDate(date) || date > today) {
    return { status: 'error', message: 'This link is not valid. Go back and choose a meal.' };
  }
  const food = await getFood(params.id);
  if (!food) return { status: 'error', message: 'This food was not found.' };
  const lastGrams = Number(params.grams);
  return { status: 'new', food, date, meal, grams: lastGrams > 0 ? lastGrams : DEFAULT_GRAMS };
}

function Message({ title, text }: { title: string; text: string }) {
  const router = useRouter();
  return (
    <Screen>
      <ScreenHeader title={title} icon="back" onPress={() => router.back()} />
      <Text className="text-base text-text-2">{text}</Text>
    </Screen>
  );
}

interface EntryFormProps {
  uid: string;
  target: Extract<Target, { status: 'new' | 'edit' }>;
}

function EntryForm({ uid, target }: EntryFormProps) {
  const router = useRouter();
  const editing = target.status === 'edit';
  const food: FoodSnapshot = editing ? target.entry.food : target.food;
  const [grams, setGrams] = useState(String(editing ? target.entry.grams : target.grams));
  const [meal, setMeal] = useState<MealType>(editing ? target.entry.meal : target.meal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = Number(grams);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const nutrients = validAmount ? nutrientsForGrams(food.nutrientsPer100g, amount) : null;
  const per100g = food.nutrientsPer100g;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.dismissAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const save = () =>
    run(() =>
      editing
        ? updateEntry(uid, target.entry, { meal, grams: amount })
        : addEntry(uid, target.food, { meal, grams: amount }, target.date, toIsoDate(new Date())),
    );

  return (
    <Screen>
      <ScreenHeader
        title={editing ? 'Edit entry' : 'Add food'}
        icon={editing ? 'close' : 'back'}
        onPress={() => router.back()}
      />
      <View>
        <Text className="text-[22px] font-extrabold text-ink">{food.name}</Text>
        <Text className="text-xs text-text-2">
          {food.brand ? `${food.brand} · ` : ''}per 100 g: {per100g.kcal} kcal · P {per100g.proteinG} · C{' '}
          {per100g.carbsG} · F {per100g.fatG}
        </Text>
      </View>

      <NumberField label="Amount" unit="g" decimal autoFocus value={grams} onChange={setGrams} />

      <Field label="Meal">
        <Segmented options={MEALS} value={meal} onChange={setMeal} />
      </Field>

      {nutrients ? (
        <View className="flex-row flex-wrap gap-2">
          {NUTRIENTS.map((t) => (
            <View key={t.key} className="min-w-[45%] flex-1 rounded-xl bg-card-2 px-3 py-2">
              <View className="flex-row items-center gap-1.5">
                <NutrientDot nutrient={t.key} />
                <Text className="text-xs text-text-2">{t.label}</Text>
              </View>
              <Text className="text-[22px] font-extrabold text-ink">
                {nutrients[t.key]}
                {t.key === 'kcal' ? '' : t.unit}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-base text-text-2">Enter an amount in grams.</Text>
      )}

      <Button
        label={editing ? 'Save changes' : `Log to ${formatDay(target.date, toIsoDate(new Date()))}`}
        disabled={!validAmount || busy}
        onPress={save}
      />
      {editing && (
        <Button
          label="Delete entry"
          variant="ghost"
          disabled={busy}
          onPress={() => run(() => removeEntry(uid, target.entry.id))}
        />
      )}
      {error && <Text className="text-center text-sm text-carbs">{error}</Text>}
    </Screen>
  );
}

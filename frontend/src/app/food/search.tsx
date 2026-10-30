import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { isIsoDate, toIsoDate } from '@/lib/dates';
import { MEALS, isMealType } from '@/lib/meals';
import type { Food, FoodSnapshot } from '@/lib/types';
import { searchFoods } from '@/services/food';
import { recentFoods, type RecentFood } from '@/services/log';
import { useSessionWith } from '@/services/session';

import colors from '../../../colors';

/** Wait this long after typing stops, to stay within Edamam's rate limit. */
const SEARCH_DELAY_MS = 300;
const RECENT_COUNT = 6;

type Results = { status: 'idle' } | { status: 'loading' } | { status: 'done'; foods: Food[] } | { status: 'error'; message: string };

/** The answer for one query. */
type Answer = { query: string; foods: Food[] } | { query: string; error: string };

/** Search foods by name, or pick a recent one. Params: meal and date to log to, and the entry just logged. */
export default function FoodSearch() {
  const session = useSessionWith('ready');
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string; date?: string; logged?: string }>();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [recent, setRecent] = useState<RecentFood[]>([]);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const uid = session?.account.uid;
  const { logged } = params;

  // Reloads after each log, so the food just logged shows as recent.
  useEffect(() => {
    if (!uid) return;
    recentFoods(uid, RECENT_COUNT).then(setRecent, () => setRecent([]));
  }, [uid, logged]);

  // After a food is logged, start over for the next one.
  const [clearedFor, setClearedFor] = useState(logged);
  if (logged !== clearedFor) {
    setClearedFor(logged);
    setQuery('');
  }
  useEffect(() => {
    if (logged) input.current?.focus();
  }, [logged]);

  const trimmed = query.trim();
  useEffect(() => {
    if (!trimmed) return;
    const timer = setTimeout(() => {
      searchFoods(trimmed).then(
        (foods) => setAnswer({ query: trimmed, foods }),
        (e: Error) => setAnswer({ query: trimmed, error: e.message }),
      );
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  if (!session) return null;

  // An answer for an older query counts as still loading, so late answers never show.
  const results: Results = !trimmed
    ? { status: 'idle' }
    : answer?.query !== trimmed
      ? { status: 'loading' }
      : 'error' in answer
        ? { status: 'error', message: answer.error }
        : { status: 'done', foods: answer.foods };

  const { meal, date } = params;
  if (!isMealType(meal) || !date || !isIsoDate(date) || date > toIsoDate(new Date())) {
    return (
      <Screen>
        <ScreenHeader title="Add food" icon="close" onPress={() => router.back()} />
        <Text className="text-base text-text-2">This link is not valid. Go back and choose a meal.</Text>
      </Screen>
    );
  }

  const mealLabel = MEALS.find((m) => m.value === meal)?.label;
  const pick = (foodId: string) => router.push({ pathname: '/food/[id]', params: { id: foodId, meal, date } });

  return (
    <Screen>
      <ScreenHeader title={`Add to ${mealLabel}`} icon="close" onPress={() => router.back()} />
      <TextInput
        ref={input}
        accessibilityLabel="Search foods"
        autoFocus
        autoCorrect={false}
        inputMode="search"
        placeholder="Search foods, e.g. banana"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        className="min-h-12 rounded-full border border-grid bg-card px-4 text-base text-text"
      />
      <ResultList results={results} query={query} recent={recent} onPick={pick} />
    </Screen>
  );
}

interface ResultListProps {
  results: Results;
  query: string;
  recent: RecentFood[];
  onPick: (foodId: string) => void;
}

function ResultList({ results, query, recent, onPick }: ResultListProps) {
  if (results.status === 'idle') {
    if (recent.length === 0) return <Text className="text-base text-text-2">Search for a food by name.</Text>;
    return <FoodList title="Recent" items={recent.map((r) => ({ id: r.foodId, food: r.food }))} onPick={onPick} />;
  }
  if (results.status === 'loading') return <Text className="text-base text-text-2">Searching…</Text>;
  if (results.status === 'error') {
    return <Text className="text-base text-carbs">Search failed: {results.message}</Text>;
  }
  if (results.foods.length === 0) {
    return (
      <Text className="text-base text-text-2">
        No results for “{query.trim()}”. Custom foods aren&apos;t in the MVP.
      </Text>
    );
  }
  return <FoodList title="Results" items={results.foods.map((f) => ({ id: f.id, food: f }))} onPick={onPick} />;
}

interface FoodListProps {
  title: string;
  items: { id: string; food: FoodSnapshot }[];
  onPick: (foodId: string) => void;
}

function FoodList({ title, items, onPick }: FoodListProps) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-wider text-text-2">{title}</Text>
      <View className="rounded-[18px] bg-card px-4">
        {items.map(({ id, food }, i) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            onPress={() => onPick(id)}
            className={`flex-row items-center py-3 ${i > 0 ? 'border-t border-grid' : ''}`}
          >
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-ink">{food.name}</Text>
              <Text className="text-xs text-text-2">
                {food.brand ? `${food.brand} · ` : ''}
                {food.nutrientsPer100g.kcal} kcal per 100 g
              </Text>
            </View>
            <ChevronRight color={colors.text} size={18} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

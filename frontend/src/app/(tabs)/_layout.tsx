import { useRouter } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Apple, LayoutDashboard, Plus, Sparkles, User, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlusSheet } from '@/components/plus-sheet';
import { WeightSheet } from '@/components/weight-sheet';
import { toIsoDate } from '@/lib/dates';
import { mealAt } from '@/lib/meals';
import type { IsoDate } from '@/lib/types';
import { useSessionWith } from '@/services/session';

import colors from '../../../colors';

/** Tab bar from the mockup: Dashboard · Food Log · + · Coach (not in MVP) · Profile. */
export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSessionWith('ready');
  const [plusOpen, setPlusOpen] = useState(false);
  const [weightDate, setWeightDate] = useState<IsoDate | null>(null);

  function logFood() {
    const now = new Date();
    setPlusOpen(false);
    router.push({ pathname: '/food/search', params: { meal: mealAt(now), date: toIsoDate(now) } });
  }

  function logWeight() {
    setPlusOpen(false);
    setWeightDate(toIsoDate(new Date()));
  }

  return (
    <Tabs className="flex-1 bg-bg">
      {/* Its default flexShrink: 0 lets a tab grow past the screen, so the tab's ScrollView cannot scroll. */}
      <TabSlot style={{ flexShrink: 1, minHeight: 0 }} />
      <TabList
        className="flex-row items-end justify-around border-t border-grid bg-card"
        style={{ paddingBottom: insets.bottom }}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon={LayoutDashboard} label="Dashboard" />
        </TabTrigger>
        <TabTrigger name="log" href="/log" asChild>
          <TabButton icon={Apple} label="Food Log" />
        </TabTrigger>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log food or weight"
          onPress={() => setPlusOpen(true)}
          className="-mt-5 size-14 items-center justify-center rounded-full border-4 border-bg bg-accent"
        >
          <Plus color="#fff" size={26} />
        </Pressable>
        <View accessibilityLabel="Coach, not in the MVP" aria-disabled className="min-h-14 flex-1 items-center justify-center gap-0.5 opacity-40">
          <Sparkles color={colors.muted} size={22} />
          <Text className="text-xs text-muted">Coach</Text>
        </View>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon={User} label="Profile" />
        </TabTrigger>
      </TabList>
      <PlusSheet visible={plusOpen} onLogFood={logFood} onLogWeight={logWeight} onClose={() => setPlusOpen(false)} />
      {session && <WeightSheet uid={session.account.uid} date={weightDate} onClose={() => setWeightDate(null)} />}
    </Tabs>
  );
}

// Without `ref`: its type in TabTriggerSlotProps does not match React Native 0.88, and the button needs no ref.
type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { icon: LucideIcon; label: string };

function TabButton({ icon: Icon, label, isFocused, ref: _ref, ...props }: TabButtonProps & { ref?: unknown }) {
  const color = isFocused ? colors.accent : colors['text-2'];
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      className="min-h-14 flex-1 items-center justify-center"
    >
      {/* TabTrigger gives the button an inline row layout, so the column is set on this inner view. */}
      <View className="items-center gap-0.5">
        <Icon color={color} size={22} />
        <Text style={{ color }} className="text-xs font-medium">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

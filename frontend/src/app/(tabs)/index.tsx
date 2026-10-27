import { Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { useSessionWith } from '@/services/session';

// Placeholder until the Dashboard is built.
export default function Dashboard() {
  const session = useSessionWith('ready');
  if (!session) return null;

  return (
    <Screen>
      <Text className="text-[30px] font-extrabold text-ink">Dashboard</Text>
      <View className="rounded-[18px] bg-card p-4">
        <Text className="text-base text-text-2">Daily target: {session.user.targets.kcal} kcal</Text>
      </View>
    </Screen>
  );
}

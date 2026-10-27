import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { signOut } from '@/services/auth';
import { useSessionWith } from '@/services/session';

// Placeholder until the tabs are built: shows who is signed in.
export default function Home() {
  const session = useSessionWith('ready');
  if (!session) return null;

  return (
    <Screen>
      <View className="gap-3 rounded-[18px] bg-card p-4">
        <Text className="text-[26px] font-extrabold text-ink">Hi, {session.user.displayName || 'there'}</Text>
        <Text className="text-base text-text-2">
          Daily target: {session.user.targets.kcal} kcal
        </Text>
        <Button label="Sign out" variant="outline" onPress={signOut} />
      </View>
    </Screen>
  );
}

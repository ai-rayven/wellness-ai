import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { signOut } from '@/services/auth';
import { useSessionWith } from '@/services/session';

// Placeholder until the Profile screen is built: shows who is signed in.
export default function Profile() {
  const session = useSessionWith('ready');
  if (!session) return null;

  return (
    <Screen>
      <Text className="text-[30px] font-extrabold text-ink">Profile</Text>
      <View className="gap-3 rounded-[18px] bg-card p-4">
        <Text className="text-base text-text">{session.user.displayName || session.user.email}</Text>
        <Button label="Sign out" variant="outline" onPress={signOut} />
      </View>
    </Screen>
  );
}

import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { signInWithGoogle } from '@/services/auth';

// The user closed the popup or opened a second one: not an error to show.
const CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export default function SignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (!(e instanceof FirebaseError && CANCELLED.includes(e.code))) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View className="items-center gap-3 pt-10">
        <Image source={require('../../assets/icon.png')} accessibilityIgnoresInvertColors className="size-24" />
        <Text className="text-[34px] font-extrabold text-ink">Sano</Text>
        <Text className="text-base text-text-2">Log what you eat and your weight.</Text>
        <View className="w-full max-w-[340px] pt-2">
          <Button label="Continue with Google" variant="outline" disabled={busy} onPress={onGoogle} />
        </View>
        {error && <Text className="text-center text-sm text-carbs">{error}</Text>}
      </View>
    </Screen>
  );
}

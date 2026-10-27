import '../global.css';

import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { SessionProvider, useSession } from '@/services/session';

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootStack />
    </SessionProvider>
  );
}

/** Sends users to sign-in, then setup, then the app. */
function RootStack() {
  const session = useSession();
  if (session.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#2f7a3b" />
      </View>
    );
  }
  if (session.status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-center text-text">Sano could not load your data: {session.message}</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={session.status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={session.status === 'needsSetup'}>
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={session.status === 'ready'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="food/search" />
        <Stack.Screen name="food/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

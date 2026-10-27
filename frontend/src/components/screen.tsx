import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Full-height page on the cream background, as wide as a phone at most. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="mx-auto w-full max-w-[480px] gap-4 p-4">{children}</ScrollView>
    </SafeAreaView>
  );
}

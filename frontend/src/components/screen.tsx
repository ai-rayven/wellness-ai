import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  /** Above the tab bar, which already keeps clear of the bottom of the screen. */
  inTabs?: boolean;
}

/** Full-height page on the cream background, as wide as a phone at most. */
export function Screen({ children, inTabs = false }: ScreenProps) {
  return (
    <SafeAreaView edges={inTabs ? ['top', 'left', 'right'] : undefined} className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="mx-auto w-full max-w-[480px] gap-4 p-4"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

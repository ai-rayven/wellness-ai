import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

/** A label above its input. `hint` shows at the right end of the label row, e.g. a derived value. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[13px] font-semibold text-text-2">{label}</Text>
        {hint && <Text className="text-[13px] text-text-2">{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

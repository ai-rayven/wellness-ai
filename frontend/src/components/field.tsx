import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-semibold text-text-2">{label}</Text>
      {children}
    </View>
  );
}

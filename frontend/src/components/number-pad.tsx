import { Delete } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { Key } from '@/lib/keypad';

import colors from '../../colors';

const ROWS: Key[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

const LABELS: Partial<Record<Key, string>> = { '.': 'Decimal point', backspace: 'Backspace' };

/**
 * Number keys inside the app. The phone keyboard is not used: in an iOS PWA it hides the bottom of the
 * screen and the page cannot reliably tell where it is.
 */
export function NumberPad({ onPress }: { onPress: (key: Key) => void }) {
  return (
    <View className="gap-2">
      {ROWS.map((row) => (
        <View key={row.join()} className="flex-row gap-2">
          {row.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={LABELS[key] ?? key}
              onPress={() => onPress(key)}
              className="h-14 flex-1 items-center justify-center rounded-xl bg-card-2 active:opacity-60"
            >
              {key === 'backspace' ? (
                <Delete color={colors.text} size={24} />
              ) : (
                <Text className="text-2xl text-ink">{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

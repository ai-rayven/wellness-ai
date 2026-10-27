import { Pressable, Text, View } from 'react-native';

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row gap-[3px] rounded-xl bg-card-2 p-[3px]">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(option.value)}
            className={`min-h-10 flex-1 items-center justify-center rounded-[9px] ${on ? 'bg-card shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-semibold ${on ? 'text-text' : 'text-text-2'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

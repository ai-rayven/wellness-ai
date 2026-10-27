import { Text, TextInput, View } from 'react-native';

interface NumberFieldProps {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  /** Allows one decimal point, e.g. for grams. */
  decimal?: boolean;
  autoFocus?: boolean;
}

const keepDigits = (text: string) => text.replace(/\D/g, '');
const keepDecimal = (text: string) => {
  const [whole, ...rest] = text.replace(/[^\d.]/g, '').split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
};

/** A number input with its label above and its unit on the right. */
export function NumberField({ label, unit, value, onChange, decimal = false, autoFocus = false }: NumberFieldProps) {
  return (
    <View className="flex-1 rounded-xl bg-card-2 px-3 py-2">
      <Text className="text-xs text-text-2">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        <TextInput
          accessibilityLabel={label}
          inputMode={decimal ? 'decimal' : 'numeric'}
          autoFocus={autoFocus}
          selectTextOnFocus
          value={value}
          onChangeText={(text) => onChange(decimal ? keepDecimal(text) : keepDigits(text))}
          className="min-w-0 flex-1 text-lg text-text"
        />
        <Text className="text-[13px] text-text-2">{unit}</Text>
      </View>
    </View>
  );
}

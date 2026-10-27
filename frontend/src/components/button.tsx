import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
}

const BOX = {
  primary: 'bg-accent',
  outline: 'bg-card border border-grid',
  ghost: 'bg-card-2',
};
const LABEL = {
  primary: 'text-white',
  outline: 'text-text',
  ghost: 'text-text',
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`min-h-12 w-full items-center justify-center rounded-xl px-4 ${BOX[variant]} ${disabled ? 'opacity-45' : ''}`}
    >
      <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}

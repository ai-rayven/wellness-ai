import { ChevronLeft, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import colors from '../../colors';

interface ScreenHeaderProps {
  title: string;
  icon: 'close' | 'back';
  onPress: () => void;
}

export function ScreenHeader({ title, icon, onPress }: ScreenHeaderProps) {
  const Icon = icon === 'close' ? X : ChevronLeft;
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={icon === 'close' ? 'Close' : 'Back'}
        onPress={onPress}
        className="size-10 items-center justify-center rounded-full bg-card-2"
      >
        <Icon color={colors.text} size={20} />
      </Pressable>
      <Text className="text-lg font-bold text-ink">{title}</Text>
    </View>
  );
}

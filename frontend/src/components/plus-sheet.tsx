import { Apple } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import colors from '../../colors';

import { Button } from './button';

interface PlusSheetProps {
  visible: boolean;
  onLogFood: () => void;
  onClose: () => void;
}

/** The sheet behind the center + button: the only way to start logging. */
export function PlusSheet({ visible, onLogFood, onClose }: PlusSheetProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" className="flex-1 bg-black/30" onPress={onClose} />
      <View className="mx-auto w-full max-w-[480px] gap-3 rounded-t-[22px] bg-bg p-4 pb-8">
        <Pressable
          accessibilityRole="button"
          onPress={onLogFood}
          className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-card px-4"
        >
          <Apple color={colors.brand} size={22} />
          <Text className="text-base font-bold text-ink">Log food</Text>
        </Pressable>
        <Button label="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}

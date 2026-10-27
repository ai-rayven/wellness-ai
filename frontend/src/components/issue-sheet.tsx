import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { reportIssue, type Issue } from '@/services/issues';

import colors from '../../colors';

// The same limits as the reportIssue function.
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

interface IssueSheetProps {
  visible: boolean;
  onClose: () => void;
  onSent: (issue: Issue) => void;
}

/**
 * A tall sheet to report an issue. The fields and Send are at the top, because the phone keyboard
 * covers the bottom half of the screen.
 */
export function IssueSheet({ visible, onClose, onSent }: IssueSheetProps) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      {visible && <IssueForm onClose={onClose} onSent={onSent} />}
    </Modal>
  );
}

function IssueForm({ onClose, onSent }: Omit<IssueSheetProps, 'visible'>) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onSent(await reportIssue({ title, description }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const canSend = !!title.trim() && !busy;
  return (
    <View className="flex-1 justify-end">
      <Pressable accessibilityLabel="Close" className="absolute inset-0 bg-black/30" onPress={onClose} />
      <View className="mx-auto h-[92%] w-full max-w-[480px] gap-3 rounded-t-[22px] bg-bg p-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="size-10 items-center justify-center rounded-full bg-card-2"
          >
            <X color={colors.text} size={20} />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-ink">Report an issue</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canSend}
            onPress={send}
            className={`min-h-10 justify-center rounded-full bg-accent px-4 ${canSend ? '' : 'opacity-45'}`}
          >
            <Text className="text-base font-semibold text-white">Send</Text>
          </Pressable>
        </View>
        {error && <Text className="text-center text-sm text-carbs">{error}</Text>}
        <TextInput
          accessibilityLabel="Issue title"
          placeholder="Title"
          placeholderTextColor={colors.muted}
          autoFocus
          maxLength={MAX_TITLE_LENGTH}
          value={title}
          onChangeText={setTitle}
          className="rounded-xl bg-card-2 px-3 py-3 text-base text-text"
        />
        <TextInput
          accessibilityLabel="Issue description"
          placeholder="What happened, and what did you expect?"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={description}
          onChangeText={setDescription}
          className="h-40 rounded-xl bg-card-2 px-3 py-3 text-base text-text"
          style={{ textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}

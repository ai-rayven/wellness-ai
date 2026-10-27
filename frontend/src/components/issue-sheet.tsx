import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { MAX_SCREENSHOTS, reportIssue, type Issue } from '@/services/issues';

import colors from '../../colors';

import { Button } from './button';
import { ScreenshotPicker, type Screenshot } from './screenshot-picker';

// The same limits as the reportIssue function.
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

interface IssueSheetProps {
  uid: string;
  visible: boolean;
  onClose: () => void;
  onSent: (issue: Issue) => void;
}

/**
 * A tall sheet to report an issue, with Send at the bottom in reach of the thumb. The phone keyboard
 * covers Send while it is open, so the fields are at the top and the keyboard is not opened at the start.
 */
export function IssueSheet({ uid, visible, onClose, onSent }: IssueSheetProps) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      {visible && <IssueForm uid={uid} onClose={onClose} onSent={onSent} />}
    </Modal>
  );
}

function IssueForm({ uid, onClose, onSent }: Omit<IssueSheetProps, 'visible'>) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onSent(await reportIssue(uid, { title, description, screenshots: screenshots.map((s) => s.file) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 justify-end">
      <Pressable accessibilityLabel="Close" className="absolute inset-0 bg-black/30" onPress={onClose} />
      <View className="mx-auto h-[92%] w-full max-w-[480px] gap-3 rounded-t-[22px] bg-bg p-4 pb-8">
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
          <View className="size-10" />
        </View>
        <TextInput
          accessibilityLabel="Issue title"
          placeholder="Title"
          placeholderTextColor={colors.muted}
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
          className="flex-1 rounded-xl bg-card-2 px-3 py-3 text-base text-text"
          style={{ textAlignVertical: 'top' }}
        />
        <ScreenshotPicker screenshots={screenshots} max={MAX_SCREENSHOTS} onChange={setScreenshots} />
        <Text className="text-center text-xs text-text-2">Issues are public on GitHub, with their screenshots.</Text>
        {error && <Text className="text-center text-sm text-carbs">{error}</Text>}
        <Button label={busy ? 'Sending…' : 'Send'} disabled={!title.trim() || busy} onPress={send} />
      </View>
    </View>
  );
}

import { Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { isIsoDate, toIsoDate } from '@/lib/dates';
import type { IsoDate, WeightEntry } from '@/lib/types';
import { parseWeightLb } from '@/lib/weight';
import { removeWeight, setWeight, watchWeights } from '@/services/weight';

import colors from '../../colors';

import { Button } from './button';
import { DateField } from './date-field';
import { NumberField } from './number-field';

interface WeightSheetProps {
  uid: string;
  /** Shows the sheet, open on this day. Null hides it. */
  date: IsoDate | null;
  onClose: () => void;
}

/** A sheet from the bottom to log, change or delete the weight of one day. */
export function WeightSheet({ uid, date, onClose }: WeightSheetProps) {
  return (
    <Modal transparent animationType="slide" visible={date !== null} onRequestClose={onClose}>
      {date && <WeightForm uid={uid} initialDate={date} onClose={onClose} />}
    </Modal>
  );
}

interface WeightFormProps {
  uid: string;
  initialDate: IsoDate;
  onClose: () => void;
}

function WeightForm({ uid, initialDate, onClose }: WeightFormProps) {
  const today = toIsoDate(new Date());
  const keyboardInset = useKeyboardInset();
  const [date, setDate] = useState<IsoDate>(initialDate);
  const [existing, setExisting] = useState<WeightEntry | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weightLb = parseWeightLb(text);

  // Watches the selected day. The first value fills the field if it is still empty,
  // so a logged day opens ready to change and a fast user keeps what they typed.
  useEffect(() => {
    let first = true;
    return watchWeights(
      uid,
      date,
      date,
      ([entry]) => {
        setExisting(entry ?? null);
        if (first && entry) setText((typed) => typed || String(entry.weightLb));
        first = false;
      },
      (e) => setError(e.message),
    );
  }, [uid, date]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const save = () => weightLb !== null && run(() => setWeight(uid, { date, weightLb }, today));
  const remove = () => run(() => removeWeight(uid, date));
  function pickDate(value: string) {
    setDate(isIsoDate(value) && value <= today ? value : today);
    setText('');
  }

  return (
    <View className="flex-1 justify-end" style={{ paddingBottom: keyboardInset }}>
      <Pressable accessibilityLabel="Close" className="absolute inset-0 bg-black/30" onPress={onClose} />
      <View className="mx-auto w-full max-w-[480px] gap-4 rounded-t-[22px] bg-bg p-4 pb-8">
        <View className="flex-row items-center gap-3">
          <SheetIcon label="Close" icon={X} onPress={onClose} />
          <View className="flex-1 items-center gap-1">
            <View className="w-44">
              <DateField label="Date" value={date} max={today} onChange={pickDate} />
            </View>
            <Text className="text-sm text-text-2">Weight</Text>
          </View>
          {existing ? (
            <SheetIcon label="Delete" icon={Trash2} disabled={busy} onPress={remove} />
          ) : (
            <View className="size-10" />
          )}
        </View>
        <NumberField label="Weight" unit="lb" decimal autoFocus value={text} onChange={setText} />
        <Button label="Save" disabled={weightLb === null || busy} onPress={save} />
        {error && <Text className="text-center text-sm text-carbs">{error}</Text>}
      </View>
    </View>
  );
}

interface SheetIconProps {
  label: string;
  icon: typeof X;
  onPress: () => void;
  disabled?: boolean;
}

function SheetIcon({ label, icon: Icon, onPress, disabled = false }: SheetIconProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className="size-10 items-center justify-center rounded-full bg-card-2"
    >
      <Icon color={colors.text} size={20} />
    </Pressable>
  );
}

/**
 * The height of the on-screen keyboard on the web. iOS Safari does not resize the page for the keyboard,
 * so without this the keyboard covers a sheet at the bottom.
 */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

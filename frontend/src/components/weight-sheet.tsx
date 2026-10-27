import { Trash2, X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { isIsoDate, toIsoDate } from '@/lib/dates';
import { pressKey, type Key } from '@/lib/keypad';
import type { IsoDate, WeightEntry } from '@/lib/types';
import { parseWeightLb } from '@/lib/weight';
import { removeWeight, setWeight, watchWeights } from '@/services/weight';

import colors from '../../colors';

import { Button } from './button';
import { DateField } from './date-field';
import { NumberPad } from './number-pad';

// Up to 1000 lb (MAX_WEIGHT_LB), stored to 0.1 lb.
const WEIGHT_LIMITS = { whole: 4, decimals: 1 };

/** The weight as typed. `filled` means it came from the log, and the first key replaces it. */
interface WeightInput {
  text: string;
  filled: boolean;
}

const EMPTY: WeightInput = { text: '', filled: false };

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
  const [date, setDate] = useState<IsoDate>(initialDate);
  const [existing, setExisting] = useState<WeightEntry | null>(null);
  const [input, setInput] = useState<WeightInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weightLb = parseWeightLb(input.text);

  // Watches the selected day. The first value fills the weight if nothing is typed yet.
  useEffect(() => {
    let first = true;
    return watchWeights(
      uid,
      date,
      date,
      ([entry]) => {
        setExisting(entry ?? null);
        if (first && entry) setInput((typed) => (typed.text ? typed : { text: String(entry.weightLb), filled: true }));
        first = false;
      },
      (e) => setError(e.message),
    );
  }, [uid, date]);

  function press(key: Key) {
    setInput(({ text, filled }) => ({
      text: pressKey(filled && key !== 'backspace' ? '' : text, key, WEIGHT_LIMITS),
      filled: false,
    }));
  }

  function pickDate(value: string) {
    setDate(isIsoDate(value) && value <= today ? value : today);
    setInput(EMPTY);
  }

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

  return (
    <View className="flex-1 justify-end">
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
        <View className="min-h-14 flex-row items-center rounded-xl border-2 border-accent bg-card px-4">
          <Text accessibilityLabel="Weight" className={`flex-1 text-2xl ${input.filled ? 'text-text-2' : 'text-ink'}`}>
            {input.text}
          </Text>
          <Text className="text-lg text-text-2">lb</Text>
        </View>
        <Button label="Save" disabled={weightLb === null || busy} onPress={save} />
        {error && <Text className="text-center text-sm text-carbs">{error}</Text>}
        <NumberPad onPress={press} />
      </View>
    </View>
  );
}

interface SheetIconProps {
  label: string;
  icon: LucideIcon;
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

import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { Field } from '@/components/field';
import { NumberField } from '@/components/number-field';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { ageOn, isIsoDate, toIsoDate } from '@/lib/dates';
import { DEFAULT_TARGETS, profileInputError, type ProfileInput } from '@/lib/profile';
import type { Nutrients, Sex } from '@/lib/types';
import { createProfile } from '@/services/profile';
import { useSessionWith } from '@/services/session';

const SEXES: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const TARGET_FIELDS: { key: keyof Nutrients; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbsG', label: 'Carbs', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
];

type TargetText = Record<keyof Nutrients, string>;

const toTargets = (text: TargetText): Nutrients => ({
  kcal: Number(text.kcal || NaN),
  proteinG: Number(text.proteinG || NaN),
  carbsG: Number(text.carbsG || NaN),
  fatG: Number(text.fatG || NaN),
});

export default function Setup() {
  const session = useSessionWith('needsSetup');
  const [sex, setSex] = useState<Sex>();
  const [birthDate, setBirthDate] = useState('');
  const [targets, setTargets] = useState<TargetText>({
    kcal: String(DEFAULT_TARGETS.kcal),
    proteinG: String(DEFAULT_TARGETS.proteinG),
    carbsG: String(DEFAULT_TARGETS.carbsG),
    fatG: String(DEFAULT_TARGETS.fatG),
  });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  if (!session) return null;

  const today = toIsoDate(new Date());
  const input: Partial<ProfileInput> = { sex, birthDate, targets: toTargets(targets) };
  const inputError = profileInputError(input, today);
  const age = isIsoDate(birthDate) && birthDate <= today ? ageOn(birthDate, today) : null;

  async function onContinue() {
    if (!session || inputError) return;
    setBusy(true);
    setSaveError(null);
    try {
      await createProfile(session.account, input as ProfileInput, today);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View className="gap-4 rounded-[18px] bg-card p-4">
        <Text className="text-[26px] font-extrabold text-ink">Set up your profile</Text>
        <Text className="text-base text-text-2">Used for your daily targets. You can change these later.</Text>

        <Field label="Sex">
          <Segmented options={SEXES} value={sex} onChange={setSex} />
        </Field>

        <Field label="Birth date">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <DateField label="Birth date" value={birthDate} max={today} onChange={setBirthDate} />
            </View>
            {age !== null && <Text className="text-sm text-text-2">Age {age}</Text>}
          </View>
        </Field>

        <Field label="Daily targets">
          <View className="gap-2">
            {[TARGET_FIELDS.slice(0, 2), TARGET_FIELDS.slice(2)].map((row) => (
              <View key={row[0].key} className="flex-row gap-2">
                {row.map((f) => (
                  <NumberField
                    key={f.key}
                    label={f.label}
                    unit={f.unit}
                    value={targets[f.key]}
                    onChange={(value) => setTargets({ ...targets, [f.key]: value })}
                  />
                ))}
              </View>
            ))}
          </View>
        </Field>

        <Button label="Continue" disabled={!!inputError || busy} onPress={onContinue} />
        {(saveError ?? inputError) && (
          <Text className="text-center text-sm text-text-2">{saveError ?? inputError}</Text>
        )}
      </View>
    </Screen>
  );
}

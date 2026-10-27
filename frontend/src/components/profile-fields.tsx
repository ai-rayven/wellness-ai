import { Text, View } from 'react-native';

import { ageOn, isIsoDate } from '@/lib/dates';
import { NUTRIENTS } from '@/lib/nutrients';
import type { ProfileInput } from '@/lib/profile';
import type { IsoDate, Nutrients, Sex } from '@/lib/types';

import { DateField } from './date-field';
import { Field } from './field';
import { NumberField } from './number-field';
import { Segmented } from './segmented';

const SEXES: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

/** The profile as typed: numbers stay text until they are saved. */
export interface ProfileDraft {
  sex: Sex | undefined;
  birthDate: string;
  targets: Record<keyof Nutrients, string>;
}

export function toDraft(input: Pick<ProfileInput, 'targets'> & Partial<ProfileInput>): ProfileDraft {
  return {
    sex: input.sex,
    birthDate: input.birthDate ?? '',
    targets: {
      kcal: String(input.targets.kcal),
      proteinG: String(input.targets.proteinG),
      carbsG: String(input.targets.carbsG),
      fatG: String(input.targets.fatG),
    },
  };
}

/** The draft as input for `profileInputError`. Empty numbers become NaN, so they are rejected. */
export function fromDraft(draft: ProfileDraft): Partial<ProfileInput> {
  const number = (text: string) => (text ? Number(text) : NaN);
  return {
    sex: draft.sex,
    birthDate: draft.birthDate,
    targets: {
      kcal: number(draft.targets.kcal),
      proteinG: number(draft.targets.proteinG),
      carbsG: number(draft.targets.carbsG),
      fatG: number(draft.targets.fatG),
    },
  };
}

interface ProfileFieldsProps {
  draft: ProfileDraft;
  today: IsoDate;
  onChange: (draft: ProfileDraft) => void;
}

/** Sex, birth date and daily targets: the fields of the setup screen and the Profile tab. */
export function ProfileFields({ draft, today, onChange }: ProfileFieldsProps) {
  const { birthDate } = draft;
  const age = isIsoDate(birthDate) && birthDate <= today ? ageOn(birthDate, today) : null;

  return (
    <>
      <Field label="Sex">
        <Segmented options={SEXES} value={draft.sex} onChange={(sex) => onChange({ ...draft, sex })} />
      </Field>

      <Field label="Birth date">
        <DateField
          label="Birth date"
          value={birthDate}
          max={today}
          onChange={(value) => onChange({ ...draft, birthDate: value })}
        />
        {age !== null && <Text className="text-sm text-text-2">Age {age}</Text>}
      </Field>

      <Field label="Daily targets">
        <View className="gap-2">
          {[NUTRIENTS.slice(0, 2), NUTRIENTS.slice(2)].map((row) => (
            <View key={row[0].key} className="flex-row gap-2">
              {row.map((n) => (
                <NumberField
                  key={n.key}
                  label={n.label}
                  unit={n.unit}
                  value={draft.targets[n.key]}
                  onChange={(value) => onChange({ ...draft, targets: { ...draft.targets, [n.key]: value } })}
                />
              ))}
            </View>
          ))}
        </View>
      </Field>
    </>
  );
}

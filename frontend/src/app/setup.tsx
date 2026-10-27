import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ProfileFields, fromDraft, toDraft } from '@/components/profile-fields';
import { Screen } from '@/components/screen';
import { toIsoDate } from '@/lib/dates';
import { DEFAULT_TARGETS, profileInputError, type ProfileInput } from '@/lib/profile';
import { createProfile } from '@/services/profile';
import { useSessionWith } from '@/services/session';

export default function Setup() {
  const session = useSessionWith('needsSetup');
  const [draft, setDraft] = useState(() => toDraft({ targets: DEFAULT_TARGETS }));
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  if (!session) return null;

  const today = toIsoDate(new Date());
  const input = fromDraft(draft);
  const inputError = profileInputError(input, today);

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
        <ProfileFields draft={draft} today={today} onChange={setDraft} />
        <Button label="Continue" disabled={!!inputError || busy} onPress={onContinue} />
        {(saveError ?? inputError) && (
          <Text className="text-center text-sm text-text-2">{saveError ?? inputError}</Text>
        )}
      </View>
    </Screen>
  );
}

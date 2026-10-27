import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { IssueSheet } from '@/components/issue-sheet';
import { ProfileFields, fromDraft, toDraft, type ProfileDraft } from '@/components/profile-fields';
import { Screen } from '@/components/screen';
import { toIsoDate } from '@/lib/dates';
import { profileInputError, type ProfileInput } from '@/lib/profile';
import type { User } from '@/lib/types';
import { signOut } from '@/services/auth';
import type { Issue } from '@/services/issues';
import { updateProfile } from '@/services/profile';
import { useSessionWith } from '@/services/session';

/** The account with sign-out, the profile fields from setup, and issue reports. */
export default function Profile() {
  const session = useSessionWith('ready');
  if (!session) return null;

  const { user } = session;
  return (
    <Screen inTabs>
      <Text className="text-[30px] font-extrabold text-ink">Profile</Text>

      <View className="gap-3 rounded-[18px] bg-card p-4">
        <Text className="text-base font-semibold text-ink">Account</Text>
        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-full bg-accent">
            <Text className="text-lg font-bold text-white">{(user.displayName || user.email || '?')[0].toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink">{user.displayName}</Text>
            <Text className="text-xs text-text-2">{user.email}</Text>
          </View>
          <View className="w-28">
            <Button label="Sign out" variant="ghost" onPress={signOut} />
          </View>
        </View>
      </View>

      {/* Keyed by the saved profile, so the form starts again from it after each save. */}
      <ProfileCard key={JSON.stringify([user.sex, user.birthDate, user.targets])} user={user} />

      <ReportIssue uid={user.id} />
    </Screen>
  );
}

function ProfileCard({ user }: { user: User }) {
  const saved = toDraft(user);
  const [draft, setDraft] = useState<ProfileDraft>(saved);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const today = toIsoDate(new Date());
  const input = fromDraft(draft);
  const inputError = profileInputError(input, today);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  async function save() {
    if (inputError) return;
    setBusy(true);
    setSaveError(null);
    try {
      await updateProfile(user.id, input as ProfileInput, today);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <View className="gap-4 rounded-[18px] bg-card p-4">
      <Text className="text-base font-semibold text-ink">Profile</Text>
      <ProfileFields draft={draft} today={today} onChange={setDraft} />
      <Button label="Save" disabled={!dirty || !!inputError || busy} onPress={save} />
      {dirty && (saveError ?? inputError) && (
        <Text className="text-center text-sm text-text-2">{saveError ?? inputError}</Text>
      )}
    </View>
  );
}

/** Opens the issue sheet, and shows the number of the last issue sent. */
function ReportIssue({ uid }: { uid: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<Issue | null>(null);

  function onSent(issue: Issue) {
    setOpen(false);
    setSent(issue);
  }

  return (
    <View className="gap-2">
      <Button label="Report an issue" variant="outline" onPress={() => setOpen(true)} />
      {sent && <Text className="text-center text-sm text-text-2">Issue #{sent.number} created. Thank you.</Text>}
      <IssueSheet uid={uid} visible={open} onClose={() => setOpen(false)} onSent={onSent} />
    </View>
  );
}

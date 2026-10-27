import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ProfileFields, fromDraft, toDraft, type ProfileDraft } from '@/components/profile-fields';
import { Screen } from '@/components/screen';
import { toIsoDate } from '@/lib/dates';
import { profileInputError, type ProfileInput } from '@/lib/profile';
import type { User } from '@/lib/types';
import { signOut } from '@/services/auth';
import { reportIssue } from '@/services/issues';
import { updateProfile } from '@/services/profile';
import { useSessionWith } from '@/services/session';

import colors from '../../../colors';

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

      <ReportIssueCard />
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

// The same limits as the reportIssue function.
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

function ReportIssueCard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    if (!title.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const issue = await reportIssue({ title, description });
      setTitle('');
      setDescription('');
      setResult(`Issue #${issue.number} created. Thank you.`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-3 rounded-[18px] bg-card p-4">
      <Text className="text-base font-semibold text-ink">Report an issue</Text>
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
        className="min-h-28 rounded-xl bg-card-2 px-3 py-3 text-base text-text"
        style={{ textAlignVertical: 'top' }}
      />
      <Button label="Send" disabled={!title.trim() || busy} onPress={send} />
      {result && <Text className="text-center text-sm text-text-2">{result}</Text>}
    </View>
  );
}

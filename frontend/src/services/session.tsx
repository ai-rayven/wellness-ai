import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { User } from '@/lib/types';

import { onAccountChanged, type Account } from './auth';
import { watchProfile } from './profile';

export type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'needsSetup'; account: Account }
  | { status: 'ready'; account: Account; user: User }
  | { status: 'error'; message: string };

const SessionContext = createContext<Session | null>(null);

/** Follows the signed-in account and its `users/{uid}` profile. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });

  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    const stopAccount = onAccountChanged((account) => {
      stopProfile?.();
      stopProfile = undefined;
      if (!account) return setSession({ status: 'signedOut' });

      setSession({ status: 'loading' });
      stopProfile = watchProfile(
        account.uid,
        (user) => setSession(user ? { status: 'ready', account, user } : { status: 'needsSetup', account }),
        (error) => setSession({ status: 'error', message: error.message }),
      );
    });
    return () => {
      stopProfile?.();
      stopAccount();
    };
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}

/**
 * The session when it has `status`, else null. A protected screen can render once more after its
 * guard changes (e.g. right after sign-out), so screens render nothing on null instead of failing.
 */
export function useSessionWith<S extends Session['status']>(status: S): Extract<Session, { status: S }> | null {
  const session = useSession();
  return session.status === status ? (session as Extract<Session, { status: S }>) : null;
}

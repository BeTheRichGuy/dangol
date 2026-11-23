'use client';

import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { putBack, takeClaims, type GuestClaim } from '@/lib/account/guest-claim';
import { AUTH_ENV, browserClient, ENABLED_METHODS, GOOGLE_DIRECT } from '@/lib/account/client';
import { authMode, safeNext, SUPABASE_PROVIDER, type AuthMethod, type AuthMode } from '@/lib/account/config';
import { PREVIEW_USER_KEY, previewSignIn, previewSignOut, previewStore, previewUser, type KeyValue } from '@/lib/account/preview-store';
import { supabaseStore } from '@/lib/account/supabase-store';
import type { AccountStore, AccountUser, JobState, Person, PersonDraft, ReadingDraft, SavedReading } from '@/lib/account/types';

export type SignInResult = 'redirecting' | 'signedIn' | 'sent' | 'error';

export interface AccountValue {
  mode: AuthMode;

  ready: boolean;
  user: AccountUser | null;
  methods: readonly AuthMethod[];
  people: Person[];
  readings: SavedReading[];

  loaded: boolean;
  failed: boolean;
  signIn(method: Exclude<AuthMethod, 'email'>, next: string): Promise<SignInResult>;
  signInEmail(email: string, next: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  savePerson(draft: PersonDraft, id?: string): Promise<Person>;
  deletePerson(id: string): Promise<void>;
  saveReading(draft: ReadingDraft): Promise<SavedReading>;

  background: boolean;

  startReading(draft: ReadingDraft): Promise<SavedReading>;

  jobStates(ids: string[]): Promise<JobState[]>;

  refresh(): Promise<void>;
  deleteReading(id: string): Promise<void>;
  getReading(id: string): Promise<SavedReading | null>;

  accessToken(): Promise<string | null>;
}

const Ctx = createContext<AccountValue | null>(null);

export function useAccount(): AccountValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount needs <AccountProvider>');
  return v;
}

export function useMaybeAccount(): AccountValue | null {
  return useContext(Ctx);
}

const kv: KeyValue = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {

    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {

    }
  },
};

const previewListeners = new Set<() => void>();
let previewRaw: string | null | undefined;
let previewCached: AccountUser | null = null;

function previewSnapshot(): AccountUser | null {
  const raw = kv.getItem(PREVIEW_USER_KEY);
  if (raw !== previewRaw) {
    previewRaw = raw;
    previewCached = previewUser(kv);
  }
  return previewCached;
}

function subscribePreview(fn: () => void) {
  previewListeners.add(fn);
  return () => {
    previewListeners.delete(fn);
  };
}

const emitPreview = () => previewListeners.forEach((fn) => fn());

const noopSubscribe = () => () => {};

const SESSION_WAIT_MS = 4000;
const clientMode = (): AuthMode => authMode(AUTH_ENV, window.location.hostname);

const serverMode = (): AuthMode => (AUTH_ENV ? 'supabase' : 'off');

function userOf(session: Session | null): AccountUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name = [meta.full_name, meta.name, meta.nickname].find((v): v is string => typeof v === 'string' && v.trim() !== '');
  return {
    id: u.id,
    email: u.email ?? null,
    displayName: name?.trim().slice(0, 24) ?? null,
    provider: typeof u.app_metadata?.provider === 'string' ? u.app_metadata.provider : null,
  };
}

function redirectUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface Lists {
  uid: string;
  people: Person[];
  readings: SavedReading[];
  failed: boolean;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(noopSubscribe, clientMode, serverMode);
  const preview = useSyncExternalStore(subscribePreview, previewSnapshot, () => null);
  const [session, setSession] = useState<{ known: boolean; user: AccountUser | null }>({ known: false, user: null });
  const [lists, setLists] = useState<Lists | null>(null);

  const store = useMemo<AccountStore | null>(() => {
    if (mode === 'supabase') {
      const sb = browserClient();
      return sb ? supabaseStore(sb) : null;
    }
    if (mode === 'preview') return previewStore(kv, { now: () => new Date().toISOString(), newId });
    return null;
  }, [mode]);

  useEffect(() => {
    if (mode !== 'supabase') return;
    const sb = browserClient();
    if (!sb) return;
    let alive = true;
    void sb.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setSession({ known: true, user: userOf(data.session) });
      })
      .catch(() => {
        if (alive) setSession((s) => (s.known ? s : { known: true, user: null }));
      });

    const giveUp = window.setTimeout(() => {
      if (alive) setSession((s) => (s.known ? s : { known: true, user: null }));
    }, SESSION_WAIT_MS);
    const { data } = sb.auth.onAuthStateChange((_event, s) => {
      if (alive) setSession({ known: true, user: userOf(s) });
    });
    return () => {
      alive = false;
      window.clearTimeout(giveUp);
      data.subscription.unsubscribe();
    };
  }, [mode]);

  const user = mode === 'supabase' ? session.user : mode === 'preview' ? preview : null;
  const ready = mode === 'supabase' ? session.known : true;
  const uid = user?.id ?? null;

  const reload = useCallback(async () => {
    if (!store || !uid) return;
    try {
      const [people, readings] = await Promise.all([store.listPeople(), store.listReadings()]);
      setLists({ uid, people, readings, failed: false });
    } catch {
      setLists((old) => ({ uid, people: old?.uid === uid ? old.people : [], readings: old?.uid === uid ? old.readings : [], failed: true }));
    }
  }, [store, uid]);

  useEffect(() => {
    if (!store || !uid) return;
    let alive = true;
    Promise.all([store.listPeople(), store.listReadings()]).then(
      ([people, readings]) => {
        if (alive) setLists({ uid, people, readings, failed: false });
      },
      () => {
        if (alive) setLists({ uid, people: [], readings: [], failed: true });
      },
    );
    return () => {
      alive = false;
    };
  }, [store, uid]);

  useEffect(() => {
    if (!store || !uid || typeof window === 'undefined') return;
    const claims = takeClaims(window.sessionStorage);
    if (!claims.length) return;
    let alive = true;
    void (async () => {
      const failed: GuestClaim[] = [];
      for (const c of claims) {
        try {
          await store.saveReading(c.draft);
        } catch {
          failed.push(c);
        }
      }
      putBack(window.sessionStorage, failed);
      if (alive && failed.length < claims.length) await reload();
    })();
    return () => {
      alive = false;
    };
  }, [store, uid, reload]);

  const mine = lists && uid && lists.uid === uid ? lists : null;

  const signIn = useCallback(
    async (method: Exclude<AuthMethod, 'email'>, next: string): Promise<SignInResult> => {
      if (mode === 'preview') {
        previewSignIn(kv, method, null);
        emitPreview();
        return 'signedIn';
      }
      const sb = browserClient();
      if (!sb) return 'error';
      if (method === 'google' && GOOGLE_DIRECT) {

        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/auth/google?next=${encodeURIComponent(safeNext(next))}`);
        return 'redirecting';
      }
      const { error } = await sb.auth.signInWithOAuth({ provider: SUPABASE_PROVIDER[method], options: { redirectTo: redirectUrl(next) } });
      return error ? 'error' : 'redirecting';
    },
    [mode],
  );

  const signInEmail = useCallback(
    async (email: string, next: string): Promise<SignInResult> => {
      if (mode === 'preview') {

        previewSignIn(kv, 'email', null);
        emitPreview();
        return 'signedIn';
      }
      const sb = browserClient();
      if (!sb) return 'error';
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl(next), shouldCreateUser: true } });
      return error ? 'error' : 'sent';
    },
    [mode],
  );

  const signOut = useCallback(async () => {
    if (mode === 'preview') {
      previewSignOut(kv);
      emitPreview();
      return;
    }
    await browserClient()?.auth.signOut();
  }, [mode]);

  const value = useMemo<AccountValue>(() => {
    const need = () => {
      if (!store || !uid) throw new Error('signed_out');
      return store;
    };
    return {
      mode,
      ready,
      user,
      methods: ENABLED_METHODS,
      people: mine?.people ?? [],
      readings: mine?.readings ?? [],
      loaded: mine !== null,
      failed: mine?.failed ?? false,
      signIn,
      signInEmail,
      signOut,
      async savePerson(draft, id) {
        const p = await need().savePerson(draft, id);
        await reload();
        return p;
      },
      async deletePerson(id) {
        await need().deletePerson(id);
        await reload();
      },
      async saveReading(draft) {
        const r = await need().saveReading(draft);
        await reload();
        return r;
      },
      background: mode === 'supabase',
      async startReading(draft) {
        const r = await need().startReading(draft);
        await reload();
        return r;
      },
      async jobStates(ids) {
        return need().jobStates(ids);
      },
      async refresh() {
        await reload();
      },
      async deleteReading(id) {
        await need().deleteReading(id);
        await reload();
      },
      async getReading(id) {
        return need().getReading(id);
      },
      async accessToken() {
        if (mode !== 'supabase') return null;
        const { data } = (await browserClient()?.auth.getSession()) ?? { data: { session: null } };
        return data.session?.access_token ?? null;
      },
    };
  }, [mode, ready, user, mine, store, uid, reload, signIn, signInEmail, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

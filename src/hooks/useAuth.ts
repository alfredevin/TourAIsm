import { useSyncExternalStore } from 'react';

import {
  authenticate,
  endSession,
  register,
  toSession,
  type AuthResult,
  type Session,
} from '../services/auth';
import { supabase, supabaseConfigured } from '../services/supabase';
import { clearLocalAccountData, startSync, stopSync } from '../services/sync';

type AuthStore = {
  session: Session | null;
  loaded: boolean;
};

let store: AuthStore = { session: null, loaded: false };
const listeners = new Set<() => void>();
let started = false;

function setStore(next: AuthStore) {
  store = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return store;
}

function apply(session: Session | null) {
  const previous = store.session;
  setStore({ session, loaded: true });
  if (session && session.id !== previous?.id) {
    void startSync(session.id);
  } else if (!session && previous) {
    stopSync();
    clearLocalAccountData();
  }
}

// Supabase restores the saved session and keeps the store in step with token refreshes,
// sign in, sign out and expiry. Safe to call more than once.
export async function loadAuth(): Promise<void> {
  if (!supabaseConfigured) {
    setStore({ session: null, loaded: true });
    return;
  }
  if (!started) {
    started = true;
    // Do not await Supabase calls inside this callback; it can deadlock the client.
    supabase.auth.onAuthStateChange((_event, next) => apply(toSession(next)));
  }
  const { data } = await supabase.auth.getSession();
  apply(toSession(data.session));
}

export async function signUp(input: {
  username: string;
  password: string;
}): Promise<AuthResult<Session>> {
  const result = await register(input);
  if (result.ok) apply(result.value);
  return result;
}

export async function signIn(input: {
  username: string;
  password: string;
}): Promise<AuthResult<Session>> {
  const result = await authenticate(input);
  if (result.ok) apply(result.value);
  return result;
}

export function signOut() {
  void endSession();
  apply(null);
}

export function useAuth(): AuthStore {
  return useSyncExternalStore(subscribe, getSnapshot);
}

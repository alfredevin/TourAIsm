import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../data/characters';
import { DEFAULT_NAME, DEFAULT_PROFILE, MAX_NAME_LENGTH, type Profile } from '../types/profile';

const PROFILE_KEY = 'profile_v1';

type ProfileStore = {
  profile: Profile;
  loaded: boolean;
};

let store: ProfileStore = { profile: DEFAULT_PROFILE, loaded: false };
const listeners = new Set<() => void>();

function setStore(next: ProfileStore) {
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

function parseCharacterId(value: unknown): string {
  return typeof value === 'string' && CHARACTERS.some((character) => character.id === value)
    ? value
    : DEFAULT_CHARACTER_ID;
}

function parseProfile(raw: string | null): Profile {
  if (raw === null) return DEFAULT_PROFILE;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
  if (typeof data !== 'object' || data === null) return DEFAULT_PROFILE;

  const saved = data as Record<string, unknown>;
  const name = saved.name;
  return {
    name: typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) || DEFAULT_NAME : DEFAULT_NAME,
    characterId: parseCharacterId(saved.characterId),
    showNameTag:
      typeof saved.showNameTag === 'boolean' ? saved.showNameTag : DEFAULT_PROFILE.showNameTag,
  };
}

export async function loadProfile(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(PROFILE_KEY);
  } catch {
    raw = null;
  }
  setStore({ profile: parseProfile(raw), loaded: true });
}

function commit(profile: Profile) {
  setStore({ profile, loaded: store.loaded });
  void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => undefined);
}

export function updateProfile(patch: Partial<Profile>) {
  commit({ ...store.profile, ...patch });
}

// Used by sync to apply the account's saved profile, or to clear it on log out.
export function replaceProfile(profile: Profile) {
  commit(profile);
}

export const subscribeProfile = subscribe;

export function getProfile(): Profile {
  return store.profile;
}

export function useProfile(): ProfileStore {
  return useSyncExternalStore(subscribe, getSnapshot);
}

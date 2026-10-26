import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance, StyleSheet } from 'react-native';

import { themes, type Scheme, type Theme, type ThemeMode } from '../theme';

const THEME_KEY = 'theme_mode_v1';

type ThemeStore = {
  mode: ThemeMode;
  // The scheme the UI renders with. ThemeTransition moves it to the target scheme
  // behind a fade, so a toggle never snaps.
  displayed: Scheme;
  loaded: boolean;
};

function systemScheme(): Scheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function resolveScheme(mode: ThemeMode, system: Scheme): Scheme {
  return mode === 'system' ? system : mode;
}

let store: ThemeStore = { mode: 'system', displayed: systemScheme(), loaded: false };
const listeners = new Set<() => void>();

function setStore(next: ThemeStore) {
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

function parseMode(value: string | null): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export async function loadTheme(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(THEME_KEY);
  } catch {
    raw = null;
  }
  const mode = parseMode(raw);
  // First paint: no transition, jump straight to the saved scheme.
  setStore({ mode, displayed: resolveScheme(mode, systemScheme()), loaded: true });
}

export function setThemeMode(mode: ThemeMode) {
  setStore({ ...store, mode });
  void AsyncStorage.setItem(THEME_KEY, mode).catch(() => undefined);
}

export function toggleTheme() {
  setThemeMode(store.displayed === 'dark' ? 'light' : 'dark');
}

export function setDisplayedScheme(scheme: Scheme) {
  if (store.displayed !== scheme) setStore({ ...store, displayed: scheme });
}

export function useThemeStore(): ThemeStore {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useTheme(): Theme {
  return themes[useThemeStore().displayed];
}

type StyleInput = Parameters<typeof StyleSheet.create>[0];

// Builds a hook that returns a StyleSheet for the current scheme. Each scheme is created once.
export function makeStyles<S extends StyleInput>(factory: (theme: Theme) => S) {
  const cache: Partial<Record<Scheme, Readonly<S>>> = {};
  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    const cached = cache[theme.scheme];
    if (cached) return cached;
    const created = StyleSheet.create(factory(theme));
    cache[theme.scheme] = created;
    return created;
  };
}

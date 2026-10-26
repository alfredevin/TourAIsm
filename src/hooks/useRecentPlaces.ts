import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { Place } from '../services/places';

const RECENTS_KEY = 'recent_places_v1';
const MAX_RECENTS = 5;

let recents: Place[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function setRecents(next: Place[]) {
  recents = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return recents;
}

function isPlace(value: unknown): value is Place {
  if (typeof value !== 'object' || value === null) return false;
  const place = value as Record<string, unknown>;
  const location = place.location as Record<string, unknown> | undefined;
  return (
    typeof place.label === 'string' &&
    typeof location?.latitude === 'number' &&
    typeof location?.longitude === 'number'
  );
}

function samePlace(a: Place, b: Place): boolean {
  return (
    a.label === b.label &&
    a.location.latitude === b.location.latitude &&
    a.location.longitude === b.location.longitude
  );
}

export async function loadRecentPlaces(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    const data: unknown = raw === null ? [] : JSON.parse(raw);
    if (Array.isArray(data)) setRecents(data.filter(isPlace).slice(0, MAX_RECENTS));
  } catch {
    setRecents([]);
  }
}

export function addRecentPlace(place: Place) {
  const next = [place, ...recents.filter((item) => !samePlace(item, place))].slice(0, MAX_RECENTS);
  setRecents(next);
  void AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => undefined);
}

// Used by sync to apply the account's saved places, or to clear them on log out.
export function replaceRecentPlaces(next: Place[]) {
  const places = next.slice(0, MAX_RECENTS);
  setRecents(places);
  void AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(places)).catch(() => undefined);
}

export const subscribeRecentPlaces = subscribe;

export function getRecentPlaces(): Place[] {
  return recents;
}

export function useRecentPlaces(): Place[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

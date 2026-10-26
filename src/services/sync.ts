import { getProfile, replaceProfile, subscribeProfile } from '../hooks/useProfile';
import {
  getRecentPlaces,
  replaceRecentPlaces,
  subscribeRecentPlaces,
} from '../hooks/useRecentPlaces';
import { getThemeMode, setThemeMode, subscribeTheme } from '../hooks/useTheme';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../data/characters';
import type { ThemeMode } from '../theme';
import { DEFAULT_NAME, DEFAULT_PROFILE, MAX_NAME_LENGTH } from '../types/profile';
import { devLog } from './logger';
import type { Place } from './places';
import { supabase } from './supabase';

// Keeps the signed-in account's data in Supabase. The app stays local-first: stores render from
// AsyncStorage instantly, and this layer pulls the account's data on sign in, then pushes changes.

const PUSH_DELAY_MS = 600;

type ProfileRow = {
  name: string;
  character_id: string;
  show_name_tag: boolean;
  theme_mode: ThemeMode;
};

type PlaceRow = { label: string; latitude: number; longitude: number };

let stopCurrent: (() => void) | null = null;
// Bumped on every start/stop so a pull that finishes after a log out is discarded.
let generation = 0;

function profilePayload(): ProfileRow {
  const profile = getProfile();
  return {
    name: profile.name.trim().slice(0, MAX_NAME_LENGTH) || DEFAULT_NAME,
    character_id: profile.characterId,
    show_name_tag: profile.showNameTag,
    theme_mode: getThemeMode(),
  };
}

function placesPayload(): PlaceRow[] {
  return getRecentPlaces().map((place) => ({
    label: place.label,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
  }));
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

async function pull(userId: string): Promise<boolean> {
  const [profileResult, placesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, character_id, show_name_tag, theme_mode')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('recent_places')
      .select('label, latitude, longitude')
      .eq('user_id', userId)
      .order('position', { ascending: true }),
  ]);

  if (profileResult.error || placesResult.error) {
    devLog(`sync pull failed: ${profileResult.error?.message ?? placesResult.error?.message}`);
    return false;
  }

  const row = profileResult.data;
  if (row) {
    replaceProfile({
      name: row.name.slice(0, MAX_NAME_LENGTH) || DEFAULT_NAME,
      characterId: CHARACTERS.some((character) => character.id === row.character_id)
        ? row.character_id
        : DEFAULT_CHARACTER_ID,
      showNameTag: row.show_name_tag,
    });
    if (isThemeMode(row.theme_mode)) setThemeMode(row.theme_mode);
  }

  const places: Place[] = placesResult.data.map((item) => ({
    label: item.label,
    location: { latitude: item.latitude, longitude: item.longitude },
  }));
  replaceRecentPlaces(places);
  return true;
}

export async function startSync(userId: string): Promise<void> {
  stopSync();
  const mine = generation;

  // Pushes only begin after a successful pull, so a failed pull can never overwrite the
  // account with stale local data.
  if (!(await pull(userId)) || mine !== generation) return;

  let lastProfile = JSON.stringify(profilePayload());
  let lastPlaces = JSON.stringify(placesPayload());
  let timer: ReturnType<typeof setTimeout> | undefined;

  const push = async () => {
    const profileJson = JSON.stringify(profilePayload());
    const placesJson = JSON.stringify(placesPayload());

    if (profileJson !== lastProfile) {
      const { error } = await supabase.from('profiles').update(JSON.parse(profileJson)).eq('id', userId);
      if (error) devLog(`sync profile failed: ${error.message}`);
      else lastProfile = profileJson;
    }
    if (placesJson !== lastPlaces) {
      const { error } = await supabase.rpc('replace_recent_places', {
        places: JSON.parse(placesJson),
      });
      if (error) devLog(`sync places failed: ${error.message}`);
      else lastPlaces = placesJson;
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void push(), PUSH_DELAY_MS);
  };

  const unsubscribers = [
    subscribeProfile(schedule),
    subscribeRecentPlaces(schedule),
    subscribeTheme(schedule),
  ];

  stopCurrent = () => {
    clearTimeout(timer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

// Stops syncing and clears the account's data from this device, so the next person who logs in
// never sees it.
export function stopSync() {
  generation += 1;
  stopCurrent?.();
  stopCurrent = null;
}

export function clearLocalAccountData() {
  replaceProfile(DEFAULT_PROFILE);
  replaceRecentPlaces([]);
}

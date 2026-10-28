import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { DESTINATIONS, type Destination } from '../data/destinations';

const REWARDS_KEY = 'rewards_v1';

export type Rewards = {
  points: number;
  // Local calendar day (YYYY-MM-DD) of the last award, keyed by destination id.
  lastVisit: Record<string, string>;
  // Total times each destination has been visited.
  visits: Record<string, number>;
};

const EMPTY: Rewards = { points: 0, lastVisit: {}, visits: {} };

let rewards: Rewards = EMPTY;
const listeners = new Set<() => void>();

function setRewards(next: Rewards) {
  rewards = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return rewards;
}

function isCountRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((item) => typeof item === 'number')
  );
}

function isDayRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

function parseRewards(raw: string | null): Rewards {
  if (raw === null) return EMPTY;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      points: typeof data.points === 'number' && data.points >= 0 ? Math.floor(data.points) : 0,
      lastVisit: isDayRecord(data.lastVisit) ? data.lastVisit : {},
      visits: isCountRecord(data.visits) ? data.visits : {},
    };
  } catch {
    return EMPTY;
  }
}

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function loadRewards(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(REWARDS_KEY);
  } catch {
    raw = null;
  }
  setRewards(parseRewards(raw));
}

// Awards a destination's points at most once per calendar day.
// Returns false when the tourist already checked in there today.
export function awardVisit(destination: Destination, now = new Date()): boolean {
  const today = dayKey(now);
  if (rewards.lastVisit[destination.id] === today) return false;

  const next: Rewards = {
    points: rewards.points + destination.points,
    lastVisit: { ...rewards.lastVisit, [destination.id]: today },
    visits: { ...rewards.visits, [destination.id]: (rewards.visits[destination.id] ?? 0) + 1 },
  };
  setRewards(next);
  void AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(next)).catch(() => undefined);
  return true;
}

export function hasVisitedToday(id: string, now = new Date()): boolean {
  return rewards.lastVisit[id] === dayKey(now);
}

export function visitedCount(state: Rewards): number {
  return DESTINATIONS.filter((destination) => (state.visits[destination.id] ?? 0) > 0).length;
}

export function useRewards(): Rewards {
  return useSyncExternalStore(subscribe, getSnapshot);
}

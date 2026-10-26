import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

import {
  CHECK_IN_RADIUS_M,
  DESTINATIONS,
  MAX_CHECK_IN_ACCURACY_M,
  NEAR_RADIUS_M,
} from '../data/destinations';
import { announce } from '../services/alerts';
import { distanceMeters, formatDistance } from '../utils/route';
import type { UserLocation } from './useCurrentLocation';
import { dayKey } from './useRewards';

const NEAR_KEY = 'near_alerts_v1';

// Local calendar day of the last "almost there" alert, keyed by destination id.
let alerted: Record<string, string> | null = null;
let loading: Promise<void> | null = null;

function loadAlerted(): Promise<void> {
  loading ??= AsyncStorage.getItem(NEAR_KEY)
    .then((raw) => {
      const data: unknown = raw ? JSON.parse(raw) : {};
      alerted = typeof data === 'object' && data !== null ? (data as Record<string, string>) : {};
    })
    .catch(() => {
      alerted = {};
    });
  return loading;
}

// True the first time a destination is approached on a given day.
async function claimNearAlert(id: string): Promise<boolean> {
  await loadAlerted();
  const today = dayKey(new Date());
  if (!alerted || alerted[id] === today) return false;
  alerted = { ...alerted, [id]: today };
  void AsyncStorage.setItem(NEAR_KEY, JSON.stringify(alerted)).catch(() => undefined);
  return true;
}

// Tells the tourist, by notification and voice, when they are close to a destination.
// The arrival message itself comes from the check-in, which also awards the points.
export function useProximityAlerts(location: UserLocation | null) {
  useEffect(() => {
    if (!location) return;
    if (location.accuracy !== null && location.accuracy > MAX_CHECK_IN_ACCURACY_M) return;

    for (const destination of DESTINATIONS) {
      const meters = distanceMeters(location, destination.location);
      if (meters <= CHECK_IN_RADIUS_M || meters > NEAR_RADIUS_M) continue;

      void claimNearAlert(destination.id).then((first) => {
        if (!first) return;
        void announce({
          title: 'Malapit ka na!',
          body: `${destination.name} is ${formatDistance(meters)} away.`,
          speech: `Mabuhay! Malapit ka na ngani sa ${destination.name}.`,
        });
      });
    }
  }, [location]);
}

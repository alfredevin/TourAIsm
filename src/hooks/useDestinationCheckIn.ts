import { useEffect, useState } from 'react';

import {
  CHECK_IN_RADIUS_M,
  DESTINATIONS,
  MAX_CHECK_IN_ACCURACY_M,
  type Destination,
} from '../data/destinations';
import { distanceMeters } from '../utils/route';
import type { UserLocation } from './useCurrentLocation';
import { announce } from '../services/alerts';
import { awardVisit } from './useRewards';

export type CheckIn = {
  destination: Destination;
  // Changes on every award so the same destination can toast again on another day.
  key: number;
};

// Awards points when the tourist is physically at a destination.
export function useDestinationCheckIn(location: UserLocation | null) {
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);

  useEffect(() => {
    if (!location) return;
    if (location.accuracy !== null && location.accuracy > MAX_CHECK_IN_ACCURACY_M) return;

    for (const destination of DESTINATIONS) {
      if (distanceMeters(location, destination.location) > CHECK_IN_RADIUS_M) continue;
      if (awardVisit(destination)) {
        setCheckIn({ destination, key: Date.now() });
        void announce({
          title: 'Mabuhay! Andito ka na ngani!',
          body: `${destination.name} · +${destination.points} points`,
          speech: `Mabuhay! Andito ka na ngani sa ${destination.name}! Nakakuha ka ng ${destination.points} points.`,
        });
        return;
      }
    }
  }, [location]);

  return { checkIn, dismiss: () => setCheckIn(null) };
}

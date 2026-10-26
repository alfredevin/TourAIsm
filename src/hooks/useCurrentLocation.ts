import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import type { LatLng } from '../services/routing';

export type LocationStatus = 'loading' | 'ready' | 'denied' | 'unavailable';

export type UserLocation = LatLng & {
  speed: number;
  heading: number | null;
  accuracy: number | null;
};

export type CurrentLocation = {
  location: UserLocation | null;
  status: LocationStatus;
  retry: () => void;
};

export function openAppSettings() {
  Linking.openSettings().catch(() => undefined);
}

export function useCurrentLocation(): CurrentLocation {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
    subscription.current?.remove();
    subscription.current = null;
    setLocation((current) => (current ? { ...current, speed: 0 } : current));
  }, []);

  const start = useCallback(async () => {
    stop();
    const runId = run.current;
    const isCurrent = () => runId === run.current;

    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (!isCurrent()) return;
    if (!permission.granted) {
      setStatus('denied');
      return;
    }

    if (!(await Location.hasServicesEnabledAsync())) {
      if (isCurrent()) setStatus('unavailable');
      return;
    }

    try {
      const next = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (position) => {
          const { latitude, longitude, speed, heading, accuracy } = position.coords;
          setLocation({
            latitude,
            longitude,
            speed: Math.max(0, speed ?? 0),
            heading: heading !== null && heading >= 0 ? heading : null,
            accuracy,
          });
          setStatus('ready');
        },
        () => setStatus('unavailable'),
      );
      if (!isCurrent()) {
        next.remove();
        return;
      }
      subscription.current = next;
    } catch {
      if (isCurrent()) setStatus('unavailable');
    }
  }, [stop]);

  useEffect(() => {
    void start();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void start();
      } else {
        stop();
      }
    });
    return () => {
      appState.remove();
      stop();
    };
  }, [start, stop]);

  return { location, status, retry: () => void start() };
}

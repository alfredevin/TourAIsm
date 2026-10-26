import { useMemo } from 'react';

import type { LatLng, Route, RouteStep } from '../services/routing';
import { cumulativeDistances, snapToRoute } from '../utils/route';

const OFF_ROUTE_METERS = 50;
const ARRIVED_METERS = 25;

export type NavigationProgress = {
  // The maneuver coming up and the distance to it.
  next: RouteStep | null;
  distanceToNext: number;
  // The maneuver after that, shown as "Then".
  then: RouteStep | null;
  remainingMeters: number;
  remainingSeconds: number;
  offRoute: boolean;
  arrived: boolean;
};

export function useNavigationProgress(
  route: Route | null,
  position: LatLng | null,
): NavigationProgress | null {
  const cumulative = useMemo(() => (route ? cumulativeDistances(route.coordinates) : []), [route]);

  return useMemo(() => {
    if (!route || route.coordinates.length === 0) return null;
    const total = cumulative[cumulative.length - 1] || route.distanceMeters;

    // Without GPS, treat the trip as not started.
    const snap = position ? snapToRoute(position, route.coordinates, cumulative) : null;
    const along = snap?.along ?? 0;
    const remainingMeters = Math.max(0, total - along);
    const remainingSeconds = total > 0 ? route.durationSeconds * (remainingMeters / total) : 0;

    // ORS steps start at their maneuver. The step after the current one is the next maneuver.
    const vertex = snap?.index ?? 0;
    let current = route.steps.findIndex((step) => vertex >= step.startIndex && vertex < step.endIndex);
    if (current === -1) current = Math.max(0, route.steps.length - 1);
    const next = route.steps[current + 1] ?? null;
    const then = route.steps[current + 2] ?? null;
    const nextAt = next ? (cumulative[next.startIndex] ?? total) : total;

    return {
      next,
      distanceToNext: Math.max(0, nextAt - along),
      then,
      remainingMeters,
      remainingSeconds,
      offRoute: snap !== null && snap.offset > OFF_ROUTE_METERS,
      arrived: snap !== null && remainingMeters < ARRIVED_METERS,
    };
  }, [route, cumulative, position]);
}

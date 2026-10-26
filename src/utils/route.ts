import type { Region } from 'react-native-maps';

import type { LatLng } from '../services/routing';

const MIN_DELTA = 0.008;
const PADDING_FACTOR = 1.5;

export function regionForCoordinates(points: LatLng[], fallback: LatLng): Region {
  if (points.length === 0) {
    return { ...fallback, latitudeDelta: MIN_DELTA * 2, longitudeDelta: MIN_DELTA * 2 };
  }

  let minLat = points[0].latitude;
  let maxLat = minLat;
  let minLng = points[0].longitude;
  let maxLng = minLng;
  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_DELTA, (maxLat - minLat) * PADDING_FACTOR),
    longitudeDelta: Math.max(MIN_DELTA, (maxLng - minLng) * PADDING_FACTOR),
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(1, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatArrival(minutes: number, now = new Date()): string {
  const arrival = new Date(now.getTime() + minutes * 60_000);
  const hours = arrival.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const mins = String(arrival.getMinutes()).padStart(2, '0');
  return `${hour12}:${mins} ${suffix}`;
}

// ORS labels are "Place, Town, Province". Split into a title and a subtitle.
export function splitPlaceLabel(label: string): { title: string; subtitle: string | null } {
  const [title, ...rest] = label.split(',').map((part) => part.trim());
  return { title: title || label, subtitle: rest.length > 0 ? rest.join(', ') : null };
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Distance from the route start to each vertex, in meters.
export function cumulativeDistances(points: LatLng[]): number[] {
  const result = [0];
  for (let i = 1; i < points.length; i += 1) {
    result.push(result[i - 1] + distanceMeters(points[i - 1], points[i]));
  }
  return result;
}

export type Snap = {
  // Segment start index: the point lies between points[index] and points[index + 1].
  index: number;
  // Distance along the route to the snapped point.
  along: number;
  // Distance from the query point to the route.
  offset: number;
};

// Projects a point onto the polyline. Uses a local flat-earth approximation, which is
// accurate enough at street scale.
export function snapToRoute(point: LatLng, points: LatLng[], cumulative: number[]): Snap | null {
  if (points.length === 0) return null;
  if (points.length === 1) return { index: 0, along: 0, offset: distanceMeters(point, points[0]) };

  const cosLat = Math.cos(toRad(point.latitude));
  const toXY = (p: LatLng) => ({
    x: toRad(p.longitude - point.longitude) * cosLat * EARTH_RADIUS_M,
    y: toRad(p.latitude - point.latitude) * EARTH_RADIUS_M,
  });

  let best: Snap = { index: 0, along: 0, offset: Number.POSITIVE_INFINITY };
  let a = toXY(points[0]);
  for (let i = 0; i < points.length - 1; i += 1) {
    const b = toXY(points[i + 1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSq));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    const offset = Math.hypot(px, py);
    if (offset < best.offset) {
      best = { index: i, along: cumulative[i] + t * (cumulative[i + 1] - cumulative[i]), offset };
    }
    a = b;
  }
  return best;
}

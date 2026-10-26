import { FARE_CONFIG } from '../config/fare';

const METERS_PER_KM = 1000;

// Examples with the placeholder config (base 20 up to 2 km, then 5 per extra km):
//   1.5 km -> 20 (within base distance)
//   2.0 km -> 20 (exactly base distance)
//   2.1 km -> 21 (20.5 rounds up to the next peso)
//   4.0 km -> 30
export function calculateFare(distanceMeters: number): number {
  const distanceKm = distanceMeters / METERS_PER_KM;
  const additionalKm = Math.max(0, distanceKm - FARE_CONFIG.baseDistanceKm);
  const raw = FARE_CONFIG.baseFare + additionalKm * FARE_CONFIG.perAdditionalKm;
  return Math.max(FARE_CONFIG.minimumFare, Math.ceil(Number(raw.toFixed(6))));
}

export function estimateTravelMinutes(durationSeconds: number): number {
  const minutes = (durationSeconds / 60) * FARE_CONFIG.slowdownFactor;
  return Math.max(1, Math.round(minutes));
}

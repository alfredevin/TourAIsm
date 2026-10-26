// PLACEHOLDER values. These are not official rates. Replace with the local LGU rates.
export const FARE_CONFIG = {
  baseFare: 20,
  baseDistanceKm: 2,
  perAdditionalKm: 5,
  minimumFare: 20,
  // Tricycles are slower than cars, so ORS car durations are scaled up.
  slowdownFactor: 1.3,
} as const;

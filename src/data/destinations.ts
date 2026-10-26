import type { LatLng } from '../services/routing';

export type Destination = {
  id: string;
  name: string;
  town: string;
  location: LatLng;
  points: number;
};

// A tourist earns points once they are within this distance of a destination.
export const CHECK_IN_RADIUS_M = 150;

// Tourists hear "you're almost there" once they are within this distance of a destination.
export const NEAR_RADIUS_M = 500;

// Ignore fixes less precise than this so a bad GPS reading can't award points.
export const MAX_CHECK_IN_ACCURACY_M = 100;

// Coordinates are approximate. Verify each one on the map before release.
export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'boac-cathedral',
    name: 'Boac Cathedral',
    town: 'Boac',
    location: { latitude: 13.4469, longitude: 121.8389 },
    points: 100,
  },
  {
    id: 'santa-cruz-town-plaza',
    name: 'Santa Cruz Town Plaza',
    town: 'Santa Cruz',
    location: { latitude: 13.4747, longitude: 122.0306 },
    points: 50,
  },
  {
    id: 'poctoy-white-beach',
    name: 'Poctoy White Beach',
    town: 'Torrijos',
    location: { latitude: 13.3161, longitude: 122.0872 },
    points: 150,
  },
  {
    id: 'malbog-sulfur-spring',
    name: 'Malbog Sulfur Spring',
    town: 'Buenavista',
    location: { latitude: 13.2486, longitude: 122.0158 },
    points: 150,
  },
];

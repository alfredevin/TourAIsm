import { assertOk, orsFetch } from './ors';
import type { LatLng } from './routing';

export type Place = {
  label: string;
  location: LatLng;
};

type OrsGeocodeResponse = {
  features: {
    geometry: { coordinates: [number, number] };
    properties: { label: string };
  }[];
};

const PHILIPPINES = 'PHL';

async function requestFeatures(
  path: string,
  signal?: AbortSignal,
): Promise<OrsGeocodeResponse['features']> {
  const response = await orsFetch(path, { signal });
  assertOk(response);
  const data: OrsGeocodeResponse = await response.json();
  return data.features;
}

function toPlace(feature: OrsGeocodeResponse['features'][number]): Place {
  const [longitude, latitude] = feature.geometry.coordinates;
  return { label: feature.properties.label, location: { latitude, longitude } };
}

export async function searchPlaces(query: string, near: LatLng, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({
    text: query,
    size: '5',
    'boundary.country': PHILIPPINES,
    'focus.point.lon': String(near.longitude),
    'focus.point.lat': String(near.latitude),
  });
  const features = await requestFeatures(`/geocode/autocomplete?${params.toString()}`, signal);
  return features.map(toPlace);
}

export async function reversePlace(point: LatLng): Promise<Place | null> {
  const params = new URLSearchParams({
    'point.lon': String(point.longitude),
    'point.lat': String(point.latitude),
    size: '1',
    'boundary.country': PHILIPPINES,
  });
  const features = await requestFeatures(`/geocode/reverse?${params.toString()}`);
  const first = features[0];
  return first ? toPlace(first) : null;
}

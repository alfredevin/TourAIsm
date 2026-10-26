import type { MapType } from '../../types/map';

// The web MapView draws its own Leaflet tiles, so there is nothing to add here.

export function baseMapType(mapType: MapType): MapType {
  return mapType;
}

export default function MapTiles() {
  return null;
}

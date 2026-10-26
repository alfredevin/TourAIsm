import { Platform } from 'react-native';
import { UrlTile, type MapType as NativeMapType } from 'react-native-maps';

import type { MapType } from '../../types/map';

// Native counterpart of the Leaflet layers in src/web/react-native-maps.tsx, so Android, iOS
// and web all show the same OpenStreetMap tiles instead of Google or Apple's own base maps.

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Esri has no imagery past this zoom in rural areas; the last level is scaled up instead.
const SATELLITE_MAX_NATIVE_ZOOM = 17;

// Android needs 'none' so no Google base map (or API key) sits under the tiles.
export function baseMapType(_mapType: MapType): NativeMapType {
  return Platform.OS === 'android' ? 'none' : 'standard';
}

export default function MapTiles({ mapType }: { mapType: MapType }) {
  const satellite = mapType === 'satellite';
  const urlTemplate = satellite ? SATELLITE : OSM;
  return (
    <UrlTile
      key={urlTemplate}
      urlTemplate={urlTemplate}
      maximumZ={19}
      maximumNativeZ={satellite ? SATELLITE_MAX_NATIVE_ZOOM : 19}
      zIndex={-1}
      shouldReplaceMapContent
    />
  );
}

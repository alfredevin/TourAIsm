import type { MapViewProps } from 'react-native-maps';

import type { Scheme } from '../theme';

type MapStyleElement = NonNullable<MapViewProps['customMapStyle']>[number];

// Google Maps styles (Android). iOS uses Apple Maps, which follows userInterfaceStyle instead.
// Both hide business POIs so routes and stops stand out.

const declutter: MapStyleElement[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ saturation: -60 }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const lightStyle: MapStyleElement[] = [
  ...declutter,
  { elementType: 'geometry', stylers: [{ color: '#F5F7FA' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5B6475' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E3E7EE' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FFE7B3' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#F4C873' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DDF2DF' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C7DDF7' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#EEF1F5' }] },
];

const darkStyle: MapStyleElement[] = [
  ...declutter,
  { elementType: 'geometry', stylers: [{ color: '#1A2233' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8C99AD' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121826' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2C3850' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1F2A3D' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#18332A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2B364C' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1A2233' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#A3AEC0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A4636' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2E2B22' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#263046' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E1A2E' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4E6585' }] },
];

export const MAP_STYLES: Record<Scheme, MapStyleElement[]> = {
  light: lightStyle,
  dark: darkStyle,
};

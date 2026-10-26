import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// Web implementation of the react-native-maps API used by this app, built on Leaflet and
// OpenStreetMap. Android/iOS keep using the real react-native-maps.

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type LatLng = { latitude: number; longitude: number };
type EdgePadding = { top: number; right: number; bottom: number; left: number };

const OSM = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
};
// Esri has no imagery past this zoom in rural areas; Leaflet scales the last level up instead.
const SATELLITE_MAX_NATIVE_ZOOM = 17;
const SATELLITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri',
  maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
};

const MapContext = createContext<L.Map | null>(null);

function zoomForRegion(region: Region): number {
  return Math.max(1, Math.min(19, Math.round(Math.log2(360 / region.longitudeDelta))));
}

function toLatLng(point: LatLng): L.LatLngTuple {
  return [point.latitude, point.longitude];
}

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  region?: Region;
  initialRegion?: Region;
  mapType?: string;
  userInterfaceStyle?: string;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onPanDrag?: () => void;
  children?: ReactNode;
};

export type MapViewHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  animateCamera: (camera: { center?: LatLng; zoom?: number }, options?: { duration?: number }) => void;
  fitToCoordinates: (
    coordinates: LatLng[],
    options?: { edgePadding?: EdgePadding; animated?: boolean },
  ) => void;
};

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    style,
    region,
    initialRegion,
    mapType,
    userInterfaceStyle,
    scrollEnabled = true,
    zoomEnabled = true,
    onPanDrag,
    children,
  },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const onPanDragRef = useRef(onPanDrag);
  useEffect(() => {
    onPanDragRef.current = onPanDrag;
  }, [onPanDrag]);
  const start = region ?? initialRegion;

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { zoomControl: false, attributionControl: true });
    instance.setView(
      start ? toLatLng(start) : [0, 0],
      start ? zoomForRegion(start) : 2,
    );
    instance.on('dragstart', () => onPanDragRef.current?.());
    setMap(instance);
    return () => {
      instance.remove();
      setMap(null);
    };
    // The map is created once. Later region changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;
    tiles.current?.remove();
    const source = mapType === 'satellite' ? SATELLITE : OSM;
    tiles.current = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: 19,
      maxNativeZoom: 'maxNativeZoom' in source ? source.maxNativeZoom : 19,
    }).addTo(map);
  }, [map, mapType]);

  useEffect(() => {
    if (!map) return;
    const handlers = [map.dragging, map.touchZoom, map.scrollWheelZoom, map.doubleClickZoom, map.boxZoom];
    handlers.forEach((handler) => {
      if (scrollEnabled && zoomEnabled) handler.enable();
      else handler.disable();
    });
    if (!scrollEnabled) map.dragging.disable();
  }, [map, scrollEnabled, zoomEnabled]);

  useEffect(() => {
    if (!map || !region) return;
    map.setView(toLatLng(region), zoomForRegion(region), { animate: false });
  }, [map, region]);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (target, duration = 300) => {
        map?.flyTo(toLatLng(target), zoomForRegion(target), { duration: duration / 1000 });
      },
      animateCamera: (camera, options) => {
        if (!map) return;
        const center = camera.center ? toLatLng(camera.center) : map.getCenter();
        map.flyTo(center, camera.zoom ?? map.getZoom(), { duration: (options?.duration ?? 300) / 1000 });
      },
      fitToCoordinates: (coordinates, options) => {
        if (!map || coordinates.length === 0) return;
        const padding = options?.edgePadding;
        map.fitBounds(L.latLngBounds(coordinates.map(toLatLng)), {
          paddingTopLeft: [padding?.left ?? 0, padding?.top ?? 0],
          paddingBottomRight: [padding?.right ?? 0, padding?.bottom ?? 0],
          animate: options?.animated ?? true,
        });
      },
    }),
    [map],
  );

  return (
    <View style={[styles.map, style]}>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      <MapContext.Provider value={map}>{children}</MapContext.Provider>
    </View>
  );
});

type PolylineProps = {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  zIndex?: number;
};

export function Polyline({ coordinates, strokeColor, strokeWidth, lineCap, lineJoin }: PolylineProps) {
  const map = useContext(MapContext);
  useEffect(() => {
    if (!map) return;
    const line = L.polyline(coordinates.map(toLatLng), {
      color: strokeColor,
      weight: strokeWidth,
      lineCap,
      lineJoin,
      interactive: false,
    }).addTo(map);
    return () => {
      line.remove();
    };
  }, [map, coordinates, strokeColor, strokeWidth, lineCap, lineJoin]);
  return null;
}

type MarkerProps = {
  coordinate: LatLng;
  anchor?: { x: number; y: number };
  tracksViewChanges?: boolean;
  zIndex?: number;
  children?: ReactNode;
};

export function Marker({ coordinate, anchor = { x: 0.5, y: 1 }, children }: MarkerProps) {
  const map = useContext(MapContext);
  const marker = useRef<L.Marker | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const { latitude, longitude } = coordinate;

  useEffect(() => {
    if (!map) return;
    const instance = L.marker([latitude, longitude], {
      icon: L.divIcon({ html: '', className: 'rn-marker', iconSize: [0, 0] }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
    marker.current = instance;
    setElement(instance.getElement() ?? null);
    return () => {
      instance.remove();
      marker.current = null;
      setElement(null);
    };
    // Position updates are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    marker.current?.setLatLng([latitude, longitude]);
  }, [latitude, longitude]);

  if (!element || children == null) return null;
  return createPortal(
    <div
      style={{
        position: 'absolute',
        transform: `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%)`,
      }}
    >
      {children}
    </div>,
    element,
  );
}

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export default MapView;

const styles = StyleSheet.create({
  map: { overflow: 'hidden', backgroundColor: '#e5e7eb' },
});

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapControls, { type MapControl } from '../components/map/MapControls';
import { NavigationBanner, NavigationFooter, SpeedBubble } from '../components/map/NavigationHud';
import NoticeBanner from '../components/map/NoticeBanner';
import PlaceSearch from '../components/map/PlaceSearch';
import RouteLayer from '../components/map/RouteLayer';
import RouteSheet from '../components/map/RouteSheet';
import UserMarker from '../components/map/UserMarker';
import { DEFAULT_CENTER } from '../config/map';
import MapTiles, { baseMapType } from '../components/map/MapTiles';
import { useAppActive } from '../hooks/useAppActive';
import {
  openAppSettings,
  type LocationStatus,
  type UserLocation,
} from '../hooks/useCurrentLocation';
import { useNavigationProgress } from '../hooks/useNavigationProgress';
import type { RouteController } from '../hooks/useRoute';
import { makeStyles, useTheme } from '../hooks/useTheme';
import { TAB_BAR_SPACE } from '../navigation/TabBar';
import type { LatLng, Route } from '../services/routing';
import { radius } from '../theme';
import type { MapLayout, MapType } from '../types/map';

const INITIAL_REGION: Region = {
  ...DEFAULT_CENTER,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
const USER_ZOOM_DELTA = 0.01;
const ANIMATION_MS = 500;
const LAYOUT_MS = 320;
const EDGE = 16;
const ROUTE_PADDING = 48;
const NAV_ZOOM = 17.5;
const NAV_ALTITUDE = 600;
const NAV_PITCH = 55;
const NAV_CAMERA_MS = 800;
const REROUTE_COOLDOWN_MS = 20_000;
const SPEED_VISIBLE_MPS = 0.5;

type Props = {
  active: boolean;
  location: UserLocation | null;
  locationStatus: LocationStatus;
  onRetryLocation: () => void;
  mapType: MapType;
  onToggleMapType: () => void;
  route: RouteController;
  origin: LatLng;
  layout: MapLayout;
  onToggleLayout: () => void;
  searchRequest: number;
  navigating: boolean;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
};

function zoomedRegion(location: LatLng): Region {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: USER_ZOOM_DELTA,
    longitudeDelta: USER_ZOOM_DELTA,
  };
}

export default function MapScreen({
  active,
  location,
  locationStatus,
  onRetryLocation,
  mapType,
  onToggleMapType,
  route,
  origin,
  layout,
  onToggleLayout,
  searchRequest,
  navigating,
  onStartNavigation,
  onStopNavigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useTheme();
  const styles = useStyles();
  const mapRef = useRef<MapView>(null);
  const followed = useRef(false);
  const { state, searching, setSearching, selectDestination, clearDestination, retry, reroute } =
    route;
  const appActive = useAppActive();
  const live = active && appActive;
  const readyRoute: Route | null = state.status === 'ready' ? state.route : null;
  const immersive = layout === 'full';

  const [topInset, setTopInset] = useState(0);
  const [bottomInset, setBottomInset] = useState(0);
  const [following, setFollowing] = useState(true);
  const [rerouteFrom, setRerouteFrom] = useState<Route | null>(null);
  const lastReroute = useRef(0);

  const progress = useNavigationProgress(navigating ? readyRoute : null, location);
  const rerouting = rerouteFrom !== null && rerouteFrom === readyRoute;

  // Bottom panel slides between the tab bar and the screen edge.
  const panelBottom = navigating || immersive ? insets.bottom + EDGE : insets.bottom + TAB_BAR_SPACE;
  const bottom = useSharedValue(panelBottom);
  useEffect(() => {
    bottom.value = withTiming(panelBottom, { duration: LAYOUT_MS });
  }, [panelBottom, bottom]);
  const panelStyle = useAnimatedStyle(() => ({ bottom: bottom.value }));

  const measureTop = (event: LayoutChangeEvent) => {
    setTopInset(Math.round(event.nativeEvent.layout.y + event.nativeEvent.layout.height));
  };
  const measureBottom = (event: LayoutChangeEvent) => {
    setBottomInset(Math.round(event.nativeEvent.layout.height));
  };

  // Android back: leave navigation, then full screen, then the app.
  useEffect(() => {
    if (!active || (!navigating && !immersive)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigating) onStopNavigation();
      else onToggleLayout();
      return true;
    });
    return () => subscription.remove();
  }, [active, navigating, immersive, onStopNavigation, onToggleLayout]);

  useEffect(() => {
    if (!location || followed.current) return;
    followed.current = true;
    mapRef.current?.animateToRegion(zoomedRegion(location), ANIMATION_MS);
  }, [location]);

  const fitRoute = useCallback(() => {
    if (!readyRoute) return;
    mapRef.current?.fitToCoordinates(readyRoute.coordinates, {
      edgePadding: {
        top: ROUTE_PADDING,
        right: ROUTE_PADDING + 40,
        bottom: ROUTE_PADDING,
        left: ROUTE_PADDING,
      },
      animated: true,
    });
  }, [readyRoute]);

  // Overview of the route while browsing.
  useEffect(() => {
    if (!readyRoute || !active || navigating) return;
    const timer = setTimeout(fitRoute, LAYOUT_MS);
    return () => clearTimeout(timer);
  }, [readyRoute, active, navigating, fitRoute, bottomInset]);

  // Navigation camera: follow the user, heading up and tilted.
  useEffect(() => {
    if (!navigating || !following || !active) return;
    const center = location ?? readyRoute?.coordinates[0];
    if (!center) return;
    mapRef.current?.animateCamera(
      {
        center: { latitude: center.latitude, longitude: center.longitude },
        pitch: NAV_PITCH,
        zoom: NAV_ZOOM,
        altitude: NAV_ALTITUDE,
        ...(location?.heading != null ? { heading: location.heading } : null),
      },
      { duration: NAV_CAMERA_MS },
    );
  }, [navigating, following, active, location, readyRoute]);

  // Off route: fetch a new route from the current position, at most every 20 seconds.
  useEffect(() => {
    if (!navigating || !progress?.offRoute || !readyRoute) return;
    const now = Date.now();
    if (now - lastReroute.current < REROUTE_COOLDOWN_MS) return;
    lastReroute.current = now;
    setRerouteFrom(readyRoute);
    reroute();
  }, [navigating, progress?.offRoute, readyRoute, reroute]);

  // A failed reroute keeps the old route. Drop the "Rerouting" banner after the cooldown.
  useEffect(() => {
    if (!rerouteFrom) return;
    const timer = setTimeout(() => setRerouteFrom(null), REROUTE_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [rerouteFrom]);

  const startNavigation = () => {
    setFollowing(true);
    onStartNavigation();
  };

  const stopNavigation = () => {
    onStopNavigation();
    mapRef.current?.animateCamera({ pitch: 0, heading: 0 }, { duration: ANIMATION_MS });
    if (progress?.arrived) clearDestination();
  };

  const recenter = () => {
    if (navigating) {
      setFollowing(true);
      return;
    }
    if (location) mapRef.current?.animateToRegion(zoomedRegion(location), ANIMATION_MS);
  };

  const controls: MapControl[] = [
    {
      key: 'layers',
      icon: mapType === 'satellite' ? 'layers' : 'layers-outline',
      label: mapType === 'satellite' ? 'Show standard map' : 'Show satellite map',
      onPress: onToggleMapType,
      active: mapType === 'satellite',
    },
    ...(navigating
      ? []
      : [
          {
            key: 'layout',
            icon: immersive ? ('contract-outline' as const) : ('expand-outline' as const),
            label: immersive ? 'Exit full screen' : 'Full screen',
            onPress: onToggleLayout,
          },
        ]),
    ...(readyRoute && !navigating
      ? [{ key: 'fit', icon: 'scan-outline' as const, label: 'Show whole route', onPress: fitRoute }]
      : []),
    {
      key: 'locate',
      icon: navigating && following ? 'navigate' : 'locate-outline',
      label: 'Center on my location',
      onPress: recenter,
      active: navigating && following,
    },
  ];

  const locationNotice =
    locationStatus === 'denied'
      ? {
          message: 'Location is off. You can still browse the map.',
          actions: [
            { label: 'Open settings', onPress: openAppSettings },
            { label: 'Try again', onPress: onRetryLocation },
          ],
        }
      : locationStatus === 'unavailable'
        ? {
            message: "We can't get your location. Is GPS turned on?",
            actions: [{ label: 'Try again', onPress: onRetryLocation }],
          }
        : null;

  const fallbackNotice =
    location === null && state.status !== 'idle'
      ? { message: 'Waiting for GPS. Using the town center as your starting point.', actions: [] }
      : null;

  const notice = locationNotice ?? fallbackNotice;
  const showSpeed = navigating && location !== null && location.speed > SPEED_VISIBLE_MPS;

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={styles.fill}
        initialRegion={INITIAL_REGION}
        mapType={baseMapType(mapType)}
        userInterfaceStyle={scheme}
        mapPadding={{ top: topInset, right: 0, bottom: bottomInset + panelBottom, left: 0 }}
        showsCompass={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPanDrag={() => {
          if (navigating && following) setFollowing(false);
        }}
      >
        <MapTiles mapType={mapType} />
        {location && <UserMarker location={location} active={live} />}
        {state.status !== 'idle' && (
          <RouteLayer route={readyRoute} destination={state.destination} />
        )}
      </MapView>

      <View
        style={[styles.top, { paddingTop: insets.top + 10 }]}
        onLayout={measureTop}
      >
        {navigating && progress ? (
          <NavigationBanner progress={progress} rerouting={rerouting} />
        ) : (
          <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)}>
            <PlaceSearch
              near={origin}
              focusRequest={searchRequest}
              onSearchingChange={setSearching}
              onSelect={selectDestination}
            />
            {notice && <NoticeBanner message={notice.message} actions={notice.actions} />}
          </Animated.View>
        )}
      </View>

      {!searching && (
        <Animated.View
          style={[styles.controls, { top: topInset + 12 }]}
          layout={LinearTransition.duration(LAYOUT_MS)}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <MapControls controls={controls} />
        </Animated.View>
      )}

      {!searching && (
        <Animated.View style={[styles.panel, panelStyle]} onLayout={measureBottom}>
          {navigating && progress ? (
            <View style={styles.navBottom}>
              <View style={styles.navRow}>
                {showSpeed ? <SpeedBubble speed={location.speed} /> : <View />}
                {!following && (
                  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                    <Pressable
                      onPress={recenter}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.recenter, pressed && styles.pressed]}
                    >
                      <Ionicons name="navigate" size={16} color={colors.primary} />
                      <Text style={styles.recenterText}>Re-center</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </View>
              <NavigationFooter
                progress={progress}
                totalMeters={readyRoute?.distanceMeters ?? 0}
                onExit={stopNavigation}
              />
            </View>
          ) : (
            <RouteSheet
              state={state}
              fromLabel={location ? 'Your location' : 'Town center'}
              onRetry={retry}
              onClear={clearDestination}
              onStart={startNavigation}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, shadows }) => ({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.mapBackdrop,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: EDGE,
    right: EDGE,
    pointerEvents: 'box-none',
  },
  controls: {
    position: 'absolute',
    right: EDGE,
  },
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    pointerEvents: 'box-none',
  },
  navBottom: {
    gap: 10,
    pointerEvents: 'box-none',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  recenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  recenterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
}));

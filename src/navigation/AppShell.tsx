import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { DEFAULT_CENTER } from '../config/map';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useMapLayout } from '../hooks/useMapLayout';
import { loadRecentPlaces } from '../hooks/useRecentPlaces';
import { useRoute } from '../hooks/useRoute';
import MapScreen from '../screens/MapScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { Place } from '../services/places';
import type { LatLng } from '../services/routing';
import type { MapType } from '../types/map';
import TabBar, { type TabKey } from './TabBar';

const FADE_MS = 220;

type Props = {
  onResetOnboarding: () => void;
};

export default function AppShell({ onResetOnboarding }: Props) {
  const [tab, setTab] = useState<TabKey>('map');
  const [mapType, setMapType] = useState<MapType>('standard');
  const [searchRequest, setSearchRequest] = useState(0);
  const [navigationRequested, setNavigationRequested] = useState(false);
  const { location, status, retry } = useCurrentLocation();
  const origin = useMemo<LatLng>(() => location ?? DEFAULT_CENTER, [location]);
  const route = useRoute(origin);
  const { layout, toggleLayout, showLayout } = useMapLayout();

  // Navigation only runs while a route is ready. Clearing the route ends it.
  const navigating = navigationRequested && route.state.status === 'ready';

  useEffect(() => {
    void loadRecentPlaces();
  }, []);

  const toggleMapType = useCallback(() => {
    setMapType((current) => (current === 'standard' ? 'satellite' : 'standard'));
  }, []);

  const openMapFull = useCallback(() => {
    showLayout('full');
    setTab('map');
  }, [showLayout]);

  const openSearch = useCallback(() => {
    setNavigationRequested(false);
    setTab('map');
    setSearchRequest((count) => count + 1);
  }, []);

  const { selectDestination, clearDestination } = route;
  const openPlace = useCallback(
    (place: Place) => {
      setNavigationRequested(false);
      selectDestination(place);
      setTab('map');
    },
    [selectDestination],
  );

  const clearRoute = useCallback(() => {
    setNavigationRequested(false);
    clearDestination();
  }, [clearDestination]);

  const startNavigation = useCallback(() => setNavigationRequested(true), []);
  const stopNavigation = useCallback(() => setNavigationRequested(false), []);

  const startFromHome = useCallback(() => {
    setNavigationRequested(true);
    setTab('map');
  }, []);

  const hideTabBar = tab === 'map' && (layout === 'full' || navigating);
  const mapRoute = useMemo(() => ({ ...route, clearDestination: clearRoute }), [route, clearRoute]);

  return (
    <View style={styles.fill}>
      <TabPage active={tab === 'home'}>
        <HomeScreen
          active={tab === 'home'}
          location={location}
          route={route.state}
          onOpenMap={openMapFull}
          onOpenSearch={openSearch}
          onSelectPlace={openPlace}
          onClearRoute={clearRoute}
          onStartNavigation={startFromHome}
        />
      </TabPage>
      <TabPage active={tab === 'map'}>
        <MapScreen
          active={tab === 'map'}
          location={location}
          locationStatus={status}
          onRetryLocation={retry}
          mapType={mapType}
          onToggleMapType={toggleMapType}
          route={mapRoute}
          origin={origin}
          layout={layout}
          onToggleLayout={toggleLayout}
          searchRequest={searchRequest}
          navigating={navigating}
          onStartNavigation={startNavigation}
          onStopNavigation={stopNavigation}
        />
      </TabPage>
      <TabPage active={tab === 'settings'}>
        <SettingsScreen
          locationStatus={status}
          mapType={mapType}
          onSelectMapType={setMapType}
          onResetOnboarding={onResetOnboarding}
        />
      </TabPage>
      <TabBar active={tab} hidden={hideTabBar} onChange={setTab} />
    </View>
  );
}

type TabPageProps = {
  active: boolean;
  children: ReactNode;
};

// Pages cross-fade with a slight scale so tab switches feel continuous.
function TabPage({ active, children }: TabPageProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: FADE_MS });
  }, [active, progress]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.985 + 0.015 * progress.value }],
  }));

  return (
    <Animated.View style={[styles.fill, fadeStyle, { pointerEvents: active ? 'auto' : 'none' }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

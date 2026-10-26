import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { DEFAULT_CENTER } from '../../config/map';
import MapTiles, { baseMapType } from '../map/MapTiles';
import type { UserLocation } from '../../hooks/useCurrentLocation';
import type { RouteState } from '../../hooks/useRoute';
import { makeStyles, useTheme } from '../../hooks/useTheme';
import { calculateFare, estimateTravelMinutes } from '../../services/fare';
import { SERVICE_ERROR_MESSAGES } from '../../services/ors';
import type { LatLng } from '../../services/routing';
import { radius } from '../../theme';
import {
  formatArrival,
  formatDistance,
  regionForCoordinates,
  splitPlaceLabel,
} from '../../utils/route';
import RouteLayer from '../map/RouteLayer';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const MAP_HEIGHT = 200;
const DOT_SIZE = 18;
const SNAPSHOT_MS = 300;
const PESO = '₱';

type Props = {
  location: UserLocation | null;
  route: RouteState;
  onOpenMap: () => void;
  onOpenSearch: () => void;
  onClearRoute: () => void;
  onStartNavigation: () => void;
};

export default function TripPreview({
  location,
  route,
  onOpenMap,
  onOpenSearch,
  onClearRoute,
  onStartNavigation,
}: Props) {
  const { scheme, colors, shadows } = useTheme();
  const styles = useStyles();
  const origin: LatLng = location ?? DEFAULT_CENTER;

  const region = useMemo(() => {
    if (route.status === 'ready') return regionForCoordinates(route.route.coordinates, origin);
    if (route.status !== 'idle') {
      return regionForCoordinates([origin, route.destination.location], origin);
    }
    return regionForCoordinates([], origin);
  }, [route, origin]);

  return (
    <Animated.View style={[styles.card, shadows.card]} layout={LinearTransition.duration(260)}>
      <Pressable
        onPress={onOpenMap}
        accessibilityRole="button"
        accessibilityLabel="Open the map in full screen"
        style={styles.mapWrap}
      >
        <View style={styles.mapTouchBlock}>
          <MapView
            style={StyleSheet.absoluteFill}
            region={region}
            mapType={baseMapType('standard')}
            userInterfaceStyle={scheme}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsCompass={false}
            moveOnMarkerPress={false}
          >
            <MapTiles mapType="standard" />
            {location && <LocationDot coordinate={location} />}
            {route.status !== 'idle' && (
              <RouteLayer
                compact
                route={route.status === 'ready' ? route.route : null}
                destination={route.destination}
              />
            )}
          </MapView>
        </View>
        <View style={styles.expand}>
          <Ionicons name="expand" size={15} color={colors.text} />
          <Text style={styles.expandText}>Full screen</Text>
        </View>
      </Pressable>

      <Animated.View
        key={route.status}
        entering={FadeIn.duration(240)}
        exiting={FadeOut.duration(120)}
        style={styles.body}
      >
        <TripDetails
          route={route}
          onOpenMap={onOpenMap}
          onOpenSearch={onOpenSearch}
          onClearRoute={onClearRoute}
          onStartNavigation={onStartNavigation}
        />
      </Animated.View>
    </Animated.View>
  );
}

type DetailsProps = Omit<Props, 'location'>;

function TripDetails({
  route,
  onOpenMap,
  onOpenSearch,
  onClearRoute,
  onStartNavigation,
}: DetailsProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  if (route.status === 'idle') {
    return (
      <>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <Text style={styles.title}>No active trip</Text>
            <Text style={styles.subtitle}>Pick a destination to see the route, time, and fare.</Text>
          </View>
        </View>
        <ActionButton icon="search" label="Choose destination" onPress={onOpenSearch} />
      </>
    );
  }

  const place = splitPlaceLabel(route.destination.label);

  const header = (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Ionicons name="flag" size={18} color={colors.accent} />
      </View>
      <View style={styles.titleText}>
        <Text style={styles.title} numberOfLines={1}>
          {place.title}
        </Text>
        {place.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {place.subtitle}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onClearRoute}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Clear route"
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );

  if (route.status === 'routing') {
    return (
      <>
        {header}
        <View style={styles.statusRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Finding the best route...</Text>
        </View>
      </>
    );
  }

  if (route.status === 'error') {
    return (
      <>
        {header}
        <View style={styles.statusRow}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.statusText}>{SERVICE_ERROR_MESSAGES[route.kind]}</Text>
        </View>
        <ActionButton icon="map-outline" label="Open map" onPress={onOpenMap} secondary />
      </>
    );
  }

  const minutes = estimateTravelMinutes(route.route.durationSeconds);

  return (
    <>
      {header}
      <View style={styles.stats}>
        <Stat label="Fare" value={`${PESO}${calculateFare(route.route.distanceMeters)}`} />
        <View style={styles.statDivider} />
        <Stat label="Time" value={`${minutes} min`} />
        <View style={styles.statDivider} />
        <Stat label="Distance" value={formatDistance(route.route.distanceMeters)} />
        <View style={styles.statDivider} />
        <Stat label="Arrive" value={formatArrival(minutes)} />
      </View>
      <View style={styles.actions}>
        <ActionButton icon="navigate" label="Start" onPress={onStartNavigation} grow />
        <ActionButton icon="list" label="Details" onPress={onOpenMap} secondary />
      </View>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

type ActionProps = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  grow?: boolean;
  secondary?: boolean;
};

function ActionButton({ icon, label, onPress, grow = false, secondary = false }: ActionProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        grow && styles.grow,
        pressed && styles.actionPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={secondary ? colors.primary : colors.onPrimary} />
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function LocationDot({ coordinate }: { coordinate: LatLng }) {
  const styles = useStyles();
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), SNAPSHOT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: coordinate.latitude, longitude: coordinate.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={4}
    >
      <View style={styles.dotHalo}>
        <View style={styles.dot} />
      </View>
    </Marker>
  );
}

const useStyles = makeStyles(({ colors, shadows }) => ({
  card: {
    overflow: 'hidden',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapWrap: {
    height: MAP_HEIGHT,
    backgroundColor: colors.mapBackdrop,
  },
  // The preview is not interactive. Taps go to the Pressable, which opens the full map.
  mapTouchBlock: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
  expand: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    padding: 16,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceAlt,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  actionSecondary: {
    backgroundColor: colors.primarySoft,
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  actionTextSecondary: {
    color: colors.primary,
  },
  dotHalo: {
    width: DOT_SIZE + 10,
    height: DOT_SIZE + 10,
    borderRadius: (DOT_SIZE + 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}33`,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
}));

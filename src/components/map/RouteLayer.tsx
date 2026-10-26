import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker, Polyline } from 'react-native-maps';

import { makeStyles, useTheme } from '../../hooks/useTheme';
import type { Route } from '../../services/routing';
import type { Place } from '../../services/places';

const SNAPSHOT_MS = 300;
const PIN_SIZE = 36;
const PIN_TIP = 8;

type Props = {
  route: Route | null;
  destination: Place;
  compact?: boolean;
};

export default function RouteLayer({ route, destination, compact = false }: Props) {
  const { colors } = useTheme();
  const width = compact ? 4 : 6;

  return (
    <>
      {route && (
        <>
          <Polyline
            coordinates={route.coordinates}
            strokeColor={colors.routeCasing}
            strokeWidth={width + 4}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
          <Polyline
            coordinates={route.coordinates}
            strokeColor={colors.primary}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        </>
      )}
      <DestinationPin key={destination.label} destination={destination} />
    </>
  );
}

function DestinationPin({ destination }: { destination: Place }) {
  const { colors } = useTheme();
  const styles = useStyles();
  // Custom marker views are snapshotted. Keep tracking briefly so the icon font renders.
  // The parent keys this pin by destination, so a new place remounts it.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), SNAPSHOT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={destination.location}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={3}
    >
      <View style={styles.pin}>
        <View style={styles.head}>
          <Ionicons name="flag" size={16} color={colors.onPrimary} />
        </View>
        <View style={styles.tip} />
      </View>
    </Marker>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  pin: {
    alignItems: 'center',
    width: PIN_SIZE + 8,
    height: PIN_SIZE + PIN_TIP + 4,
  },
  head: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  tip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: PIN_TIP,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.accent,
  },
}));

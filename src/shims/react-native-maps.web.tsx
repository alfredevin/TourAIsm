import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

// react-native-maps is native-only; this stub keeps the web bundle from crashing.
// Metro aliases the package to this file on web (see metro.config.js).

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const MapView = forwardRef<unknown, MapViewProps>(function MapView({ style }, ref) {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    animateCamera: () => {},
    fitToCoordinates: () => {},
  }));

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Map is available on the mobile app only.</Text>
    </View>
  );
});

export default MapView;

export const Marker = () => null;
export const Polyline = () => null;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  text: {
    color: '#6b7280',
    fontSize: 14,
  },
});

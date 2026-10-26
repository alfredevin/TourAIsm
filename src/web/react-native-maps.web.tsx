// Web stub: react-native-maps is native-only and crashes the web bundle at import time.
import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = { style?: StyleProp<ViewStyle>; children?: ReactNode } & Record<string, any>;

const MapView = forwardRef<unknown, Props>(function MapView({ style }, ref) {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => undefined,
    animateCamera: () => undefined,
    fitToCoordinates: () => undefined,
  }));
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.text}>Map preview is available on Android / iOS</Text>
    </View>
  );
});

export const Marker = (_: Props) => null;
export const Polyline = (_: Props) => null;

const styles = StyleSheet.create({
  box: { backgroundColor: '#dfe6ec', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#5b6770', fontSize: 13 },
});

export default MapView;

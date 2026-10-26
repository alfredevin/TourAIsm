import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { resolveScheme, setDisplayedScheme, useThemeStore } from '../hooks/useTheme';
import { palettes, type Scheme } from '../theme';

const FADE_IN_MS = 180;
const FADE_OUT_MS = 320;

// Full-screen veil in the incoming background color. It fades in, the theme swaps
// underneath it, then it fades out to reveal the new theme.
export default function ThemeTransition() {
  const { mode, displayed, loaded } = useThemeStore();
  const system: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const target = resolveScheme(mode, system);
  const opacity = useSharedValue(0);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palettes[displayed].background).catch(() => undefined);
  }, [displayed]);

  useEffect(() => {
    if (!loaded || target === displayed) return;
    opacity.value = withTiming(
      1,
      { duration: FADE_IN_MS, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (!finished) return;
        scheduleOnRN(setDisplayedScheme, target);
        opacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.inOut(Easing.quad) });
      },
    );
  }, [loaded, target, displayed, opacity]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <>
      <StatusBar style={displayed === 'dark' ? 'light' : 'dark'} />
      <Animated.View
        style={[styles.veil, { backgroundColor: palettes[target].background }, veilStyle]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING } from '../motion';
import { makeStyles, toggleTheme, useTheme } from '../hooks/useTheme';

type Props = {
  size?: number;
};

// Sun in light mode, moon in dark mode. The icons rotate and cross-fade on toggle.
export default function ThemeToggle({ size = 44 }: Props) {
  const { scheme, colors, shadows } = useTheme();
  const styles = useStyles();
  const dark = scheme === 'dark';
  const progress = useSharedValue(dark ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    progress.set(withSpring(dark ? 1 : 0, SPRING));
  }, [dark, progress]);

  const sunStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 90])}deg` },
      { scale: interpolate(progress.value, [0, 1], [1, 0.5]) },
    ],
  }));
  const moonStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [-90, 0])}deg` },
      { scale: interpolate(progress.value, [0, 1], [0.5, 1]) },
    ],
  }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  const iconSize = Math.round(size * 0.45);

  return (
    <Pressable
      onPress={toggleTheme}
      onPressIn={() => {
        press.set(withSpring(0.9, SPRING));
      }}
      onPressOut={() => {
        press.set(withSpring(1, SPRING));
      }}
      hitSlop={6}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: dark }}
    >
      <Animated.View
        style={[
          styles.button,
          shadows.card,
          { width: size, height: size, borderRadius: size / 2 },
          pressStyle,
        ]}
      >
        <Animated.View style={[styles.icon, sunStyle]}>
          <Ionicons name="sunny" size={iconSize} color={colors.accent} />
        </Animated.View>
        <Animated.View style={[styles.icon, moonStyle]}>
          <Ionicons name="moon" size={iconSize} color={colors.primary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  icon: {
    position: 'absolute',
  },
}));

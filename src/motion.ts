import { useEffect } from 'react';
import {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated';

export const SPRING: WithSpringConfig = { damping: 18, stiffness: 150, mass: 0.9 };

export function useEntrance(active: boolean, delay = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = active ? withDelay(delay, withSpring(1, SPRING)) : 0;
  }, [active, delay, progress]);

  return useAnimatedStyle(() => ({
    opacity: clamp(progress.value, 0, 1),
    transform: [
      { translateY: (1 - progress.value) * 16 },
      { scale: 0.94 + 0.06 * progress.value },
    ],
  }));
}

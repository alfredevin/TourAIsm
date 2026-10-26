import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { SPRING } from '../../motion';
import { TAB_BAR_SPACE } from '../../navigation/TabBar';

const SIZE = 60;
const MARGIN = 16;
// Movement below this counts as a tap, not a drag.
const TAP_SLOP = 6;

type Props = {
  hidden: boolean;
  onPress: () => void;
};

// A draggable chat button. It snaps to the nearest side edge so it never blocks the middle of
// the screen, and the tourist can park it away from whatever it overlaps.
export default function ChatFab({ hidden, onPress }: Props) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const minX = MARGIN;
  const maxX = width - SIZE - MARGIN;
  const minY = insets.top + MARGIN;
  const maxY = height - SIZE - insets.bottom - MARGIN;

  const x = useSharedValue(maxX);
  const y = useSharedValue(Math.max(minY, height - insets.bottom - TAB_BAR_SPACE - SIZE - 12));
  const visible = useSharedValue(hidden ? 0 : 1);
  const start = useRef({ x: 0, y: 0 });
  const bounds = useRef({ minX, maxX, minY, maxY });
  const onPressRef = useRef(onPress);

  useEffect(() => {
    bounds.current = { minX, maxX, minY, maxY };
    onPressRef.current = onPress;
    // Keep the button on screen after rotation or a window resize.
    x.value = Math.min(Math.max(x.value, minX), maxX);
    y.value = Math.min(Math.max(y.value, minY), maxY);
  }, [minX, maxX, minY, maxY, onPress, x, y]);

  useEffect(() => {
    visible.value = withTiming(hidden ? 0 : 1, { duration: 200 });
  }, [hidden, visible]);

  // PanResponder callbacks run from touch events, never during render. The compiler lint rules
  // can't see that, so they are switched off for this block only.
  /* eslint-disable react-hooks/refs, react-hooks/immutability */
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { x: x.value, y: y.value };
        },
        onPanResponderMove: (_, gesture) => {
          const b = bounds.current;
          x.value = Math.min(Math.max(start.current.x + gesture.dx, b.minX), b.maxX);
          y.value = Math.min(Math.max(start.current.y + gesture.dy, b.minY), b.maxY);
        },
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < TAP_SLOP && Math.abs(gesture.dy) < TAP_SLOP) {
            onPressRef.current();
            return;
          }
          const b = bounds.current;
          const mid = (b.minX + b.maxX) / 2;
          x.value = withSpring(x.value < mid ? b.minX : b.maxX, SPRING);
        },
      }),
    [x, y],
  );
  /* eslint-enable react-hooks/refs, react-hooks/immutability */

  const style = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 0.8 + 0.2 * visible.value }],
  }));

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          pointerEvents: hidden ? 'none' : 'auto',
        },
        shadows.card,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open travel assistant"
      accessible
      onAccessibilityTap={onPress}
    >
      <Ionicons name="chatbubble-ellipses" size={28} color={colors.onPrimary} />
    </Animated.View>
  );
}

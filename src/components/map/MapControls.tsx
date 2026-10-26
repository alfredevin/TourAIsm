import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING } from '../../motion';
import { makeStyles, useTheme } from '../../hooks/useTheme';
import ThemeToggle from '../ThemeToggle';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type MapControl = {
  key: string;
  icon: IoniconName;
  label: string;
  onPress: () => void;
  active?: boolean;
};

type Props = {
  controls: MapControl[];
};

const BUTTON_SIZE = 48;

export default function MapControls({ controls }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.column}>
      <ThemeToggle size={BUTTON_SIZE} />
      {controls.map((control) => (
        <Animated.View
          key={control.key}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(200)}
        >
          <ControlButton {...control} />
        </Animated.View>
      ))}
    </View>
  );
}

function ControlButton({ icon, label, onPress, active = false }: MapControl) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPressIn={() => {
        scale.set(withSpring(0.9, SPRING));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, SPRING));
      }}
      onPress={onPress}
    >
      <Animated.View style={[styles.button, active && styles.active, shadows.card, pressStyle]}>
        <Ionicons name={icon} size={21} color={active ? colors.primary : colors.text} />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  column: {
    gap: 10,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  active: {
    backgroundColor: colors.primarySoft,
  },
}));

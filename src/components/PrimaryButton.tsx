import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type DerivedValue,
} from 'react-native-reanimated';

import { makeStyles, useTheme } from '../hooks/useTheme';
import { SPRING } from '../motion';
import { radius } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  progress: DerivedValue<number>;
  disabled: boolean;
  onPress: () => void;
};

export default function PrimaryButton({ progress, disabled, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const pressScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const nextLabelStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const permissionLabelStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <AnimatedPressable
      style={[styles.button, buttonStyle]}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressScale.set(withSpring(0.97, SPRING));
      }}
      onPressOut={() => {
        pressScale.set(withSpring(1, SPRING));
      }}
    >
      <Animated.View style={[styles.label, nextLabelStyle]}>
        <Text style={styles.text}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
      </Animated.View>
      <Animated.View style={[styles.label, permissionLabelStyle]}>
        <Ionicons name="navigate" size={20} color={colors.onPrimary} />
        <Text style={styles.text}>Allow location</Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  button: {
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onPrimary,
  },
}));

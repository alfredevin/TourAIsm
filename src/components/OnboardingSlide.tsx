import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { makeStyles } from '../hooks/useTheme';
import type { IllustrationProps } from './illustrations';
import { typography } from '../theme';

const PARALLAX = 0.25;
const TEXT_RISE = 24;

type Props = {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  title: string;
  subtitle: string;
  Illustration: ComponentType<IllustrationProps>;
  active: boolean;
};

export default function OnboardingSlide({
  index,
  scrollX,
  pageWidth,
  title,
  subtitle,
  Illustration,
  active,
}: Props) {
  const styles = useStyles();
  const illustrationStyle = useAnimatedStyle(() => {
    const page = scrollX.value / pageWidth - index;
    const distance = Math.abs(page);
    return {
      opacity: interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: page * pageWidth * PARALLAX },
        { scale: interpolate(distance, [0, 1], [1, 0.82], Extrapolation.CLAMP) },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / pageWidth - index);
    const progress = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * TEXT_RISE }],
    };
  });

  return (
    <View style={[styles.slide, { width: pageWidth }]}>
      <Animated.View style={[styles.illustration, illustrationStyle]}>
        <Illustration active={active} />
      </Animated.View>
      <Animated.View style={[styles.copy, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  illustration: {
    flex: 1,
    minHeight: 200,
  },
  copy: {
    minHeight: 152,
    paddingTop: 20,
    gap: 12,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.muted,
  },
}));

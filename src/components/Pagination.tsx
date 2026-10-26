import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { makeStyles } from '../hooks/useTheme';


const DOT_SIZE = 8;
const ACTIVE_DOT_WIDTH = 26;

type Props = {
  scrollX: SharedValue<number>;
  count: number;
  pageWidth: number;
};

export default function Pagination({ scrollX, count, pageWidth }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        <Dot key={index} index={index} scrollX={scrollX} pageWidth={pageWidth} />
      ))}
    </View>
  );
}

type DotProps = Omit<Props, 'count'> & { index: number };

function Dot({ index, scrollX, pageWidth }: DotProps) {
  const styles = useStyles();
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth];
    return {
      width: interpolate(
        scrollX.value,
        inputRange,
        [DOT_SIZE, ACTIVE_DOT_WIDTH, DOT_SIZE],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const useStyles = makeStyles(({ colors }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: DOT_SIZE,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginHorizontal: 4,
    backgroundColor: colors.primary,
  },
}));

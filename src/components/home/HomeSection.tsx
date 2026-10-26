import type { ReactNode } from 'react';
import { Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { makeStyles } from '../../hooks/useTheme';
import { useEntrance } from '../../motion';

type Props = {
  active: boolean;
  delay: number;
  title?: string;
  children: ReactNode;
};

export default function HomeSection({ active, delay, title, children }: Props) {
  const styles = useStyles();
  const entrance = useEntrance(active, delay);

  return (
    <Animated.View style={[styles.section, entrance]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </Animated.View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  section: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
}));

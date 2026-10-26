import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CheckIn } from '../hooks/useDestinationCheckIn';
import { makeStyles, useTheme } from '../hooks/useTheme';
import { radius } from '../theme';

const VISIBLE_MS = 4500;

type Props = {
  checkIn: CheckIn | null;
  onDismiss: () => void;
};

export default function RewardToast({ checkIn, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useStyles();

  useEffect(() => {
    if (!checkIn) return;
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [checkIn, onDismiss]);

  if (!checkIn) return null;
  const { destination } = checkIn;

  return (
    <Animated.View
      key={checkIn.key}
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(250)}
      style={[styles.toast, shadows.card, { top: insets.top + 12 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.badge}>
        <Ionicons name="star" size={22} color={colors.accent} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>+{destination.points} points</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {`You're at ${destination.name}!`}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
}));

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';

import type { NavigationProgress } from '../../hooks/useNavigationProgress';
import { makeStyles, useTheme } from '../../hooks/useTheme';
import { calculateFare, estimateTravelMinutes } from '../../services/fare';
import { radius } from '../../theme';
import { formatArrival, formatDistance } from '../../utils/route';
import StepIcon from './StepIcon';

const PESO = '₱';
const MPS_TO_KMH = 3.6;

type BannerProps = {
  progress: NavigationProgress;
  rerouting: boolean;
};

export function NavigationBanner({ progress, rerouting }: BannerProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const { next, then, arrived } = progress;

  const title = arrived
    ? 'You have arrived'
    : rerouting
      ? 'Rerouting...'
      : (next?.street ?? next?.instruction ?? 'Follow the route');
  const subtitle = arrived || rerouting || !next?.street ? null : next.instruction;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOut.duration(150)}>
      <View style={[styles.banner, shadows.card]}>
        <View style={styles.maneuver}>
          <StepIcon
            type={arrived ? 'arrive' : rerouting ? 'roundabout' : (next?.type ?? 'straight')}
            size={34}
            color={colors.onPrimary}
          />
          {!arrived && !rerouting && (
            <Text style={styles.distance}>{formatDistance(progress.distanceToNext)}</Text>
          )}
        </View>
        <Animated.View key={title} entering={FadeIn.duration(200)} style={styles.bannerText}>
          <Text style={styles.street} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.instruction} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </Animated.View>
      </View>
      {then && !arrived && !rerouting && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.then}>
          <Text style={styles.thenText}>Then</Text>
          <StepIcon type={then.type} size={16} color={colors.onPrimary} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

type FooterProps = {
  progress: NavigationProgress;
  totalMeters: number;
  onExit: () => void;
};

export function NavigationFooter({ progress, totalMeters, onExit }: FooterProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const minutes = estimateTravelMinutes(progress.remainingSeconds);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18)}
      exiting={FadeOut.duration(150)}
      style={[styles.footer, shadows.card]}
    >
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel={progress.arrived ? 'End trip' : 'Exit navigation'}
        hitSlop={8}
        style={({ pressed }) => [styles.exit, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={24} color={colors.danger} />
      </Pressable>
      <View style={styles.footerCenter}>
        {progress.arrived ? (
          <Text style={styles.footerEta}>Trip complete</Text>
        ) : (
          <Text style={styles.footerEta}>{minutes} min</Text>
        )}
        <Text style={styles.footerMeta}>
          {formatDistance(progress.remainingMeters)} {'·'} {formatArrival(minutes)}
        </Text>
      </View>
      <View style={styles.footerFare}>
        <Ionicons name="cash-outline" size={14} color={colors.primary} />
        <Text style={styles.footerFareText}>
          {PESO}
          {calculateFare(totalMeters)}
        </Text>
      </View>
    </Animated.View>
  );
}

export function SpeedBubble({ speed }: { speed: number }) {
  const { shadows } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.speed, shadows.card]}>
      <Text style={styles.speedValue}>{Math.round(speed * MPS_TO_KMH)}</Text>
      <Text style={styles.speedUnit}>km/h</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 84,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.card,
    backgroundColor: colors.nav,
  },
  maneuver: {
    alignItems: 'center',
    minWidth: 52,
  },
  distance: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  street: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.onPrimary,
  },
  instruction: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.82)',
  },
  then: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -10,
    marginLeft: 14,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomLeftRadius: radius.button,
    borderBottomRightRadius: radius.button,
    backgroundColor: colors.navDeep,
    zIndex: -1,
  },
  thenText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  exit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    opacity: 0.75,
  },
  footerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  footerEta: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.success,
  },
  footerMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  footerFare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  footerFareText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  speed: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  speedValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
    color: colors.text,
  },
  speedUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
  },
}));

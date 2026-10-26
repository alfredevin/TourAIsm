import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  clamp,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { makeStyles, useTheme } from '../hooks/useTheme';
import { SPRING, useEntrance } from '../motion';
import { radius } from '../theme';

export type IllustrationProps = { active: boolean };

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function MapBackdrop() {
  const styles = useStyles();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.road, styles.roadHorizontal, { top: '30%' }]} />
      <View style={[styles.road, styles.roadHorizontal, { top: '76%', height: 12 }]} />
      <View style={[styles.road, styles.roadVertical, { left: '22%' }]} />
      <View style={[styles.road, styles.roadVertical, { left: '80%', width: 12 }]} />
      <View style={[styles.block, { top: '8%', left: '6%', width: '26%', height: '16%' }]} />
      <View style={[styles.block, { top: '40%', left: '32%', width: '32%', height: '22%' }]} />
      <View style={[styles.block, { top: '84%', left: '36%', width: '20%', height: '12%' }]} />
    </View>
  );
}

function InfoItem({ icon, label }: { icon: IoniconName; label: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={styles.infoText}>{label}</Text>
    </View>
  );
}

export function FareIllustration({ active }: IllustrationProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const cardStyle = useEntrance(active, 0);
  const headerStyle = useEntrance(active, 150);
  const priceStyle = useEntrance(active, 230);
  const infoStyle = useEntrance(active, 310);
  const badgeStyle = useEntrance(active, 420);

  return (
    <View style={[styles.frame, { backgroundColor: colors.mapBackdrop }]}>
      <MapBackdrop />
      <View style={styles.centerStage}>
        <Animated.View style={[styles.fareCard, shadows.card, cardStyle]}>
          <Animated.View style={[styles.row, headerStyle]}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name="rickshaw" size={22} color={colors.primary} />
            </View>
            <Text style={styles.cardLabel}>Tricycle</Text>
          </Animated.View>
          <Animated.View style={priceStyle}>
            <Text style={styles.caption}>Estimated fare</Text>
            <Text style={styles.price}>{'\u20B145'}</Text>
          </Animated.View>
          <Animated.View style={[styles.row, styles.infoRow, infoStyle]}>
            <View style={styles.infoChip}>
              <InfoItem icon="navigate" label="2.6 km" />
            </View>
            <View style={styles.infoChip}>
              <InfoItem icon="time-outline" label="6 min" />
            </View>
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.badge, shadows.soft, badgeStyle]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.badgeText}>Fair price</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export function RouteInputIllustration({ active }: IllustrationProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const cardStyle = useEntrance(active, 0);
  const fromStyle = useEntrance(active, 160);
  const toStyle = useEntrance(active, 280);
  const hintStyle = useEntrance(active, 480);

  const swapRotation = useSharedValue(0);
  useEffect(() => {
    swapRotation.value = active ? withDelay(620, withSpring(180, SPRING)) : 0;
  }, [active, swapRotation]);

  const swapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swapRotation.value}deg` }],
  }));

  return (
    <View style={[styles.frame, styles.routeFrame]}>
      <View style={styles.centerStage}>
        <Animated.View style={[styles.routeCard, shadows.card, cardStyle]}>
          <View style={styles.routeBody}>
            <View style={styles.rail}>
              <View style={styles.iconBubble}>
                <Ionicons name="radio-button-on" size={20} color={colors.primary} />
              </View>
              <View style={styles.connector} />
              <View style={styles.iconBubble}>
                <Ionicons name="location" size={20} color={colors.accent} />
              </View>
            </View>
            <View style={styles.routeTexts}>
              <Animated.View style={[styles.routeRow, fromStyle]}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeValue}>Your location</Text>
              </Animated.View>
              <Animated.View style={[styles.routeRow, toStyle]}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={[styles.routeValue, styles.routePlaceholder]}>Choose destination</Text>
              </Animated.View>
            </View>
          </View>
          <Animated.View style={[styles.swapButton, shadows.soft, swapStyle]}>
            <Ionicons name="swap-vertical" size={20} color={colors.onPrimary} />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.hintPill, hintStyle]}>
          <Text style={styles.hintText}>Tap to choose</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const ROUTE_THICKNESS = 6;
const ROUTE_START = { x: 18, y: 60 };
const ROUTE_TURN_X = 70;
const ROUTE_DESTINATION = { x: 70, y: 22 };
const DRAW_MS = 600;
const DRAW_TIMING = { duration: DRAW_MS, easing: Easing.out(Easing.cubic) };

export function MapRouteIllustration({ active }: IllustrationProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const dotStyle = useEntrance(active, 0);
  const chipStyle = useEntrance(active, 1400);
  const horizontal = useSharedValue(0);
  const vertical = useSharedValue(0);
  const pin = useSharedValue(0);

  useEffect(() => {
    if (active) {
      horizontal.value = withTiming(1, DRAW_TIMING);
      vertical.value = withDelay(DRAW_MS, withTiming(1, DRAW_TIMING));
      pin.value = withDelay(DRAW_MS * 2, withSpring(1, SPRING));
    } else {
      horizontal.value = 0;
      vertical.value = 0;
      pin.value = 0;
    }
  }, [active, horizontal, vertical, pin]);

  const horizontalStyle = useAnimatedStyle(() => ({
    width: `${horizontal.value * (ROUTE_TURN_X - ROUTE_START.x)}%`,
  }));
  const verticalStyle = useAnimatedStyle(() => ({
    height: `${vertical.value * (ROUTE_START.y - ROUTE_DESTINATION.y)}%`,
  }));
  const pinStyle = useAnimatedStyle(() => ({
    opacity: clamp(pin.value, 0, 1),
    transform: [{ translateY: (pin.value - 1) * 48 }],
  }));

  return (
    <View style={[styles.frame, { backgroundColor: colors.mapBackdrop }]}>
      <MapBackdrop />
      <Animated.View style={[styles.routeLine, styles.routeHorizontal, horizontalStyle]} />
      <Animated.View style={[styles.routeLine, styles.routeVertical, verticalStyle]} />
      <Animated.View style={[styles.routeDot, dotStyle]} />
      <Animated.View style={[styles.destination, pinStyle]}>
        <Ionicons name="location" size={38} color={colors.accent} />
      </Animated.View>
      <View style={styles.routeChipWrap} pointerEvents="none">
        <Animated.View style={[styles.routeChip, shadows.card, chipStyle]}>
          <InfoItem icon="navigate" label="2.6 km" />
          <View style={styles.divider} />
          <InfoItem icon="time-outline" label="6 min" />
          <View style={styles.divider} />
          <Text style={styles.routePrice}>{'\u20B145'}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const CORE_SIZE = 128;
const PULSE_DURATION = 2400;
const PULSE_DELAYS = [0, 800, 1600];

function PulseRing({ active, delay }: { active: boolean; delay: number }) {
  const styles = useStyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.out(Easing.quad) }), -1, false),
      );
    } else {
      cancelAnimation(progress);
      progress.value = 0;
    }
  }, [active, delay, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 2.2]) }],
  }));

  return <Animated.View style={[styles.ring, ringStyle]} />;
}

export function LocationIllustration({ active }: IllustrationProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const coreStyle = useEntrance(active, 0);
  const pillStyle = useEntrance(active, 420);

  return (
    <View style={[styles.frame, { backgroundColor: colors.mapBackdrop }]}>
      <MapBackdrop />
      <View style={styles.centerStage}>
        <View style={styles.pulseBox}>
          {PULSE_DELAYS.map((delay) => (
            <PulseRing key={delay} active={active} delay={delay} />
          ))}
          <Animated.View style={[styles.core, shadows.card, coreStyle]}>
            <Ionicons name="navigate" size={52} color={colors.onPrimary} />
          </Animated.View>
        </View>
      </View>
      <Animated.View style={[styles.permissionPill, shadows.soft, pillStyle]}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
        <Text style={styles.permissionText}>Used only while the app is open</Text>
      </Animated.View>
    </View>
  );
}

const TEAM: { icon: IoniconName; name: string; role: string }[] = [
  { icon: 'phone-portrait-outline', name: 'Rhea Nicole Recarro', role: 'Mobile & Frontend' },
  { icon: 'server-outline', name: 'John Mark Dalumpienes', role: 'Backend & Database' },
  { icon: 'sparkles-outline', name: 'Ashly Nicole Roldan', role: 'Project Lead & AI Integration' },
];

export function TeamIllustration({ active }: IllustrationProps) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const cardStyle = useEntrance(active, 0);
  const firstStyle = useEntrance(active, 150);
  const secondStyle = useEntrance(active, 250);
  const thirdStyle = useEntrance(active, 350);
  const memberStyles = [firstStyle, secondStyle, thirdStyle];

  return (
    <View style={[styles.frame, { backgroundColor: colors.mapBackdrop }]}>
      <MapBackdrop />
      <View style={styles.centerStage}>
        <Animated.View style={[styles.fareCard, shadows.card, cardStyle]}>
          <Text style={styles.caption}>BSIS, Marinduque State University</Text>
          {TEAM.map((member, index) => (
            <Animated.View key={member.name} style={[styles.row, styles.teamRow, memberStyles[index]]}>
              <View style={styles.iconBubble}>
                <Ionicons name={member.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.teamText}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, shadows }) => ({
  teamRow: {
    marginTop: 14,
  },
  teamText: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  teamRole: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  frame: {
    flex: 1,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  routeFrame: {
    backgroundColor: colors.primarySoft,
  },
  road: {
    position: 'absolute',
    backgroundColor: colors.mapRoad,
  },
  roadHorizontal: {
    left: 0,
    right: 0,
    height: 10,
  },
  roadVertical: {
    top: 0,
    bottom: 0,
    width: 10,
  },
  block: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: colors.mapBlock,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  caption: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  price: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: colors.text,
  },
  infoRow: {
    marginTop: 14,
    gap: 8,
  },
  infoChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  fareCard: {
    marginTop: 28,
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  routeCard: {
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  routeBody: {
    flexDirection: 'row',
  },
  rail: {
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    width: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  routeTexts: {
    flex: 1,
    gap: 28,
    marginLeft: 14,
    paddingRight: 44,
  },
  routeRow: {
    height: 40,
    justifyContent: 'center',
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: colors.muted,
  },
  routeValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  routePlaceholder: {
    fontWeight: '600',
    color: colors.muted,
  },
  swapButton: {
    position: 'absolute',
    right: 18,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  hintPill: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  routeLine: {
    position: 'absolute',
    height: ROUTE_THICKNESS,
    borderRadius: ROUTE_THICKNESS / 2,
    backgroundColor: colors.primary,
  },
  routeHorizontal: {
    left: '18%',
    top: '60%',
    marginTop: -ROUTE_THICKNESS / 2,
  },
  routeVertical: {
    width: ROUTE_THICKNESS,
    left: '70%',
    bottom: '40%',
    marginLeft: -ROUTE_THICKNESS / 2,
    marginBottom: -ROUTE_THICKNESS / 2,
  },
  routeDot: {
    position: 'absolute',
    left: '18%',
    top: '60%',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  destination: {
    position: 'absolute',
    left: '70%',
    top: '22%',
    marginLeft: -19,
    marginTop: -34,
  },
  routeChipWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 14,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },
  routePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  pulseBox: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  permissionPill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
}));

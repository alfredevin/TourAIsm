import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { CHECK_IN_RADIUS_M, DESTINATIONS } from '../../data/destinations';
import type { UserLocation } from '../../hooks/useCurrentLocation';
import { useRewards, visitedCount } from '../../hooks/useRewards';
import { makeStyles, useTheme } from '../../hooks/useTheme';
import { radius } from '../../theme';
import { distanceMeters, formatDistance } from '../../utils/route';

type Props = {
  location: UserLocation | null;
};

export default function RewardsCard({ location }: Props) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const rewards = useRewards();
  const visited = visitedCount(rewards);

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.summary}>
        <View style={styles.badge}>
          <Ionicons name="star" size={26} color={colors.accent} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.points}>{rewards.points} points</Text>
          <Text style={styles.caption}>
            {visited} of {DESTINATIONS.length} destinations visited
          </Text>
        </View>
      </View>

      {DESTINATIONS.map((destination) => {
        const count = rewards.visits[destination.id] ?? 0;
        const meters = location ? distanceMeters(location, destination.location) : null;
        const here = meters !== null && meters <= CHECK_IN_RADIUS_M;
        const detail = here
          ? "You're here"
          : meters !== null
            ? `${formatDistance(meters)} away`
            : destination.town;

        return (
          <View key={destination.id} style={[styles.row, styles.divider]}>
            <View style={[styles.icon, count > 0 && styles.iconVisited]}>
              <Ionicons
                name={count > 0 ? 'checkmark' : 'location-outline'}
                size={18}
                color={count > 0 ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.name} numberOfLines={1}>
                {destination.name}
              </Text>
              <Text style={styles.detail} numberOfLines={1}>
                {detail}
              </Text>
            </View>
            <Text style={styles.reward}>+{destination.points}</Text>
          </View>
        );
      })}

      <Text style={styles.hint}>
        Visit a destination to earn points. Each place pays out once a day.
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  points: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconVisited: {
    backgroundColor: colors.successSoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  detail: {
    fontSize: 13,
    color: colors.muted,
  },
  reward: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
  },
  hint: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    color: colors.muted,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
}));

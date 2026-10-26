import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { makeStyles, useTheme } from '../../hooks/useTheme';
import type { Place } from '../../services/places';
import { radius } from '../../theme';
import { splitPlaceLabel } from '../../utils/route';

type Props = {
  places: Place[];
  onSelect: (place: Place) => void;
};

export default function RecentPlaces({ places, onSelect }: Props) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.card, shadows.soft]}>
      {places.map((place, index) => {
        const { title, subtitle } = splitPlaceLabel(place.label);
        return (
          <Pressable
            key={`${place.label}-${index}`}
            onPress={() => onSelect(place)}
            accessibilityRole="button"
            accessibilityLabel={`Route to ${title} again`}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.divider,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.icon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.text}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
  },
}));

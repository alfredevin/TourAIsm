import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { makeStyles, useTheme } from '../../hooks/useTheme';
import { radius, type ThemeColors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

type Tip = {
  icon: IconName;
  tint: keyof Pick<ThemeColors, 'success' | 'accent' | 'primary'>;
  title: string;
  body: string;
};

const TIPS: Tip[] = [
  {
    icon: 'cash-outline',
    tint: 'success',
    title: 'Confirm the fare',
    body: 'Agree on the fare with the driver before you ride, so there are no surprises.',
  },
  {
    icon: 'time-outline',
    tint: 'accent',
    title: 'Beat the rush',
    body: 'Leave before peak hours for a faster, less crowded trip.',
  },
  {
    icon: 'shield-checkmark-outline',
    tint: 'primary',
    title: 'Keep valuables close',
    body: 'Keep your phone and wallet in a closed bag while on the road.',
  },
];

const CARD_WIDTH = 240;
const GAP = 12;

export default function TipsRow() {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {TIPS.map((tip) => (
        <View key={tip.title} style={styles.card}>
          <View style={[styles.icon, { backgroundColor: `${colors[tip.tint]}22` }]}>
            <Ionicons name={tip.icon} size={20} color={colors[tip.tint]} />
          </View>
          <Text style={styles.title}>{tip.title}</Text>
          <Text style={styles.body}>{tip.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  scroll: {
    marginHorizontal: -20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: GAP,
  },
  card: {
    width: CARD_WIDTH,
    padding: 16,
    gap: 6,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
}));

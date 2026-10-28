import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SpriteCharacter, { type SpriteState } from '../components/character/SpriteCharacter';
import FareEstimator from '../components/home/FareEstimator';
import HomeSection from '../components/home/HomeSection';
import RecentPlaces from '../components/home/RecentPlaces';
import RewardsCard from '../components/home/RewardsCard';
import TipsRow from '../components/home/TipsRow';
import TripPreview from '../components/home/TripPreview';
import ThemeToggle from '../components/ThemeToggle';
import { useAppActive } from '../hooks/useAppActive';
import type { UserLocation } from '../hooks/useCurrentLocation';
import { useProfile } from '../hooks/useProfile';
import { useRecentPlaces } from '../hooks/useRecentPlaces';
import type { RouteState } from '../hooks/useRoute';
import { makeStyles, useTheme } from '../hooks/useTheme';
import { TAB_BAR_SPACE } from '../navigation/TabBar';
import type { Place } from '../services/places';
import { radius } from '../theme';

const WAVE_MS = 1400;
const STAGGER_MS = 70;
const AVATAR_SIZE = 52;

type Props = {
  active: boolean;
  location: UserLocation | null;
  route: RouteState;
  onOpenMap: () => void;
  onOpenSearch: () => void;
  onSelectPlace: (place: Place) => void;
  onClearRoute: () => void;
  onStartNavigation: () => void;
};

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({
  active,
  location,
  route,
  onOpenMap,
  onOpenSearch,
  onSelectPlace,
  onClearRoute,
  onStartNavigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const { profile } = useProfile();
  const recents = useRecentPlaces();
  const appActive = useAppActive();
  const live = active && appActive;
  const [pose, setPose] = useState<SpriteState>('idle');
  const [greeting, setGreeting] = useState(() => greetingForHour(new Date().getHours()));

  useEffect(() => {
    if (!live) {
      setPose('idle');
      return;
    }
    setGreeting(greetingForHour(new Date().getHours()));
    setPose('wave');
    const timer = setTimeout(() => setPose('idle'), WAVE_MS);
    return () => clearTimeout(timer);
  }, [live]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.fill}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_SPACE },
      ]}
    >
      <HomeSection active={active} delay={0}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <SpriteCharacter
              characterId={profile.characterId}
              direction="down"
              state={pose}
              size={AVATAR_SIZE - 6}
              active={live}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {profile.name}
            </Text>
          </View>
          <ThemeToggle size={44} />
        </View>
      </HomeSection>

      <HomeSection active={active} delay={STAGGER_MS}>
        <Pressable
          onPress={onOpenSearch}
          accessibilityRole="search"
          accessibilityLabel="Where to? Search for a place"
          style={({ pressed }) => [styles.search, shadows.card, pressed && styles.searchPressed]}
        >
          <Ionicons name="search" size={20} color={colors.primary} />
          <Text style={styles.searchText}>Where to?</Text>
          <View style={styles.searchDivider} />
          <Ionicons name="navigate-circle" size={26} color={colors.primary} />
        </Pressable>
      </HomeSection>

      <HomeSection active={active} delay={STAGGER_MS * 2} title="Your trip">
        <TripPreview
          location={location}
          route={route}
          onOpenMap={onOpenMap}
          onOpenSearch={onOpenSearch}
          onClearRoute={onClearRoute}
          onStartNavigation={onStartNavigation}
        />
      </HomeSection>

      {recents.length > 0 && (
        <HomeSection active={active} delay={STAGGER_MS * 3} title="Recent">
          <RecentPlaces places={recents} onSelect={onSelectPlace} />
        </HomeSection>
      )}

      <HomeSection active={active} delay={STAGGER_MS * 4} title="Rewards">
        <RewardsCard location={location} />
      </HomeSection>

      <HomeSection active={active} delay={STAGGER_MS * 5} title="Fare estimator">
        <FareEstimator />
      </HomeSection>

      <HomeSection active={active} delay={STAGGER_MS * 6} title="Travel tips">
        <TipsRow />
      </HomeSection>
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 58,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  searchPressed: {
    transform: [{ scale: 0.98 }],
  },
  searchText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.muted,
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
}));

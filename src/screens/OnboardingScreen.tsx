import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useState, type ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import {
  FareIllustration,
  LocationIllustration,
  MapRouteIllustration,
  RouteInputIllustration,
  TeamIllustration,
  type IllustrationProps,
} from '../components/illustrations';
import { makeStyles, useTheme } from '../hooks/useTheme';
import OnboardingSlide from '../components/OnboardingSlide';
import Pagination from '../components/Pagination';
import PrimaryButton from '../components/PrimaryButton';
import { APP_NAME, radius } from '../theme';

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  Illustration: ComponentType<IllustrationProps>;
};

const SLIDES: Slide[] = [
  {
    key: 'fare',
    title: 'Know the fare before you ride',
    subtitle: "See the estimated tricycle fare at a glance, so there's no guessing or haggling.",
    Illustration: FareIllustration,
  },
  {
    key: 'route-input',
    title: "Choose where you're coming from and going",
    subtitle: 'Enter your pickup and drop-off. One tap switches the direction.',
    Illustration: RouteInputIllustration,
  },
  {
    key: 'route-map',
    title: 'Route, distance, and time on the map',
    subtitle: 'See the road to your destination, along with the distance and estimated travel time.',
    Illustration: MapRouteIllustration,
  },
  {
    key: 'team',
    title: 'Built by Marinduque students',
    subtitle:
      'Three BSIS students at MarSU Santa Cruz, drawing on our SMART-MARSU campus project to bring mobile, backend, and AI integration to local commuters.',
    Illustration: TeamIllustration,
  },
  {
    key: 'location',
    title: 'Allow your location',
    subtitle: 'Your pickup point is set automatically. Location is only used while the app is open.',
    Illustration: LocationIllustration,
  },
];

const LAST_INDEX = SLIDES.length - 1;

type Props = {
  onFinish: () => void;
};

export default function OnboardingScreen({ onFinish }: Props) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<ScrollView>();
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const isLast = activeIndex === LAST_INDEX;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useAnimatedReaction(
    () => clamp(Math.round(scrollX.value / width), 0, LAST_INDEX),
    (page, previous) => {
      if (page !== previous) {
        scheduleOnRN(setActiveIndex, page);
      }
    },
  );

  const lastPageProgress = useDerivedValue(() =>
    interpolate(
      scrollX.value,
      [(LAST_INDEX - 1) * width, LAST_INDEX * width],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );

  const skipStyle = useAnimatedStyle(() => ({ opacity: 1 - lastPageProgress.value }));
  const laterStyle = useAnimatedStyle(() => ({ opacity: lastPageProgress.value }));

  const goToIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
    },
    [scrollRef, width],
  );

  const requestLocation = useCallback(async () => {
    setIsRequesting(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // Denied or unavailable: onboarding continues either way.
    }
    onFinish();
  }, [onFinish]);

  const handlePrimaryPress = () => {
    if (isLast) {
      void requestLocation();
      return;
    }
    goToIndex(activeIndex + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Ionicons name="navigate" size={18} color={colors.onPrimary} />
          </View>
          <Text style={styles.brandName}>{APP_NAME}</Text>
        </View>
        <Animated.View style={[styles.skipPill, shadows.soft, skipStyle]}>
          <Pressable
            disabled={isLast}
            hitSlop={8}
            onPress={() => goToIndex(LAST_INDEX)}
            style={styles.skipPressable}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        style={styles.pager}
      >
        {SLIDES.map((slide, index) => (
          <OnboardingSlide
            key={slide.key}
            index={index}
            scrollX={scrollX}
            pageWidth={width}
            title={slide.title}
            subtitle={slide.subtitle}
            Illustration={slide.Illustration}
            active={index === activeIndex}
          />
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pagination scrollX={scrollX} count={SLIDES.length} pageWidth={width} />
        <PrimaryButton
          progress={lastPageProgress}
          disabled={isRequesting}
          onPress={handlePrimaryPress}
        />
        <Animated.View style={[styles.laterRow, laterStyle]}>
          <Pressable
            disabled={!isLast}
            hitSlop={12}
            onPress={onFinish}
            style={styles.laterPressable}
          >
            <Text style={styles.laterText}>Maybe later</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  skipPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  skipPressable: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pager: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 14,
  },
  laterRow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterPressable: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  laterText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
  },
}));

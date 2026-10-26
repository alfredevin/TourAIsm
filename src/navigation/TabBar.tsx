import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '../hooks/useTheme';
import { SPRING } from '../motion';
import { typography } from '../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TabKey = 'home' | 'map' | 'profile' | 'settings';

type Tab = {
  key: TabKey;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
};

export const TABS: readonly Tab[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'map', label: 'Map', icon: 'map-outline', activeIcon: 'map' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

export const TAB_BAR_SPACE = 104;

const PADDING = 6;
const INSET = 4;
const HIDE_MS = 250;
const HIDE_OFFSET = 120;

type Props = {
  active: TabKey;
  hidden?: boolean;
  onChange: (key: TabKey) => void;
};

export default function TabBar({ active, hidden = false, onChange }: Props) {
  const { shadows } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const index = TABS.findIndex((tab) => tab.key === active);
  const position = useSharedValue(index);
  const slotWidth = useSharedValue(0);
  const hide = useSharedValue(hidden ? 1 : 0);

  useEffect(() => {
    hide.value = withTiming(hidden ? 1 : 0, { duration: HIDE_MS });
  }, [hidden, hide]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - hide.value,
    transform: [{ translateY: hide.value * (HIDE_OFFSET + insets.bottom) }],
  }));

  useEffect(() => {
    position.value = withSpring(index, SPRING);
  }, [index, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: Math.max(0, slotWidth.value - INSET * 2),
    transform: [{ translateX: PADDING + position.value * slotWidth.value + INSET }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    slotWidth.value = (event.nativeEvent.layout.width - PADDING * 2) / TABS.length;
  };

  return (
    <Animated.View
      style={[
        styles.bar,
        shadows.card,
        barStyle,
        { bottom: insets.bottom + 12, pointerEvents: hidden ? 'none' : 'auto' },
      ]}
      onLayout={onLayout}
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {TABS.map((tab, i) => (
        <TabItem
          key={tab.key}
          tab={tab}
          index={i}
          position={position}
          selected={tab.key === active}
          onPress={() => onChange(tab.key)}
        />
      ))}
    </Animated.View>
  );
}

type ItemProps = {
  tab: Tab;
  index: number;
  position: SharedValue<number>;
  selected: boolean;
  onPress: () => void;
};

function TabItem({ tab, index, position, selected, onPress }: ItemProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const focus = useDerivedValue(() =>
    interpolate(position.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  );
  const outlineStyle = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));
  const filledStyle = useAnimatedStyle(() => ({ opacity: focus.value }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(focus.value, [0, 1], [colors.muted, colors.primary]),
  }));

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
    >
      <View style={styles.iconBox}>
        <Animated.View style={[styles.iconLayer, outlineStyle]}>
          <Ionicons name={tab.icon} size={22} color={colors.muted} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, filledStyle]}>
          <Ionicons name={tab.activeIcon} size={22} color={colors.primary} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, labelStyle]}>{tab.label}</Animated.Text>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: 30,
    backgroundColor: colors.surface,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: 0,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
  },
  item: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconBox: {
    width: 26,
    height: 26,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.subtitle,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
}));

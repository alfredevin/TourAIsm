import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openAppSettings, type LocationStatus } from '../hooks/useCurrentLocation';
import { makeStyles, setThemeMode, useTheme, useThemeStore } from '../hooks/useTheme';
import { SPRING } from '../motion';
import { TAB_BAR_SPACE } from '../navigation/TabBar';
import type { MapType } from '../types/map';
import { APP_NAME, radius, typography, type ThemeMode } from '../theme';
import appConfig from '../../app.json';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const STATUS_LABEL: Record<LocationStatus, string> = {
  loading: 'Checking...',
  ready: 'Allowed',
  denied: 'Not allowed',
  unavailable: 'Unavailable',
};

type Option<T> = { value: T; label: string; icon: IoniconName };

const THEME_OPTIONS: Option<ThemeMode>[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const MAP_OPTIONS: Option<MapType>[] = [
  { value: 'standard', label: 'Standard', icon: 'map-outline' },
  { value: 'satellite', label: 'Satellite', icon: 'earth-outline' },
];

type Props = {
  locationStatus: LocationStatus;
  mapType: MapType;
  onSelectMapType: (type: MapType) => void;
  onResetOnboarding: () => void;
};

export default function SettingsScreen({
  locationStatus,
  mapType,
  onSelectMapType,
  onResetOnboarding,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { mode } = useThemeStore();

  return (
    <ScrollView
      style={styles.fill}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_SPACE },
      ]}
    >
      <Text style={styles.title}>Settings</Text>

      <Section title="Appearance">
        <Segmented options={THEME_OPTIONS} value={mode} onChange={setThemeMode} />
      </Section>

      <Section title="Map">
        <Segmented options={MAP_OPTIONS} value={mapType} onChange={onSelectMapType} />
      </Section>

      <Section title="Location">
        <Row icon="location-outline" label="Location access" value={STATUS_LABEL[locationStatus]} />
        <Action label="Open system settings" icon="open-outline" onPress={openAppSettings} />
      </Section>

      <Section title="Developer">
        <Action label="Replay onboarding" icon="refresh" onPress={onResetOnboarding} />
      </Section>

      <Section title="About">
        <Row
          icon="information-circle-outline"
          label={APP_NAME}
          value={`Version ${appConfig.expo.version}`}
        />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

type SegmentedProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Segmented control with a sliding highlight.
function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles();
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const [width, setWidth] = useState(0);
  const position = useSharedValue(index);
  const slot = width / options.length;

  useEffect(() => {
    position.value = withSpring(index, SPRING);
  }, [index, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: slot,
    transform: [{ translateX: position.value * slot }],
  }));

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.segment}>
      <View style={styles.segmentTrack} onLayout={onLayout}>
        {width > 0 && <Animated.View style={[styles.segmentIndicator, indicatorStyle]} />}
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.segmentOption}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? colors.onPrimary : colors.muted}
              />
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Row({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Action({ icon, label, onPress }: { icon: IoniconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
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
  title: {
    ...typography.title,
    color: colors.text,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowValue: {
    fontSize: 14,
    color: colors.muted,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
  segment: {
    padding: 6,
  },
  segmentTrack: {
    flexDirection: 'row',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.button - 4,
    backgroundColor: colors.primary,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
  },
  segmentLabelSelected: {
    color: colors.onPrimary,
  },
}));

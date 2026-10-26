import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, useTheme } from '../../hooks/useTheme';
import { FARE_CONFIG } from '../../config/fare';
import { calculateFare } from '../../services/fare';
import { radius } from '../../theme';

const MIN_KM = 1;
const MAX_KM = 30;
const START_KM = 3;
const STEP_KM = 1;
const METERS_PER_KM = 1000;
const PESO = '\u20B1';

type StepperProps = {
  icon: 'remove' | 'add';
  label: string;
  disabled: boolean;
  onPress: () => void;
};

function Stepper({ icon, label, disabled, onPress }: StepperProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.stepper,
        disabled && styles.stepperDisabled,
        pressed && styles.stepperPressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
    </Pressable>
  );
}

export default function FareEstimator() {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const [km, setKm] = useState(START_KM);
  const fare = calculateFare(km * METERS_PER_KM);

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.row}>
        <Stepper
          icon="remove"
          label="Decrease distance"
          disabled={km <= MIN_KM}
          onPress={() => setKm((value) => Math.max(MIN_KM, value - STEP_KM))}
        />
        <View style={styles.center}>
          <Text style={styles.fare} accessibilityLiveRegion="polite">
            {PESO}
            {fare}
          </Text>
          <Text style={styles.distance}>for {km} km</Text>
        </View>
        <Stepper
          icon="add"
          label="Increase distance"
          disabled={km >= MAX_KM}
          onPress={() => setKm((value) => Math.min(MAX_KM, value + STEP_KM))}
        />
      </View>
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
        <Text style={styles.note}>
          First {FARE_CONFIG.baseDistanceKm} km {PESO}
          {FARE_CONFIG.baseFare}, then {PESO}
          {FARE_CONFIG.perAdditionalKm} per km. Estimate only.
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    padding: 18,
    gap: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    gap: 2,
  },
  fare: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.text,
  },
  distance: {
    fontSize: 14,
    color: colors.muted,
  },
  stepper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperPressed: {
    transform: [{ scale: 0.92 }],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  note: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
}));

import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import type { RouteState } from '../../hooks/useRoute';
import { makeStyles, useTheme } from '../../hooks/useTheme';
import { calculateFare, estimateTravelMinutes } from '../../services/fare';
import { SERVICE_ERROR_MESSAGES } from '../../services/ors';
import type { RouteStep } from '../../services/routing';
import { radius } from '../../theme';
import { formatArrival, formatDistance, splitPlaceLabel } from '../../utils/route';
import StepIcon from './StepIcon';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const PESO = '₱';
const STEPS_MAX_RATIO = 0.34;
const LAYOUT = LinearTransition.springify().damping(20).stiffness(180);

type Props = {
  state: RouteState;
  fromLabel: string;
  onRetry: () => void;
  onClear: () => void;
  onStart: () => void;
};

export default function RouteSheet({ state, fromLabel, onRetry, onClear, onStart }: Props) {
  const { shadows } = useTheme();
  const styles = useStyles();

  return (
    <Animated.View
      style={[styles.sheet, shadows.card]}
      layout={LAYOUT}
      entering={FadeInDown.springify().damping(18)}
    >
      <View style={styles.handle} />
      <Animated.View key={state.status} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
        <SheetBody
          state={state}
          fromLabel={fromLabel}
          onRetry={onRetry}
          onClear={onClear}
          onStart={onStart}
        />
      </Animated.View>
    </Animated.View>
  );
}

function SheetBody({ state, fromLabel, onRetry, onClear, onStart }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  if (state.status === 'idle') {
    return (
      <View style={styles.idle}>
        <View style={styles.idleIcon}>
          <Ionicons name="navigate-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Plan a trip</Text>
          <Text style={styles.subtitle}>Search a destination to see the route and fare.</Text>
        </View>
      </View>
    );
  }

  const place = splitPlaceLabel(state.destination.label);
  const header = (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={styles.title} numberOfLines={1}>
          {place.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          From {fromLabel.toLowerCase()}
          {place.subtitle ? ` · ${place.subtitle}` : ''}
        </Text>
      </View>
      <IconButton icon="close" label="Clear route" onPress={onClear} />
    </View>
  );

  if (state.status === 'routing') {
    return (
      <View style={styles.body}>
        {header}
        <View style={styles.statusRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Finding the best route...</Text>
        </View>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.body}>
        {header}
        <View style={styles.statusRow}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={styles.statusText}>{SERVICE_ERROR_MESSAGES[state.kind]}</Text>
        </View>
        <Button icon="refresh" label="Try again" onPress={onRetry} />
      </View>
    );
  }

  return (
    <ReadyBody
      header={header}
      distance={state.route.distanceMeters}
      duration={state.route.durationSeconds}
      steps={state.route.steps}
      onStart={onStart}
    />
  );
}

type ReadyProps = {
  header: React.ReactNode;
  distance: number;
  duration: number;
  steps: RouteStep[];
  onStart: () => void;
};

function ReadyBody({ header, distance, duration, steps, onStart }: ReadyProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const minutes = estimateTravelMinutes(duration);

  return (
    <View style={styles.body}>
      {header}

      <View style={styles.summary}>
        <View style={styles.flex}>
          <Text style={styles.eta}>
            {minutes} min <Text style={styles.etaDistance}>({formatDistance(distance)})</Text>
          </Text>
          <Text style={styles.subtitle}>Arrive around {formatArrival(minutes)}</Text>
        </View>
        <View style={styles.fare}>
          <Text style={styles.fareLabel}>Fare</Text>
          <Text style={styles.fareValue}>
            {PESO}
            {calculateFare(distance)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button icon="navigate" label="Start" onPress={onStart} grow />
        {steps.length > 0 && (
          <Button
            icon={expanded ? 'chevron-down' : 'list'}
            label={expanded ? 'Hide' : 'Steps'}
            onPress={() => setExpanded((value) => !value)}
            secondary
          />
        )}
      </View>

      {expanded && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
          <ScrollView
            style={{ maxHeight: height * STEPS_MAX_RATIO }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {steps.map((step, index) => (
              <View key={index} style={styles.step}>
                <View style={[styles.stepIcon, step.type === 'arrive' && styles.stepIconArrive]}>
                  <StepIcon
                    type={step.type}
                    size={16}
                    color={step.type === 'arrive' ? colors.accent : colors.primary}
                  />
                </View>
                <View style={[styles.stepBody, index < steps.length - 1 && styles.stepDivider]}>
                  <Text style={styles.stepText}>{step.instruction}</Text>
                  {step.type !== 'arrive' && step.distanceMeters > 0 && (
                    <Text style={styles.stepMeta}>{formatDistance(step.distanceMeters)}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

type ButtonProps = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  grow?: boolean;
  secondary?: boolean;
};

function Button({ icon, label, onPress, grow = false, secondary = false }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        grow && styles.flex,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={secondary ? colors.primary : colors.onPrimary} />
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ icon, label, onPress }: { icon: IoniconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={18} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  flex: {
    flex: 1,
  },
  body: {
    gap: 14,
  },
  idle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    opacity: 0.75,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eta: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.success,
  },
  etaDistance: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    color: colors.muted,
  },
  fare: {
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceAlt,
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  fareValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.primarySoft,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  buttonTextSecondary: {
    color: colors.primary,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    marginTop: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stepIconArrive: {
    backgroundColor: colors.accentSoft,
  },
  stepBody: {
    flex: 1,
    paddingVertical: 12,
    gap: 2,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  stepMeta: {
    fontSize: 12,
    color: colors.muted,
  },
}));

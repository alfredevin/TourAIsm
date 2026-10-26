import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { makeStyles } from '../../hooks/useTheme';
import type { UserLocation } from '../../hooks/useCurrentLocation';
import { useProfile } from '../../hooks/useProfile';
import { useWalkFrame } from '../../hooks/useWalkFrame';
import type { CharacterDirection } from '../../data/characters';
import SpriteCharacter, { type SpriteState } from '../character/SpriteCharacter';
import NameTag from '../NameTag';

const MARKER_WIDTH = 160;
const MARKER_HEIGHT = 150;
const GROUND_Y = 134;
const CHARACTER_SIZE = 56;
const CHARACTER_TOP = 60;
const SHADOW_WIDTH = 46;
const SHADOW_HEIGHT = 12;
const RING_WIDTH = 56;
const RING_HEIGHT = 18;
const WALK_SPEED_MS = 0.5;
const SNAPSHOT_MS = 120;
const PULSE_MS = 1600;

type Props = {
  location: UserLocation;
  active: boolean;
};

function directionFromHeading(heading: number): CharacterDirection {
  const degrees = ((heading % 360) + 360) % 360;
  if (degrees >= 45 && degrees < 135) return 'right';
  if (degrees >= 135 && degrees < 225) return 'down';
  if (degrees >= 225 && degrees < 315) return 'left';
  return 'up';
}

export default function UserMarker({ location, active }: Props) {
  const styles = useStyles();
  const { profile } = useProfile();
  const coordinate = useMemo(
    () => ({ latitude: location.latitude, longitude: location.longitude }),
    [location.latitude, location.longitude],
  );

  const walking = location.speed > WALK_SPEED_MS;
  const state: SpriteState = walking ? 'walk' : 'idle';
  const step = useWalkFrame(walking && active);

  const [direction, setDirection] = useState<CharacterDirection>('down');
  useEffect(() => {
    if (walking && location.heading !== null) setDirection(directionFromHeading(location.heading));
  }, [walking, location.heading]);

  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), SNAPSHOT_MS);
    return () => clearTimeout(timer);
  }, [state, step, direction, profile]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [active, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.6 }],
  }));

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: GROUND_Y / MARKER_HEIGHT }}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <View style={styles.shadow} />
        <View style={styles.character}>
          <SpriteCharacter
            characterId={profile.characterId}
            direction={direction}
            state={state}
            frame={step}
            size={CHARACTER_SIZE}
          />
        </View>
        {profile.showNameTag && (
          <View style={styles.tagSlot}>
            <NameTag name={profile.name} />
          </View>
        )}
      </View>
    </Marker>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  container: {
    width: MARKER_WIDTH,
    height: MARKER_HEIGHT,
  },
  ring: {
    position: 'absolute',
    top: GROUND_Y - RING_HEIGHT / 2,
    left: (MARKER_WIDTH - RING_WIDTH) / 2,
    width: RING_WIDTH,
    height: RING_HEIGHT,
    borderRadius: RING_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
  shadow: {
    position: 'absolute',
    top: GROUND_Y - SHADOW_HEIGHT / 2,
    left: (MARKER_WIDTH - SHADOW_WIDTH) / 2,
    width: SHADOW_WIDTH,
    height: SHADOW_HEIGHT,
    borderRadius: SHADOW_HEIGHT / 2,
    backgroundColor: colors.text,
    opacity: 0.18,
  },
  character: {
    position: 'absolute',
    top: CHARACTER_TOP,
    left: (MARKER_WIDTH - CHARACTER_SIZE) / 2,
  },
  tagSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
}));

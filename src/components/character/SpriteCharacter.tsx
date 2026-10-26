import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { SPRITE, getCharacter, type CharacterDirection } from '../../data/characters';

export type SpriteState = 'idle' | 'walk' | 'wave';

const WALK_CYCLE_MS = (SPRITE.walkFrames.length * 1000) / SPRITE.walkFps;
const WAVE_PERIOD_MS = 700;
const WAVE_DEG = 6;

type BaseProps = {
  characterId: string;
  direction: CharacterDirection;
  state: SpriteState;
  size?: number;
};

type Props = BaseProps & {
  active?: boolean;
  // Walk step index. Set it to drive frames from React state, which the map marker needs
  // because a Marker with tracksViewChanges={false} does not redraw Reanimated updates.
  frame?: number;
};

export default function SpriteCharacter({ frame, active = true, ...props }: Props) {
  if (frame !== undefined) return <StaticSprite {...props} frame={frame} />;
  return <AnimatedSprite {...props} active={active} />;
}

function StaticSprite({
  characterId,
  direction,
  state,
  size = 96,
  frame,
}: BaseProps & { frame: number }) {
  const { sheet } = getCharacter(characterId);
  const column =
    state === 'walk' ? SPRITE.walkFrames[frame % SPRITE.walkFrames.length] : SPRITE.idleFrame;
  const row = SPRITE.rowOf[direction];

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image
        source={sheet}
        style={[
          { width: size * SPRITE.columns, height: size * SPRITE.rows },
          { transform: [{ translateX: -column * size }, { translateY: -row * size }] },
        ]}
      />
    </View>
  );
}

function AnimatedSprite({
  characterId,
  direction,
  state,
  size = 96,
  active,
}: BaseProps & { active: boolean }) {
  const { sheet } = getCharacter(characterId);
  const row = SPRITE.rowOf[direction];
  const walkClock = useSharedValue(0);
  const wavePhase = useSharedValue(0);

  useEffect(() => {
    if (!active || state !== 'walk') return;
    walkClock.value = withRepeat(
      withTiming(SPRITE.walkFrames.length, { duration: WALK_CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(walkClock);
      walkClock.value = 0;
    };
  }, [active, state, walkClock]);

  useEffect(() => {
    if (!active || state !== 'wave') return;
    wavePhase.value = withRepeat(
      withTiming(1, { duration: WAVE_PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(wavePhase);
      wavePhase.value = 0;
    };
  }, [active, state, wavePhase]);

  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${Math.sin(wavePhase.value * 2 * Math.PI) * WAVE_DEG}deg` }],
  }));

  const sheetStyle = useAnimatedStyle(() => {
    const index = Math.floor(walkClock.value) % SPRITE.walkFrames.length;
    const column = state === 'walk' ? SPRITE.walkFrames[index] : SPRITE.idleFrame;
    return { transform: [{ translateX: -column * size }, { translateY: -row * size }] };
  }, [state, size, row]);

  return (
    <Animated.View style={[styles.frame, { width: size, height: size }, frameStyle]}>
      <Animated.Image
        source={sheet}
        style={[{ width: size * SPRITE.columns, height: size * SPRITE.rows }, sheetStyle]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});

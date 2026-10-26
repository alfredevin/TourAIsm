import type { ImageSourcePropType } from 'react-native';

export type CharacterDirection = 'down' | 'left' | 'right' | 'up';
export type CharacterGender = 'girl' | 'boy';

export type CharacterConfig = {
  id: string;
  name: string;
  gender: CharacterGender;
  sheet: ImageSourcePropType;
};

// Every sheet is 512 x 512: 4 columns (walk frames) x 4 rows (directions).
export const SPRITE = {
  frameWidth: 128,
  frameHeight: 128,
  columns: 4,
  rows: 4,
  // Row index of each direction in the sheet.
  rowOf: { down: 0, left: 1, right: 2, up: 3 } satisfies Record<CharacterDirection, number>,
  // Walk cycle uses all 4 frames in order; frame 1 (neutral pose) is used for idle.
  walkFrames: [0, 1, 2, 3],
  idleFrame: 1,
  walkFps: 8,
} as const;

export const CHARACTERS: CharacterConfig[] = [
  { id: 'girl_ana', name: 'Ana', gender: 'girl', sheet: require('../../assets/characters/girl_ana.png') },
  { id: 'girl_bea', name: 'Bea', gender: 'girl', sheet: require('../../assets/characters/girl_bea.png') },
  { id: 'girl_carla', name: 'Carla', gender: 'girl', sheet: require('../../assets/characters/girl_carla.png') },
  { id: 'boy_ben', name: 'Ben', gender: 'boy', sheet: require('../../assets/characters/boy_ben.png') },
  { id: 'boy_carlo', name: 'Carlo', gender: 'boy', sheet: require('../../assets/characters/boy_carlo.png') },
  { id: 'boy_dan', name: 'Dan', gender: 'boy', sheet: require('../../assets/characters/boy_dan.png') },
];

export const DEFAULT_CHARACTER_ID = 'girl_ana';

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

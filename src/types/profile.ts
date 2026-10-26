import { DEFAULT_CHARACTER_ID } from '../data/characters';

export type Profile = {
  name: string;
  characterId: string;
  showNameTag: boolean;
};

export const DEFAULT_NAME = 'Guest';
export const MAX_NAME_LENGTH = 20;

export const DEFAULT_PROFILE: Profile = {
  name: DEFAULT_NAME,
  characterId: DEFAULT_CHARACTER_ID,
  showNameTag: true,
};

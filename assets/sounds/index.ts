
import { COMMON_SOUNDS } from './common.ts';
import { WESTERN_SOUNDS } from './western.ts';
import { JAPAN_SOUNDS } from './japan.ts';
import { AFRICA_SOUNDS } from './africa.ts';
import { HORROR_SOUNDS } from './horror.ts';
import { CYBERPUNK_SOUNDS } from './cyberpunk.ts';
import { WESTERN_ANIMAL_SOUNDS } from './western_animals.ts';
import { JAPAN_ANIMAL_SOUNDS } from './japan_animals.ts';
import { AFRICA_ANIMAL_SOUNDS } from './africa_animals.ts';
import { HORROR_ANIMAL_SOUNDS } from './horror_animals.ts';
import { CYBERPUNK_ANIMAL_SOUNDS } from './cyberpunk_animals.ts';

export { 
  COMMON_SOUNDS, 
  WESTERN_SOUNDS, 
  JAPAN_SOUNDS, 
  AFRICA_SOUNDS, 
  HORROR_SOUNDS, 
  CYBERPUNK_SOUNDS, 
  WESTERN_ANIMAL_SOUNDS, 
  JAPAN_ANIMAL_SOUNDS, 
  AFRICA_ANIMAL_SOUNDS, 
  HORROR_ANIMAL_SOUNDS, 
  CYBERPUNK_ANIMAL_SOUNDS 
};

export const SOUND_ASSETS: Record<string, string> = {
  ...COMMON_SOUNDS,
  ...WESTERN_SOUNDS,
  ...JAPAN_SOUNDS,
  ...AFRICA_SOUNDS,
  ...HORROR_SOUNDS,
  ...CYBERPUNK_SOUNDS,
  ...WESTERN_ANIMAL_SOUNDS,
  ...JAPAN_ANIMAL_SOUNDS,
  ...AFRICA_ANIMAL_SOUNDS,
  ...HORROR_ANIMAL_SOUNDS,
  ...CYBERPUNK_ANIMAL_SOUNDS,
};
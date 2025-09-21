import { COMMON_SOUNDS } from './common';
import { WESTERN_SOUNDS } from './western';
import { JAPAN_SOUNDS } from './japan';
import { AFRICA_SOUNDS } from './africa';
import { HORROR_SOUNDS } from './horror';
import { CYBERPUNK_SOUNDS } from './cyberpunk';
import { WESTERN_ANIMAL_SOUNDS } from './western_animals';
import { JAPAN_ANIMAL_SOUNDS } from './japan_animals';
import { AFRICA_ANIMAL_SOUNDS } from './africa_animals';
import { HORROR_ANIMAL_SOUNDS } from './horror_animals';
import { CYBERPUNK_ANIMAL_SOUNDS } from './cyberpunk_animals';

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

import { CardData } from '../../types.ts';
import { OBJECTIVE_CARDS } from './objectives.ts';
import { WESTERN_CARDS } from './western.ts';
import { JAPAN_CARDS } from './japan.ts';
import { AFRICA_CARDS } from './africa.ts';
import { HORROR_CARDS } from './horror.ts';
import { CYBERPUNK_CARDS } from './cyberpunk.ts';

export const ALL_CARDS_DATA_MAP: { [id: string]: CardData } = {
  ...OBJECTIVE_CARDS,
  ...WESTERN_CARDS,
  ...JAPAN_CARDS,
  ...AFRICA_CARDS,
  ...HORROR_CARDS,
  ...CYBERPUNK_CARDS,
};
import { CardData } from '../../types';
import { OBJECTIVE_CARDS } from './objectives';
import { WESTERN_CARDS } from './western';
import { JAPAN_CARDS } from './japan';
import { AFRICA_CARDS } from './africa';
import { HORROR_CARDS } from './horror';
import { CYBERPUNK_CARDS } from './cyberpunk';

export const ALL_CARDS_DATA_MAP: { [id: string]: CardData } = {
  ...OBJECTIVE_CARDS,
  ...WESTERN_CARDS,
  ...JAPAN_CARDS,
  ...AFRICA_CARDS,
  ...HORROR_CARDS,
  ...CYBERPUNK_CARDS,
};


import { CardData, Theme } from '../types.ts';
import { ALL_CARDS_DATA_MAP } from '../constants.ts';

/**
 * Determines the theme name (e.g., 'western', 'japan') based on the NG+ level.
 * @param level The current NG+ level.
 * @returns The theme name string.
 */
export const getThemeName = (level: number): Theme => {
    if (level >= 40 && level < 50) return 'cyberpunk';
    if (level >= 30 && level < 40) return 'horror';
    if (level >= 20 && level < 30) return 'safari';
    if (level >= 10 && level < 20) return 'japan';
    return 'western';
};

/**
 * Determines the theme suffix (e.g., '_fj', '_as') based on the NG+ level.
 * @param level The current NG+ level.
 * @returns The theme suffix string or null for the base theme or NG+50+.
 */
export const getThemeSuffix = (level: number): string | null => {
    if (level >= 40 && level < 50) return '_cp'; // Cyberpunk
    if (level >= 30 && level < 40) return '_sh'; // Supernatural Horror
    if (level >= 20 && level < 30) return '_as'; // Africa Safari
    if (level >= 10 && level < 20) return '_fj'; // Feudal Japan
    return null; // Base Wild West theme or NG+50+
};

/**
 * Determines the theme suffix for a given milestone level.
 * @param milestone A multiple of 10 (0, 10, 20...).
 * @returns The theme suffix string or null.
 */
export const getThemeSuffixForMilestone = (milestone: number): string | null => {
    if (milestone === 40) return '_cp';
    if (milestone === 30) return '_sh';
    if (milestone === 20) return '_as';
    if (milestone === 10) return '_fj';
    return null;
};

/**
 * Filters a card pool to get only the cards relevant to the current NG+ level's theme.
 * @param level The current NG+ level.
 * @param cardPool The card data map to use.
 * @returns An array of CardData objects for the active theme.
 */
export const getThemedCardPool = (level: number, cardPool: { [id: string]: CardData }): CardData[] => {
    const allCards = Object.values(cardPool);

    if (level >= 50) {
        // NG+ 50+ uses all cards from all themes.
        return allCards;
    }
    
    const themeSuffix = getThemeSuffix(level);

    if (!themeSuffix) {
        // Base Wild West theme (NG+0-9): Filter out any card that has a theme suffix.
        return allCards.filter(card => !/_fj$|_as$|_sh$|_cp$/.test(card.id));
    }

    // Themed Run (NG+10-49):
    // 1. Get all cards for the current theme.
    const themedCards = allCards.filter(card => card.id.endsWith(themeSuffix));
    
    // 2. Get all objective cards (which have no suffix and are universal).
    const objectiveCards = allCards.filter(card => card.subType === 'objective');

    // 3. Combine them. This ensures objectives are always present, but other cards are theme-specific.
    const combined = [...objectiveCards, ...themedCards];
    const uniqueCards = [...new Map(combined.map(item => [item.id, item])).values()];
    
    return uniqueCards;
};
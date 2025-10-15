
import { CardData, Theme } from '../types.ts';
import { ALL_CARDS_DATA_MAP } from '../constants.ts';

/**
 * Determines the theme name (e.g., 'western', 'japan') based on the NG+ level.
 * @param level The current NG+ level.
 * @returns The theme name string.
 */
export const getThemeName = (level: number): Theme => {
    if (level >= 500) {
        const themes: Theme[] = ['western', 'japan', 'safari', 'horror', 'cyberpunk'];
        return themes[Math.floor(Math.random() * themes.length)];
    }
    if (level >= 400) return 'cyberpunk';
    if (level >= 300) return 'horror';
    if (level >= 200) return 'safari';
    if (level >= 100) return 'japan';
    if (level >= 40 && level < 50) return 'cyberpunk';
    if (level >= 30 && level < 40) return 'horror';
    if (level >= 20 && level < 30) return 'safari';
    if (level >= 10 && level < 20) return 'japan';
    return 'western'; // This covers 0-9 and 50-99
};

/**
 * Determines the theme suffix (e.g., '_fj', '_as') based on the NG+ level.
 * @param level The current NG+ level.
 * @returns The theme suffix string or null for the base theme or NG+50+.
 */
export const getThemeSuffix = (level: number): string | null => {
    if (level >= 500) return null;
    if (level >= 400) return '_cp';
    if (level >= 300) return '_sh';
    if (level >= 200) return '_as';
    if (level >= 100) return '_fj';
    if (level >= 40 && level < 50) return '_cp'; // Cyberpunk
    if (level >= 30 && level < 40) return '_sh'; // Supernatural Horror
    if (level >= 20 && level < 30) return '_as'; // Africa Safari
    if (level >= 10 && level < 20) return '_fj'; // Feudal Japan
    return null; // Base Wild West theme or NG+50-99
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

    if (level >= 500) {
        return allCards;
    }

    const westernCards = allCards.filter(card => !/_fj$|_as$|_sh$|_cp$/.test(card.id));
    let combined: CardData[] = [];

    if (level >= 400) { // Western + Cyberpunk
        const themeCards = allCards.filter(card => card.id.endsWith('_cp'));
        combined = [...westernCards, ...themeCards];
    } else if (level >= 300) { // Western + Horror
        const themeCards = allCards.filter(card => card.id.endsWith('_sh'));
        combined = [...westernCards, ...themeCards];
    } else if (level >= 200) { // Western + Africa
        const themeCards = allCards.filter(card => card.id.endsWith('_as'));
        combined = [...westernCards, ...themeCards];
    } else if (level >= 100) { // Western + Japan
        const themeCards = allCards.filter(card => card.id.endsWith('_fj'));
        combined = [...westernCards, ...themeCards];
    } else if (level >= 50) { // 50-99 is all themes
        return allCards;
    } else { // Below 50 uses old logic
        const themeSuffix = getThemeSuffix(level);
        if (!themeSuffix) {
            return westernCards; // This now correctly handles Western
        }
        const objectiveCards = allCards.filter(card => card.subType === 'objective');
        const themeCards = allCards.filter(card => card.id.endsWith(themeSuffix));
        combined = [...objectiveCards, ...themeCards];
        const uniqueCards = [...new Map(combined.map(item => [item.id, item])).values()];
        return uniqueCards;
    }

    // For levels 100+, combine western, the specific theme, and then get unique cards.
    // The westernCards filter already includes objectives because they have no suffix.
    const uniqueCards = [...new Map(combined.map(item => [item.id, item])).values()];
    return uniqueCards;
};
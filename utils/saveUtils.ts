import { GameState, CardData } from '../types.ts';
import { ALL_CARDS_DATA_MAP } from '../constants.ts';

const SAVE_GAME_KEY = 'wildWestGameSaves_WWS';
const NUM_SAVE_SLOTS = 4; // 3 manual + 1 autosave

export function getSaveGames(): (GameState | null)[] {
    try {
        const savedData = localStorage.getItem(SAVE_GAME_KEY);
        if (savedData) {
            const saves = JSON.parse(savedData);
            if (Array.isArray(saves)) {
                // If the saved array is shorter than the current number of slots,
                // pad it with nulls. This handles migration from 3 to 4 slots.
                if (saves.length < NUM_SAVE_SLOTS) {
                    const newSaves = Array(NUM_SAVE_SLOTS).fill(null);
                    saves.forEach((save, i) => newSaves[i] = save);
                    return newSaves;
                }
                // If it's longer (unlikely), truncate it.
                if (saves.length > NUM_SAVE_SLOTS) {
                    return saves.slice(0, NUM_SAVE_SLOTS);
                }
                // If it's the correct length, return it as is.
                return saves;
            }
        }
    } catch (error) {
        console.error("Error loading save games:", error);
    }
    // Return a default empty array of slots if anything goes wrong
    return Array(NUM_SAVE_SLOTS).fill(null);
}

const isCustomOrModifiedCard = (card: CardData): boolean => {
    // FIX: Add a guard to prevent crash on malformed card objects without an ID.
    if (!card || !card.id) {
        // This can happen if state gets corrupted. Treat as not-custom.
        // It will be dehydrated to its (non-existent) ID, which will be filtered on load.
        return false;
    }

    // It's custom if it's a cheat card, has a special ID prefix, or isn't in the base card map.
    if (card.isCheat || card.id.startsWith('remixed_') || card.id.startsWith('custom_')) {
        return true;
    }
    const baseCard = ALL_CARDS_DATA_MAP[card.id];
    if (!baseCard) {
        return true; // Card not in base map, must be custom.
    }
    // It's modified if its in-game state (like health) differs from its base definition.
    if (card.health !== undefined && card.health !== baseCard.health) {
        return true;
    }
    // Check for AI-remixed properties
    if (card.name !== baseCard.name) {
        return true;
    }
    if (card.description !== baseCard.description) {
        return true;
    }
    // A simple string comparison of effects is a robust way to check for changes.
    if (JSON.stringify(card.effect) !== JSON.stringify(baseCard.effect)) {
        return true;
    }
    // Check other potentially remixed properties
    if (card.buyCost !== baseCard.buyCost) {
        return true;
    }
    if (card.sellValue !== baseCard.sellValue) {
        return true;
    }

    return false;
};

export const dehydrateState = (gameState: GameState): any => {
    const stateCopy = JSON.parse(JSON.stringify(gameState));

    // Helper for non-player-owned cards. Player cards remain as full objects.
    const dehydrateNonPlayerArray = (arr: (CardData | null)[] | undefined) => {
        if (!arr) return [];
        return arr.map(card => {
            if (!card) return null;
            // For world decks, save by ID unless it's a custom/modified card
            return isCustomOrModifiedCard(card) ? card : card.id;
        });
    }

    const dehydrateNonPlayerCard = (card: CardData | null) => {
        if (!card) return null;
        return isCustomOrModifiedCard(card) ? card : card.id;
    };
    
    // Dehydrate world decks to save space. Player cards are left as full objects.
    stateCopy.eventDeck = dehydrateNonPlayerArray(stateCopy.eventDeck);
    stateCopy.eventDiscardPile = dehydrateNonPlayerArray(stateCopy.eventDiscardPile);
    stateCopy.activeEvent = dehydrateNonPlayerCard(stateCopy.activeEvent);
    stateCopy.storeItemDeck = dehydrateNonPlayerArray(stateCopy.storeItemDeck);
    stateCopy.storeDisplayItems = dehydrateNonPlayerArray(stateCopy.storeDisplayItems);
    stateCopy.storeItemDiscardPile = dehydrateNonPlayerArray(stateCopy.storeItemDiscardPile);
    
    if (stateCopy.aiBoss) {
        stateCopy.aiBoss = dehydrateNonPlayerCard(stateCopy.aiBoss);
    }
    
    // Player-owned cards are left as full objects in the stateCopy.
    // This includes: player.hand, player.equippedItems, player.playerDeck, player.playerDiscard,
    // player.activeTrap, player.currentIllnesses, player.satchels, and deckForReview.
    // They are not processed here, preserving their full data.

    return stateCopy;
};


export function saveGameToSlot(gameState: GameState, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= NUM_SAVE_SLOTS) {
        console.error("Invalid save slot index:", slotIndex);
        return false;
    }
    try {
        const saves = getSaveGames();
        
        // Save the full, dehydrated game state, not just a snapshot.
        const dehydratedState = dehydrateState(gameState);
        dehydratedState.saveSlotIndex = slotIndex; // Ensure slot index is saved

        saves[slotIndex] = dehydratedState as any;
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(saves));
        return true;
    } catch (error) {
        console.error("Error saving game:", error);
        return false;
    }
}

export function deleteGameInSlot(slotIndex: number): boolean {
     if (slotIndex < 0 || slotIndex >= NUM_SAVE_SLOTS) {
        console.error("Invalid delete slot index:", slotIndex);
        return false;
    }
    try {
        const saves = getSaveGames();
        saves[slotIndex] = null;
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(saves));
        return true;
    } catch (error) {
        console.error("Error deleting game:", error);
        return false;
    }
}
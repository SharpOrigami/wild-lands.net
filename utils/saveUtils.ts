import { GameState, CardData } from '../types.ts';
import { ALL_CARDS_DATA_MAP } from '../constants.ts';
import { isCustomOrModifiedCard } from './cardUtils.ts';

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
    // FIX: Cast the 'any' type from JSON.parse to the expected type for the function.
    stateCopy.activeEvent = dehydrateNonPlayerCard(stateCopy.activeEvent as CardData | null);
    stateCopy.storeItemDeck = dehydrateNonPlayerArray(stateCopy.storeItemDeck);
    stateCopy.storeDisplayItems = dehydrateNonPlayerArray(stateCopy.storeDisplayItems);
    stateCopy.storeItemDiscardPile = dehydrateNonPlayerArray(stateCopy.storeItemDiscardPile);
    
    if (stateCopy.aiBoss) {
        // FIX: Cast the 'any' type from JSON.parse to the expected type for the function.
        stateCopy.aiBoss = dehydrateNonPlayerCard(stateCopy.aiBoss as CardData | null);
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
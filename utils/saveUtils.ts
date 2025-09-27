import { GameState } from '../types.ts';

const SAVE_GAME_KEY = 'wildWestGameSaves_WWS';
const NUM_SAVE_SLOTS = 3;

export function getSaveGames(): (GameState | null)[] {
    try {
        const savedData = localStorage.getItem(SAVE_GAME_KEY);
        if (savedData) {
            const saves = JSON.parse(savedData);
            if (Array.isArray(saves) && saves.length === NUM_SAVE_SLOTS) {
                return saves;
            }
        }
    } catch (error) {
        console.error("Error loading save games:", error);
    }
    // Return a default empty array of slots if anything goes wrong
    return Array(NUM_SAVE_SLOTS).fill(null);
}

export function saveGameToSlot(gameState: GameState, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= NUM_SAVE_SLOTS) {
        console.error("Invalid save slot index:", slotIndex);
        return false;
    }
    try {
        const saves = getSaveGames();
        // Create a savable state, removing transient UI properties
        const stateToSave: Partial<GameState> = { ...gameState, saveSlotIndex: slotIndex };
        
        // Remove transient UI properties before saving
        delete stateToSave.selectedCard;
        delete stateToSave.modals;
        delete stateToSave.activeGameBanner;
        delete stateToSave.pendingPlayerDamageAnimation;
        delete stateToSave.scrollAnimationPhase;
        delete stateToSave.goldFlashPlayer;
        delete stateToSave.laudanumVisualActive;
        delete stateToSave.skunkSprayVisualActive;
        delete stateToSave.showLightningStrikeFlash;
        delete stateToSave.isLoadingBossIntro;
        delete stateToSave.isLoadingStory;
        delete stateToSave.isLoadingNGPlus;
        delete stateToSave.showNGPlusRewardModal;

        saves[slotIndex] = stateToSave as GameState;
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

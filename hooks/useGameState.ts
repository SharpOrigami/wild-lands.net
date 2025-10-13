import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, PlayerDetails, Character, CardData, LogEntry, CardContext, ModalState, ActiveGameBannerState, RunStats, BannerQueueItem } from '../types.ts';
import {
    PLAYER_ID, MAX_LOG_ENTRIES, HAND_LIMIT, EQUIP_LIMIT, STORE_DISPLAY_LIMIT, EVENT_DECK_SIZE, PLAYER_DECK_TARGET_SIZE, STORE_DECK_TARGET_SIZE,
    CHARACTERS_DATA_MAP,
    ALL_CARDS_DATA_MAP, CURRENT_CARDS_DATA, resetCurrentCardsData, updateCurrentCardsData,
    MAX_INTERNAL_LOG_ENTRIES, MAX_DAYS_BEFORE_BOSS_FINDS_PLAYER,
    INITIAL_RUN_STATS,
    INITIAL_PLAYER_STATE_TEMPLATE,
    NG_PLUS_THEME_MILESTONE_INTERVAL,
    APEX_PREDATOR_IDS,
    PEST_IDS,
    PERSONALITY_MODIFIERS
} from '../constants.ts';
import { shuffleArray, calculateAttackPower, calculateHealAmount, isEventConsideredHostile, getCardCategory, pickRandomDistinctFromPool, createTrophyOrBountyCard, isFirearm, NON_HOSTILE_ON_REVEAL_IDS, getScaledCard, applyDifficultyBonus, buildEventDeck } from '../utils/cardUtils.ts';
import { getRandomLogVariation } from '../utils/logUtils.ts';
import { generateStoryForGame, generateAIBossForGame, remixCardsForNGPlusGame, generateBossIntroStory, generateRemixedWeapon } from '../services/geminiService.ts';
import { updateLifetimeStats } from '../utils/statsUtils.ts';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';
import { getThemedCardPool, getThemeName, getThemeSuffix, getThemeSuffixForMilestone } from '../utils/themeUtils.ts';
import { applyHealToPlayer as applyHealToPlayerUtil, applyDamageAndGetAnimation as applyDamageAndGetAnimationUtil, handleTrapInteractionWithEvent as handleTrapInteractionWithEventUtil, handleObjectiveCompletionChecks as handleObjectiveCompletionChecksUtil, applyImmediateEventAndCheckEndTurn as applyImmediateEventAndCheckEndTurnUtil } from '../utils/gameplayUtils.ts';
import { createPedometerManager } from '../gameLogic/pedometerManager.ts';
import * as actionHandlers from '../utils/actionHandlers.ts';
import { POP_CULTURE_CHEATS, PopCultureCheatEffect } from '../utils/cheatCodes.ts';
import { saveGameToSlot, getSaveGames, deleteGameInSlot, dehydrateState } from '../utils/saveUtils.ts';
import { deepMerge } from '../utils/deepMerge.ts';


const initialModalState: ModalState = { isOpen: false, title: '', text: '' };
const initialGameBannerState: ActiveGameBannerState | null = null;
const MAX_PERSISTED_LOG_ENTRIES = 800;


const BANNER_DURATION_CRITICAL = 4500;
const BANNER_DURATION_NORMAL = 2500;
const OVERLAY_ANIMATION_TOTAL_DURATION = 5000;
const OVERLAY_ANIMATION_INTERRUPT_DELAY = 3000;

const getLevelCacheKey = (level: number, characterId: string, playerName: string) => `wildWestLevelCache_NG${level}_${characterId}_${playerName.replace(/\s/g, '_')}_WWS`;

let animationFrameId: number | null = null;

const cancelScrollAnimation = () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    window.removeEventListener('wheel', cancelScrollAnimation);
    window.removeEventListener('touchstart', cancelScrollAnimation);
    window.removeEventListener('mousedown', cancelScrollAnimation);
};

// Helper function to check if a card is custom or has been modified from its base version.
const isCustomOrModifiedCardForRunStart = (card: CardData): boolean => {
    if (!card || !card.id) {
        return false;
    }
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
    if (card.buyCost !== baseCard.buyCost) {
        return true;
    }
    if (card.sellValue !== baseCard.sellValue) {
        return true;
    }

    return false;
};

// Helper function for smooth, interruptible scrolling
function smoothScrollTo(endY: number, duration: number) {
    cancelScrollAnimation();

    const startY = window.scrollY;
    const distanceY = endY - startY;
    let startTime: number | null = null;

    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeInOutQuad(timeElapsed, startY, distanceY, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) {
            animationFrameId = requestAnimationFrame(animation);
        } else {
            cancelScrollAnimation();
        }
    };

    window.addEventListener('wheel', cancelScrollAnimation, { passive: true });
    window.addEventListener('touchstart', cancelScrollAnimation, { passive: true });
    window.addEventListener('mousedown', cancelScrollAnimation, { passive: true });

    animationFrameId = requestAnimationFrame(animation);
}

/**
 * Robustly loads a saved game state, handling different save formats, rehydrating card data,
 * and migrating data structures to the latest version.
 * @param stateWithDefaults The game state object after being merged with a default template.
 * @param log The logging function.
 * @returns A fully processed and migrated game state object ready for use.
 */
const rehydrateAndMigrateState = (stateWithDefaults: any, log: (message: string, type?: LogEntry['type']) => void): GameState => {
    const isObject = (item: any): item is Record<string, any> => {
        return (item && typeof item === 'object' && !Array.isArray(item));
    };

    // 1. Find all custom cards (IDs not in base game data) to create a session-specific card library.
    const customCardDefinitions: { [id: string]: CardData } = {};
    const findCustomCardDefinitions = (item: any) => {
        if (Array.isArray(item)) {
            item.forEach(findCustomCardDefinitions);
        } else if (isObject(item)) {
            // A valid custom card definition needs an ID, type, and name.
            if (item.id && item.type && item.name && !ALL_CARDS_DATA_MAP[item.id]) {
                customCardDefinitions[item.id] = item as CardData;
            }
            // Recurse through all properties of the object.
            Object.values(item).forEach(findCustomCardDefinitions);
        }
    };

    findCustomCardDefinitions(stateWithDefaults);
    const sessionCardsData = { ...ALL_CARDS_DATA_MAP, ...customCardDefinitions };
    updateCurrentCardsData(sessionCardsData);
    if (Object.keys(customCardDefinitions).length > 0) {
        log(`Loaded ${Object.keys(customCardDefinitions).length} unique custom cards (e.g., AI-remixed) from save.`, 'debug');
    }

    // 2. Define migration logic for older card data structures if necessary.
    const migrateCard = (card: CardData): CardData => {
        // Example migration: ensure all weapons have a subtype.
        if (card.effect?.type === 'weapon' && card.effect.subtype === undefined) {
            if (
                card.id.includes('knife') || card.id.includes('sword') || card.id.includes('katana') ||
                card.id.includes('wakizashi') || card.id.includes('tanto') || card.id.includes('tsurugi') ||
                card.id.includes('uchigatana') || card.id.includes('nodachi') || card.id.includes('cleaver') ||
                card.id.includes('machete') || card.id.startsWith('custom_sakai_') || card.id.startsWith('custom_musashi_') ||
                card.id.startsWith('custom_kenshin_') || card.id.includes('ash')
            ) {
                if (!card.effect) card.effect = { type: 'weapon' };
                card.effect.subtype = 'sword';
            }
        }
        return card;
    };

    // 3. Define the core recursive rehydration function.
    const robustRehydrate = (item: any): any => {
        // Handle arrays by recursing and filtering out any invalid entries that become undefined or null.
        if (Array.isArray(item)) {
            // Optimization: If it's an array of simple primitives (excluding strings, which might be card IDs),
            // we don't need to process it. This avoids type mismatches for number[] etc.
            if (item.every(val => typeof val === 'number' || typeof val === 'boolean' || val === null)) {
                return item;
            }
            return item.map(robustRehydrate).filter(value => value !== undefined && value !== null);
        }
        
        // Determine if the item is attempting to be a card (either a string ID or an object with an ID).
        let isCardAttempt = false;
        let cardId: string | undefined = undefined;

        if (typeof item === 'string' && (item.includes('_') || item.startsWith('remixed_') || item.startsWith('custom_'))) {
            isCardAttempt = true;
            cardId = item;
        } else if (isObject(item) && typeof item.id === 'string' && item.id.length > 0 && item.type) {
            isCardAttempt = true;
            cardId = item.id;
        }

        if (isCardAttempt && cardId) {
            const baseCard = sessionCardsData[cardId];
            if (baseCard) {
                // Valid card reference found. Build a full, valid object from the base definition.
                let rehydratedCard = JSON.parse(JSON.stringify(baseCard));
                if (isObject(item)) {
                    // Merge properties from the saved object (like modified health) onto the fresh base card.
                    rehydratedCard = { ...rehydratedCard, ...item, id: cardId };
                }
                return migrateCard(rehydratedCard);
            } else {
                // It looked like a card, but the ID is invalid or obsolete. Discard it.
                log(`Discarding item with invalid or obsolete card ID: ${cardId}`, 'system');
                return undefined;
            }
        }
        
        // If it's not a card attempt, it's another object to recurse or a primitive to return.
        if (isObject(item)) {
            const newObj: { [key: string]: any } = {};
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    const recursedValue = robustRehydrate(item[key]);
                    // Only add the property back if it didn't resolve to undefined (e.g., an invalid card in a property).
                    if (recursedValue !== undefined) {
                        newObj[key] = recursedValue;
                    }
                }
            }
            return newObj;
        }

        // It's a primitive (number, boolean) or a string that didn't look like a card ID (e.g., a player name). Return as-is.
        return item;
    };
    
    // 4. Start the rehydration process on the entire merged state object.
    const finalState = robustRehydrate(stateWithDefaults);

    // 5. Migrate old save structure (single objective) to new structure (multiple objectives).
    if (finalState.activeObjective && !finalState.activeObjectives) {
        finalState.activeObjectives = [finalState.activeObjective];
    }
    // Delete the old property if it exists, ensuring clean state.
    delete finalState.activeObjective;

    return finalState;
};

const rebuildEventDeckIfNeeded = (gameState: GameState, log: (message: string, type?: LogEntry['type']) => void): GameState => {
    // Fix for incompatible saves: rebuild if the deck is empty OR contains only invalid entries
    // (like nulls or empty objects after a bad rehydration)
    const isDeckEffectivelyEmpty = !gameState.eventDeck || gameState.eventDeck.length === 0 || gameState.eventDeck.every(c => !c || !c.id);

    if (isDeckEffectivelyEmpty && gameState.turn > 0 && gameState.status === 'playing') {
        log("Empty or invalid event deck detected on load. Rebuilding deck with balanced composition.", "system");
        
        const targetDeckSize = Math.max(0, 20 - (gameState.turn > 10 ? gameState.turn - 10 : 0));
        
        if (targetDeckSize > 0) {
            const themedPool = getThemedCardPool(gameState.ngPlusLevel, CURRENT_CARDS_DATA);
            const newEventDeck = buildEventDeck(themedPool, gameState.ngPlusLevel).slice(0, targetDeckSize);
            
            log(`Rebuilt event deck with ${newEventDeck.length} cards.`, 'system');
            return { ...gameState, eventDeck: newEventDeck };
        }
    }
    return gameState;
};

const calculateSkills = (character: Character, personality: { archetype: string; temperament: string; motivation: string; }) => {
    const talkFailurePoints = (character.talkSkill || 0) +
        (PERSONALITY_MODIFIERS[personality.archetype]?.talk || 0) +
        (PERSONALITY_MODIFIERS[personality.temperament]?.talk || 0) +
        (PERSONALITY_MODIFIERS[personality.motivation]?.talk || 0);

    const petFailurePoints = (character.petSkill || 0) +
        (PERSONALITY_MODIFIERS[personality.archetype]?.pet || 0) +
        (PERSONALITY_MODIFIERS[personality.temperament]?.pet || 0) +
        (PERSONALITY_MODIFIERS[personality.motivation]?.pet || 0);

    return {
        talkSkill: talkFailurePoints / 100,
        petSkill: petFailurePoints / 100,
    };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const isEndingTurn = useRef(false);
  const [activeAnimation, setActiveAnimation] = useState<{ type: string, target?: string, amount?: number} | null>(null);
  const [endDayAnimation, setEndDayAnimation] = useState<'none' | 'short' | 'long'>('none');
  const [preGeneratedAiBoss, setPreGeneratedAiBoss] = useState<CardData | null>(null);
  const [isPreGeneratingBoss, setIsPreGeneratingBoss] = useState(false);
  const [pendingStoreRestock, setPendingStoreRestock] = useState<{ index: number } | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);
  const bannerIdCounter = useRef(0);
  const lastAnimatedElementRef = useRef<{ element: HTMLElement, className: string } | null>(null);
  const pedometerWatchIdRef = useRef<number | null>(null);
  const isActionInProgress = useRef(false);
  const lastAttackPowerRef = useRef<number>(0);
  const remixGenerationPromise = useRef<Promise<any> | null>(null);
  const nextLevelRemixPromise = useRef<Promise<void> | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  const _log = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => {
      if (!prev) return null;
      const currentLog = prev.log || [];
      const newLogEntry: LogEntry = { message, type, timestamp: new Date().toISOString() };
      const newLog = [newLogEntry, ...currentLog].slice(0, MAX_INTERNAL_LOG_ENTRIES);
      return { ...prev, log: newLog };
    });
  }, []);

  const closeModal = useCallback((modalType: 'message' | 'story' | 'ngPlusReward') => {
    setGameState(prev => {
      if (!prev) return null;
      const newModals = { ...prev.modals, [modalType]: { ...prev.modals[modalType], isOpen: false } };
      let newShowNGPlusRewardModal = prev.showNGPlusRewardModal;
      if (modalType === 'ngPlusReward') {
          newShowNGPlusRewardModal = false;
      }
      return { ...prev, modals: newModals, showNGPlusRewardModal: newShowNGPlusRewardModal };
    });
  }, []);

  const enterGame = useCallback(() => {
    setGameState(prev => {
        if (!prev || prev.status !== 'landing') return prev;
        return { ...prev, status: 'setup', gameJustStarted: true };
    });
  }, []);

  const acknowledgeGameStart = useCallback(() => {
    setGameState(prev => {
        if (!prev || !prev.gameJustStarted) return prev;
        return { ...prev, gameJustStarted: false };
    });
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    // Cleanup function: always clear the previous timer when this effect re-runs.
    if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
    }

    const { currentAnimation, animationQueue } = gameState || {};

    // PART 1: If nothing is playing, try to start the next animation from the queue.
    if (!currentAnimation) {
        if (animationQueue && animationQueue.length > 0) {
            const nextAnimation = animationQueue[0];
            setGameState(prev => {
                if (!prev) return null;
                // Dequeue and set the new animation as current, with its start time.
                return {
                    ...prev,
                    animationQueue: prev.animationQueue!.slice(1),
                    currentAnimation: { ...nextAnimation, startTime: Date.now() }, // Add startTime
                    laudanumVisualActive: nextAnimation.type === 'laudanum',
                    skunkSprayVisualActive: nextAnimation.type === 'skunkspray',
                };
            });
        } else {
            // Queue is empty and nothing is playing, so ensure visuals are off.
             setGameState(prev => {
                if (prev && (prev.laudanumVisualActive || prev.skunkSprayVisualActive)) {
                    return {
                        ...prev,
                        laudanumVisualActive: false,
                        skunkSprayVisualActive: false,
                    }
                }
                return prev;
            });
        }
        return; // End the effect here. The state change will trigger it again.
    }

    // PART 2: If an animation IS playing, determine its end time.
    const hasNextInQueue = animationQueue && animationQueue.length > 0;
    const startTime = currentAnimation.startTime || Date.now(); // Fallback for safety

    // Calculate how long this animation has already been playing.
    const elapsed = Date.now() - startTime;

    // Determine the total duration this animation should have based on the current queue status.
    const targetDuration = hasNextInQueue ? OVERLAY_ANIMATION_INTERRUPT_DELAY : OVERLAY_ANIMATION_TOTAL_DURATION;
    
    // Calculate how much longer it needs to play.
    let remainingTime = targetDuration - elapsed;

    // If remaining time is negative, it means it has already played long enough. End it immediately.
    if (remainingTime < 0) {
        remainingTime = 0;
    }

    // Set the timer to clear the current animation after the remaining time.
    animationTimerRef.current = window.setTimeout(() => {
        setGameState(prev => {
            // Only clear the animation if it's the one this timer was set for.
            if (prev?.currentAnimation?.id === currentAnimation.id) {
                return { 
                    ...prev, 
                    currentAnimation: null,
                    // The visuals will be turned off by PART 1 of this effect on the next render.
                };
            }
            return prev;
        });
    }, remainingTime);

    // Return a cleanup function that will be called before the next run of this effect, or on unmount.
    return () => {
        if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
        }
    };

  }, [gameState?.currentAnimation, gameState?.animationQueue]);

  useEffect(() => {
    if (gameState && (gameState.status === 'playing' || gameState.status === 'playing_initial_reveal')) {
      try {
        const dehydratedState = dehydrateState(gameState);
        const gameStateJSON = JSON.stringify(dehydratedState);
        localStorage.setItem('wildWestGameState_WWS', gameStateJSON);
      } catch (error) {
        console.error("Failed to save game state:", error);
        _log("Error saving game state.", "error");
      }
    }
  }, [gameState, _log]);

  const getBaseCardByIdentifier = useCallback((cardIdentifier: CardData | null): CardData | null => {
    if (!cardIdentifier || !cardIdentifier.id) return null;

    // The session's source of truth for all card definitions, including remixed ones.
    const sourceCard = CURRENT_CARDS_DATA[cardIdentifier.id];
    
    if (!sourceCard) {
        // If it doesn't even exist in our current session data, something is wrong.
        // It might be a custom card from a save that wasn't registered properly.
        // Return the instance we were given as a last resort.
        return cardIdentifier;
    }
    
    // ALWAYS return the definitive version for this run from CURRENT_CARDS_DATA.
    // This will be the remixed version if one exists, or the original base version otherwise.
    // This correctly strips temporary scaling while preserving permanent AI remixes for the run.
    return sourceCard;
  }, []);

  const triggerGoldFlash = useCallback((playerId: string) => {
    soundManager.playSound('gold');
    if(playerId === PLAYER_ID) {
        setGameState(prev => prev ? { ...prev, goldFlashPlayer: true } : null);
        setTimeout(() => setGameState(prev => prev ? { ...prev, goldFlashPlayer: false } : null), 500);
    }
  }, []);

  const triggerAnimation = useCallback(async (type: string, target?: string, amount?: number) => {
    setActiveAnimation({ type, target, amount });

    let duration = 400;
    if (['player-border-pulse-red', 'player-border-pulse-green', 'threat-card-border-pulse-red'].includes(type)) duration = 450;
    else if (['player-damage-flash-bg', 'player-heal-flash-bg', 'threat-card-shake-damage-bg'].includes(type)) duration = 300;
    else if (['trap-display-activated', 'player-hat-saved-damage', 'player-damage-pulse'].includes(type)) duration = 600;
    else if (type === 'event-trapped-small') duration = 700;
    else if (['player-is-ill', 'player-scarlet-fever-effect'].includes(type)) duration = (type === 'player-scarlet-fever-effect') ? 1000 : 1600;
    else if (type === 'event-item-taken') duration = 500;
    else if (type === 'threat-attacks-player') duration = 800;
    else if (type === 'player-area-shake-effect') duration = 500;
    else if (type === 'player-heal-flash-bg') duration = 300;
    else if (type === 'player-border-pulse-green') duration = 450;

    setTimeout(() => setActiveAnimation(null), duration);
  }, []);

  const handleObjectiveCompletionChecks = useCallback((player: PlayerDetails, objective: CardData, boss: CardData, turn: number, lastAttackPower: number, activeEvent: CardData | null) => {
    return handleObjectiveCompletionChecksUtil(player, objective, boss, turn, lastAttackPower, activeEvent, triggerGoldFlash, _log);
  }, [triggerGoldFlash, _log]);
   
  const proceedToFinishedState = useCallback(() => {
    const currentState = gameStateRef.current;
    if (!currentState || (currentState.status !== 'playing' && currentState.status !== 'showing_boss_intro' && currentState.status !== 'playing_initial_reveal' && !currentState.showObjectiveSummaryModal)) return;

    const playerForFinish = { ...currentState.playerDetails[PLAYER_ID] };
    const isVictory = playerForFinish.health > 0;

    // Clear autosave on victory
    if (isVictory && currentState.autosaveSlotIndex === 3) {
        deleteGameInSlot(3);
        _log(`Autosave in Autosave Slot cleared after victory.`, 'system');
    }

    const theme = getThemeName(currentState.ngPlusLevel);

    playerForFinish.runStats.totalVictories = 1;
    if (playerForFinish.character) {
        playerForFinish.runStats.victoriesByCharacter[playerForFinish.character.id] = (playerForFinish.runStats.victoriesByCharacter[playerForFinish.character.id] || 0) + 1;
    }
    if (playerForFinish.health <= 5) playerForFinish.runStats.closeCalls = 1;
    playerForFinish.runStats.totalStepsTaken = playerForFinish.stepsTaken;
    playerForFinish.runStats.totalDaysSurvived = currentState.turn;
    playerForFinish.runStats.mostGoldHeld = Math.max(playerForFinish.runStats.mostGoldHeld || 0, playerForFinish.gold);
    
    updateLifetimeStats(playerForFinish.runStats);
    _log("Lifetime stats updated.", "system");
    
    const winReason = getRandomLogVariation('threatDefeated', {
        playerName: playerForFinish.character?.name || 'The adventurer',
        enemyName: currentState.aiBoss?.name || 'the ultimate evil'
    }, theme, playerForFinish, currentState.aiBoss, true);

    const equippedItemsToSave = playerForFinish.equippedItems;
    const satchelsToSave = playerForFinish.satchels;
    
    localStorage.setItem('wildWestEquippedForNGPlus_WWS', JSON.stringify(equippedItemsToSave.map(c => isCustomOrModifiedCardForRunStart(c) ? c : c.id)));
    localStorage.setItem('wildWestSatchelsForNGPlus_WWS', JSON.stringify(satchelsToSave));
    localStorage.removeItem('wildWestActiveTrapForNGPlus_WWS'); // Trap now goes to deck review
    
    _log("Prepared equipped items for NG+ carry-over.", "system");

    const allCardsForReview = [
        ...playerForFinish.hand.filter(Boolean),
        ...playerForFinish.playerDeck,
        ...playerForFinish.playerDiscard,
    ].filter((c): c is CardData => Boolean(c));

    if (playerForFinish.activeTrap) {
        allCardsForReview.push(playerForFinish.activeTrap);
    }
    
    playerForFinish.hand = [];
    playerForFinish.playerDeck = [];
    playerForFinish.playerDiscard = [];
    playerForFinish.activeTrap = null; 
    playerForFinish.satchels = {};
    playerForFinish.equippedItems = [];

    const finishedState: GameState = {
        runId: currentState.runId,
        status: 'finished',
        ngPlusLevel: currentState.ngPlusLevel,
        log: currentState.log,
        aiBoss: currentState.aiBoss,
        playerDetails: { [PLAYER_ID]: playerForFinish },
        winReason: winReason,
        deckForReview: allCardsForReview,
        pedometerFeatureEnabledByUser: currentState.pedometerFeatureEnabledByUser,
        eventDeck: [],
        eventDiscardPile: [],
        activeEvent: null,
        activeObjectives: [],
        storeItemDeck: [],
        storeDisplayItems: [],
        storeItemDiscardPile: [],
        turn: currentState.turn,
        storyGenerated: false,
        selectedCard: null,
        endSequenceTriggered: true,
        modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
        activeGameBanner: null,
        bannerQueue: [],
        blockTradeDueToHostileEvent: false,
        playerAttackedEventThisTurn: false,
        pendingPlayerDamageAnimation: null,
        playerDeckAugmentationPool: [],
        initialCardPool: [],
        activeEventTurnCounter: 0,
        scrollAnimationPhase: 'none',
        isLoadingStory: false,
        showObjectiveSummaryModal: false,
        objectiveSummary: undefined,
        goldFlashPlayer: false,
        laudanumVisualActive: false,
        skunkSprayVisualActive: false,
        showLightningStrikeFlash: false,
        isLoadingBossIntro: false,
        isLoadingNGPlus: false,
        showNGPlusRewardModal: false,
        bossIntroTitle: undefined,
        bossIntroParagraph: undefined,
        newlyDrawnCardIndices: undefined,
        equipAnimationIndex: null,
        eventDifficultyBonus: 0,
        triggerThreatShake: false,
        remixProgress: undefined,
        objectiveChoices: [],
        selectedObjectiveIndices: [],
        runStartState: isVictory ? undefined : currentState.runStartState,
        saveSlotIndex: currentState.saveSlotIndex,
        autosaveSlotIndex: null, // Clear autosave index
        isBossFightActive: false,
        triggerStoreRestockAnimation: false,
        runStartGold: currentState.runStartGold,
    };

    setGameState(finishedState);
    
    localStorage.setItem('ngPlusLevel_WWS', (currentState.ngPlusLevel + 1).toString());
    localStorage.setItem('ngPlusPlayerGold_WWS', playerForFinish.gold.toString());
    localStorage.setItem('ngPlusCumulativeMaxHealthBonus_WWS', playerForFinish.cumulativeNGPlusMaxHealthBonus.toString());
    localStorage.setItem('ngPlusRewardChosen_WWS', 'false');
    localStorage.setItem('wildWestStepsTaken_WWS', playerForFinish.stepsTaken.toString());
    localStorage.setItem('wildWestPlayerDetailsForNGPlus_WWS', JSON.stringify({
        name: playerForFinish.name,
        characterId: playerForFinish.character?.id,
        personality: playerForFinish.personality
    }));
  }, [_log, handleObjectiveCompletionChecks]);
   
  const applyDamageAndGetAnimation = useCallback((
    playerDetailsInput: PlayerDetails,
    damage: number,
    sourceName: string,
    isBossFight?: boolean,
    eventId?: string,
    suppressLog: boolean = false,
    sourceCard?: CardData
  ) => {
    return applyDamageAndGetAnimationUtil(playerDetailsInput, damage, sourceName, _log, triggerAnimation, getBaseCardByIdentifier, isBossFight, eventId, suppressLog, sourceCard);
  }, [_log, triggerAnimation, getBaseCardByIdentifier]);

  const applyHealToPlayer = useCallback((player: PlayerDetails, healAmount: number, sourceName: string, isBossFight?: boolean, sourceCard?: CardData) => {
    return applyHealToPlayerUtil(player, healAmount, sourceName, _log, triggerAnimation, isBossFight, sourceCard);
  }, [_log, triggerAnimation]);

  const endTurnLogicRef = useRef<(isLongAnimation?: boolean, bannerInfo?: { message: string; bannerType: ActiveGameBannerState['bannerType'] }) => Promise<void>>(async () => {});

  const triggerBanner = useCallback((message: string, bannerType: BannerQueueItem['bannerType']) => {
    _log(`Queueing banner: "${message}"`, "debug");

    bannerIdCounter.current++;
    const newBannerData: BannerQueueItem = { 
        message, 
        bannerType, 
        bannerId: bannerIdCounter.current,
    };

    setGameState(prev => {
        if (!prev) return null;
        return {
            ...prev,
            bannerQueue: [...(prev.bannerQueue || []), newBannerData]
        };
    });
  }, [_log]); 

  useEffect(() => {
    // This is the single processor for the banner queue.
    if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = null;
    }

    const currentState = gameStateRef.current;
    if (!currentState) return;
    
    const { activeGameBanner, bannerQueue } = currentState;
    const hasPendingBanners = bannerQueue && bannerQueue.length > 0;

    if (!activeGameBanner && hasPendingBanners) {
        // State: IDLE, has work -> Show the next banner immediately.
        const nextBannerData = bannerQueue[0];
        const newActiveBanner: ActiveGameBannerState = { ...nextBannerData, show: true, timestamp: Date.now() };

        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                activeGameBanner: newActiveBanner,
                bannerQueue: prev.bannerQueue.slice(1)
            };
        });
    } else if (activeGameBanner && hasPendingBanners) {
        // State: BUSY, has more work -> Decide whether to switch now or later.
        const minDisplayTime = 500;
        const timeDisplayed = Date.now() - activeGameBanner.timestamp;
        const remainingMinTime = Math.max(0, minDisplayTime - timeDisplayed);

        bannerTimeoutRef.current = window.setTimeout(() => {
            const nextBannerData = gameStateRef.current?.bannerQueue[0];
            if (!nextBannerData) return;
            
            const newActiveBanner: ActiveGameBannerState = { ...nextBannerData, show: true, timestamp: Date.now() };

            setGameState(prev => {
                if (!prev || prev.activeGameBanner?.bannerId !== activeGameBanner.bannerId) return prev;
                return {
                    ...prev,
                    activeGameBanner: newActiveBanner,
                    bannerQueue: prev.bannerQueue.slice(1)
                };
            });
        }, remainingMinTime);

    } else if (activeGameBanner && !hasPendingBanners) {
        // State: BUSY, no more work -> Schedule the normal dismissal.
        const isCritical = activeGameBanner.bannerType === 'turn_ending_event';
        const duration = isCritical ? BANNER_DURATION_CRITICAL : BANNER_DURATION_NORMAL;
        const timeDisplayed = Date.now() - activeGameBanner.timestamp;
        const remainingDuration = Math.max(0, duration - timeDisplayed);

        bannerTimeoutRef.current = window.setTimeout(() => {
            setGameState(prev => {
                if (prev?.activeGameBanner?.bannerId === activeGameBanner.bannerId) {
                    return { ...prev, activeGameBanner: null };
                }
                return prev;
            });
        }, remainingDuration);
    }

    return () => {
        if (bannerTimeoutRef.current) {
            clearTimeout(bannerTimeoutRef.current);
        }
    };
  }, [gameState?.activeGameBanner, gameState?.bannerQueue]);

  const endTurn = () => {
    if (isEndingTurn.current) return;
    endTurnLogicRef.current();
  };

  const endTurnLogic = useCallback(async (isLongAnimation = false, bannerInfo?: { message: string; bannerType: ActiveGameBannerState['bannerType'] }) => {
    if (isEndingTurn.current) return;
    isEndingTurn.current = true;

    try {
        // --- ANIMATION START ---
        const animationType = isLongAnimation ? 'long' : 'short';
        const duration = isLongAnimation ? 6500 : 1500;
        const logicWaitDuration = duration - 500;

        setEndDayAnimation(animationType);
        if (bannerInfo) {
            // Delay banner slightly to appear after fade begins
            setTimeout(() => triggerBanner(bannerInfo.message, bannerInfo.bannerType), 500);
        }
        
        // Wait until screen is black before running state-changing logic
        await new Promise(resolve => setTimeout(resolve, logicWaitDuration));

        // --- GAME LOGIC (This is a synchronous function) ---
        const calculateNextTurnState = (currentState: GameState | null) => {
            if (!currentState || currentState.status !== 'playing') {
                return { newState: currentState, lostTurn: false, banner: undefined };
            }
            
            const prev = currentState;
            const lostDayResult = { isLost: false, banner: undefined as any };
            let logsToAdd: { message: string, type: LogEntry['type'] }[] = [];
            const _localLog = (message: string, type: LogEntry['type'] = 'info') => logsToAdd.push({ message, type });
            
            let modPlayer = { ...prev.playerDetails[PLAYER_ID], turnEnded: true };
            let gameUpdates: Partial<GameState> = {};
            const theme = getThemeName(prev.ngPlusLevel);
            
            const campfireWasActive = modPlayer.isCampfireActive;

            const isPeacefulWin = prev.activeEvent?.id === prev.aiBoss?.id && prev.activeEvent?.isPacified === true;
            const isCaptureWin = prev.activeEvent?.id === prev.aiBoss?.id && (prev.activeEvent.health || 0) > 0 && (prev.activeEvent.health || 0) <= 4 && (prev.activeObjectives || []).some(obj => ['objective_take_em_alive', 'objective_mans_inhumanity'].includes(obj.id));
            const isCombatWin = localStorage.getItem('aiBossDefeated_WWS') === 'true';

            if (isPeacefulWin || isCaptureWin || isCombatWin) {
                _localLog(getRandomLogVariation('playerVictoryFinalDay', { playerName: modPlayer.name }, theme, modPlayer, undefined, true), 'system');
                
                if (isCaptureWin) {
                    modPlayer.capturedBossAlive = true;
                }
                
                let objectiveSummary: GameState['objectiveSummary'] | undefined;
                if ((prev.activeObjectives || []).length > 0 && prev.aiBoss) {
                    let allSummaries: { title: string; message: string; status: 'success' | 'failure' }[] = [];
                    (prev.activeObjectives || []).forEach(objective => {
                        const result = handleObjectiveCompletionChecks(modPlayer, objective, prev.aiBoss!, prev.turn, lastAttackPowerRef.current, prev.activeEvent);
                        modPlayer = result.updatedPlayer;
                        allSummaries.push({
                            title: result.objectiveStatus === 'success' ? `Objective Complete: ${objective.name}` : `Objective Failed: ${objective.name}`,
                            message: result.objectiveMessage.replace(/^Congratulations!\n/i, '').replace(/^Optional Objective Failed.\n/i, ''),
                            status: result.objectiveStatus,
                        });
                    });
                    
                    const summaryLines = allSummaries.map(s => `${s.status === 'success' ? '✅' : '❌'} ${s.title}:\n${s.message}`);
                    objectiveSummary = {
                        title: "Objectives Summary",
                        message: summaryLines.join('\n\n---\n\n'),
                        status: allSummaries.every(s => s.status === 'success') ? 'success' : 'failure',
                    };
                }
                
                gameUpdates.objectiveSummary = objectiveSummary;
                gameUpdates.showObjectiveSummaryModal = !!objectiveSummary;
                gameUpdates.activeObjectives = [];
                
                // Clear the flag here, as its purpose is fulfilled by this check.
                if (isCombatWin) {
                    localStorage.removeItem('aiBossDefeated_WWS');
                }

                if (!objectiveSummary) {
                    setTimeout(proceedToFinishedState, 0);
                }
                 const finalLogs = [...logsToAdd.map(l => ({ ...l, timestamp: new Date().toISOString() })).reverse(), ...prev.log].slice(0, MAX_INTERNAL_LOG_ENTRIES);
                 const newState = { ...prev, ...gameUpdates, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer }, log: finalLogs };
                 return { newState, lostTurn: false, banner: undefined };
            }
            
            let threatAttackedAtNight = false;
            let eventActiveAtNight = prev.activeEvent;
            let illnessWorsenedName: string | null = null;
            let gameShouldEnd = false;
            let winReason = '';
            
            if (eventActiveAtNight && modPlayer.eventPacifiedThisTurn) {
                _localLog(`The pacified ${eventActiveAtNight.name} wanders off peacefully into the night.`, 'info');
                bannerIdCounter.current++; 
                gameUpdates.bannerQueue = [...(prev.bannerQueue || []), { message: `${eventActiveAtNight.name} Left Peacefully`, bannerType: 'generic_info', bannerId: bannerIdCounter.current }];
                const baseCard = getBaseCardByIdentifier(eventActiveAtNight);
                if(baseCard) gameUpdates.eventDiscardPile = [...(prev.eventDiscardPile || []), baseCard];
                eventActiveAtNight = null;
            }

            if (eventActiveAtNight && (eventActiveAtNight.health || 0) > 0) {
                const isBossNight = eventActiveAtNight.id === prev.aiBoss?.id;
                const isNightAttacker = eventActiveAtNight.id.startsWith('threat_rattlesnake_') || eventActiveAtNight.id.startsWith('threat_skunk_') || eventActiveAtNight.id.startsWith('threat_thief_');

                if (isNightAttacker) {
                    const isCampfireSafe = campfireWasActive && !eventActiveAtNight.id.startsWith('threat_thief_');
                    if (!isCampfireSafe) {
                        _localLog(getRandomLogVariation('enemyAttackEndOfDay', { enemyName: eventActiveAtNight.name }, theme, modPlayer, eventActiveAtNight, isBossNight), 'event');
                        threatAttackedAtNight = true;

                        if (eventActiveAtNight.id.startsWith('threat_skunk_t1')) {
                            gameUpdates.animationQueue = [...(gameUpdates.animationQueue || prev.animationQueue || []), { type: 'skunkspray', id: Date.now() }];
                            modPlayer.runStats.timesSkunked++;
                            const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, eventActiveAtNight.effect?.amount || 0, eventActiveAtNight.name, isBossNight, eventActiveAtNight.id, false, eventActiveAtNight);
                            modPlayer = updatedPlayer;
                            gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                        } else if (eventActiveAtNight.id.startsWith('threat_thief_')) {
                              gameUpdates.playerShake = true;
                              const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, eventActiveAtNight.effect?.amount || 0, eventActiveAtNight.name, isBossNight, eventActiveAtNight.id, false, eventActiveAtNight);
                              modPlayer = updatedPlayer;
                              gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                        } else if (eventActiveAtNight.id.startsWith('threat_rattlesnake_')) {
                            const illnessCard = CURRENT_CARDS_DATA[eventActiveAtNight.effect?.illness_id || ''];
                            soundManager.playSound('threat_rattlesnake_t1');
                            bannerIdCounter.current++; 
                            gameUpdates.bannerQueue = [...(prev.bannerQueue || []), { message: 'Snake Bite!', bannerType: 'turn_ending_event', bannerId: bannerIdCounter.current }];
                            gameUpdates.playerShake = true;
                            const damage = eventActiveAtNight.effect?.damage_on_apply || 0;
                            if (damage > 0) {
                                const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, damage, eventActiveAtNight.name, isBossNight, eventActiveAtNight.id, false, eventActiveAtNight);
                                modPlayer = updatedPlayer;
                                gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                            }
                            if (modPlayer.health > 0 && illnessCard && !modPlayer.currentIllnesses.some(ill => ill.id === illnessCard.id)) {
                                modPlayer.currentIllnesses.push(illnessCard);
                                modPlayer.runStats.illnesses_contracted++;
                                _localLog(`Contracts ${illnessCard.name}.`, 'event');
                            }
                        }

                        if (modPlayer.health <= 0) {
                            gameShouldEnd = true;
                            winReason = getRandomLogVariation('playerDefeat', { enemyName: eventActiveAtNight.name }, theme, modPlayer, eventActiveAtNight, isBossNight);
                        }
                    } else {
                          _localLog(getRandomLogVariation('enemyCampfireDeterred', { enemyName: eventActiveAtNight.name }, theme, modPlayer, eventActiveAtNight), 'info');
                          bannerIdCounter.current++;
                          gameUpdates.bannerQueue = [...(prev.bannerQueue || []), { message: `${eventActiveAtNight.name} Deterred`, bannerType: 'generic_info', bannerId: bannerIdCounter.current }];
                    }
                    const baseCard = getBaseCardByIdentifier(eventActiveAtNight);
                    if (baseCard) gameUpdates.eventDiscardPile = [...(gameUpdates.eventDiscardPile || prev.eventDiscardPile || []), baseCard];
                    eventActiveAtNight = null;
                }
            }

            if (!gameShouldEnd) {
                const cardsFromHand = modPlayer.hand.filter(Boolean) as CardData[];
                if (cardsFromHand.length > 0) modPlayer.playerDiscard.push(...cardsFromHand);
                modPlayer.hand = new Array(modPlayer.handSize).fill(null);
                
                if (campfireWasActive) {
                    modPlayer.isCampfireActive = false;
                    _localLog(getRandomLogVariation('campfireDoused', {}, theme, modPlayer), 'system');
                }

                if (modPlayer.currentIllnesses.length > 0) {
                    illnessWorsenedName = modPlayer.currentIllnesses.map(i => i.name).join(', ');
                    const damageFromIllness = modPlayer.currentIllnesses.length;
                    modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - damageFromIllness);
                    modPlayer.health = Math.min(modPlayer.health, modPlayer.maxHealth);
                    if (modPlayer.health <= 0) {
                        gameShouldEnd = true;
                        winReason = getRandomLogVariation('playerDefeat', { enemyName: illnessWorsenedName }, theme, modPlayer);
                    }
                }
            }
            
            if (modPlayer.mountainSicknessActive) {
                modPlayer.mountainSicknessTurnsRemaining--;
                if (modPlayer.mountainSicknessTurnsRemaining <= 0) {
                    modPlayer.mountainSicknessActive = false;
                      _localLog(getRandomLogVariation('illnessTemporaryCure', { illnessName: "Mountain Sickness" }, theme, modPlayer), 'info');
                }
            }
            
            if (eventActiveAtNight && !threatAttackedAtNight) {
                const isNonHostileOnReveal = NON_HOSTILE_ON_REVEAL_IDS.includes(eventActiveAtNight.id);

                if (isNonHostileOnReveal && !prev.playerAttackedEventThisTurn) {
                    // Rule for non-hostile animals: Flee if ignored for the day.
                    _localLog(getRandomLogVariation('animalWandersOff', { enemyName: eventActiveAtNight.name, playerName: modPlayer.name || 'Player' }, theme, modPlayer, eventActiveAtNight), 'info');
                    bannerIdCounter.current++;
                    gameUpdates.bannerQueue = [...(gameUpdates.bannerQueue || prev.bannerQueue || []), { message: `${eventActiveAtNight.name} Wandered Off`, bannerType: 'generic_info', bannerId: bannerIdCounter.current }];
                    const baseCard = getBaseCardByIdentifier(eventActiveAtNight);
                    if(baseCard) gameUpdates.eventDiscardPile = [...(gameUpdates.eventDiscardPile || prev.eventDiscardPile || []), baseCard];
                    eventActiveAtNight = null;

                } else if ((eventActiveAtNight.health || 0) <= 4 && (eventActiveAtNight.health || 0) > 0 && !prev.playerAttackedEventThisTurn) {
                    // Existing rule for wounded animals: Flee if spared for the day.
                    _localLog(getRandomLogVariation('threatFlees', { enemyName: eventActiveAtNight.name }, theme, modPlayer, eventActiveAtNight), 'event');
                    bannerIdCounter.current++;
                    gameUpdates.bannerQueue = [...(gameUpdates.bannerQueue || prev.bannerQueue || []), { message: `${eventActiveAtNight.name} Fled`, bannerType: 'generic_info', bannerId: bannerIdCounter.current }];
                    const baseCard = getBaseCardByIdentifier(eventActiveAtNight);
                    if(baseCard) gameUpdates.eventDiscardPile = [...(gameUpdates.eventDiscardPile || prev.eventDiscardPile || []), baseCard];
                    eventActiveAtNight = null;

                } else if (eventActiveAtNight.type !== 'Event') {
                    const baseCard = getBaseCardByIdentifier(eventActiveAtNight);
                    if (baseCard) {
                        const isValuable = baseCard.id.startsWith('item_gold_nugget') || baseCard.id.startsWith('item_jewelry');
                
                        if (isValuable) {
                            _localLog(`The valuable ${baseCard.name} was left behind and returns to the wilds, to be found again.`, 'info');
                            gameUpdates.eventDiscardPile = [...(gameUpdates.eventDiscardPile || prev.eventDiscardPile || []), baseCard];
                        } else {
                            // Non-valuables left on the trail are added to the top of the store's draw pile.
                            _localLog(getRandomLogVariation('itemLeftBehind', { itemName: baseCard.name }, theme, modPlayer, baseCard), 'info');
                            gameUpdates.storeItemDeck = [baseCard, ...(prev.storeItemDeck || [])];
                        }
                    }
                    eventActiveAtNight = null;
                }
            }
            
            gameUpdates.turn = prev.turn + 1;
            if (illnessWorsenedName) {
                _localLog(getRandomLogVariation('newDayWithIllnessWorsened', { dayNumber: gameUpdates.turn, illnessName: illnessWorsenedName }, theme, modPlayer), 'turn');
            } else {
                _localLog(getRandomLogVariation('newDay', { dayNumber: gameUpdates.turn }, theme, modPlayer), 'turn');
            }
            
            let currentEventDeck = [...(prev.eventDeck || [])];
            let currentEventDiscard = [...(gameUpdates.eventDiscardPile || prev.eventDiscardPile || [])];
            let currentActiveEventForNewDay = eventActiveAtNight;
            
            if (currentActiveEventForNewDay === null && !campfireWasActive) {
                let eventToProcess: CardData | null = null;
                const isBossTurn = modPlayer.forceBossRevealNextTurn || currentEventDeck.length === 0 || prev.turn >= MAX_DAYS_BEFORE_BOSS_FINDS_PLAYER;

                if (isBossTurn && prev.aiBoss) {
                    _localLog("The Boss appears!", "event");
                    eventToProcess = getScaledCard(prev.aiBoss, prev.ngPlusLevel);
                    if((prev.eventDifficultyBonus || 0) > 0) eventToProcess = applyDifficultyBonus(eventToProcess, prev.eventDifficultyBonus || 0);
                    gameUpdates.isBossFightActive = true;
                    soundManager.playMusic('music_boss');
                } else if (currentEventDeck.length > 0) {
                    const nextCard = currentEventDeck.shift()!;
                    eventToProcess = getScaledCard(nextCard, prev.ngPlusLevel);
                    if((prev.eventDifficultyBonus || 0) > 0) eventToProcess = applyDifficultyBonus(eventToProcess, prev.eventDifficultyBonus || 0);
                }

                if (eventToProcess) {
                    if (eventToProcess.id.includes('lightning_strike')) {
                        gameUpdates.showLightningStrikeFlash = true;
                        soundManager.playSound('lightning_strike');
                    }
                    const result = applyImmediateEventAndCheckEndTurnUtil(eventToProcess, modPlayer, prev.aiBoss, prev.ngPlusLevel, lastAttackPowerRef, _localLog, triggerGoldFlash, triggerAnimation, (message, type) => {
                        bannerIdCounter.current++;
                        gameUpdates.bannerQueue = [...(gameUpdates.bannerQueue || prev.bannerQueue || []), { message, bannerType: type, bannerId: bannerIdCounter.current }];
                    }, getBaseCardByIdentifier, applyDamageAndGetAnimation);
                    
                    modPlayer = result.updatedPlayer;
                    if(result.damageInfo) gameUpdates.pendingPlayerDamageAnimation = result.damageInfo;
                    if (result.gameShouldEnd) { gameShouldEnd = true; winReason = result.winReason || ''; }
                    
                    if (result.turnEndedByEvent && result.eventThatEndedTurn) {
                        lostDayResult.isLost = true;
                        lostDayResult.banner = { message: result.eventThatEndedTurn.name, bannerType: 'turn_ending_event' };
                    }

                    if (result.eventRemoved) currentActiveEventForNewDay = null;
                    else currentActiveEventForNewDay = result.modifiedEventAfterTrap;
                }
            } else if (campfireWasActive) {
                _localLog("The campfire kept the wilderness quiet. No new event.", "info");
            }
            
            if (currentActiveEventForNewDay && prev.activeEvent?.id === currentActiveEventForNewDay?.id && !threatAttackedAtNight) {
                if (campfireWasActive && currentActiveEventForNewDay.subType === 'animal') {
                    _localLog(getRandomLogVariation('enemyCampfireDeterred', { enemyName: currentActiveEventForNewDay.name }, theme, modPlayer, currentActiveEventForNewDay), 'info');
                } else {
                    const isMorningBoss = currentActiveEventForNewDay.id === prev.aiBoss?.id;
                    if (!currentActiveEventForNewDay.isPacified && currentActiveEventForNewDay.effect?.type === 'damage') {
                        _localLog(getRandomLogVariation('enemyAttackMorning', { enemyName: currentActiveEventForNewDay.name }, theme, modPlayer, currentActiveEventForNewDay, isMorningBoss), 'event');
                        const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, currentActiveEventForNewDay.effect.amount || 0, currentActiveEventForNewDay.name, isMorningBoss, currentActiveEventForNewDay.id, false, currentActiveEventForNewDay);
                        modPlayer = updatedPlayer;
                        gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                        gameUpdates.playerShake = true;
                        if (modPlayer.health <= 0) { gameShouldEnd = true; winReason = getRandomLogVariation('playerDefeat', { enemyName: currentActiveEventForNewDay.name }, theme, modPlayer, currentActiveEventForNewDay, isMorningBoss); }
                    }
                }
            }

            if (!gameShouldEnd) {
                let targetMaxHealth = modPlayer.characterBaseMaxHealthForRun;
                modPlayer.equippedItems.forEach(item => {
                    if (item.effect?.persistent) {
                        if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') targetMaxHealth += item.effect.amount;
                        else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') targetMaxHealth += item.effect.max_health;
                    }
                });
                if (modPlayer.currentIllnesses.length === 0 && !modPlayer.mountainSicknessActive && modPlayer.maxHealth < targetMaxHealth) {
                    modPlayer.maxHealth += 1;
                    _localLog(`Max health recovered to ${modPlayer.maxHealth}.`, 'info');
                }
                if (modPlayer.equippedItems.some(i => i.id.startsWith('item_gold_pan'))) {
                    const pan = modPlayer.equippedItems.find(i => i.id.startsWith('item_gold_pan'))!;
                    const goldAmount = pan.effect?.amount || 5;
                    modPlayer.gold += goldAmount;
                    modPlayer.runStats.gold_earned += goldAmount;
                    _localLog(getRandomLogVariation('goldFoundFromItem', { goldAmount, itemName: pan.name }, theme, modPlayer, pan), 'gold');
                }
                if (modPlayer.equippedItems.some(i => i.id.startsWith('upgrade_waterskin_canteen_'))) {
                    const canteen = modPlayer.equippedItems.find(i => i.id.startsWith('upgrade_waterskin_canteen_'))!;
                    modPlayer = applyHealToPlayer(modPlayer, canteen.effect?.amount || 0, canteen.name, currentActiveEventForNewDay?.id === prev.aiBoss?.id, canteen);
                }

                if (!lostDayResult.isLost) {
                    let currentPlayerDeck = [...modPlayer.playerDeck];
                    let handDrawSize = modPlayer.handSize;
                    if (modPlayer.mountainSicknessActive) handDrawSize = Math.max(0, modPlayer.handSize - 1);
                    const newlyDrawnIndices: number[] = [];

                    for (let i = 0; i < handDrawSize; i++) {
                        if (currentPlayerDeck.length === 0 && modPlayer.playerDiscard.length > 0) {
                            _localLog("Reshuffling discard pile into deck.", "debug");
                            currentPlayerDeck.push(...shuffleArray(modPlayer.playerDiscard));
                            modPlayer.playerDiscard = [];
                        }
                        if (currentPlayerDeck.length > 0) {
                            const card = currentPlayerDeck.shift()!;
                            modPlayer.hand[i] = getScaledCard(card, modPlayer.ngPlusLevel);
                            newlyDrawnIndices.push(i);
                        } else {
                            break;
                        }
                    }
                    modPlayer.playerDeck = currentPlayerDeck;
                    modPlayer.hand.sort((a, b) => getCardCategory(a) - getCardCategory(b));
                    gameUpdates.newlyDrawnCardIndices = newlyDrawnIndices;
                }
            }
            
            gameUpdates.activeEvent = currentActiveEventForNewDay;
            gameUpdates.eventDeck = currentEventDeck;
            gameUpdates.eventDiscardPile = currentEventDiscard;
            gameUpdates.playerAttackedEventThisTurn = false;
            gameUpdates.blockTradeDueToHostileEvent = isEventConsideredHostile(currentActiveEventForNewDay);
            gameUpdates.activeEventTurnCounter = prev.activeEvent?.id === currentActiveEventForNewDay?.id ? (prev.activeEventTurnCounter || 0) + 1 : 1;
            
            modPlayer.hasEquippedThisTurn = false;
            modPlayer.hasTakenActionThisTurn = false;
            modPlayer.hasRestockedThisTurn = false;
            modPlayer.eventPacifiedThisTurn = false;
            modPlayer.forceBossRevealNextTurn = false;
            modPlayer.turnEnded = lostDayResult.isLost;
            
            if (gameShouldEnd) {
                gameUpdates.status = 'finished';
                gameUpdates.winReason = winReason;
                gameUpdates.runStartState = prev.runStartState;
                 _localLog(winReason, "system");
                 if (prev.autosaveSlotIndex === 3) {
                    deleteGameInSlot(3);
                    _log(`Autosave in Autosave Slot cleared after defeat.`, 'system');
                    gameUpdates.autosaveSlotIndex = null;
                }
                modPlayer.runStats.totalStepsTaken = modPlayer.stepsTaken;
                modPlayer.runStats.totalDaysSurvived = prev.turn;
                modPlayer.runStats.mostGoldHeld = Math.max(modPlayer.runStats.mostGoldHeld || 0, modPlayer.gold);
                updateLifetimeStats(modPlayer.runStats);
            } else {
                 if (prev.autosaveSlotIndex === 3) {
                    saveGameToSlot({ ...prev, ...gameUpdates, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } }, 3);
                    _localLog(`Progress autosaved to Autosave Slot.`, 'system');
                }
            }

            const isMobileLayout = window.innerWidth < 1024;
            gameUpdates.scrollAnimationPhase = isMobileLayout ? 'fadingInAndScrollingUp' : 'none';

            if (prev.turn === 1 && prev.objectiveChoices.length > 0) {
                const chosenObjectives = (prev.selectedObjectiveIndices || []).map(i => prev.objectiveChoices[i]).filter(Boolean);
                if (chosenObjectives.length > 0) _log(`Objectives selected: ${chosenObjectives.map(o => o.name).join(', ')}`, 'system');
                else _log(`No objectives selected for this run.`, 'system');
                gameUpdates.activeObjectives = chosenObjectives;
                gameUpdates.objectiveChoices = [];
                gameUpdates.selectedObjectiveIndices = [];
            }
            
            const finalLogs = [...logsToAdd.map(l => ({ ...l, timestamp: new Date().toISOString() })).reverse(), ...prev.log].slice(0, MAX_INTERNAL_LOG_ENTRIES);
            
            const newState = { 
                ...prev, 
                ...gameUpdates, 
                playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer }, 
                log: finalLogs 
            };

            // Cleanup animations after state update
            setTimeout(() => {
                setGameState(p => {
                    if (!p) return null;
                    let nextState = {...p};
                    if (nextState.showLightningStrikeFlash) nextState.showLightningStrikeFlash = false;
                    if (nextState.playerShake) nextState.playerShake = false;
                    if (nextState.pendingPlayerDamageAnimation) nextState.pendingPlayerDamageAnimation = null;
                    if (nextState.scrollAnimationPhase === 'fadingInAndScrollingUp') nextState.scrollAnimationPhase = 'none';
                    return nextState;
                });
            }, 500);

            return { newState, lostTurn: lostDayResult.isLost, banner: lostDayResult.banner };
        };

        const { newState, lostTurn, banner } = calculateNextTurnState(gameStateRef.current);

        // Set the new state while the screen is black
        setGameState(newState);

        // Now, wait for the rest of the animation's total duration to finish
        await new Promise(resolve => setTimeout(resolve, duration - logicWaitDuration));

        // Clean up the animation and release the lock
        setEndDayAnimation('none');
        isEndingTurn.current = false;

        // If another turn was lost, schedule the next end-of-day sequence
        if (lostTurn) {
            // Use a small timeout to allow React to render the 'endDayAnimation: none' state
            // before we immediately try to set it again.
            setTimeout(() => {
                endTurnLogicRef.current(true, banner);
            }, 50);
        }
    } catch (error) {
        console.error("Error during endTurnLogic:", error);
        _log("A critical error occurred while ending the turn. The game may be unstable.", "error");
        setEndDayAnimation('none');
        isEndingTurn.current = false;
    }
  }, [proceedToFinishedState, handleObjectiveCompletionChecks, applyDamageAndGetAnimation, applyHealToPlayer, getBaseCardByIdentifier, triggerAnimation, triggerGoldFlash, _log, triggerBanner]);
  
  useEffect(() => {
    endTurnLogicRef.current = endTurnLogic;
  }, [endTurnLogic]);

  useEffect(() => {
    if (gameState?.scrollAnimationPhase === 'fadingOutAndScrollingDown') window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
    else if (gameState?.scrollAnimationPhase === 'fadingInAndScrollingUp') smoothScrollTo(0, 4000);
  }, [gameState?.scrollAnimationPhase]);

  useEffect(() => {
    if (pendingStoreRestock) {
      const { index } = pendingStoreRestock;
      const restockTimeout = setTimeout(() => {
        setGameState(prev => {
          if (!prev) return null;

          const currentStoreDisplay = [...prev.storeDisplayItems];
          if (index < 0 || index >= currentStoreDisplay.length || currentStoreDisplay[index] !== null) {
            return prev;
          }

          let currentStoreDeck = [...prev.storeItemDeck];
          let currentStoreDiscard = [...prev.storeItemDiscardPile];

          if (currentStoreDeck.length === 0 && currentStoreDiscard.length > 0) {
            currentStoreDeck = shuffleArray(currentStoreDiscard);
            currentStoreDiscard = [];
          }

          if (currentStoreDeck.length > 0) {
            const newCard = getScaledCard(currentStoreDeck.shift()!, prev.ngPlusLevel);
            currentStoreDisplay[index] = newCard;
          }

          return {
            ...prev,
            storeDisplayItems: currentStoreDisplay,
            storeItemDeck: currentStoreDeck,
            storeItemDiscardPile: currentStoreDiscard,
          };
        });
        setPendingStoreRestock(null);
      }, 500);

      return () => clearTimeout(restockTimeout);
    }
  }, [pendingStoreRestock]);

  useEffect(() => {
    const pendingDamage = gameState?.pendingPlayerDamageAnimation;
    if (pendingDamage) {
        const damageAmount = pendingDamage.amount;
        const pulseCount = Math.floor(damageAmount / 2);
        const isStartOfDay = gameState?.scrollAnimationPhase === 'fadingInAndScrollingUp';
        const delay = isStartOfDay ? 1000 : 0;
        if (pulseCount > 0) {
            setTimeout(() => {
                for (let i = 0; i < pulseCount; i++) {
                    setTimeout(() => triggerAnimation('player-damage-pulse', 'player'), i * 650);
                }
            }, delay);
        }
        setGameState(prev => {
            if (prev?.pendingPlayerDamageAnimation === pendingDamage) return { ...prev, pendingPlayerDamageAnimation: null };
            return prev;
        });
    }
  }, [gameState?.pendingPlayerDamageAnimation, gameState?.scrollAnimationPhase, triggerAnimation]);

  const handleCardAction = useCallback(async (actionType: string, payload: any) => {
    if (isActionInProgress.current && actionType !== 'CHEAT_ADD_GOLD') return;
    isActionInProgress.current = true;
    try {
        const initialGameState = gameStateRef.current;
        if (!initialGameState || (isEndingTurn.current && actionType !== 'SHOW_MODAL')) {
            return;
        }
        
        if (initialGameState.status === 'finished' && actionType !== 'SHOW_MODAL') {
            _log("Cannot perform actions after the game has finished.", "error");
            return;
        }

        const isBossActive = initialGameState.activeEvent?.id === initialGameState.aiBoss?.id;
        _log(`Action: ${actionType}, Card: ${payload?.card?.id || 'N/A'}`, 'debug');

        let modifiablePlayer = { ...initialGameState.playerDetails[PLAYER_ID] };
        let modifiableGameStateUpdates: Partial<GameState> = {};

        const helpers: actionHandlers.ActionHandlerArgs['helpers'] = {
            _log,
            triggerAnimation,
            triggerBanner,
            triggerGoldFlash,
            applyHealToPlayer,
            applyDamageAndGetAnimation,
            getBaseCardByIdentifier,
            soundManager,
            setPendingStoreRestock,
            lastAttackPowerRef,
        };

        const args: actionHandlers.ActionHandlerArgs = {
            player: modifiablePlayer,
            gameState: initialGameState,
            payload,
            isBossActive,
            helpers,
        };

        let result: actionHandlers.ActionHandlerResult | null = null;

        switch (actionType) {
            case 'SELECT_OBJECTIVE': {
                if (initialGameState.turn !== 1) {
                    _log("Can only select objectives on Day 1.", "error");
                    result = { player: modifiablePlayer, gameUpdates: {} };
                    break;
                }
                const { index } = payload;
                const currentSelection = initialGameState.selectedObjectiveIndices || [];
                const newSelection = new Set(currentSelection);
                if (newSelection.has(index)) {
                    newSelection.delete(index);
                } else {
                    if (newSelection.size < 2) {
                        newSelection.add(index);
                    } else {
                        _log("You can select a maximum of 2 objectives.", "info");
                    }
                }
                modifiableGameStateUpdates.selectedObjectiveIndices = Array.from(newSelection);
                result = { player: modifiablePlayer, gameUpdates: modifiableGameStateUpdates };
                break;
            }
            case 'RESET_THREAT_SHAKE_TRIGGER':
                setGameState(prev => prev ? { ...prev, triggerThreatShake: false } : null);
                isActionInProgress.current = false;
                return;
            case 'RESET_EQUIP_ANIMATION':
                setGameState(prev => prev ? { ...prev, equipAnimationIndex: null } : null);
                isActionInProgress.current = false;
                return;
            case 'RESET_PLAYER_SHAKE':
                setGameState(prev => prev ? { ...prev, playerShake: false } : null);
                isActionInProgress.current = false;
                return;
            case 'CHEAT_ADD_GOLD': {
                const { amount } = payload;
                if (typeof amount === 'number' && amount > 0) {
                    _log(`Cheat Activated: Gained ${amount} Gold!`, 'gold');
                    soundManager.playSound('gold');
                    const updatedPlayer = {
                        ...initialGameState.playerDetails[PLAYER_ID],
                        gold: initialGameState.playerDetails[PLAYER_ID].gold + amount,
                    };
                    updatedPlayer.runStats.gold_earned += amount;

                    setGameState(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            playerDetails: { ...prev.playerDetails, [PLAYER_ID]: updatedPlayer },
                            modals: {
                                ...prev.modals,
                                message: { isOpen: true, title: 'Cheat Activated', text: `You gained ${amount} Gold!` }
                            }
                        };
                    });
                }
                isActionInProgress.current = false;
                return;
            }
            case 'RESET_NEWLY_DRAWN_ANIMATION_TRIGGER':
                setGameState(prev => prev ? { ...prev, newlyDrawnCardIndices: undefined } : null);
                isActionInProgress.current = false;
                return;
            case 'RESET_EQUIP_ANIMATION_TRIGGER':
                setGameState(prev => prev ? { ...prev, equipAnimationIndex: null } : null);
                isActionInProgress.current = false;
                return;
            case 'RESET_RESTOCK_ANIMATION_TRIGGER':
                setGameState(prev => prev ? { ...prev, triggerStoreRestockAnimation: false } : null);
                isActionInProgress.current = false;
                return;
            case 'SHOW_MODAL':
                result = actionHandlers.handleShowModal(args);
                break;
            case 'USE_ITEM':
                result = actionHandlers.handleUseItem(args);
                break;
            case 'EQUIP_ITEM':
                result = actionHandlers.handleEquipItem(args);
                break;
            case 'STORE_PROVISION':
                result = actionHandlers.handleStoreProvision(args);
                break;
            case 'USE_FROM_SATCHEL':
                result = actionHandlers.handleUseFromSatchel(args);
                break;
            case 'SELL_FROM_SATCHEL':
                result = actionHandlers.handleSellFromSatchel(args);
                break;
            case 'ATTEMPT_OBJECTIVE':
                result = actionHandlers.handleAttemptObjective(args);
                break;
            case 'BUY_ITEM':
                result = actionHandlers.handleBuyItem(args);
                break;
            case 'SELL_FROM_HAND':
            case 'SELL_EQUIPPED':
                result = actionHandlers.handleSellItem(args);
                break;
            case 'TAKE_EVENT_ITEM':
                result = actionHandlers.handleTakeEventItem(args);
                break;
            case 'DISCARD_UPGRADE':
            case 'DISCARD_EQUIPPED_ITEM':
                result = actionHandlers.handleDiscardEquippedItem(args);
                break;
            case 'INTERACT_WITH_THREAT':
                result = actionHandlers.handleInteractWithThreat(args);
                break;
            default:
                _log(`Unknown action: ${actionType}`, 'error');
                isActionInProgress.current = false;
                return;
        }

        if (result) {
            modifiablePlayer = result.player;
            modifiableGameStateUpdates = { ...modifiableGameStateUpdates, ...result.gameUpdates };
            
            if (actionType === 'SHOW_MODAL') {
                if (bannerTimeoutRef.current) {
                    clearTimeout(bannerTimeoutRef.current);
                    bannerTimeoutRef.current = null;
                }
                modifiableGameStateUpdates.activeGameBanner = null;
            }

            if (modifiablePlayer.health <= 0 && initialGameState.status === 'playing') {
                const theme = getThemeName(modifiablePlayer.ngPlusLevel);
                const sourceOfDamage = (result.gameUpdates.pendingPlayerDamageAnimation?.sourceName && result.gameUpdates.pendingPlayerDamageAnimation.sourceName !== modifiablePlayer.name) 
                                        ? result.gameUpdates.pendingPlayerDamageAnimation.sourceName 
                                        : 'their grievous wounds';
                const winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: sourceOfDamage }, theme, modifiablePlayer);
                
                modifiableGameStateUpdates.status = 'finished';
                modifiableGameStateUpdates.winReason = winReason;
                modifiableGameStateUpdates.runStartState = initialGameState.runStartState;
                 _log(winReason, "system");

                // Clear autosave on defeat
                if (initialGameState.autosaveSlotIndex === 3) {
                    deleteGameInSlot(3);
                    _log(`Autosave in Autosave Slot cleared after defeat.`, 'system');
                    modifiableGameStateUpdates.autosaveSlotIndex = null;
                }

                modifiablePlayer.runStats.totalStepsTaken = modifiablePlayer.stepsTaken;
                modifiablePlayer.runStats.totalDaysSurvived = initialGameState.turn;
                modifiablePlayer.runStats.mostGoldHeld = Math.max(modifiablePlayer.runStats.mostGoldHeld || 0, modifiablePlayer.gold);
                updateLifetimeStats(modifiablePlayer.runStats);
                _log("Lifetime stats updated.", "system");

                localStorage.removeItem('wildWestGameState_WWS');
                localStorage.removeItem('aiBossDefeated_WWS');
            }
        } else {
            isActionInProgress.current = false;
            return;
        }

        const finalSelectedCardState = (actionType !== 'SHOW_MODAL' && !(actionType === 'USE_ITEM' && payload?.card?.effect?.type === 'scout')) ? null : initialGameState.selectedCard;

        setGameState(prevState => {
            if (!prevState) return null;
            const newState = {
                ...prevState, ...modifiableGameStateUpdates,
                playerDetails: { ...prevState.playerDetails, [PLAYER_ID]: modifiablePlayer },
                selectedCard: finalSelectedCardState !== undefined ? finalSelectedCardState : prevState.selectedCard,
            };
            return newState;
        });
    } finally {
        isActionInProgress.current = false;
    }
  }, [_log, applyDamageAndGetAnimation, applyHealToPlayer, triggerGoldFlash, triggerAnimation, triggerBanner, getBaseCardByIdentifier]);

  const handleRestockStore = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState || currentGameState.status !== 'playing' || isEndingTurn.current) return;
    let modifiablePlayer = { ...currentGameState.playerDetails[PLAYER_ID] };
    if (modifiablePlayer.turnEnded || currentGameState.blockTradeDueToHostileEvent || modifiablePlayer.hasRestockedThisTurn) return;
    const restockCost = 10 + (currentGameState.ngPlusLevel * 5);
    if (modifiablePlayer.gold < restockCost) { _log(`Not enough gold to restock (costs ${restockCost}G).`, "error"); return; }

    modifiablePlayer.gold -= restockCost;
    modifiablePlayer.runStats.gold_spent += restockCost;
    modifiablePlayer.runStats.times_restocked++;
    modifiablePlayer.hasRestockedThisTurn = true;
    const theme = getThemeName(modifiablePlayer.ngPlusLevel);
    _log(getRandomLogVariation('storeRestock', { cost: restockCost }, theme, modifiablePlayer), 'action');
    triggerGoldFlash(PLAYER_ID);

    let currentStoreDeck = [...(currentGameState.storeItemDeck || [])];
    let currentStoreDiscard = [...(currentGameState.storeItemDiscardPile || [])];
    currentGameState.storeDisplayItems.forEach(item => { if (item) { const baseItem = getBaseCardByIdentifier(item); if (baseItem) currentStoreDiscard.push(baseItem); } });

    const newStoreDisplay: (CardData | null)[] = new Array(STORE_DISPLAY_LIMIT).fill(null);
    for (let i = 0; i < STORE_DISPLAY_LIMIT; i++) {
        if (currentStoreDeck.length === 0) {
            if (currentStoreDiscard.length > 0) {
                currentStoreDeck = shuffleArray(currentStoreDiscard);
                currentStoreDiscard = [];
            } else break;
        }
        if (currentStoreDeck.length > 0) {
            const drawnCard = currentStoreDeck.shift();
            if (drawnCard) newStoreDisplay[i] = getScaledCard(drawnCard, currentGameState.ngPlusLevel);
        }
    }

    setGameState(prevState => prevState ? {
        ...prevState,
        storeDisplayItems: newStoreDisplay,
        storeItemDeck: currentStoreDeck,
        storeItemDiscardPile: currentStoreDiscard,
        selectedCard: null,
        playerDetails: { ...prevState.playerDetails, [PLAYER_ID]: modifiablePlayer },
        triggerStoreRestockAnimation: true,
    } : null);
  }, [_log, triggerGoldFlash, getBaseCardByIdentifier]);

  const pregenerateNextLevelRemix = useCallback(async (level: number): Promise<void> => {
    try {
        const remixCacheKey = `wildWestRemixCache_NG${level}_WWS`;
        
        if (localStorage.getItem(remixCacheKey)) {
            _log(`Remix cache for NG+${level} already exists. Pre-generation skipped.`, 'system');
            return;
        }

        let numToRemix = 0;
        const isMilestone = level >= 10 && level % NG_PLUS_THEME_MILESTONE_INTERVAL === 0;
        
        if (isMilestone || (level >= 1 && level < 10)) {
            numToRemix = 1;
        } else if (level > 10) {
            numToRemix = 10;
        }

        if (numToRemix === 0) {
            localStorage.setItem(remixCacheKey, JSON.stringify({}));
            return;
        }

        const basePoolForRemix = getThemedCardPool(level, ALL_CARDS_DATA_MAP);
        const remixableCards = basePoolForRemix.filter(card => 
            card.buyCost && card.buyCost > 0 && card.subType !== 'objective' && !card.id.startsWith('custom_') && !card.isCheat
        );

        if (remixableCards.length < numToRemix) {
            _log(`Not enough unique cards (${remixableCards.length}) in the pool to remix ${numToRemix} for NG+${level}.`, 'error');
            numToRemix = remixableCards.length;
        }

        const cardsToRemixSelection = shuffleArray(remixableCards).slice(0, numToRemix);

        _log(`Pre-generating ${cardsToRemixSelection.length} AI-remixed cards for NG+${level}...`, "system");
        
        const BATCH_SIZE = 1;
        const batches: { [id: string]: CardData }[] = [];
        for (let i = 0; i < cardsToRemixSelection.length; i += BATCH_SIZE) {
            const batchSlice = cardsToRemixSelection.slice(i, i + BATCH_SIZE);
            const batchDict: { [id: string]: CardData } = {};
            batchSlice.forEach(card => { batchDict[card.id] = card; });
            batches.push(batchDict);
        }

        if (batches.length > 0) {
            const allRemixedCards: { [id: string]: CardData } = {};
            let processedBatches = 0;
            
            for (const batch of batches) {
                const result = await remixCardsForNGPlusGame(_log, batch, level);
                if (result) {
                    Object.assign(allRemixedCards, result);
                }
                processedBatches++;
                if (gameStateRef.current?.isLoadingNGPlus) {
                    const progress = (processedBatches / batches.length) * 100;
                    setGameState(prev => prev ? { ...prev, remixProgress: progress } : null);
                }
            }

            if (Object.keys(allRemixedCards).length > 0) {
                localStorage.setItem(remixCacheKey, JSON.stringify(allRemixedCards));
                _log(`Successfully pre-generated and cached ${Object.keys(allRemixedCards).length} remixed cards for NG+${level}.`, "system");
            } else {
                 _log(`AI remixing for NG+${level} returned no cards. Caching empty result.`, "error");
                 localStorage.setItem(remixCacheKey, JSON.stringify({}));
            }
        } else {
            localStorage.setItem(remixCacheKey, JSON.stringify({}));
        }

    } catch (err) {
        _log(`Failed to pre-generate remixed cards for NG+${level}. They will be generated upon starting the next run.`, "error");
    }
  }, [_log]);

  const registerCustomCardDefinitions = useCallback((cards: (CardData | null)[], source: string) => {
    if (!cards || cards.length === 0) return;

    const newDefs: { [id: string]: CardData } = {};
    cards.forEach(card => {
        if (card && (card.isCheat || card.id.startsWith('remixed_') || !ALL_CARDS_DATA_MAP[card.id])) {
            if (!CURRENT_CARDS_DATA[card.id]) {
                newDefs[card.id] = card;
            }
        }
    });

    if (Object.keys(newDefs).length > 0) {
        updateCurrentCardsData({ ...CURRENT_CARDS_DATA, ...newDefs });
        _log(`Loaded ${Object.keys(newDefs).length} unique custom definitions from carried over ${source}.`, 'system');
    }
  }, [_log]);

  const initializeLevel = useCallback((level: number, runStartState?: any) => {
    resetCurrentCardsData();
    _log(`Initializing level ${level}...`, 'system');

    const themeName = getThemeName(level);
    let remixedCards: { [id: string]: CardData } = {};

    if (level > 0) {
      let remixCacheKey = '';
      if (level < 10) {
        remixCacheKey = 'remixedCardPool_theme_western_WWS';
      } else if (level < 50) {
        const themeForCache = getThemeName(level);
        remixCacheKey = `remixedCardPool_theme_${themeForCache}_WWS`;
      }

      if (remixCacheKey) {
        try {
          const cached = localStorage.getItem(remixCacheKey);
          if (cached) {
            remixedCards = JSON.parse(cached);
          }
        } catch (e) {
          _log("Could not parse remixed card cache.", "error");
        }
      }
    }

    const finalCardsData = { ...ALL_CARDS_DATA_MAP, ...remixedCards };
    updateCurrentCardsData(finalCardsData);

    const initialCardPool = getThemedCardPool(level, finalCardsData);
    _log(`Initialized level ${level} with ${initialCardPool.length} themed cards.`, 'system');
    
    setGameState(prev => {
        if (!prev) return null;

        let modPlayer = { ...prev.playerDetails[PLAYER_ID] };
        let characterAndSkillsInitialized = false;
        
        if (runStartState) {
            _log("Applying run start state for retry.", "system");
            const rehydratedDeck = (runStartState.deck || []).map((c: string | CardData) => typeof c === 'string' ? CURRENT_CARDS_DATA[c] : c).filter(Boolean);
            const rehydratedDiscard = (runStartState.discard || []).map((c: string | CardData) => typeof c === 'string' ? CURRENT_CARDS_DATA[c] : c).filter(Boolean);
            const rehydratedEquipped = (runStartState.equipped || []).map((c: string | CardData) => typeof c === 'string' ? CURRENT_CARDS_DATA[c] : c).filter(Boolean);
            
            const rehydratedSatchels: { [key: number]: CardData[] } = {};
            if (runStartState.satchels) {
                for (const key in runStartState.satchels) {
                    rehydratedSatchels[key] = (runStartState.satchels[key] || []).map((c: string | CardData) => typeof c === 'string' ? CURRENT_CARDS_DATA[c] : c).filter(Boolean);
                }
            }
            
            registerCustomCardDefinitions(rehydratedDeck, 'deck');
            registerCustomCardDefinitions(rehydratedDiscard, 'discard');
            registerCustomCardDefinitions(rehydratedEquipped, 'equipped');
            
            modPlayer.playerDeck = rehydratedDeck;
            modPlayer.playerDiscard = rehydratedDiscard;
            modPlayer.equippedItems = rehydratedEquipped;
            modPlayer.satchels = rehydratedSatchels;
            
            let hpBonusFromItems = 0;
            rehydratedEquipped.forEach(item => {
                if (item.effect?.persistent && item.type === 'Player Upgrade') {
                    if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') {
                        hpBonusFromItems += item.effect.amount;
                    } else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') {
                        hpBonusFromItems += item.effect.max_health;
                    }
                }
            });

            const character = runStartState.characterId ? CHARACTERS_DATA_MAP[runStartState.characterId] : null;
            if (character) {
                modPlayer.character = character;
                 if (runStartState.personality) {
                    modPlayer.personality = runStartState.personality;
                    const { talkSkill, petSkill } = calculateSkills(character, runStartState.personality);
                    modPlayer.talkSkill = talkSkill;
                    modPlayer.petSkill = petSkill;
                    characterAndSkillsInitialized = true;
                }
                modPlayer.maxHealth = character.health + (runStartState.cumulativeNGPlusMaxHealthBonus || 0) + hpBonusFromItems;
                modPlayer.health = modPlayer.maxHealth;
                modPlayer.characterBaseMaxHealthForRun = character.health + (runStartState.cumulativeNGPlusMaxHealthBonus || 0);
            }
        }
        
        if (!characterAndSkillsInitialized) {
            const storedPlayerDetailsString = localStorage.getItem('wildWestPlayerDetailsForNGPlus_WWS');
            if (storedPlayerDetailsString) {
                const storedDetails = JSON.parse(storedPlayerDetailsString);
                modPlayer.name = storedDetails.name || null;
                if (storedDetails.characterId && CHARACTERS_DATA_MAP[storedDetails.characterId]) {
                     const character = CHARACTERS_DATA_MAP[storedDetails.characterId];
                     modPlayer.character = character;
                     modPlayer.personality = storedDetails.personality || character.personality;
                     
                     const { talkSkill, petSkill } = calculateSkills(character, modPlayer.personality);
                     modPlayer.talkSkill = talkSkill;
                     modPlayer.petSkill = petSkill;
                }
            }
        }
        
        const equippedFromStorageString = localStorage.getItem('wildWestEquippedForNGPlus_WWS');
        const satchelsFromStorageString = localStorage.getItem('wildWestSatchelsForNGPlus_WWS');
        
        if (!runStartState && equippedFromStorageString) {
             const equippedItems = JSON.parse(equippedFromStorageString).map((c: string | CardData) => typeof c === 'string' ? CURRENT_CARDS_DATA[c] : c).filter(Boolean);
             const satchels = satchelsFromStorageString ? JSON.parse(satchelsFromStorageString) : {};

             registerCustomCardDefinitions(equippedItems, 'equipped');
             for (const key in satchels) {
                registerCustomCardDefinitions(satchels[key], 'satchel');
             }
             
             modPlayer.equippedItems = equippedItems;
             modPlayer.satchels = satchels;

             localStorage.removeItem('wildWestEquippedForNGPlus_WWS');
             localStorage.removeItem('wildWestSatchelsForNGPlus_WWS');
        }

        if (modPlayer.character) {
            let hpBonusFromItems = 0;
            modPlayer.equippedItems.forEach(item => {
                if (item.effect?.persistent && item.type === 'Player Upgrade') {
                    if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') {
                        hpBonusFromItems += item.effect.amount;
                    } else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') {
                        hpBonusFromItems += item.effect.max_health;
                    }
                }
            });
            modPlayer.maxHealth = modPlayer.character.health + modPlayer.cumulativeNGPlusMaxHealthBonus + hpBonusFromItems;
            modPlayer.health = modPlayer.maxHealth;
            modPlayer.hatDamageNegationAvailable = modPlayer.equippedItems.some(item => item.effect?.subtype === 'damage_negation');
        }

        const rewardChosen = localStorage.getItem('ngPlusRewardChosen_WWS') === 'true';
        if (level > 0 && !rewardChosen && !runStartState) {
             return {
                ...prev,
                initialCardPool,
                playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer },
                showNGPlusRewardModal: true,
                modals: {
                    ...prev.modals,
                    ngPlusReward: {
                        isOpen: true,
                        title: `Welcome to NG+${level}!`,
                        text: "The trail ahead is harder, but you are stronger. Choose a permanent bonus for this character's lineage:",
                        choices: [
                            { text: "+1 Max Health", callback: () => {} },
                            { text: "+100 Starting Gold", callback: () => {} },
                        ]
                    }
                }
            };
        }

        return {
            ...prev,
            initialCardPool,
            playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer },
        };
    });
  }, [_log, registerCustomCardDefinitions]);

  const resetGame = useCallback(async (options: { hardReset?: boolean; ngPlusOverride?: number; saveSlotIndex?: number; carryOverDeck?: CardData[] } = {}) => {
    ttsManager.cancel();
    const currentState = gameStateRef.current; // Capture state at the very beginning

    // If it's a simple restart (no options from the game menu), it means "restart the current level".
    // We explicitly set ngPlusOverride to the current level to ensure this happens correctly,
    // preventing any ambiguity or incorrect fallback to NG+0.
    const isSimpleRestart = Object.keys(options).length === 0;
    if (isSimpleRestart && currentState) {
        options.ngPlusOverride = currentState.ngPlusLevel;
    }
    
    const { hardReset = false, ngPlusOverride, saveSlotIndex, carryOverDeck } = options;
    
    // Clear any existing autosave before starting a new run
    if (currentState && currentState.autosaveSlotIndex !== null && currentState.autosaveSlotIndex !== undefined) {
        deleteGameInSlot(currentState.autosaveSlotIndex);
        _log(`Autosave in ${currentState.autosaveSlotIndex === 3 ? 'Autosave Slot' : `Slot ${currentState.autosaveSlotIndex + 1}`} cleared for new run.`, 'system');
    }
    
    if (nextLevelRemixPromise.current) {
        setGameState(prev => prev ? { ...prev, isLoadingNGPlus: true, remixProgress: 0 } : null);
        await nextLevelRemixPromise.current;
        nextLevelRemixPromise.current = null; 
    }

    const isInitialLoad = currentState === null;
    const initialStatus = (hardReset || isInitialLoad) ? 'landing' : 'setup';

    _log(hardReset ? "Game reset to NG+0." : `Restarting run.`, "system");
    localStorage.removeItem('aiBossDefeated_WWS');
    if (hardReset) {
        Object.keys(localStorage).forEach(key => { 
            if (key.endsWith('_WWS') && ![
                'wildWestLifetimeStats_WWS', 
                'pedometerFeatureEnabled_WWS',
                'wildWestGameSaves_WWS',
                'preloaded_sound_version_WWS',
                'preloaded_images_timestamp_WWS',
                'preloaded_image_themes_WWS',
                'preloaded_sound_themes_WWS'
            ].includes(key)) {
                localStorage.removeItem(key);
            }
        });
    } else {
        localStorage.removeItem('wildWestGameState_WWS');
        localStorage.removeItem('provisionsCollected_WWS');
        localStorage.removeItem('objectiveCondition_the_expediter_WWS');
        const oldNgPlusLevel = currentState?.ngPlusLevel ?? -1;
        const newNgPlusLevel = ngPlusOverride ?? currentState?.ngPlusLevel ?? parseInt(localStorage.getItem('ngPlusLevel_WWS') || '0', 10);
        const oldThemeMilestone = Math.floor(oldNgPlusLevel / NG_PLUS_THEME_MILESTONE_INTERVAL);
        const newThemeMilestone = Math.floor(newNgPlusLevel / NG_PLUS_THEME_MILESTONE_INTERVAL);
        if (oldThemeMilestone !== newThemeMilestone) {
            const newThemeBossesKey = `wildWestRecentBosses_theme_${newThemeMilestone}_WWS`;
            localStorage.removeItem(newThemeBossesKey);
        }
    }
    
    isEndingTurn.current = false;
    setPendingStoreRestock(null);
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    
    const ngPlusLevel = hardReset 
        ? 0 
        : (ngPlusOverride !== undefined 
            ? ngPlusOverride 
            : (currentState?.ngPlusLevel ?? parseInt(localStorage.getItem('ngPlusLevel_WWS') || '0', 10)));
    
    let runStartStateToPreserve = currentState?.runStartState;
    if (ngPlusOverride !== undefined && currentState && ngPlusOverride !== currentState.ngPlusLevel) {
        // This is an NG+ advancement, not a retry. Invalidate the old start state.
        runStartStateToPreserve = undefined;
    }

    const shouldPreserveFromState = !hardReset && currentState;
    const isRetryWithSnapshot = !hardReset && currentState && runStartStateToPreserve && (ngPlusOverride === undefined || ngPlusOverride === currentState.ngPlusLevel);

    const healthBonusToPreserve = isRetryWithSnapshot
        ? (runStartStateToPreserve.cumulativeNGPlusMaxHealthBonus || 0)
        : (shouldPreserveFromState
            ? currentState.playerDetails[PLAYER_ID].cumulativeNGPlusMaxHealthBonus
            : (hardReset ? 0 : parseInt(localStorage.getItem('ngPlusCumulativeMaxHealthBonus_WWS') || '0', 10)));

    const goldToPreserve = isRetryWithSnapshot
        ? (runStartStateToPreserve.gold || 0)
        : (shouldPreserveFromState
            ? currentState.playerDetails[PLAYER_ID].gold
            : (hardReset ? 0 : parseInt(localStorage.getItem('ngPlusPlayerGold_WWS') || '0', 10)));
        
    const stepsToPreserve = isRetryWithSnapshot 
        ? (runStartStateToPreserve.stepsTaken || 0)
        : (shouldPreserveFromState 
            ? currentState.playerDetails[PLAYER_ID].stepsTaken
            : (hardReset ? 0 : parseInt(localStorage.getItem('wildWestStepsTaken_WWS') || '0', 10)));
    
    const deckToPreserve: CardData[] = carryOverDeck || [];
    const discardToPreserve: CardData[] = [];
    const equippedToPreserve: CardData[] = [];
    const satchelsToPreserve: { [key: number]: CardData[] } = {};

    let runStartStateToPreserveForNextState = currentState?.runStartState;
    if (ngPlusOverride !== undefined && currentState && ngPlusOverride !== currentState.ngPlusLevel) {
        // This is an NG+ advancement, not a retry. Invalidate the old start state.
        runStartStateToPreserveForNextState = undefined;
    }

    const initialPlayerState = {
        ...JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE_TEMPLATE)),
        runStats: { ...JSON.parse(JSON.stringify(INITIAL_RUN_STATS)), highestNGPlusLevel: ngPlusLevel },
        ngPlusLevel,
        cumulativeNGPlusMaxHealthBonus: healthBonusToPreserve,
        gold: goldToPreserve,
        stepsTaken: stepsToPreserve,
        playerDeck: deckToPreserve,
        playerDiscard: discardToPreserve,
        equippedItems: equippedToPreserve,
        satchels: satchelsToPreserve,
    };

    const baseInitialState: GameState = {
        runId: crypto.randomUUID(),
        status: initialStatus,
        playerDetails: { [PLAYER_ID]: initialPlayerState },
        eventDeck: [],
        eventDiscardPile: [],
        activeEvent: null,
        activeObjectives: [],
        storeItemDeck: [],
        storeDisplayItems: [],
        storeItemDiscardPile: [],
        turn: 0,
        storyGenerated: false,
        log: [],
        selectedCard: null,
        ngPlusLevel: ngPlusLevel,
        modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
        activeGameBanner: initialGameBannerState,
        bannerQueue: [],
        blockTradeDueToHostileEvent: false,
        playerDeckAugmentationPool: [],
        initialCardPool: [],
        activeEventTurnCounter: 0,
        scrollAnimationPhase: 'none',
        isLoadingStory: false,
        pedometerFeatureEnabledByUser: localStorage.getItem('pedometerFeatureEnabled_WWS') === 'true',
        showObjectiveSummaryModal: false,
        objectiveSummary: undefined,
        gameJustStarted: true,
        newlyDrawnCardIndices: undefined,
        equipAnimationIndex: null,
        eventDifficultyBonus: 0,
        saveSlotIndex: saveSlotIndex ?? undefined,
        autosaveSlotIndex: null,
        triggerThreatShake: false,
        playerShake: false,
        playerAttackedEventThisTurn: false,
        objectiveChoices: [],
        selectedObjectiveIndices: [],
        runStartState: runStartStateToPreserveForNextState,
        runStartGold: goldToPreserve,
    };
    
    setGameState(baseInitialState);
    initializeLevel(ngPlusLevel, runStartStateToPreserve);
  }, [_log, initializeLevel]);

  const selectCharacter = useCallback((character: Character) => {
    setGameState(prev => {
        if (!prev || prev.status !== 'setup') return prev;

        const prevPlayer = prev.playerDetails[PLAYER_ID];
        const isNewCharacter = prevPlayer.character?.id !== character.id;

        const ngPlusLevel = prev.ngPlusLevel;
        const runStartGold = prev.runStartGold ?? 0;

        let finalGold = 0;
        if (ngPlusLevel > 0) {
            finalGold = Math.max(runStartGold, character.gold);
        } else {
            finalGold = character.gold;
        }

        const storedDetailsString = localStorage.getItem('wildWestPlayerDetailsForNGPlus_WWS');
        const storedDetails: { characterId?: string; personality?: any } = storedDetailsString ? JSON.parse(storedDetailsString) : {};
        const personalityToSet = isNewCharacter ? character.personality : (storedDetails.personality || prevPlayer.personality || character.personality);

        localStorage.setItem('wildWestPlayerDetailsForNGPlus_WWS', JSON.stringify({
            ...storedDetails,
            characterId: character.id,
            personality: personalityToSet
        }));

        const cheatsForCharacter = POP_CULTURE_CHEATS.filter(c => c.requiredCharacterId === character.id);
        if (cheatsForCharacter.length > 0) {
            const customCardsMap: { [id: string]: CardData } = {};
            cheatsForCharacter.forEach(cheat => {
                if (cheat.effects.addCustomCards) {
                    cheat.effects.addCustomCards.forEach(card => { customCardsMap[card.id] = card; });
                }
            });
            if (Object.keys(customCardsMap).length > 0) {
                updateCurrentCardsData({ ...CURRENT_CARDS_DATA, ...customCardsMap });
                _log(`Pre-loaded ${Object.keys(customCardsMap).length} potential custom card definitions for ${character.name}.`, 'debug');
            }
        }

        const cumulativeBonus = prevPlayer?.cumulativeNGPlusMaxHealthBonus || 0;
        
        let hpBonusFromItems = 0;
        (prevPlayer.equippedItems || []).forEach(item => {
            if (item.effect?.persistent && item.type === 'Player Upgrade') {
                if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') {
                    hpBonusFromItems += item.effect.amount;
                } else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') {
                    hpBonusFromItems += item.effect.max_health;
                }
            }
        });

        const finalMaxHealth = Math.max(1, character.health + cumulativeBonus + hpBonusFromItems);
        const { talkSkill, petSkill } = calculateSkills(character, personalityToSet);

        // This is the fix: explicitly build the new player state object property by property,
        // ensuring all carried-over data from `prevPlayer` is preserved, instead of relying
        // on a potentially problematic spread operator.
        const updatedPlayerDetails: PlayerDetails = {
            // Unchanged properties from previous state
            activeTrap: prevPlayer.activeTrap,
            isCampfireActive: prevPlayer.isCampfireActive,
            handSize: prevPlayer.handSize,
            equipSlots: prevPlayer.equipSlots,
            hasEquippedThisTurn: prevPlayer.hasEquippedThisTurn,
            turnEnded: prevPlayer.turnEnded,
            hasTakenActionThisTurn: prevPlayer.hasTakenActionThisTurn,
            hasRestockedThisTurn: prevPlayer.hasRestockedThisTurn,
            isUnsortedDraw: prevPlayer.isUnsortedDraw,
            activeEventForAttack: prevPlayer.activeEventForAttack,
            ngPlusLevel: prevPlayer.ngPlusLevel,
            hatDamageNegationUsedThisTurn: prevPlayer.hatDamageNegationUsedThisTurn,
            currentIllnesses: prevPlayer.currentIllnesses,
            pedometerActive: prevPlayer.pedometerActive,
            stepsTaken: prevPlayer.stepsTaken,
            lastPosition: prevPlayer.lastPosition,
            isGettingLocation: prevPlayer.isGettingLocation,
            locationAccuracy: prevPlayer.locationAccuracy,
            unaccountedDistanceFeet: prevPlayer.unaccountedDistanceFeet,
            cumulativeNGPlusMaxHealthBonus: prevPlayer.cumulativeNGPlusMaxHealthBonus,
            mountainSicknessActive: prevPlayer.mountainSicknessActive,
            mountainSicknessTurnsRemaining: prevPlayer.mountainSicknessTurnsRemaining,
            provisionsPlayed: prevPlayer.provisionsPlayed,
            runStats: prevPlayer.runStats,
            provisionsCollectedThisRun: prevPlayer.provisionsCollectedThisRun,
            eventPacifiedThisTurn: prevPlayer.eventPacifiedThisTurn,
            goldStolenThisTurn: prevPlayer.goldStolenThisTurn,
            lastUsedWeaponType: prevPlayer.lastUsedWeaponType,
            forceBossRevealNextTurn: prevPlayer.forceBossRevealNextTurn,
            capturedBossAlive: prevPlayer.capturedBossAlive,

            // New/changed properties
            character: character,
            name: isNewCharacter ? null : (prevPlayer.name || null),
            health: finalMaxHealth,
            maxHealth: finalMaxHealth,
            gold: finalGold,
            characterBaseMaxHealthForRun: character.health + cumulativeBonus,
            personality: personalityToSet,
            talkSkill: talkSkill,
            petSkill: petSkill,
        
            // Explicitly preserved inventory state
            playerDeck: prevPlayer.playerDeck || [],
            playerDiscard: prevPlayer.playerDiscard || [],
            hand: prevPlayer.hand || [],
            equippedItems: prevPlayer.equippedItems || [],
            satchels: prevPlayer.satchels || {},
            
            // Recalculated property
            hatDamageNegationAvailable: (prevPlayer.equippedItems || []).some(item => item.effect?.subtype === 'damage_negation'),
        };

        _log(`${character.name} selected for NG+${prev.ngPlusLevel}.`, 'system');
        
        return { 
            ...prev, 
            playerDetails: { [PLAYER_ID]: updatedPlayerDetails },
            runStartState: prev.runStartState, 
        };
    });
  }, [_log]);

  const confirmName = useCallback((name: string) => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState || currentGameState.status !== 'setup') return;

    const player = currentGameState.playerDetails[PLAYER_ID];
    localStorage.setItem('wildWestPlayerDetailsForNGPlus_WWS', JSON.stringify({ 
        name: name, 
        characterId: player?.character?.id,
        personality: player?.personality 
     }));

    setGameState(prev => {
      if (!prev || prev.status !== 'setup') return prev;
       _log(`Name set: ${name}.`, 'system');
      return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: { ...prev.playerDetails[PLAYER_ID], name } } };
    });
  }, [_log]);

  const startGame = useCallback(async (playerName: string, character: Character, cheatEffects?: PopCultureCheatEffect) => {
    if (isActionInProgress.current) return;
    isActionInProgress.current = true;
    try {
        const currentGameState = gameStateRef.current;
        if (!currentGameState) { _log("Game state unavailable.", "error"); return; }
        
        let characterForGame = { ...character }; 
        
        // First state update: prepare for boss intro and apply all initial changes
        setGameState(prev => {
            if (!prev) return null;
            let modPlayer = { ...prev.playerDetails[PLAYER_ID], name: playerName, character: characterForGame };

            // Apply non-card cheat effects
            if (cheatEffects) {
                if (cheatEffects.addGold) {
                    modPlayer.gold += cheatEffects.addGold;
                    modPlayer.runStats.gold_earned += cheatEffects.addGold;
                    _log(`Cheat Activated: Gained ${cheatEffects.addGold} Gold!`, 'gold');
                }
                if (cheatEffects.addMaxHealth) {
                    for (let i = 0; i < cheatEffects.addMaxHealth; i++) {
                        modPlayer.health++;
                        modPlayer.maxHealth++;
                        modPlayer.characterBaseMaxHealthForRun++;
                        modPlayer.cumulativeNGPlusMaxHealthBonus++;
                    }
                    _log(`Cheat Activated: Gained ${cheatEffects.addMaxHealth} Max Health!`, 'system');
                }
            }

            let modGameState: GameState = {
                ...prev,
                status: 'generating_boss_intro',
                isLoadingBossIntro: true,
                playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer }
            };

            if (cheatEffects?.increaseDifficulty) {
                modGameState.eventDifficultyBonus = (modGameState.eventDifficultyBonus || 0) + cheatEffects.increaseDifficulty;
                _log(`Cheat Activated: Event difficulty bonus increased by ${cheatEffects.increaseDifficulty}.`, 'system');
            }

            return modGameState;
        });
        
        const storyPromise = (async () => {
            const latestGameState = gameStateRef.current!;
            const cacheKey = getLevelCacheKey(latestGameState.ngPlusLevel, characterForGame.id, playerName);
            let levelCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            const themeMilestone = Math.floor(latestGameState.ngPlusLevel / NG_PLUS_THEME_MILESTONE_INTERVAL);
            const recentBossesKey = `wildWestRecentBosses_theme_${themeMilestone}_WWS`;
            const recentBossNames: string[] = JSON.parse(localStorage.getItem(recentBossesKey) || '[]' );
            const playerPersonality = latestGameState.playerDetails[PLAYER_ID].personality;
            const characterForAPI = { ...characterForGame, personality: playerPersonality };

            try {
                const finalAiBoss = levelCache.aiBoss || await generateAIBossForGame(_log, characterForAPI, playerName, latestGameState.ngPlusLevel, recentBossNames);
                levelCache.aiBoss = finalAiBoss;
                if (finalAiBoss?.name) {
                  const updatedRecentBosses = [finalAiBoss.name, ...recentBossNames].slice(0, 10);
                  localStorage.setItem(recentBossesKey, JSON.stringify(updatedRecentBosses));
                }
                
                if (finalAiBoss?.id && finalAiBoss.id !== 'default_boss' && finalAiBoss.id !== 'default_boss_fallback') {
                    updateCurrentCardsData({ ...CURRENT_CARDS_DATA, [finalAiBoss.id]: finalAiBoss });
                }

                const introData = levelCache.bossIntro || await generateBossIntroStory(playerName, characterForAPI, finalAiBoss, _log, latestGameState.ngPlusLevel);
                levelCache.bossIntro = introData;

                localStorage.setItem(cacheKey, JSON.stringify(levelCache));
                return { finalAiBoss, introData };
            } catch (error) {
                _log("Error generating boss/intro. Using fallbacks.", "error");
                const fallbackBoss: CardData = { id:'default_boss_fallback', name: 'The Nameless Dread', type: 'Event', subType: 'human', health: 25, goldValue: 50, effect: {type:'damage', amount: 15}, description: "A shadowy figure of legend, spoken of only in hushed whispers. It is said this entity feeds on despair, its presence chilling the very air and twisting familiar trails into nightmarish labyrinths. Every victory against its lesser minions only seems to draw its baleful attention closer." };
                return { finalAiBoss: fallbackBoss, introData: { title: "A Shadow on the Trail", paragraph: "The whispers fall silent. A familiar, nameless dread emerges." } };
            }
        })();

        const { finalAiBoss, introData } = await storyPromise;

        setGameState(prev => !prev ? null : { ...prev, status: 'showing_boss_intro', aiBoss: finalAiBoss, bossIntroTitle: introData?.title, bossIntroParagraph: introData?.paragraph, isLoadingBossIntro: false });
        
        remixGenerationPromise.current = (async () => {
            const ngPlusLevel = gameStateRef.current!.ngPlusLevel;
            if (ngPlusLevel > 0 && ngPlusLevel < 10) {
                const remixedKey = `remixedCardPool_theme_western_WWS`;
                let remixedCards = JSON.parse(localStorage.getItem(remixedKey) || '{}');
                if (Object.keys(remixedCards).length > 0) {
                    updateCurrentCardsData({ ...CURRENT_CARDS_DATA, ...remixedCards });
                }
            }
            const objectiveRewardsConfig: { storageKey: string; itemType: 'themed hat' | 'themed provision' | 'themed fur coat' | 'themed weapon' | 'themed firearm' | 'themed bow' | 'themed bladed weapon' | 'themed trap' }[] = [
                { storageKey: 'objectiveReward_swift_justice_WWS', itemType: 'themed hat' },
                { storageKey: 'objectiveReward_the_purist_WWS', itemType: 'themed provision' },
                { storageKey: 'objectiveReward_a_beasts_end_WWS', itemType: 'themed fur coat' },
                { storageKey: 'objectiveReward_mans_inhumanity_WWS', itemType: 'themed weapon' },
                { storageKey: 'objectiveReward_the_marksman_WWS', itemType: 'themed firearm' },
                { storageKey: 'objectiveReward_the_stalker_WWS', itemType: 'themed bow' },
                { storageKey: 'objectiveReward_cut_throat_WWS', itemType: 'themed bladed weapon' },
                { storageKey: 'objectiveReward_master_trapper_WWS', itemType: 'themed trap' },
            ];
            const rewardPromises = objectiveRewardsConfig.filter(({ storageKey }) => localStorage.getItem(storageKey) === 'true').map(({ storageKey, itemType }) => {
                localStorage.removeItem(storageKey);
                return generateRemixedWeapon(itemType, ngPlusLevel, _log);
            });
            const rewardCards = (await Promise.all(rewardPromises)).filter(Boolean) as CardData[];
            if (rewardCards.length > 0) {
                localStorage.setItem('wildWestPendingRewardCards_WWS', JSON.stringify(rewardCards));
                _log(`Generated ${rewardCards.length} reward card for this run.`, 'system');
            }
        })();

    } finally {
        isActionInProgress.current = false;
    }
  }, [_log]);

  const proceedToGamePlay = useCallback(async () => {
    if (remixGenerationPromise.current) {
        setGameState(prev => prev ? { ...prev, isLoadingNGPlus: true } : null);
        await remixGenerationPromise.current;
        setGameState(prev => prev ? { ...prev, isLoadingNGPlus: false } : null);
    }

    _log("Proceeding to gameplay...", "system");
    
    let currentState = gameStateRef.current;
    if (!currentState || !currentState.playerDetails[PLAYER_ID]?.character) return;

    if (!currentState.initialCardPool || currentState.initialCardPool.length === 0) {
      _log("Older save detected. Regenerating card pool for current theme...", "system");
      
      const level = currentState.ngPlusLevel;
      const themeName = getThemeName(level);
      let finalRemixedCards: { [id: string]: CardData } = {};

      if (level > 0 && level < 10) {
          const remixedPoolKey = 'remixedCardPool_theme_western_WWS';
          finalRemixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
      } else if (level >= 10) {
          const remixedPoolKey = `remixedCardPool_theme_${themeName}_WWS`;
          finalRemixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
      }
      
      const finalCardsData = { ...ALL_CARDS_DATA_MAP, ...finalRemixedCards };
      updateCurrentCardsData(finalCardsData);
      
      const updatedState = { ...currentState, initialCardPool: getThemedCardPool(level, finalCardsData) };
      setGameState(updatedState);
      currentState = updatedState; 
    }

    const pendingRewardsString = localStorage.getItem('wildWestPendingRewardCards_WWS');
    localStorage.removeItem('wildWestPendingRewardCards_WWS'); 
    const rewardCards: CardData[] = pendingRewardsString ? JSON.parse(pendingRewardsString) : [];

    const playerDetailsFromSetup = currentState.playerDetails[PLAYER_ID];
    const playerChar = playerDetailsFromSetup.character as Character;
    let gameUpdates: Partial<GameState> = {};
    
    // --- DECK CONSTRUCTION ---
    let finalPlayerDeck: CardData[] = [...playerDetailsFromSetup.playerDeck];
    
    const isContinuingRun = !!currentState.runStartState;

    if (isContinuingRun) {
        _log(`Continuing run from retry state. Using existing deck of ${finalPlayerDeck.length} cards.`, 'system');
    } else {
        _log(`Starting deck construction with ${finalPlayerDeck.length} carry-over and cheat cards.`, 'system');
    
        // 1. Add all cards from the character's starter deck.
        // This correctly handles duplicates like the Gunslinger's two Six Shooters.
        playerChar.starterDeck.forEach(id => {
            const cardData = CURRENT_CARDS_DATA[id];
            if (cardData) {
                finalPlayerDeck.push(cardData);
            }
        });
        _log(`Added ${playerChar.starterDeck.length} cards from ${playerChar.name}'s kit.`, 'system');
    
        const currentDeckIds = new Set(finalPlayerDeck.map(c => c.id));
    
        // For the augment logic below, we still need to know which cards are unique starters across all characters
        const allStarterCardIdsAcrossCharacters = Object.values(CHARACTERS_DATA_MAP).flatMap(c => c.starterDeck);
        const cardCounts = allStarterCardIdsAcrossCharacters.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const uniqueCharacterStarterCardIds = new Set(Object.keys(cardCounts).filter(id => cardCounts[id] === 1));

        // 2. Add 3 level pool cards if deck is not full
        if (finalPlayerDeck.length < PLAYER_DECK_TARGET_SIZE) {
            const cardsToAugmentCount = 3;
            const augmentPool = currentState.initialCardPool.filter(c => 
                !currentDeckIds.has(c.id) &&
                !uniqueCharacterStarterCardIds.has(c.id) &&
                c.subType !== 'objective' &&
                (c.type === 'Item' || c.type === 'Provision' || c.type === 'Action' || c.type === 'Player Upgrade') &&
                !c.id.startsWith('item_gold_nugget') && !c.id.startsWith('item_jewelry') &&
                c.buyCost && c.buyCost < 50
            );
    
            const pickedForAugment = pickRandomDistinctFromPool(augmentPool, () => true, cardsToAugmentCount);
            
            if (pickedForAugment.picked.length > 0) {
                const spaceAvailable = PLAYER_DECK_TARGET_SIZE - finalPlayerDeck.length;
                const cardsToAdd = pickedForAugment.picked.slice(0, spaceAvailable);
                finalPlayerDeck.push(...cardsToAdd);
                _log(`Added ${cardsToAdd.length} random cards from the theme pool.`, 'system');
            }
        }
    
        // 3. Top off with Dried Meat to 13
        if (finalPlayerDeck.length < PLAYER_DECK_TARGET_SIZE) {
            const driedMeatCard = CURRENT_CARDS_DATA['provision_dried_meat'];
            if (driedMeatCard) {
                const numToAdd = PLAYER_DECK_TARGET_SIZE - finalPlayerDeck.length;
                for (let i = 0; i < numToAdd; i++) {
                    finalPlayerDeck.push(driedMeatCard);
                }
                _log(`Topped off deck with ${numToAdd} Dried Meat to reach ${PLAYER_DECK_TARGET_SIZE} cards.`, 'system');
            }
        }
    
        // 4. Trim if over 13
        if (finalPlayerDeck.length > PLAYER_DECK_TARGET_SIZE) {
            _log(`Deck size (${finalPlayerDeck.length}) exceeds target of ${PLAYER_DECK_TARGET_SIZE}. Trimming excess cards.`, 'debug');
            finalPlayerDeck = finalPlayerDeck.slice(0, PLAYER_DECK_TARGET_SIZE);
        }
    }
    
    // --- WORLD DECK CONSTRUCTION (using the remaining pool) ---
    const finalPlayerCardIdsForWorldFilter = new Set(finalPlayerDeck.map(card => card.id));
    [
        ...playerDetailsFromSetup.equippedItems,
        ...Object.values(playerDetailsFromSetup.satchels).flat(),
    ].filter((c): c is CardData => Boolean(c)).map(c => c.id).forEach(id => finalPlayerCardIdsForWorldFilter.add(id));

    // Calculate which starter cards are unique to a single character.
    const allStarterCardIdsAcrossCharacters = Object.values(CHARACTERS_DATA_MAP).flatMap(c => c.starterDeck);
    const cardCounts = allStarterCardIdsAcrossCharacters.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const uniqueCharacterStarterCardIds = new Set(Object.keys(cardCounts).filter(id => cardCounts[id] === 1));

    // Filter the general card pool to remove player's cards AND unique character-specific cards.
    let worldCardPool = currentState.initialCardPool.filter(c => 
        !finalPlayerCardIdsForWorldFilter.has(c.id) && 
        !uniqueCharacterStarterCardIds.has(c.id) &&
        c.subType !== 'objective'
    );
    _log(`Initial world pool created with ${worldCardPool.length} cards after removing player and unique character-specific cards.`, 'system');

    
    if (localStorage.getItem('objectiveReward_well_prepared_WWS') === 'true') {
        const steakCard = CURRENT_CARDS_DATA['provision_steak'];
        if (steakCard) {
            finalPlayerDeck = finalPlayerDeck.filter(card => card.id !== 'provision_dried_meat');
            for (let i = 0; i < 5; i++) finalPlayerDeck.push(steakCard);
            _log(`'Well-Prepared' reward: Replaced Dried Meat with 5 Steak.`, 'system');
        }
        localStorage.removeItem('objectiveReward_well_prepared_WWS');
    }
    
    if (currentState.remixDeckOnStart) {
        _log("AI is remixing the full starting deck...", "system");
        setGameState(current => ({ ...current!, isLoadingNGPlus: true, remixProgress: 0 }));

        const uniqueCardsInDeck = [...new Map(finalPlayerDeck.map(card => [card.id, card])).values()];
        const cardsToRemix: CardData[] = uniqueCardsInDeck.filter(card => !card.isCheat);

        try {
            const remixedCardsMap = new Map<string, CardData>();
            const newCardDataForUpdate: { [id: string]: CardData } = {};
            
            for (let i = 0; i < cardsToRemix.length; i++) {
                const card = cardsToRemix[i];
                const remixedResult = await remixCardsForNGPlusGame(_log, { [card.id]: card }, currentState.ngPlusLevel);
                if (remixedResult && Object.keys(remixedResult).length > 0) {
                    const newCard = Object.values(remixedResult)[0];
                    remixedCardsMap.set(card.id, newCard);
                    newCardDataForUpdate[newCard.id] = newCard;
                }
                const progress = ((i + 1) / cardsToRemix.length) * 100;
                setGameState(current => ({ ...current!, remixProgress: progress }));
            }

            if (remixedCardsMap.size > 0) {
                updateCurrentCardsData({ ...CURRENT_CARDS_DATA, ...newCardDataForUpdate });
                finalPlayerDeck = finalPlayerDeck.map(card => remixedCardsMap.get(card.id) || card);
                _log("AI deck remix successful!", "system");
            } else {
                _log("AI deck remix returned no cards. Using original deck.", "error");
            }
        } catch (e) {
            _log(`AI deck remix failed: ${e instanceof Error ? e.message : String(e)}. Using original deck.`, "error");
        }
    }
    
    const allObjectiveCards = Object.values(ALL_CARDS_DATA_MAP).filter(c => c.subType === 'objective');
    const objectiveChoices = shuffleArray(allObjectiveCards).slice(0, 3);
    _log(`Offering objective choices: ${objectiveChoices.map(c => c.name).join(', ')}`, 'system');
    gameUpdates.objectiveChoices = objectiveChoices;
    gameUpdates.activeObjectives = [];

    // --- Build Store Deck ---
    const storeCardFilter = (c: CardData) => 
        (c.type === 'Item' || c.type === 'Provision' || c.type === 'Action' || c.type === 'Player Upgrade') &&
        !c.id.startsWith('item_gold_nugget') && !c.id.startsWith('item_jewelry');

    let storeItemsResult = pickRandomDistinctFromPool(worldCardPool, storeCardFilter, STORE_DECK_TARGET_SIZE);
    let storeItemDeck = shuffleArray(storeItemsResult.picked);
    worldCardPool = storeItemsResult.remainingPool; // Update world pool to what's left
    _log(`Store deck built with ${storeItemDeck.length} cards. ${worldCardPool.length} cards remain for event deck.`, 'system');

    const storeDisplayItems = storeItemDeck.splice(0, STORE_DISPLAY_LIMIT).map(card => getScaledCard(card, currentState.ngPlusLevel));
    gameUpdates.storeItemDeck = storeItemDeck;
    gameUpdates.storeDisplayItems = storeDisplayItems;

    // --- Build Event Deck ---
    const finalEventDeck = buildEventDeck(worldCardPool, currentState.ngPlusLevel);
    gameUpdates.eventDeck = finalEventDeck;
    _log(`Event deck built with ${finalEventDeck.length} cards.`, 'system');

    
    finalPlayerDeck = shuffleArray(finalPlayerDeck);
    const initialHand: (CardData | null)[] = new Array(HAND_LIMIT).fill(null);
    for (let i = 0; i < HAND_LIMIT; i++) {
        if (finalPlayerDeck.length > 0) {
            const cardToDraw = finalPlayerDeck.shift();
            if(cardToDraw) {
                initialHand[i] = getScaledCard(cardToDraw, currentState.ngPlusLevel);
            }
        }
    }
    const actualInitialHandCards = initialHand.filter(Boolean) as CardData[];
    actualInitialHandCards.sort((a, b) => getCardCategory(a) - getCardCategory(b) || (a.name && b.name ? a.name.localeCompare(b.name) : 0));
    const sortedInitialHand: (CardData | null)[] = new Array(HAND_LIMIT).fill(null);
    actualInitialHandCards.forEach((card, idx) => sortedInitialHand[idx] = card);
    
    const finalPlayerDiscard = [...playerDetailsFromSetup.playerDiscard];

    const cheat = POP_CULTURE_CHEATS.find(c => c.name.toLowerCase() === playerDetailsFromSetup.name?.toLowerCase() && c.requiredCharacterId === playerChar.id);
    if (cheat && cheat.effects.addCustomCards) {
        
        const allPlayerCards = [
            ...playerDetailsFromSetup.equippedItems,
            ...Object.values(playerDetailsFromSetup.satchels).flat(),
            ...finalPlayerDeck,
            ...actualInitialHandCards,
            ...(playerDetailsFromSetup.playerDiscard || [])
        ];
        const allPlayerCardIds = new Set(allPlayerCards.map(c => c.id));
    
        _log(`Checking for cheat cards for '${cheat.name}'. Player possesses ${allPlayerCardIds.size} unique card IDs.`, 'debug');
    
        const newCardsToAdd = cheat.effects.addCustomCards.filter(customCard => {
            const alreadyHasCard = allPlayerCardIds.has(customCard.id);
            if (alreadyHasCard) {
                _log(`Skipping addition of duplicate cheat card: ${customCard.name} (${customCard.id})`, 'debug');
            }
            return !alreadyHasCard;
        });
    
        if (newCardsToAdd.length > 0) {
            _log(`A legend's gear manifests: ${newCardsToAdd.map(c => c.name).join(', ')}.`, 'system');
            const newCardsMap = { ...CURRENT_CARDS_DATA };
            newCardsToAdd.forEach(card => {
                newCardsMap[card.id] = card;
            });
            updateCurrentCardsData(newCardsMap);
            finalPlayerDiscard.push(...newCardsToAdd);
        } else {
            _log(`All legendary gear for '${cheat.name}' is already present.`, 'debug');
        }
    }

    if (rewardCards.length > 0) {
        const allPlayerCardsBeforeRewards = [
            ...playerDetailsFromSetup.equippedItems,
            ...Object.values(playerDetailsFromSetup.satchels).flat(),
            ...finalPlayerDeck,
            ...actualInitialHandCards,
            ...(playerDetailsFromSetup.playerDiscard || []),
            ...finalPlayerDiscard
        ];
        const allPlayerCardIdsBeforeRewards = new Set(allPlayerCardsBeforeRewards.map(c => c.id));

        const newRewardCardsToAdd = rewardCards.filter(rewardCard => !allPlayerCardIdsBeforeRewards.has(rewardCard.id));

        if (newRewardCardsToAdd.length > 0) {
            newRewardCardsToAdd.forEach(itemCard => {
                _log(`Reward delivered: ${itemCard.name}. Added to discard.`, 'system');
                updateCurrentCardsData({ ...CURRENT_CARDS_DATA, [itemCard.id]: itemCard });
            });
            finalPlayerDiscard.push(...newRewardCardsToAdd);
        }
    }
    
    const satchelsWithIds: { [key: number]: (string | CardData)[] } = {};
    for (const key in playerDetailsFromSetup.satchels) {
      satchelsWithIds[key] = (playerDetailsFromSetup.satchels[key] || []).map(c => isCustomOrModifiedCardForRunStart(c) ? c : c.id);
    }
    const runStartState = {
        deck: [...finalPlayerDeck, ...actualInitialHandCards].map(c => isCustomOrModifiedCardForRunStart(c) ? c : c.id),
        discard: finalPlayerDiscard.map(c => isCustomOrModifiedCardForRunStart(c) ? c : c.id),
        equipped: playerDetailsFromSetup.equippedItems.map(c => isCustomOrModifiedCardForRunStart(c) ? c : c.id),
        satchels: satchelsWithIds,
        gold: playerDetailsFromSetup.gold,
        maxHealth: playerDetailsFromSetup.maxHealth,
        health: playerDetailsFromSetup.health,
        characterId: playerChar.id,
        personality: playerDetailsFromSetup.personality,
        stepsTaken: playerDetailsFromSetup.stepsTaken,
        cumulativeNGPlusMaxHealthBonus: playerDetailsFromSetup.cumulativeNGPlusMaxHealthBonus,
    };
    gameUpdates.runStartState = runStartState;
    _log("Saved run start state.", "debug");
    
    const cleanPlayerForStart: PlayerDetails = {
        ...playerDetailsFromSetup,
        currentIllnesses: [],
        mountainSicknessActive: false,
        mountainSicknessTurnsRemaining: 0,
        playerDeck: finalPlayerDeck,
        hand: sortedInitialHand,
        playerDiscard: finalPlayerDiscard,
        characterBaseMaxHealthForRun: playerChar.health + playerDetailsFromSetup.cumulativeNGPlusMaxHealthBonus,
        isUnsortedDraw: false,
    };
    const theme = getThemeName(currentState.ngPlusLevel);
    _log(getRandomLogVariation('playerDeckFinalized', { currentHP: cleanPlayerForStart.health, maxHP: cleanPlayerForStart.maxHealth }, theme, cleanPlayerForStart));

    const fullInitialState: GameState = {
        ...currentState, status: 'playing_initial_reveal', ...gameUpdates,
        playerDeckAugmentationPool: [],
        playerDetails: { ...currentState.playerDetails, [PLAYER_ID]: cleanPlayerForStart },
        turn: 1,
        isLoadingNGPlus: false,
        remixDeckOnStart: false,
    };

    // --- AUTOSAVE ON START ---
    const autosaveSlotIndex = 3; // The dedicated autosave slot (0-indexed)
    fullInitialState.autosaveSlotIndex = autosaveSlotIndex;
    saveGameToSlot(fullInitialState, autosaveSlotIndex);
    _log(`Game autosaved to Autosave Slot.`, 'system');
    // --- END AUTOSAVE ON START ---
    
    setGameState(fullInitialState);
  }, [_log, registerCustomCardDefinitions]);

   useEffect(() => {
    if (gameState?.status === 'playing_initial_reveal') {
        setGameState(prev => {
            if (!prev) return null;
            
            // This just transitions to the 'playing' state on turn 1
            // without drawing an event card, allowing for objective selection.
            return {
                ...prev,
                status: 'playing',
                activeEvent: null,
                activeEventTurnCounter: 0,
                blockTradeDueToHostileEvent: false,
                pendingPlayerDamageAnimation: null
            };
        });
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [gameState?.status]);

  const handlePostGame = useCallback(() => {
    ttsManager.cancel();
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;

    // Clear autosave on victory
    if (currentGameState.autosaveSlotIndex === 3) {
        deleteGameInSlot(3);
        _log(`Autosave in Autosave Slot cleared after victory.`, 'system');
    }
    
    if (currentGameState.playerDetails[PLAYER_ID].health > 0) {
        setGameState(prev => !prev ? null : { ...prev, status: 'deck_review', modals: { ...prev.modals, story: { ...prev.modals.story, isOpen: false } } });
    } else {
        resetGame({ ngPlusOverride: currentGameState.ngPlusLevel });
        closeModal('story');
    }
  }, [resetGame, closeModal, _log]);

  const confirmDeckSelection = useCallback(async (selectedIndicesArray: number[]) => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState || !currentGameState.deckForReview) return;

    setGameState(prev => prev ? { ...prev, isLoadingNGPlus: true, status: 'setup' } : null);

    if (nextLevelRemixPromise.current) {
        _log("Waiting for background AI card remixing to complete...", "system");
        await nextLevelRemixPromise.current;
        nextLevelRemixPromise.current = null; 
    }
    _log("AI remixing complete. Preparing next level.", "system");

    const selectedIndices = new Set(selectedIndicesArray);
    const selectedCards = currentGameState.deckForReview.filter((_, index) => selectedIndices.has(index));
    const unselectedCards = currentGameState.deckForReview.filter((_, index) => !selectedIndices.has(index));
    const goldFromSales = unselectedCards.reduce((total, card) => total + (card.sellValue || 0), 0);
    const currentGold = parseInt(localStorage.getItem('ngPlusPlayerGold_WWS') || '0');
    localStorage.setItem('ngPlusPlayerGold_WWS', (currentGold + goldFromSales).toString());
    _log(`Carrying over ${selectedCards.length} cards. Sold ${unselectedCards.length} for ${goldFromSales}G.`, 'system');
    
    await resetGame({ ngPlusOverride: currentGameState.ngPlusLevel + 1, carryOverDeck: selectedCards });
  }, [resetGame, _log]);
  
  const fullResetGame = useCallback((options?: { saveSlotIndex?: number }) => {
    ttsManager.cancel();
    const currentState = gameStateRef.current;
    if (currentState && currentState.autosaveSlotIndex === 3) {
        deleteGameInSlot(3);
        _log(`Autosave in Autosave Slot cleared for new game.`, 'system');
    }
    resetGame({ hardReset: true, ...options });
  }, [resetGame, _log]);
  const deselectAllCards = useCallback(() => setGameState(prev => !prev || !prev.selectedCard ? prev : { ...prev, selectedCard: null }), []);
  const setSelectedCard = useCallback((details: { card: CardData; source: string; index: number } | null) => setGameState(prev => !prev ? null : { ...prev, selectedCard: details }), []);
  
  const setPersonality = useCallback((traits: { archetype?: string; temperament?: string; motivation?: string; }) => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState || currentGameState.status !== 'setup') return;

    const playerDetails = currentGameState.playerDetails[PLAYER_ID];
    const updatedPersonality = { ...playerDetails.personality, ...traits };

    const storedDetailsString = localStorage.getItem('wildWestPlayerDetailsForNGPlus_WWS');
    const storedDetails = storedDetailsString ? JSON.parse(storedDetailsString) : {};
    localStorage.setItem('wildWestPlayerDetailsForNGPlus_WWS', JSON.stringify({
        ...storedDetails,
        characterId: playerDetails.character?.id,
        personality: updatedPersonality
    }));

    setGameState(prev => {
      if (!prev || prev.status !== 'setup') return prev;
      const currentPlayerDetails = prev.playerDetails[PLAYER_ID];
      const newPersonality = { ...currentPlayerDetails.personality, ...traits };

      // --- Recalculate skill failure chances ---
      let newTalkSkill = currentPlayerDetails.talkSkill;
      let newPetSkill = currentPlayerDetails.petSkill;
      if (currentPlayerDetails.character) {
          const freshCharacterData = CHARACTERS_DATA_MAP[currentPlayerDetails.character.id];
          if (freshCharacterData) {
              const skills = calculateSkills(freshCharacterData, newPersonality);
              newTalkSkill = skills.talkSkill;
              newPetSkill = skills.petSkill;
          }
      }
      
      const newPlayerDetails = { 
          ...currentPlayerDetails, 
          personality: newPersonality,
          talkSkill: newTalkSkill,
          petSkill: newPetSkill,
      };

      return {
        ...prev,
        playerDetails: {
          ...prev.playerDetails,
          [PLAYER_ID]: newPlayerDetails
        }
      };
    });
  }, []);

  const { togglePedometer, cleanup: cleanupPedometer } = useMemo(() => createPedometerManager({
    setGameState,
    _log,
    applyHealToPlayer,
    triggerGoldFlash,
    gameStateRef,
    pedometerWatchIdRef
  }), [_log, applyHealToPlayer, triggerGoldFlash]);
  
  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      cleanupPedometer();
    };
  }, [cleanupPedometer]);

  const enablePedometerFeature = useCallback(() => {
    _log("Pedometer enabled by user.", "system");
    localStorage.setItem('pedometerFeatureEnabled_WWS', 'true');
    setGameState(prev => !prev ? null : { ...prev, pedometerFeatureEnabledByUser: true });
  }, [_log]);

  const handleNGPlusReward = useCallback((choice: 'health' | 'gold') => {
    const ngLevel = parseInt(localStorage.getItem('ngPlusLevel_WWS') || '0', 10);
    if (choice === 'health') {
        const bonus = parseInt(localStorage.getItem('ngPlusCumulativeMaxHealthBonus_WWS') || '0', 10);
        localStorage.setItem('ngPlusCumulativeMaxHealthBonus_WWS', (bonus + 1).toString());
        _log(`NG+${ngLevel} reward: +1 Max Health.`, 'system');
    } else {
        const gold = parseInt(localStorage.getItem('ngPlusPlayerGold_WWS') || '0', 10);
        localStorage.setItem('ngPlusPlayerGold_WWS', (gold + 100).toString());
        _log(`NG+${ngLevel} reward: +100 Gold.`, 'system');
    }
    localStorage.setItem('ngPlusRewardChosen_WWS', 'true');
    setGameState(prev => {
        if (!prev) return null;
        const cumulativeBonus = parseInt(localStorage.getItem('ngPlusCumulativeMaxHealthBonus_WWS') || '0', 10);
        return {
            ...prev, showNGPlusRewardModal: false,
            modals: { ...prev.modals, ngPlusReward: { ...prev.modals.ngPlusReward, isOpen: false }},
            playerDetails: { ...prev.playerDetails, [PLAYER_ID]: { ...prev.playerDetails[PLAYER_ID], cumulativeNGPlusMaxHealthBonus: cumulativeBonus } }
        };
    });
  }, [_log]);

  const handleCheatIncreaseDifficulty = useCallback(() => {
    setGameState(prev => {
        if (!prev || prev.status !== 'setup') return prev;
        const currentBonus = prev.eventDifficultyBonus || 0;
        const newBonus = currentBonus + 1;
        _log(`Cheat Activated: True Grit! Event difficulty bonus is now ${newBonus}.`, 'system');
        soundManager.playSound('gold');
        return { 
            ...prev, 
            eventDifficultyBonus: newBonus,
            modals: {
                ...prev.modals,
                message: {
                    isOpen: true,
                    title: 'Cheat Activated',
                    text: `True Grit! Event difficulty bonus increased to ${newBonus}. Enemies will be tougher and worth more gold.`
                }
            }
        };
    });
  }, [_log]);

  const handleCheatAddMaxHealth = useCallback(() => {
    setGameState(prev => {
        if (!prev || prev.status !== 'setup') return prev;
        
        const player = prev.playerDetails[PLAYER_ID];
        
        const newCumulativeBonus = (player.cumulativeNGPlusMaxHealthBonus || 0) + 1;

        const updatedPlayer = {
            ...player,
            health: player.character ? player.health + 1 : player.health,
            maxHealth: player.character ? player.maxHealth + 1 : player.maxHealth,
            characterBaseMaxHealthForRun: player.character ? player.characterBaseMaxHealthForRun + 1 : player.characterBaseMaxHealthForRun,
            cumulativeNGPlusMaxHealthBonus: newCumulativeBonus
        };
        
        _log(`Cheat Activated: Gained +1 Max Health!`, 'system');
        soundManager.playSound('heal');

        return {
            ...prev,
            playerDetails: { ...prev.playerDetails, [PLAYER_ID]: updatedPlayer },
            modals: {
                ...prev.modals,
                message: {
                    isOpen: true,
                    title: 'Cheat Activated',
                    text: `Tough as nails! Max health increased by 1.`
                }
            }
        };
    });
  }, [_log]);

  const handleCheatRemixDeck = useCallback(() => {
    setGameState(prev => {
        if (!prev || prev.status !== 'setup') return prev;
        _log(`Cheat Activated: The deck will be remixed by the AI on game start.`, 'system');
        soundManager.playSound('gold');
        return { 
            ...prev, 
            remixDeckOnStart: true,
            modals: {
                ...prev.modals,
                message: {
                    isOpen: true,
                    title: 'Cheat Activated',
                    text: `Deck Remix Enabled! The AI will generate a unique starting deck for you when you start the game.`
                }
            }
        };
    });
  }, [_log]);

  const saveGame = useCallback((slotIndex: number) => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;
    const success = saveGameToSlot(currentGameState, slotIndex);
    if (success) {
      _log(`Game saved to slot ${slotIndex + 1}.`, 'system');
      setGameState(prev => prev ? { ...prev, saveSlotIndex: slotIndex } : null);
    } else {
      _log(`Failed to save game to slot ${slotIndex + 1}.`, 'error');
    }
  }, [_log]);

  const loadGame = useCallback((slotIndex: number) => {
    const currentState = gameStateRef.current;
    if (currentState && currentState.autosaveSlotIndex !== null && currentState.autosaveSlotIndex !== undefined) {
        deleteGameInSlot(currentState.autosaveSlotIndex);
        _log(`Autosave in ${currentState.autosaveSlotIndex === 3 ? 'Autosave Slot' : `Slot ${currentState.autosaveSlotIndex + 1}`} cleared before loading new game.`, 'system');
    }

    const saves = getSaveGames();
    let savedState = saves[slotIndex];
    if (savedState) {
        _log(`Loading game from slot ${slotIndex + 1}...`, "system");

        const isFullSave = savedState.hasOwnProperty('turn');

        const ngPlusLevel = savedState.ngPlusLevel || 0;
        const initialPlayerState = { ...INITIAL_PLAYER_STATE_TEMPLATE, runStats: { ...INITIAL_RUN_STATS, highestNGPlusLevel: ngPlusLevel }, ngPlusLevel };
         const baseInitialState: GameState = {
            runId: crypto.randomUUID(),
            status: 'setup',
            playerDetails: { [PLAYER_ID]: initialPlayerState },
            eventDeck: [],
            eventDiscardPile: [],
            activeEvent: null,
            activeObjectives: [],
            storeItemDeck: [],
            storeDisplayItems: [],
            storeItemDiscardPile: [],
            turn: 0,
            storyGenerated: false,
            log: [],
            selectedCard: null,
            ngPlusLevel: ngPlusLevel,
            modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
            activeGameBanner: initialGameBannerState,
            bannerQueue: [],
            blockTradeDueToHostileEvent: false,
            playerDeckAugmentationPool: [],
            initialCardPool: [],
            activeEventTurnCounter: 0,
            scrollAnimationPhase: 'none',
            isLoadingStory: false,
            pedometerFeatureEnabledByUser: localStorage.getItem('pedometerFeatureEnabled_WWS') === 'true',
            showObjectiveSummaryModal: false,
            objectiveSummary: undefined,
            gameJustStarted: true,
            newlyDrawnCardIndices: undefined,
            equipAnimationIndex: null,
            eventDifficultyBonus: 0,
            saveSlotIndex: slotIndex,
            autosaveSlotIndex: null,
            triggerThreatShake: false,
            playerShake: false,
            remixDeckOnStart: false,
            isBossFightActive: false,
            triggerStoreRestockAnimation: false,
            objectiveChoices: [],
            selectedObjectiveIndices: [],
            runStartGold: savedState.runStartGold ?? savedState.playerDetails?.[PLAYER_ID]?.gold ?? 0,
        };
        
        const stateWithDefaults = deepMerge({ ...baseInitialState }, savedState);
        let finalState = rehydrateAndMigrateState(stateWithDefaults, _log);

        const playerOnLoad = finalState.playerDetails[PLAYER_ID];
        if (playerOnLoad && playerOnLoad.character && playerOnLoad.character.id) {
            const freshCharacterData = CHARACTERS_DATA_MAP[playerOnLoad.character.id];
            if (freshCharacterData) {
                const updatedCharacter = {
                    ...freshCharacterData,
                    gold: playerOnLoad.character.gold,
                    health: playerOnLoad.character.health,
                };
                playerOnLoad.character = updatedCharacter;
            }
        
            if (playerOnLoad.personality) {
                const { talkSkill, petSkill } = calculateSkills(playerOnLoad.character, playerOnLoad.personality);
                playerOnLoad.talkSkill = talkSkill;
                playerOnLoad.petSkill = petSkill;
                _log(`Character data synced and skills recalculated for loaded game.`, 'system');
            }
        }

        finalState = rebuildEventDeckIfNeeded(finalState, _log);
        
        if ((!finalState.activeObjectives || finalState.activeObjectives.length === 0) && (finalState.status === 'playing' || finalState.status === 'playing_initial_reveal')) {
            _log("No active objective found in auto-save. Generating new objective choices for this run.", 'system');
            const allObjectiveCards = Object.values(ALL_CARDS_DATA_MAP).filter(c => c.subType === 'objective');
            if (allObjectiveCards.length > 0) {
                finalState.objectiveChoices = shuffleArray(allObjectiveCards).slice(0, 3);
                 _log(`Offering new objective choices: ${finalState.objectiveChoices.map(c => c.name).join(', ')}`, 'system');
            } else {
                _log("Could not generate a new objective: no objective cards found in card data.", 'error');
            }
        }

        if (!isFullSave) {
            _log("Older character snapshot detected. Loading to setup screen.", "system");
            finalState.status = 'setup'; 
            finalState.gameJustStarted = true;
        } else {
            _log("Full game state save detected. Resuming session.", "system");
            if (finalState.status === 'playing' || finalState.turn > 0) {
                finalState.status = 'playing';
                finalState.gameJustStarted = false;
                finalState.autosaveSlotIndex = 3; // Force to new dedicated slot
                saveGameToSlot(finalState, 3); // Immediately create an autosave in the new slot
                _log(`Game loaded. Created new autosave in Autosave Slot.`, 'system');
            } else {
                finalState.status = 'setup';
                finalState.gameJustStarted = true;
            }
        }

        const loadedPlayer = finalState.playerDetails[PLAYER_ID];
        if (loadedPlayer && loadedPlayer.character) {
            localStorage.setItem('wildWestPlayerDetailsForNGPlus_WWS', JSON.stringify({
                name: loadedPlayer.name,
                characterId: loadedPlayer.character.id,
                personality: loadedPlayer.personality
            }));
        }

        setGameState({
            ...finalState,
            saveSlotIndex: slotIndex,
            modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
            activeGameBanner: initialGameBannerState,
            pendingPlayerDamageAnimation: null,
            scrollAnimationPhase: 'none',
            newlyDrawnCardIndices: undefined,
            equipAnimationIndex: null,
            isLoadingBossIntro: false,
            isLoadingStory: false,
            isLoadingNGPlus: false,
            showNGPlusRewardModal: false,
            selectedCard: null,
            triggerThreatShake: false,
        });

        _log(`Game loaded successfully from slot ${slotIndex + 1}.`, 'system');
    } else {
        _log(`No game found in slot ${slotIndex + 1}.`, 'error');
    }
  }, [_log]);


  const deleteGame = useCallback((slotIndex: number) => {
    const success = deleteGameInSlot(slotIndex);
    if (success) {
      _log(`Save game in slot ${slotIndex + 1} deleted.`, 'system');
    } else {
      _log(`Failed to delete save in slot ${slotIndex + 1}.`, 'error');
    }
  }, [_log]);

  const downloadGame = useCallback((slotIndex: number) => {
    const saves = getSaveGames();
    const gameStateToDownload = saves[slotIndex];
    if (gameStateToDownload) {
      try {
        const jsonString = JSON.stringify(gameStateToDownload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const playerName = gameStateToDownload.playerDetails[PLAYER_ID]?.name || 'Player';
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `WildLands_Save_Slot${slotIndex + 1}_${playerName}_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        _log(`Downloaded save from slot ${slotIndex + 1}.`, 'system');
      } catch (error) {
        _log(`Failed to download save from slot ${slotIndex + 1}.`, 'error');
        console.error("Error downloading save file:", error);
      }
    } else {
       _log(`No game data in slot ${slotIndex + 1} to download.`, 'error');
    }
  }, [_log]);

  const uploadAndLoadGame = useCallback((uploadedGameState: GameState, slotIndex: number) => {
    const stateToSave = {
      ...uploadedGameState,
      runId: uploadedGameState.runId || crypto.randomUUID(),
    };
    const success = saveGameToSlot(stateToSave, slotIndex);
    if (success) {
      _log(`Game state from file successfully saved to slot ${slotIndex + 1}.`, 'system');
      loadGame(slotIndex);
    } else {
      _log(`Failed to save uploaded game to slot ${slotIndex + 1}.`, 'error');
    }
  }, [_log, loadGame]);

  const startNextLevelRemix = useCallback((): Promise<void> => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return Promise.resolve();
    const nextLevel = currentGameState.ngPlusLevel + 1;
    _log(`Pregenerating assets for NG+${nextLevel}...`, "system");
    nextLevelRemixPromise.current = pregenerateNextLevelRemix(nextLevel);
    return nextLevelRemixPromise.current;
  }, [_log, pregenerateNextLevelRemix]);

  useEffect(() => {
    if (gameState === null) {
        const savedStateString = localStorage.getItem('wildWestGameState_WWS');
        if (savedStateString) {
            try {
                let savedState: any = JSON.parse(savedStateString);

                if (typeof savedState !== 'object' || savedState === null || !savedState.hasOwnProperty('status')) {
                    if (savedState.playerDetails) {
                    } else {
                        throw new Error("Saved state is not a valid game object.");
                    }
                }

                if (savedState.aiBoss && typeof savedState.aiBoss === 'object' && savedState.aiBoss.id) {
                    const player = savedState.playerDetails?.[PLAYER_ID];
                    const characterId = player?.character?.id;
                    
                    if (player && characterId && player.name && savedState.ngPlusLevel !== undefined) {
                        const cacheKey = getLevelCacheKey(savedState.ngPlusLevel, characterId, player.name);
                        const levelCacheString = localStorage.getItem(cacheKey);
                        if (levelCacheString) {
                            try {
                                const levelCache = JSON.parse(levelCacheString);
                                if (levelCache.aiBoss && typeof levelCache.aiBoss === 'object' && levelCache.aiBoss.id === savedState.aiBoss.id) {
                                    _log("Found AI boss definition in level cache. Merging into save state for rehydration.", "system");
                                    savedState.aiBoss = { ...levelCache.aiBoss, ...savedState.aiBoss };
                                }
                            } catch (e) {
                                _log(`Could not parse level cache for key ${cacheKey}. AI boss may not load correctly.`, 'error');
                                console.error("Failed to parse level cache:", e);
                            }
                        }
                    }
                }

                if (savedState.status === 'finished') {
                    _log("Stuck 'finished' state detected. Attempting to recover...", "system");
                    const player = savedState.playerDetails?.[PLAYER_ID];
                    if (player?.health > 0) {
                        const runStartState = savedState.runStartState;
                        localStorage.removeItem('wildWestGameState_WWS');
                        resetGame({ ngPlusOverride: savedState.ngPlusLevel + 1 });
                        setGameState(prev => {
                            if (!prev) return null;
                            const newRunStartState = prev.runStartState ? { ...prev.runStartState, ...runStartState } : runStartState;
                            return { ...prev, runStartState: newRunStartState };
                        });
                        return;
                    } else {
                        localStorage.removeItem('wildWestGameState_WWS');
                        resetGame({ ngPlusOverride: savedState.ngPlusLevel });
                        return;
                    }
                }

                _log("Loading saved game...", "system");

                const ngPlusLevel = savedState.ngPlusLevel || 0;
                const initialPlayerState = { ...INITIAL_PLAYER_STATE_TEMPLATE, runStats: { ...INITIAL_RUN_STATS, highestNGPlusLevel: ngPlusLevel }, ngPlusLevel, };
                 const baseInitialState: GameState = {
                    runId: crypto.randomUUID(),
                    status: 'setup',
                    playerDetails: { [PLAYER_ID]: initialPlayerState },
                    eventDeck: [],
                    eventDiscardPile: [],
                    activeEvent: null,
                    activeObjectives: [],
                    storeItemDeck: [],
                    storeDisplayItems: [],
                    storeItemDiscardPile: [],
                    turn: 0,
                    storyGenerated: false,
                    log: [],
                    selectedCard: null,
                    ngPlusLevel: ngPlusLevel,
                    modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
                    activeGameBanner: initialGameBannerState,
                    bannerQueue: [],
                    blockTradeDueToHostileEvent: false,
                    playerDeckAugmentationPool: [],
                    initialCardPool: [],
                    activeEventTurnCounter: 0,
                    scrollAnimationPhase: 'none',
                    isLoadingStory: false,
                    pedometerFeatureEnabledByUser: localStorage.getItem('pedometerFeatureEnabled_WWS') === 'true',
                    showObjectiveSummaryModal: false,
                    objectiveSummary: undefined,
                    gameJustStarted: true,
                    newlyDrawnCardIndices: undefined,
                    equipAnimationIndex: null,
                    eventDifficultyBonus: 0,
                    saveSlotIndex: undefined,
                    autosaveSlotIndex: null,
                    triggerThreatShake: false,
                    playerShake: false,
                    remixDeckOnStart: false,
                    isBossFightActive: false,
                    triggerStoreRestockAnimation: false,
                    objectiveChoices: [],
                    selectedObjectiveIndices: [],
                    runStartGold: savedState.runStartGold ?? savedState.playerDetails?.[PLAYER_ID]?.gold ?? 0,
                };
                
                const stateWithDefaults = deepMerge({ ...baseInitialState }, savedState);
                let finalState = rehydrateAndMigrateState(stateWithDefaults, _log);
                finalState = rebuildEventDeckIfNeeded(finalState, _log);
                
                const playerOnLoad = finalState.playerDetails[PLAYER_ID];
                if (playerOnLoad && playerOnLoad.character && playerOnLoad.character.id) {
                    const freshCharacterData = CHARACTERS_DATA_MAP[playerOnLoad.character.id];
                    if (freshCharacterData) {
                        const updatedCharacter = {
                            ...freshCharacterData,
                            gold: playerOnLoad.character.gold,
                            health: playerOnLoad.character.health,
                        };
                        playerOnLoad.character = updatedCharacter;
                    }
                
                    if (playerOnLoad.personality) {
                        const { talkSkill, petSkill } = calculateSkills(playerOnLoad.character, playerOnLoad.personality);
                        playerOnLoad.talkSkill = talkSkill;
                        playerOnLoad.petSkill = petSkill;
                        _log(`Character data synced and skills recalculated for loaded game.`, 'system');
                    }
                }
                
                if ((!finalState.activeObjectives || finalState.activeObjectives.length === 0) && (finalState.status === 'playing' || finalState.status === 'playing_initial_reveal')) {
                    _log("No active objective found in auto-save. Generating new objective choices for this run.", 'system');
                    const allObjectiveCards = Object.values(ALL_CARDS_DATA_MAP).filter(c => c.subType === 'objective');
                    if (allObjectiveCards.length > 0) {
                        finalState.objectiveChoices = shuffleArray(allObjectiveCards).slice(0, 3);
                         _log(`Offering new objective choices: ${finalState.objectiveChoices.map(c => c.name).join(', ')}`, 'system');
                    } else {
                        _log("Could not generate a new objective: no objective cards found in card data.", 'error');
                    }
                }
                
                const isSnapshot = !savedState.hasOwnProperty('turn');
                if (isSnapshot) {
                    _log("Snapshot detected in auto-save. Loading to setup screen.", "system");
                    finalState.status = 'setup';
                    finalState.gameJustStarted = true;
                } else {
                    _log("Full game state detected in auto-save. Resuming session.", "system");
                    if (finalState.status === 'playing' || finalState.turn > 0) {
                        finalState.status = 'playing';
                        finalState.gameJustStarted = false;
                    } else {
                        finalState.status = 'setup';
                        finalState.gameJustStarted = true;
                    }
                }

                setGameState({
                    ...finalState,
                    modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
                    activeGameBanner: initialGameBannerState,
                    pendingPlayerDamageAnimation: null,
                    scrollAnimationPhase: 'none',
                    newlyDrawnCardIndices: undefined,
                    equipAnimationIndex: null,
                    isLoadingBossIntro: false,
                    isLoadingStory: false,
                    isLoadingNGPlus: false,
                    showNGPlusRewardModal: false,
                    selectedCard: null,
                    triggerThreatShake: false,
                });
            } catch (error) {
                _log(`Error loading saved game: ${error instanceof Error ? error.message : String(error)}. Starting fresh.`, "error");
                resetGame({ hardReset: true });
            }
        } else {
            resetGame({ hardReset: true });
        }
    }
  }, [_log, resetGame]);

  return {
    gameState,
    enterGame,
    selectCharacter,
    confirmName,
    startGame,
    resetGame,
    fullResetGame,
    handleCardAction,
    handleRestockStore,
    endTurn,
    closeModal,
    setSelectedCard,
    deselectAllCards,
    endDayAnimation,
    proceedToGamePlay,
    togglePedometer,
    handleNGPlusReward,
    enablePedometerFeature,
    setPersonality,
    handlePostGame,
    confirmDeckSelection,
    proceedToFinishedState,
    handleCheatIncreaseDifficulty,
    handleCheatAddMaxHealth,
    startNextLevelRemix,
    handleCheatRemixDeck,
    saveGame,
    loadGame,
    deleteGame,
    downloadGame,
    uploadAndLoadGame,
    acknowledgeGameStart,
  };
};
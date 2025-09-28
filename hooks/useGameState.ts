import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, PlayerDetails, Character, CardData, LogEntry, CardEffect, CardContext, ModalState, ActiveGameBannerState, RunStats } from '../types.ts';
import {
    PLAYER_ID, MAX_LOG_ENTRIES, HAND_LIMIT, EQUIP_LIMIT, STORE_DISPLAY_LIMIT, EVENT_DECK_SIZE, PLAYER_DECK_TARGET_SIZE, STORE_DECK_TARGET_SIZE,
    CHARACTERS_DATA_MAP, INITIAL_PLAYER_STATE_TEMPLATE,
    ALL_CARDS_DATA_MAP, CURRENT_CARDS_DATA, resetCurrentCardsData, updateCurrentCardsData,
    MAX_INTERNAL_LOG_ENTRIES, MAX_DAYS_BEFORE_BOSS_FINDS_PLAYER,
    INITIAL_RUN_STATS,
    NG_PLUS_THEME_MILESTONE_INTERVAL,
    APEX_PREDATOR_IDS,
    PEST_IDS
} from '../constants.ts';
import { shuffleArray, calculateAttackPower, calculateHealAmount, isEventConsideredHostile, getCardCategory, pickRandomDistinctFromPool, createTrophyOrBountyCard, isFirearm, NON_HOSTILE_ON_REVEAL_IDS, getScaledCard, applyDifficultyBonus } from '../utils/cardUtils.ts';
import { getRandomLogVariation } from '../utils/logUtils.ts';
import { generateStoryForGame, generateAIBossForGame, remixCardsForNGPlusGame, generateBossIntroStory, generateRemixedWeapon } from '../services/geminiService.ts';
import { updateLifetimeStats } from '../utils/statsUtils.ts';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';
import { getThemedCardPool, getThemeSuffix, getThemeName, getThemeSuffixForMilestone } from '../utils/themeUtils.ts';
import { applyHealToPlayer as applyHealToPlayerUtil, applyDamageAndGetAnimation as applyDamageAndGetAnimationUtil, handleTrapInteractionWithEvent as handleTrapInteractionWithEventUtil, handleObjectiveCompletionChecks as handleObjectiveCompletionChecksUtil, applyImmediateEventAndCheckEndTurn as applyImmediateEventAndCheckEndTurnUtil } from '../utils/gameplayUtils.ts';
import { createPedometerManager } from '../gameLogic/pedometerManager.ts';
import * as actionHandlers from '../utils/actionHandlers.ts';
import { POP_CULTURE_CHEATS, PopCultureCheatEffect } from '../utils/cheatCodes.ts';
import { saveGameToSlot, getSaveGames, deleteGameInSlot } from '../utils/saveUtils.ts';


const initialModalState: ModalState = { isOpen: false, title: '', text: '' };
const initialGameBannerState: ActiveGameBannerState | null = null;
const MAX_PERSISTED_LOG_ENTRIES = 800;


const BANNER_DURATION = 4500;
const LAUDANUM_VISUAL_DURATION = 5000;
const SKUNK_SPRAY_VISUAL_DURATION = 5000;

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

// Helper for smooth, interruptible scrolling
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

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const isEndingTurn = useRef(false);
  const [activeAnimation, setActiveAnimation] = useState<{ type: string, target?: string, amount?: number} | null>(null);
  const [showEndTurnFade, setShowEndTurnFade] = useState(false);
  const [preGeneratedAiBoss, setPreGeneratedAiBoss] = useState<CardData | null>(null);
  const [isPreGeneratingBoss, setIsPreGeneratingBoss] = useState(false);
  const [pendingStoreRestock, setPendingStoreRestock] = useState<{ index: number } | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);
  const autoEndTurnTimerRef = useRef<number | null>(null);
  const lastAnimatedElementRef = useRef<{ element: HTMLElement, className: string } | null>(null);
  const pedometerWatchIdRef = useRef<number | null>(null);
  const isActionInProgress = useRef(false);
  const lastAttackPowerRef = useRef<number>(0);
  const remixGenerationPromise = useRef<Promise<any> | null>(null);
  const nextLevelRemixPromise = useRef<Promise<void> | null>(null);

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
        return { ...prev, status: 'setup' };
    });
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    let laudanumTimer: number | null = null;
    let skunkSprayTimer: number | null = null;

    if (gameState?.laudanumVisualActive) {
        laudanumTimer = window.setTimeout(() => {
            setGameState(prev => {
                if (prev?.laudanumVisualActive) {
                    return { ...prev, laudanumVisualActive: false };
                }
                return prev;
            });
        }, LAUDANUM_VISUAL_DURATION);
    }
    
    if (gameState?.skunkSprayVisualActive) {
        skunkSprayTimer = window.setTimeout(() => {
            setGameState(prev => {
                if (prev?.skunkSprayVisualActive) {
                    return { ...prev, skunkSprayVisualActive: false };
                }
                return prev;
            });
        }, SKUNK_SPRAY_VISUAL_DURATION);
    }

    return () => {
        if (laudanumTimer) clearTimeout(laudanumTimer);
        if (skunkSprayTimer) clearTimeout(skunkSprayTimer);
    };
  }, [gameState?.laudanumVisualActive, gameState?.skunkSprayVisualActive]);

  useEffect(() => {
    // Save game state on change, if in a playable state. We avoid saving 'finished' state
    // as it's a transitional state that can cause issues on reload.
    if (gameState && (gameState.status === 'playing' || gameState.status === 'playing_initial_reveal')) {
      try {
        const stateToSave = { ...gameState };
        
        // Remove transient UI properties
        stateToSave.selectedCard = null;
        stateToSave.modals = { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState };
        stateToSave.activeGameBanner = null;
        stateToSave.pendingPlayerDamageAnimation = null;
        stateToSave.scrollAnimationPhase = 'none';
        stateToSave.goldFlashPlayer = false;
        stateToSave.laudanumVisualActive = false;
        stateToSave.skunkSprayVisualActive = false;
        stateToSave.showLightningStrikeFlash = false;
        stateToSave.isLoadingBossIntro = false;
        stateToSave.isLoadingStory = false;
        stateToSave.isLoadingNGPlus = false;
        stateToSave.showNGPlusRewardModal = false;
        
        const gameStateJSON = JSON.stringify(stateToSave);
        localStorage.setItem('wildWestGameState_WWS', gameStateJSON);
      } catch (error) {
        console.error("Failed to save game state:", error);
        _log("Error saving game state.", "error");
      }
    }
  }, [gameState, _log]);

  const getBaseCardByIdentifier = useCallback((cardIdentifier: CardData): CardData => {
    if (!cardIdentifier) return cardIdentifier;
    const standardCard = ALL_CARDS_DATA_MAP[cardIdentifier.id];
    if (!standardCard) return CURRENT_CARDS_DATA[cardIdentifier.id] || cardIdentifier;

    // Check if passed card is a remixed version
    if (cardIdentifier.name !== standardCard.name || cardIdentifier.description !== standardCard.description) {
        const liveMapVersion = CURRENT_CARDS_DATA[cardIdentifier.id];
        if (liveMapVersion && (liveMapVersion.name !== standardCard.name || liveMapVersion.description !== standardCard.description)) {
            return liveMapVersion;
        }
        return cardIdentifier;
    }
    return standardCard;
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
  }, [_log, triggerGoldFlash]);
   
  const proceedToFinishedState = useCallback(() => {
    const currentState = gameStateRef.current;
    if (!currentState || currentState.status !== 'playing') return;

    const player = { ...currentState.playerDetails[PLAYER_ID] };
    const theme = getThemeName(currentState.ngPlusLevel);

    // Finalize stats for victory
    player.runStats.totalVictories = 1;
    if (player.character) {
        player.runStats.victoriesByCharacter[player.character.id] = (player.runStats.victoriesByCharacter[player.character.id] || 0) + 1;
    }
    if (player.health <= 5) player.runStats.closeCalls = 1;
    player.runStats.totalStepsTaken = player.stepsTaken;
    player.runStats.totalDaysSurvived = currentState.turn;
    player.runStats.mostGoldHeld = Math.max(player.runStats.mostGoldHeld || 0, player.gold);
    
    updateLifetimeStats(player.runStats);
    _log("Lifetime stats updated.", "system");

    _log("Victory confirmed. Proceeding to summary.", "system");
    
    const winReason = getRandomLogVariation('threatDefeated', {
        playerName: player.character?.name || 'The adventurer',
        enemyName: currentState.aiBoss?.name || 'the ultimate evil'
    }, theme, player, currentState.aiBoss, true);

    const allCardsForReview = [
        ...player.hand.filter(Boolean),
        ...player.playerDeck,
        ...player.playerDiscard
    ] as CardData[];

    if (player.activeTrap) {
        _log(`Returning set trap (${player.activeTrap.name}) to player's collection.`, 'system');
        allCardsForReview.push(player.activeTrap);
        player.activeTrap = null; // Clear the trap from the player object for the finished state
    }

    // Create a clean state for the 'finished' status
    const finishedState: GameState = {
        runId: currentState.runId,
        status: 'finished',
        ngPlusLevel: currentState.ngPlusLevel,
        log: currentState.log,
        aiBoss: currentState.aiBoss,
        playerDetails: { [PLAYER_ID]: player },
        winReason: winReason,
        deckForReview: allCardsForReview,
        pedometerFeatureEnabledByUser: currentState.pedometerFeatureEnabledByUser,
        eventDeck: [],
        eventDiscardPile: [],
        activeEvent: null,
        activeObjective: null,
        storeItemDeck: [],
        storeDisplayItems: [],
        storeItemDiscardPile: [],
        turn: currentState.turn,
        storyGenerated: false,
        selectedCard: null,
        endSequenceTriggered: true,
        modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
        activeGameBanner: null,
        blockTradeDueToHostileEvent: false,
        activeEventJustAttacked: false,
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
        triggerEquipAnimation: false,
        eventDifficultyBonus: 0,
    };

    setGameState(finishedState);
    
    // Save data for the next NG+ run
    localStorage.setItem('ngPlusLevel_WWS', (currentState.ngPlusLevel + 1).toString());
    localStorage.setItem('ngPlusPlayerGold_WWS', player.gold.toString());
    localStorage.setItem('ngPlusCumulativeMaxHealthBonus_WWS', player.cumulativeNGPlusMaxHealthBonus.toString());
    localStorage.setItem('ngPlusRewardChosen_WWS', 'false');
    localStorage.setItem('wildWestStepsTaken_WWS', player.stepsTaken.toString());
    localStorage.setItem('wildWestPlayerEquipped_WWS', JSON.stringify(player.equippedItems));
    const satchel = player.equippedItems.find(item => item.effect?.subtype === 'storage');
    if (satchel && player.satchel.length > 0) {
        localStorage.setItem('wildWestSatchelContents_WWS', JSON.stringify(player.satchel));
    } else {
        localStorage.removeItem('wildWestSatchelContents_WWS');
    }
    localStorage.removeItem('wildWestRunStartState_WWS');
  }, [_log]);
   
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

  const endTurnLogicRef = useRef<() => Promise<void>>(async () => {});

  const triggerBanner = useCallback((message: string, bannerType: ActiveGameBannerState['bannerType'], autoEndTurnAfter?: boolean, onBannerEnd?: () => void) => {
    _log(`Triggering banner: "${message}"`, "debug");
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    if (autoEndTurnTimerRef.current) clearTimeout(autoEndTurnTimerRef.current);

    setGameState(prev => prev ? { ...prev, activeGameBanner: { show: true, message, bannerType } } : null);

    const newTimeoutId = setTimeout(() => {
      setGameState(prev => {
        if (prev?.activeGameBanner?.message === message && prev.activeGameBanner.bannerType === bannerType) {
            return { ...prev, activeGameBanner: null };
        }
        return prev; 
      });
      
      if (bannerTimeoutRef.current === newTimeoutId) bannerTimeoutRef.current = null;
      if (onBannerEnd) onBannerEnd();
      if (autoEndTurnAfter && !isEndingTurn.current && gameStateRef.current?.status === 'playing') endTurnLogicRef.current();
    }, BANNER_DURATION) as unknown as number;
    bannerTimeoutRef.current = newTimeoutId;
  }, [_log]); 

  const handleTrapInteractionWithEvent = useCallback((
    player: PlayerDetails,
    event: CardData,
    trap: CardData,
    isBossEvent: boolean
  ) => {
    return handleTrapInteractionWithEventUtil(player, event, trap, isBossEvent, triggerBanner, triggerAnimation, _log);
  }, [triggerBanner, triggerAnimation, _log]);

  const applyImmediateEventAndCheckEndTurn = useCallback((
      event: CardData,
      player: PlayerDetails,
      currentAIBoss: CardData | undefined,
      ngPlusLevel: number
  ) => {
      return applyImmediateEventAndCheckEndTurnUtil(event, player, currentAIBoss, ngPlusLevel, lastAttackPowerRef, _log, triggerGoldFlash, triggerAnimation, triggerBanner, getBaseCardByIdentifier, applyDamageAndGetAnimation);
  }, [_log, triggerGoldFlash, triggerAnimation, triggerBanner, getBaseCardByIdentifier, applyDamageAndGetAnimation]);

  const endTurn = () => {
    if (isEndingTurn.current) return;
    endTurnLogicRef.current();
  };

  const endTurnLogic = useCallback(async () => {
    const initialTurnState = gameStateRef.current;
    if (!initialTurnState) return;
    const theme = getThemeName(initialTurnState.ngPlusLevel);
    
    const isCombatWin = localStorage.getItem('aiBossDefeated_WWS') === 'true';
    const isPeacefulWin = initialTurnState.activeEvent?.id === initialTurnState.aiBoss?.id && initialTurnState.activeEvent?.isPacified === true;

    if (isCombatWin || isPeacefulWin) {
        const playerForLog = initialTurnState.playerDetails[PLAYER_ID];
        _log(getRandomLogVariation('playerVictoryFinalDay', { playerName: playerForLog.name }, theme, playerForLog, undefined, true), 'system');
        const player = initialTurnState.playerDetails[PLAYER_ID];
        const objective = initialTurnState.activeObjective;
        const boss = initialTurnState.aiBoss;
        const activeEventForCheck = initialTurnState.activeEvent;
        let modifiablePlayer = { ...player };
        let objectiveSummary: GameState['objectiveSummary'] | undefined = undefined;

        if (objective && boss) {
            const objectiveResult = handleObjectiveCompletionChecks(modifiablePlayer, objective, boss, initialTurnState.turn, lastAttackPowerRef.current, activeEventForCheck);
            modifiablePlayer = objectiveResult.updatedPlayer;
            objectiveSummary = {
                title: objectiveResult.objectiveStatus === 'success' ? `Objective Complete: ${objective.name}` : `Objective Failed: ${objective.name}`,
                message: objectiveResult.objectiveMessage,
                status: objectiveResult.objectiveStatus,
            };
        }
        
        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modifiablePlayer },
                objectiveSummary: objectiveSummary,
                showObjectiveSummaryModal: !!objectiveSummary,
                activeObjective: null,
            };
        });
        
        if (!objectiveSummary) proceedToFinishedState();
        return;
    }
    
    if (isEndingTurn.current) return;
    isEndingTurn.current = true;
    
    try {
        let modifiablePlayer = { ...initialTurnState.playerDetails[PLAYER_ID] };
        modifiablePlayer.turnEnded = true;

        const isMobileLayout = window.innerWidth < 1024; // lg breakpoint

        setGameState(prev => prev ? { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modifiablePlayer }, scrollAnimationPhase: isMobileLayout ? 'fadingOutAndScrollingDown' : 'none' } : null);
        setShowEndTurnFade(true);

        await new Promise(resolve => setTimeout(resolve, 750));

        let modifiableGameStateUpdates: Partial<GameState> = {};
        
        let eventActiveAtNight = initialTurnState.activeEvent;
        if (eventActiveAtNight && eventActiveAtNight.subType === 'objective') {
            _log(`The objective for "${eventActiveAtNight.name}" is now active for the journey.`, 'event');
            modifiableGameStateUpdates.activeObjective = eventActiveAtNight;
            const baseObjectiveCard = getBaseCardByIdentifier(eventActiveAtNight);
            if(baseObjectiveCard) modifiableGameStateUpdates.eventDiscardPile = [...(initialTurnState.eventDiscardPile || []), baseObjectiveCard];
            modifiableGameStateUpdates.activeEvent = null;
            eventActiveAtNight = null;
        }

        let gameShouldEnd = false;
        let winReason = '';
        let illnessWorsenedName: string | null = null;

        // Check for non-hostile animals fleeing
        const isFleeingNonHostile = 
            eventActiveAtNight && eventActiveAtNight.type === 'Event' && eventActiveAtNight.subType === 'animal' &&
            NON_HOSTILE_ON_REVEAL_IDS.includes(eventActiveAtNight.id) && !eventActiveAtNight.id.startsWith('threat_skunk_t1') &&
            !initialTurnState.activeEventJustAttacked;
        
        if (isFleeingNonHostile) {
            _log(getRandomLogVariation('threatFlees', { enemyName: eventActiveAtNight.name }, theme, modifiablePlayer, eventActiveAtNight), 'event');
            triggerBanner(`${eventActiveAtNight.name} Fled`, 'generic_info');
            const baseEventCard = getBaseCardByIdentifier(eventActiveAtNight);
            if (baseEventCard) modifiableGameStateUpdates.eventDiscardPile = [...(initialTurnState.eventDiscardPile || []), baseEventCard];
            modifiableGameStateUpdates.activeEvent = null;
            eventActiveAtNight = null;
        }

        // Check for pacified animal from Pet action
        if (eventActiveAtNight && modifiablePlayer.eventPacifiedThisTurn) {
            _log(`The pacified ${eventActiveAtNight.name} wanders off peacefully into the night.`, 'info');
            triggerBanner(`${eventActiveAtNight.name} Left Peacefully`, 'generic_info');
            const baseEventCard = getBaseCardByIdentifier(eventActiveAtNight);
            if (baseEventCard) modifiableGameStateUpdates.eventDiscardPile = [...(initialTurnState.eventDiscardPile || []), baseEventCard];
            modifiableGameStateUpdates.activeEvent = null;
            eventActiveAtNight = null;
        }


        if (!gameShouldEnd && eventActiveAtNight && (eventActiveAtNight.health || 0) > 0) {
            const nightThreat = eventActiveAtNight;
            const isBossActiveDuringNight = nightThreat.id === initialTurnState.aiBoss?.id;
            const isSkunk = nightThreat.id.startsWith('threat_skunk_t1');
            const isThief = nightThreat.id.startsWith('threat_thief_');
            const isVagabond = nightThreat.id.startsWith('threat_vagabond_');
            const isRattlesnake = nightThreat.id.startsWith('threat_rattlesnake_');

            if (isSkunk || isThief || isVagabond || isRattlesnake) {
                const isCampfireProtectiveForNightThreat = modifiablePlayer.isCampfireActive && (isSkunk || isRattlesnake);

                if (!isCampfireProtectiveForNightThreat) {
                    _log(getRandomLogVariation('enemyAttackEndOfDay', { enemyName: nightThreat.name, playerName: modifiablePlayer.name || 'Player' }, theme, modifiablePlayer, nightThreat, isBossActiveDuringNight), 'event');
                    
                    if (isSkunk && nightThreat.effect?.type === 'damage' && nightThreat.effect.amount) {
                        modifiableGameStateUpdates.skunkSprayVisualActive = true;
                        modifiablePlayer.runStats.timesSkunked++;
                        const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, nightThreat.effect.amount, nightThreat.name, isBossActiveDuringNight, nightThreat.id, false, nightThreat);
                        modifiablePlayer = updatedPlayer;
                        if (animationDetails) modifiableGameStateUpdates.pendingPlayerDamageAnimation = animationDetails;
                        if (modifiablePlayer.health <= 0 && !gameShouldEnd) {
                            gameShouldEnd = true;
                            winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: nightThreat.name }, theme, modifiablePlayer, nightThreat, isBossActiveDuringNight);
                        }
                    } else if ((isThief || isVagabond) && nightThreat.effect?.type === 'damage' && nightThreat.effect.amount) {
                        triggerAnimation('player-area-shake-effect', 'player');
                        const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, nightThreat.effect.amount, nightThreat.name, isBossActiveDuringNight, nightThreat.id, false, nightThreat);
                        modifiablePlayer = updatedPlayer;
                        if (animationDetails) modifiableGameStateUpdates.pendingPlayerDamageAnimation = animationDetails;
                        if (modifiablePlayer.health <= 0 && !gameShouldEnd) {
                            gameShouldEnd = true;
                            winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: nightThreat.name }, theme, modifiablePlayer, nightThreat, isBossActiveDuringNight);
                        }
                    } else if (isRattlesnake && nightThreat.effect?.type === 'apply_illness_on_linger') {
                        const illnessCardId = nightThreat.effect.illness_id;
                        const damageOnApply = nightThreat.effect.damage_on_apply || 0;
                        const illnessCardData = CURRENT_CARDS_DATA[illnessCardId || 'threat_snake_bite'];
                        soundManager.playSound('threat_rattlesnake_t1');
                        triggerBanner('Snake Bite!', 'event_alert');
                        triggerAnimation('player-area-shake-effect', 'player');
                        if (damageOnApply > 0) {
                            const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, damageOnApply, nightThreat.name, isBossActiveDuringNight, nightThreat.id, false, nightThreat);
                            modifiablePlayer = updatedPlayer;
                            if (animationDetails) modifiableGameStateUpdates.pendingPlayerDamageAnimation = animationDetails;
                        }
                        if (modifiablePlayer.health > 0 && illnessCardData) {
                            if (!modifiablePlayer.currentIllnesses.some(ill => ill.id === illnessCardData.id)) {
                                modifiablePlayer.currentIllnesses.push(illnessCardData);
                                modifiablePlayer.runStats.illnesses_contracted++;
                                _log(getRandomLogVariation('illnessContracts', { illnessName: illnessCardData.name }, theme, modifiablePlayer, illnessCardData), 'event');
                                triggerAnimation('player-is-ill', 'player');
                            }
                        }
                        if (modifiablePlayer.health <= 0 && !gameShouldEnd) { 
                            gameShouldEnd = true;
                            winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: nightThreat.name }, theme, modifiablePlayer, nightThreat, isBossActiveDuringNight);
                        }
                    }
                } else {
                    _log(getRandomLogVariation('enemyCampfireDeterred', { enemyName: nightThreat.name, playerName: modifiablePlayer.name || 'Player' }, theme, modifiablePlayer, nightThreat), 'info');
                    triggerBanner(`${nightThreat.name} Deterred by Campfire`, 'generic_info');
                }
                const baseNightThreat = getBaseCardByIdentifier(nightThreat);
                if (baseNightThreat) modifiableGameStateUpdates.eventDiscardPile = [...(initialTurnState.eventDiscardPile || []), baseNightThreat];
                modifiableGameStateUpdates.activeEvent = null;
                eventActiveAtNight = null;
                if (isThief) {
                    modifiablePlayer.goldStolenThisTurn = 0;
                }
            }
        }
        
        if (!gameShouldEnd) {
            const cardsFromHand = modifiablePlayer.hand.filter(c => c !== null) as CardData[];
            if (cardsFromHand.length > 0) {
                _log(`[DEBUG] Discarding ${cardsFromHand.length} cards: ${cardsFromHand.map(c => c.name).join(', ')}.`, 'debug');
                const baseCardsToDiscard = cardsFromHand.map(c => getBaseCardByIdentifier(c)).filter(Boolean);
                modifiablePlayer.playerDiscard = [...modifiablePlayer.playerDiscard, ...baseCardsToDiscard];
                modifiablePlayer.hand = new Array(modifiablePlayer.handSize).fill(null);
            }
        }

        if (!gameShouldEnd && modifiablePlayer.currentIllnesses.length > 0 && modifiablePlayer.health > 0) {
            const illnessCount = modifiablePlayer.currentIllnesses.length;
            illnessWorsenedName = modifiablePlayer.currentIllnesses.map(ill => ill.name).join(', ');
            
            const damageFromIllness = illnessCount;
            if (modifiablePlayer.maxHealth > damageFromIllness) {
                modifiablePlayer.maxHealth -= damageFromIllness;
            } else if (modifiablePlayer.maxHealth > 1) {
                modifiablePlayer.maxHealth = 1;
            }
            modifiablePlayer.health = Math.min(modifiablePlayer.health, modifiablePlayer.maxHealth);
            triggerAnimation('player-is-ill', 'player');

            if (modifiablePlayer.health <= 0) {
                gameShouldEnd = true;
                const firstIllnessCard = modifiablePlayer.currentIllnesses.length > 0 ? modifiablePlayer.currentIllnesses[0] : undefined;
                winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: illnessWorsenedName }, theme, modifiablePlayer, firstIllnessCard);
            }
        }

        if (!gameShouldEnd && modifiablePlayer.mountainSicknessActive && modifiablePlayer.mountainSicknessTurnsRemaining > 0 && modifiablePlayer.health > 0) {
            modifiablePlayer.mountainSicknessTurnsRemaining -=1;
            if (modifiablePlayer.mountainSicknessTurnsRemaining <= 0) {
                modifiablePlayer.mountainSicknessActive = false;
                _log(getRandomLogVariation('illnessTemporaryCure', { playerName: modifiablePlayer.name || 'Player', illnessName: "Mountain Sickness" }, theme, modifiablePlayer), 'info');
                triggerAnimation('player-border-pulse-green', 'player');
            }
        }

        if (!gameShouldEnd && eventActiveAtNight && eventActiveAtNight.type === 'Event' && eventActiveAtNight.subType === 'animal' && (eventActiveAtNight.effect?.type === 'damage' && (eventActiveAtNight.effect.amount || 0) === 0) && !eventActiveAtNight.id.startsWith('threat_skunk_') && !eventActiveAtNight.id.startsWith('threat_rattlesnake_')) {
            _log(getRandomLogVariation('animalWandersOff', { enemyName: eventActiveAtNight.name, playerName: modifiablePlayer.name || 'Player' }, theme, modifiablePlayer, eventActiveAtNight), 'event');
            triggerBanner(`${eventActiveAtNight.name} Wandered Off`, 'generic_info');
            const baseEventCard = getBaseCardByIdentifier(eventActiveAtNight);
            if (baseEventCard) modifiableGameStateUpdates.eventDiscardPile = [...(modifiableGameStateUpdates.eventDiscardPile || initialTurnState.eventDiscardPile || []), baseEventCard];
            modifiableGameStateUpdates.activeEvent = null;
            eventActiveAtNight = null;
        }
        else if (!gameShouldEnd && eventActiveAtNight && eventActiveAtNight.type === 'Event' && eventActiveAtNight.subType === 'animal' && (eventActiveAtNight.health || 0) > 0 && (eventActiveAtNight.health || 0) <= 4 && !eventActiveAtNight.id.startsWith('threat_skunk_') && !eventActiveAtNight.id.startsWith('threat_rattlesnake_')) {
            if (!initialTurnState.activeEventJustAttacked) {
                _log(getRandomLogVariation('threatFlees', { enemyName: eventActiveAtNight.name }, theme, modifiablePlayer, eventActiveAtNight), 'event');
                triggerBanner(`${eventActiveAtNight.name} Fled`, 'generic_info');
                const baseEventCard = getBaseCardByIdentifier(eventActiveAtNight);
                if (baseEventCard) modifiableGameStateUpdates.eventDiscardPile = [...(modifiableGameStateUpdates.eventDiscardPile || initialTurnState.eventDiscardPile || []), baseEventCard];
                modifiableGameStateUpdates.activeEvent = null;
                eventActiveAtNight = null;
            }
        }

        if (!gameShouldEnd && eventActiveAtNight && eventActiveAtNight.type !== 'Event') {
            const nonEventCardLeft = eventActiveAtNight;
            const baseCard = getBaseCardByIdentifier(nonEventCardLeft);
            if (baseCard) {
                const isTrophyOrValuable = baseCard.type === 'Trophy' || baseCard.type === 'Objective Proof' || baseCard.id.startsWith('item_gold_nugget') || baseCard.id.startsWith('item_jewelry');
                if (isTrophyOrValuable) {
                    _log(getRandomLogVariation('itemLeftBehind', { playerName: modifiablePlayer.name || 'Player', itemName: nonEventCardLeft.name }, theme, modifiablePlayer, nonEventCardLeft), 'info');
                } else {
                    _log(getRandomLogVariation('itemLeftBehind', { playerName: modifiablePlayer.name || 'Player', itemName: nonEventCardLeft.name }, theme, modifiablePlayer, nonEventCardLeft), 'info');
                    modifiableGameStateUpdates.storeItemDeck = [baseCard, ...(initialTurnState.storeItemDeck || [])];
                }
            }
            modifiableGameStateUpdates.activeEvent = null;
            eventActiveAtNight = null;
        }

        // Morning Routine
        if (!gameShouldEnd && modifiablePlayer.health > 0) {
            const isBossActiveInMorning = eventActiveAtNight?.id === initialTurnState.aiBoss?.id;
            const goldPanEquipped = modifiablePlayer.equippedItems.find(item => item.id === 'item_gold_pan' || item.id === 'item_gold_pan_fj');
            if (goldPanEquipped) {
                const goldPanCardData = CURRENT_CARDS_DATA[goldPanEquipped.id];
                const goldAmountFromPan = goldPanCardData?.effect?.type === 'gold' ? goldPanCardData.effect.amount || 5 : 5;
                modifiablePlayer.gold += goldAmountFromPan;
                modifiablePlayer.runStats.gold_earned += goldAmountFromPan;
                _log(getRandomLogVariation('goldFoundFromItem', { goldAmount: goldAmountFromPan, itemName: goldPanEquipped.name }, theme, modifiablePlayer, goldPanEquipped), 'gold');
                triggerGoldFlash(PLAYER_ID);
            }
            const waterskin = modifiablePlayer.equippedItems.find(item => item.id.startsWith('upgrade_waterskin_canteen_'));
            if (waterskin && waterskin.effect?.type === 'heal' && waterskin.effect.amount) {
                modifiablePlayer = applyHealToPlayer(modifiablePlayer, waterskin.effect.amount, waterskin.name, isBossActiveInMorning, waterskin);
            }
            if (modifiablePlayer.currentIllnesses.length === 0 && !modifiablePlayer.mountainSicknessActive) {
                let targetMaxHealth = modifiablePlayer.characterBaseMaxHealthForRun;
                modifiablePlayer.equippedItems.forEach(item => {
                    if (item.effect?.persistent && item.type === 'Player Upgrade') {
                        if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') targetMaxHealth += item.effect.amount;
                        else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') targetMaxHealth += item.effect.max_health;
                    }
                });
                if (modifiablePlayer.maxHealth < targetMaxHealth) {
                    modifiablePlayer.maxHealth += 1;
                    modifiablePlayer.health = Math.min(modifiablePlayer.health + 1, modifiablePlayer.maxHealth);
                    _log(getRandomLogVariation('playerRecoversMaxHealth', { newMaxHealth: modifiablePlayer.maxHealth }, theme, modifiablePlayer), 'info');
                    triggerAnimation('player-border-pulse-green', 'player');
                }
            }
        }
        
        // New Day Start & Turn Increment
        if (!gameShouldEnd) {
            modifiableGameStateUpdates.turn = initialTurnState.turn + 1;
            if (illnessWorsenedName) {
                _log(getRandomLogVariation('newDayWithIllnessWorsened', { dayNumber: initialTurnState.turn + 1, illnessName: illnessWorsenedName }, theme, modifiablePlayer), 'turn');
            } else {
                _log(getRandomLogVariation('newDay', { dayNumber: initialTurnState.turn + 1 }, theme, modifiablePlayer), 'turn');
            }
        }

        // Draw New Event
        let currentActiveEventForNewDay = eventActiveAtNight;
        let currentEventDeck = [...(initialTurnState.eventDeck || [])];
        let currentEventDiscard = [...(modifiableGameStateUpdates.eventDiscardPile || initialTurnState.eventDiscardPile || [])]; 
        modifiableGameStateUpdates.activeEventJustAttacked = false;
        let turnActuallyEndedByImmediateEvent = false;
        let eventWasNewlyDrawnThisTurn = false;

        if (!gameShouldEnd) {
            if (currentActiveEventForNewDay === null && !modifiablePlayer.isCampfireActive) {
                eventWasNewlyDrawnThisTurn = true;
                currentEventDeck = modifiableGameStateUpdates.eventDeck || currentEventDeck;
                let bossShouldAppear = false;
                let bossTriggerReason = "";

                if (modifiablePlayer.forceBossRevealNextTurn && initialTurnState.aiBoss) {
                    bossShouldAppear = true;
                    bossTriggerReason = "Lured by provisions, the Boss emerges!";
                    modifiablePlayer.forceBossRevealNextTurn = false;
                } else if (currentEventDeck.length === 0 && initialTurnState.aiBoss && localStorage.getItem('aiBossDefeated_WWS') !== 'true') {
                    bossShouldAppear = true;
                    bossTriggerReason = "Event deck depleted. The Boss emerges!";
                }
                
                if (!bossShouldAppear && initialTurnState.turn >= MAX_DAYS_BEFORE_BOSS_FINDS_PLAYER && initialTurnState.aiBoss && localStorage.getItem('aiBossDefeated_WWS') !== 'true') {
                    bossShouldAppear = true;
                    bossTriggerReason = `Day ${initialTurnState.turn}: The Boss has found you!`;
                }

                if (bossShouldAppear) {
                    _log(bossTriggerReason, "event");
                    const bossBaseCard = CURRENT_CARDS_DATA[initialTurnState.aiBoss!.id];
                    if (bossBaseCard) {
                        currentActiveEventForNewDay = getScaledCard(bossBaseCard, initialTurnState.ngPlusLevel);
                        if (currentActiveEventForNewDay && (initialTurnState.eventDifficultyBonus || 0) > 0) {
                            currentActiveEventForNewDay = applyDifficultyBonus(currentActiveEventForNewDay, initialTurnState.eventDifficultyBonus || 0);
                        }
                        const health = currentActiveEventForNewDay!.health || 0;
                        let tier: 'Low' | 'Mid' | 'High' = 'Low';
                        if (health > 15) tier = 'High';
                        else if (health > 8) tier = 'Mid';
                        _log(getRandomLogVariation(`eventRevealThreat${tier}`, { enemyName: currentActiveEventForNewDay!.name, playerName: modifiablePlayer.name || 'Player' }, theme, modifiablePlayer, currentActiveEventForNewDay, true), "event");
                    } else {
                        currentActiveEventForNewDay = null;
                        _log(`CRITICAL ERROR: AI Boss card '${initialTurnState.aiBoss!.id}' not found.`, "error");
                    }
                    modifiableGameStateUpdates.activeEventTurnCounter = 1;
                } else if (currentEventDeck.length > 0) {
                    let newEventOriginal = currentEventDeck.shift()!;
                    if (currentEventDeck.length === 0 && !gameShouldEnd) {
                        triggerBanner("The Event Deck is empty! The boss will appear next turn!", 'event_alert');
                    }
                    let scaledNewEvent: CardData | null = getScaledCard(newEventOriginal, initialTurnState.ngPlusLevel);
                    if (scaledNewEvent && (initialTurnState.eventDifficultyBonus || 0) > 0) {
                        scaledNewEvent = applyDifficultyBonus(scaledNewEvent, initialTurnState.eventDifficultyBonus || 0);
                    }
                    if (scaledNewEvent) {
                      const { updatedPlayer: playerAfterImmediateEvent, turnEndedByEvent, gameShouldEnd: endAfterImmediate, eventRemoved, winReason: reasonAfterImmediate, damageInfo: immediateDamageInfo, modifiedEventAfterTrap } = applyImmediateEventAndCheckEndTurn(scaledNewEvent, modifiablePlayer, initialTurnState.aiBoss, initialTurnState.ngPlusLevel);
                      modifiablePlayer = playerAfterImmediateEvent;
                      if (immediateDamageInfo) modifiableGameStateUpdates.pendingPlayerDamageAnimation = immediateDamageInfo;
                      turnActuallyEndedByImmediateEvent = turnEndedByEvent;
                      if (endAfterImmediate) {
                          gameShouldEnd = true;
                          winReason = reasonAfterImmediate || winReason;
                      }
                      if (eventRemoved) {
                          currentEventDiscard.push(newEventOriginal);
                          currentActiveEventForNewDay = null;
                          modifiableGameStateUpdates.activeEventTurnCounter = 0;
                      } else {
                          currentActiveEventForNewDay = modifiedEventAfterTrap;
                          modifiableGameStateUpdates.activeEventTurnCounter = currentActiveEventForNewDay ? 1 : 0;
                      }
                      if (newEventOriginal.id.startsWith('threat_lightning_strike')) {
                          soundManager.playSound('lightning_strike');
                          modifiableGameStateUpdates.showLightningStrikeFlash = true;
                      } else if (newEventOriginal.id.startsWith('threat_rockslide') || newEventOriginal.id.startsWith('threat_flash_flood')) {
                          soundManager.playSound('rockslide');
                      } else if (newEventOriginal.id.startsWith('threat_mountain_sickness') || newEventOriginal.id.startsWith('threat_heat_stroke')) {
                          soundManager.playSound('mountain_sickness');
                      }
                    }
                } else if (modifiablePlayer.health > 0) {
                    gameShouldEnd = true;
                    winReason = getRandomLogVariation('playerVictory', { playerName: modifiablePlayer.character?.name || 'The adventurer' }, theme, modifiablePlayer, undefined, true);
                }
                modifiableGameStateUpdates.eventDeck = currentEventDeck;
                modifiableGameStateUpdates.eventDiscardPile = currentEventDiscard;

            } else if (modifiablePlayer.isCampfireActive && currentActiveEventForNewDay === null) {
                _log("The campfire keeps the wilderness quiet. No new event.", "info");
                modifiableGameStateUpdates.activeEventTurnCounter = 0;
            } else if (currentActiveEventForNewDay) {
                if (initialTurnState.activeEvent?.id === currentActiveEventForNewDay?.id) modifiableGameStateUpdates.activeEventTurnCounter = (initialTurnState.activeEventTurnCounter || 0) + 1;
                else modifiableGameStateUpdates.activeEventTurnCounter = currentActiveEventForNewDay ? 1 : 0;
            }
            modifiableGameStateUpdates.activeEvent = currentActiveEventForNewDay;

            // Morning Attack
            if (!gameShouldEnd && currentActiveEventForNewDay && (currentActiveEventForNewDay.health || 0) > 0 && !turnActuallyEndedByImmediateEvent) {
                const threatForMorningAttack = currentActiveEventForNewDay;
                const isBossActiveInMorning = threatForMorningAttack.id === initialTurnState.aiBoss?.id;
                let morningAttackOccurs = false;
                let logMorningAttackReason = "";

                const wasNewlyDrawnAndAttackedImmediately = eventWasNewlyDrawnThisTurn && modifiableGameStateUpdates.pendingPlayerDamageAnimation && modifiableGameStateUpdates.pendingPlayerDamageAnimation.eventId === threatForMorningAttack.id;
                const isFirstTurnTransitionOfNewGame = initialTurnState.turn === 1 && initialTurnState.gameJustStarted;

                if (!wasNewlyDrawnAndAttackedImmediately && !isFirstTurnTransitionOfNewGame) {
                    const isHostileThreat = (threatForMorningAttack.type === 'Event' && (threatForMorningAttack.subType === 'human' || threatForMorningAttack.subType === 'animal')) || (initialTurnState.aiBoss && threatForMorningAttack.id === initialTurnState.aiBoss.id);
                    if (isHostileThreat) {
                        const isCampfireProtected = threatForMorningAttack.subType === 'animal' && modifiablePlayer.isCampfireActive;
                        const isExcludedFromMorningAttack = threatForMorningAttack.id.startsWith('threat_skunk_') || threatForMorningAttack.id.startsWith('threat_thief_');
                        if (!isCampfireProtected && !isExcludedFromMorningAttack && !threatForMorningAttack.isPacified) {
                            if ((threatForMorningAttack.effect?.amount || 0) > 0 || (threatForMorningAttack.effect?.damage || 0) > 0) {
                                morningAttackOccurs = true;
                                logMorningAttackReason = initialTurnState.activeEvent?.id === threatForMorningAttack.id
                                    ? getRandomLogVariation('enemyAttackEndOfDay', { enemyName: threatForMorningAttack.name }, theme, modifiablePlayer, threatForMorningAttack, isBossActiveInMorning)
                                    : getRandomLogVariation('enemyAttackImmediate', { enemyName: threatForMorningAttack.name }, theme, modifiablePlayer, threatForMorningAttack, isBossActiveInMorning);
                            }
                        } else if (isCampfireProtected) {
                            _log(getRandomLogVariation('enemyCampfireDeterred', { enemyName: threatForMorningAttack.name }, theme, modifiablePlayer, threatForMorningAttack), 'info');
                        }
                    }
                }

                if (morningAttackOccurs && threatForMorningAttack.effect?.type === 'damage' && (threatForMorningAttack.effect.amount || 0) > 0) {
                    _log(logMorningAttackReason, 'event');
                    const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, threatForMorningAttack.effect.amount || 0, threatForMorningAttack.name, isBossActiveInMorning, threatForMorningAttack.id, false, threatForMorningAttack);
                    modifiablePlayer = updatedPlayer;
                    if (animationDetails) modifiableGameStateUpdates.pendingPlayerDamageAnimation = animationDetails;
                    else modifiableGameStateUpdates.pendingPlayerDamageAnimation = null;
                    triggerAnimation('player-area-shake-effect', 'player');
                    if (modifiablePlayer.health <= 0) {
                        gameShouldEnd = true;
                        winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: threatForMorningAttack.name }, theme, modifiablePlayer, threatForMorningAttack, isBossActiveInMorning);
                    }
                }
            }
        }

        if (localStorage.getItem('aiBossDefeated_WWS') === 'true' && modifiablePlayer.health > 0 && !gameShouldEnd) {
            gameShouldEnd = true;
            winReason = getRandomLogVariation('threatDefeated', { playerName: modifiablePlayer.character?.name || 'The adventurer', enemyName: initialTurnState.aiBoss?.name || 'the ultimate evil' }, theme, modifiablePlayer, initialTurnState.aiBoss, true);
        }

        if (modifiablePlayer.isCampfireActive) {
            modifiablePlayer.isCampfireActive = false;
            _log(getRandomLogVariation('campfireDoused', {}, theme, modifiablePlayer), 'info');
        }

        if (gameShouldEnd) {
            modifiableGameStateUpdates.status = 'finished';
            modifiableGameStateUpdates.winReason = winReason;
            _log(winReason, 'system');
            if (modifiablePlayer.health > 0) {
                const allCardsForReview = [...modifiablePlayer.hand.filter(Boolean), ...modifiablePlayer.playerDeck, ...modifiablePlayer.playerDiscard] as CardData[];
                if (modifiablePlayer.activeTrap) {
                    _log(`Returning set trap (${modifiablePlayer.activeTrap.name}) to player's collection.`, 'system');
                    allCardsForReview.push(modifiablePlayer.activeTrap);
                    modifiablePlayer.activeTrap = null;
                }
                modifiableGameStateUpdates.deckForReview = allCardsForReview;
            } else {
                modifiablePlayer.runStats.totalStepsTaken = modifiablePlayer.stepsTaken;
                modifiablePlayer.runStats.totalDaysSurvived = initialTurnState.turn;
                modifiablePlayer.runStats.mostGoldHeld = Math.max(modifiablePlayer.runStats.mostGoldHeld || 0, modifiablePlayer.gold);
                updateLifetimeStats(modifiablePlayer.runStats);
                _log("Lifetime stats updated.", "system");
                localStorage.setItem('wildWestStepsTaken_WWS', modifiablePlayer.stepsTaken.toString());
                localStorage.removeItem('wildWestGameState_WWS');
                localStorage.removeItem('aiBossDefeated_WWS');
                if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
                if (autoEndTurnTimerRef.current) clearTimeout(autoEndTurnTimerRef.current);
            }
        } else {
            let newPlayerDeck = [...modifiablePlayer.playerDeck];
            let newPlayerDiscard = [...modifiablePlayer.playerDiscard];
            let handDrawSize = modifiablePlayer.handSize;
            if (modifiablePlayer.mountainSicknessActive && modifiablePlayer.mountainSicknessTurnsRemaining > 0) {
                handDrawSize = Math.max(0, modifiablePlayer.handSize - 1);
                _log(getRandomLogVariation('mountainSicknessDrawReduction', { reducedAmount: 1 }, theme, modifiablePlayer), 'event');
            }

            let newPlayerHand: (CardData | null)[] = new Array(modifiablePlayer.handSize).fill(null);
            let newDayDrawnCount = 0;
            const drawnIndicesForAnimation: number[] = [];
            for (let i = 0; i < handDrawSize; i++) {
                if (newPlayerDeck.length === 0) {
                    if (newPlayerDiscard.length > 0) {
                        newPlayerDeck = shuffleArray(newPlayerDiscard);
                        newPlayerDiscard = [];
                    } else break;
                }
                const drawnCardForNewDay = newPlayerDeck.shift();
                if (drawnCardForNewDay) {
                    newPlayerHand[i] = getScaledCard(drawnCardForNewDay, initialTurnState.ngPlusLevel);
                    drawnIndicesForAnimation.push(i);
                    newDayDrawnCount++;
                } else break;
            }
            if (newDayDrawnCount > 0) {
                soundManager.playSound('card_draw');
                _log(getRandomLogVariation('cardsDrawn', { cardsDrawn: newDayDrawnCount }, theme, modifiablePlayer), "debug");
                if(drawnIndicesForAnimation.length > 0) {
                    modifiableGameStateUpdates.newlyDrawnCardIndices = drawnIndicesForAnimation;
                }
            }
            modifiablePlayer.playerDeck = newPlayerDeck;
            modifiablePlayer.playerDiscard = newPlayerDiscard;
            modifiablePlayer.hand = newPlayerHand;
            modifiablePlayer.isUnsortedDraw = true;
        }

        if (!gameShouldEnd) {
            modifiablePlayer.hasEquippedThisTurn = false;
            modifiablePlayer.turnEnded = false;
            modifiablePlayer.hasTakenActionThisTurn = false;
            modifiablePlayer.hasRestockedThisTurn = false;
            modifiablePlayer.eventPacifiedThisTurn = false;
            modifiableGameStateUpdates.scrollAnimationPhase = isMobileLayout ? 'fadingInAndScrollingUp' : 'none';
        } else {
            modifiableGameStateUpdates.scrollAnimationPhase = 'none';
        }

        if (initialTurnState.gameJustStarted) modifiableGameStateUpdates.gameJustStarted = false;
        
        if (modifiablePlayer.isUnsortedDraw) {
            const actualCards = modifiablePlayer.hand.filter(c => c !== null) as CardData[];
            actualCards.sort((a, b) => getCardCategory(a) - getCardCategory(b) || a.name.localeCompare(b.name));
            const newHandConfiguration: (CardData | null)[] = new Array(modifiablePlayer.handSize).fill(null);
            actualCards.forEach((card, i) => newHandConfiguration[i] = card);
            modifiablePlayer.hand = newHandConfiguration;
            modifiablePlayer.isUnsortedDraw = false;
        }

        const finalEventForBlockTrade = modifiableGameStateUpdates.activeEvent === undefined ? initialTurnState.activeEvent : modifiableGameStateUpdates.activeEvent;
        modifiableGameStateUpdates.blockTradeDueToHostileEvent = isEventConsideredHostile(finalEventForBlockTrade);

        setGameState(prevState => {
            if (!prevState) return null;
            return {
                ...prevState, ...modifiableGameStateUpdates,
                playerDetails: { ...prevState.playerDetails, [PLAYER_ID]: modifiablePlayer }
            };
        });

        setTimeout(() => {
        setGameState(prev => {
            if (!prev) return null;
            let nextState = {...prev};
            if (nextState.showLightningStrikeFlash) nextState.showLightningStrikeFlash = false;
            if (nextState.pendingPlayerDamageAnimation && !gameShouldEnd) nextState.pendingPlayerDamageAnimation = null;
            else if (gameShouldEnd) nextState.pendingPlayerDamageAnimation = null;
            if (nextState.scrollAnimationPhase === 'fadingInAndScrollingUp' || gameShouldEnd) nextState.scrollAnimationPhase = 'none';
            return nextState;
        });
        }, 500);
    } finally {
        isEndingTurn.current = false;
        setShowEndTurnFade(false);
    }
  }, [_log, applyDamageAndGetAnimation, applyHealToPlayer, triggerGoldFlash, triggerAnimation, triggerBanner, handleTrapInteractionWithEvent, handleObjectiveCompletionChecks, proceedToFinishedState, getBaseCardByIdentifier, applyImmediateEventAndCheckEndTurn]);

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
            if (isEndingTurn.current) _log("Actions unavailable while day is ending.", "error");
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
                setGameState(prev => prev ? { ...prev, triggerEquipAnimation: false } : null);
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
            
            // Special handling for SHOW_MODAL to clear any active banner and its timeout
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
                _log(winReason, "system");

                // Finalize and save stats upon defeat
                modifiablePlayer.runStats.totalStepsTaken = modifiablePlayer.stepsTaken;
                modifiablePlayer.runStats.totalDaysSurvived = initialGameState.turn;
                modifiablePlayer.runStats.mostGoldHeld = Math.max(modifiablePlayer.runStats.mostGoldHeld || 0, modifiablePlayer.gold);
                updateLifetimeStats(modifiablePlayer.runStats);
                _log("Lifetime stats updated.", "system");

                // Clean up for next game
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
  }, [_log, triggerAnimation, triggerBanner, triggerGoldFlash, applyHealToPlayer, applyDamageAndGetAnimation, getBaseCardByIdentifier]);

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
    currentGameState.storeDisplayItems.forEach(item => { if (item) currentStoreDeck.push(getBaseCardByIdentifier(item)); });

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
    } : null);
  }, [_log, triggerGoldFlash, getBaseCardByIdentifier]);

  const pregenerateNextLevelRemix = useCallback(async (level: number) => {
    try {
        const themeName = getThemeName(level);
        const themeSuffix = getThemeSuffix(level);

        if (level === 0) return;

        // Levels 1-9
        if (level >= 1 && level < 10) {
            const remixedPoolKey = 'remixedCardPool_theme_western_WWS';
            let cumulativeRemixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
            
            const originalThemePool = Object.values(ALL_CARDS_DATA_MAP).filter(c => !/_fj$|_as$|_sh$|_cp$/.test(c.id));
            const alreadyRemixedOriginalIds = new Set(Object.values(cumulativeRemixedCards).map((card: any) => card.originalId).filter(Boolean));
            const remixableCards = originalThemePool.filter(card => !alreadyRemixedOriginalIds.has(card.id) && card.subType !== 'objective' && card.buyCost && card.buyCost > 0);

            if (remixableCards.length > 0) {
                _log(`Remixing 1 new card for the Western pool for NG+${level}...`, "system");
                const cardToRemix = shuffleArray(remixableCards)[0];
                const singleRemixResult = await remixCardsForNGPlusGame(_log, { [cardToRemix.id]: cardToRemix }, level);
                if (singleRemixResult) {
                    const newRemixedCards = { ...cumulativeRemixedCards, ...singleRemixResult };
                    localStorage.setItem(remixedPoolKey, JSON.stringify(newRemixedCards));
                }
            }
        } 
        // Milestone Levels
        else if (level >= 10 && level % NG_PLUS_THEME_MILESTONE_INTERVAL === 0) {
            const remixedPoolKey = `remixedCardPool_theme_${themeName}_WWS`;
            localStorage.removeItem(remixedPoolKey); // Clear the pool for the new theme
            _log(`Entering a new realm for NG+${level}: ${themeName}. Clearing old legends and forging a new one...`, "system");
            
            const themeSuffixForMilestone = getThemeSuffixForMilestone(level);
            let cardsForRemixingPool: CardData[] = [];
            if (themeSuffixForMilestone) {
                cardsForRemixingPool = Object.values(ALL_CARDS_DATA_MAP).filter(c => c.id.endsWith(themeSuffixForMilestone) && c.subType !== 'objective' && c.buyCost && c.buyCost > 0);
            }

            if (cardsForRemixingPool.length > 0) {
                const cardToRemix = shuffleArray(cardsForRemixingPool)[0];
                const singleRemixedCard = await remixCardsForNGPlusGame(_log, { [cardToRemix.id]: cardToRemix }, level);
                localStorage.setItem(remixedPoolKey, JSON.stringify(singleRemixedCard || {}));
            }
        } 
        // Non-Milestone Themed Levels
        else if (level > 10) {
            const CARDS_TO_REMIX_PER_LEVEL = 10;
            const remixedPoolKey = `remixedCardPool_theme_${themeName}_WWS`;
            let cumulativeRemixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
            
            const originalThemePool = Object.values(ALL_CARDS_DATA_MAP).filter(c => themeSuffix ? c.id.endsWith(themeSuffix) : false);
            const alreadyRemixedOriginalIds = new Set(Object.values(cumulativeRemixedCards).map((card: any) => card.originalId).filter(Boolean));
            const remixableCards = originalThemePool.filter(card => !alreadyRemixedOriginalIds.has(card.id) && card.subType !== 'objective' && card.buyCost && card.buyCost > 0);

            if (remixableCards.length > 0) {
                const numToRemix = Math.min(CARDS_TO_REMIX_PER_LEVEL, remixableCards.length);
                _log(`Adding ${numToRemix} new remixed cards to the ${themeName} pool for NG+${level}...`, "system");
                const shuffledRemixable = shuffleArray(remixableCards);
                const cardsToRemixSelection = shuffledRemixable.slice(0, numToRemix);
                const cardsToRemixDict: { [id: string]: CardData } = {};
                cardsToRemixSelection.forEach(card => { cardsToRemixDict[card.id] = card; });

                const multiRemixResult = await remixCardsForNGPlusGame(_log, cardsToRemixDict, level);
                if (multiRemixResult) {
                    const newRemixedCards = { ...cumulativeRemixedCards, ...multiRemixResult };
                    localStorage.setItem(remixedPoolKey, JSON.stringify(newRemixedCards));
                }
            }
        }
    } catch (err) {
        _log(`Failed to pregenerate assets for NG+${level}. They will be generated upon starting the next run.`, "error");
    }
  }, [_log]);

  const resetGame = useCallback((options: { hardReset?: boolean; ngPlusOverride?: number; saveSlotIndex?: number } = {}) => {
    ttsManager.cancel();
    const { hardReset = false, ngPlusOverride, saveSlotIndex } = options;
    const isInitialLoad = gameStateRef.current === null;
    const initialStatus = (hardReset || isInitialLoad) ? 'landing' : 'setup';

    _log(hardReset ? "Game reset to NG+0." : `Restarting run.`, "system");
    if (hardReset) {
        Object.keys(localStorage).forEach(key => { 
            if (key.endsWith('_WWS') && ![
                'wildWestLifetimeStats_WWS', 
                'preloaded_themes_WWS', 
                'preloaded_app_version_WWS',
                'pedometerFeatureEnabled_WWS'
            ].includes(key)) {
                localStorage.removeItem(key);
            }
        });
    } else {
        localStorage.removeItem('wildWestGameState_WWS');
        localStorage.removeItem('aiBossDefeated_WWS');
        localStorage.removeItem('provisionsCollected_WWS');
        localStorage.removeItem('objectiveCondition_the_expediter_WWS');
        localStorage.removeItem('objectiveReward_master_trapper_WWS');
        const oldNgPlusLevel = gameStateRef.current?.ngPlusLevel ?? -1;
        const newNgPlusLevel = ngPlusOverride ?? parseInt(localStorage.getItem('ngPlusLevel_WWS') || '0', 10);
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
    if (autoEndTurnTimerRef.current) clearTimeout(autoEndTurnTimerRef.current);

    resetCurrentCardsData();

    const ngPlusLevel = hardReset ? 0 : (ngPlusOverride !== undefined ? ngPlusOverride : parseInt(localStorage.getItem('ngPlusLevel_WWS') || '0', 10));
    const cumulativeNGPlusMaxHealthBonus = hardReset ? 0 : parseInt(localStorage.getItem('ngPlusCumulativeMaxHealthBonus_WWS') || '0', 10);
    const stepsTaken = hardReset ? 0 : parseInt(localStorage.getItem('wildWestStepsTaken_WWS') || '0', 10);

    const initialPlayerState = {
        ...INITIAL_PLAYER_STATE_TEMPLATE,
        runStats: { ...JSON.parse(JSON.stringify(INITIAL_RUN_STATS)), highestNGPlusLevel: ngPlusLevel },
        ngPlusLevel, cumulativeNGPlusMaxHealthBonus, stepsTaken,
    };
    const baseInitialState: GameState = {
        runId: crypto.randomUUID(),
        status: initialStatus, playerDetails: { [PLAYER_ID]: initialPlayerState }, eventDeck: [], eventDiscardPile: [], activeEvent: null, activeObjective: null, storeItemDeck: [], storeDisplayItems: [], storeItemDiscardPile: [], turn: 0, storyGenerated: false, log: [], selectedCard: null, ngPlusLevel: ngPlusLevel, modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState }, activeGameBanner: initialGameBannerState, blockTradeDueToHostileEvent: false, playerDeckAugmentationPool: [], initialCardPool: [], activeEventTurnCounter: 0, scrollAnimationPhase: 'none', isLoadingStory: false, pedometerFeatureEnabledByUser: localStorage.getItem('pedometerFeatureEnabled_WWS') === 'true', showObjectiveSummaryModal: false, objectiveSummary: undefined, gameJustStarted: true, newlyDrawnCardIndices: undefined, triggerEquipAnimation: false, eventDifficultyBonus: 0, saveSlotIndex: saveSlotIndex ?? undefined,
    };
    setGameState(baseInitialState);
    
    const initializeLevel = async (level: number) => {
      try {
        setGameState(prev => prev ? { ...prev, isLoadingNGPlus: true } : null);
        
        if (nextLevelRemixPromise.current) {
            _log("Waiting for pregenerated assets to finish...", "system");
            await nextLevelRemixPromise.current;
            nextLevelRemixPromise.current = null; // Consume the promise
        } else if (level > 0 && !hardReset) {
            _log(`Assets for NG+${level} were not pre-generated. Generating now...`, "system");
            await pregenerateNextLevelRemix(level);
        }

        let finalRemixedCards: { [id: string]: CardData } = {};
        if (level > 0 && level < 10) {
            const remixedPoolKey = 'remixedCardPool_theme_western_WWS';
            finalRemixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
        } else if (level >= 10) {
            const themeName = getThemeName(level);
            const remixedPoolKey = `remixedCardPool_theme_${themeName}_WWS`;
            finalRemixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
        }
        
        const finalCardsData = { ...ALL_CARDS_DATA_MAP, ...finalRemixedCards };
        updateCurrentCardsData(finalCardsData);
        
        const themedPool = getThemedCardPool(level, finalCardsData);

        setGameState(prev => {
            if (!prev) return null;
            const updatedPlayer = { ...prev.playerDetails[PLAYER_ID], name: null, character: null };
            let runStartState: any = null;
            if (!hardReset) {
                 const storedPlayerDetailsString = localStorage.getItem('wildWestPlayerDetailsForNGPlus_WWS');
                 if (storedPlayerDetailsString) {
                     try {
                         const storedPlayerDetails = JSON.parse(storedPlayerDetailsString);
                         if (storedPlayerDetails.name && storedPlayerDetails.characterId) {
                             updatedPlayer.name = storedPlayerDetails.name;
                             updatedPlayer.character = CHARACTERS_DATA_MAP[storedPlayerDetails.characterId] || null;
                         }
                     } catch (e) { localStorage.removeItem('wildWestPlayerDetailsForNGPlus_WWS'); }
                 }
                 const runStartStateString = localStorage.getItem('wildWestRunStartState_WWS');
                 if (runStartStateString) {
                     try { runStartState = JSON.parse(runStartStateString); } catch (e) { localStorage.removeItem('wildWestRunStartState_WWS'); }
                 }
            }
            if (runStartState && updatedPlayer.character && runStartState.characterId === updatedPlayer.character.id) {
                 updatedPlayer.playerDeck = runStartState.deck || [];
                 updatedPlayer.playerDiscard = runStartState.discard || [];
                 updatedPlayer.equippedItems = runStartState.equipped || [];
                 const hatEquippedOnRetry = updatedPlayer.equippedItems.some(item => item.effect?.subtype === 'damage_negation');
                 updatedPlayer.hatDamageNegationAvailable = hatEquippedOnRetry;
                 const satchelIds = runStartState.satchel || [];
                 updatedPlayer.satchel = satchelIds.map((id:string) => finalCardsData[id]).filter(Boolean);
                 updatedPlayer.gold = runStartState.gold || 0;
                 updatedPlayer.maxHealth = runStartState.maxHealth || updatedPlayer.character?.health || 30;
                 updatedPlayer.health = runStartState.health || updatedPlayer.maxHealth;
                 updatedPlayer.stepsTaken = runStartState.stepsTaken || updatedPlayer.stepsTaken;
                 _log(`Restored state for ${updatedPlayer.name} to retry NG+${level}.`, "system");
            }
            let showRewardModal = false;
            let ngPlusRewardModalState: ModalState = initialModalState;
            const rewardChosen = localStorage.getItem('ngPlusRewardChosen_WWS') === 'true';
            if (level > 0 && !rewardChosen) {
                 showRewardModal = true;
                 ngPlusRewardModalState = { isOpen: true, title: `Welcome to NG+${level}`, text: "Choose a boon:", choices: [ { text: `+1 Max Health`, callback: () => {} }, { text: `+100 Gold`, callback: () => {} } ] };
            }
            return {
                ...prev, isLoadingNGPlus: false, initialCardPool: themedPool, showNGPlusRewardModal: showRewardModal,
                modals: { ...prev.modals, ngPlusReward: ngPlusRewardModalState },
                playerDetails: { ...prev.playerDetails, [PLAYER_ID]: updatedPlayer },
            };
        });
      } catch (err) {
        const error = err as Error;
        _log(`Critical error initializing game: ${error.message}. Resetting.`, "error");
        Object.keys(localStorage).forEach(key => { if (key.endsWith('_WWS')) localStorage.removeItem(key); });
        setTimeout(() => {
            const baseInitialState: GameState = {
                runId: crypto.randomUUID(),
                status: 'landing', playerDetails: { [PLAYER_ID]: { ...INITIAL_PLAYER_STATE_TEMPLATE, ngPlusLevel: 0, cumulativeNGPlusMaxHealthBonus: 0 } }, eventDeck: [], eventDiscardPile: [], activeEvent: null, activeObjective: null, storeItemDeck: [], storeDisplayItems: [], storeItemDiscardPile: [], turn: 0, storyGenerated: false, log: [], selectedCard: null, ngPlusLevel: 0, modals: { message: { isOpen: true, title: "Game Reset", text: "An error occurred during startup, game has been reset." }, story: initialModalState, ngPlusReward: initialModalState }, activeGameBanner: initialGameBannerState, blockTradeDueToHostileEvent: false, playerDeckAugmentationPool: [], initialCardPool: getThemedCardPool(0, ALL_CARDS_DATA_MAP), activeEventTurnCounter: 0, scrollAnimationPhase: 'none', isLoadingStory: false, pedometerFeatureEnabledByUser: false, showObjectiveSummaryModal: false, objectiveSummary: undefined, eventDifficultyBonus: 0,
            };
            setGameState(baseInitialState);
        }, 0);
      }
    };
    initializeLevel(ngPlusLevel);
  }, [_log, pregenerateNextLevelRemix]);

  const selectCharacter = useCallback((character: Character) => {
    setGameState(prev => {
      if (!prev || prev.status !== 'setup') return prev;
      let currentNGPlusLevel = prev.ngPlusLevel;
      let cumulativeBonus = prev.playerDetails[PLAYER_ID]?.cumulativeNGPlusMaxHealthBonus || 0;
      let goldForCharacterSelection = character.gold;
      let equippedItemsForCharacterSelection: CardData[] = [];
      let satchelContentsForCharacterSelection: CardData[] = [];
      let currentMaxHealth = character.health + cumulativeBonus;

      if (currentNGPlusLevel > 0) {
          const storedGold = localStorage.getItem('ngPlusPlayerGold_WWS');
          if (storedGold !== null) goldForCharacterSelection = parseInt(storedGold, 10);
          const carriedOverEquippedString = localStorage.getItem('wildWestPlayerEquipped_WWS');
          equippedItemsForCharacterSelection = JSON.parse(carriedOverEquippedString || '[]') as CardData[];
          const carriedOverSatchelString = localStorage.getItem('wildWestSatchelContents_WWS');
          satchelContentsForCharacterSelection = JSON.parse(carriedOverSatchelString || '[]') as CardData[];
          let hpBonusFromItems = 0;
          equippedItemsForCharacterSelection.forEach(item => {
              if (item.effect?.persistent && item.type === 'Player Upgrade') {
                  if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') hpBonusFromItems += item.effect.amount;
                  else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') hpBonusFromItems += item.effect.max_health;
              }
          });
          currentMaxHealth += hpBonusFromItems;
      }
      const finalMaxHealth = Math.max(1, currentMaxHealth);
      const updatedPlayerDetails: PlayerDetails = {
        ...INITIAL_PLAYER_STATE_TEMPLATE,
        name: prev.playerDetails[PLAYER_ID]?.name || null,
        character, health: finalMaxHealth, maxHealth: finalMaxHealth,
        characterBaseMaxHealthForRun: character.health + cumulativeBonus,
        playerDeck: [], equippedItems: equippedItemsForCharacterSelection, satchel: satchelContentsForCharacterSelection,
        hand: new Array(HAND_LIMIT).fill(null),
        ngPlusLevel: currentNGPlusLevel, gold: goldForCharacterSelection,
        cumulativeNGPlusMaxHealthBonus: cumulativeBonus,
        stepsTaken: prev.playerDetails[PLAYER_ID]?.stepsTaken || 0,
        handSize: HAND_LIMIT, equipSlots: EQUIP_LIMIT, currentIllnesses: [],
        mountainSicknessActive: false, mountainSicknessTurnsRemaining: 0, 
        hatDamageNegationAvailable: equippedItemsForCharacterSelection.some(item => item.effect?.subtype === 'damage_negation'),
        runStats: { ...JSON.parse(JSON.stringify(INITIAL_RUN_STATS)), highestNGPlusLevel: currentNGPlusLevel },
        personality: character.personality,
      };
      _log(`${character.name} selected for NG+${currentNGPlusLevel}.`, 'system');
      return { ...prev, playerDetails: { [PLAYER_ID]: updatedPlayerDetails } };
    });
  }, [_log]);

  const confirmName = useCallback((name: string) => {
    setGameState(prev => {
      if (!prev || prev.status !== 'setup') return prev;
       _log(`Name set: ${name}.`, 'system');
       localStorage.setItem('wildWestPlayerDetailsForNGPlus_WWS', JSON.stringify({ name: name, characterId: prev.playerDetails[PLAYER_ID]?.character?.id }));
      return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: { ...prev.playerDetails[PLAYER_ID], name } } };
    });
  }, [_log]);

  const startGame = useCallback(async (playerName: string, character: Character, cheatEffects?: PopCultureCheatEffect) => {
    if (isActionInProgress.current) return;
    isActionInProgress.current = true;
    try {
        const currentGameState = gameStateRef.current;
        if (!currentGameState) { _log("Game state unavailable.", "error"); return; }
        
        let characterForGame = { ...character }; // Use a mutable copy
        
        setGameState(prev => ({
            ...prev!, status: 'generating_boss_intro', isLoadingBossIntro: true,
            playerDetails: { ...prev!.playerDetails, [PLAYER_ID]: { ...prev!.playerDetails[PLAYER_ID], name: playerName, character: characterForGame } },
        }));
        
        if (cheatEffects) {
          setGameState(prev => {
            if (!prev) return null;
            let modPlayer = { ...prev.playerDetails[PLAYER_ID] };
            let modGameState = { ...prev };

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
            if (cheatEffects.increaseDifficulty) {
               modGameState.eventDifficultyBonus = (modGameState.eventDifficultyBonus || 0) + cheatEffects.increaseDifficulty;
               _log(`Cheat Activated: Event difficulty bonus increased by ${cheatEffects.increaseDifficulty}.`, 'system');
            }
            
            return {
              ...modGameState,
              playerDetails: { ...modGameState.playerDetails, [PLAYER_ID]: modPlayer }
            };
          });
        }
        
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
                // The new logic will already have added a card, so no need for this block.
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
  }, [_log, pregenerateNextLevelRemix]);

  const proceedToGamePlay = useCallback(async () => {
    if (remixGenerationPromise.current) {
        setGameState(prev => prev ? { ...prev, isLoadingNGPlus: true } : null);
        await remixGenerationPromise.current;
        setGameState(prev => prev ? { ...prev, isLoadingNGPlus: false } : null);
    }

    _log("Proceeding to gameplay...", "system");
    
    const currentState = gameStateRef.current;
    if (!currentState || !currentState.playerDetails[PLAYER_ID]?.character) return;

    const pendingRewardsString = localStorage.getItem('wildWestPendingRewardCards_WWS');
    localStorage.removeItem('wildWestPendingRewardCards_WWS'); // Consume it
    const rewardCards: CardData[] = pendingRewardsString ? JSON.parse(pendingRewardsString) : [];

    const playerDetailsFromSetup = currentState.playerDetails[PLAYER_ID];
    const playerChar = playerDetailsFromSetup.character as Character;
    let gameUpdates: Partial<GameState> = {};
    
    let finalPlayerDeck: CardData[];
    const starterDeckCards = playerChar.starterDeck.map(id => CURRENT_CARDS_DATA[id]).filter(Boolean) as CardData[];
    finalPlayerDeck = [...starterDeckCards];
    
    const carriedOverCardIds = new Set<string>([
        ...(JSON.parse(localStorage.getItem('wildWestPlayerDeck_WWS') || '[]') as CardData[]).map(c => c.id),
        ...playerDetailsFromSetup.equippedItems.map(c => c.id),
        ...playerDetailsFromSetup.satchel.map(c => c.id)
    ]);

    const starterCardIdsForPoolFiltering = playerChar.starterDeck || [];
    const allPlayerOwnedCardIdsForPool = new Set<string>([...carriedOverCardIds, ...starterCardIdsForPoolFiltering]);
    let currentCardPool = currentState.initialCardPool.filter(c => !allPlayerOwnedCardIdsForPool.has(c.id) && c.subType !== 'objective');

    const pickPrioritizingRemixed = (pool: CardData[], filter: (c: CardData) => boolean, count: number) => {
        const allMatching = pool.filter(filter);
        const remixedItems = allMatching.filter(c => c.id.startsWith('remixed_'));
        const originalItems = allMatching.filter(c => !c.id.startsWith('remixed_'));
        
        let pickedItems: CardData[] = [];
        
        const shuffledRemixed = shuffleArray(remixedItems);
        pickedItems.push(...shuffledRemixed);
        
        const neededMore = count - pickedItems.length;
        if (neededMore > 0) {
            const shuffledOriginals = shuffleArray(originalItems);
            pickedItems.push(...shuffledOriginals.slice(0, neededMore));
        }
        
        pickedItems = pickedItems.slice(0, count);
        const pickedIds = new Set(pickedItems.map(c => c.id));
        const remainingPool = pool.filter(c => !pickedIds.has(c.id));
        
        return { picked: pickedItems, remainingPool };
    };

    const allObjectiveCards = Object.values(ALL_CARDS_DATA_MAP).filter(c => c.subType === 'objective');
    let chosenObjective: CardData | null = null;
    if (allObjectiveCards.length > 0) {
        chosenObjective = allObjectiveCards[Math.floor(Math.random() * allObjectiveCards.length)];
        _log(`Objective: ${chosenObjective.name}`, 'system');
    }

    const threatFilter = (c: CardData) => c.type === 'Event' && (c.subType === 'animal' || c.subType === 'human');
    const illnessEnvFilter = (c: CardData) => c.type === 'Event' && (c.subType === 'illness' || c.subType === 'environmental');
    const valuableFilter = (c: CardData) => c.type === 'Item' && (c.id.startsWith('item_gold_nugget') || c.id.startsWith('item_jewelry'));
    const uniqueCharItemIds = new Set(Object.values(CHARACTERS_DATA_MAP).map(c => c.starterDeck[2]));
    const genericItemFilter = (c: CardData) => (c.type === 'Item' || c.type === 'Provision' || c.type === 'Action' || c.type === 'Player Upgrade') && !valuableFilter(c) && !uniqueCharItemIds.has(c.id);

    let threatResult = pickPrioritizingRemixed(currentCardPool, threatFilter, 15); currentCardPool = threatResult.remainingPool;
    let illnessResult = pickPrioritizingRemixed(currentCardPool, illnessEnvFilter, 2); currentCardPool = illnessResult.remainingPool;
    let valuableResult = pickPrioritizingRemixed(currentCardPool, valuableFilter, Math.floor(Math.random() * 4)); currentCardPool = valuableResult.remainingPool;
    const neededFillerItems = EVENT_DECK_SIZE - (threatResult.picked.length + illnessResult.picked.length + valuableResult.picked.length);
    let fillerResult = pickPrioritizingRemixed(currentCardPool, genericItemFilter, neededFillerItems); currentCardPool = fillerResult.remainingPool;
    let storeItemsResult = pickPrioritizingRemixed(currentCardPool, genericItemFilter, STORE_DECK_TARGET_SIZE); currentCardPool = storeItemsResult.remainingPool;

    const allPickedForEventDeck = [...threatResult.picked, ...illnessResult.picked, ...valuableResult.picked, ...fillerResult.picked];
    let eventThreats = allPickedForEventDeck.filter(c => c.subType === 'animal' || c.subType === 'human');
    const eventNonThreats = shuffleArray(allPickedForEventDeck.filter(c => c.subType !== 'animal' && c.subType !== 'human'));
    if (currentState.ngPlusLevel % 10 === 0) eventThreats.sort((a, b) => (a.health || 0) - (b.health || 0));
    else eventThreats = shuffleArray(eventThreats);
    
    const finalEventDeck: CardData[] = [];
    let threatIdx = 0, nonThreatIdx = 0;
    const ratio = eventNonThreats.length > 0 ? eventThreats.length / (eventThreats.length + eventNonThreats.length) : 1;
    while (threatIdx < eventThreats.length || nonThreatIdx < eventNonThreats.length) {
      if (threatIdx < eventThreats.length && (Math.random() < ratio || nonThreatIdx >= eventNonThreats.length)) finalEventDeck.push(eventThreats[threatIdx++]);
      else if (nonThreatIdx < eventNonThreats.length) finalEventDeck.push(eventNonThreats[nonThreatIdx++]);
      else break;
    }
    if (chosenObjective) finalEventDeck.unshift(chosenObjective);

    let storeItemDeck = shuffleArray(storeItemsResult.picked);
    const storeDisplayItems = storeItemDeck.splice(0, STORE_DISPLAY_LIMIT).map(card => getScaledCard(card, currentState.ngPlusLevel));
    
    gameUpdates.eventDeck = finalEventDeck;
    gameUpdates.storeItemDeck = storeItemDeck;
    gameUpdates.storeDisplayItems = storeDisplayItems;
    
    if (currentState.ngPlusLevel > 0) {
        const carriedOverDeckItems = JSON.parse(localStorage.getItem('wildWestPlayerDeck_WWS') || '[]') as CardData[];
        const uniqueStarterCards = playerChar.starterDeck
            .filter(id => id !== 'provision_dried_meat' && !carriedOverCardIds.has(id))
            .map(id => CURRENT_CARDS_DATA[id])
            .filter(Boolean) as CardData[];
        
        finalPlayerDeck = [...carriedOverDeckItems, ...uniqueStarterCards];
    }
    
    const playerValuablesResult = pickPrioritizingRemixed(currentCardPool, valuableFilter, Math.floor(Math.random() * 4));
    currentCardPool = playerValuablesResult.remainingPool;
    const neededPlayerItems = Math.max(0, PLAYER_DECK_TARGET_SIZE - finalPlayerDeck.length - playerValuablesResult.picked.length);
    const playerItemsResult = pickPrioritizingRemixed(currentCardPool, genericItemFilter, neededPlayerItems);
    const playerDeckAugmentationPool = [...playerValuablesResult.picked, ...playerItemsResult.picked];
    finalPlayerDeck.push(...playerDeckAugmentationPool);

    if (localStorage.getItem('objectiveReward_well_prepared_WWS') === 'true') {
        const steakCard = CURRENT_CARDS_DATA['provision_steak'];
        if (steakCard) {
            finalPlayerDeck = finalPlayerDeck.filter(card => card.id !== 'provision_dried_meat');
            for (let i = 0; i < 5; i++) finalPlayerDeck.push(steakCard);
            _log(`'Well-Prepared' reward: Replaced Dried Meat with 5 Steak.`, 'system');
        }
        localStorage.removeItem('objectiveReward_well_prepared_WWS');
    }
    
    if (finalPlayerDeck.length < PLAYER_DECK_TARGET_SIZE) {
        const extraCards = storeItemDeck.splice(0, PLAYER_DECK_TARGET_SIZE - finalPlayerDeck.length);
        finalPlayerDeck.push(...extraCards);
    }
    if (finalPlayerDeck.length > PLAYER_DECK_TARGET_SIZE) finalPlayerDeck = finalPlayerDeck.slice(0, PLAYER_DECK_TARGET_SIZE);

    if (currentState.remixDeckOnStart) {
        _log("AI is remixing the full starting deck...", "system");
        setGameState(current => ({ ...current!, isLoadingNGPlus: true }));

        const uniqueCardsInDeck = [...new Map(finalPlayerDeck.map(card => [card.id, card])).values()];
        const cardsToRemix: CardData[] = uniqueCardsInDeck.filter(card => !card.isCheat);

        try {
            const remixPromises = cardsToRemix.map(async (card) => {
                const remixedResult = await remixCardsForNGPlusGame(_log, { [card.id]: card }, currentState.ngPlusLevel);
                if (remixedResult && Object.keys(remixedResult).length > 0) {
                    const newCard = Object.values(remixedResult)[0];
                    return { originalId: card.id, newCard };
                }
                return { originalId: card.id, newCard: null };
            });
            const settledRemixes = await Promise.all(remixPromises);
            const remixedCardsMap = new Map<string, CardData>();
            const newCardDataForUpdate: { [id: string]: CardData } = {};
            settledRemixes.forEach(result => {
                if (result.newCard) {
                    remixedCardsMap.set(result.originalId, result.newCard);
                    newCardDataForUpdate[result.newCard.id] = result.newCard;
                }
            });
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

    finalPlayerDeck = shuffleArray(finalPlayerDeck);
    const initialHand: (CardData | null)[] = new Array(HAND_LIMIT).fill(null);
    for (let i = 0; i < HAND_LIMIT; i++) {
        if (finalPlayerDeck.length > 0) initialHand[i] = getScaledCard(finalPlayerDeck.shift()!, currentState.ngPlusLevel);
    }
    const actualInitialHandCards = initialHand.filter(c => c !== null) as CardData[];
    actualInitialHandCards.sort((a, b) => getCardCategory(a) - getCardCategory(b) || a.name.localeCompare(b.name));
    const sortedInitialHand: (CardData | null)[] = new Array(HAND_LIMIT).fill(null);
    actualInitialHandCards.forEach((card, idx) => sortedInitialHand[idx] = card);
    
    const finalPlayerDiscard = [...playerDetailsFromSetup.playerDiscard];

    const cheat = POP_CULTURE_CHEATS.find(c => c.name.toLowerCase() === playerDetailsFromSetup.name?.toLowerCase() && c.requiredCharacterId === playerChar.id);
    if (cheat && cheat.effects.addCustomCards) {
        const customCards = cheat.effects.addCustomCards;
        
        // Check for existing cheat cards to prevent duplication
        const allPlayerCardIds = new Set([
            ...playerDetailsFromSetup.equippedItems.map(c => c.id),
            ...playerDetailsFromSetup.satchel.map(c => c.id),
            ...finalPlayerDeck.map(c => c.id),
            ...(playerDetailsFromSetup.playerDiscard || []).map(c => c.id)
        ]);

        const newCardsToAdd = customCards.filter(customCard => !allPlayerCardIds.has(customCard.id));

        if (newCardsToAdd.length > 0) {
            _log(`A legend's gear manifests: ${newCardsToAdd.map(c => c.name).join(', ')}.`, 'system');
            const newCardsMap = { ...CURRENT_CARDS_DATA };
            newCardsToAdd.forEach(card => {
                newCardsMap[card.id] = card;
            });
            updateCurrentCardsData(newCardsMap);
            finalPlayerDiscard.push(...newCardsToAdd);
        } else {
            _log(`Legendary gear already present.`, 'debug');
        }
    }

    if (rewardCards.length > 0) {
        rewardCards.forEach(itemCard => {
            _log(`Reward delivered: ${itemCard.name}. Added to discard.`, 'system');
            updateCurrentCardsData({ ...CURRENT_CARDS_DATA, [itemCard.id]: itemCard });
        });
        finalPlayerDiscard.push(...rewardCards);
    }
    
    const runStartState = {
        deck: [...finalPlayerDeck, ...actualInitialHandCards],
        discard: finalPlayerDiscard,
        equipped: playerDetailsFromSetup.equippedItems,
        satchel: playerDetailsFromSetup.satchel.map(c => c.id),
        gold: playerDetailsFromSetup.gold,
        maxHealth: playerDetailsFromSetup.maxHealth,
        health: playerDetailsFromSetup.health,
        characterId: playerChar.id,
        stepsTaken: playerDetailsFromSetup.stepsTaken,
    };
    localStorage.setItem('wildWestRunStartState_WWS', JSON.stringify(runStartState));
    _log("Saved run start state.", "debug");
    
    const cleanPlayerForStart: PlayerDetails = {
        ...playerDetailsFromSetup,
        currentIllnesses: [], // Explicitly clear illnesses
        mountainSicknessActive: false, // Explicitly clear mountain sickness
        mountainSicknessTurnsRemaining: 0, // Explicitly clear
        playerDeck: finalPlayerDeck,
        hand: sortedInitialHand,
        playerDiscard: finalPlayerDiscard,
        characterBaseMaxHealthForRun: playerChar.health + playerDetailsFromSetup.cumulativeNGPlusMaxHealthBonus,
        isUnsortedDraw: false,
    };
    const theme = getThemeName(currentState.ngPlusLevel);
    _log(getRandomLogVariation('playerDeckFinalized', { currentHP: cleanPlayerForStart.health, maxHP: cleanPlayerForStart.maxHealth }, theme, cleanPlayerForStart));

    setGameState({
        ...currentState, status: 'playing_initial_reveal', ...gameUpdates,
        playerDeckAugmentationPool: [],
        playerDetails: { ...currentState.playerDetails, [PLAYER_ID]: cleanPlayerForStart },
        turn: 1,
        isLoadingNGPlus: false,
        remixDeckOnStart: false,
    });
  }, [_log, pregenerateNextLevelRemix]);

   useEffect(() => {
    if (gameState?.status === 'playing_initial_reveal') {
        let modPlayer = { ...gameState.playerDetails[PLAYER_ID] };
        let eventDeck = [...gameState.eventDeck];
        let eventDiscard = [...gameState.eventDiscardPile];
        let activeEventForDay1: CardData | null = null;
        let gameShouldEndFromInitialReveal = false;
        let winReasonFromInitialReveal = "";
        let damageAnimationForInitialReveal: { amount: number; sourceName: string; eventId?: string } | null = null;

        if (eventDeck.length > 0) {
            const firstEventBase = eventDeck.shift()!;
            
            let firstEvent = getScaledCard(firstEventBase, gameState.ngPlusLevel);
            if (firstEvent && (gameState.eventDifficultyBonus || 0) > 0) {
                firstEvent = applyDifficultyBonus(firstEvent, gameState.eventDifficultyBonus || 0);
            }
            if (eventDeck.length === 0 && !gameShouldEndFromInitialReveal) {
                triggerBanner("The Event Deck is empty! The boss will appear next turn!", 'event_alert');
            }

            const { updatedPlayer, turnEndedByEvent, gameShouldEnd, eventRemoved, winReason, damageInfo, modifiedEventAfterTrap } = applyImmediateEventAndCheckEndTurn(firstEvent, modPlayer, gameState.aiBoss, gameState.ngPlusLevel);
            modPlayer = updatedPlayer;
            if (damageInfo) damageAnimationForInitialReveal = damageInfo;
            if (gameShouldEnd) {
                gameShouldEndFromInitialReveal = true;
                winReasonFromInitialReveal = winReason || "Defeated on first reveal!";
            }
            if (eventRemoved) {
                eventDiscard.push(firstEventBase);
                activeEventForDay1 = null;
            } else {
                activeEventForDay1 = modifiedEventAfterTrap;
            }
            if (firstEvent.id.startsWith('threat_lightning_strike')) {
                 soundManager.playSound('lightning_strike');
                 setGameState(prev => prev ? {...prev, showLightningStrikeFlash: true } : null);
                 setTimeout(() => setGameState(prev => prev ? {...prev, showLightningStrikeFlash: false } : null), 500);
            } else if (firstEvent.id.startsWith('threat_rockslide') || firstEvent.id.startsWith('threat_flash_flood')) {
                soundManager.playSound('rockslide');
            } else if (firstEvent.id.startsWith('threat_mountain_sickness') || firstEvent.id.startsWith('threat_heat_stroke')) {
                soundManager.playSound('mountain_sickness');
            }
        }
        setGameState(prev => {
            if (!prev) return null;
            const playerUpdates = { ...modPlayer };
            if (gameShouldEndFromInitialReveal) {
                playerUpdates.runStats.totalStepsTaken = playerUpdates.stepsTaken;
                playerUpdates.runStats.mostGoldHeld = Math.max(playerUpdates.runStats.mostGoldHeld || 0, playerUpdates.gold);
                updateLifetimeStats(playerUpdates.runStats);
            }
            return {
                ...prev, status: gameShouldEndFromInitialReveal ? 'finished' : 'playing',
                winReason: gameShouldEndFromInitialReveal ? winReasonFromInitialReveal : prev.winReason,
                playerDetails: { ...prev.playerDetails, [PLAYER_ID]: playerUpdates },
                eventDeck, eventDiscardPile: eventDiscard, activeEvent: activeEventForDay1,
                activeEventTurnCounter: activeEventForDay1 ? 1 : 0,
                pendingPlayerDamageAnimation: damageAnimationForInitialReveal,
                blockTradeDueToHostileEvent: isEventConsideredHostile(activeEventForDay1),
            };
        });
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [gameState?.status]);

  const handlePostGame = useCallback(() => {
    ttsManager.cancel();
// FIX: Removed call to non-existent ttsManager.unlockNarration().
// The ttsManager.cancel() call already handles unlocking narration for subsequent logs.
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;
    if (currentGameState.playerDetails[PLAYER_ID].health > 0) {
        setGameState(prev => !prev ? null : { ...prev, status: 'deck_review', modals: { ...prev.modals, story: { ...prev.modals.story, isOpen: false } } });
    } else {
        resetGame({ ngPlusOverride: currentGameState.ngPlusLevel });
        closeModal('story');
    }
  }, [resetGame, closeModal]);

  const confirmDeckSelection = useCallback((selectedIndicesArray: number[]) => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState || !currentGameState.deckForReview) return;
    const selectedIndices = new Set(selectedIndicesArray);
    const selectedCards = currentGameState.deckForReview.filter((_, index) => selectedIndices.has(index));
    const unselectedCards = currentGameState.deckForReview.filter((_, index) => !selectedIndices.has(index));
    localStorage.setItem('wildWestPlayerDeck_WWS', JSON.stringify(selectedCards));
    const goldFromSales = unselectedCards.reduce((total, card) => total + (card.sellValue || 0), 0);
    const currentGold = parseInt(localStorage.getItem('ngPlusPlayerGold_WWS') || '0');
    localStorage.setItem('ngPlusPlayerGold_WWS', (currentGold + goldFromSales).toString());
    _log(`Carrying over ${selectedCards.length} cards. Sold ${unselectedCards.length} for ${goldFromSales}G.`, 'system');
    localStorage.removeItem('wildWestRunStartState_WWS');
    resetGame({ ngPlusOverride: currentGameState.ngPlusLevel + 1 });
  }, [resetGame, _log]);
  
  const fullResetGame = useCallback((options?: { saveSlotIndex?: number }) => {
    ttsManager.cancel();
    resetGame({ hardReset: true, ...options });
  }, [resetGame]);
  const deselectAllCards = useCallback(() => setGameState(prev => !prev || !prev.selectedCard ? prev : { ...prev, selectedCard: null }), []);
  const setSelectedCard = useCallback((details: { card: CardData; source: string; index: number } | null) => setGameState(prev => !prev ? null : { ...prev, selectedCard: details }), []);
  
  // FIX: Add missing setPersonality function.
  const setPersonality = useCallback((traits: { archetype?: string; temperament?: string; motivation?: string; }) => {
    setGameState(prev => {
      if (!prev || prev.status !== 'setup') return prev;
      const playerDetails = prev.playerDetails[PLAYER_ID];
      const updatedPersonality = { ...playerDetails.personality, ...traits };
      const updatedPlayerDetails = { ...playerDetails, personality: updatedPersonality };
      return {
        ...prev,
        playerDetails: {
          ...prev.playerDetails,
          [PLAYER_ID]: updatedPlayerDetails
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
      if (autoEndTurnTimerRef.current) clearTimeout(autoEndTurnTimerRef.current);
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
    const saves = getSaveGames();
    const savedState = saves[slotIndex];
    if (savedState) {
      const themeName = getThemeName(savedState.ngPlusLevel || 0);
      let remixedCards: { [id: string]: CardData } = {};
      if (savedState.ngPlusLevel > 0 && savedState.ngPlusLevel < 10) {
          const remixedPoolKey = 'remixedCardPool_theme_western_WWS';
          remixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
      } else if (savedState.ngPlusLevel >= 10) {
          const remixedPoolKey = `remixedCardPool_theme_${themeName}_WWS`;
          remixedCards = JSON.parse(localStorage.getItem(remixedPoolKey) || '{}');
      }

      const finalCardsData = { ...ALL_CARDS_DATA_MAP, ...remixedCards };
      if (savedState.aiBoss?.id) {
          finalCardsData[savedState.aiBoss.id] = savedState.aiBoss;
      }
      updateCurrentCardsData(finalCardsData);

      const rehydratedState: GameState = {
        ...savedState,
        runId: savedState.runId || crypto.randomUUID(),
        modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
        activeGameBanner: initialGameBannerState,
        pendingPlayerDamageAnimation: null,
        scrollAnimationPhase: 'none',
        newlyDrawnCardIndices: undefined,
        triggerEquipAnimation: false,
        isLoadingBossIntro: false,
        isLoadingStory: false,
        isLoadingNGPlus: false,
        showNGPlusRewardModal: false,
        selectedCard: null,
      };

      setGameState(rehydratedState);
      _log(`Game loaded from slot ${slotIndex + 1}.`, 'system');
      localStorage.setItem('wildWestGameState_WWS', JSON.stringify(rehydratedState));
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
    // Save the uploaded state into the specified slot
    const stateToSave = {
      ...uploadedGameState,
      runId: uploadedGameState.runId || crypto.randomUUID(),
    };
    const success = saveGameToSlot(stateToSave, slotIndex);
    if (success) {
      _log(`Game state from file successfully saved to slot ${slotIndex + 1}.`, 'system');
      // Now, load the game from that slot, which rehydrates everything properly
      loadGame(slotIndex);
    } else {
      _log(`Failed to save uploaded game to slot ${slotIndex + 1}.`, 'error');
    }
  }, [_log, loadGame]);

  const startNextLevelRemix = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;
    const nextLevel = currentGameState.ngPlusLevel + 1;
    _log(`Pregenerating assets for NG+${nextLevel}...`, "system");
    nextLevelRemixPromise.current = pregenerateNextLevelRemix(nextLevel);
  }, [_log, pregenerateNextLevelRemix]);

  useEffect(() => {
    if (gameState === null) {
      const savedStateString = localStorage.getItem('wildWestGameState_WWS');
      if (savedStateString) {
        try {
          const savedState = JSON.parse(savedStateString);

          if (savedState.status === 'finished') {
            _log("Stuck 'finished' state detected. Recovering progress...", "system");
            const player = savedState.playerDetails?.[PLAYER_ID];

            if (player) {
              if (player.health > 0) { // WIN RECOVERY
                _log("Recovering from a victory.", "system");
                player.runStats.totalVictories = 1;
                if (player.character) {
                  player.runStats.victoriesByCharacter[player.character.id] = (player.runStats.victoriesByCharacter[player.character.id] || 0) + 1;
                }
                updateLifetimeStats(player.runStats);

                const allCardsForReview = [
                    ...(player.hand?.filter(Boolean) || []),
                    ...(player.playerDeck || []),
                    ...(player.playerDiscard || [])
                ];
                if (player.activeTrap) {
                  allCardsForReview.push(player.activeTrap);
                }

                const recoveredState = {
                  ...savedState,
                  status: 'deck_review',
                  deckForReview: allCardsForReview,
                  modals: { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState },
                  activeGameBanner: null,
                  selectedCard: null,
                  isLoadingStory: false,
                };
                setGameState(recoveredState);
                localStorage.removeItem('wildWestGameState_WWS');
                return;
              } else { // LOSS RECOVERY
                _log("Recovering from a defeat.", "system");
                localStorage.removeItem('wildWestGameState_WWS');
                resetGame({ ngPlusOverride: savedState.ngPlusLevel });
                return;
              }
            } else {
              _log("Unrecoverable 'finished' state without player data. Performing hard reset.", "error");
              resetGame({ hardReset: true });
              return;
            }
          }
          
          // Rehydrate character object to include new properties like skills
          if (savedState.playerDetails?.[PLAYER_ID]?.character?.id) {
            const charId = savedState.playerDetails[PLAYER_ID].character.id;
            const fullCharData = CHARACTERS_DATA_MAP[charId];
            if (fullCharData) {
              savedState.playerDetails[PLAYER_ID].character = fullCharData;
            }
          }

          if (savedState.playerDetails?.[PLAYER_ID]) {
              savedState.playerDetails[PLAYER_ID].hatDamageNegationAvailable = savedState.playerDetails[PLAYER_ID].equippedItems.some((item: CardData) => item.effect?.subtype === 'damage_negation');
          }
          const ngPlusMilestone = Math.floor((savedState.ngPlusLevel || 0) / NG_PLUS_THEME_MILESTONE_INTERVAL) * NG_PLUS_THEME_MILESTONE_INTERVAL;
          const remixedCards = JSON.parse(localStorage.getItem(`ngPlusThemeSet_${ngPlusMilestone}_WWS`) || '{}');
          const finalCardsData = { ...ALL_CARDS_DATA_MAP, ...remixedCards };
          if (savedState.aiBoss?.id) finalCardsData[savedState.aiBoss.id] = savedState.aiBoss;
          updateCurrentCardsData(finalCardsData);

          savedState.modals = { message: initialModalState, story: initialModalState, ngPlusReward: initialModalState };
          savedState.activeGameBanner = initialGameBannerState;
          savedState.pendingPlayerDamageAnimation = null;
          savedState.scrollAnimationPhase = 'none';
          savedState.newlyDrawnCardIndices = undefined;
          savedState.triggerEquipAnimation = false;
          savedState.runId = savedState.runId || crypto.randomUUID();
          
          setGameState(savedState);
        } catch (error) {
          _log("Error loading saved game. Starting fresh.", "error");
          resetGame({ hardReset: true });
        }
      } else {
        resetGame();
      }
    }
  }, []);

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
    showEndTurnFade,
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
  };
};
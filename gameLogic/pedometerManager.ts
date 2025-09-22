import React from 'react';
import { GameState, PlayerDetails, LogEntry } from '../types.ts';
import { getRandomLogVariation } from '../utils/logUtils.ts';
// FIX: The getScaledCard function was moved to cardUtils, so this import is now correct. - This comment is obsolete.
import { shuffleArray, getScaledCard } from '../utils/cardUtils.ts';
// FIX: Import REQUIRED_ACCURACY_METERS from constants where it is now defined. - This comment is obsolete.
import { PLAYER_ID, REQUIRED_ACCURACY_METERS } from '../constants.ts';
import { getThemeName } from '../utils/themeUtils.ts';

// --- Pedometer Constants ---
export const METERS_TO_FEET = 3.28084;
export const FEET_PER_STEP = 2.5;
export const MAX_SPEED_MPS = 3.5;
export const MINIMUM_DISTANCE_METERS_FOR_STEP = 1;
export const STEPS_PER_GOLD = 50;
export const STEPS_PER_HEALTH = 100;
export const STEPS_PER_CARD_DRAW = 250;
const MAX_RESUME_TIME_GAP_SECONDS = 1800; // 30 minutes
const GPS_STALE_THRESHOLD_SECONDS = 60;

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 1000;
}

interface PedometerManagerDependencies {
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    _log: (message: string, type?: LogEntry['type']) => void;
    applyHealToPlayer: (player: PlayerDetails, healAmount: number, sourceName: string, isBossFight?: boolean) => PlayerDetails;
    triggerGoldFlash: (playerId: string) => void;
    gameStateRef: React.MutableRefObject<GameState | null>;
    pedometerWatchIdRef: React.MutableRefObject<number | null>;
}

export function createPedometerManager({
    setGameState,
    _log,
    applyHealToPlayer,
    triggerGoldFlash,
    gameStateRef,
    pedometerWatchIdRef
}: PedometerManagerDependencies) {

    const handlePedometerSuccess = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        setGameState(prev => {
            if (!prev) return null;
            if (prev.status !== 'playing' && prev.status !== 'playing_initial_reveal') {
                return prev; // Do not process pedometer rewards if game is not in an active play state.
            }
            
            let modPlayer = { ...prev.playerDetails[PLAYER_ID] };
            if (!modPlayer.pedometerActive) return prev;
            if (!modPlayer.isGettingLocation) modPlayer.isGettingLocation = true;
            modPlayer.locationAccuracy = accuracy;

            if (accuracy > REQUIRED_ACCURACY_METERS) return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } };
            
            if (modPlayer.lastPosition) {
                if (typeof modPlayer.lastPosition.timestamp !== 'number' || !isFinite(modPlayer.lastPosition.timestamp)) {
                    modPlayer.lastPosition = { latitude, longitude, timestamp };
                    modPlayer.unaccountedDistanceFeet = 0;
                    return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } };
                }
                const timeDiff = (timestamp - modPlayer.lastPosition.timestamp) / 1000;
                if (timeDiff > MAX_RESUME_TIME_GAP_SECONDS) {
                    _log(`Large GPS time gap detected. Resetting position.`, 'debug');
                    modPlayer.lastPosition = { latitude, longitude, timestamp };
                    modPlayer.unaccountedDistanceFeet = 0;
                    return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } };
                }
                const distance = getDistanceFromLatLonInM(modPlayer.lastPosition.latitude, modPlayer.lastPosition.longitude, latitude, longitude);
                if (distance < MINIMUM_DISTANCE_METERS_FOR_STEP) return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } };
                if (timeDiff > 0 && (distance / timeDiff > MAX_SPEED_MPS)) {
                    _log(`High speed detected. Resetting position.`, 'debug');
                    modPlayer.lastPosition = { latitude, longitude, timestamp };
                    modPlayer.unaccountedDistanceFeet = 0;
                    return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } };
                }

                let totalFeetMoved = (modPlayer.unaccountedDistanceFeet || 0) + (distance * METERS_TO_FEET);
                const newSteps = Math.floor(totalFeetMoved / FEET_PER_STEP);
                modPlayer.unaccountedDistanceFeet = totalFeetMoved % FEET_PER_STEP;

                if (newSteps > 0) {
                    const oldTotalSteps = modPlayer.stepsTaken || 0;
                    const newTotalSteps = oldTotalSteps + newSteps;
                    modPlayer.stepsTaken = newTotalSteps;
                    const hasFootwear = modPlayer.equippedItems.some(item => item.id.startsWith('upgrade_sturdy_boots_t1'));
                    const stepsPerGold = hasFootwear ? STEPS_PER_GOLD / 2 : STEPS_PER_GOLD;
                    const stepsPerHealth = hasFootwear ? STEPS_PER_HEALTH / 2 : STEPS_PER_HEALTH;
                    const stepsPerCardDraw = hasFootwear ? STEPS_PER_CARD_DRAW / 2 : STEPS_PER_CARD_DRAW;
                    const theme = getThemeName(modPlayer.ngPlusLevel);

                    // Rewards
                    const goldMilestones = Math.floor(newTotalSteps / stepsPerGold) - Math.floor(oldTotalSteps / stepsPerGold);
                    let goldGained = 0;
                    if (goldMilestones > 0) {
                        if (modPlayer.equippedItems.some(item => item.id.startsWith('upgrade_treasure_map'))) for (let i = 0; i < goldMilestones; i++) goldGained += Math.floor(Math.random() * 20) + 1;
                        else goldGained = goldMilestones;
                    }
                    if (goldGained > 0) {
                        modPlayer.gold += goldGained;
                        modPlayer.runStats.gold_earned += goldGained;
                        _log(getRandomLogVariation('goldFoundWalking', { playerName: modPlayer.name, goldAmount: goldGained }, theme, modPlayer), 'gold');
                        triggerGoldFlash(PLAYER_ID);
                    }
                    const healthGained = Math.floor(newTotalSteps / stepsPerHealth) - Math.floor(oldTotalSteps / stepsPerHealth);
                    const isBossFight = !!prev.aiBoss && prev.activeEvent?.id === prev.aiBoss.id;
                    if (healthGained > 0) modPlayer = applyHealToPlayer(modPlayer, healthGained, 'perseverance', isBossFight);
                    const cardsToDraw = Math.floor(newTotalSteps / stepsPerCardDraw) - Math.floor(oldTotalSteps / stepsPerCardDraw);
                    if (cardsToDraw > 0) {
                        let tempDeck = [...modPlayer.playerDeck], tempDiscard = [...modPlayer.playerDiscard], tempHand = [...modPlayer.hand];
                        let drawnCount = 0;
                        while (drawnCount < cardsToDraw) {
                            const emptySlot = tempHand.findIndex(s => s === null);
                            if (emptySlot === -1) break;
                            if (tempDeck.length === 0) { if (tempDiscard.length > 0) { tempDeck = shuffleArray(tempDiscard); tempDiscard = []; } else break; }
                            const card = tempDeck.shift();
                            if(card) { tempHand[emptySlot] = getScaledCard(card, modPlayer.ngPlusLevel); drawnCount++; }
                        }
                        if(drawnCount > 0) {
                            modPlayer.playerDeck = tempDeck; modPlayer.playerDiscard = tempDiscard; modPlayer.hand = tempHand; modPlayer.isUnsortedDraw = true;
                            _log(getRandomLogVariation('cardsDrawn', { cardsDrawn: drawnCount }, theme, modPlayer), 'info');
                        }
                    }
                }
            }
            modPlayer.lastPosition = { latitude, longitude, timestamp };
            return { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: modPlayer } };
        });
    };

    const handlePedometerError = (error: GeolocationPositionError) => {
        _log(`Pedometer error: ${error.message}`, "error");
        setGameState(prev => !prev ? null : { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: { ...prev.playerDetails[PLAYER_ID], isGettingLocation: false } } });
    };

    const togglePedometer = () => {
        const player = gameStateRef.current?.playerDetails[PLAYER_ID];
        if (!player) return;

        if (player.pedometerActive) {
            if (pedometerWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(pedometerWatchIdRef.current);
                pedometerWatchIdRef.current = null;
            }
            setGameState(prev => !prev ? null : { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: { ...prev.playerDetails[PLAYER_ID], pedometerActive: false, isGettingLocation: false, locationAccuracy: null } } });
            _log("Pedometer deactivated.", "system");
        } else {
            if ('geolocation' in navigator) {
                setGameState(prev => !prev ? null : { ...prev, playerDetails: { ...prev.playerDetails, [PLAYER_ID]: { ...prev.playerDetails[PLAYER_ID], pedometerActive: true, isGettingLocation: true } } });
                _log("Pedometer activated.", "system");
                pedometerWatchIdRef.current = navigator.geolocation.watchPosition(handlePedometerSuccess, handlePedometerError, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
            } else _log("Geolocation not supported.", "error");
        }
    };
    
    const handleVisibilityChange = () => {
        if (document.hidden) return;
        const player = gameStateRef.current?.playerDetails[PLAYER_ID];
        if (player?.pedometerActive && player.lastPosition) {
            const timeSinceLastUpdate = (Date.now() - player.lastPosition.timestamp) / 1000;
            if (timeSinceLastUpdate > GPS_STALE_THRESHOLD_SECONDS) {
                _log(`Stale GPS signal. Restarting pedometer...`, 'system');
                togglePedometer(); // Off
                setTimeout(() => togglePedometer(), 100); // On
            }
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (pedometerWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(pedometerWatchIdRef.current);
            pedometerWatchIdRef.current = null;
        }
    };

    return { togglePedometer, cleanup };
}
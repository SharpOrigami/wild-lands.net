import { GameState, PlayerDetails, LogEntry, CardData, CardContext, ActiveGameBannerState, RunStats } from '../types';
import { getRandomLogVariation } from './logUtils';
import { calculateHealAmount, calculateAttackPower, isFirearm, getScaledCard, createTrophyOrBountyCard, getCardCategory, shuffleArray, isBow } from './cardUtils';
import { PLAYER_ID, APEX_PREDATOR_IDS, PEST_IDS, CURRENT_CARDS_DATA } from '../constants';
import { getThemeName } from './themeUtils';

export interface ActionHandlerArgs {
  player: PlayerDetails;
  gameState: GameState;
  payload: any;
  isBossActive: boolean;
  helpers: {
    _log: (message: string, type?: LogEntry['type']) => void;
    triggerAnimation: (type: string, target?: string, amount?: number) => Promise<void>;
    triggerBanner: (message: string, bannerType: ActiveGameBannerState['bannerType'], autoEndTurnAfter?: boolean) => void;
    triggerGoldFlash: (playerId: string) => void;
    applyHealToPlayer: (player: PlayerDetails, healAmount: number, sourceName: string, isBossFight?: boolean, sourceCard?: CardData) => PlayerDetails;
    applyDamageAndGetAnimation: (playerDetailsInput: PlayerDetails, damage: number, sourceName: string, isBossFight?: boolean, eventId?: string, suppressLog?: boolean, sourceCard?: CardData) => { updatedPlayer: PlayerDetails; actualDamageDealt: number; animationDetails: { amount: number; sourceName: string; eventId?: string } | null; };
    getBaseCardByIdentifier: (card: CardData) => CardData;
    soundManager: any;
    setPendingStoreRestock: React.Dispatch<React.SetStateAction<{ index: number; } | null>>;
    lastAttackPowerRef: React.MutableRefObject<number>;
  };
}

export interface ActionHandlerResult {
  player: PlayerDetails;
  gameUpdates: Partial<GameState>;
}

export const handleShowModal = ({ player, gameState, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { modalType, title, text, confirmCallback, confirmText, choices } = payload;
    let gameUpdates: Partial<GameState> = {};
    if (modalType === 'message') {
        gameUpdates.modals = { ...gameState.modals, message: { isOpen: true, title, text, confirmCallback, confirmText } };
    } else if (modalType === 'story') {
        // If text is empty, we are triggering the loading state for the story.
        if (text === '' && title === '') {
            gameUpdates.isLoadingStory = true;
            // Ensure the story modal is NOT open while loading
            gameUpdates.modals = { ...gameState.modals, story: { ...gameState.modals.story, isOpen: false } };
        } else {
            // If text is provided, we are showing the final story.
            gameUpdates.isLoadingStory = false;
            gameUpdates.modals = { ...gameState.modals, story: { isOpen: true, title, text, confirmCallback } };
        }
    } else if (modalType === 'ngPlusReward') {
        gameUpdates.modals = { ...gameState.modals, ngPlusReward: { isOpen: true, title, text, choices } };
        gameUpdates.showNGPlusRewardModal = true;
    }
    return { player, gameUpdates };
};

export const handleUseItem = ({ player, gameState, payload, isBossActive, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { card, source, index } = payload;
    const { _log, soundManager, getBaseCardByIdentifier, applyHealToPlayer, triggerAnimation, applyDamageAndGetAnimation, triggerBanner, triggerGoldFlash, lastAttackPowerRef } = helpers;

    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded) { _log("Turn already ended.", "error"); return { player, gameUpdates }; }
    if (!card || (source === CardContext.HAND && modPlayer.hand[index] === null)) { _log("No card to use.", "error"); return { player, gameUpdates }; }

    if (card.type === 'Provision') {
        soundManager.playSound('card_play');
        modPlayer.provisionsPlayed = (modPlayer.provisionsPlayed || 0) + 1;
        const statKey = isBossActive ? 'provisions_used_during_boss' : 'provisions_used_before_boss';
        modPlayer.runStats[statKey as keyof RunStats]++;
    }

    const isLaudanumEquivalent = card.id.includes('laudanum') || card.id.includes('morphine_syrette');
    if (isLaudanumEquivalent) {
        const laudanumStatKey = isBossActive ? 'laudanum_used_during_boss' : 'laudanum_used_before_boss';
        modPlayer.runStats[laudanumStatKey as keyof RunStats]++;
        soundManager.playSound('laudanum_use');
        gameUpdates.laudanumVisualActive = true;
        
        const healAmount = calculateHealAmount(card, modPlayer);
        const wouldHeal = Math.min(healAmount, modPlayer.maxHealth - modPlayer.health);

        if (wouldHeal > 0) {
            _log(getRandomLogVariation('laudanumHeal', { playerName: modPlayer.name || 'Player', itemName: card.name, healAmount: wouldHeal, currentHP: modPlayer.health + wouldHeal, maxHP: modPlayer.maxHealth }, theme, modPlayer, card, isBossActive), 'action');
        } else {
            modPlayer.runStats.laudanumAbuse++;
            _log(getRandomLogVariation('laudanumNoHeal', { playerName: modPlayer.name || 'Player', itemName: card.name }, theme, modPlayer, card, isBossActive), 'action');
        }
    }

    let cardUsedAndDiscarded = true;
    const cardToDiscard = getBaseCardByIdentifier(card);

    if (card.effect) {
        // ... (rest of the USE_ITEM logic goes here)
        if (card.effect.type === 'heal') {
            const healAmount = calculateHealAmount(card, modPlayer);
            modPlayer = applyHealToPlayer(modPlayer, healAmount, card.name, isBossActive, card);
        }

        if (card.effect.cures_illness) {
            const illnessIndex = modPlayer.currentIllnesses.findIndex(ill => ill.name === card.effect!.cures_illness);
            if (illnessIndex > -1) {
                _log(getRandomLogVariation('playerCuresIllness', { eventName: modPlayer.currentIllnesses[illnessIndex].name, itemName: card.name }, theme, modPlayer, card), 'info');
                modPlayer.currentIllnesses.splice(illnessIndex, 1);
                modPlayer.runStats.illnesses_cured++;
                triggerAnimation('player-border-pulse-green', 'player');
            }
        } else if (card.effect.cures) {
            if (modPlayer.currentIllnesses.length > 0) {
                _log(getRandomLogVariation('playerCuresIllness', { eventName: 'all afflictions', itemName: card.name }, theme, modPlayer, card), 'info');
                modPlayer.runStats.illnesses_cured += modPlayer.currentIllnesses.length;
                modPlayer.currentIllnesses = [];
                triggerAnimation('player-border-pulse-green', 'player');
            }
        }

        if (gameState.activeEvent?.subType === 'illness' && !gameState.activeEvent.id.startsWith('threat_mountain_sickness')) {
            const activeEventMatchesCure = card.effect.cures_illness && gameState.activeEvent.name === card.effect.cures_illness;
            if (activeEventMatchesCure || card.effect.cures) {
                _log(getRandomLogVariation('illnessCured', { eventName: gameState.activeEvent.name, itemName: card.name }, theme, modPlayer, card), 'info');
                const baseEventCard = getBaseCardByIdentifier(gameState.activeEvent);
                if (baseEventCard) gameUpdates.eventDiscardPile = [...(gameState.eventDiscardPile || []), baseEventCard];
                gameUpdates.activeEvent = null;
                if (modPlayer.currentIllnesses.length === 0 && !modPlayer.mountainSicknessActive) triggerAnimation('player-border-pulse-green', 'player');
            }
        }

        if (card.effect.type === 'weapon' || card.effect.type === 'conditional_weapon' || card.effect.type === 'fire_arrow' || card.effect.type === 'trick_shot') {
            let weaponUsedType: 'firearm' | 'bow' | 'bladed' | undefined = undefined;
            soundManager.playSound(card.id);

            if (isFirearm(card)) {
                weaponUsedType = 'firearm';
            } else if (isBow(card)) {
                weaponUsedType = 'bow';
            } else if (card.id.includes('_knife') || card.effect?.subtype === 'sword') {
                weaponUsedType = 'bladed';
            } else if (card.effect.type === 'fire_arrow') {
                weaponUsedType = 'bow';
            } else if (card.effect.type === 'trick_shot') {
                weaponUsedType = 'firearm';
            }
            
            modPlayer.lastUsedWeaponType = weaponUsedType;
            if (weaponUsedType) {
                const statKey = isBossActive ? `${weaponUsedType}_used_during_boss` : `${weaponUsedType}_used_before_boss`;
                modPlayer.runStats[statKey as keyof RunStats]++;
            }

            let currentActiveEvent = gameState.activeEvent;
            if (currentActiveEvent?.id === gameState.aiBoss?.id && currentActiveEvent.isPacified) {
                _log("You broke the truce! The boss becomes hostile again.", "event");
                const unpacifiedBoss = { ...currentActiveEvent, isPacified: false };
                gameUpdates.activeEvent = unpacifiedBoss;
                gameUpdates.blockTradeDueToHostileEvent = true;
                currentActiveEvent = unpacifiedBoss;
            }

            if (!currentActiveEvent || currentActiveEvent.type !== 'Event' || (currentActiveEvent.health || 0) <= 0) {
                _log("No active threat.", "error");
                cardUsedAndDiscarded = false;
            } else {
                let attackPower = 0;
                 if (card.effect.type === 'fire_arrow') {
                    const allBows = [
                        ...modPlayer.hand.filter(c => c && isBow(c)).map(c => ({card: c, source: CardContext.HAND})), 
                        ...modPlayer.equippedItems.filter(isBow).map(c => ({card: c, source: CardContext.EQUIPPED}))
                    ];
                    if (allBows.length === 0) { _log("Requires a Bow.", "error"); cardUsedAndDiscarded = false; }
                    else {
                        const bowAttackPowers = allBows.map(bowInfo => calculateAttackPower(bowInfo.card, modPlayer, bowInfo.source, currentActiveEvent, { ignoreQuiver: true }));
                        attackPower = Math.max(0, ...bowAttackPowers) + (card.effect.damage || 2);
                        _log(getRandomLogVariation('playerAttack', { playerName: modPlayer.name, enemyName: currentActiveEvent.name, itemName: 'a fire arrow', attackPower }, theme, modPlayer, currentActiveEvent, isBossActive));
                    }
                } else if (card.effect.type === 'trick_shot') {
                    const allFirearms = [...modPlayer.hand.filter(c => c && isFirearm(c)).map(c => ({card: c as CardData, source: CardContext.HAND})), ...modPlayer.equippedItems.filter(c => isFirearm(c)).map(c => ({card: c, source: CardContext.EQUIPPED}))];
                    if (allFirearms.length === 0) { _log("Requires a Firearm.", "error"); cardUsedAndDiscarded = false; }
                    else {
                        const firearmAttackPowers = allFirearms.map(firearmInfo => calculateAttackPower(firearmInfo.card, modPlayer, firearmInfo.source, currentActiveEvent, { ignoreBandolier: true }));
                        attackPower = Math.max(0, ...firearmAttackPowers) + (card.effect.damage || 2);
                        _log(getRandomLogVariation('playerAttack', { playerName: modPlayer.name, enemyName: currentActiveEvent.name, itemName: 'a Trick Shot', attackPower }, theme, modPlayer, currentActiveEvent, isBossActive));
                    }
                } else {
                    attackPower = calculateAttackPower(card, modPlayer, source as CardContext, currentActiveEvent);
                    _log(getRandomLogVariation('playerAttack', { playerName: modPlayer.name, enemyName: currentActiveEvent.name, itemName: card.name, attackPower }, theme, modPlayer, currentActiveEvent, isBossActive));
                }

                if (attackPower > 0 || card.effect.type === 'fire_arrow' || card.effect.type === 'trick_shot') {
                    modPlayer.runStats.damage_dealt += attackPower;
                    modPlayer.runStats.biggestSingleHit = Math.max(modPlayer.runStats.biggestSingleHit || 0, attackPower);

                    triggerAnimation('threat-attacks-player', 'activeEventCardDisplay');
                    setTimeout(() => triggerAnimation('threat-card-shake-damage-bg', 'activeEventCardDisplay'), 150);
                    setTimeout(() => triggerAnimation('threat-card-border-pulse-red', 'activeEventCardDisplay'), 300);

                    const updatedActiveEvent = { ...currentActiveEvent, health: Math.max(0, (currentActiveEvent.health || 0) - attackPower) };
                    
                    if (updatedActiveEvent.health <= 0) {
                        if (updatedActiveEvent.id.startsWith('threat_thief_')) {
                            modPlayer.goldStolenThisTurn = 0;
                        }
                        soundManager.playSound('enemy_hurt');
                        modPlayer.runStats.threats_defeated++;
                        if (APEX_PREDATOR_IDS.has(updatedActiveEvent.id)) modPlayer.runStats.apexPredatorsSlain++;
                        if (PEST_IDS.has(updatedActiveEvent.id)) modPlayer.runStats.pestsExterminated++;
                        if (updatedActiveEvent.id === 'threat_prairie_dog_t1_fj') modPlayer.runStats.kodamaKilled++;
                        const threatType = updatedActiveEvent.subType;
                        if (weaponUsedType && (threatType === 'animal' || threatType === 'human')) {
                            modPlayer.runStats[`${threatType}s_killed_by_${weaponUsedType}` as keyof RunStats]++;
                        }

                        const originalHealth = currentActiveEvent.health || 0;
                        let tier: 'Low' | 'Mid' | 'High' = 'Low';
                        if (originalHealth > 15) tier = 'High'; else if (originalHealth > 8) tier = 'Mid';
                        
                        if (updatedActiveEvent.id === gameState.aiBoss?.id) {
                            soundManager.playSound('victory_sting');
                            lastAttackPowerRef.current = attackPower;
                            localStorage.setItem('aiBossDefeated_WWS', 'true');
                            if (updatedActiveEvent.goldValue) {
                                modPlayer.gold += updatedActiveEvent.goldValue;
                                modPlayer.runStats.gold_earned += updatedActiveEvent.goldValue;
                                triggerGoldFlash(PLAYER_ID);
                            }
                            gameUpdates.activeEvent = null;
                            gameUpdates.blockTradeDueToHostileEvent = false;
                            triggerBanner(`${updatedActiveEvent.name} Defeated!`, 'threat_defeated', false);
                            _log(`The final threat is defeated! End the day to claim victory.`, 'system');
                        } else {
                            _log(getRandomLogVariation(`threatDefeated${tier}`, { enemyName: updatedActiveEvent.name, playerName: modPlayer.name || 'Player' }, theme, modPlayer, updatedActiveEvent), 'event');
                            triggerBanner(`${updatedActiveEvent.name} Defeated!`, 'threat_defeated');
                            const baseDefeatedEvent = getBaseCardByIdentifier(updatedActiveEvent);
                            if (baseDefeatedEvent) gameUpdates.eventDiscardPile = [...(gameState.eventDiscardPile || []), baseDefeatedEvent];
                            const trophyCard = createTrophyOrBountyCard(updatedActiveEvent);
                            modPlayer.playerDiscard = [...modPlayer.playerDiscard, trophyCard];
                            if (trophyCard.type === 'Objective Proof') {
                                _log(`${modPlayer.name || 'Player'} collects the proof of bounty for ${updatedActiveEvent.name}.`, 'info');
                            } else { // Trophy
                                _log(`${modPlayer.name || 'Player'} collects a trophy: ${trophyCard.name}.`, 'info');
                            }
                            gameUpdates.activeEvent = null;
                            gameUpdates.blockTradeDueToHostileEvent = false;
                        }
                    } else {
                        gameUpdates.activeEvent = updatedActiveEvent;
                        gameUpdates.activeEventJustAttacked = true;
                    }
                }
            }
        }
        
        if (card.effect.type === 'campfire') {
            modPlayer.isCampfireActive = true;
            modPlayer.runStats.campfiresBuilt++;
            _log(getRandomLogVariation('campfireBuilt', {}, theme, modPlayer, card), 'action');
        } else if (card.effect.type === 'gold' && card.effect.amount) {
            modPlayer.gold += card.effect.amount;
            modPlayer.runStats.gold_earned += card.effect.amount;
            _log(getRandomLogVariation('goldFound', { goldAmount: card.effect.amount, sourceName: card.name }, theme, modPlayer, card), 'action');
            triggerGoldFlash(PLAYER_ID);
        } else if (card.effect.type === 'draw') {
            const tonicCardToDiscardLater = getBaseCardByIdentifier(card);
            if (source === CardContext.HAND && index !== undefined) modPlayer.hand[index] = null;
            else if (source === CardContext.EQUIPPED && index !== undefined) modPlayer.equippedItems = modPlayer.equippedItems.filter((_, i) => i !== index);
            else { _log("Could not find source of draw card.", "error"); cardUsedAndDiscarded = false; }
            
            if (cardUsedAndDiscarded) { // Check if card was successfully removed from source
                const cardsToDrawCount = card.effect.amount || 2;
                let actuallyDrawnCount = 0;
                const newlyDrawnIndices: number[] = [];
                let tempDeck = [...modPlayer.playerDeck];
                let tempDiscard = [...modPlayer.playerDiscard];
                let tempHand = [...modPlayer.hand];
                while (actuallyDrawnCount < cardsToDrawCount) {
                    const emptyHandSlotIndex = tempHand.findIndex(slot => slot === null);
                    if (emptyHandSlotIndex === -1) { _log("Hand is full.", "info"); break; }
                    if (tempDeck.length === 0) {
                        if (tempDiscard.length > 0) { tempDeck = shuffleArray(tempDiscard); tempDiscard = []; } else { _log("No cards left to draw.", "info"); break; }
                    }
                    const drawnCard = tempDeck.shift();
                    if (drawnCard) {
                        tempHand[emptyHandSlotIndex] = getScaledCard(drawnCard, modPlayer.ngPlusLevel);
                        newlyDrawnIndices.push(emptyHandSlotIndex);
                        actuallyDrawnCount++;
                    } else {
                        break;
                    }
                }
                modPlayer.playerDeck = tempDeck;
                modPlayer.hand = tempHand;
                if (tonicCardToDiscardLater) modPlayer.playerDiscard = [...tempDiscard, tonicCardToDiscardLater];
                else modPlayer.playerDiscard = tempDiscard;
                if (actuallyDrawnCount > 0) {
                    soundManager.playSound('card_draw');
                    _log(getRandomLogVariation('cardsDrawn', { cardsDrawn: actuallyDrawnCount }, theme, modPlayer), 'action');
                    gameUpdates.newlyDrawnCardIndices = newlyDrawnIndices;
                }
                cardUsedAndDiscarded = false; // We handled the discard manually
            }
        } else if (card.effect.type === 'trap') {
            if (modPlayer.activeTrap) {
                modPlayer.playerDiscard = [...modPlayer.playerDiscard, getBaseCardByIdentifier(modPlayer.activeTrap)];
                _log(`${modPlayer.name || 'Player'} replaces their old trap with a new ${card.name}.`, 'action');
            } else {
                _log(getRandomLogVariation('trapSet', { trapName: card.name }, theme, modPlayer, card), 'action');
            }
            modPlayer.activeTrap = card;
            cardUsedAndDiscarded = false;
            triggerAnimation('trap-display-activated', 'trapDisplay');
        } else if (card.effect.type === 'scout') {
            if (gameState.eventDeck.length > 0) {
                const nextEvent = gameState.eventDeck[0];
                const scaledNextEvent = getScaledCard(nextEvent, modPlayer.ngPlusLevel);
                _log(getRandomLogVariation('scoutAhead', { eventName: scaledNextEvent.name }, theme, modPlayer, card), 'action');
                triggerBanner(`Next Card: ${scaledNextEvent.name}`, 'generic_info');
                gameUpdates.selectedCard = { card: scaledNextEvent, source: 'scouted_preview', index: -1 };
            } else {
                _log("Trail's empty. Nothin' to scout.", 'info');
            }
        }
    }

    if (cardUsedAndDiscarded && cardToDiscard) {
        if (source === CardContext.HAND && index !== undefined && modPlayer.hand[index]) {
            modPlayer.playerDiscard = [...modPlayer.playerDiscard, cardToDiscard];
            const newHand = [...modPlayer.hand];
            newHand[index] = null;
            modPlayer.hand = newHand;
        } else if (source === CardContext.EQUIPPED && index !== undefined) {
            const playedEquippedCard = modPlayer.equippedItems[index];
            if (playedEquippedCard.effect?.subtype !== 'storage') {
                modPlayer.equippedItems = modPlayer.equippedItems.filter((_, i) => i !== index);
                modPlayer.playerDiscard = [...modPlayer.playerDiscard, cardToDiscard];
                if (playedEquippedCard.type === 'Player Upgrade' && playedEquippedCard.effect?.persistent) {
                    const effect = playedEquippedCard.effect;
                    if (effect.subtype === 'max_health' && typeof effect.amount === 'number') modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - effect.amount);
                    if (effect.subtype === 'damage_negation') {
                        modPlayer.hatDamageNegationAvailable = false;
                        if (typeof effect.max_health === 'number') modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - effect.max_health);
                    }
                    modPlayer.health = Math.min(modPlayer.health, modPlayer.maxHealth);
                }
            }
        }
    } else if (card.effect?.type === 'trap' && source === CardContext.HAND && index !== undefined) {
         modPlayer.hand[index] = null;
    }

    return { player: modPlayer, gameUpdates };
};

export const handleEquipItem = ({ player, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { card, source, index } = payload;
    const { _log, soundManager } = helpers;
    let modPlayer = { ...player };
    const gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded) { _log("Turn ended.", "error"); return { player, gameUpdates }; }
    if (modPlayer.hasEquippedThisTurn) { _log("Already equipped this turn.", "error"); return { player, gameUpdates }; }
    if (modPlayer.equippedItems.length >= modPlayer.equipSlots) { _log("No equip slots.", "error"); return { player, gameUpdates }; }
    if (!card || (source === CardContext.HAND && modPlayer.hand[index] === null)) { _log("No card to equip.", "error"); return { player, gameUpdates }; }

    soundManager.playSound('card_play');
    modPlayer.equippedItems = [...modPlayer.equippedItems, card];
    if (source === CardContext.HAND && index !== undefined) modPlayer.hand[index] = null;
    _log(getRandomLogVariation('itemEquipped', { itemName: card.name }, theme, modPlayer, card), 'action');
    modPlayer.hasEquippedThisTurn = true;
    gameUpdates.triggerEquipAnimation = true;

    if (card.effect?.persistent && card.type === 'Player Upgrade') {
        const effect = card.effect;
        if (effect.subtype === 'max_health' && typeof effect.amount === 'number') {
            modPlayer.maxHealth += effect.amount;
            modPlayer.health += effect.amount;
        }
        if (effect.subtype === 'damage_negation') {
            modPlayer.hatDamageNegationAvailable = true;
            if (typeof effect.max_health === 'number') {
                 modPlayer.maxHealth += effect.max_health;
                 modPlayer.health += effect.max_health;
            }
        }
    }
    return { player: modPlayer, gameUpdates };
};

export const handleStoreProvision = ({ player, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { card, source, index } = payload;
    const { _log, getBaseCardByIdentifier } = helpers;
    let modPlayer = { ...player };
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded) { _log("Turn ended.", "error"); return { player, gameUpdates: {} }; }
    if (!card || (source === CardContext.HAND && modPlayer.hand[index] === null)) { _log("No card to store.", "error"); return { player, gameUpdates: {} }; }
    const satchel = modPlayer.equippedItems.find(item => item.effect?.subtype === 'storage');
    if (!satchel || !satchel.effect?.capacity) { _log("No satchel.", "error"); return { player, gameUpdates: {} }; }
    if (modPlayer.satchel.length >= satchel.effect.capacity) { _log("Satchel is full.", "error"); return { player, gameUpdates: {} }; }
    
    const cardToStore = getBaseCardByIdentifier(card);
    if (cardToStore) modPlayer.satchel = [...modPlayer.satchel, cardToStore];
    if (source === CardContext.HAND && index !== undefined) modPlayer.hand[index] = null;
    _log(getRandomLogVariation('itemStored', { itemName: card.name }, theme, modPlayer, card), 'action');
    
    return { player: modPlayer, gameUpdates: {} };
};

export const handleUseFromSatchel = ({ player, gameState, payload, isBossActive, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { itemIndexInSatchel } = payload;
    const { _log, soundManager, getBaseCardByIdentifier, applyHealToPlayer, triggerAnimation } = helpers;
    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded) { _log("Turn ended.", "error"); return { player, gameUpdates }; }
    if (modPlayer.satchel.length === 0 || itemIndexInSatchel === undefined || !modPlayer.satchel[itemIndexInSatchel]) { 
        _log("Item not in satchel.", "error"); 
        return { player, gameUpdates }; 
    }
    
    const itemToUseFromSatchel = modPlayer.satchel[itemIndexInSatchel];
    const scaledItemFromSatchel = getScaledCard(itemToUseFromSatchel, modPlayer.ngPlusLevel);
    const isLaudanumEquivalent = scaledItemFromSatchel.id.includes('laudanum') || scaledItemFromSatchel.id.includes('morphine_syrette');
    
    if (isLaudanumEquivalent) {
        soundManager.playSound('laudanum_use');
        gameUpdates.laudanumVisualActive = true;
        
        const healAmount = calculateHealAmount(scaledItemFromSatchel, modPlayer);
        const wouldHeal = Math.min(healAmount, modPlayer.maxHealth - modPlayer.health);

        if (wouldHeal > 0) {
            _log(getRandomLogVariation('laudanumHeal', { playerName: modPlayer.name || 'Player', itemName: scaledItemFromSatchel.name, healAmount: wouldHeal, currentHP: modPlayer.health + wouldHeal, maxHP: modPlayer.maxHealth }, theme, modPlayer, scaledItemFromSatchel, isBossActive), 'action');
        } else {
            modPlayer.runStats.laudanumAbuse++;
            _log(getRandomLogVariation('laudanumNoHeal', { playerName: modPlayer.name || 'Player', itemName: scaledItemFromSatchel.name }, theme, modPlayer, scaledItemFromSatchel, isBossActive), 'action');
        }
    }

    if (scaledItemFromSatchel.type === 'Provision') {
        soundManager.playSound('card_play');
        modPlayer.provisionsPlayed = (modPlayer.provisionsPlayed || 0) + 1;
        const statKey = isBossActive ? 'provisions_used_during_boss' : 'provisions_used_before_boss';
        modPlayer.runStats[statKey as keyof RunStats]++;
        if (isLaudanumEquivalent) {
            const laudanumStatKey = isBossActive ? 'laudanum_used_during_boss' : 'laudanum_used_before_boss';
            modPlayer.runStats[laudanumStatKey as keyof RunStats]++;
        }
    }

    if (scaledItemFromSatchel.effect) {
        if (scaledItemFromSatchel.effect.type === 'heal') {
            const healAmount = calculateHealAmount(scaledItemFromSatchel, modPlayer);
            modPlayer = applyHealToPlayer(modPlayer, healAmount, scaledItemFromSatchel.name, isBossActive, scaledItemFromSatchel);
        }
        if (scaledItemFromSatchel.effect.cures_illness) {
            const illnessIndex = modPlayer.currentIllnesses.findIndex(ill => ill.name === scaledItemFromSatchel.effect!.cures_illness);
            if (illnessIndex > -1) {
                _log(getRandomLogVariation('playerCuresIllness', { eventName: modPlayer.currentIllnesses[illnessIndex].name, itemName: scaledItemFromSatchel.name }, theme, modPlayer, scaledItemFromSatchel), 'info');
                modPlayer.currentIllnesses.splice(illnessIndex, 1);
                modPlayer.runStats.illnesses_cured++;
                triggerAnimation('player-border-pulse-green', 'player');
            }
        } else if (scaledItemFromSatchel.effect.cures) {
             if (modPlayer.currentIllnesses.length > 0) {
                _log(getRandomLogVariation('playerCuresIllness', { eventName: 'all afflictions', itemName: scaledItemFromSatchel.name }, theme, modPlayer, scaledItemFromSatchel), 'info');
                modPlayer.runStats.illnesses_cured += modPlayer.currentIllnesses.length;
                modPlayer.currentIllnesses = [];
                triggerAnimation('player-border-pulse-green', 'player');
            }
        }
        if (gameState.activeEvent?.subType === 'illness' && !gameState.activeEvent.id.startsWith('threat_mountain_sickness')) {
            const activeEventMatchesCureSatchel = scaledItemFromSatchel.effect?.cures_illness && gameState.activeEvent.name === scaledItemFromSatchel.effect.cures_illness;
            if (activeEventMatchesCureSatchel || scaledItemFromSatchel.effect?.cures ) {
                 _log(getRandomLogVariation('illnessCured', { eventName: gameState.activeEvent.name, itemName: scaledItemFromSatchel.name }, theme, modPlayer, scaledItemFromSatchel), 'info');
                 const baseEventCard = getBaseCardByIdentifier(gameState.activeEvent);
                 if(baseEventCard) gameUpdates.eventDiscardPile = [...(gameState.eventDiscardPile || []), baseEventCard];
                 gameUpdates.activeEvent = null;
                 if (modPlayer.currentIllnesses.length === 0 && !modPlayer.mountainSicknessActive) triggerAnimation('player-border-pulse-green', 'player');
            }
        }
        if (scaledItemFromSatchel.effect?.type === 'draw') {
            const cardsToDrawCount = scaledItemFromSatchel.effect.amount || 2;
            let actuallyDrawnCount = 0;
            const newlyDrawnIndices: number[] = [];
            let tempDeck = [...modPlayer.playerDeck];
            let tempDiscard = [...modPlayer.playerDiscard];
            let tempHand = [...modPlayer.hand];
            while (actuallyDrawnCount < cardsToDrawCount) {
                const emptyHandSlotIndex = tempHand.findIndex(slot => slot === null);
                if (emptyHandSlotIndex === -1) { _log("Hand is full.", "info"); break; }
                if (tempDeck.length === 0) {
                    if (tempDiscard.length > 0) { tempDeck = shuffleArray(tempDiscard); tempDiscard = []; } else { _log("No cards left to draw.", "info"); break; }
                }
                const drawnCard = tempDeck.shift();
                if (drawnCard) {
                    tempHand[emptyHandSlotIndex] = getScaledCard(drawnCard, modPlayer.ngPlusLevel);
                    newlyDrawnIndices.push(emptyHandSlotIndex);
                    actuallyDrawnCount++;
                }
            }
            if (actuallyDrawnCount > 0) {
                soundManager.playSound('card_draw');
                modPlayer.playerDeck = tempDeck;
                modPlayer.playerDiscard = tempDiscard;
                modPlayer.hand = tempHand;
                _log(getRandomLogVariation('cardsDrawn', { cardsDrawn: actuallyDrawnCount }, theme, modPlayer), 'action');
                gameUpdates.newlyDrawnCardIndices = newlyDrawnIndices;
            }
        }
        else if (scaledItemFromSatchel.effect?.type !== 'heal' && !scaledItemFromSatchel.effect?.cures && !scaledItemFromSatchel.effect?.cures_illness) {
             _log(`Cannot use ${scaledItemFromSatchel.name} from satchel for effect: ${scaledItemFromSatchel.effect?.type}.`, 'error');
             return { player, gameUpdates };
        }
    }
    
    modPlayer.satchel = modPlayer.satchel.filter((_, i) => i !== itemIndexInSatchel);
    modPlayer.playerDiscard = [...modPlayer.playerDiscard, getBaseCardByIdentifier(itemToUseFromSatchel)];
    
    return { player: modPlayer, gameUpdates };
};

export const handleAttemptObjective = ({ player, gameState, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { card } = payload;
    const { _log, getBaseCardByIdentifier } = helpers;
    let modPlayer = { ...player };
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded || modPlayer.hasTakenActionThisTurn || card?.id !== gameState.activeObjective?.id) { _log("Cannot attempt objective now.", "error"); return { player, gameUpdates: {} }; }
    const provisionsInHand = modPlayer.hand.filter(item => item?.type === 'Provision').length;
    if (provisionsInHand < 5) { _log("Not enough provisions.", "error"); return { player, gameUpdates: {} }; }
    
    _log(`${modPlayer.name} uses 5 provisions to lure out the final boss!`, 'action');
    let provisionsToDiscard = 5;
    let handAfterDiscard = [...modPlayer.hand];
    let discardedProvisions: CardData[] = [];
    for(let i = handAfterDiscard.length - 1; i >= 0 && provisionsToDiscard > 0; i--) {
        if (handAfterDiscard[i]?.type === 'Provision') {
            discardedProvisions.push(getBaseCardByIdentifier(handAfterDiscard[i]!));
            handAfterDiscard[i] = null;
            provisionsToDiscard--;
        }
    }
    modPlayer.hand = handAfterDiscard;
    modPlayer.playerDiscard = [...modPlayer.playerDiscard, ...discardedProvisions];
    localStorage.setItem('objectiveCondition_the_expediter_WWS', 'true');
    modPlayer.forceBossRevealNextTurn = true;
    modPlayer.hasTakenActionThisTurn = true;

    return { player: modPlayer, gameUpdates: {} };
};

export const handleBuyItem = ({ player, gameState, payload, isBossActive, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { card, index } = payload;
    const { _log, triggerGoldFlash, getBaseCardByIdentifier, setPendingStoreRestock } = helpers;
    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded || gameState.blockTradeDueToHostileEvent) { _log("Cannot trade.", "error"); return { player, gameUpdates }; }
    const calculatedBuyCost = card.buyCost || 0;
    if (modPlayer.gold < calculatedBuyCost) { _log("Not enough gold.", "error"); return { player, gameUpdates }; }

    modPlayer.gold -= calculatedBuyCost;
    modPlayer.runStats.gold_spent += calculatedBuyCost;
    const boughtCardToDiscard = getBaseCardByIdentifier(card);
    if (boughtCardToDiscard) modPlayer.playerDiscard = [...modPlayer.playerDiscard, boughtCardToDiscard];
    if (!isBossActive && card.type === 'Provision') {
        const currentCount = parseInt(localStorage.getItem('provisionsCollected_WWS') || '0', 10);
        localStorage.setItem('provisionsCollected_WWS', (currentCount + 1).toString());
    }
    _log(getRandomLogVariation('itemBought', { itemName: card.name, cost: calculatedBuyCost }, theme, modPlayer, card), 'action');
    triggerGoldFlash(PLAYER_ID);

    const newStoreDisplay = [...gameState.storeDisplayItems];
    newStoreDisplay[index] = null;
    gameUpdates.storeDisplayItems = newStoreDisplay;

    setPendingStoreRestock({ index });

    return { player: modPlayer, gameUpdates };
};

export const handleSellItem = ({ player, gameState, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { card, source, index } = payload;
    const { _log, triggerGoldFlash, getBaseCardByIdentifier } = helpers;
    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded || gameState.blockTradeDueToHostileEvent) { _log("Cannot trade.", "error"); return { player, gameUpdates }; }
    if (!card || !card.sellValue || card.sellValue <= 0) { _log("Cannot be sold.", "error"); return { player, gameUpdates }; }
    if (source === CardContext.HAND && (!card || modPlayer.hand[index] === null)) { _log("No card to sell.", "error"); return { player, gameUpdates }; }

    let sellPrice = card.sellValue;
    const treasureMap = modPlayer.equippedItems.find(item => item.id.startsWith('upgrade_treasure_map'));
    if (treasureMap && treasureMap.effect?.amount) sellPrice += treasureMap.effect.amount;
    
    modPlayer.gold += sellPrice;
    modPlayer.runStats.gold_earned += sellPrice;
    if (card.type === 'Provision') modPlayer.runStats.provisions_sold++;
    else if (card.type === 'Trophy') modPlayer.runStats.trophies_sold++;
    else if (card.type === 'Objective Proof') modPlayer.runStats.objectives_sold++;
    else modPlayer.runStats.items_sold++;
    
    const itemNameForLog = card.type === 'Objective Proof' ? `${card.name}'s bounty` : card.name;
    _log(getRandomLogVariation('itemSold', { itemName: itemNameForLog, sellAmount: sellPrice }, theme, modPlayer, card), 'action');
    triggerGoldFlash(PLAYER_ID);

    const cardToSell = getBaseCardByIdentifier(card);
    if (cardToSell) {
        const isTrophyOrValuable = cardToSell.type === 'Trophy' || cardToSell.type === 'Objective Proof' || cardToSell.id.startsWith('item_gold_nugget') || cardToSell.id.startsWith('item_jewelry');
        if (!isTrophyOrValuable) gameUpdates.storeItemDeck = [...(gameState.storeItemDeck || []), cardToSell];
    }
    
    if (source === CardContext.HAND && index !== undefined) {
        modPlayer.hand[index] = null;
    } else if (source === CardContext.EQUIPPED && index !== undefined) {
        const soldEquippedItem = modPlayer.equippedItems[index];
        modPlayer.equippedItems = modPlayer.equippedItems.filter((_, i) => i !== index);
        if (soldEquippedItem.type === 'Player Upgrade' && soldEquippedItem.effect?.persistent) {
            const effect = soldEquippedItem.effect;
            if (effect.subtype === 'max_health' && typeof effect.amount === 'number') modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - effect.amount);
            if (effect.subtype === 'storage') {
                const satchelContentsToDiscard = modPlayer.satchel.map(c => getBaseCardByIdentifier(c));
                modPlayer.playerDiscard = [...modPlayer.playerDiscard, ...satchelContentsToDiscard];
                modPlayer.satchel = [];
            }
            if (effect.subtype === 'damage_negation') { 
                modPlayer.hatDamageNegationAvailable = false;
                if(typeof effect.max_health === 'number') modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - effect.max_health);
            }
            modPlayer.health = Math.min(modPlayer.health, modPlayer.maxHealth);
        }
    }
    
    return { player: modPlayer, gameUpdates };
};

export const handleSellFromSatchel = ({ player, gameState, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { cardToSell, itemIndexInSatchel } = payload;
    const { _log, triggerGoldFlash, getBaseCardByIdentifier } = helpers;
    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded || gameState.blockTradeDueToHostileEvent) { _log("Cannot trade.", "error"); return { player, gameUpdates }; }
    if (!cardToSell || !cardToSell.sellValue || cardToSell.sellValue <= 0) { _log("Cannot be sold.", "error"); return { player, gameUpdates }; }
    if (modPlayer.satchel.length === 0 || itemIndexInSatchel === undefined || !modPlayer.satchel[itemIndexInSatchel]) {
        _log("Item not found in satchel.", "error");
        return { player, gameUpdates };
    }

    let sellPrice = cardToSell.sellValue;
    const treasureMap = modPlayer.equippedItems.find(item => item.id.startsWith('upgrade_treasure_map'));
    if (treasureMap && treasureMap.effect?.amount) sellPrice += treasureMap.effect.amount;
    
    modPlayer.gold += sellPrice;
    modPlayer.runStats.gold_earned += sellPrice;
    if (cardToSell.type === 'Provision') modPlayer.runStats.provisions_sold++;
    else if (cardToSell.type === 'Trophy') modPlayer.runStats.trophies_sold++;
    else if (cardToSell.type === 'Objective Proof') modPlayer.runStats.objectives_sold++;
    else modPlayer.runStats.items_sold++;
    
    const itemNameForLog = cardToSell.type === 'Objective Proof' ? `${cardToSell.name}'s bounty` : cardToSell.name;
    _log(getRandomLogVariation('itemSold', { itemName: itemNameForLog, sellAmount: sellPrice }, theme, modPlayer, cardToSell), 'action');
    triggerGoldFlash(PLAYER_ID);

    const soldCardBase = getBaseCardByIdentifier(cardToSell);
    if (soldCardBase) {
        const isTrophyOrValuable = soldCardBase.type === 'Trophy' || soldCardBase.type === 'Objective Proof' || soldCardBase.id.startsWith('item_gold_nugget') || soldCardBase.id.startsWith('item_jewelry');
        if (!isTrophyOrValuable) {
            gameUpdates.storeItemDeck = [...(gameState.storeItemDeck || []), soldCardBase];
        }
    }
    
    // Remove from satchel
    modPlayer.satchel = modPlayer.satchel.filter((_, i) => i !== itemIndexInSatchel);
    
    return { player: modPlayer, gameUpdates };
};

export const handleTakeEventItem = ({ player, gameState, isBossActive, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { _log, triggerAnimation, getBaseCardByIdentifier } = helpers;
    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded || modPlayer.hasTakenActionThisTurn || !gameState.activeEvent || gameState.activeEvent.type === 'Event') {
        _log("Cannot take item.", "error");
        return { player, gameUpdates };
    }

    if (!isBossActive && gameState.activeEvent.type === 'Provision') {
        const currentCount = parseInt(localStorage.getItem('provisionsCollected_WWS') || '0', 10);
        localStorage.setItem('provisionsCollected_WWS', (currentCount + 1).toString());
    }
    
    const takenEventItem = getBaseCardByIdentifier(gameState.activeEvent);
    if (takenEventItem) modPlayer.playerDiscard = [...modPlayer.playerDiscard, takenEventItem];
    _log(getRandomLogVariation('itemTaken', { itemName: gameState.activeEvent.name }, theme, modPlayer, gameState.activeEvent), 'action');
    triggerAnimation('event-item-taken', 'activeEventCardDisplay');
    gameUpdates.activeEvent = null;
    modPlayer.hasTakenActionThisTurn = true;
    gameUpdates.blockTradeDueToHostileEvent = false;

    return { player: modPlayer, gameUpdates };
};

export const handleDiscardEquippedItem = ({ player, payload, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { index } = payload;
    const { _log, getBaseCardByIdentifier } = helpers;
    let modPlayer = { ...player };
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (modPlayer.turnEnded || index === undefined || !modPlayer.equippedItems[index]) {
        _log("Cannot discard.", "error");
        return { player, gameUpdates: {} };
    }
    
    const itemToDiscard = modPlayer.equippedItems[index];
    _log(getRandomLogVariation('itemDiscarded', { itemName: itemToDiscard.name }, theme, modPlayer, itemToDiscard), 'action');
    modPlayer.equippedItems = modPlayer.equippedItems.filter((_, i) => i !== index);
    const baseEquippedToDiscard = getBaseCardByIdentifier(itemToDiscard);
    if (baseEquippedToDiscard) modPlayer.playerDiscard = [...modPlayer.playerDiscard, baseEquippedToDiscard];
    
    if (itemToDiscard.type === 'Player Upgrade' && itemToDiscard.effect?.persistent) {
        const effect = itemToDiscard.effect;
        if (effect.subtype === 'max_health' && typeof effect.amount === 'number') modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - effect.amount);
        if (effect.subtype === 'storage') {
            const satchelContentsToDiscard = modPlayer.satchel.map(c => getBaseCardByIdentifier(c));
            modPlayer.playerDiscard = [...modPlayer.playerDiscard, ...satchelContentsToDiscard];
            modPlayer.satchel = [];
        }
        if (effect.subtype === 'damage_negation') {
            modPlayer.hatDamageNegationAvailable = false;
            if (typeof effect.max_health === 'number') modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - effect.max_health);
        }
        modPlayer.health = Math.min(modPlayer.health, modPlayer.maxHealth);
    }
    
    return { player: modPlayer, gameUpdates: {} };
};

export const handleInteractWithThreat = ({ player, gameState, isBossActive, helpers }: ActionHandlerArgs): ActionHandlerResult => {
    const { _log, triggerAnimation, applyDamageAndGetAnimation, triggerGoldFlash, getBaseCardByIdentifier, soundManager, triggerBanner } = helpers;
    let modPlayer = { ...player };
    let gameUpdates: Partial<GameState> = {};
    const { activeEvent } = gameState;
    const theme = getThemeName(modPlayer.ngPlusLevel);

    if (!activeEvent || !(activeEvent.subType === 'animal' || activeEvent.subType === 'human') || (activeEvent.health || 0) <= 0) {
        _log("There is no one here to talk to or pet.", "error");
        return { player, gameUpdates };
    }

    if (modPlayer.turnEnded || modPlayer.hasTakenActionThisTurn) {
        _log("You can't do that right now.", "error");
        return { player, gameUpdates };
    }
    
    if (!modPlayer.character) {
        _log("Character data is missing, cannot perform skilled interaction.", "error");
        return { player, gameUpdates };
    }

    modPlayer.hasTakenActionThisTurn = true;

    if (activeEvent.subType === 'animal') {
        const petFailureChance = modPlayer.character.petSkill;
        const petRoll = Math.random();
        if (petRoll <= petFailureChance) { // Chance to fail
            _log(`You try to pet the ${activeEvent.name}. It doesn't like that.`, 'action');

            if (activeEvent.effect?.type === 'apply_illness_on_linger' && activeEvent.effect.illness_id) {
                const illnessCardId = activeEvent.effect.illness_id;
                const illnessCardData = CURRENT_CARDS_DATA[illnessCardId];

                if (illnessCardData) {
                    _log(`The ${activeEvent.name} bites you!`, 'event');
                    soundManager.playSound(activeEvent.id);
                    triggerBanner(illnessCardData.name, 'event_alert');
                    gameUpdates.playerShake = true;

                    const damageOnApply = activeEvent.effect.damage_on_apply || 0;
                    if (damageOnApply > 0) {
                        const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, damageOnApply, activeEvent.name, isBossActive, activeEvent.id, false, activeEvent);
                        modPlayer = updatedPlayer;
                        gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                    }

                    if (modPlayer.health > 0 && !modPlayer.currentIllnesses.some(ill => ill.id === illnessCardData.id)) {
                        modPlayer.currentIllnesses.push(illnessCardData);
                        modPlayer.runStats.illnesses_contracted++;
                        _log(`${modPlayer.name || 'Player'} contracts ${illnessCardData.name} from the ${activeEvent.name}.`, 'event');
                        triggerAnimation('player-is-ill', 'player');
                    }
                } else {
                    _log(`ERROR: Could not find illness card with ID: ${illnessCardId}`, 'error');
                    const damage = activeEvent.effect.damage_on_apply || 3;
                    if (damage > 0) {
                        const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, damage, activeEvent.name, isBossActive, activeEvent.id, false, activeEvent);
                        modPlayer = updatedPlayer;
                        gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                        gameUpdates.playerShake = true;
                    }
                }
            } else { // Standard failed pet logic for non-snakes
                const damage = activeEvent.effect?.type === 'damage' ? activeEvent.effect.amount || 0 : 0;
                if (damage > 0) {
                    const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, damage, activeEvent.name, isBossActive, activeEvent.id, false, activeEvent);
                    modPlayer = updatedPlayer;
                    gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                    gameUpdates.playerShake = true;
                } else {
                     _log(`The ${activeEvent.name} is startled but doesn't attack.`, 'info');
                }
            }
        } else { // Pacified
            _log(`You cautiously approach the ${activeEvent.name}. It seems to calm down at your touch.`, 'info');
            modPlayer.runStats.animalsPet = (modPlayer.runStats.animalsPet || 0) + 1;
            modPlayer.eventPacifiedThisTurn = true;
            gameUpdates.blockTradeDueToHostileEvent = false;
            _log(`The ${activeEvent.name} is no longer considered hostile. Trading is now possible.`, 'info');
        }
    } else if (activeEvent.subType === 'human') {
        const talkFailureChance = modPlayer.character.talkSkill;
        const talkRoll = Math.random();
        if (talkRoll <= talkFailureChance) { // Chance to fail
            _log(`You try to talk to the ${activeEvent.name}. They respond with violence.`, 'action');
            const damage = activeEvent.effect?.type === 'damage' ? activeEvent.effect.amount || 0 : 0;
             if (damage > 0) {
                const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modPlayer, damage, activeEvent.name, isBossActive, activeEvent.id, false, activeEvent);
                modPlayer = updatedPlayer;
                gameUpdates.pendingPlayerDamageAnimation = animationDetails;
                gameUpdates.playerShake = true;
            } else {
                 _log(`The ${activeEvent.name} isn't interested in talking, but holds their attack.`, 'info');
            }
        } else { // Leaves
            if (isBossActive) {
                _log(getRandomLogVariation('bossDeEscalated', { enemyName: activeEvent.name, goldAmount: activeEvent.goldValue }, theme, modPlayer, activeEvent, isBossActive), 'gold');
                modPlayer.gold += activeEvent.goldValue || 0;
                modPlayer.runStats.gold_earned += activeEvent.goldValue || 0;
                modPlayer.runStats.deEscalations = (modPlayer.runStats.deEscalations || 0) + 1;
                triggerGoldFlash(PLAYER_ID);
                gameUpdates.activeEvent = { ...activeEvent, isPacified: true };
                gameUpdates.blockTradeDueToHostileEvent = false;

            } else {
                _log(`You manage to de-escalate the situation. The ${activeEvent.name} decides you're not worth the trouble and leaves.`, 'info');
                modPlayer.runStats.deEscalations = (modPlayer.runStats.deEscalations || 0) + 1;
                if (activeEvent.id.startsWith('threat_thief_') && modPlayer.goldStolenThisTurn && modPlayer.goldStolenThisTurn > 0) {
                    const returnedGold = modPlayer.goldStolenThisTurn;
                    modPlayer.gold += returnedGold;
                    modPlayer.runStats.gold_earned += returnedGold;
                    _log(`Feeling a pang of conscience (or fear), the thief returns the ${returnedGold} Gold they stole.`, 'gold');
                    triggerGoldFlash(PLAYER_ID);
                    modPlayer.goldStolenThisTurn = 0;
                }
                const baseEventCard = getBaseCardByIdentifier(activeEvent);
                if (baseEventCard) gameUpdates.eventDiscardPile = [...(gameState.eventDiscardPile || []), baseEventCard];
                gameUpdates.activeEvent = null;
                gameUpdates.blockTradeDueToHostileEvent = false;
            }
        }
    }
    return { player: modPlayer, gameUpdates };
};

// FIX: Add React import to resolve TypeScript error for React.MutableRefObject.
import React from 'react';
import { PlayerDetails, CardData, LogEntry, ActiveGameBannerState, RunStats } from '../types.ts';
import { soundManager } from './soundManager.ts';
import { getRandomLogVariation } from './logUtils.ts';
import { createTrophyOrBountyCard } from './cardUtils.ts';
import { PLAYER_ID, CURRENT_CARDS_DATA } from '../constants.ts';
import { getThemeName } from './themeUtils.ts';

// Forward declaration for ObjectiveCheckResult since it's used before definition
interface ObjectiveCheckResult {
    updatedPlayer: PlayerDetails;
    objectiveStatus: 'success' | 'failure';
    objectiveMessage: string;
}

/**
 * Applies healing to a player and returns the updated player state.
 * @param player - The player to heal.
 * @param healAmount - The amount of health to restore.
 * @param sourceName - The name of the card/effect causing the heal.
 * @param _log - The logging function.
 * @param triggerAnimation - Function to trigger UI animations.
 * @param isBossFight - Flag to indicate if the healing occurs during a boss fight for correct logging.
 * @param sourceCard - The optional card data that is the source of the heal.
 * @param suppressLog - Optional flag to prevent the generic heal log from being created.
 * @returns The updated PlayerDetails object.
 */
export const applyHealToPlayer = (
    player: PlayerDetails, 
    healAmount: number, 
    sourceName: string,
    _log: (message: string, type?: LogEntry['type']) => void,
    triggerAnimation: (type: string, target?: string) => Promise<void>,
    isBossFight?: boolean,
    sourceCard?: CardData,
    suppressLog: boolean = false
): PlayerDetails => {
    let modPlayer = { ...player };
    const theme = getThemeName(modPlayer.ngPlusLevel);
    const actualHeal = Math.min(healAmount, modPlayer.maxHealth - modPlayer.health);
    if (actualHeal > 0) {
        soundManager.playSound('heal');
        modPlayer.health += actualHeal;
        modPlayer.runStats.health_healed += actualHeal;
        // Suppress generic healing message for laudanum/morphine as they have specific logs.
        const isLaudanumEquivalent = sourceName.toLowerCase().includes('laudanum') || sourceName.toLowerCase().includes('morphine');
        if (!isLaudanumEquivalent && !suppressLog) {
            _log(getRandomLogVariation('playerHeal', { playerName: modPlayer.name || 'Player', sourceName, healAmount: actualHeal, currentHP: modPlayer.health, maxHP: modPlayer.maxHealth }, theme, modPlayer, sourceCard, isBossFight), 'info');
        }
        triggerAnimation('player-heal-flash-bg', 'player');
        setTimeout(() => triggerAnimation('player-border-pulse-green', 'player'), 100);
    }
    return modPlayer;
};

/**
 * Applies damage to a player, considering damage negation items, and returns updated state and animation details.
 * @param playerDetailsInput - The player taking damage.
 * @param damage - The initial amount of damage.
 * @param sourceName - The name of the damage source.
 * @param _log - The logging function.
 * @param triggerAnimation - Function to trigger UI animations.
 * @param getBaseCardByIdentifier - Function to retrieve the base version of a card.
 * @param isBossFight - Flag to indicate if the damage occurs during a boss fight for correct logging.
 * @param eventId - The optional ID of the event causing the damage.
 * @param sourceCard - The optional card data that is the source of the damage.
 * @returns An object with the updated player, actual damage dealt, and animation details.
 */
export const applyDamageAndGetAnimation = (
    playerDetailsInput: PlayerDetails,
    damage: number,
    sourceName: string,
    _log: (message: string, type?: LogEntry['type']) => void,
    triggerAnimation: (type: string, target?: string) => Promise<void>,
    getBaseCardByIdentifier: (card: CardData | null) => CardData | null,
    isBossFight?: boolean,
    eventId?: string,
    suppressLog: boolean = false,
    sourceCard?: CardData
  ): {
    updatedPlayer: PlayerDetails;
    actualDamageDealt: number;
    animationDetails: { amount: number; sourceName: string; eventId?: string } | null;
  } => {
    let incomingDamage = damage;
    let modPlayer = { ...playerDetailsInput };
    let animationDetailsReturn: { amount: number; sourceName: string; eventId?: string } | null = null;
    modPlayer.hatDamageNegationUsedThisTurn = false;
    const theme = getThemeName(modPlayer.ngPlusLevel);

    const equippedHat = modPlayer.equippedItems.find(item => item.effect?.subtype === 'damage_negation');

    if (modPlayer.hatDamageNegationAvailable && equippedHat && equippedHat.effect?.max_health) {
        const hatHealthBonus = equippedHat.effect.max_health;
        const damageNegatedByHat = Math.min(incomingDamage, hatHealthBonus);
        
        _log(getRandomLogVariation('hatSaved', { playerName: modPlayer.name || 'Player', itemName: equippedHat.name, sourceName: sourceName }, theme, modPlayer, equippedHat, isBossFight), 'info');
        _log(`${equippedHat.name} negates ${damageNegatedByHat} damage and is discarded.`, 'info');

        incomingDamage -= damageNegatedByHat;

        const hatIndex = modPlayer.equippedItems.findIndex(item => item.id === equippedHat.id);
        modPlayer.equippedItems = modPlayer.equippedItems.filter(item => item.id !== equippedHat.id);

        // Re-index satchels after removing the hat
        if (hatIndex !== -1) {
            const newSatchels: { [key: number]: CardData[] } = {};
            for (const key in modPlayer.satchels) {
                const oldIndex = parseInt(key, 10);
                if (oldIndex < hatIndex) {
                    newSatchels[oldIndex] = modPlayer.satchels[key];
                } else if (oldIndex > hatIndex) {
                    newSatchels[oldIndex - 1] = modPlayer.satchels[key];
                }
            }
            modPlayer.satchels = newSatchels;
        }

        modPlayer.maxHealth = Math.max(1, modPlayer.maxHealth - hatHealthBonus);
        modPlayer.health = Math.min(modPlayer.health, modPlayer.maxHealth);
        
        modPlayer.playerDiscard = [...modPlayer.playerDiscard, equippedHat];

        modPlayer.hatDamageNegationAvailable = false;
        modPlayer.hatDamageNegationUsedThisTurn = true;
        triggerAnimation('player-hat-saved-damage', 'player');
    }

    const damageReductionUpgrades = modPlayer.equippedItems.filter(item => item.effect?.type === 'upgrade' && item.effect.subtype === 'damage_reduction' && item.effect.amount);
    let totalReduction = 0;
    damageReductionUpgrades.forEach(upgrade => totalReduction += (upgrade.effect?.amount || 0));

    let finalDamage = Math.max(0, incomingDamage - totalReduction);

    if (totalReduction > 0 && finalDamage < incomingDamage) {
        _log(`${playerDetailsInput.name || 'Player'}'s gear reduces remaining damage by ${incomingDamage - finalDamage}.`, 'info');
    }

    if (finalDamage > 0) {
        soundManager.playSound('player_hurt');
        modPlayer.health = Math.max(0, modPlayer.health - finalDamage);
        modPlayer.runStats.damage_taken += finalDamage;
        if (!suppressLog) {
            _log(getRandomLogVariation('playerDamage', { sourceName, playerName: modPlayer.name || 'Player', damageAmount: finalDamage, currentHP: modPlayer.health, maxHP: modPlayer.maxHealth }, theme, modPlayer, sourceCard, isBossFight), 'event');
        }
        animationDetailsReturn = { amount: finalDamage, sourceName: sourceName, eventId };
    } else if (damage > 0) { // Damage was reduced to 0
        _log(`${playerDetailsInput.name || 'Player'}'s defenses absorb all damage from ${sourceName}'s strike!`, 'info');
    } else { // Damage was 0 to begin with
        if (!suppressLog) {
            _log(`${sourceName} attacks but deals no damage.`, 'info');
        }
    }

    return { updatedPlayer: modPlayer, actualDamageDealt: finalDamage, animationDetails: animationDetailsReturn };
};

/**
 * Handles the interaction between an active trap and a revealed event card.
 * @returns An object detailing the outcome of the trap interaction.
 */
export const handleTrapInteractionWithEvent = (
    player: PlayerDetails,
    event: CardData,
    trap: CardData,
    isBossEvent: boolean,
    triggerBanner: (message: string, bannerType: ActiveGameBannerState['bannerType']) => void,
    triggerAnimation: (type: string, target?: string) => Promise<void>,
    _log: (message: string, type?: LogEntry['type']) => void,
    lastAttackPowerRef: React.MutableRefObject<number>
): {
    updatedPlayer: PlayerDetails,
    updatedEvent: CardData | null,
    trapConsumedAndDiscarded: boolean,
    trophyCard?: CardData,
    goldFromBossDefeat?: number,
    logMessages: { message: string, type: LogEntry['type'] }[],
    damageDealt: number,
} => {
    let modPlayer = { ...player };
    const theme = getThemeName(modPlayer.ngPlusLevel);
    soundManager.playSound('trap_snap');
    modPlayer.runStats.trapsSprung++;
    let modEvent: CardData | null = { ...event };
    let trapConsumed = false;
    let newTrophyCard: CardData | undefined = undefined;
    let goldFromBoss = 0;
    const localLogs: { message: string, type: LogEntry['type'] }[] = [];
    let damageToEventByTrap = 0;
    let finalDamageDealt = 0;

    const targetHealth = modEvent.health || 0;
    const trapEffect = trap.effect;
    let trapThreshold = 0;

    if (trapEffect?.trapThreshold) {
        trapThreshold = trapEffect.trapThreshold;
    } else if (trapEffect?.size) {
        // Fallback to old hardcoded values for backward compatibility
        if (trapEffect.size === 'small') trapThreshold = 4;
        else if (trapEffect.size === 'medium') trapThreshold = 6;
        else if (trapEffect.size === 'large') trapThreshold = 8;
    }

    let caughtByThreshold = false;
    if (modEvent.subType === 'animal' && targetHealth <= trapThreshold) {
        caughtByThreshold = true;
    }

    if (caughtByThreshold) {
        localLogs.push({ message: getRandomLogVariation('trapCaught', { enemyName: event.name, trapName: trap.name }, theme, modPlayer, event, isBossEvent), type: 'event' });
        triggerBanner(`${event.name} Trapped!`, 'threat_defeated');
        finalDamageDealt = targetHealth;
        modPlayer.runStats.damage_dealt += finalDamageDealt;
        modPlayer.runStats.biggestSingleHit = Math.max(modPlayer.runStats.biggestSingleHit || 0, finalDamageDealt);
        if (isBossEvent) {
            soundManager.playSound('victory_sting');
            goldFromBoss = modEvent.goldValue || 0;
            localLogs.push({ message: `${modPlayer.name || 'Player'} collects ${goldFromBoss} Gold for defeating the treacherous ${modEvent.name} with a trap!`, type: 'gold' });
            localStorage.setItem('aiBossDefeated_WWS', 'true');
            lastAttackPowerRef.current = targetHealth;
        } else {
            soundManager.playSound('enemy_hurt');
            newTrophyCard = createTrophyOrBountyCard(modEvent);
        }
        triggerAnimation('event-trapped-small', 'activeEventCardDisplay');
        modEvent = null;
        trapConsumed = true;
    } else {
        let trapBrokenByThreat = false;
        
        if (modEvent.subType === 'human' || (modEvent.subType === 'animal' && targetHealth > trapThreshold)) {
            trapBrokenByThreat = true;
            if (trap.effect?.breakDamage) {
                damageToEventByTrap = trap.effect.breakDamage;
                localLogs.push({ message: getRandomLogVariation('trapBroken', { enemyName: modEvent.name, trapName: trap.name, damageAmount: damageToEventByTrap }, theme, modPlayer, modEvent, isBossEvent), type: 'event'});
            } else {
                localLogs.push({ message: getRandomLogVariation('trapHumanBrokeNoDamage', { enemyName: modEvent.name, trapName: trap.name }, theme, modPlayer, modEvent, isBossEvent), type: 'event' });
            }
        }

        if (damageToEventByTrap > 0 && modEvent) {
            finalDamageDealt = damageToEventByTrap;
            modEvent.health = Math.max(0, (modEvent.health || 0) - damageToEventByTrap);
            modPlayer.runStats.damage_dealt += damageToEventByTrap;
            modPlayer.runStats.biggestSingleHit = Math.max(modPlayer.runStats.biggestSingleHit || 0, finalDamageDealt);
            triggerAnimation('threat-card-shake-damage-bg', 'activeEventCardDisplay');
            localLogs.push({ message: `${modEvent.name} now has ${modEvent.health} health.`, type: 'event' });

            if (modEvent.health <= 0) {
                const originalHealth = event.health || 0;
                let tier: 'Low' | 'Mid' | 'High' = 'Low';
                if (originalHealth > 15) tier = 'High';
                else if (originalHealth > 8) tier = 'Mid';
                localLogs.push({ message: getRandomLogVariation(`threatDefeated${tier}`, { enemyName: event.name, playerName: modPlayer.name || 'Player' }, theme, modPlayer, event, isBossEvent), type: 'event' });
                triggerBanner(`${event.name} Defeated by Trap!`, 'threat_defeated');
                 if (isBossEvent) {
                    soundManager.playSound('victory_sting');
                    goldFromBoss = modEvent.goldValue || 0;
                    localLogs.push({ message: `${modPlayer.name || 'Player'} collects ${goldFromBoss} Gold for defeating the treacherous ${modEvent.name} with a trap!`, type: 'gold' });
                    localStorage.setItem('aiBossDefeated_WWS', 'true');
                    lastAttackPowerRef.current = damageToEventByTrap;
                } else {
                    soundManager.playSound('enemy_hurt');
                    newTrophyCard = createTrophyOrBountyCard(event);
                }
                modEvent = null;
            }
        }

        if (trapBrokenByThreat || damageToEventByTrap > 0) trapConsumed = true;
    }
    
    // Objective Tracking for Trap Kills
    if ((caughtByThreshold || (damageToEventByTrap > 0 && modEvent === null && event.health <= damageToEventByTrap))) {
      modPlayer.runStats.threats_defeated++;
      if(event.subType === 'animal') modPlayer.runStats.animals_killed_by_trap++;
      else if (event.subType === 'human') modPlayer.runStats.humans_killed_by_trap++;
    }

    return { updatedPlayer: modPlayer, updatedEvent: modEvent, trapConsumedAndDiscarded: trapConsumed, trophyCard: newTrophyCard, goldFromBossDefeat: goldFromBoss, logMessages: localLogs, damageDealt: finalDamageDealt };
};

/**
 * Checks if the run's objective has been met upon defeating the boss.
 * @returns An object with the updated player, objective status, and a summary message.
 */
export const handleObjectiveCompletionChecks = (
    player: PlayerDetails, 
    objective: CardData, 
    boss: CardData, 
    turn: number, 
    lastAttackPower: number,
    activeEvent: CardData | null,
    triggerGoldFlash: (playerId: string) => void,
    _log: (message: string, type?: LogEntry['type']) => void
): ObjectiveCheckResult => {
    let modPlayer = { ...player };
    let success = false;
    let rewardLog = "";
    let failureLog = "";
    const isPeacefulVictory = activeEvent?.id === boss.id && activeEvent?.isPacified === true;


    switch (objective.id) {
        case 'objective_take_em_alive':
            if (modPlayer.capturedBossAlive) {
                success = true;
                modPlayer.gold += 100;
                modPlayer.runStats.gold_earned += 100;
                modPlayer.runStats.mostGoldHeld = Math.max(modPlayer.runStats.mostGoldHeld || 0, modPlayer.gold);
                rewardLog = `Congratulations!\nThe boss was captured alive!\n\nReward: +100 Gold.`;
                triggerGoldFlash(PLAYER_ID);
            } else if (isPeacefulVictory) {
                failureLog = `Optional Objective Failed.\nThe boss was pacified, not defeated with a final blow.`;
            } else if (lastAttackPower <= 5) {
                success = true;
                modPlayer.gold += 100;
                modPlayer.runStats.gold_earned += 100;
                modPlayer.runStats.mostGoldHeld = Math.max(modPlayer.runStats.mostGoldHeld || 0, modPlayer.gold);
                rewardLog = `Congratulations!\nThe final blow dealt ${lastAttackPower} damage! The boss was taken alive.\n\nReward: +100 Gold.`;
                triggerGoldFlash(PLAYER_ID);
            } else {
                failureLog = `Optional Objective Failed.\nThe final blow of ${lastAttackPower} damage was too powerful, and the boss was not captured.`;
            }
            break;
        case 'objective_swift_justice':
            if (turn <= 30) {
                success = true;
                localStorage.setItem('objectiveReward_swift_justice_WWS', 'true');
                rewardLog = `Congratulations!\nThe boss was defeated on Day ${turn}!\n\nReward: You'll start your next journey with an AI-remixed legendary themed hat.`;
            } else {
                failureLog = `Optional Objective Failed.\nThe boss was defeated on Day ${turn}, which was too late.`;
            }
            break;
        case 'objective_the_purist':
            if (modPlayer.currentIllnesses.length === 0) {
                success = true;
                localStorage.setItem('objectiveReward_the_purist_WWS', 'true');
                rewardLog = `Congratulations!\nYou defeated the boss with no afflictions!\n\nReward: You'll start your next journey with an AI-remixed legendary themed provision.`;
            } else {
                const illnessNames = modPlayer.currentIllnesses.map(ill => ill.name).join(', ');
                failureLog = `Optional Objective Failed.\nYou were afflicted with ${illnessNames} upon victory.`;
            }
            break;
        case 'objective_the_hoarder':
            if (modPlayer.gold >= 250) {
                success = true;
                const currentGold = parseInt(localStorage.getItem('ngPlusPlayerGold_WWS') || '0');
                localStorage.setItem('ngPlusPlayerGold_WWS', (currentGold + 50).toString());
                rewardLog = `Congratulations!\nYour prosperity is proven with ${modPlayer.gold} Gold!\n\nReward: You'll begin your next journey with an additional +50 Gold.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou only had ${modPlayer.gold} Gold upon victory.`;
            }
            break;
        case 'objective_a_beasts_end':
            if ((modPlayer.runStats.apexPredatorsSlain || 0) > 0) {
                success = true;
                localStorage.setItem('objectiveReward_a_beasts_end_WWS', 'true');
                rewardLog = `Congratulations!\nYou successfully hunted an Apex Predator during your run!\n\nReward: You'll start your next journey with an AI-remixed legendary themed fur coat.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou did not defeat any Apex Predators during this run.`;
            }
            break;
        case 'objective_mans_inhumanity':
            if (boss.subType === 'human') {
                if (isPeacefulVictory) {
                    failureLog = `Optional Objective Failed.\nYou pacified the boss, but the objective required you to defeat them in combat.`;
                } else if (modPlayer.capturedBossAlive) {
                    failureLog = `Optional Objective Failed.\nYou captured the boss alive, but the objective required you to defeat them in combat.`;
                } else {
                    success = true;
                    localStorage.setItem('objectiveReward_mans_inhumanity_WWS', 'true');
                    rewardLog = `Congratulations!\nThe final boss was a human and was defeated in combat!\n\nReward: Start your next run with an AI-remixed legendary themed weapon.`;
                }
            } else {
                failureLog = `Optional Objective Failed.\nThe final boss was not a human.`;
            }
            break;
        case 'objective_the_last_stand':
            if (modPlayer.health <= 5) {
                success = true;
                const currentBonus = modPlayer.cumulativeNGPlusMaxHealthBonus || 0;
                const newBonus = currentBonus + 2;
                modPlayer.cumulativeNGPlusMaxHealthBonus = newBonus;
                localStorage.setItem('ngPlusCumulativeMaxHealthBonus_WWS', newBonus.toString());
                rewardLog = `Congratulations!\nA victory snatched from the jaws of death with ${modPlayer.health} HP remaining!\n\nReward: Your lineage gains a permanent +2 Max Health.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou had ${modPlayer.health} HP, which was not low enough.`;
            }
            break;
        case 'objective_well_prepared':
            const provisionsCollected = modPlayer.provisionsCollectedThisRun || 0;
            if (provisionsCollected >= 5) {
                success = true;
                localStorage.setItem('objectiveReward_well_prepared_WWS', 'true');
                rewardLog = `Congratulations!\nYou collected ${provisionsCollected} provisions before the boss appeared!\n\nReward: Your starter 'Dried Meat' will be upgraded to 'Steak' next run.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou only collected ${provisionsCollected} provisions.`;
            }
            break;
        case 'objective_the_marksman':
            if (isPeacefulVictory) {
                failureLog = `Optional Objective Failed.\nThe boss was pacified, not defeated with a firearm.`;
            } else if (player.lastUsedWeaponType === 'firearm') {
                success = true;
                localStorage.setItem('objectiveReward_the_marksman_WWS', 'true');
                rewardLog = `Congratulations!\nA true marksman's shot ended the fight!\n\nReward: You'll start your next run with an AI-remixed legendary 'themed firearm'.`;
            } else {
                failureLog = `Optional Objective Failed.\nThe final blow was from a ${player.lastUsedWeaponType || 'non-firearm source'}.`;
            }
            break;
        case 'objective_the_stalker':
            if (isPeacefulVictory) {
                failureLog = `Optional Objective Failed.\nThe boss was pacified, not defeated with a bow.`;
            } else if (player.lastUsedWeaponType === 'bow') {
                success = true;
                localStorage.setItem('objectiveReward_the_stalker_WWS', 'true');
                rewardLog = `Congratulations!\nA master archer's kill!\n\nReward: You'll start your next run with an AI-remixed legendary 'themed bow'.`;
            } else {
                failureLog = `Optional Objective Failed.\nThe final blow was from a ${player.lastUsedWeaponType || 'non-bow source'}.`;
            }
            break;
        case 'objective_cut_throat':
            if (isPeacefulVictory) {
                failureLog = `Optional Objective Failed.\nThe boss was pacified, not defeated with a bladed weapon.`;
            } else if (player.lastUsedWeaponType === 'bladed') {
                success = true;
                localStorage.setItem('objectiveReward_cut_throat_WWS', 'true');
                rewardLog = `Congratulations!\nA clean, close kill with a blade!\n\nReward: You'll start your next run with an AI-remixed legendary 'themed bladed weapon'.`;
            } else {
                failureLog = `Optional Objective Failed.\nThe final blow was from a ${player.lastUsedWeaponType || 'non-bladed source'}.`;
            }
            break;
        case 'objective_the_expediter':
            if (localStorage.getItem('objectiveCondition_the_expediter_WWS') === 'true') {
                success = true;
                modPlayer.gold += 100;
                modPlayer.runStats.gold_earned += 100;
                modPlayer.runStats.mostGoldHeld = Math.max(modPlayer.runStats.mostGoldHeld || 0, modPlayer.gold);
                rewardLog = `Congratulations!\nYou Expedited the mission!\n\nReward: +100 Gold.`;
                triggerGoldFlash(PLAYER_ID);
            } else {
                failureLog = `Optional Objective Failed.\nYou did not Expedite the mission.`;
            }
            localStorage.removeItem('objectiveCondition_the_expediter_WWS');
            break;
        case 'objective_master_trapper':
            if (modPlayer.runStats.animals_killed_by_trap >= 3) {
                success = true;
                localStorage.setItem('objectiveReward_master_trapper_WWS', 'true');
                rewardLog = `Congratulations!\nYou trapped ${modPlayer.runStats.animals_killed_by_trap} animals!\n\nReward: You'll start your next run with an AI-remixed legendary 'themed trap'.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou only trapped ${modPlayer.runStats.animals_killed_by_trap} animals.`;
            }
            break;
        case 'objective_fur_trader':
            if ((modPlayer.runStats.trophies_sold || 0) >= 5) {
                success = true;
                localStorage.setItem('objectiveReward_fur_trader_WWS', 'true');
                rewardLog = `Congratulations!\nYou sold ${modPlayer.runStats.trophies_sold} trophies!\n\nReward: You'll start your next journey with an AI-remixed legendary themed fur coat.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou only sold ${modPlayer.runStats.trophies_sold || 0} trophies.`;
            }
            break;
        case 'objective_the_lawman':
            if ((modPlayer.runStats.objectives_sold || 0) >= 3) {
                success = true;
                modPlayer.gold += 100;
                modPlayer.runStats.gold_earned += 100;
                modPlayer.runStats.mostGoldHeld = Math.max(modPlayer.runStats.mostGoldHeld || 0, modPlayer.gold);
                rewardLog = `Congratulations!\nYou sold ${modPlayer.runStats.objectives_sold} bounties!\n\nReward: +100 Gold.`;
                triggerGoldFlash(PLAYER_ID);
            } else {
                failureLog = `Optional Objective Failed.\nYou only sold ${modPlayer.runStats.objectives_sold || 0} bounties.`;
            }
            break;
        case 'objective_human_peacemaker':
            if ((modPlayer.runStats.deEscalations || 0) >= 1) {
                success = true;
                localStorage.setItem('objectiveReward_human_peacemaker_WWS', 'true');
                rewardLog = `Congratulations!\nYou de-escalated ${modPlayer.runStats.deEscalations} human encounter(s)!\n\nReward: You'll start your next journey with an AI-remixed legendary themed weapon.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou did not de-escalate any human encounters.`;
            }
            break;
        case 'objective_animal_peacemaker':
            if ((modPlayer.runStats.animalsPet || 0) >= 1) {
                success = true;
                localStorage.setItem('objectiveReward_animal_peacemaker_WWS', 'true');
                rewardLog = `Congratulations!\nYou pacified ${modPlayer.runStats.animalsPet} animal(s)!\n\nReward: You'll start your next journey with an AI-remixed legendary themed provision.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou did not pacify any animal encounters.`;
            }
            break;
        case 'objective_big_spender':
            const restockCost = 10 + (modPlayer.ngPlusLevel * 5);
            const goldSpentOnItems = (modPlayer.runStats.gold_spent || 0) - ((modPlayer.runStats.times_restocked || 0) * restockCost);
            if (goldSpentOnItems >= 500) {
                success = true;
                const currentGold = parseInt(localStorage.getItem('ngPlusPlayerGold_WWS') || '0');
                localStorage.setItem('ngPlusPlayerGold_WWS', (currentGold + 100).toString());
                rewardLog = `Congratulations!\nYou spent ${goldSpentOnItems} Gold at the store!\n\nReward: You'll begin your next journey with an additional +100 Gold.`;
            } else {
                failureLog = `Optional Objective Failed.\nYou only spent ${goldSpentOnItems || 0} Gold on items.`;
            }
            break;
    }
    
    if (success) modPlayer.runStats.objectivesCompleted = 1;

    const finalMessage = success ? rewardLog : failureLog;
    _log(finalMessage, success ? 'gold' : 'event');
    return { updatedPlayer: modPlayer, objectiveStatus: success ? 'success' : 'failure', objectiveMessage: finalMessage };
};

/**
 * Handles the logic for an event card's immediate effect upon being revealed.
 * @returns An object detailing the outcome, including player updates and whether the turn ended.
 */
export const applyImmediateEventAndCheckEndTurn = (
    event: CardData,
    player: PlayerDetails,
    currentAIBoss: CardData | undefined,
    ngPlusLevel: number,
    lastAttackPowerRef: React.MutableRefObject<number>,
    _log: (message: string, type?: LogEntry['type']) => void,
    triggerGoldFlash: (playerId: string) => void,
    triggerAnimation: (type: string, target?: string) => Promise<void>,
    triggerBanner: (message: string, bannerType: ActiveGameBannerState['bannerType']) => void,
    getBaseCardByIdentifier: (card: CardData | null) => CardData | null,
    applyDamageAndGetAnimation: (player: PlayerDetails, damage: number, source: string, isBossFight?: boolean, eventId?: string, suppressLog?: boolean, sourceCard?: CardData) => { updatedPlayer: PlayerDetails, animationDetails: any }
): {
    updatedPlayer: PlayerDetails;
    turnEndedByEvent: boolean;
    gameShouldEnd: boolean;
    eventRemoved: boolean;
    winReason?: string;
    damageInfo?: { amount: number; sourceName: string; eventId?: string } | null;
    modifiedEventAfterTrap?: CardData | null;
    eventThatEndedTurn?: CardData;
} => {
    const theme = getThemeName(ngPlusLevel);
    let modifiablePlayer = { ...player };
    let turnEndedByEvent = false;
    let gameShouldEnd = false;
    let eventRemovedInitially = false;
    let winReason = '';
    let damageInfoForAnimation: { amount: number; sourceName: string; eventId?: string } | null = null;
    let eventForProcessing: CardData | null = { ...event };
    let eventThatEndedTurnForReturn: CardData | undefined = undefined;

    const isBossEvent = !!currentAIBoss && eventForProcessing?.id === currentAIBoss.id;

    if (modifiablePlayer.activeTrap && eventForProcessing && eventForProcessing.type === 'Event' && (eventForProcessing.subType === 'animal' || eventForProcessing.subType === 'human')) {
        _log(`Active trap (${modifiablePlayer.activeTrap.name}) interacting with: ${eventForProcessing.name}.`, 'debug');
        const trapInteractionResult = handleTrapInteractionWithEvent(modifiablePlayer, eventForProcessing, modifiablePlayer.activeTrap, isBossEvent, triggerBanner, triggerAnimation, _log, lastAttackPowerRef);

        if (trapInteractionResult.trapConsumedAndDiscarded) {
            _log(`${modifiablePlayer.activeTrap.name} was triggered and consumed.`, 'info');
        }
        trapInteractionResult.logMessages.forEach(logEntry => _log(logEntry.message, logEntry.type));
        eventForProcessing = trapInteractionResult.updatedEvent;
        modifiablePlayer = trapInteractionResult.updatedPlayer;

        if (trapInteractionResult.trophyCard) {
            modifiablePlayer.playerDiscard = [...modifiablePlayer.playerDiscard, trapInteractionResult.trophyCard];
            if (trapInteractionResult.trophyCard.type === 'Objective Proof') {
                _log(`${modifiablePlayer.name || 'Player'} collects Objective Proof for ${event.name}.`, 'info');
            } else {
                _log(`${modifiablePlayer.name || 'Player'} collects a Trophy: ${trapInteractionResult.trophyCard.name}.`, 'info');
            }
        }

        if (trapInteractionResult.goldFromBossDefeat && trapInteractionResult.goldFromBossDefeat > 0) {
            modifiablePlayer.gold += trapInteractionResult.goldFromBossDefeat;
            modifiablePlayer.runStats.gold_earned += trapInteractionResult.goldFromBossDefeat;
            modifiablePlayer.runStats.mostGoldHeld = Math.max(modifiablePlayer.runStats.mostGoldHeld || 0, modifiablePlayer.gold);
            triggerGoldFlash(PLAYER_ID);
        }

        if (trapInteractionResult.trapConsumedAndDiscarded) {
            if (modifiablePlayer.activeTrap) {
                modifiablePlayer.playerDiscard = [...modifiablePlayer.playerDiscard, modifiablePlayer.activeTrap];
            }
            modifiablePlayer.activeTrap = null;
            triggerAnimation('trap-display-activated', 'trapDisplay');
        }
    }

    if (!eventForProcessing) {
        return { updatedPlayer: modifiablePlayer, turnEndedByEvent, gameShouldEnd, eventRemoved: true, winReason, damageInfo: damageInfoForAnimation, modifiedEventAfterTrap: null, eventThatEndedTurn: eventThatEndedTurnForReturn };
    }

    const currentEventInstance = eventForProcessing;
    const eventEffect = currentEventInstance.effect;
    const eventId = currentEventInstance.id;
    
    // New, smarter logging for event reveals
    if (currentEventInstance.type !== 'Event') {
        _log(getRandomLogVariation('eventRevealItem', { itemName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance), 'info');
    } else { // It's a card of type 'Event'
        switch (currentEventInstance.subType) {
            case 'objective':
                _log(getRandomLogVariation('eventRevealObjective', {
                    playerName: modifiablePlayer.name || 'Player',
                    objectiveName: currentEventInstance.name,
                    objective_description: currentEventInstance.effect?.objective_description || 'A mysterious task.',
                }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');
                break;
            case 'animal':
            case 'human':
                soundManager.playSound('threat_reveal');
                const isBoss = currentAIBoss?.id === currentEventInstance.id;
                if (currentEventInstance.subType === 'animal' && !isBoss) {
                    setTimeout(() => soundManager.playSound(currentEventInstance.id), 500);
                } else if (currentEventInstance.subType === 'human') {
                    setTimeout(() => soundManager.playSound('human_threat_reveal'), 500);
                }
                const health = currentEventInstance.health || 0;
                let tier: 'Low' | 'Mid' | 'High' = 'Low';
                if (health > 15) tier = 'High';
                else if (health > 8) tier = 'Mid';
                
                let logCategory = `eventRevealThreat${tier}`;
                const lowerCasePlayerName = player.name?.toLowerCase();
                const lowerCaseEventName = currentEventInstance.name.toLowerCase();

                if (lowerCaseEventName.includes('bear') && lowerCasePlayerName === 'hugh glass') {
                    logCategory = 'eventRevealBear';
                } else if (lowerCaseEventName.includes('snake') && lowerCasePlayerName === 'indiana jones') {
                    logCategory = 'eventRevealSnake';
                }

                _log(getRandomLogVariation(logCategory, { enemyName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');
                break;
            case 'illness':
                // Illness logging is now handled inside the illness logic block
                break;
            case 'environmental':
                 _log(getRandomLogVariation('eventRevealEnvironmental', { eventName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');
                break;
            default:
                _log(`An unusual event occurs: ${currentEventInstance.name}`, 'event');
                break;
        }
    }


    if (!currentEventInstance.name || !currentEventInstance.type) {
      _log(`ERROR: Revealed event card is malformed: ${JSON.stringify(currentEventInstance)}`, 'error');
    }

    if (currentEventInstance.subType === 'illness') {
        const bannerType: ActiveGameBannerState['bannerType'] = eventEffect?.turn_end ? 'turn_ending_event' : 'event_alert';
        triggerBanner(currentEventInstance.name, bannerType);

        let illnessLogCategory = eventEffect?.turn_end ? 'illnessContractsAndEndsTurn' : 'illnessContracts';
        if (player.name?.toLowerCase() === 'doc holliday') {
            illnessLogCategory = 'illnessContractsHolliday';
        }
        _log(getRandomLogVariation(illnessLogCategory, { illnessName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');

        if (eventEffect?.turn_end) {
            turnEndedByEvent = true;
            eventRemovedInitially = true;
            eventThatEndedTurnForReturn = event;
        }

        if (eventId.startsWith('threat_mountain_sickness')) {
            modifiablePlayer.mountainSicknessActive = true;
            modifiablePlayer.mountainSicknessTurnsRemaining = 2; 
            modifiablePlayer.runStats.illnesses_contracted++;
        } else {
             if (!modifiablePlayer.currentIllnesses.some(ill => ill.id === currentEventInstance.id)) {
                modifiablePlayer.currentIllnesses.push(currentEventInstance);
                modifiablePlayer.runStats.illnesses_contracted++;
                triggerAnimation('player-is-ill', 'player');
            } else {
                _log(`${modifiablePlayer.name || 'Player'} is already suffering from ${currentEventInstance.name}.`, 'info');
            }
        }

        const damageAmount = eventEffect?.type === 'damage' ? (eventEffect.amount || 0) : 0;
        if (damageAmount > 0) {
            const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, damageAmount, currentEventInstance.name, isBossEvent, eventId, true, currentEventInstance);
            modifiablePlayer = updatedPlayer;
            damageInfoForAnimation = animationDetails;
        }

    } else if (currentEventInstance.subType === 'environmental' || eventId.startsWith('threat_thief_') || eventId.startsWith('threat_rattlesnake_') || eventId.startsWith('threat_skunk_')) {
        const bannerType: ActiveGameBannerState['bannerType'] = eventEffect?.turn_end ? 'turn_ending_event' : 'event_alert';
        triggerBanner(currentEventInstance.name, bannerType);
    }

    if (currentEventInstance.immediateEffect?.type === 'random_gold_steal' && currentEventInstance.immediateEffect.maxAmount) {
        const goldStolen = Math.floor(Math.random() * (currentEventInstance.immediateEffect.maxAmount + 1));
        if (goldStolen > 0 && modifiablePlayer.gold > 0) {
            const actualStolen = Math.min(goldStolen, modifiablePlayer.gold);
            modifiablePlayer.gold -= actualStolen;
            modifiablePlayer.runStats.gold_spent += actualStolen;
            modifiablePlayer.runStats.mostGoldHeld = Math.max(modifiablePlayer.runStats.mostGoldHeld || 0, modifiablePlayer.gold);
            _log(getRandomLogVariation('goldStolen', { eventName: currentEventInstance.name, stolenAmount: actualStolen }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');
            triggerGoldFlash(PLAYER_ID);
            modifiablePlayer.goldStolenThisTurn = actualStolen;
        } else if (goldStolen > 0) {
            _log(getRandomLogVariation('noGoldToSteal', { eventName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');
        }
    }

    // New on-reveal attack logic
    const isNightAttacker = eventId.startsWith('threat_rattlesnake_') || eventId.startsWith('threat_skunk_') || eventId.startsWith('threat_thief_');
    if (currentEventInstance.type === 'Event' &&
        (currentEventInstance.subType === 'human' || currentEventInstance.subType === 'animal') &&
        !isNightAttacker &&
        eventEffect?.type === 'damage' &&
        (eventEffect.amount || 0) > 0
    ) {
        _log(getRandomLogVariation('enemyAttackImmediate', { enemyName: currentEventInstance.name, playerName: modifiablePlayer.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'event');
        const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, eventEffect.amount || 0, currentEventInstance.name, isBossEvent, eventId, false, currentEventInstance);
        modifiablePlayer = updatedPlayer;
        damageInfoForAnimation = animationDetails;
        triggerAnimation('player-area-shake-effect', 'player');
        if (modifiablePlayer.health <= 0) {
            gameShouldEnd = true;
            winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent);
            return { updatedPlayer: modifiablePlayer, turnEndedByEvent, gameShouldEnd, eventRemoved: true, winReason, damageInfo: damageInfoForAnimation, modifiedEventAfterTrap: null, eventThatEndedTurn: eventThatEndedTurnForReturn };
        }
    }


    if (eventEffect?.turn_end && !turnEndedByEvent) {
        turnEndedByEvent = true;
        eventThatEndedTurnForReturn = event;
        if (currentEventInstance.subType !== 'illness') {
          eventRemovedInitially = true;
        }

        if (currentEventInstance.subType === 'environmental') {
          const cardsFromHandToDiscard = modifiablePlayer.hand.filter(c => c !== null) as CardData[];
          if (cardsFromHandToDiscard.length > 0) {
              const baseCardsToDiscard = cardsFromHandToDiscard.map(c => getBaseCardByIdentifier(c)).filter(Boolean);
              if (baseCardsToDiscard.length > 0) {
                  modifiablePlayer.playerDiscard = [...modifiablePlayer.playerDiscard, ...baseCardsToDiscard as CardData[]];
              }
          }
          modifiablePlayer.hand = new Array(modifiablePlayer.handSize).fill(null);
        }

        if (eventEffect?.type === 'damage_percent') { // Lightning Strike
            const damage = Math.ceil(modifiablePlayer.health * (eventEffect.amount || 0));
            const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, damage, currentEventInstance.name, isBossEvent, eventId, false, currentEventInstance);
            modifiablePlayer = updatedPlayer;
            damageInfoForAnimation = animationDetails;
            if (modifiablePlayer.health > 0) modifiablePlayer.runStats.lightningStrikesSurvived++;
        } else if (eventEffect?.discard_equipped) { // Rockslide
            const { updatedPlayer, animationDetails } = applyDamageAndGetAnimation(modifiablePlayer, eventEffect.amount || 0, currentEventInstance.name, isBossEvent, eventId, false, currentEventInstance);
            modifiablePlayer = updatedPlayer;
            damageInfoForAnimation = animationDetails;

            if (modifiablePlayer.health > 0 && eventEffect.discard_equipped && modifiablePlayer.equippedItems.length > 0) {
                const originalEquippedItems = [...modifiablePlayer.equippedItems];
                const itemsToDiscard: CardData[] = [];
                const remainingEquippedItems: CardData[] = [];
                const discardedItemNamesArr: string[] = [];
                
                originalEquippedItems.forEach((item, index) => {
                    if (item.id.includes('upgrade_iron_will')) {
                        remainingEquippedItems.push(item);
                    } else {
                        let itemToDiscardInstance = { ...item }; // copy instance
                        discardedItemNamesArr.push(item.name);
                        
                        if (item.effect?.subtype === 'storage') {
                            const contents = modifiablePlayer.satchels[index] || [];
                            if (contents.length > 0) {
                                itemToDiscardInstance.satchelContents = [...contents];
                            }
                        }

                        itemsToDiscard.push(itemToDiscardInstance);

                        if (item.effect?.subtype === 'max_health' && item.effect.amount) {
                            modifiablePlayer.maxHealth = Math.max(1, modifiablePlayer.maxHealth - item.effect.amount);
                            modifiablePlayer.health = Math.min(modifiablePlayer.health, modifiablePlayer.maxHealth);
                        } else if (item.effect?.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') {
                            modifiablePlayer.maxHealth = Math.max(1, modifiablePlayer.maxHealth - item.effect.max_health);
                            modifiablePlayer.health = Math.min(modifiablePlayer.health, modifiablePlayer.maxHealth);
                        }
                    }
                });

                if (itemsToDiscard.length > 0) {
                    _log(getRandomLogVariation('rockslideDiscardEquipped', { eventName: event.name, discardedItemNames: discardedItemNamesArr.join(', ') }, theme, modifiablePlayer, event, isBossEvent), 'event');
                    
                    const processedItems = itemsToDiscard.map(item => {
                        if (item.effect?.subtype === 'storage') {
                            return item;
                        }
                        return item; // Keep the instance
                    }).filter((c): c is CardData => c !== null);

                    modifiablePlayer.playerDiscard.push(...processedItems);
                    
                    const oldSatchels = { ...modifiablePlayer.satchels };
                    modifiablePlayer.equippedItems = remainingEquippedItems;
                    
                    const newSatchels: { [key: number]: CardData[] } = {};
                    modifiablePlayer.equippedItems.forEach((newItem, newIndex) => {
                        if (newItem.effect?.subtype === 'storage') {
                            const originalIndex = originalEquippedItems.findIndex(origItem => origItem === newItem);
                            if (originalIndex !== -1 && oldSatchels[originalIndex]) {
                                newSatchels[newIndex] = oldSatchels[originalIndex];
                            }
                        }
                    });
                    modifiablePlayer.satchels = newSatchels;

                } else if (modifiablePlayer.equippedItems.some(item => item.id.includes('upgrade_iron_will'))) {
                    _log(getRandomLogVariation('rockslideIronWillSave', { eventName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent), 'info');
                }
            }
        }
    }

    if (modifiablePlayer.health <= 0 && !gameShouldEnd) {
        gameShouldEnd = true;
        winReason = getRandomLogVariation('playerDefeat', { playerName: modifiablePlayer.character?.name || 'Player', enemyName: currentEventInstance.name }, theme, modifiablePlayer, currentEventInstance, isBossEvent);
    }

    return { updatedPlayer: modifiablePlayer, turnEndedByEvent, gameShouldEnd, eventRemoved: eventRemovedInitially || !eventForProcessing, winReason, damageInfo: damageInfoForAnimation, modifiedEventAfterTrap: eventRemovedInitially ? null : eventForProcessing, eventThatEndedTurn: eventThatEndedTurnForReturn };
};

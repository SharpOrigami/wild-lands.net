import { CardData, CardContext, PlayerDetails } from '../types.ts';
import { NG_PLUS_THEME_MILESTONE_INTERVAL, APP_VERSION, ALL_CARDS_DATA_MAP, EVENT_DECK_SIZE, CHARACTERS_DATA_MAP } from '../constants.ts';

// A static version string for cache busting. Change this value to force all clients to re-download assets.
const BUSTER = `v=${APP_VERSION}`;
export function getCacheBustedUrl(url: string | undefined): string {
    if (!url) {
        return '';
    }
    // Check if URL already has query params
    if (url.includes('?')) {
        return `${url}&${BUSTER}`;
    }
    return `${url}?${BUSTER}`;
}

export function shuffleArray<T,>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function pickRandomDistinctFromPool<T>(pool: T[], filter: (item: T) => boolean, count: number): { picked: T[]; remainingPool: T[] } {
  const matchingItems: T[] = [];
  const otherItems: T[] = [];

  for (const item of pool) {
    if (filter(item)) {
      matchingItems.push(item);
    } else {
      otherItems.push(item);
    }
  }

  const shuffled = shuffleArray(matchingItems);
  const picked = shuffled.slice(0, count);
  const remainingFromMatch = shuffled.slice(count);
  
  const remainingPool = [...remainingFromMatch, ...otherItems];
  return { picked, remainingPool };
}


export function createTrophyOrBountyCard(threat: CardData): CardData {
    if (!threat || !threat.id) {
      // Return a default/fallback card if threat is null, undefined, or lacks an ID
      return {
        id: `objective_proof_unknown`,
        name: `Unknown Objective Proof`,
        type: 'Objective Proof',
        sellValue: 1,
        description: `Proof of a deed lost to memory. It's worth something, at least.`,
      };
    }
    
    if (threat.subType === 'human') {
      return {
        id: `objective_proof_${threat.id}`,
        name: threat.name,
        type: 'Objective Proof',
        sellValue: threat.goldValue || 5,
        description: `Proof of having dealt with the notorious ${threat.name}. A sheriff or magistrate would pay for this.`,
      };
    } else { // 'animal' or other non-human
      const trophyNamePart = threat.name.includes('Wolf Pack') ? 'Wolf Pelts' 
                            : threat.name.includes('Bison') ? 'Bison Hide'
                            : threat.name.includes('Grizzly') ? 'Grizzly Pelt'
                            : threat.name.includes('Bear') ? 'Bear Pelt'
                            : threat.name.includes('Moose') ? 'Moose Antlers'
                            : threat.name.includes('Elk') ? 'Elk Antlers'
                            : threat.name.includes('Cougar') ? 'Cougar Pelt'
                            : threat.name.includes('Rattlesnake') ? 'Rattlesnake Skin'
                            : `${threat.name} Pelt`;
  
      return {
        id: `trophy_${threat.id}`,
        name: trophyNamePart,
        type: 'Trophy',
        sellValue: threat.goldValue || 1,
        description: `A trophy from a vanquished ${threat.name}. It will fetch a decent price at any trading post.`,
      };
    }
}

export function isFirearm(card: CardData | null): boolean {
    if (!card) return false;
    const id = card.id;
    // Check for various firearm types by their ID prefix across all themes.
    return id.startsWith('item_sawed_off') || 
           id.startsWith('item_rifle') || 
           id.startsWith('item_hunting_rifle') ||
           id.startsWith('item_six_shooter') ||
           id.startsWith('item_six_iron') ||
           id.startsWith('remixed_weapon_rifle_') ||
           id.startsWith('remixed_weapon_six_shooter_') ||
           // Africa Safari (NG+20) firearms
           id.startsWith('item_bolt_action_rifle') ||
           id.startsWith('item_elephant_gun') ||
           id.startsWith('item_webley_revolver') ||
           id.startsWith('item_double_rifle');
}

export function isBow(card: CardData | null): boolean {
    if (!card) return false;
    const id = card.id;

    // Check for standard bow and long bow prefixes, this now includes crossbows from horror theme.
    if (id.startsWith('item_bow') || id.startsWith('item_long_bow')) {
        return true;
    }

    // Check for remixed bows, including hypothetical remixed long bows
    if (id.startsWith('remixed_weapon_') && id.includes('bow')) {
        return true;
    }

    return false;
}

export const getScaledCard = (baseCard: CardData, ngPlusLevel: number): CardData => {
    if (ngPlusLevel <= 0) return baseCard;

    const scaledCard = JSON.parse(JSON.stringify(baseCard));
    let isModified = false;

    // Threat Scaling
    if (baseCard.type === 'Event' && (baseCard.subType === 'animal' || baseCard.subType === 'human')) {
        const incrementAmount = ngPlusLevel % NG_PLUS_THEME_MILESTONE_INTERVAL;

        if (incrementAmount > 0) {
            isModified = true;
            if (typeof scaledCard.health === 'number') {
                scaledCard.health = Math.max(1, scaledCard.health + incrementAmount);
            }
            if (scaledCard.effect?.type === 'damage' && typeof scaledCard.effect.amount === 'number') {
                    scaledCard.effect.amount += incrementAmount;
            } else if (scaledCard.effect?.type === 'poison' && typeof scaledCard.effect.damage === 'number') {
                    scaledCard.effect.damage += incrementAmount;
            }
            if (typeof scaledCard.goldValue === 'number') {
                scaledCard.goldValue += incrementAmount;
            }
        }
    }

    // Store Item Cost Scaling
    if (scaledCard.buyCost) {
        const baseCost = Number(scaledCard.buyCost);

        if (!isNaN(baseCost) && baseCost > 0) {
            isModified = true;
            const ngPlusMultiplier = 1 + (ngPlusLevel * 0.1);
            scaledCard.buyCost = Math.ceil(baseCost * ngPlusMultiplier);
        } else if (scaledCard.buyCost !== 0) {
             // If buyCost is invalid (not a positive number), it could be due to data corruption.
             // Log a warning and try to recover by using the original base card's cost.
             console.warn(`Invalid buyCost detected for ${scaledCard.id}:`, scaledCard.buyCost);
             const originalBaseCard = ALL_CARDS_DATA_MAP[scaledCard.id];
             if (originalBaseCard && typeof originalBaseCard.buyCost === 'number' && originalBaseCard.buyCost > 0) {
                console.warn(`Reverting to base buyCost of ${originalBaseCard.buyCost} and rescaling.`);
                isModified = true;
                const ngPlusMultiplier = 1 + (ngPlusLevel * 0.1);
                scaledCard.buyCost = Math.ceil(originalBaseCard.buyCost * ngPlusMultiplier);
             }
        }
    }

    return isModified ? scaledCard : baseCard;
};

export function applyDifficultyBonus(card: CardData, bonus: number): CardData {
    if (bonus <= 0 || card.type !== 'Event') {
        return card;
    }

    const modifiedCard = JSON.parse(JSON.stringify(card));
    let isModified = false;

    const isThreat = card.subType === 'animal' || card.subType === 'human' || card.id.startsWith('default_boss');
    const isEnvironmentalDamage = card.subType === 'environmental' && modifiedCard.effect?.type === 'damage' && typeof modifiedCard.effect.amount === 'number' && modifiedCard.effect.amount > 0;

    if (isThreat) {
        if (typeof modifiedCard.health === 'number' && modifiedCard.health > 0) {
            modifiedCard.health += bonus;
            isModified = true;
        }
        if (modifiedCard.effect) {
            const effect = modifiedCard.effect;
            if (effect.type === 'damage' && typeof effect.amount === 'number' && effect.amount > 0) {
                effect.amount += bonus;
                isModified = true;
            }
            if (effect.type === 'poison' && typeof effect.damage === 'number' && effect.damage > 0) {
                effect.damage += bonus;
                isModified = true;
            }
            if (effect.type === 'conditional_damage' && typeof effect.damage === 'number' && effect.damage > 0) {
                effect.damage += bonus;
                isModified = true;
            }
            if (effect.type === 'apply_illness_on_linger' && typeof effect.damage_on_apply === 'number' && effect.damage_on_apply > 0) {
                effect.damage_on_apply += bonus;
                isModified = true;
            }
        }
        if (typeof modifiedCard.goldValue === 'number' && modifiedCard.goldValue > 0) {
            modifiedCard.goldValue += bonus;
            isModified = true;
        }
    } else if (isEnvironmentalDamage) {
        modifiedCard.effect.amount += bonus;
        isModified = true;
    }

    return isModified ? modifiedCard : card;
}

export function buildEventDeck(cardPool: CardData[], ngPlusLevel: number): CardData[] {
  let currentCardPool = cardPool.filter(c => c.subType !== 'objective');
  const uniqueCharItemIds = new Set(Object.values(CHARACTERS_DATA_MAP).map(c => c.starterDeck[2]));

  const threatFilter = (c: CardData) => c.type === 'Event' && (c.subType === 'animal' || c.subType === 'human');
  const illnessEnvFilter = (c: CardData) => c.type === 'Event' && (c.subType === 'illness' || c.subType === 'environmental');
  const valuableFilter = (c: CardData) => c.type === 'Item' && (c.id.startsWith('item_gold_nugget') || c.id.startsWith('item_jewelry'));
  const genericItemFilter = (c: CardData) => (c.type === 'Item' || c.type === 'Provision' || c.type === 'Action' || c.type === 'Player Upgrade') && !valuableFilter(c) && !uniqueCharItemIds.has(c.id);

  let threatResult = pickRandomDistinctFromPool(currentCardPool, threatFilter, 15);
  currentCardPool = threatResult.remainingPool;
  let illnessResult = pickRandomDistinctFromPool(currentCardPool, illnessEnvFilter, 2);
  currentCardPool = illnessResult.remainingPool;
  let valuableResult = pickRandomDistinctFromPool(currentCardPool, valuableFilter, Math.floor(Math.random() * 4));
  currentCardPool = valuableResult.remainingPool;

  const neededFillerItems = EVENT_DECK_SIZE - (threatResult.picked.length + illnessResult.picked.length + valuableResult.picked.length);
  let fillerResult = pickRandomDistinctFromPool(currentCardPool, genericItemFilter, neededFillerItems > 0 ? neededFillerItems : 0);

  const allPickedForEventDeck = [...threatResult.picked, ...illnessResult.picked, ...valuableResult.picked, ...fillerResult.picked];
  
  let eventThreats = allPickedForEventDeck.filter(c => c.subType === 'animal' || c.subType === 'human');
  const eventNonThreats = shuffleArray(allPickedForEventDeck.filter(c => c.subType !== 'animal' && c.subType !== 'human'));
  
  if (ngPlusLevel % 10 === 0) {
    eventThreats.sort((a, b) => (a.health || 0) - (b.health || 0));
  } else {
    eventThreats = shuffleArray(eventThreats);
  }
  
  const finalEventDeck: CardData[] = [];
  let threatIdx = 0, nonThreatIdx = 0;
  const ratio = eventNonThreats.length > 0 ? eventThreats.length / (eventThreats.length + eventNonThreats.length) : 1;
  
  while (threatIdx < eventThreats.length || nonThreatIdx < eventNonThreats.length) {
    if (threatIdx < eventThreats.length && (Math.random() < ratio || nonThreatIdx >= eventNonThreats.length)) {
      finalEventDeck.push(eventThreats[threatIdx++]);
    } else if (nonThreatIdx < eventNonThreats.length) {
      finalEventDeck.push(eventNonThreats[nonThreatIdx++]);
    } else {
      break;
    }
  }
  
  return finalEventDeck;
}


export function getCardValues(card: CardData, context: CardContext, playerDetails?: PlayerDetails) {
    let primaryStat: string | null = null;
    let goldDisplayValue: string | null = null;

    // Primary Stat (HP or AT) Logic
    if (card.effect) {
        // Player Upgrades
        if (card.type === 'Player Upgrade') {
            const { effect } = card;
            if (effect.subtype === 'max_health' && effect.amount) {
                primaryStat = `+${effect.amount}HP`;
            } else if (effect.subtype === 'damage_negation' && effect.max_health) {
                primaryStat = `+${effect.max_health}HP`;
            } else if (['bow_boost', 'firearm_boost', 'knife_boost'].includes(effect.subtype || '') && effect.amount) {
                primaryStat = `+${effect.amount}AT`;
            } else if (effect.subtype === 'firearm_multiplier' || effect.subtype === 'bow_multiplier' || effect.subtype === 'bladed_multiplier') {
                if(effect.multiplier) {
                    primaryStat = `x${effect.multiplier} AT`;
                }
            }
        }
        // Provisions
        else if (card.type === 'Provision' && card.effect.type === 'heal') {
            const healAmount = playerDetails ? calculateHealAmount(card, playerDetails) : (card.effect.amount || 0);
            if (healAmount > 0) primaryStat = `${healAmount}HP`;
        }
        // Weapons and Actions
        else if (card.type === 'Item' || card.type === 'Action') {
            if (card.effect.type === 'weapon' || card.effect.type === 'conditional_weapon') {
                const attackPower = playerDetails ? calculateAttackPower(card, playerDetails, context, null) : card.effect.attack || 0;
                if (attackPower > 0) primaryStat = `${attackPower}AT`;
            } else if (card.effect.type === 'trick_shot') {
                primaryStat = `+${card.effect.damage || 2}AT`;
            } else if (card.effect.type === 'fire_arrow') {
                primaryStat = `+${card.effect.damage || 2}AT`;
            }
        }
        // Events
        else if (card.type === 'Event' && context === CardContext.EVENT) {
            if (card.effect.type === 'damage_percent' && card.effect.amount) {
                primaryStat = `${Math.round(card.effect.amount * 100)}%`;
            } else if (card.effect.type === 'damage' && (card.effect.amount || 0) > 0) {
                primaryStat = `${card.effect.amount}AT`;
            } else if (card.effect.type === 'poison' && (card.effect.damage || 0) > 0) {
                primaryStat = `${card.effect.damage}AT`;
            } else if (card.effect.type === 'conditional_damage' && (card.effect.damage || 0) > 0) {
                primaryStat = `${card.effect.damage}AT`;
            } else if (['damage', 'poison', 'conditional_damage'].includes(card.effect.type) && (card.effect.amount || 0) === 0 && (card.effect.damage || 0) === 0) {
                primaryStat = `0AT`;
            }
        }
    }


    // Gold Value Display Logic
    if (card.type === 'Trophy' || card.type === 'Objective Proof') {
        if (card.sellValue) goldDisplayValue = `${card.sellValue}G`;
    } else if (context === CardContext.STORE) {
        if (card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry')) {
             if (card.sellValue) goldDisplayValue = `${card.sellValue}G`;
        }
    } else if (card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry')) {
        if (card.sellValue) goldDisplayValue = `${card.sellValue}G`;
    } else if (card.effect?.type === 'gold' && !card.id.startsWith('item_gold_nugget') && !card.id.startsWith('item_jewelry')) {
         if (card.effect.amount) goldDisplayValue = `${card.effect.amount}G`;
    } else if (card.sellValue && card.sellValue > 0 && context === CardContext.HAND && !card.id.startsWith('item_gold_nugget') && !card.id.startsWith('item_jewelry')) {
        goldDisplayValue = `${card.sellValue}G`;
    } else if (context === CardContext.EVENT && card.type === 'Event' && card.goldValue) {
        goldDisplayValue = `${card.goldValue}G`;
    }


    return {
        primaryStat: primaryStat,
        gold: goldDisplayValue
    };
}


export function getAttackPowerBreakdown(card: CardData, playerDetails: PlayerDetails, source: CardContext): string | null {
    if (!card.effect || (card.effect.type !== 'weapon' && card.effect.type !== 'conditional_weapon')) return null;

    const parts_pre_multiplier: { label: string, value: string }[] = [];
    const multipliers: { label: string, value: number }[] = [];
    const parts_post_multiplier: { label: string, value: string }[] = [];
    
    let basePower = card.effect.attack || 0;
    
    if (card.effect.type === 'conditional_weapon') {
        const hasAnotherKnife = playerDetails.hand.some(c => c && c.id !== card.id && c.effect?.subtype === 'sword') || playerDetails.equippedItems.some(c => c.id !== card.id && c.effect?.subtype === 'sword');
        const otherFirearms = playerDetails.hand.some(c => c && c.id !== card.id && isFirearm(c)) || playerDetails.equippedItems.some(c => c.id !== card.id && isFirearm(c));
        
        let conditionalMet = false;
        if (card.effect.condition === 'is_firearm' && otherFirearms) conditionalMet = true;
        if (card.effect.condition === 'is_knife' && hasAnotherKnife) conditionalMet = true;
        
        if (conditionalMet) {
            parts_pre_multiplier.push({ label: 'Base (Conditional)', value: `+${basePower + (card.effect.bonus_attack || 0)}` });
        } else {
            parts_pre_multiplier.push({ label: 'Base', value: `+${basePower}` });
        }
    } else {
        parts_pre_multiplier.push({ label: 'Base', value: `+${basePower}` });
    }

    if (source === CardContext.EQUIPPED) {
        parts_pre_multiplier.push({ label: 'Equipped Bonus', value: '+1' });
    }

    const isFirearmCard = isFirearm(card);
    const isBowCard = isBow(card);
    const isKnife = card.effect?.subtype === 'sword';

    // Pre-multiplier buffs (from EQUIPPED items)
    playerDetails.equippedItems.forEach(item => {
        const effect = item.effect;
        if (effect?.persistent && effect.type === 'upgrade') {
            if (isFirearmCard && effect.subtype === 'firearm_boost') parts_pre_multiplier.push({ label: item.name, value: `+${effect.amount || 0}` });
            if (isBowCard && effect.subtype === 'bow_boost') parts_pre_multiplier.push({ label: item.name, value: `+${effect.amount || 0}` });
            if (isKnife && effect.subtype === 'knife_boost') parts_pre_multiplier.push({ label: item.name, value: `+${effect.amount || 0}` });
        }
    });

    // Multipliers (from EQUIPPED items)
    playerDetails.equippedItems.forEach(item => {
        const effect = item.effect;
        if (effect?.type === 'upgrade' && effect.multiplier && effect.multiplier > 1) {
            let applies = false;
            if (isFirearmCard && effect.subtype === 'firearm_multiplier') applies = true;
            if (isBowCard && effect.subtype === 'bow_multiplier') applies = true;
            if (isKnife && effect.subtype === 'bladed_multiplier') applies = true;
            
            if (applies) {
                multipliers.push({ label: item.name, value: effect.multiplier });
            }
        }
    });

    // Post-multiplier buffs (from HAND items)
    playerDetails.hand.forEach(item => {
        if (item && item.effect?.persistent && item.effect.type === 'upgrade') {
            const effect = item.effect;
            if (isFirearmCard && effect.subtype === 'firearm_boost') parts_post_multiplier.push({ label: item.name, value: `+${effect.amount || 0}` });
            if (isBowCard && effect.subtype === 'bow_boost') parts_post_multiplier.push({ label: item.name, value: `+${effect.amount || 0}` });
            if (isKnife && effect.subtype === 'knife_boost') parts_post_multiplier.push({ label: item.name, value: `+${effect.amount || 0}` });
        }
    });
    
    if (parts_pre_multiplier.length <= 1 && multipliers.length === 0 && parts_post_multiplier.length === 0) return null;

    let breakdownHtml = parts_pre_multiplier.map(p => `<span>${p.label}:</span><span class="text-right">${p.value}</span>`).join('');
    
    if (multipliers.length > 0) {
        multipliers.forEach(m => {
            breakdownHtml += `<span>${m.label}:</span><span class="text-right">&times;${m.value}</span>`;
        });
    }

    if (parts_post_multiplier.length > 0) {
         breakdownHtml += parts_post_multiplier.map(p => `<span>${p.label}:</span><span class="text-right">${p.value}</span>`).join('');
    }

    const total = calculateAttackPower(card, playerDetails, source, null);
    breakdownHtml += `<hr class='border-t border-[var(--ink-secondary)]/50 my-1 col-span-2'><span><strong>Total:</strong></span><span class="text-right"><strong>${total}</strong></span>`;

    return `<div class="grid grid-cols-2 gap-x-2 text-xs">${breakdownHtml}</div>`;
}

export function calculateAttackPower(card: CardData, playerDetails: PlayerDetails, source: CardContext, activeEvent: CardData | null, options?: { ignoreQuiver?: boolean; ignoreBandolier?: boolean }): number {
    if (!card.effect || (card.effect.type !== 'weapon' && card.effect.type !== 'conditional_weapon')) return 0;

    let attackPower = card.effect.attack || 0;
    const isFirearmCard = isFirearm(card);
    const isBowCard = isBow(card);
    const isKnife = card.effect?.subtype === 'sword';

    if (card.effect.type === 'conditional_weapon') {
        if (card.effect.condition === 'is_firearm') {
            const otherFirearmsInHandOrEquipped =
                playerDetails.hand.some(c => c && c.id !== card.id && isFirearm(c)) ||
                playerDetails.equippedItems.some(c => c.id !== card.id && isFirearm(c));
            if (otherFirearmsInHandOrEquipped) {
                attackPower += card.effect.bonus_attack || 0;
            }
        }
        if (card.effect.condition === 'is_knife') { 
            const hasAnotherKnife =
                playerDetails.hand.some(c => c && c.id !== card.id && c.effect?.subtype === 'sword') ||
                playerDetails.equippedItems.some(c => c.id !== card.id && c.effect?.subtype === 'sword');
            if (hasAnotherKnife) {
                attackPower += card.effect.bonus_attack || 0;
            }
        }
    }

    // Add equipped bonus and buffs from equipped items (pre-multiplier)
    if (source === CardContext.EQUIPPED) {
        attackPower += 1;
    }
    
    playerDetails.equippedItems.forEach(item => {
        if (item.effect?.type === 'upgrade' && item.effect.persistent) {
            if (isFirearmCard && item.effect.subtype === 'firearm_boost') {
                attackPower += item.effect.amount || 0;
            }
            if (isBowCard && item.effect.subtype === 'bow_boost') {
                attackPower += item.effect.amount || 0;
            }
            if (isKnife && item.effect.subtype === 'knife_boost') {
                attackPower += item.effect.amount || 0;
            }
        }
    });

    // Apply multiplier boosts from equipped items
    const multipliers: number[] = [];
    playerDetails.equippedItems.forEach(item => {
        const effect = item.effect;
        if (effect?.type === 'upgrade' && effect.multiplier && effect.multiplier > 1) {
            let applies = false;
            if (isFirearmCard && effect.subtype === 'firearm_multiplier' && !options?.ignoreBandolier) {
                applies = true;
            }
            if (isBowCard && effect.subtype === 'bow_multiplier' && !options?.ignoreQuiver) {
                applies = true;
            }
            if (isKnife && effect.subtype === 'bladed_multiplier') {
                applies = true;
            }
            if (applies) {
                multipliers.push(effect.multiplier);
            }
        }
    });
    
    if (multipliers.length > 0) {
        const totalMultiplier = multipliers.reduce((sum, current) => sum + current, 0);
        attackPower *= totalMultiplier;
    }
    
    // Add buffs from items in hand (post-multiplier)
    playerDetails.hand.forEach(item => {
        if (item && item.effect?.type === 'upgrade' && item.effect.persistent) {
            if (isFirearmCard && item.effect.subtype === 'firearm_boost') {
                attackPower += item.effect.amount || 0;
            }
            if (isBowCard && item.effect.subtype === 'bow_boost') {
                attackPower += item.effect.amount || 0;
            }
            if (isKnife && item.effect.subtype === 'knife_boost') {
                attackPower += item.effect.amount || 0;
            }
        }
    });

    return attackPower;
}


export function calculateHealAmount(card: CardData, playerDetails: PlayerDetails): number {
    if (!card.effect || card.effect.type !== 'heal') return 0;

    let healAmount = card.effect.amount || 0;

    const equippedUpgrades = playerDetails.equippedItems.filter(item => item.effect?.type === 'upgrade' && item.effect.persistent);

    equippedUpgrades.forEach(upgrade => { 
        if (upgrade.effect?.subtype === 'provision_heal_boost') {
            healAmount += upgrade.effect.amount || 0;
        }
        
        const isHerb = card.id.startsWith('provision_juniper') ||
                       card.id.startsWith('provision_basil') ||
                       card.id.startsWith('provision_peppermint') ||
                       card.id.startsWith('provision_sage');

        if (upgrade.effect?.subtype === 'herb_boost' && isHerb) {
            healAmount += upgrade.effect.amount || 0;
        }
    });

    return healAmount;
}

export function getFormattedEffectText(card: CardData, source: CardContext, playerDetails?: PlayerDetails): string | null {
    if (!card || !card.effect) return null;

    const effect = card.effect;
    let cureText = '';
    if (effect.cures) {
        cureText = ' & Cures Any Illness';
    } else if (effect.cures_illness) {
        cureText = ` & Cures ${effect.cures_illness}`;
    }

    switch (effect.type) {
        case 'heal':
            // Generalize for all waterskin canteen variants (NG+)
            if (card.id.startsWith('upgrade_waterskin_canteen_') && effect.persistent) {
                 return `If equipped, heals ${effect.amount || 0} HP each turn.`;
            }
            let healAmount = effect.amount || 0;
            if (playerDetails) healAmount = calculateHealAmount(card, playerDetails);
            return `Heals ${healAmount} HP${cureText}.`;
        case 'damage':
             if (effect.amount && effect.amount > 0) return `Deals ${effect.amount} damage.`;
             if ((effect.amount || 0) === 0) return `Deals 0 damage.`;
             return null;
        case 'weapon':
            let attack = effect.attack || 0;
            if (playerDetails) attack = calculateAttackPower(card, playerDetails, source, null);
            return `Attack Power: ${attack}.`;
        case 'conditional_weapon':
            let condAttackBase = effect.attack || 0;
            let condAttackBonus = effect.bonus_attack || 0;
            let totalCondAttack = condAttackBase;
            if (playerDetails) {
                totalCondAttack = calculateAttackPower(card, playerDetails, source, null);
                 return `Attack: ${totalCondAttack} (Base ${condAttackBase}${effect.condition === 'is_firearm' ? `, +${condAttackBonus} if another firearm ready` : ''}). Modifiers applied.`;
            }
            return `Attack: ${condAttackBase} (+${condAttackBonus} if ${effect.condition === 'is_firearm' ? 'another firearm ready' : 'condition met'}).`;
        case 'draw':
            return `Draw ${effect.amount || 2} card${(effect.amount || 2) > 1 ? 's' : ''}.`; // Default to 2 for Stamina Tonic
        case 'draw_reduction':
            return `Next day, draw ${effect.amount || 1} fewer cards. Temporary.`;
        case 'trap':
            let trapEffectiveness = '';
            if (effect.trapThreshold) {
                trapEffectiveness = `up to ${effect.trapThreshold} HP`;
            } else if (effect.size === 'small') {
                trapEffectiveness = 'up to 4 HP';
            } else if (effect.size === 'medium') {
                trapEffectiveness = 'up to 6 HP';
            } else if (effect.size === 'large') {
                trapEffectiveness = 'up to 8 HP';
            }
            let breakDamageText = '';
            if (effect.breakDamage && effect.breakDamage > 0) {
                breakDamageText = ` Deals ${effect.breakDamage} if broken by larger target.`;
            }
            return `Sets a ${effect.size} trap. Catches animals ${trapEffectiveness}.${breakDamageText}`;
        case 'campfire':
            return `Builds a campfire. Prevents new events and animal attacks for one night.`;
        case 'gold':
            if (effect.amount && effect.amount > 0) {
               return `Gain ${effect.amount} Gold.`;
            }
            return `Gain Gold.`; // Fallback if amount is somehow 0 or undefined
        case 'scout':
            return `Reveals the next event from the deck.`;
        case 'fire_arrow':
            return `Requires a Bow. Deals damage equal to your strongest bow's full calculated power +${effect.damage || 2}.`;
        case 'trick_shot':
            return `Requires a Firearm. Deals damage equal to your strongest firearm's full calculated power +${effect.damage || 2}.`;
        case 'upgrade':
            if (effect.subtype === 'max_health') return `Increases Max HP by ${effect.amount}.`;
            if (effect.subtype === 'bow_boost') return `Bow/Long Bow Attacks +${effect.amount}.`;
            if (effect.subtype === 'knife_boost') return `Knife/Sword Attacks +${effect.amount}.`;
            if (effect.subtype === 'firearm_boost') return `Firearm Attacks +${effect.amount}.`;
            if (effect.subtype === 'provision_heal_boost') return `Healing Provisions +${effect.amount}.`;
            if (effect.subtype === 'herb_boost') return `Herbal Provisions +${effect.amount}.`;
            if (effect.subtype === 'sell_boost') return `Sell Value of items by ${effect.amount}G.`;
            if (effect.subtype === 'damage_reduction') return `Reduces incoming damage by ${effect.amount}.`;
            if (effect.subtype === 'storage') return `Satchel: Stores up to ${effect.capacity} provisions.`;
            if (effect.subtype === 'firearm_multiplier') return `Multiplies firearm damage by ${effect.multiplier || 2}.`;
            if (effect.subtype === 'bow_multiplier') return `Multiplies bow damage by ${effect.multiplier || 3}.`;
            if (effect.subtype === 'bladed_multiplier') return `Multiplies bladed weapon by ${effect.multiplier || 2}.`;
            if (effect.subtype === 'damage_negation') return `Negates one hit, +${effect.max_health || 0} Max HP. Discarded after use.`;
            return `Provides a persistent upgrade.`;
        case 'random_gold_steal':
             return `Steals up to ${effect.maxAmount} Gold on reveal.`;
        case 'lose_gold':
            return `Steals ${effect.amount} Gold.`;
        case 'damage_percent':
            return `Deals ${Math.round((effect.amount || 0) * 100)}% of current HP as damage.`;
        case 'discard_equipped':
            return `Forces discard of equipped items.`;
        default:
            return null;
    }
}

// This list determines which animals are not immediately aggressive upon being drawn and will flee if not attacked.
export const NON_HOSTILE_ON_REVEAL_IDS = [
    // Wild West
    'threat_skunk_t1', 'threat_rabbit_t1', 'threat_rabbit_t2', 'threat_rabbit_t3', 'threat_squirrel_t1', 'threat_squirrel_t2', 'threat_squirrel_t3', 'threat_fox_t1', 'threat_beaver_t1', 'threat_raccoon_t1', 'threat_raccoon_t2', 'threat_muskrat_t1', 'threat_opossum_t1', 'threat_gila_monster_t1', 'threat_armadillo_t1', 'threat_jackrabbit_blacktailed_t1', 'threat_porcupine_t1', 'threat_prairie_dog_t1', 'threat_deer_t1', 'threat_pronghorn_t1', 'threat_javelina_t1',
    // Feudal Japan
    'threat_skunk_t1_fj', 'threat_raccoon_t1_fj', 'threat_raccoon_t2_fj', 'threat_beaver_t1_fj', 'threat_fox_t1_fj', 'threat_muskrat_t1_fj', 'threat_opossum_t1_fj', 'threat_rabbit_t1_fj', 'threat_rabbit_t2_fj', 'threat_rabbit_t3_fj', 'threat_squirrel_t1_fj', 'threat_squirrel_t2_fj', 'threat_squirrel_t3_fj', 'threat_gila_monster_t1_fj', 'threat_armadillo_t1_fj', 'threat_jackrabbit_blacktailed_t1_fj', 'threat_porcupine_t1_fj', 'threat_prairie_dog_t1_fj', 'threat_deer_t1_fj', 'threat_javelina_t1_fj',
    // Africa Safari
    'threat_skunk_t1_as', 'threat_raccoon_t1_as', 'threat_raccoon_t2_as', 'threat_deer_t1_as', 'threat_muskrat_t1_as', 'threat_opossum_t1_as', 'threat_rabbit_t1_as', 'threat_rabbit_t2_as', 'threat_rabbit_t3_as', 'threat_squirrel_t1_as', 'threat_squirrel_t2_as', 'threat_squirrel_t3_as', 'threat_gila_monster_t1_as', 'threat_armadillo_t1_as', 'threat_jackrabbit_blacktailed_t1_as', 'threat_pronghorn_t1_as', 'threat_porcupine_t1_as', 'threat_prairie_dog_t1_as', 'threat_javelina_t1_as', 'threat_fox_t1_as',
    // Supernatural Horror
    'threat_rabbit_t1_sh', 'threat_rabbit_t2_sh', 'threat_rabbit_t3_sh', // Sprites
    // Cyberpunk
    'threat_rabbit_t1_cp', 'threat_rabbit_t2_cp', 'threat_rabbit_t3_cp', // Ad-Bots
];


export function isEventConsideredHostile(eventCard: CardData | null): boolean {
    if (!eventCard || eventCard.type !== 'Event') {
        return false;
    }
    
    const isSnake = eventCard.id.startsWith('threat_rattlesnake_');

    // Rule: A thief or snake is always hostile for trade, regardless of health.
    if ((eventCard.immediateEffect?.type === 'random_gold_steal' && (eventCard.immediateEffect.maxAmount || 0) > 0) || isSnake) {
        return true;
    }

    // Rule: Any other threat with 6 or less health is NOT hostile for trading.
    if ((eventCard.health || 0) > 0 && (eventCard.health || 0) <= 6) {
        return false;
    }

    // Specific non-hostile on reveal even if they meet other criteria
    if (NON_HOSTILE_ON_REVEAL_IDS.includes(eventCard.id)) {
        return false;
    }
    
    if (eventCard.id === 'threat_mountain_sickness') {
        return false;
    }


    if (eventCard.subType === 'illness') { // All other illnesses are non-trade-blocking
        return false;
    }
    if (eventCard.subType === 'environmental' && !(eventCard.effect?.type === 'damage' || eventCard.effect?.type === 'damage_percent' || eventCard.effect?.discard_equipped)) {
        return false; // Only environmental that do direct damage or discard equipped are hostile for trade
    }


    const effect = eventCard.effect;
    if (effect) {
        if (effect.type === 'damage' && (effect.amount || 0) > 0) return true;
        if (effect.type === 'poison' && (effect.damage || 0) > 0) return true; // Poison is hostile
        if (effect.type === 'conditional_damage' && (effect.damage || 0) > 0) return true;
        if (effect.type === 'damage_percent' && (effect.amount || 0) > 0) return true;
        if (effect.discard_equipped) return true; // Rockslide
    }

    // If it has health and isn't one of the explicitly non-hostile threats, assume it's hostile.
    // This check is now after the <=5HP threat check.
    if (eventCard.health && eventCard.health > 0) return true;


    return false;
}

export const getCardCategory = (card: CardData | null): number => {
    if (!card) return 6;
    if (card.type === 'Player Upgrade') return 1;
    if (card.effect?.type === 'weapon' || card.effect?.type === 'conditional_weapon') return 2;
    if (card.type === 'Provision') return 3;
    if (card.type === 'Item') return 4;
    if (card.type === 'Action') return 5;
    return 6;
};

export function getCardDescriptionHtml(card: CardData | null, source: string, playerDetails?: PlayerDetails) {
    if (!card || !card.id || !card.name || !card.type) {
        console.error("Card data is incomplete for description:", card);
        return 'Card details are currently unavailable.';
    }

    let desc = `<p class="font-bold text-lg text-[var(--ink-main)]">${card.name}</p>`;
    desc += `<p class="text-sm italic text-[var(--ink-secondary)] mb-2">${card.type} ${card.subType ? `- ${card.subType}` : ''}</p>`;

    if (card.description) {
        desc += `<p class="my-2 text-sm text-[var(--ink-main)]">${card.description}</p>`;
    }

    const effectText = getFormattedEffectText(card, source as CardContext, playerDetails);
    if(effectText) {
        desc += `<p class="mt-2 font-semibold text-sm text-blue-800">${effectText}</p>`;
    }

    if (source === CardContext.STORE && card.buyCost) {
        const actualBuyCost = card.buyCost;
        desc += `<p class="mt-2 font-semibold">Cost: ${actualBuyCost} Gold</p>`;
    } else if ((source === CardContext.HAND || source === CardContext.EQUIPPED) && card.sellValue && (card.type === 'Trophy' || card.type === 'Objective Proof' || card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry'))) {
         desc += `<p class="mt-2 font-semibold">Sell Value: ${card.sellValue} Gold</p>`;
    } else if ((source === CardContext.HAND || source === CardContext.SATCHEL_VIEW) && card.sellValue && card.type !== 'Trophy' && card.type !== 'Objective Proof' && !card.id.startsWith('item_gold_nugget') && !card.id.startsWith('item_jewelry')) {
         desc += `<p class="mt-1 text-xs">Sell for: ${card.sellValue}G</p>`;
    } else if (source === CardContext.DECK_REVIEW && card.sellValue && card.sellValue > 0) {
        desc += `<p class="mt-1 text-xs font-semibold">Sells for: ${card.sellValue}G if not kept.</p>`;
    }

    return desc;
  };
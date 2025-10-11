import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { CardData, CardContext, PlayerDetails, Character } from '../types.ts';
import { getCardValues, isFirearm, getAttackPowerBreakdown, isBow } from '../utils/cardUtils.ts';
import { CARD_ILLUSTRATIONS } from '../assets/card-illustrations/index.ts';
import { soundManager } from '../utils/soundManager.ts';
import { imageManager } from '../utils/imageManager.ts';
import { getThemeSuffix } from '../utils/themeUtils.ts';

interface CardComponentProps {
  card: CardData | Character | null;
  context: CardContext;
  onClick?: () => void;
  isSelected?: boolean;
  indexInSource?: number;
  playerDetails?: PlayerDetails;
  onAction?: (actionType: string, payload?: any) => void;
  isPlayable?: boolean;
  isEquipable?: boolean;
  isEquipablePlayerUpgrade?: boolean;
  isStorable?: boolean;
  isSellable?: boolean;
  canAfford?: boolean;
  blockTradeDueToHostileEvent?: boolean;
  isDisabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  statAnimationClass?: string;
  onViewSatchel?: () => void;
  onCycleSatchelForward?: () => void;
  onCycleSatchelBackward?: () => void;
  lastViewedSatchelIndex?: number;
  objectiveProgress?: { text: string; title: string; isComplete?: boolean; } | null;
  isPrimaryEvent?: boolean;
}

const getEventBorderColor = (card: CardData | null): string => {
    if (!card) return 'transparent';

    if (card.subType === 'objective') {
        return 'var(--tarnished-gold)';
    }

    const isThreat = card.type === 'Event' && (card.subType === 'animal' || card.subType === 'human');
    if (isThreat) {
        return 'var(--glow-color-threat)';
    }

    switch (card.type) {
        case 'Event': // Non-threat events
            return 'var(--glow-color-event)';
        case 'Provision':
            if (card.effect?.type === 'heal') return 'var(--glow-color-provision-heal)';
            if (card.effect?.type === 'draw') return 'var(--glow-color-provision-draw)';
            return 'var(--glow-color-provision-neutral)';
        case 'Item':
            if (card.effect?.type === 'weapon' || card.effect?.type === 'conditional_weapon') return 'var(--glow-color-item-weapon)';
            if (card.effect?.type === 'gold' || card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry') || card.id === 'item_gold_pan') return 'var(--glow-color-item-gold)';
            if (card.effect?.type === 'trap') return 'var(--glow-color-item-trap)';
            if (card.effect?.type === 'campfire') return 'var(--glow-color-item-campfire)';
            return 'var(--glow-color-item-neutral)';
        case 'Action':
            if (card.effect?.type === 'scout') return 'var(--glow-color-action-scout)';
            return 'var(--glow-color-item-weapon)'; // Actions like Trick Shot are weapon-like
        case 'Trophy':
        case 'Objective Proof':
            return 'var(--glow-color-trophy-bounty)';
        default:
            return 'transparent';
    }
};

const getRemixedIllustrationUrl = (cardId: string): string | undefined => {
    // Extract the theme suffix (_fj, _as, etc.) from the end of the card ID.
    const themeSuffixMatch = cardId.match(/(_fj|_as|_sh|_cp)$/);
    const themeSuffix = themeSuffixMatch ? themeSuffixMatch[0] : '';

    // This map directly links the AI-generated card ID prefix to a base illustration ID.
    const remixedBaseMap: { [prefix: string]: string } = {
        'remixed_upgrade_damage_negation_': 'upgrade_cavalry_hat',
        'remixed_provision_cure_': 'provision_miracle_cure_t1',
        'remixed_upgrade_max_health_': 'upgrade_bearskin_coat',
        'remixed_weapon_rifle_': 'item_rifle_t1',
        'remixed_weapon_six_shooter_': 'item_six_shooter_t1',
        'remixed_weapon_bow_': 'item_bow_t1',
        'remixed_weapon_knife_': 'item_sharp_knife_t1',
        'remixed_trap_': 'item_large_trap_t1',
    };

    // Find which prefix the card ID starts with.
    const matchingPrefix = Object.keys(remixedBaseMap).find(prefix => cardId.startsWith(prefix));

    if (matchingPrefix) {
        const baseId = remixedBaseMap[matchingPrefix];
        
        // Construct the ideal themed ID by appending the suffix.
        const themedId = `${baseId}${themeSuffix}`;

        // Return the themed illustration if it exists, otherwise fall back to the base (Western) illustration.
        return CARD_ILLUSTRATIONS[themedId] || CARD_ILLUSTRATIONS[baseId];
    }

    return undefined; // No matching prefix found.
};


const CardComponent: React.FC<CardComponentProps> = ({
  card: cardOrChar,
  context,
  onClick,
  isSelected,
  indexInSource,
  playerDetails,
  onAction,
  isPlayable = true,
  isEquipable = false,
  isEquipablePlayerUpgrade = false,
  isStorable = false,
  isSellable = true, // Default to true
  canAfford: canAffordProp = true,
  blockTradeDueToHostileEvent = false,
  isDisabled = false,
  className = '',
  style,
  statAnimationClass,
  onViewSatchel,
  onCycleSatchelForward,
  onCycleSatchelBackward,
  lastViewedSatchelIndex,
  objectiveProgress,
  isPrimaryEvent,
}) => {

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const cardResponsiveDimensions = `
    w-[7rem] h-[9.8rem] text-[0.6rem] p-1.5
    sm:w-[7rem] sm:h-[9.8rem] sm:text-[0.6rem] sm:p-1.5
    md:w-[8.5rem] md:h-[11.9rem] md:text-[0.65rem] md:p-2
    lg:w-[10.5rem] lg:h-[14.7rem] lg:text-[0.75rem] lg:p-2.5
    xl:w-[11.5rem] xl:h-[16.1rem] xl:text-[0.8rem] xl:p-2.5
    2xl:w-[12.5rem] 2xl:h-[17.5rem] 2xl:text-[0.85rem] 2xl:p-3
  `;

  const cardBaseStructure = `rounded-md m-1 text-center transition-all duration-200 ease-out flex flex-col relative flex-shrink-0`;

  if (!cardOrChar) {
     if (context === CardContext.STORE || context === CardContext.EQUIPPED || context === CardContext.HAND) {
      return (
        <div className={`flex items-center justify-center text-center ${cardResponsiveDimensions} flex-shrink-0 border-2 border-dashed border-[var(--border-color)] rounded-md text-[var(--border-color)] bg-[rgba(0,0,0,0.03)] ${className}`}>
          {context === CardContext.STORE ? 'Sold Out' : context === CardContext.EQUIPPED ? 'Equip Slot' : 'Empty Slot'}
        </div>
      );
    }
    return null;
  }
  
  const isCharacterCard = 'starterDeck' in cardOrChar && !('type' in cardOrChar);
  const card = cardOrChar as CardData; // Type assertion for regular cards
  const isObjectiveCard = !isCharacterCard && card.type === 'Event' && card.subType === 'objective';
  
  let illustrationUrl: string | undefined = CARD_ILLUSTRATIONS[card.illustrationId || cardOrChar.id];
  if (!illustrationUrl && !isCharacterCard && card.type) {
      if (card.id.startsWith('remixed_')) {
          illustrationUrl = getRemixedIllustrationUrl(card.id);
      }
      
      if (!illustrationUrl) {
          if (card.type === 'Objective Proof' || isObjectiveCard) {
              illustrationUrl = CARD_ILLUSTRATIONS['generic_bounty_proof'];
          } else if (card.type === 'Trophy') {
              illustrationUrl = CARD_ILLUSTRATIONS['generic_trophy'];
          }
      }
  }

  const finalImageUrl = imageManager.getCachedUrl(illustrationUrl);

  const { primaryStat, gold } = getCardValues(card, context, playerDetails);
  
  let tintClass = '';
  if (!isCharacterCard && context !== CardContext.SCOUTED_PREVIEW) { // No tint for character cards or scouted preview
    if (card.type === 'Item' && (card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry') || card.effect?.type === 'gold' || card.id === 'item_gold_pan')) {
         tintClass = 'bg-[var(--tint-item-gold)]';
    } else if (card.type === 'Event') {
        tintClass = 'bg-[var(--tint-event)]';
    } else if (card.type === 'Provision') {
        if (card.effect?.type === 'heal') tintClass = 'bg-[var(--tint-provision-heal)]';
        else if (card.effect?.type === 'draw') tintClass = 'bg-[var(--tint-provision-draw)]';
        else tintClass = 'bg-[var(--tint-provision-neutral)]';
    } else if (card.type === 'Item') {
        if (card.effect?.type === 'weapon' || card.effect?.type === 'conditional_weapon') tintClass = 'bg-[var(--tint-item-weapon)]';
        else if (card.effect?.type === 'trap') tintClass = 'bg-[var(--tint-item-trap)]';
        else if (card.effect?.type === 'campfire') tintClass = 'bg-[var(--tint-item-campfire)]';
        else tintClass = 'bg-[var(--tint-item-neutral)]';
    } else if (card.type === 'Player Upgrade') {
        tintClass = 'bg-[var(--tint-player-upgrade)]';
    } else if (card.type === 'Action') {
        if (card.id === 'action_scout_ahead') tintClass = 'bg-[var(--tint-action-scout)]';
        else tintClass = 'bg-[var(--tint-item-weapon)]';
    } else if (card.type === 'Trophy' || card.type === 'Objective Proof') {
        tintClass = 'bg-[var(--tint-trophy-bounty)]';
    }
  }

  const cardFaceStyle = `text-[var(--ink-main)] bg-[var(--card-bg)]`;
  const selectedStyle = (isSelected && context !== CardContext.SATCHEL_VIEW) 
    ? 'selected scale-105 -translate-y-1 -rotate-1' 
    : (isSelected ? 'selected' : '');
  const nameStyle = "font-['Special_Elite'] font-bold break-words w-full text-[var(--ink-main)] uppercase text-[1.1em] lg:text-[1.15em]";
  const typeStyle = "font-['Merriweather'] italic text-[var(--ink-secondary)] text-[0.85em]";
  const bottomStatStyle = "font-['Special_Elite'] font-bold mt-auto text-[1em]";


  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !isDisabled) {
        soundManager.playSound('card_click');
        onClick();
    }
  };

  const actualBuyCost = card.buyCost || 0;
  const canAffordCalculated = playerDetails ? playerDetails.gold >= actualBuyCost : canAffordProp;

  const attackBreakdown = (primaryStat?.includes('AT') && playerDetails) ? getAttackPowerBreakdown(card, playerDetails, context) : null;

  useLayoutEffect(() => {
    if (!isTooltipVisible || !tooltipContainerRef.current || !tooltipRef.current) return;

    const container = tooltipContainerRef.current;
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();

    // Don't calculate if tooltip has no size, prevents flicker on first render
    if (tooltipRect.width === 0) return;

    const panel = container.closest('.player-area, .frontier-area');
    const boundaryRect = panel ? panel.getBoundingClientRect() : { left: 0, right: window.innerWidth };
    const padding = 10;

    const containerRect = container.getBoundingClientRect();

    const newStyles: React.CSSProperties = {
        bottom: '105%',
        transform: 'none', // We will calculate left manually
    };

    // Calculate the ideal centered left position relative to the viewport
    let idealAbsLeft = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);

    // Adjust if it goes out of the panel's boundaries
    if (idealAbsLeft < boundaryRect.left + padding) {
        idealAbsLeft = boundaryRect.left + padding;
    } else if (idealAbsLeft + tooltipRect.width > boundaryRect.right - padding) {
        idealAbsLeft = boundaryRect.right - tooltipRect.width - padding;
    }

    // Convert the absolute viewport position back to a 'left' style relative to the container
    newStyles.left = `${idealAbsLeft - containerRect.left}px`;

    setTooltipStyle(newStyles);
  }, [isTooltipVisible, attackBreakdown]);

  const handleTooltipMouseEnter = () => {
    if (attackBreakdown) {
      setIsTooltipVisible(true);
    }
  };

  const handleTooltipMouseLeave = () => {
    setIsTooltipVisible(false);
    setTooltipStyle({});
  };

  const createActionBtn = (text: string, action: string, btnDisabled: boolean = false, payload?: any) => (
    <button
      key={action + '-' + text} // Added text to key for more uniqueness if action string is reused
      className={`py-2 w-[85%] rounded-sm transition-colors duration-150 font-['Special_Elite'] uppercase text-xs lg:text-sm ${btnDisabled ? 'bg-neutral-400 text-neutral-700 border border-neutral-500 cursor-not-allowed opacity-75' : 'bg-[var(--ink-main)] text-[var(--paper-bg)] border border-[var(--paper-bg)] hover:bg-[var(--blood-red)]'}`}
      disabled={btnDisabled}
      onClick={(e) => { e.stopPropagation(); if (onAction) onAction(action, { card, source: context, index: indexInSource, ...(payload || {}) }); }}
    >{text}</button>
  );

  let actionButtons: React.ReactNode[] = [];
  let currentSatchelInventory: CardData[] = [];
  if (context === CardContext.SATCHEL_VIEW && playerDetails) {
      if (playerDetails.satchels && lastViewedSatchelIndex !== undefined && playerDetails.satchels[lastViewedSatchelIndex]) {
          currentSatchelInventory = playerDetails.satchels[lastViewedSatchelIndex];
      }
  }

  if (context === CardContext.SATCHEL_VIEW && playerDetails) {
    const turnEnded = playerDetails.turnEnded;
    const actionPayload = { satchelIndex: lastViewedSatchelIndex };
    // Sell button (will be at bottom)
    if (card.sellValue && card.sellValue > 0 && isSellable) {
      actionButtons.push(createActionBtn(`Sell ${card.sellValue}G`, 'SELL_FROM_SATCHEL', blockTradeDueToHostileEvent || turnEnded, actionPayload));
    }
    // Play button (will be at top)
    if (card.type === 'Provision') {
      actionButtons.push(createActionBtn('Play', 'USE_ITEM', turnEnded, actionPayload));
    }
  } else if (isSelected && onAction && playerDetails && !isCharacterCard && !isDisabled) {
    const turnEnded = playerDetails.turnEnded;
    const cardType = card.type as CardData['type'];

    if (context === CardContext.HAND) {
      if (cardType === 'Trophy' || cardType === 'Objective Proof' || card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry') || card.id.includes('raw_diamond') || card.id.startsWith('item_ivory_carving')) {
        if (isSellable) actionButtons.push(createActionBtn(`Sell ${card.sellValue}G`, 'SELL_FROM_HAND', blockTradeDueToHostileEvent || turnEnded));
      } else {
        // For general items in hand
        let isCardPlayableNow = false;
        const usableEffects = ['heal', 'weapon', 'conditional_weapon', 'campfire', 'gold', 'draw', 'trap', 'escape', 'fire_arrow', 'trick_shot', 'discard_gold', 'scout', 'bladed_technique'];
        if (card.effect && usableEffects.includes(card.effect.type) && card.id !== 'upgrade_satchel') {
          isCardPlayableNow = true;
        }
        
        // PUSH ORDER (for flex-col-reverse): Sell, Equip/Store, Play

        // PUSH 1: SELL (will be at bottom)
        if (isSellable && card.sellValue && card.sellValue > 0) {
          actionButtons.push(createActionBtn(`Sell ${card.sellValue}G`, 'SELL_FROM_HAND', blockTradeDueToHostileEvent || turnEnded));
        }
        
        // PUSH 2: EQUIP / STORE
        if (cardType === 'Player Upgrade') {
            actionButtons.push(createActionBtn('Equip', 'EQUIP_ITEM', !isEquipablePlayerUpgrade || turnEnded));
        } else if (cardType === 'Item' && card.effect && card.effect.type !== 'trap') { 
            actionButtons.push(createActionBtn('Equip', 'EQUIP_ITEM', !isEquipable || turnEnded));
        }
        if (cardType === 'Provision') {
           const satchel = playerDetails.equippedItems.find(item => item.effect?.subtype === 'storage');
            if (satchel) {
              actionButtons.push(createActionBtn('Store', 'STORE_PROVISION', !isStorable || turnEnded));
            }
        }
        
        // PUSH 3: PLAY (will be at top)
        if (isCardPlayableNow) {
          let useDisabled = turnEnded || !isPlayable;
           if (card.effect!.type === 'weapon' || card.effect!.type === 'conditional_weapon' || card.effect!.type === 'fire_arrow' || card.effect!.type === 'trick_shot' || card.effect!.type === 'bladed_technique') { 
             if (!playerDetails.activeEventForAttack || playerDetails.activeEventForAttack.health <= 0 || playerDetails.activeEventForAttack.type !== 'Event') {
                 useDisabled = true;
             }
           }
           if(card.effect!.type === 'fire_arrow') {
              const hasBow = playerDetails.hand.some(c => isBow(c)) || 
                             playerDetails.equippedItems.some(isBow);
              if (!hasBow) useDisabled = true;
           }
           if(card.effect!.type === 'trick_shot') {
              const hasAnyFirearm = playerDetails.hand.some(c => c && isFirearm(c)) || playerDetails.equippedItems.some(c => isFirearm(c));
              if (!hasAnyFirearm) useDisabled = true;
           }
          actionButtons.push(createActionBtn('Play', 'USE_ITEM', useDisabled));
        }
      }
    } else if (context === CardContext.EQUIPPED) {
       // Sell button (will be at the bottom)
       if (card.sellValue && card.sellValue > 0 && isSellable) {
           actionButtons.push(createActionBtn(`Sell ${card.sellValue}G`, 'SELL_EQUIPPED', blockTradeDueToHostileEvent || playerDetails.turnEnded));
       }

       // Discard button (will be in the middle)
       if (cardType === 'Player Upgrade') {
         actionButtons.push(createActionBtn('Discard', 'DISCARD_UPGRADE', playerDetails.turnEnded));
       } else if (cardType === 'Item'){
          actionButtons.push(createActionBtn('Discard', 'DISCARD_EQUIPPED_ITEM', playerDetails.turnEnded));
       }
       
       // Play / Use Item button (will be at the top)
       if (!playerDetails.turnEnded) {
           if (card.effect?.subtype === 'storage') {
               // Logic for Satchels
               const satchelContents = playerDetails.satchels[indexInSource ?? -1] || [];
               if (satchelContents.length > 0) {
                   const topItem = satchelContents[0];
                   // Provisions are the only items usable from a satchel currently.
                   const isTopItemPlayable = topItem.type === 'Provision'; 
                   const payload = {
                       itemFromSatchel: topItem,
                       itemIndexInSatchel: 0,
                       satchelEquipmentIndex: indexInSource
                   };
                   actionButtons.push(createActionBtn('Use Item', 'USE_FROM_SATCHEL', !isTopItemPlayable, payload));
               }
           } else {
               // Original logic for non-storage items
               if (card.effect && ['heal', 'weapon', 'conditional_weapon', 'campfire', 'gold', 'draw', 'fire_arrow'].includes(card.effect.type)) {
                   let useEquippedDisabled = !isPlayable;
                   if (card.effect.type === 'weapon' || card.effect.type === 'conditional_weapon' || card.effect.type === 'fire_arrow') {
                       if (!playerDetails.activeEventForAttack || playerDetails.activeEventForAttack.health <= 0 || playerDetails.activeEventForAttack.type !== 'Event') {
                           useEquippedDisabled = true;
                       }
                   }
                   actionButtons.push(createActionBtn('Play', 'USE_ITEM', useEquippedDisabled));
               }
           }
       }
    } else if (context === CardContext.STORE) {
      actionButtons.push(createActionBtn('Buy', 'BUY_ITEM', !canAffordCalculated || blockTradeDueToHostileEvent || turnEnded));
    } else if (context === CardContext.EVENT) {
      if (card.type !== 'Event') {
        actionButtons.push(createActionBtn('Take Item', 'TAKE_EVENT_ITEM', playerDetails.hasTakenActionThisTurn || turnEnded));
      } else if (card.effect?.type === 'objective_discard_to_win') {
        const provisionsInHand = playerDetails.hand.filter(c => c?.type === 'Provision').length;
        actionButtons.push(createActionBtn(
          `Attempt Objective`,
          'ATTEMPT_OBJECTIVE',
          provisionsInHand < 5 || playerDetails.turnEnded
        ));
      }
    }
  }
  
  const isFrontierCard = context === CardContext.EVENT;
  const isThreat = !isCharacterCard && card.type === 'Event' && (card.subType === 'animal' || card.subType === 'human');

  let cardTypeId = 'default';
  if (!isCharacterCard) {
      switch (card.type) {
          case 'Event':
              cardTypeId = 'event';
              break;
          case 'Provision':
              if (card.effect?.type === 'heal') cardTypeId = 'provision-heal';
              else if (card.effect?.type === 'draw') cardTypeId = 'provision-draw';
              else cardTypeId = 'provision-neutral';
              break;
          case 'Item':
              if (card.effect?.type === 'weapon' || card.effect?.type === 'conditional_weapon') cardTypeId = 'item-weapon';
              else if (card.effect?.type === 'gold' || card.id.startsWith('item_gold_nugget') || card.id.startsWith('item_jewelry') || card.id === 'item_gold_pan') cardTypeId = 'item-gold';
              else if (card.effect?.type === 'trap') cardTypeId = 'item-trap';
              else if (card.effect?.type === 'campfire') cardTypeId = 'item-campfire';
              else cardTypeId = 'item-neutral';
              break;
          case 'Player Upgrade':
              cardTypeId = 'player-upgrade';
              break;
          case 'Action':
              if (card.effect?.type === 'scout') cardTypeId = 'action-scout';
              else cardTypeId = 'item-weapon';
              break;
          case 'Trophy':
          case 'Objective Proof':
              cardTypeId = 'trophy-bounty';
              break;
      }
  }

  let dynamicStyle: React.CSSProperties = { ...style };
  if (isPrimaryEvent && context === CardContext.EVENT && card && !isCharacterCard) {
    // Objectives should not have a thick border, but other primary events should.
    if (card.subType !== 'objective') {
        dynamicStyle.borderWidth = '2px'; // Reduced from 4px
        dynamicStyle.borderColor = getEventBorderColor(card as CardData);
    }
  }
  
  const finalCardClasses = `
    ${cardBaseStructure} 
    ${cardResponsiveDimensions} 
    ${cardFaceStyle}
    ${selectedStyle}
    ${className}
    ${isDisabled ? 'opacity-60' : ''}
    ${isTooltipVisible ? 'z-50' : ''}
    ${isFrontierCard && !isSelected ? 'frontier-card-glow' : ''}
    card-face
  `.trim().replace(/\s+/g, ' ');


  if (isCharacterCard) {
    const character = cardOrChar as Character;
    const displayHealth = character.health;

    return (
      <div 
        className={`${cardBaseStructure} ${cardResponsiveDimensions} ${cardFaceStyle} bg-[var(--card-bg)] text-[var(--ink-main)] ${isSelected ? 'selected' : ''} ${className} ${isDisabled ? 'opacity-60' : ''} card-face`}
        onClick={handleCardClick}
        style={style}
        data-testid={`char-card-${character.id}`}
        data-character-id={character.id}
        data-context={context}
        role="button" tabIndex={onClick && !isDisabled ? 0 : -1} aria-label={`Character: ${character.name}`}
        aria-disabled={isDisabled}
      >
        <div className="relative z-10 flex flex-col h-full items-center justify-start"> {/* Use justify-start */}
            <div className="flex justify-between items-start w-full px-0.5 text-[0.85em] md:text-[0.9em] lg:text-[1em] font-bold">
              <span className={`text-[var(--blood-red)] ${isSelected ? 'selected-stat-text' : ''}`}>❤️ {displayHealth}</span>
              <span className={`text-yellow-600 ${isSelected ? 'selected-stat-text' : ''}`}>💰 {character.gold}</span>
            </div>
            <div className="flex flex-col items-center w-full pt-px my-1">
              <div className={`${nameStyle} mt-0.5`}>{character.name}</div>
              <div className={`${typeStyle} mb-1`}>Character</div>
            </div>
            
            <div className="flex-grow my-1 w-full overflow-hidden flex items-center justify-center">
              {finalImageUrl && (
                <img src={finalImageUrl} alt={character.name} className="w-full h-full object-contain" />
              )}
            </div>
            
            <div className={`${bottomStatStyle} flex justify-center items-center w-full h-auto py-0.5`}>
              {/* Health is now at the top, this can be empty or used for something else */}
            </div>
        </div>
      </div>
    );
  }

  const satchelContents = playerDetails?.satchels[indexInSource ?? -1] || [];
  const showViewSatchelButton = context === CardContext.EQUIPPED && card.effect?.subtype === 'storage' && satchelContents.length > 0 && onViewSatchel;


  return (
    <div 
      className={finalCardClasses} 
      onClick={handleCardClick} 
      style={dynamicStyle}
      data-testid={`card-${card.id}-${indexInSource ?? ''}`}
      data-card-type-id={cardTypeId}
      data-is-threat={isThreat}
      data-context={context}
      role="button" tabIndex={onClick && !isDisabled ? 0 : -1} 
      aria-label={`Card: ${card.name}`}
      aria-disabled={isDisabled}
    >
      {showViewSatchelButton && (
        <button
          className="absolute top-1 right-1 cursor-pointer z-30 hover:scale-110 transition-transform p-1"
          onClick={(e) => { e.stopPropagation(); onViewSatchel(); }}
          aria-label="View satchel contents"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-[var(--ink-main)]"
            style={{ filter: 'drop-shadow(0 0 2px var(--paper-bg))' }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      )}
      {tintClass && <div className={`absolute inset-0 ${tintClass} rounded-md pointer-events-none z-0`}></div>}
      <div className="relative z-10 flex flex-col h-full"> {/* Main content wrapper */}
        {/* Header Block: Contains stats and name/type. Will grow vertically with long names. */}
        <div className="flex-shrink-0">
          {/* Stats: Has a minimum height to reserve space even if empty. */}
          <div className="flex justify-between items-start w-full px-0.5 text-[0.85em] font-bold min-h-[1.25em]">
              <div 
                className="tooltip-container"
                ref={tooltipContainerRef}
                onMouseEnter={handleTooltipMouseEnter}
                onMouseLeave={handleTooltipMouseLeave}
              >
                <span 
                  className={isSelected ? 'selected-stat-text' : ''}
                  style={{color: primaryStat?.includes('HP') ? 'var(--heal-green)' : (primaryStat ? 'var(--blood-red)' : undefined)}}>{primaryStat || ''}</span>
                {attackBreakdown && (
                  <div
                      ref={tooltipRef}
                      className={`tooltip ${isTooltipVisible ? 'visible' : ''}`}
                      style={tooltipStyle}
                      dangerouslySetInnerHTML={{ __html: attackBreakdown }}
                  />
                )}
              </div>
            <span className={`text-yellow-600 ${isSelected ? 'selected-stat-text' : ''}`}>{gold || ''}</span>
          </div>
          
          {/* Name and Type: No vertical margins, allowing it to sit right under stats. */}
          <div className="flex flex-col items-center w-full pt-px">
              <div className={`${nameStyle}`}>{card.name}</div>
              <div className={typeStyle}>
                {context !== CardContext.CHARACTER_SELECTION && <>{card.type} {card.subType ? ` - ${card.subType}` : ''}</>}
              </div>
          </div>
        </div>

        {/* Image: Fills remaining space and shrinks as header grows. */}
        <div className="flex-grow my-1 w-full overflow-hidden flex items-center justify-center">
          {finalImageUrl ? (
            <img src={finalImageUrl} alt={card.name} className="w-full h-full object-contain" />
          ) : null}
        </div>

        {/* Footer: Pushed to the bottom by mt-auto from bottomStatStyle */}
        <div className={`${bottomStatStyle} flex justify-center items-center w-full h-auto py-0.5`}>
          {context === CardContext.EVENT && card.health !== undefined && card.type === 'Event' && (
            <span className={`${nameStyle} ${statAnimationClass || ''}`}>HEALTH: {card.health}</span>
          )}
          {context === CardContext.STORE && card.sellValue !== undefined && card.buyCost !== undefined && (
            <span className={nameStyle}>COST: {actualBuyCost} GOLD</span>
          )}
        </div>
      </div>
      
      {objectiveProgress && (
        <div 
          className={`absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-['Special_Elite'] border border-white/50 z-30
            ${objectiveProgress.isComplete 
              ? 'bg-[var(--tarnished-gold)] text-black shadow-[0_0_8px_var(--tarnished-gold)]' 
              : 'bg-black/70 text-white'
            }`}
          title={objectiveProgress.title}
        >
          {objectiveProgress.text}
        </div>
      )}

      {/* Interactive Overlay for Buttons */}
      <div className="absolute inset-x-0 bottom-0 h-4/5 z-20 flex flex-col justify-end">
        {/* This area now only covers the bottom part of the card, allowing hovers on the top stats */}
        <div className="flex-grow relative">
          {context === CardContext.SATCHEL_VIEW && currentSatchelInventory.length > 1 && (
            <>
              <button
                className="absolute inset-y-0 left-0 w-1/2 bg-transparent flex items-end pb-2 justify-center text-4xl text-[var(--ink-main)] rounded-tl-md"
                style={{ textShadow: '0 0 5px var(--paper-bg), 0 0 8px var(--paper-bg)' }}
                onClick={(e) => { e.stopPropagation(); if (onCycleSatchelBackward) onCycleSatchelBackward(); }}
                aria-label="Previous item in satchel"
              >
                &larr;
              </button>
              <button
                className="absolute inset-y-0 right-0 w-1/2 bg-transparent flex items-end pb-2 justify-center text-4xl text-[var(--ink-main)] rounded-tr-md"
                style={{ textShadow: '0 0 5px var(--paper-bg), 0 0 8px var(--paper-bg)' }}
                onClick={(e) => { e.stopPropagation(); if (onCycleSatchelForward) onCycleSatchelForward(); }}
                aria-label="Next item in satchel"
              >
                &rarr;
              </button>
            </>
          )}
        </div>

        {/* Action Buttons Area */}
        {actionButtons.length > 0 && (
          <div 
            className="action-buttons-enter flex-shrink-0 p-1 flex flex-col-reverse items-center gap-1 rounded-b-md"
          >
            {actionButtons.map((button, index) => (
               <div key={index} className="w-full flex justify-center">
                  {button}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardComponent;
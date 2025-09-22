
import React, { useState, useEffect, useRef } from 'react';
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
  showBack?: boolean;
  style?: React.CSSProperties;
  statAnimationClass?: string;
  onViewSatchel?: () => void;
  onCycleSatchel?: () => void;
  lastViewedSatchelIndex?: number;
}

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
  showBack = false,
  style,
  statAnimationClass,
  onViewSatchel,
  onCycleSatchel,
  lastViewedSatchelIndex
}) => {

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const cardResponsiveDimensions = `
    w-[7rem] h-[9.8rem] text-[0.65rem] p-1.5
    sm:w-[7rem] sm:h-[9.8rem] sm:text-[0.65rem] sm:p-1.5
    md:w-[8.5rem] md:h-[11.9rem] md:text-[0.7rem] md:p-2
    lg:w-[10.5rem] lg:h-[14.7rem] md:text-[0.8rem] lg:p-2.5
    xl:w-[11.5rem] xl:h-[16.1rem] xl:text-[0.8rem] xl:p-2.5
    2xl:w-[12.5rem] 2xl:h-[17.5rem] 2xl:text-sm 2xl:p-3
  `;

  const cardBaseStructure = `rounded m-1 text-center transition-all duration-200 ease-out flex flex-col relative flex-shrink-0`;

  if (showBack) {
    return (
      <div
        className={`${cardBaseStructure} ${cardResponsiveDimensions} card-back ${className}`}
        data-testid={`card-back-${cardOrChar?.id}-${indexInSource ?? ''}`}
      >
      </div>
    );
  }

  if (!cardOrChar) {
     if (context === CardContext.STORE || context === CardContext.EQUIPPED || context === CardContext.HAND) {
      return (
        <div className={`flex items-center justify-center text-center ${cardResponsiveDimensions} flex-shrink-0 border-2 border-dashed border-[var(--border-color)] rounded text-[var(--border-color)] bg-[rgba(0,0,0,0.03)] ${className}`}>
          {context === CardContext.STORE ? 'Sold Out' : context === CardContext.EQUIPPED ? 'Equip Slot' : 'Empty Slot'}
        </div>
      );
    }
    return null;
  }
  
  const isCharacterCard = 'starterDeck' in cardOrChar && !('type' in cardOrChar);
  const card = cardOrChar as CardData; // Type assertion for regular cards
  const isObjectiveCard = !isCharacterCard && card.type === 'Event' && card.subType === 'objective';
  
  let illustrationUrl: string | undefined = CARD_ILLUSTRATIONS[cardOrChar.id];
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
        tintClass = 'bg-[var(--tint-item-gold)]';
    } else if (card.type === 'Action') {
        if (card.id === 'action_scout_ahead') tintClass = 'bg-[var(--tint-action-scout)]';
        else tintClass = 'bg-[var(--tint-item-weapon)]';
    } else if (card.type === 'Trophy' || card.type === 'Objective Proof') {
        tintClass = 'bg-[var(--tint-trophy-bounty)]';
    }
  }

  const cardFaceStyle = `border-2 border-[var(--ink-main)] text-[var(--ink-main)] shadow-[3px_3px_8px_rgba(0,0,0,0.2)] bg-[var(--paper-bg)]`;
  const hoverStyle = context !== CardContext.EVENT && context !== CardContext.SCOUTED_PREVIEW && !isDisabled ? 'hover:-translate-y-1 hover:-rotate-1 hover:shadow-[4px_4px_12px_rgba(0,0,0,0.25)] cursor-pointer' : '';
  const selectedStyle = isSelected ? 'border-3 border-[var(--tarnished-gold)] shadow-[0_0_15px_rgba(200,164,21,0.5)] scale-105 -translate-y-2 -rotate-1' : '';
  const nameStyle = "font-['Special_Elite'] font-bold leading-snug break-words w-full text-[var(--ink-main)] uppercase text-[1em] lg:text-[1.1em]";
  const typeStyle = "font-['Merriweather'] italic text-[var(--ink-secondary)] leading-tight text-[0.8em] lg:text-[0.9em] mt-0.5";
  const bottomStatStyle = "font-['Special_Elite'] font-bold mt-auto text-[0.95em] lg:text-[1.05em]";


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

  const handleTooltipMouseEnter = () => {
    if (!attackBreakdown) return;

    const container = tooltipContainerRef.current;
    const tooltip = tooltipRef.current;

    if (!container || !tooltip) return;

    const containerRect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    let newStyles: React.CSSProperties = {};

    const idealLeftAbsolute = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
    
    if (idealLeftAbsolute < 10) {
        newStyles.left = `${-containerRect.left + 10}px`;
        newStyles.transform = 'translateX(0)';
    } else if (idealLeftAbsolute + tooltipRect.width > viewportWidth - 10) {
        const containerRightAbsolute = containerRect.right;
        const spaceOnRight = viewportWidth - containerRightAbsolute;
        newStyles.right = `${-spaceOnRight + 10}px`;
        newStyles.left = 'auto';
        newStyles.transform = 'translateX(0)';
    }

    setTooltipStyle(newStyles);
    setIsTooltipVisible(true);
  };

  const handleTooltipMouseLeave = () => {
      setIsTooltipVisible(false);
      setTooltipStyle({}); // Reset styles to avoid affecting the next hover
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

  if (context === CardContext.SATCHEL_VIEW && playerDetails) {
    const turnEnded = playerDetails.turnEnded;
    // Sell button (will be at bottom)
    if (card.sellValue && card.sellValue > 0 && isSellable) {
      actionButtons.push(createActionBtn(`Sell ${card.sellValue}G`, 'SELL_FROM_SATCHEL', blockTradeDueToHostileEvent || turnEnded));
    }
    // Play button (will be at top)
    if (card.type === 'Provision') {
      actionButtons.push(createActionBtn('Play', 'USE_ITEM', turnEnded));
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
        const usableEffects = ['heal', 'weapon', 'conditional_weapon', 'campfire', 'gold', 'draw', 'trap', 'escape', 'fire_arrow', 'trick_shot', 'discard_gold', 'scout'];
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
           if (card.effect!.type === 'weapon' || card.effect!.type === 'conditional_weapon' || card.effect!.type === 'fire_arrow' || card.effect!.type === 'trick_shot') { 
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
       
       // Play button (will be at the top)
       if (!playerDetails.turnEnded) {
           if (card.effect?.subtype === 'storage') {
              actionButtons.push(createActionBtn('Use from Satchel', 'USE_FROM_SATCHEL', (playerDetails.satchel?.length || 0) === 0, { itemIndexInSatchel: lastViewedSatchelIndex || 0 }));
           } else if (card.effect && ['heal', 'weapon', 'conditional_weapon', 'campfire', 'gold', 'draw', 'fire_arrow'].includes(card.effect.type)) {
              let useEquippedDisabled = !isPlayable;
               if (card.effect.type === 'weapon' || card.effect.type === 'conditional_weapon' || card.effect.type === 'fire_arrow') {
                  if (!playerDetails.activeEventForAttack || playerDetails.activeEventForAttack.health <= 0 || playerDetails.activeEventForAttack.type !== 'Event') {
                      useEquippedDisabled = true;
                  }
               }
             actionButtons.push(createActionBtn('Play', 'USE_ITEM', useEquippedDisabled));
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
          provisionsInHand < 5 || playerDetails.turnEnded || playerDetails.hasTakenActionThisTurn
        ));
      }
    }
  }

  if (context === CardContext.SATCHEL_VIEW && playerDetails && playerDetails.satchel.length > 1) {
    actionButtons.push(
      <button
        key="satchel-next"
        className="py-2 w-[85%] rounded-sm transition-colors duration-150 font-['Special_Elite'] uppercase text-xs lg:text-sm bg-[var(--ink-main)] text-[var(--paper-bg)] border border-[var(--paper-bg)] hover:bg-[var(--blood-red)]"
        onClick={(e) => { e.stopPropagation(); if (onCycleSatchel) onCycleSatchel(); }}
      >
        Next
      </button>
    );
  }

  const finalCardClasses = `
    ${cardBaseStructure} 
    ${cardResponsiveDimensions} 
    ${cardFaceStyle}
    ${isSelected ? selectedStyle : hoverStyle}
    ${className}
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${isTooltipVisible ? 'z-20' : ''}
  `.trim().replace(/\s+/g, ' ');


  if (isCharacterCard) {
    const character = cardOrChar as Character;
    const displayHealth = character.health;

    return (
      <div 
        className={`${cardBaseStructure} ${cardResponsiveDimensions} ${cardFaceStyle} bg-[var(--paper-bg)] text-[var(--ink-main)] ${isSelected ? 'border-[var(--tarnished-gold)] shadow-[0_0_15px_rgba(200,164,21,0.5)] scale-105' : 'border-[var(--border-color)] hover:border-stone-400'} ${hoverStyle} ${className} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={handleCardClick}
        style={style}
        data-testid={`char-card-${character.id}`}
        role="button" tabIndex={onClick && !isDisabled ? 0 : -1} aria-label={`Character: ${character.name}`}
        aria-disabled={isDisabled}
      >
        <div className="flex flex-col h-full items-center justify-start"> {/* Use justify-start */}
            <div className={`${nameStyle} mt-0.5`}>{character.name}</div>
            <div className={`${typeStyle} mb-1`}>Character</div>
            
            <div className="flex-grow my-1 w-full overflow-hidden flex items-center justify-center">
              {finalImageUrl && (
                <img src={finalImageUrl} alt={character.name} className="w-full h-full object-contain" />
              )}
            </div>
            
            <div className={`${bottomStatStyle} flex justify-center items-center w-full h-auto py-0.5`}>
              <span 
                className={nameStyle}
                style={{ transform: 'translateZ(0)' }} 
              >
                HEALTH: {displayHealth}
              </span>
            </div>
        </div>
      </div>
    );
  }

  const showViewSatchelButton = context === CardContext.EQUIPPED && card.effect?.subtype === 'storage' && playerDetails && playerDetails.satchel.length > 0 && onViewSatchel;


  return (
    <div 
      className={finalCardClasses} 
      onClick={handleCardClick} 
      style={style}
      data-testid={`card-${card.id}-${indexInSource ?? ''}`} 
      role="button" tabIndex={onClick && !isDisabled ? 0 : -1} 
      aria-label={`Card: ${card.name}`}
      aria-disabled={isDisabled}
    >
      {showViewSatchelButton && (
        <button
          className="absolute top-1 right-1 cursor-pointer z-20 hover:scale-110 transition-transform p-1"
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
      {tintClass && <div className={`absolute inset-0 ${tintClass} rounded-sm pointer-events-none z-0`}></div>}
      <div className="relative z-10 flex flex-col h-full"> {/* Main content wrapper */}
        <div className="flex justify-between items-start w-full px-0.5 text-[0.75em] font-bold h-4">
            <div 
              className="tooltip-container"
              ref={tooltipContainerRef}
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className={primaryStat?.includes('HP') ? 'text-green-600' : 'text-red-600'}>{primaryStat || ''}</span>
              {attackBreakdown && (
                <div
                    ref={tooltipRef}
                    className={`tooltip ${isTooltipVisible ? 'visible' : ''}`}
                    style={tooltipStyle}
                    dangerouslySetInnerHTML={{ __html: attackBreakdown }}
                />
              )}
            </div>
          <span className="text-yellow-600">{gold || ''}</span>
        </div>

        <div className={`${nameStyle} mt-0`}>{card.name}</div>
        <div className={typeStyle}>
          {context !== CardContext.CHARACTER_SELECTION && <>{card.type} {card.subType ? ` - ${card.subType}` : ''}</>}
        </div>
        
        <div className="flex-grow my-1 w-full overflow-hidden flex items-center justify-center">
          {finalImageUrl ? (
            <img src={finalImageUrl} alt={card.name} className="w-full h-full object-contain" />
          ) : null}
        </div>

        <div className={`${bottomStatStyle} flex justify-center items-center w-full h-auto py-0.5`}>
          {context === CardContext.EVENT && card.health !== undefined && card.type === 'Event' && (
            <span className={`${nameStyle} ${statAnimationClass || ''}`}>HEALTH: {card.health}</span>
          )}
          {context === CardContext.STORE && card.sellValue !== undefined && card.buyCost !== undefined && (
            <span className={nameStyle}>COST: {actualBuyCost} GOLD</span>
          )}
        </div>
      </div>

      {/* Action Buttons Area - positioned at the bottom */}
      {actionButtons.length > 0 && (
        <div 
          className="action-buttons-enter absolute bottom-0 left-0 right-0 p-1 flex flex-col-reverse items-center gap-1 rounded-b-sm z-10"
        >
          {actionButtons.map((button, index) => (
             <div key={index} className="w-full flex justify-center">
                {button}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardComponent;

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { GameState, PlayerDetails, CardData, CardContext, LogEntry } from '../types.ts';
import CardComponent from '../components/CardComponent.tsx';
import GameLogComponent from '../components/GameLogComponent.tsx';
import { getCardCategory, getFormattedEffectText, calculateHealAmount, calculateAttackPower, isFirearm } from '../utils/cardUtils.ts';
import { REQUIRED_ACCURACY_METERS, MAX_LOG_ENTRIES } from '../constants.ts';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';


interface GameScreenProps {
  gameState: GameState;
  playerDetails: PlayerDetails;
  onCardAction: (actionType: string, payload?: any) => void;
  onEndTurn: () => void;
  onRestartGame: () => void;
  onRestockStore: () => void;
  selectedCardDetails: { card: CardData; source: string; index: number } | null;
  setSelectedCard: (details: { card: CardData; source: string; index: number } | null) => void;
  deselectAllCards: () => void;
  onTogglePedometer: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  playerDetails,
  onCardAction,
  onEndTurn,
  onRestartGame,
  onRestockStore,
  selectedCardDetails,
  setSelectedCard,
  onTogglePedometer,
  deselectAllCards: deselectAllCardsProp,
}) => {
  const { activeEvent, storeDisplayItems, turn, log, activeObjective } = gameState;
  const restockCost = 10 + (gameState.ngPlusLevel * 5);

  const playerPanelRef = useRef<HTMLDivElement>(null);
  const frontierPanelRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // --- State for robust swipe ---
  const [activePanel, setActivePanel] = useState<'player' | 'frontier'>('player');
  const activePanelRef = useRef(activePanel);
  const [animation, setAnimation] = useState<{ direction: 'left' | 'right' } | null>(null);

  // --- State for Animation "Juice" ---
  const [threatAnimationClass, setThreatAnimationClass] = useState('');
  const [threatStatAnimClass, setThreatStatAnimClass] = useState('');
  const prevEventRef = useRef<{ id?: string; health?: number } | null>(null);
  const [playerShakeClass, setPlayerShakeClass] = useState('');
  const [healthAnimClass, setHealthAnimClass] = useState('');
  const prevHealthRef = useRef(playerDetails.health);
  const [eventAnimationClass, setEventAnimationClass] = useState('');
  const [frontierPanelShakeClass, setFrontierPanelShakeClass] = useState('');
  const prevEventIdRef = useRef<string | undefined | null>(null);
  const [animateStoreRestock, setAnimateStoreRestock] = useState(false);
  const prevHasRestockedRef = useRef(playerDetails.hasRestockedThisTurn);
  const [equipAnimationIndex, setEquipAnimationIndex] = useState<number | null>(null);

  // --- State for Satchel View ---
  const [viewedSatchelItemIndex, setViewedSatchelItemIndex] = useState(0);
  // FIX: Corrected the useState setter name from 'setLastViewedSatchelIndex' to 'setLastViewedSatchelItemIndex'.
  const [lastViewedSatchelIndex, setLastViewedSatchelItemIndex] = useState(0);
  const [satchelAnimation, setSatchelAnimation] = useState<'in' | 'out' | null>(null);

  const animatingIndices = useMemo(() => new Set(gameState.newlyDrawnCardIndices || []), [gameState.newlyDrawnCardIndices]);

  useEffect(() => {
    // Card equip animation
    if (gameState.triggerEquipAnimation) {
        const newCardIndex = playerDetails.equippedItems.length - 1;
        setEquipAnimationIndex(newCardIndex);
        
        const shakeTimer = setTimeout(() => {
            setPlayerShakeClass('player-area-shake-effect');
            setTimeout(() => setPlayerShakeClass(''), 500);
        }, 350); // Delay shake to match landing

        const animationClearTimer = setTimeout(() => {
            setEquipAnimationIndex(null);
            onCardAction('RESET_EQUIP_ANIMATION_TRIGGER');
        }, 600);

        return () => {
            clearTimeout(shakeTimer);
            clearTimeout(animationClearTimer);
        };
    }
  }, [gameState.triggerEquipAnimation, playerDetails.equippedItems.length, onCardAction]);

  useEffect(() => {
    if (playerDetails.hasRestockedThisTurn && !prevHasRestockedRef.current) {
        setAnimateStoreRestock(true);
        const timer = setTimeout(() => setAnimateStoreRestock(false), 1000);
        return () => clearTimeout(timer);
    }
    prevHasRestockedRef.current = playerDetails.hasRestockedThisTurn;
  }, [playerDetails.hasRestockedThisTurn]);

  useEffect(() => {
    const currentEventId = gameState.activeEvent?.id;
    if (currentEventId && currentEventId !== prevEventIdRef.current) {
        setEventAnimationClass('event-card-drop');
        const shakeTimer = setTimeout(() => {
            setFrontierPanelShakeClass('frontier-panel-shake');
            const clearShakeTimer = setTimeout(() => setFrontierPanelShakeClass(''), 500);
            return () => clearTimeout(clearShakeTimer);
        }, 350);
        const clearDropTimer = setTimeout(() => setEventAnimationClass(''), 600);
        
        return () => {
            clearTimeout(shakeTimer);
            clearTimeout(clearDropTimer);
        };
    }
    prevEventIdRef.current = currentEventId;
  }, [gameState.activeEvent?.id]);
  
  useEffect(() => {
    if (playerDetails.health < prevHealthRef.current) {
        setPlayerShakeClass('player-area-shake-effect');
        setHealthAnimClass('stat-damage-flash');
        setTimeout(() => setPlayerShakeClass(''), 500); 
        setTimeout(() => setHealthAnimClass(''), 400);
    } else if (playerDetails.health > prevHealthRef.current) {
        setHealthAnimClass('stat-heal-flash');
        setTimeout(() => setHealthAnimClass(''), 400);
    }
    prevHealthRef.current = playerDetails.health;
  }, [playerDetails.health]);

  useEffect(() => {
    // Threat damage shake
    const currentEvent = gameState.activeEvent;
    const prevEvent = prevEventRef.current;
    if (currentEvent && prevEvent && currentEvent.id === prevEvent.id && (currentEvent.health ?? 0) < (prevEvent.health ?? 0)) {
        setThreatAnimationClass('threat-card-shake-damage-bg');
        setThreatStatAnimClass('stat-damage-flash');
        const timer = setTimeout(() => {
          setThreatAnimationClass('');
          setThreatStatAnimClass('');
        }, 400); // Animation duration
        return () => clearTimeout(timer);
    }
    prevEventRef.current = currentEvent ? { id: currentEvent.id, health: currentEvent.health } : null;
  }, [gameState.activeEvent]);

  useEffect(() => {
    // Timer to clear the animation trigger in the global state
    if (gameState.newlyDrawnCardIndices && gameState.newlyDrawnCardIndices.length > 0) {
      const timer = setTimeout(() => {
        onCardAction('RESET_NEWLY_DRAWN_ANIMATION_TRIGGER');
      }, 1500); // Duration is long enough for animation to finish
      return () => clearTimeout(timer);
    }
  }, [gameState.newlyDrawnCardIndices, onCardAction]);

  useEffect(() => {
    // When satchel contents change (e.g., an item is used),
    // ensure the viewed index is still valid to prevent out-of-bounds errors.
    if (viewedSatchelItemIndex >= playerDetails.satchel.length) {
        const newIndex = Math.max(0, playerDetails.satchel.length - 1);
        setViewedSatchelItemIndex(newIndex);
        setLastViewedSatchelItemIndex(newIndex);
    }
  }, [playerDetails.satchel.length, viewedSatchelItemIndex]);

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  useEffect(() => {
    if (selectedCardDetails?.source !== CardContext.SATCHEL_VIEW) {
      setViewedSatchelItemIndex(lastViewedSatchelIndex);
    }
  }, [selectedCardDetails, lastViewedSatchelIndex]);

  const deselectAllCards = useCallback(() => {
    deselectAllCardsProp();
  }, [deselectAllCardsProp]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // Panel is "active" when 50% is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === playerPanelRef.current) {
            setActivePanel('player');
          } else if (entry.target === frontierPanelRef.current) {
            setActivePanel('frontier');
          }
        }
      });
    }, options);

    if (playerPanelRef.current) observer.observe(playerPanelRef.current);
    if (frontierPanelRef.current) observer.observe(frontierPanelRef.current);

    return () => {
      if (playerPanelRef.current) observer.unobserve(playerPanelRef.current);
      if (frontierPanelRef.current) observer.unobserve(frontierPanelRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!animation) {
      touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || animation) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartRef.current.x - touchEndX;
    const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const direction = deltaX > 0 ? 'left' : 'right';
      setAnimation({ direction });
    }
    
    touchStartRef.current = null;
  };
  
  useEffect(() => {
    if (!animation) return;
    
    const destinationPanel = activePanelRef.current === 'player' ? 'frontier' : 'player';
    const targetRef = destinationPanel === 'player' ? playerPanelRef : frontierPanelRef;
    
    targetRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    
    const timer = setTimeout(() => {
        setAnimation(null);
    }, 400); 
    
    return () => clearTimeout(timer);
  }, [animation]);

  const handleCardClick = (card: CardData, source: CardContext, index: number) => {
    if (selectedCardDetails &&
        selectedCardDetails.card.id === card.id &&
        selectedCardDetails.index === index &&
        selectedCardDetails.source === source) {
        setSelectedCard(null);
    } else {
        setSelectedCard({ card, source, index });
    }
  };

  const handleActiveEventClick = () => {
    if (!activeEvent) return;

    const isInteractableThreat = activeEvent.type === 'Event' &&
                               (activeEvent.subType === 'animal' || activeEvent.subType === 'human') &&
                               (activeEvent.health || 0) > 0;

    const canPlayerAct = !playerDetails.turnEnded && !playerDetails.hasTakenActionThisTurn;

    if (isInteractableThreat && canPlayerAct) {
      onCardAction('INTERACT_WITH_THREAT');
    } else {
      handleCardClick(activeEvent, CardContext.EVENT, 0);
    }
  };

  const getCardDescriptionHtml = (card: CardData | null, source: string) => {
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
    } else if (source === CardContext.HAND && card.sellValue && card.type !== 'Trophy' && card.type !== 'Objective Proof' && !card.id.startsWith('item_gold_nugget') && !card.id.startsWith('item_jewelry')) {
         desc += `<p class="mt-1 text-xs">Sell for: ${card.sellValue}G</p>`;
    }

    return desc;
  };

  const handCardsCount = playerDetails.hand.filter(card => card !== null).length;
  const totalPlayerCards = (playerDetails.playerDeck?.length || 0) + (playerDetails.playerDiscard?.length || 0) + handCardsCount;


  const isPlayerCardSelected = selectedCardDetails &&
                              (selectedCardDetails.source === CardContext.HAND || selectedCardDetails.source === CardContext.EQUIPPED);

  // Health status for visual indicators
  const healthPercentage = playerDetails.maxHealth > 0 ? playerDetails.health / playerDetails.maxHealth : 0;
  const isCriticalHealth = healthPercentage <= 0.25;
  const isLowHealth = healthPercentage <= 0.50;
  const isDamaged = healthPercentage <= 0.75;
  const isIll = (playerDetails.currentIllnesses?.length || 0) > 0 || playerDetails.mountainSicknessActive;

  let overlayClass = 'opacity-0';
  if (isCriticalHealth) {
    overlayClass = 'bg-red-700/45 opacity-100';
  } else if (isLowHealth) {
    overlayClass = 'bg-red-700/30 opacity-100';
  } else if (isDamaged) {
    overlayClass = 'bg-red-700/15 opacity-100';
  } else if (isIll) {
    overlayClass = 'bg-[var(--puke-yellow)]/25 opacity-100';
  }

  const playerAreaBorderClass = isIll
    ? 'border-2 border-[var(--puke-yellow)] shadow-[0_0_10px_color-mix(in_srgb,var(--puke-yellow)_40%,transparent)]'
    : '';
  
  const mostRecentIllness = playerDetails.currentIllnesses && playerDetails.currentIllnesses.length > 0
    ? playerDetails.currentIllnesses[playerDetails.currentIllnesses.length - 1].name
    : null;

  const playerStatusText = mostRecentIllness
    ? mostRecentIllness
    : playerDetails.mountainSicknessActive
    ? "Mountain Sickness"
    : isCriticalHealth
    ? "Critical Health"
    : isLowHealth
    ? "Low Health"
    : "Healthy";

  const playerStatusStyle = isIll
    ? 'text-red-600 font-bold'
    : isCriticalHealth
    ? 'text-red-700 font-bold'
    : isLowHealth
    ? 'text-red-600'
    : 'text-green-600';

    let pedometerButtonText = "Pedometer Off";
    let pedometerButtonClass = "button";
    let pedometerTitle = "Click to activate pedometer and track steps. Requires GPS.";
    
    if (playerDetails.pedometerActive) {
      if (playerDetails.locationAccuracy === null) {
          pedometerButtonText = "Tracking...";
          pedometerButtonClass = "button bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-600";
          pedometerTitle = `Acquiring GPS signal... Steps: ${playerDetails.stepsTaken}.`;
      } else if (playerDetails.locationAccuracy > REQUIRED_ACCURACY_METERS) {
          pedometerButtonText = "Weak Signal";
          pedometerButtonClass = "button bg-orange-400 hover:bg-orange-500 text-black border-orange-600";
          pedometerTitle = `GPS signal weak. Accuracy: ${playerDetails.locationAccuracy.toFixed(0)}m. Needs < ${REQUIRED_ACCURACY_METERS}m. Steps: ${playerDetails.stepsTaken}.`;
      } else {
          pedometerButtonText = `${playerDetails.stepsTaken} Steps`;
          pedometerButtonClass = "button bg-green-500 hover:bg-green-600 text-white border-green-700";
          pedometerTitle = `Pedometer Active. Steps: ${playerDetails.stepsTaken}. GPS Accuracy: ${playerDetails.locationAccuracy.toFixed(0)}m. Click to deactivate.`;
      }
    }

  const getPlayerNameFontClass = (name: string | null): string => {
    const length = name ? name.length : 0;
    const fontClasses = [
      'font-signature-l1',      // Index 0 for length 1 (Great Vibes)
      'font-signature-l2',      // Index 1 for length 2 (Cedarville Cursive)
      'font-signature-l3',      // Index 2 for length 3 (Dancing Script)
      'font-signature-l4',      // Index 3 for length 4 (Parisienne)
      'font-signature-l5plus'   // Index 4 for length 5 (Alex Brush)
    ];

    if (length === 0) return fontClasses[4]; // Default (Alex Brush)
    if (length === 1) return fontClasses[0];
    if (length === 2) return fontClasses[1];
    if (length === 3) return fontClasses[2];
    if (length === 4) return fontClasses[3];
    // Cycle for length 5 and above
    return fontClasses[(length - 1) % 5];
  };
  const playerNameFontClass = getPlayerNameFontClass(playerDetails.name);
  
  const getHealthBreakdown = () => {
    const { character, cumulativeNGPlusMaxHealthBonus, equippedItems } = playerDetails;
    if (!character) return null;

    const parts: { label: string, value: string }[] = [];
    parts.push({ label: 'Base Health', value: `+${character.health}` });
    
    if (cumulativeNGPlusMaxHealthBonus > 0) {
      parts.push({ label: 'NG+ Bonus', value: `+${cumulativeNGPlusMaxHealthBonus}` });
    }
    
    equippedItems.forEach(item => {
      if (item.effect?.persistent && item.type === 'Player Upgrade') {
        if (item.effect.subtype === 'max_health' && typeof item.effect.amount === 'number') {
          parts.push({ label: item.name, value: `+${item.effect.amount}` });
        } else if (item.effect.subtype === 'damage_negation' && typeof item.effect.max_health === 'number') {
          parts.push({ label: item.name, value: `+${item.effect.max_health}` });
        }
      }
    });
    
    if (parts.length <= 1) return null;

    let breakdownHtml = parts.map(p => `<span>${p.label}:</span><span class="text-right">${p.value}</span>`).join('');
    breakdownHtml += `<hr class='border-t border-[var(--ink-secondary)]/50 my-1 col-span-2'><span><strong>Total:</strong></span><span class="text-right"><strong>${playerDetails.maxHealth}</strong></span>`;
    
    return `<div class="grid grid-cols-2 gap-x-2 text-xs">${breakdownHtml}</div>`;
  };

  const healthBreakdownHtml = getHealthBreakdown();

  const handleCycleSatchel = useCallback(() => {
    setSatchelAnimation('out');
    setTimeout(() => {
        const newIndex = (viewedSatchelItemIndex + 1) % playerDetails.satchel.length;
        setViewedSatchelItemIndex(newIndex);
        setLastViewedSatchelItemIndex(newIndex);
        setSatchelAnimation('in');
        setTimeout(() => setSatchelAnimation(null), 400); // match animation duration
    }, 400); // match animation duration
  }, [viewedSatchelItemIndex, playerDetails.satchel.length]);

  const playerPanel = (
    <div
      id="player1Area"
      className={`
        player-area
        bg-[rgba(244,241,234,0.9)] text-[var(--ink-main)]
        p-3 sm:p-4 md:p-5
        rounded-sm border border-[var(--border-color)]
        relative transition-all duration-300 ease-in-out
        ${playerAreaBorderClass}
        ${playerShakeClass}
      `}
      aria-live="polite"
      aria-atomic="true"
    >
      {gameState.ngPlusLevel > 0 && (
        <div className="absolute top-2 right-4 font-western text-yellow-600 text-2xl" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          NG+{gameState.ngPlusLevel}
        </div>
      )}
      <div className={`absolute inset-0 rounded-sm pointer-events-none transition-opacity duration-300 ${overlayClass}`}></div>
      <div className="relative">
          <div className="flex justify-between items-end">
              <div className="mb-0">
                <h3 id="player1Name" className={`${playerNameFontClass} text-stone-800 text-5xl leading-tight`}>{playerDetails.name}</h3>
                <p className="font-semibold text-lg">{playerDetails.character?.name}</p>
                 <div className="tooltip-container">
                    <p>Health: <span id="player1Health" className="font-bold text-red-700 text-lg"><span className={healthAnimClass}>{playerDetails.health}</span> / {playerDetails.maxHealth}</span></p>
                    {healthBreakdownHtml && (
                        <div className="tooltip" dangerouslySetInnerHTML={{ __html: healthBreakdownHtml }} />
                    )}
                 </div>
                <p>Gold: <span id="player1Gold" className={`font-bold text-yellow-500 text-lg ${gameState.goldFlashPlayer ? 'gold-gained' : ''}`}>{playerDetails.gold}</span></p>
                <div className="flex items-center gap-2">
                    <p>Status: <span id="player1Illness" className={`font-semibold ${playerStatusStyle}`}>{playerStatusText}</span></p>
                    <div className="flex gap-1 items-center">
                        {isIll && (
                            <div className="tooltip-container">
                                <span className="status-icon illness" title="You are ill!">&#9763;</span>
                                <div className="tooltip">
                                    <p className="font-bold">Active Illnesses:</p>
                                    <ul className="list-disc list-inside">
                                        {(playerDetails.currentIllnesses || []).map(ill => <li key={ill.id}>{ill.name}</li>)}
                                        {playerDetails.mountainSicknessActive && <li>Mountain Sickness (Temp)</li>}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {isCriticalHealth && <span className="status-icon" title="Health is critical!">&#9888;</span>}
                        {!isCriticalHealth && isLowHealth && <span className="status-icon" title="Health is low.">&#9888;</span>}
                    </div>
                </div>
              </div>
              <div>
              <h4 className="font-semibold text-right text-lg">Deck Info</h4>
              <p className="text-right">Total Cards: <span id="playerDeckTotalCount" className="font-bold text-blue-600 text-lg">{totalPlayerCards}</span></p>
              <p className="text-right">Deck: <span id="playerDeckCount" className="font-bold text-blue-600 text-lg">{playerDetails.playerDeck?.length || 0}</span></p>
              <p className="text-right">Discard: <span id="playerDiscardCount" className="font-bold text-blue-400 text-lg">{playerDetails.playerDiscard?.length || 0}</span></p>
              </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <h4 className="font-semibold">Equipped ({playerDetails.equippedItems?.length || 0}/{playerDetails.equipSlots}):</h4>
            {gameState.pedometerFeatureEnabledByUser && (
              <button
                id="pedometerButton"
                className={`${pedometerButtonClass} !text-xs !py-1`}
                onClick={onTogglePedometer}
                title={pedometerTitle}
              >
                {pedometerButtonText}
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center mt-1 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <div
              id="player1EquippedDisplay"
              className="grid grid-cols-3 bg-[rgba(0,0,0,0.03)] rounded-sm border border-dashed border-[var(--border-color)] justify-center
                          p-1 gap-1.5 w-full
                          sm:w-auto
                          md:p-2 md:gap-2
                          lg:p-1.5 lg:gap-1.5
                          xl:p-2 xl:gap-2"
              >
              {Array.from({ length: playerDetails.equipSlots }).map((_, i) => {
                  const equippedCard = playerDetails.equippedItems[i];
                  const isSatchel = equippedCard?.effect?.subtype === 'storage';
                  const isViewingThisSatchel = selectedCardDetails?.source === CardContext.SATCHEL_VIEW && selectedCardDetails?.index === i;

                  let isEquippedPlayable = !!equippedCard;
                  if (equippedCard && (equippedCard.effect?.type === 'weapon' || equippedCard.effect?.type === 'conditional_weapon' || equippedCard.effect?.type === 'fire_arrow')) {
                      isEquippedPlayable = isEquippedPlayable && !!activeEvent && activeEvent.type === 'Event' && (activeEvent.health || 0) > 0;
                  }

                  let satchelAnimClass = '';
                  if (satchelAnimation === 'out') {
                      satchelAnimClass = 'slide-out-left';
                  } else if (satchelAnimation === 'in') {
                      satchelAnimClass = 'slide-in-right';
                  }

                  return (
                      <div key={`equipped-wrapper-${i}`} className="relative">
                        <CardComponent
                          key={`equipped-${equippedCard?.id || 'empty'}-${i}`}
                          card={equippedCard}
                          context={CardContext.EQUIPPED}
                          onClick={() => equippedCard && handleCardClick(equippedCard, CardContext.EQUIPPED, i)}
                          isSelected={
                              selectedCardDetails != null &&
                              !isViewingThisSatchel && // Don't show selection on satchel when viewing contents
                              selectedCardDetails.card?.id === equippedCard?.id &&
                              selectedCardDetails.index === i &&
                              selectedCardDetails.source === CardContext.EQUIPPED
                          }
                          indexInSource={i}
                          playerDetails={{...playerDetails, activeEventForAttack: activeEvent}}
                          onAction={onCardAction}
                          isPlayable={isEquippedPlayable}
                          isDisabled={playerDetails.turnEnded || !equippedCard}
                          className={equipAnimationIndex === i ? 'event-card-drop' : ''}
                          onViewSatchel={isSatchel && playerDetails.satchel.length > 0 ? () => {
                              if (isViewingThisSatchel) {
                                  setSelectedCard(null);
                              } else {
                                  setSelectedCard({ card: equippedCard, source: CardContext.SATCHEL_VIEW, index: i });
                              }
                          } : undefined}
                          lastViewedSatchelIndex={lastViewedSatchelIndex}
                        />
                        {isViewingThisSatchel && playerDetails.satchel.length > 0 && (
                          <div className="absolute top-0 left-0 z-20" style={{ transform: 'translate(15%, -15%) scale(1.05)' }}>
                            <div className={satchelAnimClass}>
                              <CardComponent
                                card={playerDetails.satchel[viewedSatchelItemIndex]}
                                context={CardContext.SATCHEL_VIEW}
                                indexInSource={viewedSatchelItemIndex}
                                isSelected={true}
                                playerDetails={playerDetails}
                                onAction={(actionType, payload) => {
                                  if (actionType === 'USE_ITEM') {
                                    onCardAction('USE_FROM_SATCHEL', { itemFromSatchel: payload.card, itemIndexInSatchel: payload.index });
                                  } else if (actionType === 'SELL_FROM_SATCHEL') {
                                    onCardAction('SELL_FROM_SATCHEL', { 
                                        cardToSell: payload.card, 
                                        satchelEquipmentIndex: selectedCardDetails?.index,
                                        itemIndexInSatchel: payload.index
                                    });
                                  }
                                  setSelectedCard(null); // Close view after use
                                }}
                                onCycleSatchel={handleCycleSatchel}
                                isSellable={!gameState.blockTradeDueToHostileEvent && !playerDetails.turnEnded}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                  );
              })}
              </div>
              <div className="w-full mt-1 sm:mt-0 sm:ml-2 sm:flex-1 text-xs sm:text-sm italic text-stone-600 text-center sm:text-left">
              <p>An equipped weapon gets a +1 damage bonus.</p>
              </div>
          </div>

          <h4 className="font-semibold mt-4 sm:mt-5 md:mt-6 lg:mt-8 mb-1">Hand ({handCardsCount}/{playerDetails.handSize}):</h4>
          <div
              id="player1HandDisplay"
              className="grid grid-cols-3 mt-1 rounded border border-dashed border-gray-400 bg-black/5
                      p-1 gap-1.5 min-h-[20.8rem]
                      sm:p-1.5 sm:gap-1.5 sm:min-h-[20.8rem]
                      md:p-2 md:gap-2 md:min-h-[25.5rem]
                      lg:p-1.5 lg:gap-1.5 lg:min-h-[31rem]
                      xl:p-2 xl:gap-2 xl:min-h-[34rem]
                      2xl:min-h-[37rem]"
          >
              {Array.from({ length: playerDetails.handSize }).map((_, i) => {
                  const cardInSlot = playerDetails.hand[i];
                  let isHandPlayable = !!cardInSlot;
                  if (cardInSlot && (cardInSlot.effect?.type === 'weapon' || cardInSlot.effect?.type === 'conditional_weapon' || cardInSlot.effect?.type === 'fire_arrow')) {
                      isHandPlayable = isHandPlayable && !!activeEvent && activeEvent.type === 'Event' && (activeEvent.health || 0) > 0;
                  }
                  if (cardInSlot && cardInSlot.effect?.type === 'trap') {
                      isHandPlayable = true;
                  }


                  return (
                      <CardComponent
                          key={`hand-${cardInSlot?.id || 'empty'}-${i}`}
                          card={cardInSlot}
                          context={CardContext.HAND}
                          onClick={() => cardInSlot && handleCardClick(cardInSlot, CardContext.HAND, i)}
                          isSelected={selectedCardDetails?.card?.id === cardInSlot?.id && selectedCardDetails?.index === i && selectedCardDetails?.source === CardContext.HAND}
                          indexInSource={i}
                          playerDetails={{...playerDetails, activeEventForAttack: activeEvent}}
                          onAction={onCardAction}
                          isPlayable={isHandPlayable}
                          isEquipable={!!cardInSlot && !playerDetails.hasEquippedThisTurn && (playerDetails.equippedItems?.length || 0) < playerDetails.equipSlots && !playerDetails.turnEnded && cardInSlot.type !== 'Player Upgrade'}
                          isEquipablePlayerUpgrade={!!cardInSlot && !playerDetails.hasEquippedThisTurn && (playerDetails.equippedItems?.length || 0) < playerDetails.equipSlots && !playerDetails.turnEnded && cardInSlot.type === 'Player Upgrade'}
                          isStorable={!!cardInSlot && (playerDetails.satchel?.length || 0) < (playerDetails.equippedItems.find(item => item.effect?.subtype === 'storage')?.effect?.capacity || 0) && !playerDetails.turnEnded && cardInSlot.type === 'Provision'}
                          isSellable={!!cardInSlot && typeof cardInSlot.sellValue === 'number' && cardInSlot.sellValue > 0 && !playerDetails.turnEnded}
                          blockTradeDueToHostileEvent={gameState.blockTradeDueToHostileEvent}
                          isDisabled={playerDetails.turnEnded || !cardInSlot}
                          className={animatingIndices.has(i) ? 'card-enter-animation' : ''}
                          style={{ animationDelay: animatingIndices.has(i) ? `${i * 80}ms` : undefined }}
                      />
                  );
              })}
          </div>
          {isPlayerCardSelected && selectedCardDetails && selectedCardDetails.card && (
              <div
                id="cardDescriptionPlayerArea"
                className="my-2 p-3 bg-[rgba(244,241,234,0.8)] rounded shadow-inner min-h-[6rem] text-sm"
                aria-live="polite"
                dangerouslySetInnerHTML={{ __html: getCardDescriptionHtml(selectedCardDetails.card, selectedCardDetails.source) }}
              />
          )}
      </div>
    </div>
  );

  const frontierPanel = (
    <div className={`flex flex-col bg-[rgba(244,241,234,0.9)] text-[var(--ink-main)] p-3 sm:p-4 md:p-5 rounded-sm border border-[var(--border-color)] ${frontierPanelShakeClass}`}>
      <div className={`mt-0 transition-all duration-300 ${gameState.blockTradeDueToHostileEvent ? 'store-blocked' : ''}`}>
        <div className="flex flex-col items-start mb-2">
          <h4 className="font-western text-lg text-blue-700">General Store:</h4>
          <div className="text-xs text-[var(--ink-main)] mt-0.5">Store Deck: <span className="font-bold">{gameState.storeItemDeck?.length || 0}</span></div>
          <button
              id="restockButton"
              className="button !mt-1 !py-1 !px-2 text-sm w-full max-w-xs"
              onClick={() => {
                soundManager.playSound('ui_button_click');
                onRestockStore();
              }}
              disabled={playerDetails.hasRestockedThisTurn || playerDetails.gold < restockCost || playerDetails.turnEnded || gameState.blockTradeDueToHostileEvent}
          >
              {`Restock (${restockCost}G)`}
          </button>
        </div>
        <div id="storeDisplay" className="flex flex-wrap justify-start mt-1
                                          gap-1.5
                                          sm:gap-1.5
                                          md:gap-2
                                          lg:gap-1.5
                                          xl:gap-2">
          {storeDisplayItems.map((card, i) => (
            <CardComponent
              key={`store-${card?.id || 'empty'}-${i}`}
              card={card}
              context={CardContext.STORE}
              onClick={() => card && handleCardClick(card, CardContext.STORE, i)}
              isSelected={
                  selectedCardDetails != null &&
                  selectedCardDetails.card?.id === card?.id &&
                  selectedCardDetails.index === i &&
                  selectedCardDetails.source === CardContext.STORE
              }
              indexInSource={i}
              playerDetails={playerDetails}
              onAction={onCardAction}
              canAfford={playerDetails.gold >= (card?.buyCost || 0)}
              blockTradeDueToHostileEvent={gameState.blockTradeDueToHostileEvent}
              isDisabled={playerDetails.turnEnded || !card || gameState.blockTradeDueToHostileEvent}
              showBack={!card && gameState.storeDisplayItems[i] === undefined}
              className={animateStoreRestock ? 'card-enter-animation' : ''}
              style={{ animationDelay: animateStoreRestock ? `${i * 100}ms` : undefined }}
            />
          ))}
        </div>
      </div>

      <hr className="my-2 border-gray-400" />

      <div className="flex flex-col items-start mb-2">
        <h3 className="text-xl font-western text-[var(--ink-main)]">The Frontier</h3>
        <div className="text-xs text-[var(--ink-main)] mt-0.5">Event Deck: <span className="font-bold text-red-600">{gameState.eventDeck?.length || 0}</span></div>
      </div>

      {(() => {
        let cardForDescription: CardData | null = activeEvent;
        let sourceForDescription: CardContext = CardContext.EVENT;

        if (selectedCardDetails && (selectedCardDetails.source === CardContext.EVENT || selectedCardDetails.source === CardContext.STORE)) {
            cardForDescription = selectedCardDetails.card;
            sourceForDescription = selectedCardDetails.source as CardContext;
        }

        const descriptionHtml = cardForDescription
            ? getCardDescriptionHtml(cardForDescription, sourceForDescription)
            : `<p class="text-stone-600 italic text-center p-4">The trail is quiet... for now.</p>`;

        return (
          <div className="flex flex-col sm:flex-row items-start gap-1.5 sm:gap-2 md:gap-2 lg:gap-1.5 xl:gap-2">
            <div className="flex flex-row justify-center w-full sm:w-auto gap-1.5 sm:gap-2 md:gap-2 lg:gap-1.5 xl:gap-2">
              <div id="activeEventCardDisplay" className="event-display-card">
              {activeEvent ? (
                  <CardComponent
                  key={`event-${activeEvent.id}-${gameState.turn}`}
                  card={activeEvent}
                  context={CardContext.EVENT}
                  onClick={handleActiveEventClick}
                  isSelected={selectedCardDetails?.source !== CardContext.SATCHEL_VIEW && selectedCardDetails?.card?.id === activeEvent.id && selectedCardDetails?.source === CardContext.EVENT}
                  indexInSource={0}
                  playerDetails={playerDetails}
                  onAction={onCardAction}
                  isDisabled={playerDetails.turnEnded}
                  className={`${threatAnimationClass} ${eventAnimationClass}`}
                  statAnimationClass={threatStatAnimClass}
                  />
              ) : (
                  <div className={`card flex items-center justify-center border-2 border-[var(--ink-main)] bg-[var(--paper-bg)] text-[var(--ink-main)] rounded m-1 text-center shadow-md w-[7rem] h-[9.8rem] text-[0.65rem] p-1.5 sm:w-[7rem] sm:h-[9.8rem] sm:text-[0.65rem] sm:p-1.5 md:w-[8.5rem] md:h-[11.9rem] md:text-[0.7rem] md:p-2 lg:w-[10.5rem] lg:h-[14.7rem] lg:text-[0.8rem] lg:p-2.5 xl:w-[11.5rem] xl:h-[16.1rem] xl:text-[0.8rem] xl:p-2.5 2xl:w-[12.5rem] 2xl:h-[17.5rem] 2xl:text-sm 2xl:p-3`}>
                  <div className="font-['Special_Elite']">All Clear</div>
                  </div>
              )}
              </div>
              {/* Objective Card Display */}
              {activeObjective && (
              <div id="activeObjectiveCardDisplay" className="objective-display-card">
                  <CardComponent
                    key={`objective-${activeObjective.id}`}
                    card={activeObjective}
                    context={CardContext.EVENT}
                    onClick={() => handleCardClick(activeObjective, CardContext.EVENT, 1)}
                    isSelected={
                        selectedCardDetails?.card?.id === activeObjective.id &&
                        selectedCardDetails?.source === CardContext.EVENT
                    }
                    indexInSource={1}
                    playerDetails={playerDetails}
                    onAction={onCardAction}
                    isDisabled={playerDetails.turnEnded}
                  />
              </div>
              )}
            </div>
            <div
              id="eventDescription"
              className="w-full mt-1 sm:mt-0 sm:flex-1 p-3 bg-[rgba(244,241,234,0.8)] rounded shadow-inner text-sm min-h-[9.8rem] md:min-h-[11.9rem] lg:min-h-[14.7rem] xl:min-h-[16.1rem] 2xl:min-h-[17.5rem]"
              aria-live="polite"
              dangerouslySetInnerHTML={{__html: descriptionHtml}}
            />
          </div>
        );
      })()}
      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-2 mt-3 sm:mt-2">
          <div id="activeTrapDisplay" className="w-full sm:w-auto sm:flex-1 flex items-center justify-center p-2 bg-white rounded shadow text-center font-semibold text-sm sm:text-base">
              Trap: {playerDetails.activeTrap ? playerDetails.activeTrap.name : 'None'}
          </div>
          <div id="turnIndicator" className="w-full sm:w-auto sm:flex-1 flex items-center justify-center p-2 bg-white rounded shadow text-center font-semibold text-sm sm:text-base">
            <span>Day: <span id="turnNumberDisplay">{turn}</span></span>
          </div>
          <button
              id="endTurnButton"
              className="button w-full sm:w-auto sm:flex-1 !mt-0"
              onClick={onEndTurn}
              disabled={playerDetails.health <= 0 || playerDetails.turnEnded || gameState.status === 'finished'}
          >
              End Day
          </button>
      </div>
      <div id="playerActions" className="mt-4">
        <GameLogComponent logEntries={log} />
        <button
            id="restartButton"
            className="button w-full bg-red-800 hover:bg-red-900 border-red-900 text-[var(--paper-bg)]"
            onClick={onRestartGame}
        >
            Restart Game
        </button>
      </div>
    </div>
  );

  // --- Animation Class Calculation ---
  let playerPanelClasses = '';
  let frontierPanelClasses = '';
  const isAnimating = !!animation;
  
  if (isAnimating) {
    const destinationPanel = activePanelRef.current === 'player' ? 'frontier' : 'player';
    const direction = animation.direction;

    if (destinationPanel === 'frontier') { // Player is outgoing
      playerPanelClasses = 'invisible'; // Hide outgoing
      frontierPanelClasses = direction === 'left' ? 'slide-in-from-right' : 'slide-in-from-left';
    } else { // Frontier is outgoing
      frontierPanelClasses = 'invisible'; // Hide outgoing
      playerPanelClasses = direction === 'left' ? 'slide-in-from-right' : 'slide-in-from-left';
    }
  }

  return (
    <div id="gameArea">
      {/* Desktop Layout: Grid */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        {playerPanel}
        <div id="frontierArea">{frontierPanel}</div>
      </div>

      {/* Mobile Layout: Vertical Scroll with Swipe Animations */}
      <div
        className="lg:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          ref={playerPanelRef}
          className={`${playerPanelClasses}`}
        >
          {playerPanel}
        </div>
        <div
          ref={frontierPanelRef}
          className={`${frontierPanelClasses} ${!isAnimating ? 'mt-6' : ''}`}
        >
          <div id="frontierAreaMobile">{frontierPanel}</div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
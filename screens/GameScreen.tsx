import React, { useEffect, useState, useRef, useMemo, useCallback, CSSProperties, useLayoutEffect } from 'react';
import { GameState, PlayerDetails, CardData, CardContext, LogEntry } from '../types.ts';
import CardComponent from '../components/CardComponent.tsx';
import GameLogComponent from '../components/GameLogComponent.tsx';
import { getCardDescriptionHtml } from '../utils/cardUtils.ts';
import { REQUIRED_ACCURACY_METERS, MAX_LOG_ENTRIES, CURRENT_CARDS_DATA } from '../constants.ts';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';
import { CARD_ILLUSTRATIONS } from '../assets/card-illustrations/index.ts';
import { imageManager } from '../utils/imageManager.ts';


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
  onToggleSaveModal: () => void;
}

interface ObjectiveProgressDisplay {
    text: string;
    title: string;
    isComplete?: boolean;
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
  onToggleSaveModal,
  deselectAllCards: deselectAllCardsProp,
}) => {
  const { activeEvent, storeDisplayItems, turn, log, activeObjectives, objectiveChoices, selectedObjectiveIndices } = gameState;
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
  const prevHealthRef = useRef(playerDetails.health);
  const [playerShakeClass, setPlayerShakeClass] = useState('');
  const [healthAnimClass, setHealthAnimClass] = useState('');
  const [eventAnimationClass, setEventAnimationClass] = useState('');
  const [frontierPanelShakeClass, setFrontierPanelShakeClass] = useState('');
  const prevEventIdRef = useRef<string | undefined | null>(null);
  const [trapAnimationClass, setTrapAnimationClass] = useState('');
  const prevTrapIdRef = useRef<string | null>(null);
  
  // --- State for Satchel View ---
  const [viewedSatchelItemIndex, setViewedSatchelItemIndex] = useState(0);
  const [lastViewedSatchelIndex, setLastViewedSatchelIndex] = useState(0);
  const [satchelAnimation, setSatchelAnimation] = useState<'in-right' | 'out-left' | 'in-left' | 'out-right' | null>(null);

  // --- State for status tooltip ---
  const [isStatusTooltipVisible, setIsStatusTooltipVisible] = useState(false);
  const statusTooltipTriggerRef = useRef<HTMLDivElement>(null);
  const statusTooltipRef = useRef<HTMLDivElement>(null);
  const [statusTooltipStyle, setStatusTooltipStyle] = useState<CSSProperties>({});

  const animatingIndices = useMemo(() => new Set(gameState.newlyDrawnCardIndices || []), [gameState.newlyDrawnCardIndices]);
  
  const characterIllustrationUrl = playerDetails.character ? imageManager.getCachedUrl(CARD_ILLUSTRATIONS[playerDetails.character.id]) : '';
  
  const healthPercentage = playerDetails.maxHealth > 0 ? playerDetails.health / playerDetails.maxHealth : 0;
  const isCriticalHealth = healthPercentage <= 0.25;
  const isLowHealth = healthPercentage > 0.25 && healthPercentage <= 0.50;
  const isIll = (playerDetails.currentIllnesses?.length || 0) > 0 || playerDetails.mountainSicknessActive;
  
  const toggleStatusTooltip = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsStatusTooltipVisible(prev => !prev);
  };
  
  useEffect(() => {
    if (!isStatusTooltipVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (statusTooltipTriggerRef.current && !statusTooltipTriggerRef.current.contains(event.target as Node)) {
        setIsStatusTooltipVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusTooltipVisible]);

  useLayoutEffect(() => {
    if (!isStatusTooltipVisible || !statusTooltipTriggerRef.current || !statusTooltipRef.current) return;

    const container = statusTooltipTriggerRef.current;
    const tooltip = statusTooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();

    if (tooltipRect.width === 0) return;

    const panel = container.closest('.player-area');
    const boundaryRect = panel ? panel.getBoundingClientRect() : { left: 0, right: window.innerWidth };
    const padding = 10;

    const containerRect = container.getBoundingClientRect();

    const newStyles: CSSProperties = {
        bottom: '105%',
        transform: 'none',
    };

    let idealAbsLeft = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);

    if (idealAbsLeft < boundaryRect.left + padding) {
        idealAbsLeft = boundaryRect.left + padding;
    } else if (idealAbsLeft + tooltipRect.width > boundaryRect.right - padding) {
        idealAbsLeft = boundaryRect.right - tooltipRect.width - padding;
    }
    
    const relativeLeft = idealAbsLeft - containerRect.left;
    newStyles.left = `${relativeLeft}px`;
    
    setStatusTooltipStyle(newStyles);
  }, [isStatusTooltipVisible]);

  const statusTooltipHtml = useMemo(() => {
    if (isIll) {
      let html = '<p class="font-bold text-base mb-1">Active Afflictions</p>';
      html += '<ul class="list-disc list-inside space-y-1">';
  
      const allCures: CardData[] = Object.values(CURRENT_CARDS_DATA).filter(card => 
          card.type === 'Provision' && card.effect && (card.effect.cures || card.effect.cures_illness)
      );
  
      const universalCures = allCures.filter(c => c.effect?.cures);
  
      playerDetails.currentIllnesses.forEach(illness => {
          html += `<li><strong>${illness.name}</strong>`;
          const specificCures = allCures.filter(c => c.effect?.cures_illness === illness.name);
          
          const allPossibleCures = [...new Set([...specificCures, ...universalCures])];
  
          if (allPossibleCures.length > 0) {
              html += `<br/><span class="text-xs italic text-[var(--ink-secondary)]">Cured by: ${allPossibleCures.map(c => c.name).join(', ')}</span>`;
          }
          
          html += '</li>';
      });
  
      if (playerDetails.mountainSicknessActive) {
          html += '<li><strong>Mountain Sickness</strong><br/><span class="text-xs italic text-[var(--ink-secondary)]">Temporary. Cures automatically.</span></li>';
      }
  
      html += '</ul>';
      return html;
    }

    if (isCriticalHealth) {
      return `<p class="font-bold text-base mb-1">Critical Health!</p><p>You are at ${playerDetails.health} HP, which is 25% or less of your max health. Be extremely careful!</p>`;
    }

    if (isLowHealth) {
      return `<p class="font-bold text-base mb-1">Low Health</p><p>You are at ${playerDetails.health} HP, which is 50% or less of your max health. Consider using a healing item.</p>`;
    }

    return `<p class="font-bold text-base mb-1">Healthy</p><p>You are in good shape. Your health is above 50%.</p>`;
  }, [isIll, isCriticalHealth, isLowHealth, playerDetails.health, playerDetails.currentIllnesses, playerDetails.mountainSicknessActive]);

  useEffect(() => {
    if (gameState.equipAnimationIndex !== null) {
      const animationClearTimer = setTimeout(() => {
          onCardAction('RESET_EQUIP_ANIMATION_TRIGGER');
      }, 600);
      return () => clearTimeout(animationClearTimer);
    }
  }, [gameState.equipAnimationIndex, onCardAction]);
  
  useEffect(() => {
      if (gameState.playerShake) {
          const timer = setTimeout(() => {
              onCardAction('RESET_PLAYER_SHAKE');
          }, 500); // Animation duration
          return () => clearTimeout(timer);
      }
  }, [gameState.playerShake, onCardAction]);


  useEffect(() => {
    if (gameState.triggerStoreRestockAnimation) {
        const timer = setTimeout(() => {
            onCardAction('RESET_RESTOCK_ANIMATION_TRIGGER');
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [gameState.triggerStoreRestockAnimation, onCardAction]);

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
    const currentEvent = gameState.activeEvent;
    const prevEvent = prevEventRef.current;
    if (currentEvent && prevEvent && currentEvent.id === prevEvent.id && (currentEvent.health ?? 0) < (prevEvent.health ?? 0)) {
        setThreatAnimationClass('threat-card-shake-damage-bg');
        setThreatStatAnimClass('stat-damage-flash');
        const timer = setTimeout(() => {
          setThreatAnimationClass('');
          setThreatStatAnimClass('');
        }, 400);
        return () => clearTimeout(timer);
    }
    prevEventRef.current = currentEvent ? { id: currentEvent.id, health: currentEvent.health } : null;
  }, [gameState.activeEvent]);

  useEffect(() => {
    if (gameState.newlyDrawnCardIndices && gameState.newlyDrawnCardIndices.length > 0) {
      const timer = setTimeout(() => {
        onCardAction('RESET_NEWLY_DRAWN_ANIMATION_TRIGGER');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.newlyDrawnCardIndices, onCardAction]);

  useEffect(() => {
    if (gameState.triggerThreatShake) {
        setThreatAnimationClass('threat-card-shake-damage-bg');
        const timer = setTimeout(() => {
            setThreatAnimationClass('');
            onCardAction('RESET_THREAT_SHAKE_TRIGGER');
        }, 400);
        return () => clearTimeout(timer);
    }
  }, [gameState.triggerThreatShake, onCardAction]);

  useEffect(() => {
    const currentTrapId = playerDetails.activeTrap?.id;
    if (currentTrapId && currentTrapId !== prevTrapIdRef.current) {
        setTrapAnimationClass('event-card-drop');
        const timer = setTimeout(() => setTrapAnimationClass(''), 600);
        return () => clearTimeout(timer);
    }
    prevTrapIdRef.current = currentTrapId || null;
  }, [playerDetails.activeTrap]);

  useEffect(() => {
    const currentSatchelContents = playerDetails.satchels[lastViewedSatchelIndex] || [];
    if (viewedSatchelItemIndex >= currentSatchelContents.length) {
        const newIndex = Math.max(0, currentSatchelContents.length - 1);
        setViewedSatchelItemIndex(newIndex);
    }
  }, [playerDetails.satchels, lastViewedSatchelIndex, viewedSatchelItemIndex]);

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  useEffect(() => {
    if (selectedCardDetails?.source !== CardContext.SATCHEL_VIEW) {
      setViewedSatchelItemIndex(0);
    }
  }, [selectedCardDetails]);

  const deselectAllCards = useCallback(() => {
    deselectAllCardsProp();
  }, [deselectAllCardsProp]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
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

  const handCardsCount = playerDetails.hand.filter(card => card !== null).length;
  const totalPlayerCards = (playerDetails.playerDeck?.length || 0) + (playerDetails.playerDiscard?.length || 0) + handCardsCount;


  let cardForPlayerDescription: CardData | null = null;
  let sourceForPlayerDescription: string | null = null;

  if (selectedCardDetails) {
    if (selectedCardDetails.source === CardContext.HAND || selectedCardDetails.source === CardContext.EQUIPPED) {
      cardForPlayerDescription = selectedCardDetails.card;
      sourceForPlayerDescription = selectedCardDetails.source;
    } else if (selectedCardDetails.source === CardContext.SATCHEL_VIEW) {
      const satchelIndex = selectedCardDetails.index;
      const satchelContents = playerDetails.satchels[satchelIndex] || [];
      if (satchelContents.length > 0 && viewedSatchelItemIndex < satchelContents.length) {
        cardForPlayerDescription = satchelContents[viewedSatchelItemIndex];
        sourceForPlayerDescription = CardContext.SATCHEL_VIEW;
      }
    }
  }

  const isDamaged = healthPercentage <= 0.75;

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

  const isStatusNegative = isIll || isCriticalHealth || isLowHealth;
  const playerStatusStyle = isStatusNegative
      ? `font-semibold ${(isIll || isCriticalHealth) ? 'font-bold' : ''}`
      : 'font-semibold';
  
  let playerStatusColor = 'var(--heal-green)';
  if (isIll) {
      playerStatusColor = 'var(--faded-green)';
  } else if (isCriticalHealth || isLowHealth) {
      playerStatusColor = 'var(--blood-red)';
  }

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
      'font-signature-l1',
      'font-signature-l2',
      'font-signature-l3',
      'font-signature-l4',
      'font-signature-l5plus'
    ];

    if (length === 0) return fontClasses[4];
    if (length === 1) return fontClasses[0];
    if (length === 2) return fontClasses[1];
    if (length === 3) return fontClasses[2];
    if (length === 4) return fontClasses[3];
    return fontClasses[(length - 1) % 5];
  };
  const playerNameFontClass = getPlayerNameFontClass(playerDetails.name);

  const playerNameRef = useRef<HTMLHeadingElement>(null);
  const playerNameContainerRef = useRef<HTMLDivElement>(null);
  const [nameStyle, setNameStyle] = useState<CSSProperties>({});
  const { name } = playerDetails;

  useLayoutEffect(() => {
    const nameEl = playerNameRef.current;
    const containerEl = playerNameContainerRef.current;

    if (nameEl && containerEl) {
      nameEl.style.transform = '';
      nameEl.style.transformOrigin = '';

      const containerWidth = containerEl.clientWidth;
      const scrollWidth = nameEl.scrollWidth;

      if (scrollWidth > containerWidth) {
        const scale = containerWidth / scrollWidth;
        const clampedScale = Math.max(0.7, scale);
        
        setNameStyle({
          transform: `scaleX(${clampedScale})`,
          transformOrigin: 'left',
        });
      } else {
        setNameStyle({});
      }
    }
  }, [name]);
  
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

  const getObjectiveProgress = (objective: CardData): { text: string; title: string; isComplete?: boolean; } | null => {
    if (!objective || objective.subType !== 'objective') {
      return null;
    }
  
    switch (objective.id) {
      case 'objective_well_prepared': {
        const current = playerDetails.provisionsCollectedThisRun || 0;
        const target = 5;
        return {
          text: `${current}/${target}`,
          title: `Provisions Collected: ${current} / ${target}`,
          isComplete: current >= target,
        };
      }
      case 'objective_master_trapper': {
        const current = playerDetails.runStats.animals_killed_by_trap || 0;
        const target = 3;
        return {
          text: `${current}/${target}`,
          title: `Animals Trapped: ${current} / ${target}`,
          isComplete: current >= target,
        };
      }
      case 'objective_the_expediter': {
        const current = playerDetails.hand.filter(c => c?.type === 'Provision').length;
        const target = 5;
        return {
          text: `${current}/${target}`,
          title: `Provisions in Hand: ${current} / ${target}`,
          isComplete: current >= target,
        };
      }
      case 'objective_swift_justice': {
        const daysLeft = 30 - turn;
        return {
          text: `${daysLeft}`,
          title: `Days Remaining: ${daysLeft}`,
          isComplete: gameState.isBossFightActive && turn <= 30,
        };
      }
      case 'objective_a_beasts_end': {
        const current = playerDetails.runStats.apexPredatorsSlain || 0;
        const target = 1;
        return {
          text: `${current}/${target}`,
          title: `Apex Predators Slain: ${current} / ${target}`,
          isComplete: current >= target,
        };
      }
      case 'objective_the_hoarder': {
        const current = playerDetails.gold;
        const target = 250;
        const percentage = Math.min(100, Math.floor((current / target) * 100));
        return {
          text: `${percentage}%`,
          title: `Gold Progress: ${current} / ${target}`,
          isComplete: current >= target,
        };
      }
      default:
        return null;
    }
  };

  const healthBreakdownHtml = getHealthBreakdown();

  const handleCycleSatchelForward = useCallback(() => {
    setSatchelAnimation('out-left');
    setTimeout(() => {
        const currentSatchelContents = playerDetails.satchels[lastViewedSatchelIndex] || [];
        const newIndex = (viewedSatchelItemIndex + 1) % currentSatchelContents.length;
        setViewedSatchelItemIndex(newIndex);
        setSatchelAnimation('in-right');
        setTimeout(() => setSatchelAnimation(null), 400);
    }, 400);
  }, [viewedSatchelItemIndex, playerDetails.satchels, lastViewedSatchelIndex]);

  const handleCycleSatchelBackward = useCallback(() => {
    setSatchelAnimation('out-right');
    setTimeout(() => {
        const currentSatchelContents = playerDetails.satchels[lastViewedSatchelIndex] || [];
        const newIndex = (viewedSatchelItemIndex - 1 + currentSatchelContents.length) % currentSatchelContents.length;
        setViewedSatchelItemIndex(newIndex);
        setSatchelAnimation('in-left');
        setTimeout(() => setSatchelAnimation(null), 400);
    }, 400);
  }, [viewedSatchelItemIndex, playerDetails.satchels, lastViewedSatchelIndex]);

  const hasSatchelWithSpace = playerDetails.equippedItems.some((item, idx) => {
    if (item.effect?.subtype === 'storage' && item.effect.capacity) {
      const contents = playerDetails.satchels[idx] || [];
      return contents.length < item.effect.capacity;
    }
    return false;
  });

  const playerPanel = (
    <div
      id="player1Area"
      className={`
        player-area
        overflow-x-hidden
        text-[var(--ink-main)]
        p-3 sm:p-4 md:p-5
        rounded-sm
        relative transition-all duration-300 ease-in-out
        ${playerAreaBorderClass}
        ${playerShakeClass || (gameState.playerShake ? 'player-area-shake-effect' : '')}
      `}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`absolute inset-0 rounded-sm pointer-events-none transition-opacity duration-300 ${overlayClass}`}></div>
      {characterIllustrationUrl && (
          <div className="absolute inset-x-0 top-4 flex justify-center items-end z-0 pointer-events-none opacity-20">
              <img
                  src={characterIllustrationUrl}
                  alt={playerDetails.character?.name || 'Character'}
                  className="h-[14rem] md:h-[16rem] lg:h-[18rem] xl:h-[20rem] 2xl:h-[22rem] w-auto object-contain"
              />
          </div>
      )}
      <div className="relative z-10">
          <div className="relative">
              <div className="relative z-10 flex flex-col">
                  <div ref={playerNameContainerRef} className="relative w-full overflow-hidden">
                      <h3 
                        ref={playerNameRef}
                        id="player1Name" 
                        className={`${playerNameFontClass} text-stone-800 text-5xl leading-tight whitespace-nowrap`}
                        style={nameStyle}
                      >
                        {playerDetails.name}
                      </h3>
                      {gameState.ngPlusLevel > 0 && (
                          <div 
                              className="absolute top-2 right-0 font-western text-yellow-600 text-2xl" 
                              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                              NG+{gameState.ngPlusLevel}
                          </div>
                      )}
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                      <p className="font-semibold text-lg">{playerDetails.character?.name}</p>
                      <div className="text-right">
                          <h4 className="font-semibold text-right text-lg">Deck Info</h4>
                      </div>
                  </div>
                  <div className="flex justify-between items-start">
                      <div className="w-3/5 mb-0">
                          <div className="tooltip-container">
                              <p>Health: <span id="player1Health" className="font-bold text-lg" style={{ color: 'var(--blood-red)' }}><span className={healthAnimClass}>{playerDetails.health}</span> / {playerDetails.maxHealth}</span></p>
                              {healthBreakdownHtml && (
                                  <div className="tooltip" dangerouslySetInnerHTML={{ __html: healthBreakdownHtml }} />
                              )}
                          </div>
                          <p>Gold: <span id="player1Gold" className={`font-bold text-yellow-500 text-lg ${gameState.goldFlashPlayer ? 'gold-gained' : ''}`}>{playerDetails.gold}</span></p>
                          
                          <div className="relative w-fit" ref={statusTooltipTriggerRef}>
                            <div className="flex items-center gap-2" aria-hidden="true">
                                <p className="select-none">Status: <span id="playerStatus" className={`${playerStatusStyle} select-none`} style={{ color: playerStatusColor }}>{playerStatusText}</span></p>
                                <div className="flex gap-1 items-center">
                                    {isIll && <span className="status-icon illness select-none">&#9763;</span>}
                                    {isCriticalHealth && <span className="status-icon select-none">&#9888;</span>}
                                    {!isCriticalHealth && isLowHealth && <span className="status-icon select-none">&#9888;</span>}
                                </div>
                            </div>
                            
                            <button
                                onClick={toggleStatusTooltip}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                aria-label={`Current status: ${playerStatusText}. Click to see details.`}
                                aria-expanded={isStatusTooltipVisible}
                            />
                            
                            {isStatusTooltipVisible && statusTooltipHtml && (
                                <div
                                    id="status-tooltip-content"
                                    role="tooltip"
                                    ref={statusTooltipRef}
                                    className="tooltip visible"
                                    style={statusTooltipStyle}
                                    dangerouslySetInnerHTML={{ __html: statusTooltipHtml }}
                                />
                            )}
                          </div>

                      </div>
                      <div className="w-2/5 text-right">
                          <p className="text-right">Total Cards: <span id="playerDeckTotalCount" className="font-bold text-blue-600 text-lg">{totalPlayerCards}</span></p>
                          <p className="text-right">Deck: <span id="playerDeckCount" className="font-bold text-blue-600 text-lg">{playerDetails.playerDeck?.length || 0}</span></p>
                          <p className="text-right">Discard: <span id="playerDiscardCount" className="font-bold text-blue-400 text-lg">{playerDetails.playerDiscard?.length || 0}</span></p>
                      </div>
                  </div>
              </div>
          </div>
          <div className="flex justify-between items-end mt-3">
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
                  if (satchelAnimation === 'out-left') {
                      satchelAnimClass = 'slide-out-left';
                  } else if (satchelAnimation === 'in-right') {
                      satchelAnimClass = 'slide-in-right';
                  } else if (satchelAnimation === 'out-right') {
                      satchelAnimClass = 'slide-out-right';
                  } else if (satchelAnimation === 'in-left') {
                      satchelAnimClass = 'slide-in-left';
                  }
                  
                  const satchelContents = playerDetails.satchels[i] || [];

                  return (
                      <div key={`equipped-wrapper-${i}`} className="relative">
                        <CardComponent
                          key={`equipped-${equippedCard?.id || 'empty'}-${i}`}
                          card={equippedCard}
                          context={CardContext.EQUIPPED}
                          onClick={() => equippedCard && handleCardClick(equippedCard, CardContext.EQUIPPED, i)}
                          isSelected={
                              selectedCardDetails != null &&
                              !isViewingThisSatchel &&
                              selectedCardDetails.card?.id === equippedCard?.id &&
                              selectedCardDetails.index === i &&
                              selectedCardDetails.source === CardContext.EQUIPPED
                          }
                          indexInSource={i}
                          playerDetails={{...playerDetails, activeEventForAttack: activeEvent}}
                          onAction={onCardAction}
                          isPlayable={isEquippedPlayable}
                          blockTradeDueToHostileEvent={gameState.blockTradeDueToHostileEvent}
                          isDisabled={playerDetails.turnEnded || !equippedCard}
                          className={gameState.equipAnimationIndex === i ? 'event-card-drop' : ''}
                          onViewSatchel={isSatchel && satchelContents.length > 0 ? () => {
                              if (isViewingThisSatchel) {
                                  setSelectedCard(null);
                              } else {
                                  setSelectedCard({ card: equippedCard, source: CardContext.SATCHEL_VIEW, index: i });
                                  setLastViewedSatchelIndex(i);
                              }
                          } : undefined}
                          lastViewedSatchelIndex={lastViewedSatchelIndex}
                        />
                        {isViewingThisSatchel && satchelContents.length > 0 && (
                          <div className="absolute top-0 left-0 z-20" style={{ transform: 'translate(15%, -15%) scale(1.05)' }}>
                            <div className={satchelAnimClass}>
                              <CardComponent
                                card={satchelContents[viewedSatchelItemIndex]}
                                context={CardContext.SATCHEL_VIEW}
                                indexInSource={viewedSatchelItemIndex}
                                isSelected={true}
                                playerDetails={playerDetails}
                                onAction={(actionType, payload) => {
                                  if (actionType === 'USE_ITEM') {
                                    onCardAction('USE_FROM_SATCHEL', { itemFromSatchel: payload.card, itemIndexInSatchel: payload.index, satchelEquipmentIndex: payload.satchelIndex });
                                  } else if (actionType === 'SELL_FROM_SATCHEL') {
                                    onCardAction('SELL_FROM_SATCHEL', { 
                                        cardToSell: payload.card, 
                                        satchelEquipmentIndex: payload.satchelIndex,
                                        itemIndexInSatchel: payload.index
                                    });
                                  }
                                  setSelectedCard(null);
                                }}
                                onCycleSatchelForward={handleCycleSatchelForward}
                                onCycleSatchelBackward={handleCycleSatchelBackward}
                                isSellable={!gameState.blockTradeDueToHostileEvent && !playerDetails.turnEnded}
                                blockTradeDueToHostileEvent={gameState.blockTradeDueToHostileEvent}
                                lastViewedSatchelIndex={lastViewedSatchelIndex}
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
                      const isThreatActive = activeEvent && activeEvent.type === 'Event' && (activeEvent.subType === 'animal' || activeEvent.subType === 'human');
                      isHandPlayable = !isThreatActive;
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
                          isStorable={!!cardInSlot && hasSatchelWithSpace && !playerDetails.turnEnded && cardInSlot.type === 'Provision'}
                          isSellable={!!cardInSlot && typeof cardInSlot.sellValue === 'number' && cardInSlot.sellValue > 0 && !playerDetails.turnEnded}
                          blockTradeDueToHostileEvent={gameState.blockTradeDueToHostileEvent}
                          isDisabled={playerDetails.turnEnded || !cardInSlot}
                          className={animatingIndices.has(i) ? 'card-enter-animation' : ''}
                          style={{ animationDelay: animatingIndices.has(i) ? `${i * 80}ms` : undefined }}
                      />
                  );
              })}
          </div>
          {cardForPlayerDescription && sourceForPlayerDescription && (
              <div
                id="cardDescriptionPlayerArea"
                className="my-2 p-3 bg-[rgba(244,241,234,0.8)] rounded shadow-inner min-h-[6rem] text-sm"
                aria-live="polite"
                dangerouslySetInnerHTML={{ __html: getCardDescriptionHtml(cardForPlayerDescription, sourceForPlayerDescription, playerDetails) }}
              />
          )}
      </div>
    </div>
  );

  const frontierPanel = (
    <div className={`frontier-area overflow-x-hidden flex flex-col text-[var(--ink-main)] p-3 sm:p-4 md:p-5 rounded-sm ${frontierPanelShakeClass}`}>
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
              className={gameState.triggerStoreRestockAnimation ? 'card-enter-animation' : ''}
              style={{ animationDelay: gameState.triggerStoreRestockAnimation ? `${i * 100}ms` : undefined }}
            />
          ))}
        </div>
      </div>

      <hr className="my-2 border-gray-400" />
      
      {(() => {
        let cardForDescription: CardData | null = null;
        let sourceForDescription: CardContext | null = null;
    
        if (selectedCardDetails && (selectedCardDetails.source === CardContext.EVENT || selectedCardDetails.source === CardContext.STORE || selectedCardDetails.source === CardContext.DECK_REVIEW)) {
            cardForDescription = selectedCardDetails.card;
            sourceForDescription = selectedCardDetails.source as CardContext;
        }
    
        if (!cardForDescription) {
            cardForDescription = activeEvent;
            sourceForDescription = CardContext.EVENT;
        }

        const descriptionHtml = cardForDescription && sourceForDescription
            ? getCardDescriptionHtml(cardForDescription, sourceForDescription, playerDetails)
            : turn === 1 && objectiveChoices && objectiveChoices.length > 0
            ? `<p class="text-stone-600 italic text-center p-4">Select an objective to see its details. You can choose up to two.</p>`
            : `<p class="text-stone-600 italic text-center p-4">The trail is quiet... for now.</p>`;

        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col w-full">
                <div className="flex flex-col items-start mb-2">
                    <h3 className="text-xl font-western text-[var(--ink-main)]">The Frontier</h3>
                    <div className="text-xs text-[var(--ink-main)] mt-0.5">Event Deck: <span className="font-bold" style={{ color: 'var(--blood-red)' }}>{gameState.eventDeck?.length || 0}</span></div>
                </div>

                {turn === 1 && objectiveChoices && objectiveChoices.length > 0 && (
                    <h4 className="font-western text-lg text-center mb-1 text-[var(--ink-secondary)]">Choose up to 2 Objectives</h4>
                )}
                <div id="frontierEventsArea" className="flex flex-row flex-wrap justify-center w-full gap-1.5 sm:gap-2 md:gap-2 lg:gap-1.5 xl:gap-2">
                    {!(turn === 1 && objectiveChoices && objectiveChoices.length > 0) && (
                        <div id="activeEventCardDisplay" className="event-display-card">
                            {(() => {
                                const cardForDisplay = activeEvent || playerDetails.activeTrap;
                                const isDisplayingTrap = !activeEvent && !!playerDetails.activeTrap;

                                if (cardForDisplay) {
                                    return (
                                        <CardComponent
                                            key={`frontier-${cardForDisplay.id}-${isDisplayingTrap ? 'trap' : gameState.turn}`}
                                            card={cardForDisplay}
                                            context={CardContext.EVENT}
                                            onClick={isDisplayingTrap ? undefined : handleActiveEventClick}
                                            isSelected={!isDisplayingTrap && selectedCardDetails?.source !== CardContext.SATCHEL_VIEW && selectedCardDetails?.card?.id === activeEvent?.id && selectedCardDetails?.source === CardContext.EVENT}
                                            indexInSource={0}
                                            playerDetails={playerDetails}
                                            onAction={onCardAction}
                                            isDisabled={isDisplayingTrap || playerDetails.turnEnded}
                                            className={`${isDisplayingTrap ? trapAnimationClass : `${threatAnimationClass} ${eventAnimationClass}`}`}
                                            statAnimationClass={isDisplayingTrap ? '' : threatStatAnimClass}
                                            isPrimaryEvent={true}
                                        />
                                    );
                                } else {
                                    return (
                                        <div className={`card flex items-center justify-center border-2 border-[var(--ink-main)] bg-[var(--card-bg)] text-[var(--ink-main)] rounded m-1 text-center shadow-md w-[7rem] h-[9.8rem] text-[0.65rem] p-1.5 sm:w-[7rem] sm:h-[9.8rem] sm:text-[0.65rem] sm:p-1.5 md:w-[8.5rem] md:h-[11.9rem] md:text-[0.7rem] md:p-2 lg:w-[10.5rem] lg:h-[14.7rem] lg:text-[0.8rem] lg:p-2.5 xl:w-[11.5rem] xl:h-[16.1rem] xl:text-[0.8rem] xl:p-2.5 2xl:w-[12.5rem] 2xl:h-[17.5rem] 2xl:text-sm 2xl:p-3`}>
                                            <div className="font-['Special_Elite']">All Clear</div>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    )}
                    
                    {turn === 1 && objectiveChoices && objectiveChoices.length > 0 && (
                        objectiveChoices.map((objective, index) => (
                            <CardComponent
                                key={`objective-choice-${objective.id}-${index}`}
                                card={objective}
                                context={CardContext.DECK_REVIEW}
                                onClick={() => {
                                onCardAction('SELECT_OBJECTIVE', { index });
                                handleCardClick(objective, CardContext.DECK_REVIEW, index);
                                }}
                                isSelected={selectedObjectiveIndices.includes(index)}
                                indexInSource={index}
                                playerDetails={playerDetails}
                                isDisabled={
                                    playerDetails.turnEnded ||
                                    (selectedObjectiveIndices.length >= 2 && !selectedObjectiveIndices.includes(index))
                                }
                                isPrimaryEvent={true}
                                objectiveProgress={getObjectiveProgress(objective)}
                            />
                        ))
                    )}
                    
                    {turn > 1 && activeObjectives && activeObjectives.length > 0 && (
                        activeObjectives.map((objective, index) => (
                            <div key={`active-objective-${objective.id}-${index}`} className="objective-display-card">
                                <CardComponent
                                    card={objective}
                                    context={CardContext.EVENT}
                                    onClick={() => handleCardClick(objective, CardContext.EVENT, index + 1)}
                                    isSelected={
                                        selectedCardDetails?.card?.id === objective.id &&
                                        selectedCardDetails?.source === CardContext.EVENT &&
                                        selectedCardDetails?.index === index + 1
                                    }
                                    indexInSource={index + 1}
                                    playerDetails={playerDetails}
                                    onAction={onCardAction}
                                    isDisabled={playerDetails.turnEnded}
                                    isPrimaryEvent={true}
                                    objectiveProgress={getObjectiveProgress(objective)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div
              id="eventDescription"
              className="w-full mt-2 p-3 bg-[rgba(244,241,234,0.8)] rounded shadow-inner text-sm min-h-[6rem]"
              aria-live="polite"
              dangerouslySetInnerHTML={{__html: descriptionHtml}}
            />
          </div>
        );
      })()}
      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-2 mt-3 sm:mt-2">
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
        <div className="flex gap-2 w-full mt-2">
            <button
                id="restartButton"
                className="button button-danger w-full"
                onClick={onRestartGame}
            >
                Restart Game
            </button>
        </div>
      </div>
    </div>
  );

  let playerPanelClasses = '';
  let frontierPanelClasses = '';
  const isAnimating = !!animation;
  
  if (isAnimating) {
    const destinationPanel = activePanelRef.current === 'player' ? 'frontier' : 'player';
    const direction = animation.direction;

    if (destinationPanel === 'frontier') {
      playerPanelClasses = 'invisible';
      frontierPanelClasses = direction === 'left' ? 'slide-in-from-right' : 'slide-in-from-left';
    } else {
      frontierPanelClasses = 'invisible';
      playerPanelClasses = direction === 'left' ? 'slide-in-from-right' : 'slide-in-from-left';
    }
  }

  return (
    <div id="gameArea">
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        {playerPanel}
        <div id="frontierArea">{frontierPanel}</div>
      </div>

      <div
        className="lg:hidden overflow-x-hidden"
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
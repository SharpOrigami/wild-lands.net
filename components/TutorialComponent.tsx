import React, { useState, useLayoutEffect, CSSProperties, useRef, useEffect } from 'react';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';
import { CardData } from '../types';

interface TutorialComponentProps {
  step: number;
  onNext: () => void;
  onEnd: () => void;
  selectedCard: { card: CardData; source: string; index: number } | null;
}

interface TutorialStep {
  targetId?: string | string[];
  title: string;
  text: string;
  mobileText?: string;
  isInteractive: boolean;
  subHighlights?: {
    targetId: string;
    delay: number;
    sound?: string;
    duration?: number;
    glowClass?: 'red' | 'green' | 'gold';
  }[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome, Pioneer!",
    text: "Welcome to Wild Lands! This short guide will show you the ropes on how to survive the frontier.",
    isInteractive: false,
  },
  {
    targetId: 'player1Area',
    title: "Your Character",
    text: "This is you. Keep an eye on your Health and Gold. Your status will show if you're ill or in danger.",
    isInteractive: true,
    subHighlights: [
      { targetId: '#player1Health', delay: 500, sound: 'ui_button_click', duration: 1000 },
      { targetId: '#player1Gold', delay: 1500, sound: 'gold', duration: 1500 },
      { targetId: '#playerStatusContainer', delay: 3500, sound: 'ui_button_click', duration: 2000 },
    ],
  },
  {
    targetId: 'player1EquippedDisplay',
    title: "Equipped Items",
    text: "These are your equipped items. Weapons are stronger here, and upgrades provide powerful bonuses. You can equip one item per day.",
    isInteractive: true,
  },
  {
    targetId: 'player1HandDisplay',
    title: "Your Hand",
    text: "This is your hand. You'll draw new cards each day. Click a card to see its details and available actions, like playing, equipping, or selling.",
    isInteractive: true,
  },
  {
    targetId: ['frontierAreaMobile', 'frontierArea'],
    title: "The Frontier",
    text: "This is the Frontier. Here you'll face events and visit the General Store.",
    mobileText: "This is the Frontier. Here you'll face events and visit the General Store. On mobile, you can swipe left and right to switch between this panel and your player panel.",
    isInteractive: true,
  },
  {
    targetId: 'frontierEventsArea',
    title: "Choose Your Objectives",
    text: "Welcome to Day 1! Start your journey by choosing up to two Objectives from this area. Completing them before you defeat the final boss will earn you powerful rewards for your next run.",
    isInteractive: true,
    subHighlights: [
      { targetId: '#frontierEventsArea .card-face:nth-child(1)', delay: 1500, sound: 'card_click', duration: 1000 },
      { targetId: '#frontierEventsArea .card-face:nth-child(2)', delay: 3500, sound: 'card_click', duration: 1000 },
      { targetId: '#frontierEventsArea .card-face:nth-child(3)', delay: 5500, sound: 'card_click', duration: 1000 },
    ]
  },
  {
    targetId: 'frontierEventsArea',
    title: "Daily Events",
    text: "On every day after the first, a new Event will appear here. It could be a dangerous threat, a valuable item, or a debilitating illness. Be prepared for anything!",
    isInteractive: true,
    subHighlights: [
        { targetId: '#frontierEventsArea .card-face:first-of-type', delay: 2000, sound: 'threat_reveal', duration: 1500, glowClass: 'red' },
        { targetId: '#frontierEventsArea .card-face:first-of-type', delay: 4500, sound: 'gold', duration: 1500, glowClass: 'gold' },
        { targetId: '#frontierEventsArea .card-face:first-of-type', delay: 7000, sound: 'ui_button_click', duration: 1500, glowClass: 'green' },
    ]
  },
  {
    targetId: 'storeDisplay',
    title: "The General Store",
    text: "The Store offers items for purchase. You can also pay Gold to 'Restock' it once per day. Trading is blocked when a dangerous threat is active.",
    isInteractive: true,
     subHighlights: [
      { targetId: '#restockButton', delay: 3000, sound: 'ui_button_click', duration: 2500 }
    ]
  },
  {
    targetId: 'playerActions',
    title: "Town Crier & Actions",
    text: "The Town Crier keeps a log of what's happening. Below it, you'll find important actions like restarting the game.",
    isInteractive: true,
     subHighlights: [
      { targetId: '.log-area', delay: 500, sound: 'ui_button_click', duration: 2000 },
      { targetId: '#restartButton', delay: 4500, sound: 'ui_button_click', duration: 2000 },
    ]
  },
  {
    targetId: 'endTurnButton',
    title: "End Your Day",
    text: "When you're done with your turn, click here to End the Day. This will trigger night events, start the next day, and draw you a new hand.",
    isInteractive: true,
  },
  {
    title: "Good Luck!",
    text: "That's the basics. The Wilds are treacherous, and every run is different. May your aim be true, partner!",
    isInteractive: false,
  },
];

const TutorialComponent: React.FC<TutorialComponentProps> = ({ step, onNext, onEnd, selectedCard }) => {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [textStyle, setTextStyle] = useState<CSSProperties>({});
  const textRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isNarrating, setIsNarrating] = useState(ttsManager.isNarrating());

  const [subHighlightTarget, setSubHighlightTarget] = useState<{ targetId: string; sound?: string; glowClass?: 'red' | 'green' | 'gold'; } | null>(null);
  const [subHighlightStyle, setSubHighlightStyle] = useState<CSSProperties | null>(null);
  const subHighlightTimeouts = useRef<number[]>([]);
  
  const currentStep = TUTORIAL_STEPS[step];

  useEffect(() => {
    const handleNarrationChange = () => setIsNarrating(ttsManager.isNarrating());
    ttsManager.addListener(handleNarrationChange);
    return () => ttsManager.removeListener(handleNarrationChange);
  }, []);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (currentStep && isNarrating) {
      const textToSpeak = isMobile && currentStep.mobileText ? currentStep.mobileText : currentStep.text;
      ttsManager.speak(textToSpeak);
    } else {
      ttsManager.cancel();
    }
    
    return () => {
      ttsManager.cancel();
    };
  }, [step, currentStep, isMobile, isNarrating]);

  useEffect(() => {
    subHighlightTimeouts.current.forEach(clearTimeout);
    subHighlightTimeouts.current = [];
    setSubHighlightTarget(null);

    const mainHighlightAnimationDelay = 300;

    if (currentStep?.subHighlights) {
        currentStep.subHighlights.forEach(highlight => {
            const startTimeout = window.setTimeout(() => {
                setSubHighlightTarget({ targetId: highlight.targetId, sound: highlight.sound, glowClass: highlight.glowClass });
                
                const endTimeout = window.setTimeout(() => {
                    setSubHighlightTarget(prev => (prev?.targetId === highlight.targetId ? null : prev));
                }, highlight.duration || 2000);
                subHighlightTimeouts.current.push(endTimeout);

            }, mainHighlightAnimationDelay + highlight.delay);
            subHighlightTimeouts.current.push(startTimeout);
        });
    }

    return () => {
        subHighlightTimeouts.current.forEach(clearTimeout);
    };
  }, [step, currentStep]);

  useLayoutEffect(() => {
    if (subHighlightTarget) {
        const targetElements = document.querySelectorAll(subHighlightTarget.targetId);
        let visibleElement: HTMLElement | null = null;

        for (let i = 0; i < targetElements.length; i++) {
            const el = targetElements[i] as HTMLElement;
            if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                visibleElement = el;
                break;
            }
        }
        
        if (visibleElement) {
            if (subHighlightTarget.sound) {
                soundManager.playSound(subHighlightTarget.sound as any);
            }
            const rect = visibleElement.getBoundingClientRect();
            setSubHighlightStyle({
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
            });
        } else {
            setSubHighlightStyle(null);
        }
    } else {
        setSubHighlightStyle(null);
    }
  }, [subHighlightTarget]);


  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!currentStep) {
        onEnd();
        return;
      }

      let targetElement: HTMLElement | null = null;
      if (currentStep.targetId) {
        const targetIds = Array.isArray(currentStep.targetId) ? currentStep.targetId : [currentStep.targetId];
        const query = targetIds.map(id => id.startsWith('#') || id.startsWith('.') ? id : `#${id}`).join(', ');
        const targetElements = document.querySelectorAll(query);

        for (let i = 0; i < targetElements.length; i++) {
          const el = targetElements[i] as HTMLElement;
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            targetElement = el;
            break;
          }
        }
      }

      if (targetElement) {
        let rect = targetElement.getBoundingClientRect();

        if (currentStep.isInteractive && selectedCard) {
          let descAreaId: string | null = null;
          const targetIdString = Array.isArray(currentStep.targetId) ? currentStep.targetId[0] : currentStep.targetId || '';

          const playerPanelTargets = ['player1Area', 'player1EquippedDisplay', 'player1HandDisplay'];
          const frontierPanelTargets = ['frontierArea', 'frontierEventsArea', 'storeDisplay'];
          
          const isPlayerPanelTarget = playerPanelTargets.some(id => targetIdString.includes(id));
          const isFrontierPanelTarget = frontierPanelTargets.some(id => targetIdString.includes(id));

          if (isPlayerPanelTarget && (selectedCard.source === 'hand' || selectedCard.source === 'equipped' || selectedCard.source === 'satchel_view')) {
            descAreaId = '#cardDescriptionPlayerArea';
          } else if (isFrontierPanelTarget && (selectedCard.source === 'store' || selectedCard.source === 'event' || selectedCard.source === 'deck_review')) {
            descAreaId = '#eventDescription';
          }

          if (descAreaId) {
            const descEl = document.querySelector(descAreaId) as HTMLElement;
            if (descEl && descEl.offsetHeight > 0) {
              const descRect = descEl.getBoundingClientRect();
              
              const combinedTop = Math.min(rect.top, descRect.top);
              const combinedLeft = Math.min(rect.left, descRect.left);
              const combinedRight = Math.max(rect.right, descRect.right);
              const combinedBottom = Math.max(rect.bottom, descRect.bottom);
              
              const combinedRect = new DOMRect(
                  combinedLeft,
                  combinedTop,
                  combinedRight - combinedLeft,
                  combinedBottom - combinedTop
              );
              rect = combinedRect;
            }
          }
        }
        
        setHighlightRect(rect);

        const textEl = textRef.current;
        if (!textEl) return;

        const textRect = textEl.getBoundingClientRect();
        const offset = 12;
        const viewportPadding = 10;
        
        const parentPanel = targetElement.closest('.player-area, .frontier-area');
        const boundary = parentPanel 
            ? parentPanel.getBoundingClientRect() 
            : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };

        let idealTop = rect.top - textRect.height - offset;
        let idealLeft = rect.left + (rect.width / 2) - (textRect.width / 2);

        // Horizontal clamping within the parent panel's boundary
        idealLeft = Math.max(boundary.left + viewportPadding, idealLeft);
        idealLeft = Math.min(boundary.right - textRect.width - viewportPadding, idealLeft);

        // Vertical positioning: try above first, then below, then clamp
        const fitsAbove = (idealTop >= boundary.top + viewportPadding);
        const fitsBelow = (rect.bottom + offset + textRect.height <= boundary.bottom - viewportPadding);

        if (fitsAbove) {
            // Position is good, do nothing
        } else if (fitsBelow) {
            idealTop = rect.bottom + offset;
        } else {
            // Doesn't fit cleanly above or below.
            // Place it above the target but clamp it to the top of the boundary.
            idealTop = Math.max(boundary.top + viewportPadding, idealTop);
        }

        setTextStyle({
          position: 'fixed',
          zIndex: 10001,
          top: `${idealTop}px`,
          left: `${idealLeft}px`,
          transform: 'none',
        });

      } else {
        setHighlightRect(null);
        setTextStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
        });
      }
    };
    
    let targetElement: HTMLElement | null = null;
    if (currentStep?.targetId) {
        const targetIds = Array.isArray(currentStep.targetId) ? currentStep.targetId : [currentStep.targetId];
        const query = targetIds.map(id => id.startsWith('#') || id.startsWith('.') ? id : `#${id}`).join(', ');
        const targetElements = document.querySelectorAll(query);
        for (let i = 0; i < targetElements.length; i++) {
          const el = targetElements[i] as HTMLElement;
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            targetElement = el;
            break;
          }
        }
    }
    
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const delay = targetElement ? 300 : 0;
    const positionTimer = setTimeout(updatePosition, delay);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(positionTimer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    }
  }, [step, currentStep, onEnd, selectedCard]);

  if (!currentStep) return null;

  const isLastStep = step === TUTORIAL_STEPS.length - 1;
  const tutorialText = (isMobile && currentStep.mobileText) ? currentStep.mobileText : currentStep.text;

  const handleEnd = () => {
    soundManager.playSound('ui_button_click');
    onEnd();
  };

  const handleNext = () => {
    soundManager.playSound('ui_button_click');
    onNext();
  };
  
  const handleNextOrEnd = isLastStep ? handleEnd : handleNext;

  let subHighlightClassName = 'tutorial-pulse-glow';
  if (subHighlightTarget?.glowClass === 'red') {
      subHighlightClassName = 'tutorial-pulse-glow-red';
  } else if (subHighlightTarget?.glowClass === 'green') {
      subHighlightClassName = 'tutorial-pulse-glow-green';
  }
  
  const highlightBorderStyle = highlightRect ? {
    position: 'fixed' as const,
    top: `${highlightRect.top - 4}px`,
    left: `${highlightRect.left - 4}px`,
    width: `${highlightRect.width + 8}px`,
    height: `${highlightRect.height + 8}px`,
    pointerEvents: 'none' as const,
    zIndex: 10002,
    transition: 'all 0.3s ease-in-out',
  } : {};

  return (
    <div aria-live="polite" aria-atomic="true">
      {currentStep.isInteractive && highlightRect ? (
        <>
          {/* These 4 divs create the blocking overlay with a "hole" */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: `${highlightRect.top}px`, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000, pointerEvents: 'auto' }} />
          <div style={{ position: 'fixed', top: `${highlightRect.bottom}px`, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000, pointerEvents: 'auto' }} />
          <div style={{ position: 'fixed', top: `${highlightRect.top}px`, left: 0, height: `${highlightRect.height}px`, width: `${highlightRect.left}px`, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000, pointerEvents: 'auto' }} />
          <div style={{ position: 'fixed', top: `${highlightRect.top}px`, right: 0, height: `${highlightRect.height}px`, width: `calc(100vw - ${highlightRect.right}px)`, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000, pointerEvents: 'auto' }} />
          <div className="tutorial-pulse-glow" style={highlightBorderStyle} />
        </>
      ) : (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70"
          style={{ pointerEvents: 'auto' }}
          onClick={handleNextOrEnd}
        >
          {highlightRect && <div className="tutorial-pulse-glow" style={highlightBorderStyle} />}
        </div>
      )}
      
      {subHighlightStyle && <div className={subHighlightClassName} style={subHighlightStyle} />}
      
      <div 
        ref={textRef}
        style={{...textStyle, pointerEvents: 'auto'}} 
        className="bg-[var(--paper-bg)] p-4 rounded-lg shadow-lg w-72 max-w-[90vw] text-[var(--ink-main)] border border-[var(--ink-main)]"
        role="dialog"
        aria-labelledby="tutorial-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="tutorial-title" className="font-western text-xl mb-2">{currentStep.title}</h4>
        <p className="text-sm mb-4 font-['Merriweather']">{tutorialText}</p>
        <div className="flex justify-between items-center">
          <button onClick={handleEnd} className="button !text-xs !py-1 !px-2 !bg-gray-400 hover:!bg-gray-500">
            Skip Tutorial
          </button>
          <button onClick={handleNextOrEnd} className="button !text-xs !py-1 !px-2">
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialComponent;
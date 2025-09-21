import React, { useState, useLayoutEffect, CSSProperties, useRef, useEffect } from 'react';
import { soundManager } from '../utils/soundManager';

interface TutorialComponentProps {
  step: number;
  onNext: () => void;
  onEnd: () => void;
}

interface TutorialStep {
  targetId?: string | string[];
  title: string;
  text: string;
  mobileText?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome, Pioneer!",
    text: "Welcome to Wild Lands! This short guide will show you the ropes on how to survive the frontier.",
  },
  {
    targetId: 'player1Area',
    title: "Your Character",
    text: "This is you. Keep an eye on your Health and Gold. Your status will show if you're ill or in danger.",
  },
  {
    targetId: 'player1EquippedDisplay',
    title: "Equipped Items",
    text: "These are your equipped items. Weapons are stronger here, and upgrades provide powerful bonuses. You can equip one item per day.",
  },
  {
    targetId: 'player1HandDisplay',
    title: "Your Hand",
    text: "This is your hand. You'll draw new cards each day. Click a card to see its details and available actions, like playing, equipping, or selling.",
  },
  {
    targetId: ['frontierAreaMobile', 'frontierArea'],
    title: "The Frontier",
    text: "This is the Frontier. Here you'll face events and visit the General Store.",
    mobileText: "This is the Frontier. Here you'll face events and visit the General Store. On mobile, you can swipe left and right to switch between this panel and your player panel.",
  },
  {
    targetId: 'activeEventCardDisplay',
    title: "Active Event",
    text: "An Event is drawn each day. It could be a threat, an illness, or a lucky find. Deal with threats by playing weapon cards from your hand.",
  },
  {
    targetId: 'storeDisplay',
    title: "The General Store",
    text: "The Store offers items for purchase. You can also pay Gold to 'Restock' it once per day. Trading is blocked when a dangerous threat is active.",
  },
  {
    targetId: 'playerActions',
    title: "Town Crier & Actions",
    text: "The Town Crier keeps a log of what's happening. Below it, you'll find important actions like restarting the game.",
  },
  {
    targetId: 'endTurnButton',
    title: "End Your Day",
    text: "When you're done with your turn, click here to End the Day. This will trigger night events, start the next day, and draw you a new hand.",
  },
  {
    title: "Good Luck!",
    text: "That's the basics. The Wilds are treacherous, and every run is different. May your aim be true, partner!",
  },
];

const TutorialComponent: React.FC<TutorialComponentProps> = ({ step, onNext, onEnd }) => {
  const [highlightStyle, setHighlightStyle] = useState<CSSProperties>({});
  const [textStyle, setTextStyle] = useState<CSSProperties>({});
  const textRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const currentStep = TUTORIAL_STEPS[step];

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!currentStep) {
        onEnd();
        return;
      }

      let targetElement: HTMLElement | null = null;
      if (currentStep.targetId) {
        const targetIds = Array.isArray(currentStep.targetId) ? currentStep.targetId : [currentStep.targetId];
        const query = targetIds.map(id => `#${id}`).join(', ');
        const targetElements = document.querySelectorAll(query);

        // Find the first visible element from the query result
        for (let i = 0; i < targetElements.length; i++) {
          const el = targetElements[i] as HTMLElement;
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            targetElement = el;
            break;
          }
        }
      }

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightStyle({
          position: 'fixed',
          top: `${rect.top - 4}px`,
          left: `${rect.left - 4}px`,
          width: `${rect.width + 8}px`,
          height: `${rect.height + 8}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
          border: '2px solid var(--tarnished-gold)',
          borderRadius: '4px',
          pointerEvents: 'none',
          transition: 'all 0.3s ease-in-out',
          zIndex: 10000,
        });

        const textEl = textRef.current;
        if (!textEl) return;

        const textRect = textEl.getBoundingClientRect();
        const offset = 12;
        const viewportPadding = 10;
        
        let idealTop = rect.top - textRect.height - offset;
        let idealLeft = rect.left + (rect.width / 2) - (textRect.width / 2);

        // Clamp left position to stay within the viewport
        if (idealLeft < viewportPadding) {
          idealLeft = viewportPadding;
        } else if (idealLeft + textRect.width > window.innerWidth - viewportPadding) {
          idealLeft = window.innerWidth - textRect.width - viewportPadding;
        }

        // Check if there's enough space above. If not, position below.
        if (idealTop < viewportPadding) {
          idealTop = rect.bottom + offset;
        } 
        // Clamp bottom position to stay within the viewport (useful if it was positioned below)
        if (idealTop + textRect.height > window.innerHeight - viewportPadding) {
           idealTop = window.innerHeight - textRect.height - viewportPadding;
        }

        setTextStyle({
          position: 'fixed',
          zIndex: 10001,
          top: `${idealTop}px`,
          left: `${idealLeft}px`,
          transform: 'none',
        });

      } else {
        // Fallback for steps without a targetId or if target is not found/visible
        setHighlightStyle({
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          pointerEvents: 'auto',
          transition: 'background-color 0.3s ease-in-out',
          zIndex: 10000,
        });
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
        const query = targetIds.map(id => `#${id}`).join(', ');
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
    
    // Add scroll and resize listeners to keep the highlight in sync
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(positionTimer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    }
  }, [step, currentStep, onEnd]);

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

  return (
    <div className="fixed inset-0 z-[9999]" aria-live="polite" aria-atomic="true">
      <div style={highlightStyle}></div>
      <div 
        ref={textRef}
        style={textStyle} 
        className="bg-[var(--paper-bg)] p-4 rounded-md shadow-lg w-72 max-w-[90vw] text-[var(--ink-main)] border border-[var(--ink-main)]"
        role="dialog"
        aria-labelledby="tutorial-title"
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

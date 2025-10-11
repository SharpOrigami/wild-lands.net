import React, { useState, useEffect } from 'react';
import { ttsManager } from '../utils/ttsManager.ts';

interface BossIntroStoryProps {
  isLoading: boolean;
  title?: string;
  paragraph?: string;
  characterName?: string;
  onContinue: () => void;
  ngPlusLevel: number;
}

const messageSets = {
  western: {
    messages: [
      "Roustin' up some nasty varmints...",
      "Shufflin' the deck with a dusty hand...",
      "Askin' the desert spirits for a worthy foe...",
      "Carvin' your legend into a wanted poster...",
      "Brewin' up a fresh batch of trouble...",
      "Unearthing a forgotten evil from a shallow grave...",
    ],
    subText: (name: string) => `Hang tight, ${name || 'Pioneer'}...`
  },
  japan: {
    messages: [
      "Consulting the kami for a worthy challenge...",
      "Sharpening the blade for a fateful duel...",
      "Painting a nemesis onto a silk scroll...",
      "Disturbing a slumbering yōkai...",
      "Reading the tea leaves of destiny...",
      "A shadow falls upon the province...",
    ],
    subText: (name: string) => `Be patient, ${name || 'Samurai'}...`
  },
  safari: {
    messages: [
      "Tracking a legendary beast through the savanna...",
      "Listening to whispers on the wind...",
      "Following ominous tracks to a hidden lair...",
      "Polishing the scope for the big hunt...",
      "A great beast awakens...",
      "The safari's greatest prize reveals itself...",
    ],
    subText: (name: string) => `Steady your aim, ${name || 'Hunter'}...`
  },
  horror: {
    messages: [
      "Reading from a forbidden grimoire...",
      "Stirring a creature from its ancient slumber...",
      "Chanting an incantation to summon a great horror...",
      "The moon turns blood red...",
      "A nightmare takes physical form...",
      "Something wicked this way comes...",
    ],
    subText: (name: string) => `Brace yourself, ${name || 'Hunter'}...`
  },
  cyberpunk: {
    messages: [
      "Compiling rogue AI protocols...",
      "Searching the old net for a legendary ghost...",
      "Activating a decommissioned security asset...",
      "A ghost in the machine awakens...",
      "Running black ICE to find a prime target...",
      "System anomaly detected: A new threat is online...",
    ],
    subText: (name: string) => `Jack in, ${name || 'Operator'}...`
  },
};

const getTheme = (ngPlusLevel: number) => {
  if (ngPlusLevel >= 40) return messageSets.cyberpunk;
  if (ngPlusLevel >= 30) return messageSets.horror;
  if (ngPlusLevel >= 20) return messageSets.safari;
  if (ngPlusLevel >= 10) return messageSets.japan;
  return messageSets.western;
};

const BossIntroStoryComponent: React.FC<BossIntroStoryProps> = ({
  isLoading,
  title,
  paragraph,
  characterName,
  onContinue,
  ngPlusLevel,
}) => {
  const [showText, setShowText] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isNarrating, setIsNarrating] = useState(ttsManager.isNarrating());
  
  const theme = getTheme(ngPlusLevel);
  const loadingMessages = theme.messages;

  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
      }, 4400); // Change message every 4.4 seconds
      return () => clearInterval(intervalId);
    }
  }, [isLoading, loadingMessages.length]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowText(true);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setShowText(false);
    }
  }, [isLoading]);
  
  useEffect(() => {
    const handleNarrationChange = () => {
      setIsNarrating(ttsManager.isNarrating());
    };
    ttsManager.addListener(handleNarrationChange);
    return () => ttsManager.removeListener(handleNarrationChange);
  }, []);

  useEffect(() => {
    if (isLoading || !showText) {
      return;
    }

    let speakTimer: number;

    if (isNarrating) {
        const textToSpeak = `${title}. ${paragraph}`;
        speakTimer = window.setTimeout(() => {
            ttsManager.speak(textToSpeak);
        }, 50);
    } else {
        ttsManager.cancel();
    }
    
    return () => {
        if(speakTimer) clearTimeout(speakTimer);
        ttsManager.cancel();
    }
  }, [isLoading, showText, title, paragraph, isNarrating]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !isLoading) {
            onContinue();
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, onContinue]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-[1000]">
      {isLoading && (
        <div className="text-center px-4">
            <div className="font-western text-2xl text-white animate-pulse mb-4" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 5px rgba(0,0,0,0.7)' }}>
                {loadingMessages[currentMessageIndex]}
            </div>
            <div className="font-pulp-title text-xl text-stone-300 mt-2">
                {theme.subText(characterName || '')}
            </div>
        </div>
      )}
      {!isLoading && (
        <div 
          className={`transition-opacity duration-1000 ease-in-out ${showText ? 'opacity-100' : 'opacity-0'} 
                      bg-[var(--paper-bg)] p-6 sm:p-8 rounded-lg shadow-[0_10px_25px_rgba(255,255,255,0.1)] 
                      w-[90vw] max-w-2xl text-left border-2 border-[var(--ink-main)] text-[var(--ink-main)] 
                      flex flex-col gap-4 max-h-[85vh] sm:max-h-[80vh]`}
        >
          <h3 className="font-['Rye'] text-3xl text-[var(--ink-main)] text-center">
            {title || "The Trail Ahead"}
          </h3>
          <div className="overflow-y-auto modal-body pr-2 max-h-[65vh] sm:max-h-[60vh]">
            <p className="whitespace-pre-wrap font-['Merriweather'] text-base leading-normal">
              {paragraph || "Whispers of a great challenge echo through the canyons. Prepare yourself."}
            </p>
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={onContinue}
              className="button text-lg px-6 py-3"
            >
              Ride Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BossIntroStoryComponent;
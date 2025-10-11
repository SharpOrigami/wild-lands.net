

import React, { useState, useEffect } from 'react';

interface StoryLoadingProps {
  isLoading: boolean;
  ngPlusLevel: number;
}

const messageSets = {
  western: {
    messages: [
      "The crier is writin' your legend...",
      "The saloon bard is puttin' your deeds to music...",
      "The local paper is printin' the tale of your journey...",
      "A campfire storyteller weaves the yarn of your adventure...",
      "Etchin' your story onto a canyon wall for all time...",
    ],
    subText: "The AI is chronicling your adventure..."
  },
  japan: {
    messages: [
      "A poet is composing a haiku of your journey...",
      "An artist is painting your deeds on a scroll...",
      "A kabuki play is being written of your triumph...",
      "Your legend is recounted in the Emperor's court...",
      "Your tale becomes a new myth...",
    ],
    subText: "The AI is recording your saga..."
  },
  safari: {
    messages: [
      "The lead guide is recording your safari in the logbook...",
      "Your story is being told at the Explorer's Club...",
      "A telegram is sent home, detailing your exploits...",
      "Your greatest hunt becomes a new campfire tale...",
      "Your legend echoes across the savanna...",
    ],
    subText: "The AI is logging your expedition..."
  },
  horror: {
    messages: [
      "A terrified survivor is scribbling your tale in a journal...",
      "Your deeds are recorded in a secret, forbidden tome...",
      "Whispers of your survival spread through hushed villages...",
      "The mad poet writes an epic of your grim victory...",
      "Your story becomes a warning against the dark...",
    ],
    subText: "The AI is transcribing your nightmare..."
  },
  cyberpunk: {
    messages: [
      "The data-brokers are uploading your AAR...",
      "Your run is being archived on the old net...",
      "A street samurai tells your story for a cred-chip...",
      "Your legend becomes a new piece of street lore...",
      "Your exploits are encrypted into a data-shard...",
    ],
    subText: "The AI is archiving your run data..."
  },
};

const getTheme = (ngPlusLevel: number) => {
  if (ngPlusLevel >= 40) return messageSets.cyberpunk;
  if (ngPlusLevel >= 30) return messageSets.horror;
  if (ngPlusLevel >= 20) return messageSets.safari;
  if (ngPlusLevel >= 10) return messageSets.japan;
  return messageSets.western;
};


const StoryLoadingComponent: React.FC<StoryLoadingProps> = ({ isLoading, ngPlusLevel }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const theme = getTheme(ngPlusLevel);
  const storyMessages = theme.messages;

  useEffect(() => {
    if (isLoading) {
        const intervalId = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % storyMessages.length);
        }, 4400);
        return () => clearInterval(intervalId);
    }
  }, [isLoading, storyMessages.length]);

  if (!isLoading) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-[1008]"
        aria-label="Loading story"
        role="alert"
        aria-busy="true"
    >
      <div className="absolute top-3/4 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 text-center px-4 flex flex-col items-center">
          <div className="font-western text-3xl text-white animate-pulse mb-4 min-h-[3rem]" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 5px rgba(0,0,0,0.7)' }}>
            {storyMessages[currentMessageIndex]}
          </div>
          <div className="w-16 h-16 border-4 border-dashed border-white border-t-transparent rounded-full animate-spin" role="progressbar"></div>
          <p className="font-pulp-title text-lg text-stone-300 mt-4">{theme.subText}</p>
      </div>
    </div>
  );
};

export default StoryLoadingComponent;
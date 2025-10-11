import React, { useState, useEffect } from 'react';

interface NGPlusLoadingProps {
  isLoading: boolean;
  ngPlusLevel?: number;
  progress?: number;
}

const messageSets = {
  western: {
    title: "The Frontier",
    messages: [
      "Rewritin' the rules of the frontier...",
      "Twistin' old cards into new tricks...",
      "Shakin' the dust off some forgotten legends...",
      "Dealin' from a cursed deck...",
      "Stirrin' up a new kind of trouble...",
      "A new evil casts a longer shadow...",
    ]
  },
  japan: {
    title: "The World is Remade...",
    messages: [
      "The kami are rearranging the land...",
      "A new Shogun issues a dark decree...",
      "The path of the warrior is rewritten...",
      "Ancient spirits meddle with fate...",
      "The world is reshaped by a stroke of the brush...",
      "Old swords learn new, deadly techniques...",
    ]
  },
  safari: {
    title: "The Hunt Evolves...",
    messages: [
      "The safari route is being redrawn...",
      "A new apex predator claims its territory...",
      "The rules of the hunt are changing...",
      "Ancient spirits of the veldt are stirring...",
      "Old maps become dangerously unreliable...",
      "The great beasts grow stronger, and stranger...",
    ]
  },
  horror: {
    title: "The Nightmare Deepens...",
    messages: [
      "The stars are aligning into a dreadful pattern...",
      "The veil between worlds grows thin...",
      "Sanity is rewritten into a new, awful shape...",
      "Old curses find new victims...",
      "The nightmare deepens...",
      "The hunters become the hunted...",
    ]
  },
  cyberpunk: {
    title: "System Rebooting...",
    messages: [
      "Recompiling the laws of the street...",
      "A data-phage corrupts the system...",
      "Rogue AIs rewrite old hardware...",
      "The code of reality is being patched...",
      "Uploading new threats to the grid...",
      "Memory is fragmented... and dangerous...",
    ]
  },
};

const getTheme = (ngPlusLevel: number) => {
  if (ngPlusLevel >= 40) return messageSets.cyberpunk;
  if (ngPlusLevel >= 30) return messageSets.horror;
  if (ngPlusLevel >= 20) return messageSets.safari;
  if (ngPlusLevel >= 10) return messageSets.japan;
  return messageSets.western;
};


const NGPlusLoadingComponent: React.FC<NGPlusLoadingProps> = ({ isLoading, ngPlusLevel = 0, progress }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const theme = getTheme(ngPlusLevel);
  const ngPlusMessages = theme.messages;

  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % ngPlusMessages.length);
      }, 4400);
      return () => clearInterval(intervalId);
    }
  }, [isLoading, ngPlusMessages.length]);

  if (!isLoading) {
    return null;
  }

  return (
    <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.9)] z-[2000]"
        aria-label="Loading New Game Plus"
        role="alert"
        aria-busy="true"
    >
      <div className="absolute top-1/2 left-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 text-center px-4">
        <div className="font-western text-3xl text-white animate-pulse mb-6" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 5px rgba(0,0,0,0.7)' }}>
          {theme.title}
        </div>
        <div className="relative w-20 h-20 mx-auto" role="progressbar" aria-valuenow={progress !== undefined ? Math.round(progress) : undefined}>
          <div className="absolute inset-0 border-8 border-dashed border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          {progress !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center text-white font-pulp-title text-xl">
              {Math.round(progress)}%
            </div>
          )}
        </div>
        <p className="font-pulp-title text-xl text-stone-300 mt-6 min-h-[3rem]">
          {ngPlusMessages[currentMessageIndex]}
        </p>
        <p className="font-pulp-title text-lg text-stone-400 mt-3">
          This may take a few minutes...
        </p>
      </div>
    </div>
  );
};

export default NGPlusLoadingComponent;
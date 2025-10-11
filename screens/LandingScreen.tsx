import React from 'react';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';

interface LandingScreenProps {
  onEnter: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onEnter }) => {
  const handleEnterClick = () => {
    soundManager.playSound('ui_button_click');
    // Synchronously unlock the TTS engine. This must happen in the same
    // event loop tick as the user's tap to work on mobile browsers.
    ttsManager.unlock();
    // Proceed immediately. The first call to speak will handle canceling
    // the silent unlock utterance.
    onEnter();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleEnterClick();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-stone-200 px-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-stone-900/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl border-2 border-stone-600/50"
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
      >
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-western mb-4">
          Wild Lands
        </h1>
        <h2 className="text-xl sm:text-2xl font-pulp-title mb-6">
          A Deckbuilding Game of Survival
        </h2>
        <p className="max-w-xl mx-auto mb-8 text-stone-300 font-['Merriweather'] italic">
          The frontier is unforgiving. Every choice matters. Stake your claim, face the wilds, and forge your legend.
        </p>
        <button
          onClick={handleEnterClick}
          type="submit"
          className="button text-xl sm:text-2xl px-10 py-4"
        >
          Enter the Wild
        </button>
      </form>
    </div>
  );
};

export default LandingScreen;
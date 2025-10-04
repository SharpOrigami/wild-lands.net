import React, { useState, useMemo } from 'react';
import { CardData, CardContext } from '../types.ts';
import CardComponent from '../components/CardComponent.tsx';
import { soundManager } from '../utils/soundManager.ts';
import { getCardDescriptionHtml } from '../utils/cardUtils.ts';

interface DeckReviewScreenProps {
  deck: CardData[];
  onConfirm: (selectedIndices: number[]) => void;
  ngPlusLevel: number;
}

const DeckReviewScreen: React.FC<DeckReviewScreenProps> = ({ deck, onConfirm, ngPlusLevel }) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const carryOverLimit = useMemo(() => {
    return Math.min(13, 7 + Math.floor(ngPlusLevel / 10));
  }, [ngPlusLevel]);

  const toggleCardSelection = (index: number) => {
    soundManager.playSound('card_click');
    setSelectedIndices(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(index)) {
        newSelection.delete(index);
        if (lastSelectedIndex === index) {
          setLastSelectedIndex(null);
        }
      } else {
        if (newSelection.size < carryOverLimit) {
          newSelection.add(index);
          setLastSelectedIndex(index);
        }
      }
      return newSelection;
    });
  };

  const handleConfirmClick = () => {
    soundManager.playSound('ui_button_click');
    const selectedIndicesArray = Array.from(selectedIndices);
    onConfirm(selectedIndicesArray);
  };
  
  const unselectedCards = useMemo(() => 
    deck.filter((_, index) => !selectedIndices.has(index)),
    [deck, selectedIndices]
  );
  
  const goldFromSales = useMemo(() => 
    unselectedCards.reduce((total, card) => total + (card.sellValue || 0), 0),
    [unselectedCards]
  );

  const cardForDescription = lastSelectedIndex !== null ? deck[lastSelectedIndex] : null;

  return (
    <div className="flex flex-col items-center p-4 bg-[rgba(0,0,0,0.6)] rounded-lg">
      <h2 className="text-3xl font-western text-center text-stone-200 mb-2" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 5px rgba(0,0,0,0.7)' }}>Deck Review</h2>
      <p className="text-stone-300 mb-4 text-center max-w-2xl">Your journey was victorious! Now, prepare for the next. Choose up to {carryOverLimit} cards to carry over into your NG+ run. Any cards left behind will be sold for gold.</p>
      
      <div className="w-full bg-[rgba(244,241,234,0.8)] p-3 rounded-lg shadow-lg mb-4 text-center">
        <p className="text-xl font-bold font-pulp-title text-[var(--ink-main)]">
          {selectedIndices.size} / {carryOverLimit} cards selected
        </p>
        <p className="text-md text-[var(--ink-secondary)] mt-1">
          {unselectedCards.length} cards will be sold for <span className="font-bold text-[var(--tarnished-gold)]">{goldFromSales}G</span>
        </p>
      </div>

      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-center mb-6 overflow-y-auto max-h-[60vh] p-4 bg-[rgba(0,0,0,0.2)] rounded-lg">
        {deck.map((card, index) => (
          <CardComponent
            key={`${card.id}-${index}`}
            card={card}
            context={CardContext.DECK_REVIEW}
            onClick={() => toggleCardSelection(index)}
            isSelected={selectedIndices.has(index)}
            isDisabled={selectedIndices.size >= carryOverLimit && !selectedIndices.has(index)}
          />
        ))}
      </div>
      
      <button
        onClick={handleConfirmClick}
        className="button text-xl px-8 py-4"
        disabled={deck.length > 0 && selectedIndices.size === 0}
        title={deck.length > 0 && selectedIndices.size === 0 ? "You must select at least one card to continue" : "Confirm your deck for the next run"}
      >
        Confirm Deck & Begin NG+
      </button>

      {cardForDescription && (
        <div
          id="cardDescriptionDeckReviewArea"
          className="w-full max-w-4xl mt-4 p-3 bg-[rgba(244,241,234,0.8)] rounded-lg shadow-inner text-sm"
          aria-live="polite"
          dangerouslySetInnerHTML={{ __html: getCardDescriptionHtml(cardForDescription, CardContext.DECK_REVIEW) }}
        />
      )}
    </div>
  );
};

export default DeckReviewScreen;
import React, { useState, useEffect } from 'react';
import CardComponent from './CardComponent'; // Changed to default import
import { CardContext, CardData, ActiveGameBannerState, PlayerDetails } from '../types';

const illnessNames = [
  'Dysentery', 'Malaria', 'Scarlet Fever', 'Snake Bite', 'Ekiri', 'Okori Fever', 'Red Blossom Plague', 'Mamushi Venom', 'Sleeping Sickness', 'Mamba Venom', 'The Bloody Flux', 'The Ague', 'Crimson Scourge', "Beast's Bite"
];

interface OverlayEffectsProps {
    activeLaudanum?: boolean;
    showLightningStrikeFlash?: boolean;
    endGameStatus?: 'victory' | 'defeat';
    winReason?: string;
    scoutedCard?: CardData;
    clearScoutedCardPreview: () => void;
    showEndTurnFade?: boolean;
    activeGameBanner: ActiveGameBannerState | null;
    activeSkunkSpray?: boolean; // New prop for skunk spray
    playerDetails?: PlayerDetails;
}

const OverlayEffectsComponent: React.FC<OverlayEffectsProps> = ({
    activeLaudanum,
    showLightningStrikeFlash,
    endGameStatus: endGameStatusProp,
    winReason: winReasonProp,
    scoutedCard,
    clearScoutedCardPreview,
    showEndTurnFade,
    activeGameBanner,
    activeSkunkSpray, // Destructure new prop
    playerDetails,
}) => {
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [isBannerTextActive, setIsBannerTextActive] = useState(false); // Renamed from showEndGameBannerText
  const [isOverlayActive, setIsOverlayActive] = useState(false); // Renamed from showEndGameOverlay
  const [showScoutedCardPreview, setShowScoutedCardPreview] = useState(false);

  const [finalOutcome, setFinalOutcome] = useState<{ status: 'victory' | 'defeat', reason: string } | null>(null);

  const isIllnessBannerActive = !!activeGameBanner && illnessNames.includes(activeGameBanner.message);
  const isBlurActive = activeLaudanum || activeSkunkSpray || isIllnessBannerActive;

  useEffect(() => {
    // Example: Trigger damage flash (this would be connected to game events)
    // setShowDamageFlash(true);
    // setTimeout(() => setShowDamageFlash(false), 200);
  }, []);

  useEffect(() => {
    if (endGameStatusProp && !finalOutcome) {
      setFinalOutcome({
        status: endGameStatusProp,
        reason: winReasonProp || (endGameStatusProp === 'defeat' ? "You Died" : "Victory!")
      });
    } else if (!endGameStatusProp && finalOutcome) {
      setFinalOutcome(null);
    }
  }, [endGameStatusProp, winReasonProp, finalOutcome]);

  useEffect(() => {
    let textAppearTimerId: number | undefined;
    let fadeOutTimerId: number | undefined;

    if (finalOutcome) {
      setIsOverlayActive(true); // Make black overlay appear

      const bannerTextDelay = finalOutcome.status === 'victory' ? 500 : 1500;
      textAppearTimerId = window.setTimeout(() => {
        setIsBannerTextActive(true); // Make "You Died"/"Victory" text appear after its delay
      }, bannerTextDelay);

      // Timer to make everything (overlay and text) disappear after 8 seconds
      fadeOutTimerId = window.setTimeout(() => {
        setIsOverlayActive(false);
        setIsBannerTextActive(false);
      }, 8000);

    } else {
      // If finalOutcome becomes null (e.g., game reset), ensure elements are hidden
      setIsOverlayActive(false);
      setIsBannerTextActive(false);
    }

    return () => {
      if (textAppearTimerId) clearTimeout(textAppearTimerId);
      if (fadeOutTimerId) clearTimeout(fadeOutTimerId);
    };
  }, [finalOutcome]);


  useEffect(() => {
    if (scoutedCard) {
        setShowScoutedCardPreview(true);
        const timer = window.setTimeout(() => {
            if (showScoutedCardPreview) clearScoutedCardPreview();
        }, 5000);
        return () => clearTimeout(timer);
    } else {
        setShowScoutedCardPreview(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoutedCard]);

  let bannerTextColorClass = 'text-red-600'; // Default for event_alert, threat_defeated (though threat_defeated might want green)
  if (activeGameBanner?.bannerType === 'generic_info') {
    bannerTextColorClass = 'text-blue-700'; // Neutral blue for generic info
  } else if (activeGameBanner?.bannerType === 'threat_defeated') {
    bannerTextColorClass = 'text-green-600'; // Green for threat defeated
  }


  return (
    <>
      <div
        id="blurEffectOverlay"
        className={`fixed inset-0 z-[1002] pointer-events-none ${isBlurActive ? 'animate-screen-blur' : ''}`}
        aria-hidden="true"
      />
      {/* Black overlay for turn-ending event banners */}
      {activeGameBanner && activeGameBanner.bannerType === 'turn_ending_event' && (
        <div
          id="turnEndingEventOverlay"
          className="fixed inset-0 bg-black z-[1000] opacity-100 pointer-events-all"
        />
      )}

      <div
        id="damageFlashOverlay"
        className={`fixed inset-0 bg-red-700 pointer-events-none z-[1001] transition-opacity duration-150 ${showDamageFlash ? 'opacity-70' : 'opacity-0'}`}
      />
      <div
        id="laudanumEffectOverlay"
        className={`fixed inset-0 z-[2000] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(106,27,154,0.5)_0%,rgba(49,27,146,0.9)_100%)]
                    ${activeLaudanum ? 'animate-laudanum' : 'opacity-0'}`}
      />
      <div
        id="lightningStrikeFlashOverlay"
        className={`fixed inset-0 bg-white pointer-events-none z-[1005] transition-opacity duration-100
                    ${showLightningStrikeFlash ? 'opacity-90' : 'opacity-0'}`}
      />
      {/* New Skunk Spray Full-Screen Overlay */}
      <div
        id="skunkSprayFullScreenOverlay"
        className={`fixed inset-0 z-[2001] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(50,150,50,0.6)_0%,rgba(30,100,30,0.9)_100%)]
                    ${activeSkunkSpray ? 'animate-skunk-spray' : 'opacity-0'}`}
      />


      {/* End Game Overlay (Black Screen) */}
      <div
        id="endGameOverlay"
        className={`fixed inset-0 bg-black z-[1002] transition-opacity
                    ${isOverlayActive ? (finalOutcome?.status === 'victory' ? 'opacity-80 duration-500' : 'opacity-100 duration-[1500ms]') : 'opacity-0 duration-500 pointer-events-none'}`}
      />

      {/* End Game Banner Text ("Victory!" / "You Died") */}
      {finalOutcome && ( // Keep finalOutcome check here to ensure reason is available for text
        <div
          id="endGameBannerContainer"
          className={`fixed inset-0 flex items-center justify-center z-[1003] transition-opacity
                      ${isBannerTextActive ? 'opacity-100 duration-1000' : 'opacity-0 duration-500 pointer-events-none'}`}
        >
          <h1
              id="endGameText"
              className={`font-western text-[clamp(2rem,6vw,5rem)] ${finalOutcome.status === 'victory' ? 'text-green-500' : 'text-red-500'}`}
              style={{ textShadow: '2px 2px 0px var(--paper-bg), 4px 4px 0px rgba(0,0,0,0.2)' }}
          >
            {finalOutcome.status === 'victory' ? "Victory" : "You Died"}
          </h1>
        </div>
      )}

      {showScoutedCardPreview && scoutedCard && (
        <div
            className="fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center bg-[rgba(0,0,0,0.75)] z-[2000] transition-opacity duration-500 ease-in-out opacity-100 pointer-events-all"
            onClick={clearScoutedCardPreview}
        >
            <div className="font-pulp-title text-2xl text-[var(--paper-bg)] mb-4 p-2 bg-[rgba(0,0,0,0.5)] rounded" style={{textShadow: '1px 1px 2px black'}}>
              Next Event Preview:
            </div>
            <div className="transform scale-150 shadow-[0_0_30px_10px_rgba(255,255,150,0.5)]">
                 <CardComponent card={scoutedCard} context={CardContext.SCOUTED_PREVIEW} isDisabled={true} playerDetails={playerDetails}/>
            </div>
        </div>
      )}
      <div
        id="endTurnFadeOverlay"
        className={`fixed inset-0 bg-black pointer-events-none z-[1004] transition-opacity
                    ${showEndTurnFade ? 'opacity-100 duration-[750ms]' : 'opacity-0 duration-[500ms]'}`}
      />
      {activeGameBanner && activeGameBanner.show && (
        <div
          id="activeGameBanner"
          className="fixed inset-x-0 top-1/3 flex items-center justify-center pointer-events-none z-[1001] transition-opacity duration-500 ease-in-out opacity-100"
        >
          <div
            className={`font-pulp-title ${bannerTextColorClass} text-[clamp(2.5rem,6vw,4rem)] bg-[rgba(244,241,234,0.85)] px-6 py-4 rounded-md shadow-lg border-2 border-[var(--ink-main)] text-center`}
            style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.3)'}}
          >
            {activeGameBanner.message}
          </div>
        </div>
      )}
    </>
  );
};

export default OverlayEffectsComponent;
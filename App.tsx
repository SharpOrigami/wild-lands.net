import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameState } from './hooks/useGameState.ts';
import LandingScreen from './screens/LandingScreen.tsx';
import SetupScreen from './screens/SetupScreen.tsx';
import GameScreen from './screens/GameScreen.tsx';
import DeckReviewScreen from './screens/DeckReviewScreen.tsx';
import ModalComponent from './components/ModalComponent.tsx';
import OverlayEffectsComponent from './components/OverlayEffectsComponent.tsx';
import BossIntroStoryComponent from './components/BossIntroStoryComponent.tsx'; 
import StoryLoadingComponent from './components/StoryLoadingComponent.tsx'; 
import NGPlusLoadingComponent from './components/NGPlusLoadingComponent.tsx'; 
import TutorialComponent from './components/TutorialComponent.tsx';
import StatsModalComponent from './components/StatsModalComponent.tsx';
import TTSModalComponent from './components/TTSModalComponent.tsx';
import ManualContent from './components/ManualContent.tsx'; // Import the new component
import SaveGameModalComponent from './components/SaveGameModalComponent.tsx';
import { loadLifetimeStats, resetLifetimeStats } from './utils/statsUtils.ts';
import { LifetimeStats } from './types.ts';
import { PLAYER_ID, NG_PLUS_THEME_MILESTONE_INTERVAL, APP_VERSION } from './constants.ts';
import { soundManager, ALL_THEMES as ALL_SOUND_THEMES, ThemeName as SoundTheme } from './utils/soundManager.ts';
import { imageManager, ALL_THEMES as ALL_IMAGE_THEMES, ThemeName as ImageTheme } from './utils/imageManager.ts';
import { ttsManager } from './utils/ttsManager.ts'; // Import TTS Manager
import { hapticManager } from './utils/hapticUtils.ts';
import { getCacheBustedUrl } from './utils/cardUtils.ts';
import { generateStoryForGame } from './services/geminiService.ts';

const getThemesForLevel = (level: number): string[] => {
  const themes: string[] = ['common', 'western'];
  if (level >= 10) themes.push('japan');
  if (level >= 20) themes.push('africa');
  if (level >= 30) themes.push('horror');
  if (level >= 40) themes.push('cyberpunk');
  return themes;
};

const SoundControls: React.FC<{ toggleTTSModal: () => void }> = ({ toggleTTSModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState(soundManager.getSfxVolume());
  const [ttsVolume, setTtsVolume] = useState(ttsManager.getVolume());
  const [isMusicMuted, setIsMusicMuted] = useState(soundManager.getIsMusicMuted());
  const [isSfxMuted, setIsSfxMuted] = useState(soundManager.getIsSfxMuted());
  const [isNarrating, setIsNarrating] = useState(ttsManager.isNarrating());
  const [hapticsEnabled, setHapticsEnabled] = useState(hapticManager.getIsEnabled());
  const [isHapticSupported, setIsHapticSupported] = useState(false);
  
  const isAllMuted = isMusicMuted && isSfxMuted && !isNarrating;

  useEffect(() => {
    if ('vibrate' in navigator) {
      setIsHapticSupported(true);
    }

    const handleSoundChange = () => {
      setIsMusicMuted(soundManager.getIsMusicMuted());
      setIsSfxMuted(soundManager.getIsSfxMuted());
      setMusicVolume(soundManager.getMusicVolume());
      setSfxVolume(soundManager.getSfxVolume());
    };
    soundManager.addListener(handleSoundChange);

    const handleTTSChange = () => {
      setIsNarrating(ttsManager.isNarrating());
      setTtsVolume(ttsManager.getVolume());
    };
    ttsManager.addListener(handleTTSChange);

    const handleHapticChange = () => {
      setHapticsEnabled(hapticManager.getIsEnabled());
    };
    hapticManager.addListener(handleHapticChange);

    return () => {
      soundManager.removeListener(handleSoundChange);
      ttsManager.removeListener(handleTTSChange);
      hapticManager.removeListener(handleHapticChange);
    };
  }, []);

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundManager.setMusicVolume(parseFloat(e.target.value));
  };
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundManager.setSfxVolume(parseFloat(e.target.value));
  };
  const handleTtsVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    ttsManager.setVolume(parseFloat(e.target.value));
  };

  const toggleMusicMute = () => soundManager.setMusicMuted(!isMusicMuted);
  const toggleSfxMute = () => soundManager.setSfxMuted(!isSfxMuted);
  const toggleNarration = () => ttsManager.setNarrating(!isNarrating);
  const toggleHaptics = () => hapticManager.setIsEnabled(!hapticsEnabled);

  const toggleMuteAll = () => {
    const newMutedState = !isAllMuted;
    soundManager.setMusicMuted(newMutedState);
    soundManager.setSfxMuted(newMutedState);
    ttsManager.setNarrating(!newMutedState);
    if (!newMutedState) {
      soundManager.playSound('ui_button_click');
    }
  };

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[5000]" onClick={e => e.stopPropagation()}>
      <button 
        onClick={handleToggleOpen}
        className="button !w-14 !h-14 !rounded-full flex items-center justify-center text-3xl shadow-lg
                   !bg-[var(--paper-bg)] !text-[var(--ink-main)] border-2 !border-[var(--ink-main)]
                   hover:!bg-stone-300"
        aria-label="Sound settings"
      >
        {isAllMuted ? '🔇' : '🔊'}
      </button>
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-[var(--paper-bg)] p-4 rounded-lg shadow-lg w-80 border-2 border-[var(--ink-main)] text-[var(--ink-main)]">
          <div className="flex flex-col gap-4 font-pulp-title text-lg">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl w-6 text-center">🎵</span>
                  <label htmlFor="music-volume" className="flex-1">Music</label>
              </div>
              <div className="flex items-center gap-3">
                <input id="music-volume" type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={handleMusicVolumeChange} className="w-24" disabled={isMusicMuted} />
                <input type="checkbox" checked={!isMusicMuted} onChange={toggleMusicMute} className="w-5 h-5 accent-[var(--blood-red)]" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl w-6 text-center">💥</span>
                <label htmlFor="sfx-volume" className="flex-1">Sound FX</label>
              </div>
              <div className="flex items-center gap-3">
                <input id="sfx-volume" type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={handleSfxVolumeChange} className="w-24" disabled={isSfxMuted} />
                <input type="checkbox" checked={!isSfxMuted} onChange={toggleSfxMute} className="w-5 h-5 accent-[var(--blood-red)]" />
              </div>
            </div>

            {isHapticSupported && (
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl w-6 text-center">📳</span>
                    <label htmlFor="haptics-toggle" className="flex-1">Haptics</label>
                 </div>
                <input id="haptics-toggle" type="checkbox" checked={hapticsEnabled} onChange={toggleHaptics} className="w-5 h-5 accent-[var(--blood-red)]" />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-[var(--border-color)]">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl w-6 text-center">🗣️</span>
                  <button onClick={toggleTTSModal} className="button !text-xs !py-0.5 !px-2" aria-label="Change narration voice">Voice</button>
                </div>
                <div className="flex items-center gap-3">
                    <input id="tts-volume" type="range" min="0" max="1" step="0.05" value={ttsVolume} onChange={handleTtsVolumeChange} className="w-24" disabled={!isNarrating} />
                    <input id="narrate-toggle" type="checkbox" checked={isNarrating} onChange={toggleNarration} className="w-5 h-5 accent-[var(--blood-red)]" aria-label="Toggle narration on or off" />
                </div>
            </div>

             <button onClick={toggleMuteAll} className="button !w-full !mt-2">
              {isAllMuted ? 'Unmute All' : 'Mute All'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const {
    gameState,
    enterGame,
    selectCharacter,
    confirmName,
    startGame,
    resetGame,
    fullResetGame,
    handleCardAction,
    handleRestockStore,
    endTurn,
    closeModal,
    setSelectedCard,
    deselectAllCards,
    endDayAnimation,
    proceedToGamePlay, 
    togglePedometer, 
    handleNGPlusReward, 
    enablePedometerFeature,
    setPersonality,
    handlePostGame,
    confirmDeckSelection,
    proceedToFinishedState,
    handleCheatIncreaseDifficulty,
    handleCheatAddMaxHealth,
    startNextLevelRemix,
    handleCheatRemixDeck,
    saveGame,
    loadGame,
    deleteGame,
    downloadGame,
    uploadAndLoadGame,
    acknowledgeGameStart,
  } = useGameState();
  
  const [tutorialState, setTutorialState] = useState({ active: false, step: 0 });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isTTSModalOpen, setIsTTSModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
  const [isAssetsInitialized, setIsAssetsInitialized] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isManualPreloading, setIsManualPreloading] = useState(false);
  const [manualPreloadProgress, setManualPreloadProgress] = useState(0);
  const [areAllAssetsPreloaded, setAreAllAssetsPreloaded] = useState(false);
  const [ngPlusButtonsVisible, setNgPlusButtonsVisible] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isSetupMenuOpen, setIsSetupMenuOpen] = useState(false);

  const storyGenerationInProgress = useRef(false);

  const toggleTTSModal = () => {
    soundManager.playSound('ui_button_click');
    setIsTTSModalOpen(prev => !prev);
  }

  const toggleSaveModal = () => {
    soundManager.playSound('ui_button_click');
    setIsSaveModalOpen(prev => !prev);
  };

  const toggleGameMenu = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      soundManager.playSound('ui_button_click');
      setIsGameMenuOpen(prev => !prev);
  }, []);

  const toggleSetupMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playSound('ui_button_click');
    setIsSetupMenuOpen(prev => !prev);
  }, []);

  const enableNgPlusButtons = () => {
      soundManager.playSound('gold');
      handleCardAction('SHOW_MODAL', {
          modalType: 'message',
          title: 'Cheat Activated',
          text: 'NG+ level select unlocked.',
      });
      setNgPlusButtonsVisible(true);
  };

  const handleCheatAddGold = (amount: number) => {
      handleCardAction('CHEAT_ADD_GOLD', { amount });
  };

  const handleNewGame = (slotIndex: number) => {
    // Save the current game to its assigned slot if it's in progress, to prevent accidental loss of progress.
    if (gameState && (gameState.status === 'playing' || gameState.status === 'playing_initial_reveal')) {
      if (gameState.saveSlotIndex !== null && gameState.saveSlotIndex !== undefined) {
        saveGame(gameState.saveSlotIndex);
      }
    }
    fullResetGame({ saveSlotIndex: slotIndex });
  };

  const handleAppClick = () => {
    // This is a global click handler to ensure audio contexts are unlocked on mobile
    // after any user interaction, especially on page reload.
    ttsManager.unlock();

    // Existing logic from the div's onClick
    deselectAllCards();
    setIsGameMenuOpen(false);
    setIsSetupMenuOpen(false);
  };

  useEffect(() => {
    // Reset the NG+ cheat buttons whenever the game leaves the setup screen.
    // This makes the "whistle dixie" cheat a one-time use per run.
    if (gameState && gameState.status !== 'setup' && ngPlusButtonsVisible) {
      setNgPlusButtonsVisible(false);
    }
  }, [gameState?.status, ngPlusButtonsVisible]);

  useEffect(() => {
    setLifetimeStats(loadLifetimeStats());
  }, []);
  
  // Effect 1: Initialize asset managers once on component mount.
  useEffect(() => {
    const initManagers = async () => {
      if (isAssetsInitialized) return;
      console.log("Initializing asset managers...");
      await soundManager.init();
      setIsAssetsInitialized(true);
      console.log("Asset managers initialized.");
    };
    initManagers();
  }, [isAssetsInitialized]);

  // Effect 2: Preload assets after managers are initialized and lifetime stats are loaded.
  useEffect(() => {
    if (!isAssetsInitialized || !lifetimeStats) return;

    const preloadAssets = async () => {
      // --- SOUNDS PRELOADING (with app version check) ---
      const storedSoundVersion = localStorage.getItem('preloaded_sound_version_WWS');
      if (storedSoundVersion !== APP_VERSION) {
        console.log(`New app version (${APP_VERSION}) detected. Clearing sound preload cache.`);
        localStorage.removeItem('preloaded_sound_themes_WWS');
        localStorage.setItem('preloaded_sound_version_WWS', APP_VERSION);
      }

      // --- IMAGES PRELOADING (with monthly check) ---
      const imagePreloadTimestamp = localStorage.getItem('preloaded_images_timestamp_WWS');
      const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
      if (!imagePreloadTimestamp || (Date.now() - parseInt(imagePreloadTimestamp, 10)) > oneMonthInMs) {
          console.log("Image cache is over one month old or missing. Clearing image preload cache.");
          localStorage.removeItem('preloaded_image_themes_WWS');
          localStorage.setItem('preloaded_images_timestamp_WWS', Date.now().toString());
      }

      // --- Check asset completion status ---
      const preloadedImageThemes = JSON.parse(localStorage.getItem('preloaded_image_themes_WWS') || '[]');
      const preloadedSoundThemes = JSON.parse(localStorage.getItem('preloaded_sound_themes_WWS') || '[]');
      const allImagesPreloaded = ALL_IMAGE_THEMES.every(theme => preloadedImageThemes.includes(theme));
      const allSoundsPreloaded = ALL_SOUND_THEMES.every(theme => preloadedSoundThemes.includes(theme));
      if (allImagesPreloaded && allSoundsPreloaded) {
          setAreAllAssetsPreloaded(true);
      } else {
          setAreAllAssetsPreloaded(false);
      }

      // --- Determine what needs loading for current NG+ level ---
      const highestLevelReached = lifetimeStats.highestNGPlusLevel || 0;
      const themesToLoad = getThemesForLevel(highestLevelReached);
      
      const imageThemesToLoad = themesToLoad.filter(theme => !preloadedImageThemes.includes(theme));
      const soundThemesToLoad = themesToLoad.filter(theme => !preloadedSoundThemes.includes(theme));

      if (imageThemesToLoad.length > 0 || soundThemesToLoad.length > 0) {
        setIsBackgroundLoading(true);

        const needsCommonImages = imageThemesToLoad.includes('common');
        const needsCommonSounds = soundThemesToLoad.includes('common');

        if (needsCommonImages || needsCommonSounds) {
          console.log("Preloading high-priority common assets...");
          if (needsCommonImages) await imageManager.preloadThemes(['common']);
          if (needsCommonSounds) await soundManager.preloadThemes(['common']);
          
          if (needsCommonImages) {
            const updated = [...new Set([...preloadedImageThemes, 'common'])];
            localStorage.setItem('preloaded_image_themes_WWS', JSON.stringify(updated));
          }
          if (needsCommonSounds) {
              const updated = [...new Set([...preloadedSoundThemes, 'common'])];
              localStorage.setItem('preloaded_sound_themes_WWS', JSON.stringify(updated));
          }
          console.log("Common assets loaded, UI should be responsive.");
        }

        const otherImageThemes = imageThemesToLoad.filter(t => t !== 'common');
        const otherSoundThemes = soundThemesToLoad.filter(t => t !== 'common');

        if (otherImageThemes.length > 0 || otherSoundThemes.length > 0) {
          console.log(`Preloading background assets... Images: [${otherImageThemes.join(', ')}], Sounds: [${otherSoundThemes.join(', ')}]`);
          Promise.all([
            otherImageThemes.length > 0 ? imageManager.preloadThemes(otherImageThemes as ImageTheme[]) : Promise.resolve(),
            otherSoundThemes.length > 0 ? soundManager.preloadThemes(otherSoundThemes as SoundTheme[]) : Promise.resolve()
          ]).then(() => {
            if (otherImageThemes.length > 0) {
                const current = JSON.parse(localStorage.getItem('preloaded_image_themes_WWS') || '[]');
                const newlyLoaded = [...new Set([...current, ...otherImageThemes])];
                localStorage.setItem('preloaded_image_themes_WWS', JSON.stringify(newlyLoaded));
            }
            if (otherSoundThemes.length > 0) {
                const current = JSON.parse(localStorage.getItem('preloaded_sound_themes_WWS') || '[]');
                const newlyLoaded = [...new Set([...current, ...otherSoundThemes])];
                localStorage.setItem('preloaded_sound_themes_WWS', JSON.stringify(newlyLoaded));
            }
            console.log(`Background asset preload complete.`);
            setIsBackgroundLoading(false);
          });
        } else {
          setIsBackgroundLoading(false);
        }
      }
    };
    
    // Delay preloading to allow landing screen to render smoothly.
    const preloadTimeout = setTimeout(() => {
        preloadAssets();
    }, 2500); // 2.5 second delay

    return () => clearTimeout(preloadTimeout);
  }, [isAssetsInitialized, lifetimeStats]);
  
  useEffect(() => {
    document.body.classList.toggle('tutorial-active', tutorialState.active);
  }, [tutorialState.active]);

  useEffect(() => {
    if (gameState) {
      const ngPlusLevel = gameState.ngPlusLevel;
      const themeClass10 = 'ng-plus-10-theme';
      const themeClass20 = 'ng-plus-20-theme';
      const themeClass30 = 'ng-plus-30-theme';
      const themeClass40 = 'ng-plus-40-theme';
      const themeClass50 = 'ng-plus-50-theme';
      
      const bodyClassList = document.body.classList;
      const allThemes = [themeClass10, themeClass20, themeClass30, themeClass40, themeClass50];

      let landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image.png';
      let portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image2.png';
      let themeToApply: string | null = null;

      if (ngPlusLevel >= 500) {
        themeToApply = themeClass50; // Legendary Western is the visual base for the all-mix
      } else if (ngPlusLevel >= 400) {
        themeToApply = themeClass40;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_cp.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_cp2.png';
      } else if (ngPlusLevel >= 300) {
        themeToApply = themeClass30;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_sh.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_sh2.png';
      } else if (ngPlusLevel >= 200) {
        themeToApply = themeClass20;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_as.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_as2.png';
      } else if (ngPlusLevel >= 100) {
        themeToApply = themeClass10;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_fj.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_fj2.png';
      } else if (ngPlusLevel >= 50) {
        themeToApply = themeClass50;
      } else if (ngPlusLevel >= 40) {
        themeToApply = themeClass40;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_cp.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_cp2.png';
      } else if (ngPlusLevel >= 30) {
        themeToApply = themeClass30;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_sh.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_sh2.png';
      } else if (ngPlusLevel >= 20) {
        themeToApply = themeClass20;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_as.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_as2.png';
      } else if (ngPlusLevel >= 10) {
        themeToApply = themeClass10;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_fj.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_fj2.png';
      }


      const updateBackgrounds = () => {
        const cachedLandscape = imageManager.getCachedUrl(landscapeUrl);
        const cachedPortrait = imageManager.getCachedUrl(portraitUrl);
        document.body.style.setProperty('--bg-landscape', `url(${cachedLandscape})`);
        document.body.style.setProperty('--bg-portrait', `url(${cachedPortrait})`);
      };
      
      // Add a short delay to give the image manager a moment to cache the URLs on initial load.
      setTimeout(updateBackgrounds, 100);
      
      allThemes.forEach(theme => {
          if (theme === themeToApply) {
              if (!bodyClassList.contains(theme)) bodyClassList.add(theme);
          } else {
              if (bodyClassList.contains(theme)) bodyClassList.remove(theme);
          }
      });
      
      const isTutorialCompleted = localStorage.getItem('wildWestTutorialCompleted_WWS') === 'true';
      if ((gameState.status === 'playing' || gameState.status === 'playing_initial_reveal') && gameState.ngPlusLevel === 0 && !isTutorialCompleted && !tutorialState.active) {
        setTutorialState({ active: true, step: 0 });
      }

    }
  }, [gameState?.ngPlusLevel, gameState?.status, tutorialState.active]);

  useEffect(() => {
    if (!gameState || !isAssetsInitialized) return;

    const player = gameState.playerDetails[PLAYER_ID];
    const isBossEncounter = gameState.isBossFightActive === true;

    let musicToPlay: string | null = null;

    switch (gameState.status) {
      case 'landing':
        soundManager.stopMusic();
        return; // Early exit, no music to play

      case 'setup':
      case 'generating_boss_intro':
      case 'showing_boss_intro':
        const ngPlusLevel = gameState.ngPlusLevel;
        if (ngPlusLevel >= 40 && ngPlusLevel < 50) {
          musicToPlay = 'music_setup_cp';
        } else if (ngPlusLevel >= 30 && ngPlusLevel < 40) {
          musicToPlay = 'music_setup_sh';
        } else if (ngPlusLevel >= 20 && ngPlusLevel < 30) {
          musicToPlay = 'music_setup_as';
        } else if (ngPlusLevel >= 10 && ngPlusLevel < 20) {
          musicToPlay = 'music_setup_fj';
        } else {
          musicToPlay = 'music_setup';
        }
        break;

      case 'finished':
        if (player && player.health > 0) {
          musicToPlay = 'music_victory';
        } else {
          musicToPlay = 'music_defeat';
        }
        break;
      
      case 'deck_review':
        musicToPlay = 'music_victory';
        break;

      case 'playing':
      case 'playing_initial_reveal':
        if (isBossEncounter) {
          musicToPlay = 'music_boss';
        } else {
          musicToPlay = 'music_main';
        }
        break;
      
      default:
        soundManager.stopMusic();
        return;
    }

    if (musicToPlay) {
      soundManager.playMusic(musicToPlay as any);
    }
    
  }, [
    gameState?.status,
    gameState?.playerDetails[PLAYER_ID]?.health,
    gameState?.ngPlusLevel,
    gameState?.isBossFightActive,
    isAssetsInitialized,
  ]);
  
  useEffect(() => {
    if (gameState?.status !== 'finished') {
        storyGenerationInProgress.current = false;
    }
  }, [gameState?.status]);

  useEffect(() => {
    if (gameState?.status === 'finished' && !gameState.storyGenerated && !storyGenerationInProgress.current) {
        storyGenerationInProgress.current = true;
        
        const runEndGameSequence = async () => {
            const player = gameState.playerDetails[PLAYER_ID];
            if (!player) {
                storyGenerationInProgress.current = false;
                return;
            }
            
            const isVictory = player.health > 0;
            const title = isVictory ? 'A Legend is Born' : 'The End of the Trail';
            let text = '';
            
            // Show loading state for story modal
            handleCardAction('SHOW_MODAL', { modalType: 'story', title: '', text: '' });
            
            try {
                text = await generateStoryForGame(gameState);
            } catch(error) {
                console.error(`Failed to generate story: ${error}`);
                text = isVictory 
                    ? 'Your tale is written in deeds, not words.' 
                    : (gameState.winReason || 'Your journey has ended.');
            }
 
            // Show the final story modal
            handleCardAction('SHOW_MODAL', { modalType: 'story', title, text });

            // If it's a victory, start the background remixing 0.5s after the story is displayed.
            if (isVictory) {
                setTimeout(() => {
                    startNextLevelRemix();
                }, 500); 
            }
        };
        runEndGameSequence();
    }
  }, [gameState, handleCardAction, startNextLevelRemix]);


  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAboutDevsModalOpen, setIsAboutDevsModalOpen] = useState(false);

  const handlePreloadAllAssets = async () => {
    if (isManualPreloading) return;

    soundManager.playSound('ui_button_click');
    setIsManualPreloading(true);
    setManualPreloadProgress(0);

    const allImageUrls = imageManager.getUrlsForThemes(ALL_IMAGE_THEMES);
    const allSoundUrls = soundManager.getUrlsForThemes(ALL_SOUND_THEMES);
    
    const allUniqueUrls = [...new Set([...allImageUrls, ...allSoundUrls])];
    const totalAssets = allUniqueUrls.length;
    let loadedAssets = 0;
    
    const onAssetLoaded = () => {
        loadedAssets++;
        setManualPreloadProgress((loadedAssets / totalAssets) * 100);
    };
    
    await imageManager.preloadBatch(allImageUrls, onAssetLoaded);
    await soundManager.preloadBatch(allSoundUrls, onAssetLoaded);

    setIsManualPreloading(false);
    setAreAllAssetsPreloaded(true);
    
    localStorage.setItem('preloaded_image_themes_WWS', JSON.stringify(ALL_IMAGE_THEMES));
    localStorage.setItem('preloaded_sound_themes_WWS', JSON.stringify(ALL_SOUND_THEMES));
    localStorage.setItem('preloaded_images_timestamp_WWS', Date.now().toString());
    localStorage.setItem('preloaded_sound_version_WWS', APP_VERSION);

    handleCardAction('SHOW_MODAL', {
      modalType: 'message',
      title: 'Preload Complete',
      text: `All ${totalAssets} game assets have been preloaded for offline play.`,
    });
  };

  const toggleManualModal = () => {
    soundManager.playSound('ui_button_click');
    setIsManualModalOpen(prev => {
      const opening = !prev;
      if (opening) {
        if (gameState?.selectedCard) {
            deselectAllCards();
        }
      }
      return opening;
    });
  };
  
  const toggleAboutDevsModal = () => {
    soundManager.playSound('ui_button_click');
    setIsAboutDevsModalOpen(prev => {
      const opening = !prev;
      if (opening && gameState?.selectedCard) deselectAllCards();
      return opening;
    });
  };

  const toggleStatsModal = () => {
    soundManager.playSound('ui_button_click');
    setIsStatsModalOpen(prev => {
      const opening = !prev;
      if (opening) {
        setLifetimeStats(loadLifetimeStats()); 
        if (gameState?.selectedCard) deselectAllCards();
      }
      return opening;
    });
  };

  const handleResetStats = () => {
    soundManager.playSound('ui_button_click');
    handleCardAction('SHOW_MODAL', {
      modalType: 'message',
      title: 'Reset All Stats?',
      text: 'Are you sure you want to permanently erase all lifetime statistics? This cannot be undone.',
      confirmText: 'Yes, Erase Stats',
      confirmCallback: () => {
        resetLifetimeStats();
        setLifetimeStats(loadLifetimeStats()); 
      }
    });
  };

  const handleStartSpecificNGPlus = (level: number) => {
    soundManager.playSound('ui_button_click');
    if (gameState?.selectedCard) deselectAllCards();
    resetGame({ ngPlusOverride: level });
  };
  
  const advanceTutorial = () => {
    soundManager.playSound('ui_button_click');
    setTutorialState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const endTutorial = () => {
    soundManager.playSound('ui_button_click');
    setTutorialState({ active: false, step: 0 });
    localStorage.setItem('wildWestTutorialCompleted_WWS', 'true');
  };


  if (!isAssetsInitialized) {
    return <div className="text-center text-[var(--paper-bg)] text-2xl font-western p-10">Loading the Frontier...</div>;
  }
  
  if (!gameState) { 
    return <div className="text-center text-[var(--paper-bg)] text-2xl font-western p-10">Initializing...</div>;
  }


  const playerDetails = gameState.playerDetails[PLAYER_ID];

  const aboutDevsContent = (
    <div className="text-sm">
      <h4 className="font-western text-xl mt-0 mb-2 text-center">About Wild Lands</h4>
      <p className="mb-2">Welcome to Wild Lands. This digital game is a collaboration between its original creator, Charles Falk, and a senior frontend AI assistant. It's an adaptation of a tabletop deckbuilding game Charles designed, brought to life with modern web technologies and AI-powered features.</p>
      
      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">The Original Design: Charles Falk</h5>
      <p className="mb-2">Charles created the original tabletop version of Wild Lands, including the core rules, card mechanics, and the Wild West theme. This project is built on his foundation. Throughout development, his feedback was essential for maintaining the game's balance and strategic depth.</p>

      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">The Digital Implementation: AI Assistant</h5>
      <p className="mb-2">My role as the AI assistant was to handle the technical implementation. This involved building the user interface with React and TypeScript, designing the user experience for digital play, and integrating AI services to generate dynamic content like the end-of-run stories and the final boss encounters.</p>

      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Our Process</h5>
      <p className="mb-2">Our development was an iterative process. Charles provided the game's design and concepts. I implemented those features, proposed UI layouts, and developed the game's visual style. Together, we worked to ensure the digital version was a faithful and enjoyable adaptation of the original.</p>

      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">How It Works: Frontend & Backend</h5>
      <p className="mb-2">This application is split into two parts. The 'frontend' is everything you see and interact with—the user interface, game logic, and animations. The 'backend' is a specialized service that the frontend calls for specific AI tasks, like generating the boss or writing the end-of-game story. Most requests for changes, like visual updates or gameplay adjustments, only involve modifying the frontend code and don't require any backend changes.</p>

      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Enjoy the Game</h5>
      <p className="mb-2">This game represents a partnership between human game design and AI development. We hope you enjoy your journey through the reimagined Wild Lands. Happy trails!</p>
      
      <div className="mt-6 pt-4 border-t-2 border-dashed border-[var(--border-color)] text-center">
          <h5 className="font-pulp-title text-lg mt-2 mb-1">Feedback & Questions</h5>
          <p className="mb-2 text-xs italic">
            Have a question, found a bug, or just want to share your thoughts? We'd love to hear from you! You can send us an email by clicking <a 
              href="mailto:charliefalk86@gmail.com" 
              className="text-blue-600 hover:text-blue-800 underline font-semibold"
            >here</a>.
          </p>
      </div>
    </div>
  );
  
  const isGameActive = gameState.status === 'playing' || gameState.status === 'playing_initial_reveal';
  const containerClasses = `container mx-auto p-4 rounded-lg shadow-xl relative ${isGameActive ? 'max-w-screen-2xl' : 'max-w-7xl'}`;

  return (
    <div className={containerClasses} onClick={handleAppClick} aria-live="polite">
      {isBackgroundLoading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-800/80 text-white font-pulp-title px-4 py-2 rounded-lg shadow-lg z-[6000]">
          Preloading assets...
        </div>
      )}
      <SoundControls toggleTTSModal={toggleTTSModal} />
      {tutorialState.active && (
        <TutorialComponent 
          step={tutorialState.step} 
          onNext={advanceTutorial} 
          onEnd={endTutorial} 
          selectedCard={gameState.selectedCard}
        />
      )}
      <OverlayEffectsComponent
        activeLaudanum={gameState.laudanumVisualActive}
        showLightningStrikeFlash={gameState.showLightningStrikeFlash}
        endGameStatus={gameState.status === 'finished' ? (playerDetails?.health > 0 ? 'victory' : 'defeat') : undefined}
        winReason={gameState.winReason}
        scoutedCard={gameState.selectedCard?.source === 'scouted_preview' ? gameState.selectedCard.card : undefined}
        clearScoutedCardPreview={() => {
          if (gameState.selectedCard?.source === 'scouted_preview') {
            setSelectedCard(null);
          }
        }}
        endDayAnimation={endDayAnimation}
        activeGameBanner={gameState.activeGameBanner}
        activeSkunkSpray={gameState.skunkSprayVisualActive} 
        playerDetails={playerDetails}
      />

      {gameState.isLoadingNGPlus && <NGPlusLoadingComponent isLoading={true} ngPlusLevel={gameState.ngPlusLevel} progress={gameState.remixProgress} />}

      {gameState.status === 'landing' && <LandingScreen onEnter={enterGame} />}

      {gameState.status === 'setup' && playerDetails && !gameState.isLoadingNGPlus && !gameState.showNGPlusRewardModal && (
        <SetupScreen
          playerDetails={playerDetails}
          onSelectCharacter={selectCharacter}
          onConfirmName={confirmName}
          onStartGame={startGame}
          ngPlusLevel={gameState.ngPlusLevel}
          isLoadingBossIntro={gameState.isLoadingBossIntro || false}
          onSetPersonality={setPersonality}
          onEnableCheats={enableNgPlusButtons}
          onCheatAddGold={handleCheatAddGold}
          onCheatIncreaseDifficulty={handleCheatIncreaseDifficulty}
          onCheatAddMaxHealth={handleCheatAddMaxHealth}
          onCheatRemixDeck={handleCheatRemixDeck}
          gameJustStarted={!!gameState.gameJustStarted}
          onAcknowledgeGameStart={acknowledgeGameStart}
        />
      )}

      {(gameState.status === 'generating_boss_intro' || gameState.status === 'showing_boss_intro') && !gameState.isLoadingNGPlus && (
        <BossIntroStoryComponent
          isLoading={gameState.status === 'generating_boss_intro'} 
          title={gameState.bossIntroTitle}
          paragraph={gameState.bossIntroParagraph}
          characterName={playerDetails?.character?.name}
          onContinue={proceedToGamePlay}
          ngPlusLevel={gameState.ngPlusLevel}
        />
      )}

      {gameState.status === 'deck_review' && (
        <DeckReviewScreen
          deck={gameState.deckForReview || []}
          onConfirm={confirmDeckSelection}
          ngPlusLevel={gameState.ngPlusLevel}
        />
      )}

      {(isGameActive) && playerDetails && !gameState.isLoadingNGPlus && (
         <GameScreen
            gameState={gameState}
            playerDetails={playerDetails}
            onCardAction={handleCardAction}
            onEndTurn={endTurn}
            onRestartGame={() => {
              closeModal('message');
              handleCardAction('SHOW_MODAL', {
                modalType: 'message',
                title: 'Restart Run?',
                text: "Are you sure you want to restart this run? You'll return to the setup screen with the same deck you started this level with. All progress in the current run will be lost.",
                confirmText: 'Yes, Restart Run',
                confirmCallback: () => {
                  resetGame();
                }
              });
            }}
            onRestockStore={handleRestockStore}
            selectedCardDetails={gameState.selectedCard}
            setSelectedCard={setSelectedCard}
            deselectAllCards={deselectAllCards}
            onTogglePedometer={togglePedometer}
            onToggleSaveModal={toggleSaveModal}
        />
      )}

      {gameState.isLoadingStory && <StoryLoadingComponent isLoading={true} ngPlusLevel={gameState.ngPlusLevel} />}

      {gameState.modals?.message.isOpen && (
        <ModalComponent
          title={gameState.modals.message.title}
          isOpen={gameState.modals.message.isOpen}
          onClose={() => closeModal('message')}
          confirmCallback={gameState.modals.message.confirmCallback}
          confirmText={gameState.modals.message.confirmText}
        >
          <p className="whitespace-pre-wrap">{gameState.modals.message.text}</p>
        </ModalComponent>
      )}

      {gameState.showObjectiveSummaryModal && gameState.objectiveSummary && (
        <ModalComponent
          title={gameState.objectiveSummary.title}
          isOpen={true}
          onClose={proceedToFinishedState}
          singleActionText="Continue"
        >
          <p className="whitespace-pre-wrap">{gameState.objectiveSummary.message}</p>
        </ModalComponent>
      )}

      {gameState.modals?.story.isOpen && (
        <ModalComponent
          title={gameState.modals.story.title}
          isOpen={gameState.modals.story.isOpen}
          onClose={handlePostGame}
          singleActionText={
            (playerDetails?.health > 0)
            ? "Claim Your Legend"
            : "Try Again"
          }
          isStoryModal={true}
          textToNarrate={`${gameState.modals.story.title}. ${gameState.modals.story.text}`}
        >
          <p className="whitespace-pre-wrap">{gameState.modals.story.text}</p>
        </ModalComponent>
      )}
      
      {gameState.showNGPlusRewardModal && gameState.modals?.ngPlusReward.isOpen && (
        <ModalComponent
          isOpen={gameState.modals.ngPlusReward.isOpen}
          title={gameState.modals.ngPlusReward.title}
          onClose={() => { /* Choices handle closing */ }}
          choices={gameState.modals.ngPlusReward.choices?.map(choice => ({
            text: choice.text,
            callback: () => {
              handleNGPlusReward(choice.text.includes("Health") ? 'health' : 'gold');
            }
          }))}
        >
          <p className="whitespace-pre-wrap">{gameState.modals.ngPlusReward.text}</p>
        </ModalComponent>
      )}

      {isManualModalOpen && (
        <ModalComponent
            title="Wild Lands Game Manual"
            isOpen={isManualModalOpen}
            onClose={toggleManualModal}
            singleActionText="Close Manual"
        >
          <ManualContent
            isManualPreloading={isManualPreloading}
            manualPreloadProgress={manualPreloadProgress}
            handlePreloadAllAssets={handlePreloadAllAssets}
            areAllAssetsPreloaded={areAllAssetsPreloaded}
          />
        </ModalComponent>
      )}
      {isAboutDevsModalOpen && (
        <ModalComponent
          title="About The Devs"
          isOpen={isAboutDevsModalOpen}
          onClose={toggleAboutDevsModal}
          singleActionText="Close"
        >
          {aboutDevsContent}
        </ModalComponent>
      )}
      
      {isTTSModalOpen && (
        <TTSModalComponent
          isOpen={isTTSModalOpen}
          onClose={toggleTTSModal}
        />
      )}

      {isStatsModalOpen && lifetimeStats && (
        <StatsModalComponent
          isOpen={isStatsModalOpen}
          onClose={toggleStatsModal}
          stats={lifetimeStats}
          onReset={handleResetStats}
        />
      )}

      {isSaveModalOpen && gameState && (
        <SaveGameModalComponent
          isOpen={isSaveModalOpen}
          onClose={toggleSaveModal}
          gameState={gameState}
          onSave={saveGame}
          onLoad={loadGame}
          onDelete={deleteGame}
          onExport={downloadGame}
          onNewGame={handleNewGame}
          onImportAndLoad={uploadAndLoadGame}
        />
      )}

      {gameState.status === 'setup' && ngPlusButtonsVisible && (
        <div className="absolute left-4 top-4 flex flex-col items-start gap-2 z-[500]">
          <button
              onClick={() => handleStartSpecificNGPlus(1)}
              className="button !bg-yellow-600 hover:!bg-yellow-700 !text-white !border-yellow-800 text-xs py-1 px-2"
              title="Start a test game at NG+1"
          >
              Test NG+1
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(10)}
              className="button !bg-orange-600 hover:!bg-orange-700 !text-white !border-orange-800 text-xs py-1 px-2"
              title="Start a test game at NG+10"
          >
              Test NG+10
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(20)}
              className="button !bg-red-600 hover:!bg-red-700 !text-white !border-red-800 text-xs py-1 px-2"
              title="Start a test game at NG+20"
          >
              Test NG+20
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(30)}
              className="button !bg-purple-700 hover:!bg-purple-800 !text-white !border-purple-900 text-xs py-1 px-2"
              title="Start a test game at NG+30"
          >
              Test NG+30
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(40)}
              className="button !bg-indigo-700 hover:!bg-indigo-800 !text-white !border-indigo-900 text-xs py-1 px-2"
              title="Start a test game at NG+40"
          >
              Test NG+40
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(50)}
              className="button !bg-cyan-700 hover:!bg-cyan-800 !text-white !border-cyan-900 text-xs py-1 px-2"
              title="Start a test game at NG+50"
          >
              Test NG+50
          </button>
        </div>
      )}
      
      {isGameActive && (
        <div className="absolute top-4 right-4 z-[500]" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <button
              id="gameMenuButton"
              onClick={toggleGameMenu}
              className="button !bg-slate-600 hover:!bg-slate-700 !text-white !border-slate-800 text-xs py-1 px-2"
              title="Open the game menu."
              aria-haspopup="true"
              aria-expanded={isGameMenuOpen}
            >
              Menu
            </button>
            {isGameMenuOpen && (
              <div 
                className="absolute top-full right-0 mt-2 w-48 bg-[var(--panel-bg)] border-[var(--panel-border)] rounded-md shadow-lg py-1"
                role="menu"
              >
                <button
                  onClick={() => { toggleSaveModal(); setIsGameMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  Save / Load
                </button>
                <button
                  onClick={() => { toggleManualModal(); setIsGameMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  Manual
                </button>
                <button
                  onClick={() => { toggleAboutDevsModal(); setIsGameMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  About The Devs
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {gameState.status === 'setup' && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-[500]" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <button
              onClick={toggleSetupMenu}
              className="button !bg-slate-600 hover:!bg-slate-700 !text-white !border-slate-800 text-xs py-1 px-2"
              title="Open the game menu."
              aria-haspopup="true"
              aria-expanded={isSetupMenuOpen}
            >
              Menu
            </button>
            {isSetupMenuOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-48 bg-[var(--panel-bg)] border-[var(--panel-border)] rounded-md shadow-lg py-1"
                role="menu"
              >
                <button
                  onClick={() => { toggleSaveModal(); setIsSetupMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  Save / Load
                </button>
                <button
                  onClick={() => { toggleStatsModal(); setIsSetupMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  Stats
                </button>
                <button
                  onClick={() => { toggleManualModal(); setIsSetupMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  Manual
                </button>
                <button
                  onClick={() => { toggleAboutDevsModal(); setIsSetupMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--ink-main)] hover:bg-stone-300 block font-pulp-title"
                  role="menuitem"
                >
                  About The Devs
                </button>
              </div>
            )}
          </div>
          {!gameState.pedometerFeatureEnabledByUser && (
            <button
              onClick={() => {
                soundManager.playSound('ui_button_click');
                enablePedometerFeature();
              }}
              className="button !bg-slate-600 hover:!bg-slate-700 !text-white !border-slate-800 text-xs py-1 px-2"
              title="Pedometer function is entirely voluntary and uses GPS. No location data is saved or transmitted externally from your device by this application."
            >
              Enable Pedometer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
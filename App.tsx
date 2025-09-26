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
        <div className="absolute bottom-20 right-0 bg-[var(--paper-bg)] p-4 rounded-md shadow-lg w-80 border-2 border-[var(--ink-main)] text-[var(--ink-main)]">
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
    showEndTurnFade,
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
  } = useGameState();
  
  const [tutorialState, setTutorialState] = useState({ active: false, step: 0 });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isTTSModalOpen, setIsTTSModalOpen] = useState(false);
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
  const [isAssetsInitialized, setIsAssetsInitialized] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isManualPreloading, setIsManualPreloading] = useState(false);
  const [manualPreloadProgress, setManualPreloadProgress] = useState(0);
  const [ngPlusButtonsVisible, setNgPlusButtonsVisible] = useState(false);

  const storyGenerationInProgress = useRef(false);

  const toggleTTSModal = () => {
    soundManager.playSound('ui_button_click');
    setIsTTSModalOpen(prev => !prev);
  }

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

  useEffect(() => {
    setLifetimeStats(loadLifetimeStats());
  }, []);
  
  useEffect(() => {
    const initAndPreload = async () => {
      if (isAssetsInitialized || !lifetimeStats) return;

      console.log("Initializing asset managers...");
      await soundManager.init();
      setIsAssetsInitialized(true);
      console.log("Asset managers initialized.");

      const storedVersion = localStorage.getItem('preloaded_app_version_WWS');
      if (storedVersion !== APP_VERSION) {
        console.log(`New app version (${APP_VERSION}) detected. Clearing asset preload cache.`);
        localStorage.removeItem('preloaded_themes_WWS');
        localStorage.setItem('preloaded_app_version_WWS', APP_VERSION);
      }
      
      const highestLevelReached = lifetimeStats.highestNGPlusLevel || 0;
      const themesToLoad = getThemesForLevel(highestLevelReached);
      const preloadedThemes = JSON.parse(localStorage.getItem('preloaded_themes_WWS') || '[]');
      const themesThatNeedLoading = themesToLoad.filter(theme => !preloadedThemes.includes(theme));

      if (themesThatNeedLoading.length > 0) {
        setIsBackgroundLoading(true);

        if (themesThatNeedLoading.includes('common')) {
          console.log("Preloading high-priority common assets...");
          await imageManager.preloadThemes(['common']);
          await soundManager.preloadThemes(['common']);
          
          const updatedPreloaded = [...new Set([...preloadedThemes, 'common'])];
          localStorage.setItem('preloaded_themes_WWS', JSON.stringify(updatedPreloaded));
          console.log("Common assets loaded, UI should be responsive.");
        }

        const otherThemesToLoad = themesThatNeedLoading.filter(t => t !== 'common');
        if (otherThemesToLoad.length > 0) {
          console.log(`Preloading background assets for: ${otherThemesToLoad.join(', ')}`);
          Promise.all([
            imageManager.preloadThemes(otherThemesToLoad as ImageTheme[]),
            soundManager.preloadThemes(otherThemesToLoad as SoundTheme[])
          ]).then(() => {
            const currentPreloaded = JSON.parse(localStorage.getItem('preloaded_themes_WWS') || '[]');
            const newlyLoaded = [...new Set([...currentPreloaded, ...otherThemesToLoad])];
            localStorage.setItem('preloaded_themes_WWS', JSON.stringify(newlyLoaded));
            console.log(`Background asset preload complete for: ${otherThemesToLoad.join(', ')}`);
            
            setIsBackgroundLoading(false);
          });
        } else {
          setIsBackgroundLoading(false);
        }
      }
    };
    initAndPreload();
  }, [isAssetsInitialized, lifetimeStats]);

  useEffect(() => {
    if (gameState) {
      const ngPlusLevel = gameState.ngPlusLevel;
      const themeClass10 = 'ng-plus-10-theme';
      const themeClass20 = 'ng-plus-20-theme';
      const themeClass30 = 'ng-plus-30-theme';
      const themeClass40 = 'ng-plus-40-theme';
      
      const bodyClassList = document.body.classList;
      const allThemes = [themeClass10, themeClass20, themeClass30, themeClass40, 'ng-plus-50-theme'];

      let landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image.png';
      let portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image2.png';
      let themeToApply: string | null = null;

      if (ngPlusLevel >= 10 && ngPlusLevel < 20) {
        themeToApply = themeClass10;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_fj.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_fj2.png';
      } else if (ngPlusLevel >= 20 && ngPlusLevel < 30) {
        themeToApply = themeClass20;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_as.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_as2.png';
      } else if (ngPlusLevel >= 30 && ngPlusLevel < 40) {
        themeToApply = themeClass30;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_sh.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_sh2.png';
      } else if (ngPlusLevel >= 40 && ngPlusLevel < 50) {
        themeToApply = themeClass40;
        landscapeUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_cp.png';
        portraitUrl = 'https://storage.googleapis.com/wild-lands-card-images/background_image_cp2.png';
      }

      const updateBackgrounds = () => {
        const cachedLandscape = imageManager.getCachedUrl(landscapeUrl);
        const cachedPortrait = imageManager.getCachedUrl(portraitUrl);
        document.body.style.setProperty('--bg-landscape', `url(${cachedLandscape})`);
        document.body.style.setProperty('--bg-portrait', `url(${cachedPortrait})`);
      };
      updateBackgrounds();
      
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

    const isBossActive = gameState.activeEvent?.id === gameState.aiBoss?.id;

    switch (gameState.status) {
      case 'landing':
        soundManager.stopMusic();
        break;
      case 'setup':
      case 'generating_boss_intro':
      case 'showing_boss_intro':
        {
            const ngPlusLevel = gameState.ngPlusLevel;
            let setupMusic: 'music_setup' | 'music_setup_fj' | 'music_setup_as' | 'music_setup_sh' | 'music_setup_cp' = 'music_setup';
            if (ngPlusLevel >= 50) {
                setupMusic = 'music_setup';
            } else if (ngPlusLevel >= 40) {
                setupMusic = 'music_setup_cp';
            } else if (ngPlusLevel >= 30) {
                setupMusic = 'music_setup_sh';
            } else if (ngPlusLevel >= 20) {
                setupMusic = 'music_setup_as';
            } else if (ngPlusLevel >= 10) {
                setupMusic = 'music_setup_fj';
            }
            soundManager.playMusic(setupMusic);
        }
        break;
      case 'playing':
      case 'playing_initial_reveal':
        if (isBossActive) {
          soundManager.playMusic('music_boss');
        } else {
            // FIX: The previous logic incorrectly used theme-specific setup music for the main gameplay loop.
            // Since there is only one dedicated "main" track, we will use it for all non-boss gameplay
            // to ensure a consistent and appropriate gameplay tempo, addressing the user's feedback.
            soundManager.playMusic('music_main');
        }
        break;
      case 'finished':
        if (gameState.playerDetails[PLAYER_ID]?.health > 0) {
          soundManager.playMusic('music_victory');
        } else {
          soundManager.playMusic('music_defeat');
        }
        break;
      default:
        soundManager.stopMusic();
        break;
    }
  }, [gameState?.status, gameState?.activeEvent?.id, gameState?.aiBoss?.id, isAssetsInitialized, gameState?.ngPlusLevel]);
  
  useEffect(() => {
    if (gameState?.status !== 'finished') {
        storyGenerationInProgress.current = false;
    }
  }, [gameState?.status]);

  useEffect(() => {
    if (gameState?.status === 'finished' && !gameState.storyGenerated && !storyGenerationInProgress.current) {
        storyGenerationInProgress.current = true;
        
        // Start pre-generating assets for the next level in the background on victory
        if (gameState.playerDetails[PLAYER_ID]?.health > 0) {
            startNextLevelRemix();
        }

        const storyPromise = generateStoryForGame(gameState);
        
        const showEndGameModal = async () => {
            const player = gameState.playerDetails[PLAYER_ID];
            if (!player) {
                storyGenerationInProgress.current = false;
                return;
            }
            
            const isVictory = player.health > 0;
            const title = isVictory ? 'A Legend is Born' : 'The End of the Trail';
            let text = '';
            
            handleCardAction('SHOW_MODAL', { modalType: 'story', title: '', text: '' });
            
            try {
                text = await storyPromise;
            } catch(error) {
                console.error(`Failed to generate story: ${error}`);
                text = isVictory 
                    ? 'Your tale is written in deeds, not words.' 
                    : (gameState.winReason || 'Your journey has ended.');
            }
 
            handleCardAction('SHOW_MODAL', { modalType: 'story', title, text });
        };
        showEndGameModal();
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
    
    localStorage.setItem('preloaded_themes_WWS', JSON.stringify(ALL_IMAGE_THEMES));

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
    <div className={containerClasses} onClick={deselectAllCards} aria-live="polite">
      {isBackgroundLoading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-800/80 text-white font-pulp-title px-4 py-2 rounded-md shadow-lg z-[6000]">
          Preloading assets...
        </div>
      )}
      <SoundControls toggleTTSModal={toggleTTSModal} />
      {tutorialState.active && (
        <TutorialComponent 
          step={tutorialState.step} 
          onNext={advanceTutorial} 
          onEnd={endTutorial} 
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
        showEndTurnFade={showEndTurnFade}
        activeGameBanner={gameState.activeGameBanner}
        activeSkunkSpray={gameState.skunkSprayVisualActive} 
        playerDetails={playerDetails}
      />

      {gameState.isLoadingNGPlus && <NGPlusLoadingComponent isLoading={true} ngPlusLevel={gameState.ngPlusLevel} />}

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

      {gameState.status === 'setup' && (
        <div className="absolute left-4 top-4 flex flex-col items-start gap-2 z-[500]">
          <button
            onClick={() => {
              soundManager.playSound('ui_button_click');
              fullResetGame();
            }}
            className="button !bg-red-800 hover:!bg-red-900 !text-white !border-red-900 text-xs py-1 px-2"
            title="Reset all progress and start a new game at NG+0. Lifetime stats will be preserved."
          >
            Reset
          </button>
          <button
            onClick={toggleStatsModal}
            className="button !bg-blue-800 hover:!bg-blue-900 !text-white !border-blue-900 text-xs py-1 px-2"
            title="View your lifetime statistics for all playthroughs."
          >
            View Stats
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(1)}
              className={`${!ngPlusButtonsVisible ? 'hidden' : ''} button !bg-yellow-600 hover:!bg-yellow-700 !text-white !border-yellow-800 text-xs py-1 px-2`}
              title="Start a test game at NG+1"
          >
              Test NG+1
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(10)}
              className={`${!ngPlusButtonsVisible ? 'hidden' : ''} button !bg-orange-600 hover:!bg-orange-700 !text-white !border-orange-800 text-xs py-1 px-2`}
              title="Start a test game at NG+10"
          >
              Test NG+10
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(20)}
              className={`${!ngPlusButtonsVisible ? 'hidden' : ''} button !bg-red-600 hover:!bg-red-700 !text-white !border-red-800 text-xs py-1 px-2`}
              title="Start a test game at NG+20"
          >
              Test NG+20
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(30)}
              className={`${!ngPlusButtonsVisible ? 'hidden' : ''} button !bg-purple-700 hover:!bg-purple-800 !text-white !border-purple-900 text-xs py-1 px-2`}
              title="Start a test game at NG+30"
          >
              Test NG+30
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(40)}
              className={`${!ngPlusButtonsVisible ? 'hidden' : ''} button !bg-indigo-700 hover:!bg-indigo-800 !text-white !border-indigo-900 text-xs py-1 px-2`}
              title="Start a test game at NG+40"
          >
              Test NG+40
          </button>
          <button
              onClick={() => handleStartSpecificNGPlus(50)}
              className={`${!ngPlusButtonsVisible ? 'hidden' : ''} button !bg-cyan-700 hover:!bg-cyan-800 !text-white !border-cyan-900 text-xs py-1 px-2`}
              title="Start a test game at NG+50"
          >
              Test NG+50
          </button>
        </div>
      )}
      
      {(gameState.status === 'setup' || isGameActive) && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-[500]">
          <button
            onClick={toggleManualModal}
            className="button !bg-slate-600 hover:!bg-slate-700 !text-white !border-slate-800 text-xs py-1 px-2"
            title="Open the game manual."
          >
            Manual
          </button>
          {gameState.status === 'setup' && (
            <button
              onClick={toggleAboutDevsModal}
              className="button !bg-slate-600 hover:!bg-slate-700 !text-white !border-slate-800 text-xs py-1 px-2"
              title="Learn about the creators."
            >
              About The Devs
            </button>
          )}
          {gameState.status === 'setup' && !gameState.pedometerFeatureEnabledByUser && (
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
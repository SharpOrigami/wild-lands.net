import React, { useState, useEffect, useRef } from 'react';
import { Character, CardContext, PlayerDetails } from '../types.ts';
import { CHARACTERS_LIST, CURRENT_CARDS_DATA, INITIAL_PLAYER_STATE_TEMPLATE, PERSONALITY_TRAITS, PERSONALITY_MODIFIERS } from '../constants.ts';
import CardComponent from '../components/CardComponent.tsx';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';
import { CHEAT_CODES, CHEAT_ADD_GOLD_AMOUNT, POP_CULTURE_CHEATS, PopCultureCheatEffect } from '../utils/cheatCodes.ts';

interface SetupScreenProps {
  playerDetails: PlayerDetails;
  onSelectCharacter: (character: Character) => void;
  onConfirmName: (name: string) => void;
  onStartGame: (name: string, character: Character, cheatEffects?: PopCultureCheatEffect) => void;
  ngPlusLevel: number;
  isLoadingBossIntro: boolean;
  onSetPersonality: (traits: { archetype?: string; temperament?: string; motivation?: string; }) => void;
  onEnableCheats: () => void;
  onCheatAddGold: (amount: number) => void;
  onCheatIncreaseDifficulty: () => void;
  onCheatAddMaxHealth: () => void;
  onCheatRemixDeck: () => void;
  gameJustStarted: boolean;
  onAcknowledgeGameStart: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  playerDetails: playerDetailsProp,
  onSelectCharacter,
  onConfirmName,
  onStartGame,
  ngPlusLevel,
  isLoadingBossIntro,
  onSetPersonality,
  onEnableCheats,
  onCheatAddGold,
  onCheatIncreaseDifficulty,
  onCheatAddMaxHealth,
  onCheatRemixDeck,
  gameJustStarted,
  onAcknowledgeGameStart,
}) => {
  const { character: selectedCharacter, name: initialCharacterName, cumulativeNGPlusMaxHealthBonus, health, personality } = playerDetailsProp;
  const [nameInput, setNameInput] = useState(initialCharacterName || '');
  const justEnteredCheatRef = useRef(false);

  useEffect(() => {
    if (gameJustStarted) {
      const welcomeMessages = [
        `Welcome to the Wild Lands.`,
        `The frontier is a harsh mistress. Choose your character and prepare for the journey ahead.`
      ];
      // Increased delay to provide a more reliable buffer for the TTS engine
      // to initialize on mobile devices after the user's first interaction,
      // preventing a race condition that could cause speech to fail.
      const timer = setTimeout(() => {
        ttsManager.speakLogs(welcomeMessages);
        onAcknowledgeGameStart();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameJustStarted, onAcknowledgeGameStart]);

  let talkSuccessChance = 0;
  let petSuccessChance = 0;

  if (selectedCharacter && personality) {
    const talkFailurePoints = (selectedCharacter.talkSkill || 0) +
        (PERSONALITY_MODIFIERS[personality.archetype]?.talk || 0) +
        (PERSONALITY_MODIFIERS[personality.temperament]?.talk || 0) +
        (PERSONALITY_MODIFIERS[personality.motivation]?.talk || 0);

    const petFailurePoints = (selectedCharacter.petSkill || 0) +
        (PERSONALITY_MODIFIERS[personality.archetype]?.pet || 0) +
        (PERSONALITY_MODIFIERS[personality.temperament]?.pet || 0) +
        (PERSONALITY_MODIFIERS[personality.motivation]?.pet || 0);

    const talkFailureChance = talkFailurePoints;
    const petFailureChance = petFailurePoints;

    talkSuccessChance = 100 - talkFailureChance;
    petSuccessChance = 100 - petFailureChance;
  }

  useEffect(() => {
    if (selectedCharacter && health === 0) {
      onSelectCharacter(selectedCharacter);
    }
  }, [selectedCharacter, health, onSelectCharacter]);

  useEffect(() => {
    if (justEnteredCheatRef.current) {
        justEnteredCheatRef.current = false;
        return;
    }
    if (selectedCharacter) {
      if (initialCharacterName && nameInput !== initialCharacterName) {
        setNameInput(initialCharacterName);
      }
    }
    else if (selectedCharacter && !nameInput && initialCharacterName) {
        setNameInput(initialCharacterName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter, initialCharacterName]);

  useEffect(() => {
     if (justEnteredCheatRef.current) {
        justEnteredCheatRef.current = false;
        return;
    }
    if (!selectedCharacter || (selectedCharacter && nameInput !== initialCharacterName)) {
        setNameInput(initialCharacterName || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCharacterName]);


  const handleStartGameClick = () => {
    if (isLoadingBossIntro) return;
    soundManager.playSound('ui_button_click');
    const trimmedName = nameInput.trim();

    if (trimmedName && selectedCharacter) {
      // Check for pop culture cheats that require a specific name and character
      const cheat = POP_CULTURE_CHEATS.find(c =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.requiredCharacterId === selectedCharacter.id
      );

      onConfirmName(trimmedName);
      onStartGame(trimmedName, selectedCharacter, cheat?.effects);
    } else if (!trimmedName) {
      alert("Please enter a name for your character.");
    } else if (!selectedCharacter) {
      alert("Please select a character.");
    }
  };

  const handleStartGameSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleStartGameClick();
  };

  const getCharacterDescription = (character: Character | null, talkSuccess: number, petSuccess: number) => {
    if (!character) return '';

    let charHealth = character.health + (cumulativeNGPlusMaxHealthBonus || 0);
    charHealth = Math.max(1, charHealth);

    let desc = `<p class="font-bold text-lg text-[var(--ink-main)]">${character.name}</p>`;
    desc += `<p class="text-sm italic text-[var(--ink-secondary)] mb-2">Health: ${charHealth}, Gold: ${playerDetailsProp.gold}, <span style="color: var(--faded-blue)">Talk: ${talkSuccess}%</span>, <span style="color: var(--faded-blue)">Pet: ${petSuccess}%</span></p>`;
    
    if (character.description) {
      desc += `<p class="my-2 text-sm text-[var(--ink-main)]">${character.description}</p>`;
    }

    const starterDeckNames = character.starterDeck
        .map(id => CURRENT_CARDS_DATA[id]?.name || 'Unknown Card')
        .join(', ');
    desc += `<p class="mt-2 font-semibold">Starts with:</p><p class="text-xs">${starterDeckNames}</p>`;
    return desc;
  };

  const sortedCharacters = [...CHARACTERS_LIST].sort((a,b) => b.health - a.health);

  const getNameInputFontClass = (name: string): string => {
    const length = name ? name.length : 0;
    const fontClasses = [
      'font-signature-l1',
      'font-signature-l2',
      'font-signature-l3',
      'font-signature-l4',
      'font-signature-l5plus'
    ];

    if (length === 0) return fontClasses[4];
    if (length === 1) return fontClasses[0];
    if (length === 2) return fontClasses[1];
    if (length === 3) return fontClasses[2];
    if (length === 4) return fontClasses[3];
    return fontClasses[(length - 1) % 5];
  };
  const nameInputFontClass = getNameInputFontClass(nameInput);
  
  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.toLowerCase() === CHEAT_CODES.ADD_GOLD) {
        justEnteredCheatRef.current = true;
        onCheatAddGold(CHEAT_ADD_GOLD_AMOUNT);
        setNameInput('');
        return;
    }
    if (value.toLowerCase() === CHEAT_CODES.UNLOCK_NG) {
        justEnteredCheatRef.current = true;
        onEnableCheats();
        setNameInput('');
        return;
    }
    if (value.toLowerCase() === CHEAT_CODES.INCREASE_EVENT_DIFFICULTY) {
        justEnteredCheatRef.current = true;
        onCheatIncreaseDifficulty();
        setNameInput('');
        return;
    }
    if (value.toLowerCase() === CHEAT_CODES.ADD_MAX_HEALTH) {
        justEnteredCheatRef.current = true;
        onCheatAddMaxHealth();
        setNameInput('');
        return;
    }
    if (value.toLowerCase() === CHEAT_CODES.REMIX_DECK) {
        justEnteredCheatRef.current = true;
        onCheatRemixDeck();
        setNameInput('');
        return;
    }

    setNameInput(value);
  };

  return (
    <div id="setupScreenContainer" className="flex flex-col items-center">
      <div className="text-center mb-4">
          <h1 className="text-4xl font-western text-stone-200" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 5px rgba(0,0,0,0.7)' }}>Wild Lands</h1>
          <h2 className="text-lg font-pulp-title text-stone-300" style={{ textShadow: '1px 1px 2px #000' }}>A Deckbuilding Game</h2>
      </div>
      
      <h2 className="text-2xl font-western text-center text-stone-200 mb-4" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 5px rgba(0,0,0,0.7)' }}>Choose Your Character</h2>
      
      <div
        id="characterCardGrid"
        className="grid grid-cols-2 sm:grid-cols-4 justify-items-center mb-4 w-full gap-2 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5"
      >
        {sortedCharacters.map(char => {
          let displayHealth = char.health + (cumulativeNGPlusMaxHealthBonus || 0);
          displayHealth = Math.max(1, displayHealth);

          return (
            <CardComponent
              key={char.id}
              card={{...char, health: displayHealth, type: 'Player Upgrade' } as any} 
              context={CardContext.CHARACTER_SELECTION}
              onClick={() => onSelectCharacter(char)}
              isSelected={selectedCharacter?.id === char.id}
              playerDetails={{ ...INITIAL_PLAYER_STATE_TEMPLATE, character: char, ngPlusLevel: ngPlusLevel, cumulativeNGPlusMaxHealthBonus: cumulativeNGPlusMaxHealthBonus || 0 } as PlayerDetails}
            />
          );
        })}
      </div>

      {selectedCharacter && (
          <div
            id="characterInteractivePanel"
            className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto flex flex-col gap-4 p-4 bg-[var(--paper-bg)] text-[var(--ink-main)] rounded-lg shadow-lg mt-2 border-2 border-[var(--border-color)]"
          >
            {ngPlusLevel > 0 && (
              <p className="text-center text-yellow-600 font-western text-2xl">
                NG+{ngPlusLevel}
              </p>
            )}
            <div
              id="characterDescription"
              className="p-3 bg-black/5 rounded shadow-inner min-h-[4rem] text-sm max-h-72 overflow-y-auto border border-dashed border-[var(--border-color)]"
              aria-live="polite"
              dangerouslySetInnerHTML={{ __html: getCharacterDescription(selectedCharacter, talkSuccessChance, petSuccessChance) }}
            />

            <div id="personalitySelectors" className="mt-4 flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex flex-col">
                <label htmlFor="archetype-select" className="text-xs font-pulp-title text-[var(--ink-main)] mb-1">Archetype</label>
                <select
                  id="archetype-select"
                  className="p-1 border border-[#8c6b4f] rounded text-sm text-stone-800 bg-white"
                  value={playerDetailsProp.personality?.archetype || ''}
                  onChange={(e) => onSetPersonality({ archetype: e.target.value })}
                >
                  {PERSONALITY_TRAITS.archetype.map(trait => <option key={trait} value={trait}>{trait}</option>)}
                </select>
              </div>
              <div className="flex-1 flex flex-col">
                <label htmlFor="temperament-select" className="text-xs font-pulp-title text-[var(--ink-main)] mb-1">Temperament</label>
                <select
                  id="temperament-select"
                  className="p-1 border border-[#8c6b4f] rounded text-sm text-stone-800 bg-white"
                  value={playerDetailsProp.personality?.temperament || ''}
                  onChange={(e) => onSetPersonality({ temperament: e.target.value })}
                >
                  {PERSONALITY_TRAITS.temperament.map(trait => <option key={trait} value={trait}>{trait}</option>)}
                </select>
              </div>
              <div className="flex-1 flex flex-col">
                <label htmlFor="motivation-select" className="text-xs font-pulp-title text-[var(--ink-main)] mb-1">Motivation</label>
                <select
                  id="motivation-select"
                  className="p-1 border border-[#8c6b4f] rounded text-sm text-stone-800 bg-white"
                  value={playerDetailsProp.personality?.motivation || ''}
                  onChange={(e) => onSetPersonality({ motivation: e.target.value })}
                >
                  {PERSONALITY_TRAITS.motivation.map(trait => <option key={trait} value={trait}>{trait}</option>)}
                </select>
              </div>
            </div>

            <form
              id="namePromptAndStart"
              className="mt-auto pt-4 border-t border-[var(--border-color)] flex flex-col items-center gap-3"
              onSubmit={handleStartGameSubmit}
            >
              <input
                type="text"
                id="characterNameInput"
                placeholder="Enter your character's name"
                aria-label="Character's Name"
                className={`p-2 border border-[#8c6b4f] rounded ${nameInputFontClass} text-2xl text-stone-800 bg-white w-full max-w-xs text-center`}
                value={nameInput}
                onChange={handleNameInputChange}
              />
              <button
                id="startGameButton"
                type="submit"
                className="text-lg px-4 py-2 rounded-sm shadow-md transition-all duration-150 ease-out font-['Special_Elite'] uppercase tracking-wider bg-[var(--paper-bg)] text-[var(--ink-main)] border border-[var(--ink-main)] hover:bg-stone-300 hover:border-[var(--ink-main)] focus:ring-2 focus:ring-[var(--ink-main)] focus:ring-offset-1 focus:ring-offset-[var(--paper-bg)] disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:cursor-not-allowed w-full max-w-xs"
                onClick={handleStartGameClick}
                disabled={!nameInput.trim() || !selectedCharacter || isLoadingBossIntro}
              >
                {isLoadingBossIntro ? "Loading..." : "Start Game"}
              </button>
            </form>
          </div>
        )}
    </div>
  );
};

export default SetupScreen;
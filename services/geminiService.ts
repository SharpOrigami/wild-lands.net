import { GameState, LogEntry, CardData, AIBossData, Character, PlayerDetails } from '../types.ts';
import { ALL_CARDS_DATA_MAP, PLAYER_ID } from '../constants.ts';
import { getThemeSuffix } from '../utils/themeUtils.ts';

const API_BASE_URL = 'https://wild-lands-backend-service-757227038530.us-east1.run.app/'; // Updated to user's Cloud Run URL

// Helper function for making API calls to the backend
async function callBackendAPI<T>(endpoint: string, body: any, log?: (message: string, type?: LogEntry['type']) => void): Promise<T> {
  const MAX_RETRIES = 4;
  let attempt = 0;
  let delay = 1500; // Start with 1.5 seconds

  const endpointsRequiringData = ['api/generate-story', 'api/remix-cards', 'api/generate-ai-boss', 'api/generate-boss-intro', 'api/generate-remixed-weapon'];

  // Normalize endpoint for check
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const requiresData = endpointsRequiringData.includes(normalizedEndpoint);

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const responseText = await response.text();
        const isResponseEmpty = responseText.length === 0 || responseText === '{}' || responseText === 'null';

        if (requiresData && isResponseEmpty) {
          if (attempt < MAX_RETRIES) {
            const jitter = Math.random() * 500;
            const backoffDelay = delay + jitter;
            if (log) log(`Backend call to ${endpoint} returned an empty success response. Retrying... (Attempt ${attempt}/${MAX_RETRIES})`, "error");
            await new Promise(res => setTimeout(res, backoffDelay));
            delay *= 2;
            continue;
          } else {
            throw new Error(`Backend API call to ${endpoint} returned empty data after ${MAX_RETRIES} attempts.`);
          }
        }
        
        if (responseText.length === 0) {
          return {} as T;
        }
        return JSON.parse(responseText) as T;
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const jitter = Math.random() * 500;
        const backoffDelay = delay + jitter;
        if (log) log(`Backend API call to ${endpoint} failed with status ${response.status}. Retrying in ~${(backoffDelay / 1000).toFixed(1)}s... (Attempt ${attempt}/${MAX_RETRIES})`, "error");
        await new Promise(res => setTimeout(res, backoffDelay));
        delay *= 2;
        continue;
      }

      let detailedErrorMessage = `Backend API call to ${endpoint} failed: ${response.status} ${response.statusText}`;
      if (attempt >= MAX_RETRIES && response.status >= 500) {
        detailedErrorMessage += ` (Failed after ${MAX_RETRIES} attempts)`;
      }

      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const jsonError = JSON.parse(errorText);
            const backendError = jsonError.error || 'Unknown backend error';
            const backendDetails = jsonError.details || 'No details provided';
            detailedErrorMessage += ` - Backend Error: "${backendError}", Details: "${backendDetails}"`;
          } catch (parseError) {
            detailedErrorMessage += ` - Raw backend response: ${errorText}`;
          }
        } else {
          detailedErrorMessage += ` - Empty error response from backend.`;
        }
      } catch (textError) {
        detailedErrorMessage += ` - Could not read error response body.`;
      }
      
      if (log) log(detailedErrorMessage, "error");
      throw new Error(detailedErrorMessage);

    } catch (error) {
      const errorMessageString = error instanceof Error ? error.message : String(error);
      
      if (attempt < MAX_RETRIES) {
        const jitter = Math.random() * 500;
        const backoffDelay = delay + jitter;
        if (log) log(`Error calling backend API ${endpoint}: ${errorMessageString}. Retrying in ~${(backoffDelay / 1000).toFixed(1)}s... (Attempt ${attempt}/${MAX_RETRIES})`, "error");
        await new Promise(res => setTimeout(res, backoffDelay));
        delay *= 2;
        continue;
      }

      const finalNetworkErrorMsg = `Error calling backend API ${endpoint} after ${MAX_RETRIES} attempts: ${errorMessageString}`;
      console.error(finalNetworkErrorMsg);
      if (log) log(finalNetworkErrorMsg, "error");
      
      throw new Error(finalNetworkErrorMsg);
    }
  }

  throw new Error(`Exited retry loop for ${endpoint} unexpectedly.`);
}


export async function generateStoryForGame(gameState: GameState): Promise<string> {
  try {
    // Create a deep copy to avoid modifying the original state.
    const processedGameState = JSON.parse(JSON.stringify(gameState));
    
    // Conditionally remove stats if they are 0 or less.
    if (processedGameState.playerDetails && processedGameState.playerDetails[PLAYER_ID]) {
      const runStats = processedGameState.playerDetails[PLAYER_ID].runStats;
      if (runStats) {
        if (!runStats.animalsPet || runStats.animalsPet <= 0) {
          delete runStats.animalsPet;
        }
        if (!runStats.deEscalations || runStats.deEscalations <= 0) {
          delete runStats.deEscalations;
        }
        if (!runStats.laudanumAbuse || runStats.laudanumAbuse <= 0) {
          delete runStats.laudanumAbuse;
        }
      }
    }

    const response = await callBackendAPI<{story: string}>('api/generate-story', { gameState: processedGameState });
    return response.story;
  } catch (error) {
    console.error("Error generating story via backend:", error);
    return "The ink ran dry, and the prairie wind scattered the pages... (Backend Error). Your tale remains untold, but your deeds are remembered.";
  }
}

export async function generateStoriesForMultipleGames(gameStates: GameState[]): Promise<PromiseSettledResult<string>[]> {
  if (!gameStates || gameStates.length === 0) {
    return [];
  }

  // Each call to generateStoryForGame will now make a separate request to the backend.
  // For a large number of concurrent requests, consider a batch endpoint on the backend.
  const storyPromises = gameStates.map(gs =>
    generateStoryForGame(gs)
      .then(story => ({ status: 'fulfilled', value: story } as PromiseFulfilledResult<string>))
      .catch(reason => ({ status: 'rejected', reason } as PromiseRejectedResult))
  );

  return Promise.all(storyPromises);
}


export async function generateAIBossForGame(
    log: (message: string, type?: LogEntry['type']) => void,
    playerCharacter?: Character | null,
    playerName?: string | null,
    ngPlusLevel?: number,
    recentBossNames?: string[]
): Promise<CardData> {
  const fallbackBoss: CardData = { id:'default_boss_fallback', name: 'The Nameless Dread', type: 'Event', subType: 'human', health: 25, goldValue: 50, effect: {type:'damage', amount: 15}, description: "A shadowy figure of legend, spoken of only in hushed whispers. It is said this entity feeds on despair, its presence chilling the very air and twisting familiar trails into nightmarish labyrinths. Every victory against its lesser minions only seems to draw its baleful attention closer." };
  try {
    // Note: The "A great evil awakens..." log is more generic and okay for pre-generation attempt.
    log("A great evil awakens in the west... (via backend)", "system"); 
    const response = await callBackendAPI<CardData>('api/generate-ai-boss', { playerCharacter, playerName, ngPlusLevel, recentBossNames }, log);
    if (response && response.name) {
      // REMOVED: log(`${response.name} has appeared! (via backend)`, "event");
      // The game logic in useGameState will log the boss's "appearance" at a more appropriate time.
      return response;
    }
    log("Received incomplete boss data from backend. Using fallback.", "error");
    return fallbackBoss;
  } catch (error) {
    console.error("Error generating AI boss via backend:", error); 
    log("Failed to generate a unique threat from backend. A familiar foe appears instead.", "error");
    return fallbackBoss;
  }
}

export async function remixCardsForNGPlusGame(
    log: (message: string, type?: LogEntry['type']) => void,
    baseCardsToRemix: { [id: string]: CardData },
    ngPlusLevel: number
): Promise<{ [id: string]: CardData } | null> {
  try {
    log(`The world feels... different. More dangerous. NG+${ngPlusLevel} Remixing cards... (via backend)`, "system");
    const response = await callBackendAPI<{ [id: string]: CardData } | null>('api/remix-cards', { baseCardsToRemix, ngPlusLevel }, log);
    if (response && typeof response === 'object' && Object.keys(response).length > 0) {
        log("The very fabric of the frontier has been reforged by legend! (via backend)", "system");
        return response;
    }
    log("Card remixing via backend returned invalid data or null. No AI remix applied.", "error");
    return null;
  } catch (error) {
    console.error("Error remixing cards via backend:", error);
    log("The legends remain the same... for now. (Card remix failed via backend). No AI remix applied.", "error");
    return null;
  }
}

export async function generateBossIntroStory(
  playerName: string,
  character: Character,
  aiBoss: CardData,
  log: (message: string, type?: LogEntry['type']) => void,
  ngPlusLevel?: number
): Promise<{ title: string; paragraph: string } | null> {
  const fallbackStory = {
    title: "The Weight of the West (Fallback)",
    paragraph: `The grit of the trail clung to ${playerName}'s gear. A new, discordant note had begun to weave its way into the silence of the plains – the name of ${aiBoss?.name || 'a great evil'}. It was a name spoken in hushed tones. For a ${character.name} like ${playerName}, this was personal. A reckoning was due.`
  };
  try {
    log(`Generating intro story for ${playerName} vs ${aiBoss?.name || 'Unknown Boss'}... (via backend)`, "system");
    const response = await callBackendAPI<{ title: string; paragraph: string } | null>('api/generate-boss-intro', { playerName, character, aiBoss, ngPlusLevel }, log);
    if (response && response.title && response.paragraph) {
      log("Boss intro story generated. (via backend)", "system");
      return response;
    }
    log("Generated boss intro story data from backend is incomplete. Using fallback.", "error");
    return fallbackStory;
  } catch (error) {
    console.error("Error generating boss intro story via backend:", error);
    log("Failed to generate boss intro story via backend. Using fallback.", "error");
    return fallbackStory;
  }
}

function getThemedBaseCardId(itemType: string, ngPlusLevel: number): string | null {
  const themeSuffix = getThemeSuffix(ngPlusLevel) || ''; // empty string for western
  
  const baseCardMap: { [key: string]: any } = { // Use any for the nested object
      'themed hat': 'upgrade_cavalry_hat',
      'themed provision': 'provision_miracle_cure_t1',
      'themed fur coat': 'upgrade_bearskin_coat',
      'themed weapon': {
        '': 'item_six_shooter_t1', // western
        '_fj': 'item_katana_t1_fj',
        '_as': 'item_bolt_action_rifle_t1_as',
        '_sh': 'item_hunting_rifle_t1_sh',
        '_cp': 'item_rifle_t1_cp',
      },
      'themed firearm': 'item_rifle_t1',
      'themed bow': 'item_bow_t1',
      'themed bladed weapon': 'item_sharp_knife_t1',
      'themed trap': 'item_large_trap_t1',
  };

  let baseIdEntry = baseCardMap[itemType];
  if (!baseIdEntry) return null;

  let baseId: string;
  if (typeof baseIdEntry === 'object') {
    baseId = baseIdEntry[themeSuffix] || baseIdEntry[''];
  } else {
    baseId = baseIdEntry;
  }
  
  // If the base ID already includes a theme (like for the generic weapon), we're done.
  if (/_fj$|_as$|_sh$|_cp$/.test(baseId)) {
      return ALL_CARDS_DATA_MAP[baseId] ? baseId : null;
  }
  
  // Otherwise, try to append the theme suffix.
  const themedId = `${baseId}${themeSuffix}`;
  if (ALL_CARDS_DATA_MAP[themedId]) {
      return themedId;
  }
  
  // Fallback to the base western card if themed one doesn't exist.
  return ALL_CARDS_DATA_MAP[baseId] ? baseId : null;
}

const localRemixFallback = (baseCard: CardData, log: (message: string, type?: LogEntry['type']) => void): CardData => {
  log("AI remix failed. Performing local fallback remix.", "error");
  const remixedCard = JSON.parse(JSON.stringify(baseCard));

  remixedCard.id = `remixed_local_${baseCard.id}_${Date.now()}`;
  remixedCard.name = `Legendary ${baseCard.name}`;
  remixedCard.description = `A legendary version of ${baseCard.name}, forged in the crucible of necessity when the AI forge fell silent.`;

  // Boost stats
  if (remixedCard.effect) {
    if (remixedCard.effect.type === 'weapon' && typeof remixedCard.effect.attack === 'number') {
      remixedCard.effect.attack = Math.ceil(remixedCard.effect.attack * 1.5) + 1;
    }
    if (remixedCard.effect.type === 'upgrade' && remixedCard.effect.subtype === 'max_health' && typeof remixedCard.effect.amount === 'number') {
      remixedCard.effect.amount += 3;
    }
    if (remixedCard.effect.type === 'upgrade' && remixedCard.effect.subtype === 'damage_negation' && typeof remixedCard.effect.max_health === 'number') {
      remixedCard.effect.max_health += 2;
    }
    if (remixedCard.effect.type === 'heal' && typeof remixedCard.effect.amount === 'number') {
      remixedCard.effect.amount = Math.ceil(remixedCard.effect.amount * 1.5);
    }
    if (remixedCard.effect.type === 'trap' && typeof remixedCard.effect.breakDamage === 'number') {
      remixedCard.effect.breakDamage += 2;
    }
  }

  // Adjust values
  if (remixedCard.sellValue) {
    remixedCard.sellValue = Math.ceil(remixedCard.sellValue * 2.5);
  }
  
  // It's a reward, shouldn't be buyable
  if (remixedCard.buyCost) {
    delete remixedCard.buyCost;
  }

  return remixedCard;
};

export async function generateRemixedWeapon(
    itemToRemix: 'themed weapon' | 'themed firearm' | 'themed bow' | 'themed bladed weapon' | 'themed trap' | 'themed provision' | 'themed fur coat' | 'themed hat',
    ngPlusLevel: number,
    log: (message: string, type?: LogEntry['type']) => void
): Promise<CardData | null> {
    const baseCardId = getThemedBaseCardId(itemToRemix, ngPlusLevel);
    if (!baseCardId || !ALL_CARDS_DATA_MAP[baseCardId]) {
        log(`Could not find a valid base card for remixing type '${itemToRemix}' at NG+${ngPlusLevel}. Cannot generate reward.`, "error");
        return null;
    }
    const baseCard = ALL_CARDS_DATA_MAP[baseCardId];

    try {
        log(`An objective reward is being forged by the AI... (Base: ${baseCard.name}, Type: ${itemToRemix}, NG+${ngPlusLevel})`, "system");
        
        const remixedItem = await callBackendAPI<CardData | null>('api/generate-remixed-weapon', { baseCard, ngPlusLevel, itemToRemix }, log);
        
        if (remixedItem && remixedItem.id && remixedItem.name) {
            log(`The AI has delivered a legendary item: ${remixedItem.name}!`, "system");
            return remixedItem;
        }

        log("The AI's forge is quiet today. No unique item was created. Using local fallback.", "error");
        return localRemixFallback(baseCard, log);

    } catch (error) {
        console.error("Error generating remixed weapon via backend:", error);
        log(`The connection to the AI forge has failed. (Error: ${error instanceof Error ? error.message : 'Unknown'}). Using local fallback.`, "error");
        return localRemixFallback(baseCard, log);
    }
}
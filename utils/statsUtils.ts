import { LifetimeStats, RunStats } from '../types.ts';
import { INITIAL_LIFETIME_STATS } from '../constants.ts';

// The key for storing lifetime stats in localStorage.
const LIFETIME_STATS_KEY = 'wildWestLifetimeStats_WWS';

/**
 * Loads lifetime stats from localStorage.
 * @returns The loaded LifetimeStats object, or the initial stats if none are found or data is corrupt.
 */
export function loadLifetimeStats(): LifetimeStats {
  try {
    const statsJSON = localStorage.getItem(LIFETIME_STATS_KEY);
    if (statsJSON) {
      const parsedStats = JSON.parse(statsJSON);
      // Ensure all keys from the initial template are present.
      return { ...INITIAL_LIFETIME_STATS, ...parsedStats };
    }
  } catch (error) {
    console.error("Failed to load or parse lifetime stats:", error);
  }
  return { ...INITIAL_LIFETIME_STATS };
}

/**
 * Saves the lifetime stats object to localStorage.
 * @param stats - The LifetimeStats object to save.
 */
export function saveLifetimeStats(stats: LifetimeStats): void {
  try {
    const statsJSON = JSON.stringify(stats);
    localStorage.setItem(LIFETIME_STATS_KEY, statsJSON);
  } catch (error) {
    console.error("Failed to save lifetime stats:", error);
  }
}

/**
 * Resets lifetime stats by removing them from localStorage.
 */
export function resetLifetimeStats(): void {
  localStorage.removeItem(LIFETIME_STATS_KEY);
}

/**
 * Updates the lifetime stats by adding the stats from a completed run.
 * This function should be called at the end of a game.
 * @param runStats - The RunStats object from the completed game.
 */
export function updateLifetimeStats(runStats: RunStats): void {
  const lifetimeStats = loadLifetimeStats();

  // Iterate over each key in the runStats and add it to the lifetime stats.
  (Object.keys(runStats) as Array<keyof RunStats>).forEach(key => {
    const runValue = runStats[key];
    const lifetimeValue = lifetimeStats[key];

    if (key === 'victoriesByCharacter') {
      const lifetimeVictories = (lifetimeValue || {}) as { [charId: string]: number };
      const runVictories = (runValue || {}) as { [charId: string]: number };
      
      const newVictories = { ...lifetimeVictories };
      for (const charId in runVictories) {
        newVictories[charId] = (newVictories[charId] || 0) + runVictories[charId];
      }
      (lifetimeStats as any)[key] = newVictories;
    } else if (key === 'highestNGPlusLevel' || key === 'biggestSingleHit' || key === 'mostGoldHeld' || key === 'totalStepsTaken') {
      // These stats should be the max, not summed. totalStepsTaken is handled here as it's a cumulative value for a character's lineage.
      (lifetimeStats as any)[key] = Math.max((lifetimeValue as number) || 0, (runValue as number) || 0);
    } else if (typeof runValue === 'number') {
      (lifetimeStats as any)[key] = ((lifetimeValue as number) || 0) + runValue;
    }
    // Note: Other types are not handled, but all stats are numbers or the victories object.
  });

  saveLifetimeStats(lifetimeStats);
}
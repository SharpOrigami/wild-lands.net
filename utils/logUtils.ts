import { PlayerDetails, CardData, Theme } from '../types';
import { getThemeName } from './themeUtils';
import { traitLogTemplates } from './logs/personalityLogTemplates';
import { characterLogTemplates } from './logs/characterLogTemplates';
import { logTemplates } from './logs/generalLogTemplates';
import { bossLogTemplates } from './logs/bossLogTemplates';
import { characterMotivationLogTemplates } from './logs/characterMotivationLogTemplates';

export interface LogParams {
  playerName?: string;
  characterName?: string;
  itemName?: string;
  sourceName?: string; // For damage source, heal source etc.
  eventName?: string;
  healAmount?: number | string;
  damageAmount?: number | string;
  currentHP?: number | string;
  maxHP?: number | string;
  cost?: number | string;
  sellAmount?: number | string;
  dayNumber?: number | string;
  goldAmount?: number | string;
  cardsDrawn?: number | string;
  trapName?: string;
  enemyName?: string;
  statAmount?: number | string;
  stolenAmount?: number | string;
  discardedCount?: number | string;
  discardedItemNames?: string;
  illnessName?: string;
  newMaxHealth?: number | string;
  reducedAmount?: number | string;
  objective_description?: string;
  objectiveName?: string; // Added for the new objective voided log
  attackPower?: number | string;
  [key: string]: any;
}

export function getRandomLogVariation(
  category: string, 
  params: LogParams = {},
  theme: Theme = 'western',
  player?: PlayerDetails,
  card?: CardData,
  isBossFight?: boolean
): string {
  if (params.playerName === '' || params.playerName === null || params.playerName === undefined) {
    if (theme === 'japan') params.playerName = 'The Ronin';
    else if (theme === 'safari') params.playerName = 'The Hunter';
    else if (theme === 'horror') params.playerName = 'The Survivor';
    else if (theme === 'cyberpunk') params.playerName = 'The Operator';
    else params.playerName = 'The Pioneer';
  }

  const validPersonalityMessages: string[] = [];

  if (player) {
    let triggerCategory = category;
    if (['threatDefeatedLow', 'threatDefeatedMid', 'threatDefeatedHigh'].includes(category)) {
      triggerCategory = 'threatDefeated';
    }
    if (['eventRevealThreatLow', 'eventRevealThreatMid', 'eventRevealThreatHigh'].includes(category)) {
      triggerCategory = 'eventRevealThreat';
      params.enemyName = card?.name;
    }

    const allPersonalityLogs = [...characterLogTemplates, ...traitLogTemplates, ...characterMotivationLogTemplates];
    const potentialLogs = allPersonalityLogs.filter(log => log.trigger === triggerCategory);

    for (const log of potentialLogs) {
      if (log.condition(player, card, isBossFight) && Math.random() < log.chance) {
        const themedMessages = log.messages[theme] || log.messages['western'];
        if (themedMessages && themedMessages.length > 0) {
          validPersonalityMessages.push(...themedMessages);
        }
      }
    }
  }
  
  // Gather generic messages first
  let categoryTemplates;
  if (isBossFight) {
    categoryTemplates = bossLogTemplates[category] || logTemplates[category];
  } else {
    categoryTemplates = logTemplates[category];
  }
  const genericMessages = (categoryTemplates && (categoryTemplates[theme] || categoryTemplates['western'])) || [];
  
  let finalMessagePool: string[] = [];
  const useGenericOverride = Math.random() < 0.5; // 50% chance to use generic logs

  // Decide which pool to use for the final message selection.
  if (validPersonalityMessages.length > 0 && !useGenericOverride) {
      // Default case: Personality messages exist and we're not overriding.
      finalMessagePool = validPersonalityMessages;
  } else if (genericMessages.length > 0) {
      // Use generic messages if:
      // 1. The 25% override triggered.
      // 2. There were no personality messages to begin with.
      finalMessagePool = genericMessages;
  } else {
      // Fallback: We wanted to use generic messages (either by override or default)
      // but none were found. If personality messages exist, use them instead of failing.
      finalMessagePool = validPersonalityMessages;
  }


  if (finalMessagePool.length === 0) {
      console.warn(`No log templates found for category: ${category}`);
      return `Event: ${category} - ${Object.entries(params).map(([key, value]) => `${key}: ${value}`).join(', ')}`;
  }
  
  let template = finalMessagePool[Math.floor(Math.random() * finalMessagePool.length)];

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key] !== undefined && params[key] !== null ? String(params[key]) : '';
      template = template.replace(new RegExp(`{${key}}`, 'g'), value);
    }
  }

  template = template.replace(/{[^}]+}/g, (match) => {
    return `[${match.substring(1, match.length - 1)} unset]`;
  });

  return template;
}
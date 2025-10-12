import { CardData, Character, RunStats, LifetimeStats } from './types.ts';
import { ALL_CARDS_DATA_MAP as allCards } from './constants/card-data/index.ts';

export const APP_VERSION = '20240725.1';
export const PLAYER_ID = 'player1';
export const MAX_LOG_ENTRIES = 25;
export const MAX_INTERNAL_LOG_ENTRIES = 800;
export const HAND_LIMIT = 6;
export const EQUIP_LIMIT = 3;
export const STORE_DISPLAY_LIMIT = 3;
export const EVENT_DECK_SIZE = 20;
export const PLAYER_DECK_TARGET_SIZE = 13;
export const STORE_DECK_TARGET_SIZE = 30;
export const MAX_DAYS_BEFORE_BOSS_FINDS_PLAYER = 40;
export const NG_PLUS_THEME_MILESTONE_INTERVAL = 10;
// FIX: Export REQUIRED_ACCURACY_METERS for shared use. - This comment is obsolete as the constant is exported below.
export const REQUIRED_ACCURACY_METERS = 30;

// Personality Traits for Story Generation
export const PERSONALITY_TRAITS = {
  archetype: ['The Stoic', 'The Idealist', 'The Pragmatist', 'The Coward', 'The Zealot', 'The Mercenary', 'The Wanderer'],
  temperament: ['Honorable', 'Deceitful', 'Reckless', 'Cautious', 'Greedy', 'Compassionate', 'Superstitious'],
  motivation: ['Seeking Redemption', 'Seeking Fortune', 'Seeking Vengeance', 'Seeking Knowledge', 'Seeking Escape', 'Seeking Power', 'Seeking Peace']
};

export const PERSONALITY_MODIFIERS: { [trait: string]: { talk: number; pet: number } } = {
  // Modifiers now range from -3 to +3 to ensure total failure chance is between 75% and 98%.
  // Negative values improve the skill (reduce failure %).
  // Archetypes (Max Penalty Contribution: +2)
  'The Stoic':      { talk: 2, pet: -3 },
  'The Idealist':   { talk: -3, pet: 3 },
  'The Pragmatist': { talk: 1, pet: -1 },
  'The Coward':     { talk: -2, pet: 2 },
  'The Zealot':     { talk: -3, pet: 1 },
  'The Mercenary':  { talk: -1, pet: 0 },
  'The Wanderer':   { talk: 2, pet: -2 },

  // Temperaments (Range: -5 to +5, Max Penalty Contribution: +5)
  'Honorable':      { talk: 4, pet: -5 },
  'Deceitful':      { talk: -5, pet: 5 },
  'Reckless':       { talk: 5, pet: -4 },
  'Cautious':       { talk: 2, pet: -2 },
  'Greedy':         { talk: 5, pet: -3 },
  'Compassionate':  { talk: -3, pet: -5 },
  'Superstitious':  { talk: -2, pet: 5 },

  // Motivations (Max Penalty Contribution: +2)
  'Seeking Redemption': { talk: 2, pet: -3 },
  'Seeking Fortune':    { talk: -2, pet: 2 },
  'Seeking Vengeance':  { talk: 2, pet: -1 },
  'Seeking Knowledge':  { talk: -3, pet: 3 },
  'Seeking Escape':     { talk: 1, pet: -2 },
  'Seeking Power':      { talk: -1, pet: 3 },
  'Seeking Peace':      { talk: -2, pet: 1 }
};

// Stat Tracking Constants
export const APEX_PREDATOR_IDS = new Set([
  'threat_black_bear_t1', 'threat_black_bear_t2', 'threat_grizzly_bear_t1', 'threat_wolf_t1', 'threat_wolf_t2', 'threat_wolf_t3', 'threat_wolf_pack_t1','threat_wolf_pack_t2', 'threat_cougar_t1', 'threat_cougar_t2',
  'threat_black_bear_t1_fj', 'threat_black_bear_t2_fj', 'threat_grizzly_bear_t1_fj', 'threat_wolf_t1_fj', 'threat_wolf_t2_fj', 'threat_wolf_t3_fj', 'threat_wolf_pack_t1_fj','threat_wolf_pack_t2_fj', 'threat_cougar_t1_fj', 'threat_cougar_t2_fj', // Higuma, Large Okami
  'threat_black_bear_t1_as', 'threat_black_bear_t2_as', 'threat_grizzly_bear_t1_as', 'threat_wolf_t1_as', 'threat_wolf_t2_as', 'threat_wolf_t3_as', 'threat_wolf_pack_t1_as','threat_wolf_pack_t2_as', 'threat_cougar_t1_as', 'threat_cougar_t2_as', // Lion, Large Hyena
  'threat_black_bear_t1_sh', 'threat_black_bear_t2_sh', 'threat_grizzly_bear_t1_sh', 'threat_wolf_t1_sh', 'threat_wolf_t2_sh', 'threat_wolf_t3_sh', 'threat_wolf_pack_t1_sh','threat_wolf_pack_t2_sh', 'threat_cougar_t1_sh', 'threat_cougar_t2_sh', // Varcolac, Loup-Garou
  'threat_black_bear_t1_cp', 'threat_black_bear_t2_cp', 'threat_grizzly_bear_t1_cp', 'threat_wolf_t1_cp', 'threat_wolf_t2_cp', 'threat_wolf_t3_cp', 'threat_wolf_pack_t1_cp','threat_wolf_pack_t2_cp', 'threat_cougar_t1_cp', 'threat_cougar_t2_cp', // Grizzly-Class Mech, Large Cyber-Wolf Pack
]);

export const PEST_IDS = new Set([
  // Wild West
  'threat_skunk_t1', 'threat_raccoon_t1', 'threat_raccoon_t2', 'threat_squirrel_t1', 'threat_squirrel_t2', 'threat_squirrel_t3', 'threat_rabbit_t1', 'threat_rabbit_t2', 'threat_rabbit_t3', 'threat_prairie_dog_t1',
  // Feudal Japan
  'threat_skunk_t1_fj', 'threat_raccoon_t1_fj', 'threat_raccoon_t2_fj', 'threat_squirrel_t1_fj', 'threat_squirrel_t2_fj', 'threat_squirrel_t3_fj', 'threat_prairie_dog_t1_fj', 'threat_rabbit_t1_fj', 'threat_rabbit_t2_fj', 'threat_rabbit_t3_fj',
  // Africa Safari
  'threat_skunk_t1_as', 'threat_raccoon_t1_as', 'threat_raccoon_t2_as', 'threat_squirrel_t1_as', 'threat_squirrel_t2_as', 'threat_squirrel_t3_as', 'threat_prairie_dog_t1_as', 'threat_rabbit_t1_as', 'threat_rabbit_t2_as', 'threat_rabbit_t3_as',
  // Supernatural Horror
  'threat_skunk_t1_sh', 'threat_raccoon_t1_sh', 'threat_raccoon_t2_sh', 'threat_squirrel_t1_sh', 'threat_squirrel_t2_sh', 'threat_squirrel_t3_sh', 'threat_prairie_dog_t1_sh', 'threat_rabbit_t1_sh', 'threat_rabbit_t2_sh', 'threat_rabbit_t3_sh',
  // Cyberpunk
  'threat_skunk_t1_cp', 'threat_raccoon_t1_cp', 'threat_raccoon_t2_cp', 'threat_squirrel_t1_cp', 'threat_squirrel_t2_cp', 'threat_squirrel_t3_cp', 'threat_prairie_dog_t1_cp', 'threat_rabbit_t1_cp', 'threat_rabbit_t2_cp', 'threat_rabbit_t3_cp'
]);

export const INITIAL_RUN_STATS: RunStats = {
  provisions_used_before_boss: 0,
  provisions_used_during_boss: 0,
  firearm_used_before_boss: 0,
  firearm_used_during_boss: 0,
  bladed_used_before_boss: 0,
  bladed_used_during_boss: 0,
  bow_used_before_boss: 0,
  bow_used_during_boss: 0,
  laudanum_used_before_boss: 0,
  laudanum_used_during_boss: 0,
  
  animals_killed_by_trap: 0,
  animals_killed_by_bow: 0,
  animals_killed_by_firearm: 0,
  animals_killed_by_bladed: 0,
  
  humans_killed_by_trap: 0,
  humans_killed_by_bow: 0,
  humans_killed_by_firearm: 0,
  humans_killed_by_bladed: 0,

  gold_spent: 0,
  gold_earned: 0,
  
  items_sold: 0,
  provisions_sold: 0,
  trophies_sold: 0,
  objectives_sold: 0,

  damage_dealt: 0,
  damage_taken: 0,
  health_healed: 0,
  
  illnesses_contracted: 0,
  illnesses_cured: 0,
  
  times_restocked: 0,
  threats_defeated: 0,

  // New Stats
  highestNGPlusLevel: 0,
  totalVictories: 0,
  objectivesCompleted: 0,
  victoriesByCharacter: {},
  apexPredatorsSlain: 0,
  pestsExterminated: 0,
  biggestSingleHit: 0,
  mostGoldHeld: 0,
  closeCalls: 0,
  trapsSprung: 0,
  campfiresBuilt: 0,
  lightningStrikesSurvived: 0,
  timesSkunked: 0,
  totalStepsTaken: 0,
  kodamaKilled: 0,
  laudanumAbuse: 0,
  totalDaysSurvived: 0,
  animalsPet: 0,
  deEscalations: 0,
};

export const INITIAL_LIFETIME_STATS: LifetimeStats = { ...INITIAL_RUN_STATS };

export const INITIAL_PLAYER_STATE_TEMPLATE = {
    name: null, character: null, health: 0, gold: 10, hand: [], equippedItems: [], activeTrap: null, isCampfireActive: false, maxHealth: 0, characterBaseMaxHealthForRun: 0, handSize: HAND_LIMIT, equipSlots: EQUIP_LIMIT, playerDeck: [], playerDiscard: [], hasEquippedThisTurn: false, satchels: {}, turnEnded: false, hasTakenActionThisTurn: false, hasRestockedThisTurn: false, isUnsortedDraw: false, ngPlusLevel: 0, activeEventForAttack: null, hatDamageNegationAvailable: false, currentIllnesses: [], personality: { archetype: PERSONALITY_TRAITS.archetype[0], temperament: PERSONALITY_TRAITS.temperament[0], motivation: PERSONALITY_TRAITS.motivation[0] }, pedometerActive: false, stepsTaken: 0, lastPosition: null, isGettingLocation: false, locationAccuracy: null, unaccountedDistanceFeet: 0, cumulativeNGPlusMaxHealthBonus: 0, mountainSicknessActive: false, mountainSicknessTurnsRemaining: 0, provisionsPlayed: 0, runStats: INITIAL_RUN_STATS, provisionsCollectedThisRun: 0, eventPacifiedThisTurn: false, goldStolenThisTurn: 0, lastUsedWeaponType: undefined, forceBossRevealNextTurn: false, capturedBossAlive: false, talkSkill: 0, petSkill: 0,
};

export const CHARACTERS_DATA_MAP: { [id: string]: Character } = {
    hunter: { 
        id: 'hunter', name: 'Hunter', health: 30, gold: 60,
        starterDeck: ['item_bow_t1', 'upgrade_quiver_t1', 'upgrade_lucky_arrowhead', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'upgrade_bearskin_coat', 'provision_steak'],
        description: "A master of the wilderness, living by the bow and the trail. They know the signs of the land and the ways of the beasts that roam it.",
        talkSkill: 85, petSkill: 79, // Bad talker, better petter
        personality: { archetype: 'The Wanderer', temperament: 'Cautious', motivation: 'Seeking Peace' }
    },
    trapper: { 
        id: 'trapper', name: 'Trapper', health: 31, gold: 45,
        starterDeck: ['item_sharp_knife_t1', 'item_large_trap_t1', 'upgrade_worn_whetstone', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'upgrade_bearskin_coat', 'provision_water_t1'],
        description: "Life on the frontier is about patience and preparation. This solitary figure knows how to set a snare for any creature, four-legged or two.",
        talkSkill: 89, petSkill: 92, // V. bad talker, even worse with animals
        personality: { archetype: 'The Pragmatist', temperament: 'Cautious', motivation: 'Seeking Fortune' }
    },
    gunslinger: { 
        id: 'gunslinger', name: 'Gunslinger', health: 34, gold: 85,
        starterDeck: ['item_six_shooter_t1', 'item_six_shooter_t1', 'upgrade_lucky_bullet', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'upgrade_bandolier_t1', 'provision_laudanum_t1'],
        description: "In a land where law is often decided by the fastest draw, the gunslinger's reputation precedes them. They live by the gun, and expect to die by it.",
        talkSkill: 82, petSkill: 86, // Balanced
        personality: { archetype: 'The Mercenary', temperament: 'Reckless', motivation: 'Seeking Vengeance' }
    },
    doctor: { 
        id: 'doctor', name: 'Doctor', health: 31, gold: 105,
        starterDeck: ['item_sharp_knife_t1', 'provision_miracle_cure_t1', 'upgrade_medical_journal', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'upgrade_deer_skin_coat_t1', 'provision_laudanum_t1'],
        description: "An educated man in an uneducated land. His bag contains remedies for ills both common and strange, a skill worth more than gold in these parts.",
        talkSkill: 80, petSkill: 85, // Good talker, less so with animals
        personality: { archetype: 'The Idealist', temperament: 'Compassionate', motivation: 'Seeking Redemption' }
    },
    herbalist: { 
        id: 'herbalist', name: 'Herbalist', health: 33, gold: 40,
        starterDeck: ['item_sharp_knife_t1', 'upgrade_leather_satchel_t1', 'upgrade_herb_pouch', 'provision_juniper_t1', 'provision_juniper_t1', 'provision_juniper_t1', 'upgrade_deer_skin_coat_t1', 'provision_basil_t1', 'provision_basil_t1', 'provision_basil_t1'],
        description: "The land provides for those who know how to listen. This herbalist finds powerful poultices and cures in the weeds and flowers others overlook.",
        talkSkill: 88, petSkill: 82, // Bad talker, good petter
        personality: { archetype: 'The Wanderer', temperament: 'Superstitious', motivation: 'Seeking Knowledge' }
    },
    explorer: { 
        id: 'explorer', name: 'Explorer', health: 30, gold: 150,
        starterDeck: ['item_six_shooter_t1', 'upgrade_sturdy_boots_t1', 'upgrade_treasure_map', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'upgrade_deer_skin_coat_t1', 'provision_water_t1'],
        description: "Driven by a thirst for the unknown and the promise of fortune, the explorer charts the blank spaces on the map, facing peril for the hope of discovery.",
        talkSkill: 79, petSkill: 85, // Balanced good
        personality: { archetype: 'The Idealist', temperament: 'Reckless', motivation: 'Seeking Fortune' }
    },
    preacher: {
        id: 'preacher', name: 'Preacher', health: 34, gold: 120,
        starterDeck: ['item_sawed_off_t1', 'item_knife_t1', 'upgrade_tattered_bible', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_laudanum_t1', 'provision_water_t1'],
        description: "Wields a holy book in one hand and a shotgun in the other. They believe salvation is for everyone, but some folks need more convincing than others.",
        talkSkill: 75, petSkill: 89, // Good talker, bad petter
        personality: { archetype: 'The Zealot', temperament: 'Deceitful', motivation: 'Seeking Power' }
    },
    prospector: {
        id: 'prospector', name: 'Prospector', health: 32, gold: 30,
        starterDeck: ['item_sawed_off_t1', 'upgrade_leather_satchel_t1', 'item_gold_pan', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_dried_meat', 'provision_laudanum_t1', 'provision_water_t1'],
        description: "With a pan and a pick, they sift the dirt and chip the rock, always hoping the next gleam of gold will be the one that changes their life forever.",
        talkSkill: 86, petSkill: 89, // Bad talker, bad petter
        personality: { archetype: 'The Pragmatist', temperament: 'Greedy', motivation: 'Seeking Fortune' }
    }
};
export const CHARACTERS_LIST: Character[] = Object.values(CHARACTERS_DATA_MAP);

export const ALL_CARDS_DATA_MAP: { [id: string]: CardData } = allCards;

export let CURRENT_CARDS_DATA = { ...ALL_CARDS_DATA_MAP };

export function resetCurrentCardsData() {
    CURRENT_CARDS_DATA = { ...ALL_CARDS_DATA_MAP };
}

export function updateCurrentCardsData(newCardData: { [id: string]: CardData }) {
    CURRENT_CARDS_DATA = { ...newCardData };
}

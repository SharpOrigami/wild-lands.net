import { PlayerDetails, CardData, Theme } from '../types.ts';
import { getThemeName } from './themeUtils.ts';
import { POP_CULTURE_CHEATS } from '../utils/cheatCodes.ts';

const traitLogTemplates: {
  trigger: string;
  condition: (player: PlayerDetails, card?: CardData, isBossFight?: boolean) => boolean;
  chance: number;
  messages: Partial<Record<Theme, string[]>>;
}[] = [
  // --- ARCHETYPES ---

  // The Stoic
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.6, messages: { western: ["Damage taken: {damageAmount}. It is noted.", "An injury. {damageAmount} damage sustained.", "The body is wounded for {damageAmount}. The will remains."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.6, messages: { western: ["The threat is neutralized. The path is clear.", "It is done. The {enemyName} is no more."]}},
  { 
    trigger: 'playerHeal', 
    condition: (p) => p.personality?.archetype === 'The Stoic', 
    chance: 0.6, 
    messages: { 
      western: ["Health restored by {healAmount}. The body endures.", "Damage repaired by {healAmount}. Vitality returning."],
      cyberpunk: ["Health restored by {healAmount}. The body endures.", "Damage repaired by {healAmount}. Functionality returning."]
    }
  },
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.3, messages: { western: ["Day {dayNumber}. Another day, another task.", "The sun rises on Day {dayNumber}. The mission continues."]}},
  { 
    trigger: 'eventRevealThreat', 
    condition: (p) => p.personality?.archetype === 'The Stoic', 
    chance: 0.5, 
    messages: { 
      western: ["An obstacle has appeared: {enemyName}.", "Threat identified: {enemyName}. Engaging."],
      cyberpunk: ["An obstacle has appeared: {enemyName}.", "Threat analysis: {enemyName}. Engaging."]
    }
  },
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.5, messages: { western: ["A necessary tool. Acquired {itemName} for {cost}G."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.5, messages: { western: ["A practical measure. The fire will provide warmth and security."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.5, messages: { western: ["{goldAmount} Gold. A resource acquired."]}},
  { 
    trigger: 'playerAttack', 
    condition: (p) => p.personality?.archetype === 'The Stoic', 
    chance: 0.5, 
    messages: { 
      western: ["Threat engaged. {attackPower} damage delivered."],
      cyberpunk: ["Executing attack protocol. {attackPower} damage dealt."]
    }
  },
  { trigger: 'illnessContracts', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.6, messages: { western: ["Afflicted with {illnessName}. It will be overcome."]}},

  // The Idealist
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Idealist' && c?.subType === 'human', chance: 0.7, messages: { western: ["A life is a life. 'Was this the only way?'","'Must we resort to such violence?' A sad day.","'Another man falls...'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Idealist' && c?.subType === 'animal', chance: 0.7, messages: { western: ["He looks at the fallen {enemyName}. 'I wish there had been another way.'"]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["Kindness heals all wounds, even one's own. Healed {healAmount} HP."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.5, messages: { western: ["Hopefully this {itemName} helps someone else. Sold for {sellAmount}G."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["A beacon of hope in the darkness. The fire is lit."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.3, messages: { western: ["Day {dayNumber}: A new chance to make things right."]}},
  { trigger: 'eventRevealItem', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["A gift from the trail! A {itemName} appears."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["This {goldAmount} Gold can be used for good."]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.8, messages: { western: ["Peace is always the better way. The situation is resolved without bloodshed."]}},
  { trigger: 'playerAttack', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.5, messages: { western: ["'I do what I must, for the greater good!'"]}},

  // The Pragmatist
  { trigger: 'itemSold', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["A necessary transaction. Sold {itemName} for {sellAmount}G.", "Liquidating an asset. The {itemName} is worth {sellAmount}G."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["An obstacle removed. That's all the {enemyName} was.", "Problem solved. The {enemyName} is neutralized."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["'A calculated risk.' Took {damageAmount} damage, but still in the fight.", "An acceptable loss. {damageAmount} damage taken."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["A worthwhile investment. {itemName} for {cost}G."]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["Refreshing the market for {cost}G is a sound tactic."]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["An efficient solution. The {trapName} is set."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["Information is a valuable commodity. Scouting reveals a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["Assets acquired. {goldAmount} Gold added to reserves."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["A practical measure for survival. Campfire active."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.3, messages: { western: ["Day {dayNumber}: Time to assess the situation and plan the next move."]}},

  // The Coward
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Coward' && p.health > 0, chance: 0.8, messages: { western: ["'I'm alive?!' But took {damageAmount} damage...","'Too close... I need to get out of here!' Hit for {damageAmount}!","'Mercy!' Lost {damageAmount} health!"]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'I did it! I actually did it!' The {enemyName} lies defeated.", "'I'm alive! Unbelievable!' He stares at the fallen {enemyName}."]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'Oh no, a {enemyName}! I have to hide!'", "'A {enemyName}! My journey ends here!'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'I don't want to look... a {eventName}!'", "'What fresh horror awaits?' Scouting reveals a {eventName}."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.4, messages: { western: ["Day {dayNumber}: 'I survived the night?'"]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.7, messages: { western: ["'Maybe this {trapName} will keep them away from me!'"]}},
  { trigger: 'playerAttack', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.7, messages: { western: ["A desperate swing! 'Stay back! Stay back!'"]}},
  { trigger: 'enemyAttackImmediate', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'It's coming right for me!'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.7, messages: { western: ["'Will this be enough to keep them away?'"]}},
  { trigger: 'enemyCampfireDeterred', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'It worked! The fire... it actually worked!'"]}},

  // The Zealot
  { trigger: 'threatDefeated', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.7, messages: { western: ["'The wicked {enemyName} has been purged!'","'By holy fire, this land is cleansed!'","'Another test of faith passed!'"]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["'The righteous are preserved!' Healed for {healAmount} HP."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A test of faith! The spirit endures {damageAmount} damage."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.3, messages: { western: ["Day {dayNumber}: Another day to spread the faith!"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A creature of sin! The {enemyName} must be cleansed!", "An unholy beast, the {enemyName}! A test of conviction!"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.5, messages: { western: ["A tool for the holy quest. The {itemName} is mine."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A light against the unholy dark. The fire burns bright."]}},
  { trigger: 'playerAttack', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["'By my faith, you are struck down!'", "'Repent!' He attacks with righteous fury."]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.7, messages: { western: ["A trial sent to test my resolve! I am afflicted with {illnessName}!"]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A snare for the unrighteous beast! The {trapName} is set."]}},

  // The Mercenary
  { trigger: 'threatDefeated', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.7, messages: { western: ["'Contract complete.' The {enemyName} is down.", "The {enemyName} is neutralized. 'Now, where's my pay?'"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["An investment in my business. {itemName} for {cost}G."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.7, messages: { western: ["Profit margin increased by {goldAmount} Gold.", "A bonus. {goldAmount} Gold acquired."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["Everything has a price. Sold {itemName} for {sellAmount}G."]}},
  { trigger: 'playerAttack', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["'Nothing personal. Just a job.'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["Looks like a new contract. The {enemyName} has a bounty on its head."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.3, messages: { western: ["Day {dayNumber}: Time to make some money."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["'That'll cost you extra.' Took {damageAmount} damage."]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["'Let's see if this junk heap has anything worth buying.' Restocked for {cost}G."]}},
  { trigger: 'trapCaught', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.7, messages: { western: ["An easy payday. The {enemyName} is trapped."]}},
  
  // The Wanderer
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.3, messages: { western: ["Day {dayNumber}: Another horizon.", "The road goes on. Day {dayNumber} begins."]}},
  { trigger: 'eventReveal', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["The trail offers a new sight: a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["A small distraction. {goldAmount} Gold. The journey continues."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.7, messages: { western: ["The {enemyName} is gone. The path ahead is clear again.", "One less danger on the road. The {enemyName} has been dealt with."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.7, messages: { western: ["'What's over the next rise?' Scouting reveals a {eventName}."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["A temporary home for the night. The fire is lit."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.5, messages: { western: ["Something for the road. Bought a {itemName}."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["Just another scar from the trail. Took {damageAmount} damage."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.5, messages: { western: ["The road provides its own remedies. Healed for {healAmount}."]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["A hardship of the journey. Afflicted with {illnessName}."]}},


  // --- TEMPERAMENTS ---

  // Honorable
  { trigger: 'playerAttack', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.6, messages: { western: ["A fair fight! He attacks {enemyName} with the {itemName}."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Honorable' && c?.subType === 'human', chance: 0.6, messages: { western: ["He gives a nod of respect. 'You fought with honor, {enemyName}.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Honorable' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'A noble beast.' He dispatches the {enemyName} quickly."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.6, messages: { western: ["'A fair price.' The deal for the {itemName} is done."]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.8, messages: { western: ["A duel avoided is a victory in itself. Bloodshed was not necessary today."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["A fair trade for the {itemName}. Sold for {sellAmount}G."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["'I will not fall so easily.' Healed for {healAmount}."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["A worthy blow! Took {damageAmount} damage."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.3, messages: { western: ["Day {dayNumber}: I will face this day with honor."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["Fortune favors the just. {goldAmount} Gold found."]}},

  // Deceitful
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.7, messages: { western: ["'A clever trap. It will do the dirty work for me.'", "'Let's see who falls for this.' The {trapName} is set."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'They never saw it coming.' The {enemyName} is dealt with."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'The fool didn't know its true worth.'"]}},
  { trigger: 'playerAttack', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["A strike from the shadows! {attackPower} damage!"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'He doesn't know what a bargain he just gave me.' Bought {itemName} for {cost}G."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'Knowledge is power, especially when they don't know you have it.' A {eventName} is ahead."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'Finders keepers.' {goldAmount} Gold pocketed."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.5, messages: { western: ["'The fool got a lucky hit.' Took {damageAmount} damage."]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.8, messages: { western: ["'They bought the lie. Perfect.' The situation is resolved."]}},
  { trigger: 'trapBroken', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.7, messages: { western: ["'Hmph. A flawed design.' The {trapName} was broken by the {enemyName}."]}},

  // Reckless
  { trigger: 'playerAttack', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.7, messages: { western: ["'Damn the consequences!' He charges the {enemyName} with the {itemName}!", "'Yeehaw!' He attacks with wild abandon!"]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["'Just a scratch!' Took {damageAmount} damage.", "'Is that all you've got?!' Hit for {damageAmount}!"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["'Looks useful!' Bought the {itemName} for {cost}G."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.7, messages: { western: ["'Ha! Is that all you've got?' The {enemyName} is finished.", "He spits on the ground. 'Next!' The {enemyName} is no more."]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.8, messages: { western: ["'Finally, some action!' A {enemyName} appears!", "'Let's get this party started!' A {enemyName} stands in the way."]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["'This stuff is junk! Let's see what's next!' Restocked for {cost}G."]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.5, messages: { western: ["'This'll be funny.' The {trapName} is set."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.5, messages: { western: ["'Scouting is for cowards, but fine...' Ahead is a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["{goldAmount} Gold! 'More money for booze and bullets!'"]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.7, messages: { western: ["'A little {illnessName}? I'll walk it off.'"]}},

  // Cautious
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.8, messages: { western: ["'Best to know what's coming.' Scouting reveals a {eventName}.", "'Let's not walk into any surprises.' A {eventName} is ahead."]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["'Better safe than sorry.' The {trapName} is set.", "A defensive measure. The {trapName} is in place."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.4, messages: { western: ["Day {dayNumber}: On guard.", "Day {dayNumber}: A new day of vigilance begins."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["A sigh of relief. The danger posed by {enemyName} has passed.", "He checks his surroundings carefully before approaching the fallen {enemyName}."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["A defensible position for the night. The fire should keep predators away."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.5, messages: { western: ["This {itemName} seems like a prudent purchase."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.5, messages: { western: ["'Must keep my strength up.' Healed for {healAmount}."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.6, messages: { western: ["'An avoidable injury! I must be more careful.' Took {damageAmount} damage."]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["A threat: {enemyName}. 'I must assess the situation.'"]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.6, messages: { western: ["The current selection presents too many unknowns. Restocking for {cost}G."]}},

  // Greedy
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.8, messages: { western: ["'Yes! More for me!' {goldAmount} Gold richer!","'This is it! I'm rich!' Another {goldAmount} Gold!","'A fool and his gold...' He bags {goldAmount} Gold."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Greedy' && c?.subType === 'human', chance: 0.8, messages: { western: ["'Now, let's see what you've got.' He rifles through the {enemyName}'s pockets.", "The {enemyName} is down. 'Hope they had something valuable.'"]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.7, messages: { western: ["'Should fetch a good price.' He looks over the fallen {enemyName}."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.7, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'Could have gotten more...'"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.6, messages: { western: ["This {itemName} better be worth the {cost}G!"]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.6, messages: { western: ["'Let's see if there's any real treasure in this dump.' Restocked for {cost}G."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.5, messages: { western: ["'My gold! Don't touch my gold!' Took {damageAmount} damage."]}},
  { trigger: 'eventRevealItem', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.7, messages: { western: ["A {itemName}. 'Is it valuable?'"]}},
  { trigger: 'playerAttack', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.5, messages: { western: ["'Get out of my way! There's profit to be made!'"]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.3, messages: { western: ["Day {dayNumber}: Time to increase the coffers."]}},

  // Compassionate
  { trigger: 'eventRevealThreat', condition: (p, c) => p.personality?.temperament === 'Compassionate' && c?.subType === 'animal', chance: 0.7, messages: { western: ["A magnificent creature, the {enemyName}. 'A shame to harm it.'","The {enemyName} is just trying to survive, like us.","Such a beautiful animal. He hopes to avoid a fight."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.7, messages: { western: ["A necessary evil. The {enemyName} will threaten no one else.", "'May you find peace.' He says a quiet word over the fallen {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.6, messages: { western: ["'Thank heavens.' The wound is closing. Healed {healAmount}."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.5, messages: { western: ["'I hope this {itemName} serves its new owner well.' Sold for {sellAmount}G."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.5, messages: { western: ["This {itemName} will help me help others."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.5, messages: { western: ["Even in pain, there is a lesson. Took {damageAmount} damage."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.3, messages: { western: ["Day {dayNumber}: May I bring some kindness to the world today."]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.8, messages: { western: ["'I'm glad we could resolve this without bloodshed.'"]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.6, messages: { western: ["This {goldAmount} Gold can help someone in need."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.6, messages: { western: ["A warm fire for any weary soul who might pass by."]}},

  // Superstitious
  { trigger: 'eventReveal', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'A bad omen...' A {eventName} appears.", "The cards foretold this! A {eventName} appears."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'The spirits are smiling.' Healed for {healAmount} HP."]}},
  { trigger: 'threatDefeated', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'The dark spirits are banished!' The {enemyName} is gone."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.4, messages: { western: ["Day {dayNumber}: 'What do the entrails of the dawn portend?'"]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'A dark omen!' Took {damageAmount} damage."]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["A ward against night spirits. The {trapName} is set."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.7, messages: { western: ["The flames will keep evil spirits at bay tonight."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'Peeking at what fate has in store...' Scouting reveals a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["A gift from the lucky spirits! {goldAmount} Gold."]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.7, messages: { western: ["A curse has taken hold! Afflicted with {illnessName}!"]}},
];

const characterLogTemplates: {
  trigger: string;
  condition: (player: PlayerDetails, card?: CardData, isBossFight?: boolean) => boolean;
  chance: number;
  messages: Partial<Record<Theme, string[]>>;
}[] = [
  // Hunter
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'hunter' && c?.id.includes('bow'), chance: 0.8, messages: { western: ["'A silent arrow finds its mark.' {attackPower} damage to {enemyName}."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'hunter' && c?.id.includes('knife'), chance: 0.8, messages: { western: ["'Too close. The skinning knife will have to do.' {attackPower} damage."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'hunter' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'Rest now, brother beast.' The hunt is over for the {enemyName}."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'hunter' && c?.subType === 'human', chance: 0.6, messages: { western: ["'Just another bounty.' The {enemyName} won't be troubling folks again."]}},
  { trigger: 'playerHeal', condition: (p, c) => p.character?.id === 'hunter' && c?.type === 'Provision', chance: 0.5, messages: { western: ["'A bit of jerky and I'm good to go.' Healed {healAmount}."]}},
  { trigger: 'trapSet', condition: (p) => p.character?.id === 'hunter', chance: 0.7, messages: { western: ["'A simple snare. Should be enough.'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'hunter', chance: 0.9, messages: { western: ["He reads the signs... 'Looks like a {eventName} up ahead.'"]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'hunter', chance: 0.25, messages: { western: ["Day {dayNumber}: The hunt begins again."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'hunter' && c?.type === 'Trophy', chance: 0.8, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'The land provides.'"]}},
  { trigger: 'eventRevealItem', condition: (p) => p.character?.id === 'hunter', chance: 0.6, messages: { western: ["The trail provides. Found a {itemName}."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'hunter', chance: 0.7, messages: { western: ["He builds a small fire, just enough to keep the beasts at bay."]}},
  // Trapper
  { trigger: 'trapSet', condition: (p) => p.character?.id === 'trapper', chance: 0.8, messages: { western: ["'{trapName} won't fail. Something's walking into it.'"]}},
  { trigger: 'trapCaught', condition: (p) => p.character?.id === 'trapper', chance: 0.8, messages: { western: ["A grim smile. 'Right where I wanted you, {enemyName}.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'trapper' && c?.id.includes('knife'), chance: 0.7, messages: { western: ["'Time to get my hands dirty.' {attackPower} damage to {enemyName}."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'trapper' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Another fine pelt.' The {enemyName} will fetch a good price."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'trapper' && c?.subType === 'human', chance: 0.7, messages: { western: ["'Two-legged varmints are the worst kind.' The {enemyName} is dealt with."]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'trapper', chance: 0.5, messages: { western: ["'A quick poultice. Good enough.' Healed for {healAmount}."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'trapper' && c?.type === 'Trophy', chance: 0.8, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'Good, clean business.'"]}},
  { trigger: 'itemBought', condition: (p, c) => p.character?.id === 'trapper' && c?.effect?.type === 'trap', chance: 0.8, messages: { western: ["'{itemName} will pay for itself ten times over.' Cost {cost}G."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'trapper', chance: 0.25, messages: { western: ["Day {dayNumber}: Checking the lines."]}},
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'trapper' && c?.subType === 'animal', chance: 0.6, messages: { western: ["He eyes the {enemyName}. 'You'll look good on a stretching board.'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'trapper', chance: 0.7, messages: { western: ["He checks the lay of the land... 'A {eventName} is near.'"]}},
  // Gunslinger
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'gunslinger' && (c?.id.includes('shooter') || c?.id.includes('rifle')), chance: 0.8, messages: { western: ["'Dance, varmint!' {attackPower} damage to the {enemyName}.", "'Eat lead!' A hail of bullets deals {attackPower} damage.", "A flash of steel and a roar of thunder. {attackPower} damage."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'gunslinger' && c?.subType === 'human', chance: 0.7, messages: { western: ["'He was slower.' The {enemyName} is pushing up daisies now.", "'Another notch on the iron.' The {enemyName} is finished.", "He blows the smoke from the barrel. 'Next.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'gunslinger' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Waste of a good bullet.' The {enemyName} is put down."]}},
  { trigger: 'itemBought', condition: (p, c) => p.character?.id === 'gunslinger' && c?.effect?.type === 'weapon', chance: 0.8, messages: { western: ["'A fine piece of iron.' The {itemName} was worth the {cost} Gold."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'gunslinger' && c?.type === 'Objective Proof', chance: 0.8, messages: { western: ["Another bounty collected. The {itemName} is worth {sellAmount}G."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'gunslinger', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Sun's up.'"]}},
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'gunslinger' && c?.subType === 'human', chance: 0.7, messages: { western: ["The {enemyName} appears. 'Looks like they want to try their luck.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'gunslinger', chance: 0.5, messages: { western: ["'Damn! They got a lucky shot in!' {damageAmount} damage."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'gunslinger', chance: 0.6, messages: { western: ["{goldAmount} Gold. 'For whiskey and bullets.'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'gunslinger', chance: 0.6, messages: { western: ["Scouting reveals a {eventName}. 'Best see who's waiting in ambush.'"]}},
  // Doctor
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'doctor', chance: 0.8, messages: { western: ["'Physician, heal thyself.' Restored {healAmount} health with {sourceName}.", "'A proper application of medicine.' Heals for {healAmount}.", "'This should stabilize the patient... me.' Recovers {healAmount} health."]}},
  { trigger: 'playerCuresIllness', condition: (p, c) => p.character?.id === 'doctor' && !!c?.effect?.cures, chance: 0.9, messages: { western: ["'This {itemName} should do the trick.' The {eventName} is cured."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'doctor' && c?.id.includes('knife'), chance: 0.8, messages: { western: ["'I swore an oath... but you are not my patient.' {attackPower} damage."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'doctor' && c?.subType === 'human', chance: 0.7, messages: { western: ["'A life wasted.' The {enemyName} gave him no choice."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'doctor' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'A rabid beast. It was a mercy.' The {enemyName} is put out of its misery."]}},
  { trigger: 'eventRevealIllness', condition: (p) => p.character?.id === 'doctor', chance: 0.9, messages: { western: ["Symptoms indicate {eventName}. 'I must find a cure.'", "A clear case of {eventName}. 'Now, where did I put my medical journal?'", "A textbook presentation of {eventName}. 'Fascinating... and unfortunate.'"]}},
  { trigger: 'itemBought', condition: (p, c) => p.character?.id === 'doctor' && c?.type === 'Provision', chance: 0.7, messages: { western: ["'This {itemName} will save a life. Perhaps my own.' Cost: {cost}G."]}},
  { trigger: 'itemSold', condition: (p) => p.character?.id === 'doctor', chance: 0.5, messages: { western: ["Sold the {itemName} for {sellAmount}G to resupply the medical kit."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'doctor', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Hoping for fewer patients.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'doctor', chance: 0.6, messages: { western: ["'Dammit, I'm a doctor, not a soldier!' Took {damageAmount} damage."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'doctor', chance: 0.6, messages: { western: ["A fire to sterilize a needle, or just for warmth."]}},
  // Herbalist
  { trigger: 'playerHeal', condition: (p, c) => p.character?.id === 'herbalist' && !!c?.id.match(/juniper|basil|peppermint|sage/), chance: 0.9, messages: { western: ["'The earth provides its own medicine.' {sourceName} heals {healAmount}.", "'A simple poultice of {sourceName}.' Restores {healAmount} health.", "She chews the {sourceName} into a paste. 'This will work.' Heals {healAmount}."]}},
  { trigger: 'playerCuresIllness', condition: (p, c) => p.character?.id === 'herbalist' && !!c?.effect?.cures_illness, chance: 0.8, messages: { western: ["'This {itemName} will purge the {eventName}.'"]}},
  { trigger: 'eventRevealItem', condition: (p, c) => p.character?.id === 'herbalist' && c?.type === 'Provision', chance: 0.8, messages: { western: ["'A lucky find!' A fresh {itemName} appears."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'herbalist' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'I'm sorry, little brother. Your spirit returns to the earth.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'herbalist' && c?.subType === 'human', chance: 0.6, messages: { western: ["'Their spirit is poisoned. There was no other cure.' The {enemyName} is gone."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'herbalist' && c?.type === 'Provision', chance: 0.7, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'They don't appreciate its power.'"]}},
  { trigger: 'playerAttack', condition: (p) => p.character?.id === 'herbalist', chance: 0.5, messages: { western: ["'The thorns must protect the rose.' {attackPower} damage."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'herbalist', chance: 0.25, messages: { western: ["Day {dayNumber}: Dew on the leaves."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'herbalist', chance: 0.7, messages: { western: ["A fire to brew teas and keep the chill away."]}},
  { trigger: 'storeRestock', condition: (p) => p.character?.id === 'herbalist', chance: 0.5, messages: { western: ["The merchant's stock is stale. A restock for {cost}G reveals new wares."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'herbalist', chance: 0.5, messages: { western: ["{goldAmount} Gold. 'A gift from the spirits.'"]}},
  // Explorer
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'explorer', chance: 0.9, messages: { western: ["To chart the unknown! Ahead lies a {eventName}."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'explorer', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Onward!'"]}},
  { trigger: 'eventRevealItem', condition: (p) => p.character?.id === 'explorer', chance: 0.8, messages: { western: ["'A fascinating find!' A {itemName} just lying here."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'explorer', chance: 0.8, messages: { western: ["'Treasure!' {goldAmount} Gold to fund the expedition."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'explorer' && (c?.type === 'Trophy' || c?.type === 'Objective Proof'), chance: 0.8, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'Proof of my discoveries!'"]}},
  { trigger: 'playerAttack', condition: (p) => p.character?.id === 'explorer', chance: 0.5, messages: { western: ["An obstacle to progress is dealt with. {attackPower} damage to {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'explorer', chance: 0.5, messages: { western: ["'A quick patch-up and back to it.' Healed {healAmount}."]}},
  { trigger: 'threatDefeated', condition: (p) => p.character?.id === 'explorer', chance: 0.6, messages: { western: ["The {enemyName} is no longer an obstacle to progress.", "Another discovery made. The {enemyName} has been catalogued... permanently."]}},
  { trigger: 'itemBought', condition: (p) => p.character?.id === 'explorer', chance: 0.6, messages: { western: ["This {itemName} will be invaluable. Cost {cost}G."]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'explorer', chance: 0.6, messages: { western: ["'An unexpected peril!' Took {damageAmount} damage."]}},
  // Preacher
  { trigger: 'playerAttack', condition: (p) => p.character?.id === 'preacher', chance: 0.7, messages: { western: ["'Smite the wicked!' The {itemName} delivers {attackPower} damage unto the {enemyName}."]}},
  { trigger: 'threatDefeated', condition: (p) => p.character?.id === 'preacher', chance: 0.7, messages: { western: ["'The sinner, {enemyName}, has been judged!'","'The Lord has delivered this beast, {enemyName}, into my hands!'","'The wicked {enemyName} is cast down!"]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'preacher', chance: 0.6, messages: { western: ["'The Lord provides!' Health is restored by {healAmount}."]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'preacher', chance: 0.6, messages: { western: ["'A test of my faith!' He takes {damageAmount} damage, but does not falter."]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.character?.id === 'preacher', chance: 0.7, messages: { western: ["A creature of sin! 'The {enemyName} must be cleansed!'"]}},
  { trigger: 'itemSold', condition: (p) => p.character?.id === 'preacher', chance: 0.5, messages: { western: ["'Tithing to the cause.' Sold {itemName} for {sellAmount}G."]}},
  { trigger: 'itemBought', condition: (p) => p.character?.id === 'preacher', chance: 0.5, messages: { western: ["'A tool of righteousness!' The {itemName} is worth every bit of {cost}G."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'preacher', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Time for the Lord's work.'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'preacher', chance: 0.7, messages: { western: ["A fire to read the good book by."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'preacher', chance: 0.6, messages: { western: ["'A blessing!' The Lord has provided {goldAmount} Gold."]}},
  // Prospector
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'prospector', chance: 0.9, messages: { western: ["'Paydirt!' You're {goldAmount} Gold richer!","'Eureka!' Struck the mother lode! {goldAmount} Gold richer!","'Sweet motherlode!' {goldAmount} Gold in the pan!"]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'prospector' && c?.id.includes('nugget'), chance: 0.9, messages: { western: ["'Cashing in!' The {itemName} is worth {sellAmount} Gold."]}},
  { trigger: 'playerAttack', condition: (p) => p.character?.id === 'prospector', chance: 0.6, messages: { western: ["'Get off my claim!' {attackPower} damage to the {enemyName}."]}},
  { trigger: 'threatDefeated', condition: (p) => p.character?.id === 'prospector', chance: 0.6, messages: { western: ["The {enemyName} won't be jumping his claim again.", "'Now I can get back to the real work!' The {enemyName} is no longer a nuisance."]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'prospector', chance: 0.5, messages: { western: ["'A little snake oil and I'm good as gold.' Healed {healAmount}."]}},
  { trigger: 'itemBought', condition: (p) => p.character?.id === 'prospector', chance: 0.5, messages: { western: ["'Gotta spend money to make money.' The {itemName} cost {cost}G."]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.character?.id === 'prospector', chance: 0.7, messages: { western: ["'A claim jumper!' The {enemyName} is trying to horn in on his territory."]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'prospector', chance: 0.6, messages: { western: ["A {eventName} is spotted. 'Gotta check for color... and for trouble.'"]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'prospector', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Hoping for paydirt.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'prospector', chance: 0.5, messages: { western: ["'Hey! That's my gear!' Took {damageAmount} damage."]}},
  // Doctor
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'doctor' && !!c && c.id.includes('vagabond'), chance: 0.7, messages: { western: ["Another poor soul lost to the frontier. 'A tragedy.'","'This poor wretch needs medicine, not judgment.'","The state of these people... 'It breaks the heart.'"]}},
  // Gunslinger
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'gunslinger' && !!c && c.id.includes('rattlesnake'), chance: 0.75, messages: { western: ["'Snakes... why'd it have to be snakes?'","'Dammit, I hate these slithering devils.'","A rattler... 'Figures. One more thing to shoot.'"]}},
];

const logTemplates: Record<string, Partial<Record<Theme, string[]>>> = {
  animalWandersOff: {
    western: ["{enemyName} moseys on, uninterested in a tussle with {playerName}.", "{enemyName} decides {playerName} ain't worth the bother and wanders off."],
    japan: ["{enemyName} returns to the spirit world, its business with {playerName} unfinished.", "{enemyName} fades into the bamboo forest, deciding {playerName} is not worth the effort."],
    safari: ["{enemyName} melts back into the savanna, losing interest in {playerName}.", "The {enemyName} gives a final snort and moves on, the hunt is off."],
    horror: ["The {enemyName} slinks back into the shadows, its unnatural hunger momentarily sated by something unseen.", "A chilling whisper on the wind, and the {enemyName} is gone, as if it were never there."],
    cyberpunk: ["Target lock disengaged. The {enemyName} unit returns to its patrol route, deeming {playerName} a non-threat.", "The {enemyName} drone's threat-assessment protocol returns negative; it powers down its weapon systems and moves on."],
  },
  bossDeEscalated: {
    western: ["'This fight is beneath me,' says {enemyName}. The boss pays you {goldAmount} Gold to look the other way!", "Seeing a worthy adversary, {enemyName} offers a tribute of {goldAmount} Gold to end things peacefully. You accept."],
    japan: ["'Your honor is sufficient,' declares {enemyName}. The Shogun offers you {goldAmount} koban to forget this encounter.", "{enemyName}, impressed by your resolve, offers a tribute of {goldAmount} koban. 'A warrior knows when not to fight.'"],
    safari: ["'A worthy hunter does not waste their shot,' says {enemyName}. The Great White Hunter offers {goldAmount} sovereigns to call it a day.", "{enemyName} offers a tribute of {goldAmount} sovereigns. 'The savanna has seen enough blood.'"],
    horror: ["'Your soul is not yet ripe,' hisses {enemyName}. The creature offers you {goldAmount} cursed pieces of silver to be left to its dark work.", "{enemyName} offers a tribute of {goldAmount} blood money. 'There are other feasts to be had.'"],
    cyberpunk: ["'Your combat data is... intriguing,' buzzes {enemyName}. The Rogue AI transfers {goldAmount} EuroCreds to your account. 'A retainer for future... collaborations.'"],
  },
  campfireDoused: {
    western: ["The morning light extinguishes the campfire's last embers.", "The campfire has burned out, its protection gone with the night."],
    japan: ["The embers of the takibi die, their protective spirit fading with the morning mist.", "The campfire has turned to ash, its warmth a memory against the coming day."],
    safari: ["The last of the campfire smoke drifts into the vast African sky.", "The fire is out, leaving only the scent of acacia smoke and the sounds of the waking savanna."],
    horror: ["The protective circle of the campfire fades to cold ash, leaving you exposed to the grey dawn.", "The fire is dead. The shadows press in once more."],
    cyberpunk: ["The portable heater's power cell is depleted, its comforting glow extinguished.", "The heat-coil sputters and dies, plunging the alley back into cold darkness."],
  },
  cardsDrawn: {
    western: ["{playerName} draws {cardsDrawn} cards.", "The hand's been dealt. {playerName} draws {cardsDrawn} cards."],
    japan: ["{playerName} contemplates their next move, drawing {cardsDrawn} cards.", "Fate deals its hand. {playerName} draws {cardsDrawn} cards."],
    safari: ["The hunt requires new tools. {playerName} draws {cardsDrawn} cards.", "The tracker draws {cardsDrawn} cards, assessing their options."],
    horror: ["{playerName} steels their nerves and draws {cardsDrawn} cards from their grim pack.", "With a trembling hand, {playerName} draws {cardsDrawn} cards."],
    cyberpunk: ["Booting up new subroutines. {playerName} draws {cardsDrawn} cards.", "The interface refreshes. {playerName} slots {cardsDrawn} new programs."],
  },
  enemyAttackImmediate: {
    western: ["The {enemyName} attacks {playerName} without warning!", "Ambush! The {enemyName} strikes {playerName} immediately!"],
    japan: ["Kurae! The {enemyName} strikes {playerName} with blinding speed!", "From the shadows, the {enemyName} ambushes {playerName}!"],
    safari: ["A sudden charge! The {enemyName} attacks {playerName}!", "Out of the tall grass! The {enemyName} strikes {playerName}!"],
    horror: ["A screech in the darkness! The {enemyName} lunges at {playerName}!", "A shape of nightmare! The {enemyName} attacks {playerName} from the gloom!"],
    cyberpunk: ["Hostile engagement! The {enemyName} unit opens fire on {playerName}!", "Ambush protocol initiated! The {enemyName} targets {playerName}!"],
  },
  trapSet: {
    western: ["{playerName} sets a {trapName}, eyes scanning the horizon.", "The {trapName} is set. Now, to wait.", "'Something's bound to wander into this.' The {trapName} is ready."],
    japan: ["{playerName} sets a {trapName}, its mechanisms hidden in the tall grass.", "The {trapName} is set. A silent threat awaits.", "'A simple but effective tool.' The {trapName} is placed with care."],
    safari: ["{playerName} sets a {trapName}, camouflaging it with dirt and leaves.", "The {trapName} is set. The savanna will provide.", "'This should do the trick.' The {trapName} is ready for its quarry."],
    horror: ["{playerName} sets a {trapName}, its iron jaws hungry for flesh.", "The {trapName} is set, a grim necessity in these cursed lands.", "'May this hold back the darkness, if only for a moment.' The {trapName} is armed."],
    cyberpunk: ["{playerName} deploys a {trapName}, its sensors glowing faintly.", "The {trapName} is armed. Now, to wait for a target.", "'Another tool in the arsenal.' The {trapName} is primed and ready."],
  },
  enemyAttackEndOfDay: {
    western: ["As darkness falls, the {enemyName} strikes at {playerName}!", "Under the cover of night, the {enemyName} ambushes {playerName}!"],
    japan: ["In the twilight, the {enemyName} sees an opportunity and attacks {playerName}!", "The shadows grow long, and the {enemyName} strikes at {playerName}!"],
    safari: ["As the sun dips below the horizon, the {enemyName} attacks {playerName}!", "The sounds of the savanna fall silent as the {enemyName} ambushes {playerName}!"],
    horror: ["In the deepening gloom, the {enemyName} lunges at {playerName}!", "The witching hour approaches, and the {enemyName} attacks {playerName}!"],
    cyberpunk: ["As the neon lights flicker, the {enemyName} unit engages {playerName}!", "Under the cover of the smog-filled night, the {enemyName} ambushes {playerName}!"],
  },
  eventRevealEnvironmental: {
    western: ["The sky darkens ominously... a {eventName} is upon you!", "The very land turns against {playerName}! A {eventName} strikes!", "Look out, {playerName}! A {eventName}!"],
    japan: ["The kami are displeased! A {eventName} descends upon the path!", "The heavens themselves rage! A {eventName} strikes {playerName}!", "A sudden {eventName}! The earth trembles!"],
    safari: ["The weather turns in an instant! A {eventName} is upon you!", "Nature's fury is unleashed! A {eventName} threatens the safari!", "Look out! A {eventName}!"],
    horror: ["The world contorts into a nightmare! A {eventName} manifests!", "The very air grows heavy with malice! A {eventName} strikes!", "The shadows themselves take form! A {eventName}!"],
    cyberpunk: ["System malfunction! A {eventName} protocol has been triggered!", "The city's infrastructure turns against you! A {eventName}!", "Warning! A {eventName} is imminent!"],
  },
  eventRevealItem: {
    western: ["The trail provides. {playerName} finds a {itemName}.", "A lucky find! A {itemName} lies on the path ahead."],
    japan: ["A gift from a wandering kami. {playerName} finds a {itemName}.", "A fortunate discovery! A {itemName} rests by a roadside shrine."],
    safari: ["The old hunter's cache! {playerName} finds a {itemName}.", "A lucky find in the bush! A {itemName} appears."],
    horror: ["A glimmer in the dark. {playerName} finds a {itemName} clutched in a skeletal hand.", "A strange artifact, a {itemName}, lies on a crumbling altar."],
    cyberpunk: ["A forgotten data-cache contains a {itemName}.", "Glitching in from a corrupted ad-hoarding, a {itemName} materializes."],
  },
  eventRevealObjective: {
    western: ["A new contract arrives for {playerName}: '{objectiveName}'. The request is clear: {objective_description}"],
  },
  eventRevealThreat: {
    western: ["A {enemyName} appears before {playerName}!"],
    japan: ["A {enemyName} emerges from the mist before {playerName}!"],
    safari: ["A {enemyName} appears from the bush before {playerName}!"],
    horror: ["A {enemyName} lurches from the shadows before {playerName}!"],
    cyberpunk: ["A {enemyName} powers up before {playerName}!"],
  },
  eventRevealThreatHigh: {
    western: ["Hold your horses, {playerName}! An unwelcome visitor: the notorious {enemyName} appears!", "This is the big one! The legendary {enemyName} stands before {playerName}!"],
    japan: ["A true demon! The legendary {enemyName} blocks the path of {playerName}!", "The Shogun's champion, the mighty {enemyName}, has come for {playerName}!"],
    safari: ["The hunt of a lifetime! The legendary {enemyName} stands before {playerName}!", "By the gods, it's the great {enemyName}! A true test for {playerName}!"],
    horror: ["A true nightmare! The legendary {enemyName} materializes before {playerName}!", "The source of the darkness, the great {enemyName}, has come for {playerName}!"],
    cyberpunk: ["Red alert! A legendary {enemyName} unit is online and targeting {playerName}!", "This is it, the ghost in the machine! The infamous {enemyName} appears before {playerName}!"],
  },
  eventRevealThreatLow: {
    western: ["A {enemyName} shuffles into view. It looks hostile.", "A {enemyName} wanders onto the path, its eyes fixed on {playerName}.", "The rustle in the bushes reveals a {enemyName}. It doesn't look friendly."],
    japan: ["A lesser yōkai, a {enemyName}, emerges. It seems hostile.", "A wandering {enemyName} crosses your path, its intentions unclear.", "The rustle in the bamboo reveals a {enemyName}. It looks ready for a fight."],
    safari: ["A {enemyName} emerges from the tall grass. It looks aggressive.", "A {enemyName} wanders into the camp, its eyes fixed on {playerName}.", "The rustle in the acacia reveals a {enemyName}. It doesn't look friendly."],
    horror: ["A lesser horror, a {enemyName}, shuffles into view. It looks hungry.", "A {enemyName} crawls from the shadows, its eyes fixed on {playerName}.", "A skittering in the dark reveals a {enemyName}. It does not look friendly."],
    cyberpunk: ["A low-level security drone, a {enemyName}, powers up. It looks hostile.", "A rogue {enemyName} unit wanders into your sector, its sensors fixed on {playerName}.", "The static in the comms reveals a {enemyName}. It doesn't look friendly."],
  },
  eventRevealThreatMid: {
    western: ["Trouble's brewin'... a {enemyName} rears its ugly head on the trail.", "The sound of trouble... a {enemyName} is blocking your way, {playerName}."],
    japan: ["A greater threat... a {enemyName} emerges from the fog.", "The sound of steel... a {enemyName} is blocking your path, {playerName}."],
    safari: ["A dangerous beast... a {enemyName} appears on the savanna.", "The sound of a predator... a {enemyName} is blocking your way, {playerName}."],
    horror: ["A greater horror... a {enemyName} emerges from the gloom.", "The sound of scraping claws... a {enemyName} is blocking your way, {playerName}."],
    cyberpunk: ["A serious threat... a {enemyName} unit comes online.", "The sound of charging weapons... a {enemyName} is blocking your way, {playerName}."],
  },
  goldFoundFromItem: {
    western: ["{playerName}'s {itemName} yields {goldAmount} Gold!", "A glint of gold! The {itemName} pays off, providing {goldAmount} Gold."],
    japan: ["{playerName}'s {itemName} yields {goldAmount} mon!", "A fortunate find! The {itemName} pays off, providing {goldAmount} mon."],
    safari: ["{playerName}'s {itemName} yields {goldAmount} shillings!", "A bit of luck! The {itemName} pays off, providing {goldAmount} shillings."],
    horror: ["{playerName}'s {itemName} yields {goldAmount} silver pieces!", "A glimmer of hope! The {itemName} pays off, providing {goldAmount} silver pieces."],
    cyberpunk: ["{playerName}'s {itemName} yields {goldAmount} credits!", "Data transfer complete! The {itemName} pays off, providing {goldAmount} credits."],
  },
  goldFoundWalking: {
    western: ["{playerName} finds {goldAmount} Gold while walking the trail.", "The journey itself is profitable! {playerName} finds {goldAmount} Gold."],
    japan: ["{playerName} finds {goldAmount} mon on the road.", "The journey is profitable! {playerName} finds {goldAmount} mon."],
    safari: ["{playerName} finds {goldAmount} shillings on the path.", "The safari is profitable! {playerName} finds {goldAmount} shillings."],
    horror: ["{playerName} finds {goldAmount} silver pieces in the mud.", "The cursed road is profitable! {playerName} finds {goldAmount} silver pieces."],
    cyberpunk: ["{playerName} finds a lost credstick worth {goldAmount} credits.", "The sprawl is profitable! {playerName} finds {goldAmount} credits."],
  },
  goldStolen: {
    western: ["The {eventName} deftly relieves {playerName} of {stolenAmount} Gold!", "A quick hand and a flash of steel! The {eventName} makes off with {stolenAmount} Gold from {playerName}."],
    japan: ["The {eventName} deftly relieves {playerName} of {stolenAmount} mon!", "A quick hand and a flash of steel! The {eventName} makes off with {stolenAmount} mon from {playerName}."],
    safari: ["The {eventName} deftly relieves {playerName} of {stolenAmount} shillings!", "A quick hand and a flash of steel! The {eventName} makes off with {stolenAmount} shillings from {playerName}."],
    horror: ["The {eventName} deftly relieves {playerName} of {stolenAmount} silver pieces!", "A quick hand and a flash of steel! The {eventName} makes off with {stolenAmount} silver pieces from {playerName}."],
    cyberpunk: ["The {eventName} deftly relieves {playerName} of {stolenAmount} credits!", "A quick hack and a flash of light! The {eventName} makes off with {stolenAmount} credits from {playerName}."],
  },
  hatSaved: {
    western: ["A close call! {playerName}'s {itemName} absorbs the blow from {sourceName}, but is destroyed in the process.", "That could have been nasty! The {itemName} takes the full force of the attack from {sourceName} and is ruined."],
    japan: ["A close call! {playerName}'s {itemName} absorbs the blow from {sourceName}, but is shattered in the process.", "That could have been fatal! The {itemName} takes the full force of the attack from {sourceName} and is ruined."],
    safari: ["A close call! {playerName}'s {itemName} absorbs the blow from {sourceName}, but is destroyed in the process.", "That could have been a nasty one! The {itemName} takes the full force of the attack from {sourceName} and is ruined."],
    horror: ["A close call! {playerName}'s {itemName} absorbs the blow from {sourceName}, but is rent asunder in the process.", "That could have been the end! The {itemName} takes the full force of the attack from {sourceName} and is destroyed."],
    cyberpunk: ["A close call! {playerName}'s {itemName} absorbs the blow from {sourceName}, but is fried in the process.", "That could have been a system crash! The {itemName} takes the full force of the attack from {sourceName} and is destroyed."],
  },
  illnessContracts: {
    western: ["{playerName} has contracted {illnessName}!", "A feverish sweat breaks out on {playerName}'s brow. It's {illnessName}.", "An unfortunate diagnosis: {playerName} now has {illnessName}."],
    japan: ["{playerName} has been afflicted with {illnessName}!", "A chill runs down {playerName}'s spine. It's {illnessName}.", "An ill omen: {playerName} now suffers from {illnessName}."],
    safari: ["{playerName} has contracted {illnessName}!", "A burning fever takes hold. It's {illnessName}.", "The safari takes its toll: {playerName} now has {illnessName}."],
    horror: ["{playerName} has been cursed with {illnessName}!", "A creeping dread fills {playerName}. It's {illnessName}.", "A terrible affliction: {playerName} now suffers from {illnessName}."],
    cyberpunk: ["{playerName}'s systems are infected with {illnessName}!", "A warning light flashes on {playerName}'s HUD. It's {illnessName}.", "System diagnostic: {playerName} now has {illnessName}."],
  },
  illnessContractsAndEndsTurn: {
    western: ["A wave of sickness washes over {playerName} as the {illnessName} takes hold. The day's journey ends abruptly.", "The {illnessName} hits {playerName} hard, forcing an early end to the day."],
    japan: ["A wave of sickness washes over {playerName} as the {illnessName} takes hold. The day's journey ends abruptly.", "The {illnessName} hits {playerName} hard, forcing an early end to the day."],
    safari: ["A wave of sickness washes over {playerName} as the {illnessName} takes hold. The day's journey ends abruptly.", "The {illnessName} hits {playerName} hard, forcing an early end to the day."],
    horror: ["A wave of sickness washes over {playerName} as the {illnessName} takes hold. The day's journey ends abruptly.", "The {illnessName} hits {playerName} hard, forcing an early end to the day."],
    cyberpunk: ["A system-wide crash hits {playerName} as the {illnessName} takes hold. The day's run ends abruptly.", "The {illnessName} hits {playerName}'s chrome hard, forcing an early end to the day."],
  },
  illnessCured: {
    western: ["The active threat of {eventName} is resolved with a dose of {itemName}.", "{itemName} proves effective against the lingering {eventName}."],
    japan: ["The active threat of {eventName} is resolved with a dose of {itemName}.", "{itemName} proves effective against the lingering {eventName}."],
    safari: ["The active threat of {eventName} is resolved with a dose of {itemName}.", "{itemName} proves effective against the lingering {eventName}."],
    horror: ["The active threat of {eventName} is resolved with a dose of {itemName}.", "{itemName} proves effective against the lingering {eventName}."],
    cyberpunk: ["The active threat of {eventName} is resolved with a dose of {itemName}.", "{itemName} proves effective against the lingering {eventName}."],
  },
  illnessTemporaryCure: {
    western: ["{playerName} is no longer suffering from {illnessName}.", "The bout of {illnessName} has passed. {playerName} feels much better."],
    japan: ["{playerName} is no longer suffering from {illnessName}.", "The bout of {illnessName} has passed. {playerName} feels much better."],
    safari: ["{playerName} is no longer suffering from {illnessName}.", "The bout of {illnessName} has passed. {playerName} feels much better."],
    horror: ["{playerName} is no longer suffering from {illnessName}.", "The bout of {illnessName} has passed. {playerName} feels much better."],
    cyberpunk: ["{playerName}'s systems are no longer affected by {illnessName}.", "The {illnessName} has been purged. {playerName}'s systems are returning to normal."],
  },
  itemBought: {
    western: ["{playerName} barters for a new {itemName}, parting with {cost} Gold.", "The {itemName} changes hands for {cost} Gold. A fine purchase.", "{playerName} parts with {cost} Gold for a much-needed {itemName}.", "A deal is struck. The {itemName} is yours for {cost} Gold."],
    japan: ["{playerName} trades for a new {itemName}, parting with {cost} mon.", "The {itemName} changes hands for {cost} mon. A fine purchase.", "{playerName} parts with {cost} mon for a much-needed {itemName}.", "A deal is struck. The {itemName} is yours for {cost} mon."],
    safari: ["{playerName} barters for a new {itemName}, parting with {cost} shillings.", "The {itemName} changes hands for {cost} shillings. A fine purchase.", "{playerName} parts with {cost} shillings for a much-needed {itemName}.", "A deal is struck. The {itemName} is yours for {cost} shillings."],
    horror: ["{playerName} trades for a new {itemName}, parting with {cost} silver pieces.", "The {itemName} changes hands for {cost} silver pieces. A grim purchase.", "{playerName} parts with {cost} silver pieces for a much-needed {itemName}.", "A dark bargain is struck. The {itemName} is yours for {cost} silver pieces."],
    cyberpunk: ["{playerName} acquires a new {itemName}, transferring {cost} credits.", "The {itemName} changes hands for {cost} credits. A good deal.", "{playerName} transfers {cost} credits for a much-needed {itemName}.", "Transaction complete. The {itemName} is yours for {cost} credits."],
  },
  itemDiscarded: {
    western: ["{playerName} discards the {itemName}, lightening their load.", "No longer needed, the {itemName} is left behind."],
    japan: ["{playerName} discards the {itemName}, lightening their load.", "No longer needed, the {itemName} is left behind."],
    safari: ["{playerName} discards the {itemName}, lightening their load.", "No longer needed, the {itemName} is left behind."],
    horror: ["{playerName} discards the {itemName}, lightening their load.", "No longer needed, the {itemName} is left behind."],
    cyberpunk: ["{playerName} junks the {itemName}, freeing up memory.", "No longer needed, the {itemName} is deleted."],
  },
  itemEquipped: {
    western: ["{playerName} equips the {itemName}, ready for what's next.", "Gearing up. The {itemName} is now ready.", "The {itemName} is readied for the trail ahead."],
    japan: ["{playerName} dons the {itemName}, ready for what's next.", "Preparing for battle. The {itemName} is now ready.", "The {itemName} is readied for the journey ahead."],
    safari: ["{playerName} equips the {itemName}, ready for what's next.", "Gearing up. The {itemName} is now ready.", "The {itemName} is readied for the hunt ahead."],
    horror: ["{playerName} equips the {itemName}, ready for the horrors to come.", "Steeling themselves. The {itemName} is now ready.", "The {itemName} is readied for the darkness ahead."],
    cyberpunk: ["{playerName} installs the {itemName}, ready for what's next.", "System online. The {itemName} is now active.", "The {itemName} is integrated into the system."],
  },
  itemLeftBehind: {
    western: ["The {itemName} was left behind on the trail.", "Unclaimed, the {itemName} was returned to the general store's stock."],
    japan: ["The {itemName} was left behind on the road.", "Unclaimed, the {itemName} was returned to the merchant's stock."],
    safari: ["The {itemName} was left behind on the savanna.", "Unclaimed, the {itemName} was returned to the trading post's stock."],
    horror: ["The {itemName} was left behind in the darkness.", "Unclaimed, the {itemName} was returned to the peddler's stock."],
    cyberpunk: ["The {itemName} was left behind in the sprawl.", "Unclaimed, the {itemName} was returned to the vendor's stock."],
  },
  itemSold: {
    western: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} Gold.", "A savvy buyer takes that {itemName} off your hands for {sellAmount} Gold.", "A good trade! The {itemName} sold for {sellAmount} cold hard cash."],
    japan: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} mon.", "A savvy merchant takes that {itemName} off your hands for {sellAmount} mon.", "A good trade! The {itemName} sold for {sellAmount} mon."],
    safari: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} shillings.", "A savvy trader takes that {itemName} off your hands for {sellAmount} shillings.", "A good trade! The {itemName} sold for {sellAmount} shillings."],
    horror: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} silver pieces.", "A strange collector takes that {itemName} off your hands for {sellAmount} silver pieces.", "A dark bargain! The {itemName} sold for {sellAmount} silver pieces."],
    cyberpunk: ["{playerName} offloads the {itemName} for {sellAmount} credits.", "A fixer takes that {itemName} off your hands for {sellAmount} credits.", "A good deal! The {itemName} sold for {sellAmount} credits."],
  },
  itemStored: {
    western: ["{playerName} stores the {itemName} away safely in their satchel.", "The {itemName} is tucked into the satchel for later."],
    japan: ["{playerName} stores the {itemName} away safely in their pouch.", "The {itemName} is tucked into the pouch for later."],
    safari: ["{playerName} stores the {itemName} away safely in their rucksack.", "The {itemName} is tucked into the rucksack for later."],
    horror: ["{playerName} stores the {itemName} away safely in their bag.", "The {itemName} is tucked into the bag for later."],
    cyberpunk: ["{playerName} stores the {itemName} away safely in their utility pouch.", "The {itemName} is tucked into the utility pouch for later."],
  },
  itemTaken: {
    western: ["{playerName} picks up the {itemName} and adds it to their gear.", "The {itemName} is yours now. It goes into your discard pile.", "{playerName} takes the {itemName}. A useful find."],
    japan: ["{playerName} picks up the {itemName} and adds it to their gear.", "The {itemName} is yours now. It goes into your discard pile.", "{playerName} takes the {itemName}. A useful find."],
    safari: ["{playerName} picks up the {itemName} and adds it to their gear.", "The {itemName} is yours now. It goes into your discard pile.", "{playerName} takes the {itemName}. A useful find."],
    horror: ["{playerName} picks up the {itemName} and adds it to their gear.", "The {itemName} is yours now. It goes into your discard pile.", "{playerName} takes the {itemName}. A useful find."],
    cyberpunk: ["{playerName} picks up the {itemName} and adds it to their gear.", "The {itemName} is yours now. It goes into your discard pile.", "{playerName} takes the {itemName}. A useful find."],
  },
  laudanumHeal: {
    western: ["The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.", "A swig of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}."],
    japan: ["The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.", "A sip of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}."],
    safari: ["The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.", "A dose of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}."],
    horror: ["The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.", "A draught of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}."],
    cyberpunk: ["The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.", "A dose of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}."],
  },
  laudanumNoHeal: {
    western: ["A swig of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.", "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward."],
    japan: ["A sip of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.", "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward."],
    safari: ["A dose of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.", "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward."],
    horror: ["A draught of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.", "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward."],
    cyberpunk: ["A dose of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.", "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward."],
  },
  mountainSicknessDrawReduction: { 
    western: ["The thin air takes its toll on {playerName}. You draw {reducedAmount} fewer cards due to Mountain Sickness.", "Gasping in the high altitude, {playerName} draws {reducedAmount} less cards."],
    japan: ["The thin air of the peaks takes its toll on {playerName}. You draw {reducedAmount} fewer cards due to Kami's Breath.", "Gasping in the high altitude, {playerName} draws {reducedAmount} less cards."],
    safari: ["The punishing sun takes its toll on {playerName}. You draw {reducedAmount} fewer cards due to Heat Stroke.", "Gasping in the heat, {playerName} draws {reducedAmount} less cards."],
    horror: ["The whispering peaks take their toll on {playerName}. You draw {reducedAmount} fewer cards due to madness.", "Gasping in the thin air, {playerName} draws {reducedAmount} less cards."],
    cyberpunk: ["The dense data-smog takes its toll on {playerName}. You draw {reducedAmount} fewer cards due to system lag.", "Gasping in the smog, {playerName} draws {reducedAmount} less cards."],
  },
  newDay: {
    western: ["Day {dayNumber}: The sun rises, casting long shadows across the plains for {playerName}.", "The morning brings a new set of challenges for {playerName}. Day {dayNumber}.", "Day {dayNumber}: A new dawn, a new day of survival for {playerName}."],
    japan: ["Day {dayNumber}: The sun rises over the rice paddies for {playerName}.", "The morning brings a new set of challenges for {playerName}. Day {dayNumber}.", "Day {dayNumber}: A new dawn, a new day of bushido for {playerName}."],
    safari: ["Day {dayNumber}: The sun rises over the savanna for {playerName}.", "The morning brings a new set of challenges for {playerName}. Day {dayNumber}.", "Day {dayNumber}: A new dawn, a new day of the hunt for {playerName}."],
    horror: ["Day {dayNumber}: The sun rises, a pale imitation of hope for {playerName}.", "The morning brings a new set of horrors for {playerName}. Day {dayNumber}.", "Day {dayNumber}: A new dawn, a new day of terror for {playerName}."],
    cyberpunk: ["Cycle {dayNumber}: The neon sun rises over the chrome towers for {playerName}.", "The morning brings a new set of contracts for {playerName}. Cycle {dayNumber}.", "Cycle {dayNumber}: A new dawn, a new day in the sprawl for {playerName}."],
  },
  newDayWithIllnessWorsened: {
    western: ["Day {dayNumber}: A restless night for {playerName}. The {illnessName} has worsened.", "The fevered dawn of Day {dayNumber} arrives. The {illnessName} tightens its grip on {playerName}."],
    japan: ["Day {dayNumber}: A restless night for {playerName}. The {illnessName} has worsened.", "The fevered dawn of Day {dayNumber} arrives. The {illnessName} tightens its grip on {playerName}."],
    safari: ["Day {dayNumber}: A restless night for {playerName}. The {illnessName} has worsened.", "The fevered dawn of Day {dayNumber} arrives. The {illnessName} tightens its grip on {playerName}."],
    horror: ["Day {dayNumber}: A restless night for {playerName}. The {illnessName} has worsened.", "The fevered dawn of Day {dayNumber} arrives. The {illnessName} tightens its grip on {playerName}."],
    cyberpunk: ["Cycle {dayNumber}: A restless night for {playerName}. The {illnessName} has worsened.", "The fevered dawn of Cycle {dayNumber} arrives. The {illnessName} tightens its grip on {playerName}."],
  },
  noGoldToSteal: {
    western: ["The {eventName} tries to rob {playerName}, but finds only empty pockets.", "'Your money or your life!' the {eventName} demands. {playerName} has no money to give."],
    japan: ["The {eventName} tries to rob {playerName}, but finds only empty pockets.", "'Your money or your life!' the {eventName} demands. {playerName} has no money to give."],
    safari: ["The {eventName} tries to rob {playerName}, but finds only empty pockets.", "'Your money or your life!' the {eventName} demands. {playerName} has no money to give."],
    horror: ["The {eventName} tries to rob {playerName}, but finds only empty pockets.", "'Your money or your life!' the {eventName} demands. {playerName} has no money to give."],
    cyberpunk: ["The {eventName} tries to hack {playerName}, but finds only empty credsticks.", "'Your creds or your chrome!' the {eventName} demands. {playerName} has no creds to give."],
  },
  objectiveVoided: {
    western: ["The terms of the contract were clear. By letting the target go, the objective '{objectiveName}' is now void."],
  },
  playerAttack: {
    western: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes hell on {enemyName} with the {itemName}, dealing {attackPower} damage."],
    japan: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a flurry of blows on {enemyName} with the {itemName}, dealing {attackPower} damage."],
    safari: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a devastating attack on {enemyName} with the {itemName}, dealing {attackPower} damage."],
    horror: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a desperate attack on {enemyName} with the {itemName}, dealing {attackPower} damage."],
    cyberpunk: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a hail of fire on {enemyName} with the {itemName}, dealing {attackPower} damage."],
  },
  playerCuresIllness: { 
    western: ["{playerName} shook off the {eventName} with {itemName}.", "That {itemName} worked wonders! {playerName} is cured of {eventName}."],
    japan: ["{playerName} shook off the {eventName} with {itemName}.", "That {itemName} worked wonders! {playerName} is cured of {eventName}."],
    safari: ["{playerName} shook off the {eventName} with {itemName}.", "That {itemName} worked wonders! {playerName} is cured of {eventName}."],
    horror: ["{playerName} shook off the {eventName} with {itemName}.", "That {itemName} worked wonders! {playerName} is cured of {eventName}."],
    cyberpunk: ["{playerName} purged the {eventName} with {itemName}.", "That {itemName} worked wonders! {playerName} is cured of {eventName}."],
  },
  playerDamage: {
    western: ["{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}."],
    japan: ["{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}."],
    safari: ["{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}."],
    horror: ["{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}."],
    cyberpunk: ["{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}."],
  },
  playerDeckFinalized: { 
    western: ["{playerName}'s kit is packed and ready for the trail. Health: {currentHP}/{maxHP}.", "Ready to ride! {playerName} begins the journey with {currentHP}/{maxHP} HP.", "The hand's been dealt. {playerName} starts with {currentHP}/{maxHP} HP."],
    japan: ["{playerName}'s gear is packed and ready for the road. Health: {currentHP}/{maxHP}.", "Ready to travel! {playerName} begins the journey with {currentHP}/{maxHP} HP.", "The hand's been dealt. {playerName} starts with {currentHP}/{maxHP} HP."],
    safari: ["{playerName}'s kit is packed and ready for the safari. Health: {currentHP}/{maxHP}.", "Ready to hunt! {playerName} begins the journey with {currentHP}/{maxHP} HP.", "The hand's been dealt. {playerName} starts with {currentHP}/{maxHP} HP."],
    horror: ["{playerName}'s gear is packed and ready for the darkness. Health: {currentHP}/{maxHP}.", "Ready to face the nightmare! {playerName} begins the journey with {currentHP}/{maxHP} HP.", "The hand's been dealt. {playerName} starts with {currentHP}/{maxHP} HP."],
    cyberpunk: ["{playerName}'s gear is packed and ready for the streets. Health: {currentHP}/{maxHP}.", "Ready to run! {playerName} begins the journey with {currentHP}/{maxHP} HP.", "The hand's been dealt. {playerName} starts with {currentHP}/{maxHP} HP."],
  },
  playerDefeat: { 
    western: ["{playerName} was defeated by {enemyName}. The frontier claims another soul.", "The journey ends here for {playerName}, bested by {enemyName}."],
    japan: ["{playerName} was defeated by {enemyName}. The road claims another soul.", "The journey ends here for {playerName}, bested by {enemyName}."],
    safari: ["{playerName} was defeated by {enemyName}. The savanna claims another soul.", "The journey ends here for {playerName}, bested by {enemyName}."],
    horror: ["{playerName} was defeated by {enemyName}. The darkness claims another soul.", "The journey ends here for {playerName}, bested by {enemyName}."],
    cyberpunk: ["{playerName} was defeated by {enemyName}. The sprawl claims another soul.", "The journey ends here for {playerName}, bested by {enemyName}."],
  },
  playerHeal: { 
    western: ["{playerName} patches themself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}."],
    japan: ["{playerName} tends to their wounds with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}."],
    safari: ["{playerName} patches themself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}."],
    horror: ["{playerName} patches themself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}."],
    cyberpunk: ["{playerName} patches themself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}."],
  },
  playerRecoversMaxHealth: { 
    western: ["Vitality returning. {playerName}'s max health is now {newMaxHealth}.", "Strength flows back. {playerName}'s max HP increased to {newMaxHealth}."],
    japan: ["Vitality returning. {playerName}'s max health is now {newMaxHealth}.", "Strength flows back. {playerName}'s max HP increased to {newMaxHealth}."],
    safari: ["Vitality returning. {playerName}'s max health is now {newMaxHealth}.", "Strength flows back. {playerName}'s max HP increased to {newMaxHealth}."],
    horror: ["Vitality returning. {playerName}'s max health is now {newMaxHealth}.", "Strength flows back. {playerName}'s max HP increased to {newMaxHealth}."],
    cyberpunk: ["System integrity returning. {playerName}'s max health is now {newMaxHealth}.", "Nanites at work. {playerName}'s max HP increased to {newMaxHealth}."],
  },
  playerVictory: {
    western: ["{playerName} has overcome the wilds! A new legend is born!", "{playerName} has survived the frontier! A tale to be told for ages."],
    japan: ["{playerName} has overcome the trials! A new legend is born!", "{playerName} has survived the journey! A tale to be told for ages."],
    safari: ["{playerName} has overcome the savanna! A new legend is born!", "{playerName} has survived the hunt! A tale to be told for ages."],
    horror: ["{playerName} has overcome the darkness! A new legend is born!", "{playerName} has survived the nightmare! A tale to be told for ages."],
    cyberpunk: ["{playerName} has overcome the sprawl! A new legend is born!", "{playerName} has survived the run! A tale to be told for ages."],
  },
  playerVictoryFinalDay: {
    western: ["{playerName} takes one last look at the setting sun, the long trail finally at its end.", "The dust settles. {playerName} has seen the journey through, a legend forged in grit and gunpowder."],
    japan: ["{playerName} takes one last look at the setting sun, the long road finally at its end.", "The dust settles. {playerName} has seen the journey through, a legend forged in honor and steel."],
    safari: ["{playerName} takes one last look at the setting sun, the long hunt finally at its end.", "The dust settles. {playerName} has seen the journey through, a legend forged in courage and skill."],
    horror: ["{playerName} takes one last look at the rising sun, the long night finally at its end.", "The darkness recedes. {playerName} has seen the journey through, a legend forged in fear and resolve."],
    cyberpunk: ["{playerName} takes one last look at the neon sunrise, the long run finally at its end.", "The static fades. {playerName} has seen the journey through, a legend forged in chrome and code."],
  },
  rockslideDiscardEquipped: {
    western: ["Caught in the {eventName}, {playerName} loses their footing and their gear! Lost: {discardedItemNames}.", "The {eventName} tears through the camp, sweeping away {discardedItemNames}!"],
    japan: ["Caught in the {eventName}, {playerName} loses their footing and their gear! Lost: {discardedItemNames}.", "The {eventName} tears through the camp, sweeping away {discardedItemNames}!"],
    safari: ["Caught in the {eventName}, {playerName} loses their footing and their gear! Lost: {discardedItemNames}.", "The {eventName} tears through the camp, sweeping away {discardedItemNames}!"],
    horror: ["Caught in the {eventName}, {playerName} loses their footing and their gear! Lost: {discardedItemNames}.", "The {eventName} tears through the camp, sweeping away {discardedItemNames}!"],
    cyberpunk: ["Caught in the {eventName}, {playerName} loses their footing and their gear! Lost: {discardedItemNames}.", "The {eventName} tears through the sector, sweeping away {discardedItemNames}!"],
  },
  rockslideIronWillSave: {
    western: ["A torrent of rock and debris! {playerName} stands firm against the {eventName}, saving their gear!", "With an iron will, {playerName} holds their ground and their gear through the {eventName}!"],
    japan: ["A torrent of rock and debris! {playerName} stands firm against the {eventName}, saving their gear!", "With an iron will, {playerName} holds their ground and their gear through the {eventName}!"],
    safari: ["A torrent of rock and debris! {playerName} stands firm against the {eventName}, saving their gear!", "With an iron will, {playerName} holds their ground and their gear through the {eventName}!"],
    horror: ["A torrent of rock and debris! {playerName} stands firm against the {eventName}, saving their gear!", "With an iron will, {playerName} holds their ground and their gear through the {eventName}!"],
    cyberpunk: ["A torrent of debris! {playerName} stands firm against the {eventName}, saving their gear!", "With an iron will, {playerName} holds their ground and their gear through the {eventName}!"],
  },
  storeRestock: { 
    western: ["{playerName} pays the storekeep {cost} Gold to clear the shelves and put out new stock."],
    japan: ["{playerName} pays the merchant {cost} mon to clear the shelves and put out new stock."],
    safari: ["{playerName} pays the trader {cost} shillings to clear the shelves and put out new stock."],
    horror: ["{playerName} pays the peddler {cost} silver pieces to clear the shelves and put out new stock."],
    cyberpunk: ["{playerName} pays the vendor {cost} credits to clear the shelves and put out new stock."],
  },
  threatDefeated: { 
    western: ["The {enemyName} has been defeated by {playerName}."],
    japan: ["The {enemyName} has been defeated by {playerName}."],
    safari: ["The {enemyName} has been defeated by {playerName}."],
    horror: ["The {enemyName} has been defeated by {playerName}."],
    cyberpunk: ["The {enemyName} has been defeated by {playerName}."],
  },
  threatDefeatedHigh: {
    western: ["The {enemyName} met its match today. The trail's a bit safer, thanks to {playerName}."],
    japan: ["The {enemyName} met its match today. The road's a bit safer, thanks to {playerName}."],
    safari: ["The {enemyName} met its match today. The savanna's a bit safer, thanks to {playerName}."],
    horror: ["The {enemyName} met its match today. The darkness is a bit safer, thanks to {playerName}."],
    cyberpunk: ["The {enemyName} met its match today. The sprawl's a bit safer, thanks to {playerName}."],
  },
  threatDefeatedLow: {
    western: ["{playerName} dealt with the {enemyName}. Just another day on the frontier."],
    japan: ["{playerName} dealt with the {enemyName}. Just another day on the road."],
    safari: ["{playerName} dealt with the {enemyName}. Just another day on the savanna."],
    horror: ["{playerName} dealt with the {enemyName}. Just another day in the darkness."],
    cyberpunk: ["{playerName} dealt with the {enemyName}. Just another day in the sprawl."],
  },
  threatDefeatedMid: {
    western: ["Another one bites the dust. {playerName} sent the {enemyName} packing."],
    japan: ["Another one bites the dust. {playerName} sent the {enemyName} packing."],
    safari: ["Another one bites the dust. {playerName} sent the {enemyName} packing."],
    horror: ["Another one bites the dust. {playerName} sent the {enemyName} packing."],
    cyberpunk: ["Another one bites the dust. {playerName} sent the {enemyName} packing."],
  },
  threatFlees: {
    western: ["The {enemyName} decides {playerName} is not worth the trouble and flees.", "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the brush."],
    japan: ["The {enemyName} decides {playerName} is not worth the trouble and flees.", "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the bamboo."],
    safari: ["The {enemyName} decides {playerName} is not worth the trouble and flees.", "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the tall grass."],
    horror: ["The {enemyName} decides {playerName} is not worth the trouble and flees.", "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the shadows."],
    cyberpunk: ["The {enemyName} decides {playerName} is not worth the trouble and flees.", "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the smog."],
  },
  trapBroken: {
    western: ["The powerful {enemyName} breaks free from the {trapName}, taking {damageAmount} damage in the process!", "With a roar, the {enemyName} smashes the {trapName}, but not before taking {damageAmount} damage."],
    japan: ["The powerful {enemyName} breaks free from the {trapName}, taking {damageAmount} damage in the process!", "With a roar, the {enemyName} smashes the {trapName}, but not before taking {damageAmount} damage."],
    safari: ["The powerful {enemyName} breaks free from the {trapName}, taking {damageAmount} damage in the process!", "With a roar, the {enemyName} smashes the {trapName}, but not before taking {damageAmount} damage."],
    horror: ["The powerful {enemyName} breaks free from the {trapName}, taking {damageAmount} damage in the process!", "With a roar, the {enemyName} smashes the {trapName}, but not before taking {damageAmount} damage."],
    cyberpunk: ["The powerful {enemyName} breaks free from the {trapName}, taking {damageAmount} damage in the process!", "With a roar, the {enemyName} smashes the {trapName}, but not before taking {damageAmount} damage."],
  },
  trapCaught: {
    western: ["Success! The {trapName} snaps shut on the unsuspecting {enemyName}!", "Got 'em! The {enemyName} is caught fast in the {trapName}."],
    japan: ["Success! The {trapName} snaps shut on the unsuspecting {enemyName}!", "Got 'em! The {enemyName} is caught fast in the {trapName}."],
    safari: ["Success! The {trapName} snaps shut on the unsuspecting {enemyName}!", "Got 'em! The {enemyName} is caught fast in the {trapName}."],
    horror: ["Success! The {trapName} snaps shut on the unsuspecting {enemyName}!", "Got 'em! The {enemyName} is caught fast in the {trapName}."],
    cyberpunk: ["Success! The {trapName} snaps shut on the unsuspecting {enemyName}!", "Got 'em! The {enemyName} is caught fast in the {trapName}."],
  },
  trapHumanBrokeNoDamage: {
    western: ["The wily {enemyName} spots the {trapName} at the last second and disables it.", "'Not today,' mutters the {enemyName}, carefully disarming the {trapName}."],
    japan: ["The wily {enemyName} spots the {trapName} at the last second and disables it.", "'Not today,' mutters the {enemyName}, carefully disarming the {trapName}."],
    safari: ["The wily {enemyName} spots the {trapName} at the last second and disables it.", "'Not today,' mutters the {enemyName}, carefully disarming the {trapName}."],
    horror: ["The wily {enemyName} spots the {trapName} at the last second and disables it.", "'Not today,' mutters the {enemyName}, carefully disarming the {trapName}."],
    cyberpunk: ["The wily {enemyName} spots the {trapName} at the last second and disables it.", "'Not today,' mutters the {enemyName}, carefully disarming the {trapName}."],
  },
};

const bossLogTemplates: Record<string, Partial<Record<Theme, string[]>>> = {
  playerAttack: {
    western: ["{playerName} goes for broke, attacking {enemyName} with {itemName} for {attackPower} damage!", "With grim determination, {playerName} unleashes a devastating blow with the {itemName}, dealing {attackPower} damage to the legendary {enemyName}!"],
    japan: ["{playerName} unleashes a secret technique, striking {enemyName} with the {itemName} for {attackPower} damage!", "For the honor of my clan! {playerName}'s {itemName} bites deep, dealing {attackPower} damage to the mighty {enemyName}!"],
    safari: ["{playerName} takes the shot of a lifetime, hitting {enemyName} with the {itemName} for {attackPower} damage!", "With the roar of the savanna in their heart, {playerName} strikes the legendary {enemyName} for {attackPower} damage!"],
    horror: ["Against all hope, {playerName} strikes a blow against the darkness! The {itemName} deals {attackPower} damage to {enemyName}!", "'Back to the hell that spawned you!' {playerName} attacks {enemyName} for {attackPower} damage!"],
    cyberpunk: ["{playerName} executes a critical exploit, hitting {enemyName} with the {itemName} for {attackPower} damage!", "Overcharging all systems! {playerName}'s {itemName} slams into the legendary {enemyName} for {attackPower} damage!"],
  },
  playerDamage: {
    western: ["The legendary {sourceName} lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}."],
    japan: ["The legendary {sourceName} lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}."],
    safari: ["The legendary {sourceName} lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}."],
    horror: ["The legendary {sourceName} lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}."],
    cyberpunk: ["The legendary {sourceName} lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}."],
  },
  playerHeal: {
    western: ["No time to rest, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Buying a precious moment, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}."],
    japan: ["No time to rest, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Buying a precious moment, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}."],
    safari: ["No time to rest, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Buying a precious moment, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}."],
    horror: ["No time to rest, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Buying a precious moment, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}."],
    cyberpunk: ["No time to rest, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Buying a precious moment, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}."],
  },
  trapCaught: {
    western: ["In an unbelievable turn of events, the legendary {enemyName} stumbles right into {playerName}'s {trapName}!", "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!"],
    japan: ["In an unbelievable turn of events, the legendary {enemyName} stumbles right into {playerName}'s {trapName}!", "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!"],
    safari: ["In an unbelievable turn of events, the legendary {enemyName} stumbles right into {playerName}'s {trapName}!", "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!"],
    horror: ["In an unbelievable turn of events, the legendary {enemyName} stumbles right into {playerName}'s {trapName}!", "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!"],
    cyberpunk: ["In an unbelievable turn of events, the legendary {enemyName} stumbles right into {playerName}'s {trapName}!", "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!"],
  },
  trapBroken: {
    western: ["The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!", "With a contemptuous roar, {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!"],
    japan: ["The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!", "With a contemptuous roar, {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!"],
    safari: ["The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!", "With a contemptuous roar, {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!"],
    horror: ["The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!", "With a contemptuous roar, {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!"],
    cyberpunk: ["The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!", "With a contemptuous roar, {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!"],
  },
};

const characterMotivationLogTemplates: {
  trigger: string;
  condition: (player: PlayerDetails, card?: CardData, isBossFight?: boolean) => boolean;
  chance: number;
  messages: Partial<Record<Theme, string[]>>;
}[] = [
  // ... (content from characterMotivationLogTemplates.ts) ...
];


export interface LogParams {
  playerName?: string;
  characterName?: string;
  itemName?: string;
  sourceName?: string; 
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
  objectiveName?: string; 
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
  
  if (player && (params.playerName === '' || params.playerName === null || params.playerName === undefined)) {
    params.playerName = player.name;
  }
  
  if (params.playerName === '' || params.playerName === null || params.playerName === undefined) {
    if (theme === 'japan') params.playerName = 'The Ronin';
    else if (theme === 'safari') params.playerName = 'The Hunter';
    else if (theme === 'horror') params.playerName = 'The Survivor';
    else if (theme === 'cyberpunk') params.playerName = 'The Operator';
    else params.playerName = 'The Pioneer';
  }

  // --- Pop Culture Catchphrase Logic ---
  if (player?.name && player.character) {
    const lowerCasePlayerName = player.name.toLowerCase();
    const activeCheat = POP_CULTURE_CHEATS.find(
      c => c.name.toLowerCase() === lowerCasePlayerName && c.requiredCharacterId === player.character?.id
    );

    if (activeCheat?.effects.catchphrases) {
      const phrasesForCategory = activeCheat.effects.catchphrases[category as keyof typeof activeCheat.effects.catchphrases];
      
      // Use catchphrase with a high probability
      if (phrasesForCategory && phrasesForCategory.length > 0 && Math.random() < 0.8) { // 80% chance
        let template = phrasesForCategory[Math.floor(Math.random() * phrasesForCategory.length)];
        
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            const value = params[key] !== undefined && params[key] !== null ? String(params[key]) : '';
            template = template.replace(new RegExp(`{${key}}`, 'g'), value);
          }
        }
        return template; // Return early with the catchphrase
      }
    }
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
  
  let categoryTemplates;
  if (isBossFight) {
    categoryTemplates = bossLogTemplates[category] || logTemplates[category];
  } else {
    categoryTemplates = logTemplates[category];
  }
  const genericMessages = (categoryTemplates && (categoryTemplates[theme] || categoryTemplates['western'])) || [];
  
  let finalMessagePool: string[] = [];
  const useGenericOverride = Math.random() < 0.5;

  if (validPersonalityMessages.length > 0 && !useGenericOverride) {
      finalMessagePool = validPersonalityMessages;
  } else if (genericMessages.length > 0) {
      finalMessagePool = genericMessages;
  } else {
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
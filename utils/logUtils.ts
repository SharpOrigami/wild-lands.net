import { PlayerDetails, CardData, Theme } from '../types.ts';
import { getThemeName } from './themeUtils.ts';

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
  itemBought: {
    western: [
      "You barter for a new {itemName}, parting with {cost} Gold.",
      "The {itemName} changes hands for {cost} Gold. A fine purchase.",
      "You part with {cost} Gold for a much-needed {itemName}.",
      "A deal is struck. The {itemName} is yours for {cost} Gold.",
    ],
    japan: [
        "The merchant sells you a {itemName} for {cost} Mon.",
        "For {cost} Mon, the {itemName} is now yours.",
        "You pay the merchant {cost} Mon for the {itemName}.",
        "A shrewd trade. You acquire the {itemName} for {cost} Mon.",
    ],
    safari: [
        "The quartermaster provides a {itemName} for {cost} Shillings.",
        "For {cost} Shillings, a {itemName} is added to your supplies.",
        "You pay the outfitter {cost} Shillings for a new {itemName}.",
        "A necessary expense. You purchase a {itemName} for {cost} Shillings.",
    ],
    horror: [
        "You give the shrouded figure {cost} Silver for the {itemName}.",
        "For {cost} Silver, the strange {itemName} is taken from the peddler's cart.",
        "A grim transaction. The {itemName} costs you {cost} Silver.",
        "Necessity demands it. You buy a {itemName} for {cost} Silver.",
    ],
    cyberpunk: [
        "Transaction complete. {cost} Creds transferred for one {itemName}.",
        "You slot a cred-chip. The fixer slides over the {itemName}. Cost: {cost} Creds.",
        "The vendor drone dispenses a {itemName}. Your account is lighter by {cost} Creds.",
        "Good hardware ain't cheap. You pay {cost} Creds for the {itemName}.",
    ],
  },
  itemSold: {
    western: [
      "You lighten your load, selling the {itemName} for {sellAmount} Gold.",
      "A savvy buyer takes that {itemName} off your hands for {sellAmount} Gold.",
      "A good trade! The {itemName} sold for {sellAmount} cold hard cash.",
      "You offload the {itemName} for a tidy sum of {sellAmount} Gold.",
      "You haggle with a merchant and get {sellAmount} Gold for the {itemName}.",
      "Another man's trash... The {itemName} is sold for {sellAmount} Gold.",
      "The merchant looks over the {itemName}. '{sellAmount} Gold,' he grunts. Deal.",
      "You get {sellAmount} Gold for the {itemName}. Not a bad piece of business.",
      "The sale of the {itemName} nets you {sellAmount} Gold.",
    ],
    japan: [
        "You sell the {itemName}, earning {sellAmount} Mon for the road ahead.",
        "The merchant inspects the {itemName} and offers you {sellAmount} Mon.",
        "A quick sale. The {itemName} fetches {sellAmount} Mon.",
        "The traveling merchant is pleased with the {itemName} and pays {sellAmount} Mon.",
        "You trade the {itemName} for {sellAmount} Mon. A fair price.",
    ],
    safari: [
        "You sell the {itemName} to the camp outfitter for {sellAmount} Shillings.",
        "The safari lead barters for the {itemName}, giving you {sellAmount} Shillings.",
        "Extra gear sold. The {itemName} brings in {sellAmount} Shillings.",
        "The quartermaster takes the {itemName} for the expedition's stores, paying {sellAmount} Shillings.",
        "You find a buyer for the {itemName}, earning {sellAmount} Shillings.",
    ],
    horror: [
        "You sell the {itemName} to a collector of strange things for {sellAmount} Silver.",
        "The old crone in the village offers you {sellAmount} Silver for the {itemName}.",
        "A hooded figure in a dark alley pays {sellAmount} Silver for the {itemName}, no questions asked.",
        "The village peddler eyes the {itemName} strangely, but pays the {sellAmount} Silver you ask.",
    ],
    cyberpunk: [
        "You unload the {itemName} at a pawn shop for {sellAmount} Creds.",
        "The fixer fences the {itemName}, kicking {sellAmount} Creds back to you.",
        "Data-slug uploaded, creds transferred. The {itemName} is sold for {sellAmount} Creds.",
        "The item is offloaded at a street market for {sellAmount} Creds.",
        "A quick transaction on the shadow net. {itemName} sold for {sellAmount} Creds.",
    ],
  },
  itemEquipped: {
    western: [
      "You equip the {itemName}, ready for what's next.",
      "Gearing up. The {itemName} is now ready.",
      "The {itemName} is readied for the trail ahead.",
    ],
    japan: [
        "You don the {itemName}, ready for what lies ahead.",
        "The {itemName} is readied.",
        "You are now properly equipped with the {itemName}.",
    ],
    safari: [
        "You equip the {itemName}. Ready for the hunt.",
        "The {itemName} is prepared.",
        "Ready for anything. The {itemName} is now equipped.",
    ],
    horror: [
        "You equip the {itemName}, a small comfort against the darkness.",
        "The {itemName} is readied against the encroaching dread.",
        "A moment of preparation. You equip the {itemName}.",
    ],
    cyberpunk: [
        "You integrate the {itemName} into your loadout.",
        "System check... {itemName} online and equipped.",
        "The {itemName} is slotted into place. You're ready for the run.",
    ],
  },
  itemTaken: {
    western: [
      "You pick up the {itemName} and add it to your gear.",
      "The {itemName} is yours now. It goes into your discard pile.",
      "You take the {itemName}. A useful find.",
    ],
    japan: [
      "You take the {itemName}. It may prove useful on your journey.",
      "The {itemName} is collected and added to your belongings.",
      "A fortunate find. You take the {itemName}.",
    ],
    safari: [
      "You add the {itemName} to your kit. An excellent find.",
      "The {itemName} is recovered from the trail.",
      "A useful piece of gear. You take the {itemName}.",
    ],
    horror: [
      "With a shudder, you take the {itemName}. Who knows what foulness clings to it.",
      "You snatch the {itemName} from the ground. Every little bit helps.",
      "The {itemName} is taken. You hope it is not cursed.",
    ],
    cyberpunk: [
      "Salvage acquired. {itemName} added to your inventory.",
      "{itemName} integrated into your loadout. A good find on the street.",
      "You jack the {itemName}. It's yours now.",
    ],
  },
  storeRestock: { 
    western: ["You pay the storekeep {cost} Gold to clear the shelves and put out new stock."],
    japan: ["You pay the merchant {cost} Mon to reveal new wares from his cart."],
    safari: ["You pay the quartermaster {cost} Shillings to bring out a new crate of supplies."],
    horror: ["You pay the shrouded figure {cost} Silver to rearrange his grim collection."],
    cyberpunk: ["You pay {cost} Creds to refresh the vendor's inventory on the datascreen."],
  },
  eventRevealObjective: {
    western: ["A new contract arrives for {playerName}: '{objectiveName}'. The request is clear: {objective_description}"],
    japan: ["A decree from a local daimyo has been posted: '{objectiveName}'. {playerName} must adhere to the following: {objective_description}"],
    safari: ["The safari's benefactor has a special request: '{objectiveName}'. The objective: {objective_description}"],
    horror: ["A desperate plea reaches {playerName}: '{objectiveName}'. The strange condition is: {objective_description}"],
    cyberpunk: ["A new bounty hits the net: '{objectiveName}'. The client's special condition is: {objective_description}"],
  },
  eventRevealThreatLow: {
    western: [
      "A {enemyName} shuffles into view. It looks hostile.",
      "A {enemyName} wanders onto the path, its eyes fixed on you.",
      "The rustle in the bushes reveals a {enemyName}. It doesn't look friendly.",
    ],
    japan: [
      "A lesser {enemyName} blocks the path. It eyes you with malice.",
      "An lesser {enemyName} appears. Its intentions are clearly hostile.",
    ],
    safari: [
      "A {enemyName} is spotted nearby. It watches you with predatory intent.",
      "Movement in the tall grass reveals a {enemyName}. It has not fled. Best to keep your distance.",
    ],
    horror: [
      "A wretched {enemyName} emerges from the gloom. A lesser horror, but still a threat.",
      "From the shadows, a lowly {enemyName} lurches forth.",
    ],
    cyberpunk: [
      "A low-level {enemyName} appears, its optical sensors glowing red.",
      "A rogue {enemyName} unit whirs into view. Hostile intent detected.",
    ],
  },
  eventRevealThreatMid: {
    western: [
      "Trouble's brewin'... a {enemyName} rears its ugly head on the trail.",
      "The sound of trouble... a {enemyName} is blocking your way.",
    ],
    japan: [
      "A formidable {enemyName} appears! Caution is advised.",
      "A worthy opponent! A {enemyName} challenges you!",
    ],
    safari: [
      "Danger! A {enemyName} has been provoked and now stands in your way.",
      "You've stumbled into the territory of a {enemyName}. It's not pleased.",
    ],
    horror: [
      "A greater terror, a {enemyName}, now stalks from the shadows.",
      "The air grows heavy. A menacing {enemyName} materializes.",
    ],
    cyberpunk: [
      "CorpSec is escalating. A {enemyName} unit has been deployed to your location.",
      "Hostile detected. A {enemyName} unit moves to intercept.",
    ],
  },
  eventRevealThreatHigh: {
    western: [
      "Hold your horses! An unwelcome visitor: the notorious {enemyName} appears!",
      "This is the big one! The legendary {enemyName} stands before you!",
    ],
    japan: [
      "A great challenge appears! The legendary {enemyName} stands before you!",
      "Destiny awaits! The great {enemyName} has revealed itself!",
    ],
    safari: [
      "The ground trembles... it's the legendary {enemyName}!",
      "The hunt of a lifetime! The great {enemyName} is here!",
    ],
    horror: [
      "The air grows cold. The dreaded {enemyName} has found you!",
      "The source of the dread... The terrible {enemyName} has come for you!",
    ],
    cyberpunk: [
      "Threat level critical! A high-level {enemyName} is closing on your position!",
      "Alert! Prime-target {enemyName} is on your six! This is gonna be messy.",
    ],
  },
  eventRevealEnvironmental: {
    western: [
      "The sky darkens ominously... a {eventName} is upon you!",
      "The very land turns against you! A {eventName} strikes!",
      "Look out! A {eventName}!",
    ],
    japan: [
        "The kami are displeased! A {eventName} descends!",
        "The earth groans in anger! A {eventName}!",
        "Nature's fury is unleashed as a {eventName} strikes!",
    ],
    safari: [
        "The savanna trembles! A {eventName} is imminent!",
        "The sky turns a sickly yellow... a {eventName} approaches!",
        "Danger from the elements! A {eventName}!",
    ],
    horror: [
        "The world itself seems to bleed... a {eventName} begins!",
        "The laws of nature are broken! A {eventName} occurs!",
        "The very air crackles with malevolence! A {eventName}!",
    ],
    cyberpunk: [
        "System warning: environmental hazard detected! A {eventName} is imminent!",
        "The city's infrastructure fails! A {eventName} is happening!",
        "Atmospheric anomaly detected: {eventName}!",
    ],
  },
  threatDefeatedLow: {
    western: ["You dealt with the {enemyName}. Just another day on the frontier."],
    japan: ["You dispatched the {enemyName} with a single, elegant strike."],
    safari: ["You handle the {enemyName} with practiced ease. The safari continues."],
    horror: ["The lesser creature, {enemyName}, is sent back to the abyss from whence it came."],
    cyberpunk: ["You zeroed the {enemyName}. Another piece of scrap for the junk heaps."],
  },
  threatDefeatedMid: {
    western: ["Another one bites the dust. You've sent the {enemyName} packing."],
    japan: ["The {enemyName} fought well, but fell to your superior skill."],
    safari: ["A fine kill! You have successfully hunted the {enemyName}."],
    horror: ["With grim determination, you put an end to the {enemyName}."],
    cyberpunk: ["The {enemyName} has been decommissioned. Permanently."],
  },
  threatDefeatedHigh: {
    western: ["The {enemyName} met its match today. The trail's a bit safer, thanks to you."],
    japan: ["A mighty blow fells the great {enemyName}! Your legend grows!"],
    safari: ["A magnificent trophy! You have brought down the powerful {enemyName}!"],
    horror: ["A great evil is vanquished! You have defeated the terrible {enemyName}!"],
    cyberpunk: ["Target neutralized. The high-threat {enemyName} has been dismantled."],
  },
  laudanumHeal: {
    western: [
      "The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.",
      "A swig of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}.",
      "The world grows hazy, but the pain recedes. Healed for {healAmount} health.",
      "A blessed numbness washes over you. The {itemName} restores {healAmount} HP.",
    ],
    japan: [
      "The {itemName} brings a welcome calm, restoring {healAmount} HP. Your ki feels stronger.",
      "The poppy's kiss eases the pain, restoring {healAmount} HP."
    ],
    safari: [
      "A dose of {itemName} dulls the ache, recovering {healAmount} HP.",
      "The potent medicine works quickly, patching you up for {healAmount} HP."
    ],
    horror: [
      "The {itemName} offers a moment of relief from the torment, healing for {healAmount} HP.",
      "A blessed respite. The {itemName} closes the wounds, restoring {healAmount} HP."
    ],
    cyberpunk: [
      "The {itemName} floods your system with painkillers, repairing bioware for {healAmount} HP.",
      "Nanites go to work, spurred by the {itemName}. Recovered {healAmount} HP."
    ],
  },
  laudanumNoHeal: {
    western: [
      "A swig of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.",
      "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward.",
      "The {itemName} offers a moment of peace, a welcome respite even without wounds to mend.",
      "With no wounds to mend, you take the {itemName} anyway. Best be careful... this could become a habit.",
      "A preemptive dose of {itemName}. The world softens, a dangerous comfort.",
      "You're not hurt, but the call of the {itemName} is strong. You take a sip to steady your nerves.",
    ],
    japan: [
      "The {itemName} offers a dreamy haze, a brief escape from the world.",
      "With your spirit already whole, you partake in the {itemName}. The world softens at the edges.",
      "The poppy's comfort is sought not for pain, but for a moment of tranquility.",
      "Though your body is whole, you drink the {itemName}. One must be wary of such comforts.",
      "The poppy's kiss is taken not for pain, but for the quiet it brings to a troubled mind. A risky path.",
    ],
    safari: [
      "A preventative dose of {itemName}. A strange calm settles in.",
      "With no injuries to treat, the {itemName} is taken nonetheless. The strain of the expedition eases for a moment.",
      "The medicine chest is opened for the {itemName}, though you are hale and hearty. The psychological relief is palpable.",
      "The strain of the hunt is a wound of its own. You take the {itemName} to ease the mind, not the body.",
      "A dangerous luxury. With no injuries, you use the {itemName} to escape the oppressive heat for a moment.",
    ],
    horror: [
      "Already whole, the {itemName} is consumed. A dangerous habit begins...",
      "Physical horrors have not taken their toll, yet solace is sought in the {itemName}. The mental scars remain.",
      "To dull the terror, not the pain, the {itemName} is used. The world recedes to a manageable distance.",
      "It's not the body that needs mending. You take the {itemName} to quiet the horrors in your mind. A slippery slope.",
      "Physical wounds are the least of your worries. The {itemName} offers a brief, welcome numbness.",
    ],
    cyberpunk: [
      "The {itemName} brings a pleasant system buzz, but no repairs were needed.",
      "System integrity at 100%, but the {itemName} is used anyway. Sometimes you just need to take the edge off the chrome.",
      "The stim is used not for repairs, but for the quiet it brings to a mind overloaded with data-static.",
      "System integrity is fine, but the mind is frayed. You use the {itemName} to mute the static. Careful not to get addicted.",
      "Sometimes, you just need to disconnect. The {itemName} is used, though no repairs were necessary.",
    ],
  },
  playerVictoryFinalDay: {
    western: [
      "{playerName} takes one last look at the setting sun, the long trail finally at its end.",
      "The dust settles. {playerName} has seen the journey through, a legend forged in grit and gunpowder.",
      "With the final threat dealt with, {playerName} makes camp one last time, a sense of peace settling over the weary frontier.",
      "The prairie wind whispers a new name tonight: {playerName}. The story of their journey is complete.",
      "A quiet satisfaction. {playerName} breathes in the cool night air, the trials of the wild lands behind them.",
      "The final chapter is written. {playerName} has faced the worst the frontier could throw at them, and won.",
      "One last campfire under the stars. {playerName} has earned their rest, their victory echoing across the plains.",
      "The journey's end. {playerName} has stared into the heart of the wild lands and emerged victorious.",
    ],
    japan: [
        "The moon rises over a peaceful landscape. {playerName}'s long journey has reached its conclusion.",
        "The final demon is exorcised. {playerName}'s tale will be told in kabuki for generations to come.",
        "{playerName} cleans their blade one last time, the reflection showing a warrior who has found victory.",
        "Silence falls upon the province. The story of the wandering warrior, {playerName}, is now a legend.",
        "With a final bow to the spirits of the land, {playerName} concludes their arduous pilgrimage.",
        "The ink dries on the scroll that tells of {playerName}'s triumph over the great evil.",
        "{playerName} watches the cherry blossoms fall, a symbol of the beautiful, fleeting nature of their victorious journey.",
        "The path ends here. {playerName} has walked the warrior's road to its glorious end.",
    ],
    safari: [
        "The savanna grows quiet as night falls. {playerName}'s great hunt is finally over.",
        "The last entry is made in the expedition log. {playerName} has conquered the continent's greatest challenge.",
        "Under the vast African sky, {playerName} rests, the thrill of the final victory coursing through them.",
        "The drums in the distance beat a new rhythm, one of triumph for the great hunter, {playerName}.",
        "The smoke from the campfire curls into the starry night. {playerName}'s safari has reached a successful, legendary end.",
        "The whispers on the wind have changed from warnings to praise. {playerName} is victorious.",
        "{playerName} listens to the sounds of the bush, no longer a threat, but a chorus to their victory.",
        "The final trophy is claimed. {playerName}'s legendary expedition is complete.",
    ],
    horror: [
        "Dawn breaks, the first true dawn in what feels like an eternity. {playerName} has survived the night.",
        "The curse is broken. The long, horrifying road has ended, and {playerName} is finally free.",
        "With the great evil vanquished, {playerName} finds a place to rest, the oppressive darkness finally lifting.",
        "The whispers in the dark have fallen silent. {playerName}'s name will be a ward against evil for years to come.",
        "A moment of blessed silence. {playerName} watches the sun rise, a survivor of the unspeakable.",
        "The final page of the grimoire is burned. {playerName}'s harrowing tale ends not in madness, but in triumph.",
        "{playerName} lays down their arms, the weight of the hunt finally lifted from their weary shoulders.",
        "The nightmare is over. {playerName} has faced the abyss and emerged, forever changed but victorious.",
    ],
    cyberpunk: [
        "System shutdown sequence complete. {playerName}'s final run has come to a successful conclusion.",
        "The last of the hostile code has been purged. {playerName}'s legend is now hardcoded into the street's memory.",
        "With the net's greatest threat zeroed, {playerName} jacks out one last time, the silence of the real world a welcome relief.",
        "The data packets settle. The story of the runner, {playerName}, is uploaded to the archives of legends.",
        "Mission accomplished. {playerName} watches the neon rain fall, the adrenaline of the final encounter fading to a quiet hum.",
        "The final bounty is collected. {playerName}'s rep is solidified; they are the best there is.",
        "{playerName} powers down their rig, the ghost in the machine finally laid to rest.",
        "The run is over. {playerName} has stared into the digital abyss and uploaded a victory message.",
    ],
  },
  playerAttack: {
    western: [
      "{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.",
      "{playerName} unleashes hell on {enemyName} with the {itemName}, dealing {attackPower} damage.",
      "With a roar, {playerName} strikes the {enemyName} with their {itemName} for {attackPower} damage.",
      "The {itemName} finds its mark! {enemyName} takes {attackPower} damage.",
      "{playerName}'s attack with the {itemName} connects, inflicting {attackPower} damage on {enemyName}.",
      "A quick draw and a flash of steel! {attackPower} damage to {enemyName}.",
      "The air cracks with the sound of the {itemName}, dealing {attackPower} damage.",
      "{playerName} lands a solid blow on {enemyName} for {attackPower} damage.",
    ],
    japan: [
      "{playerName} strikes with the focus of a master, dealing {attackPower} damage to {enemyName} with the {itemName}.",
      "A swift and deadly blow! The {itemName} cuts into {enemyName} for {attackPower} damage.",
      "With a kiai, {playerName}'s {itemName} lands true, inflicting {attackPower} damage upon {enemyName}.",
    ],
    safari: [
      "{playerName} takes aim and fires! The {itemName} hits {enemyName} for {attackPower} damage.",
      "A well-placed shot! {playerName}'s {itemName} strikes {enemyName} for {attackPower} damage.",
      "The hunter strikes! The {itemName} connects with {enemyName}, dealing {attackPower} damage.",
    ],
    horror: [
      "{playerName} fights back the darkness, striking {enemyName} with the {itemName} for {attackPower} damage.",
      "With grim determination, {playerName}'s {itemName} bites into the creature for {attackPower} damage.",
      "The {itemName} glows with righteous fury, inflicting {attackPower} damage on the wretched {enemyName}.",
    ],
    cyberpunk: [
      "{playerName} executes combat protocol, hitting {enemyName} with the {itemName} for {attackPower} damage.",
      "Target locked. {playerName}'s {itemName} delivers {attackPower} damage to {enemyName}.",
      "Lethal force authorized. The {itemName} impacts {enemyName}, causing {attackPower} damage.",
    ],
  },
  playerHeal: { 
    western: [
      "You patch yourself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.",
      "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}.",
      "The {sourceName} restores {healAmount} HP. Your health is now {currentHP}/{maxHP}.",
      "A moment's respite. The {sourceName} mends your wounds, restoring {healAmount} HP. ({currentHP}/{maxHP})",
      "That's better. {sourceName} patches you up for {healAmount} HP. Current health: {currentHP}/{maxHP}.",
      "A welcome relief. You use {sourceName} and regain {healAmount} health.",
      "The {sourceName} works its magic, healing you for {healAmount} HP.",
    ],
    japan: [
      "The {sourceName} restores your ki, healing {healAmount} HP. Your spirit is now {currentHP}/{maxHP}.",
      "A moment of healing. You use the {sourceName} to recover {healAmount} HP. ({currentHP}/{maxHP})",
    ],
    safari: [
      "The expedition's supplies come in handy. {sourceName} restores {healAmount} HP. ({currentHP}/{maxHP})",
      "You tend to your injuries with {sourceName}, recovering {healAmount} HP. Now at {currentHP}/{maxHP}.",
    ],
    horror: [
      "A brief reprieve from the suffering. {sourceName} restores {healAmount} HP. ({currentHP}/{maxHP})",
      "The blessed {sourceName} closes your wounds, healing {healAmount} HP. Now at {currentHP}/{maxHP}.",
    ],
    cyberpunk: [
      "Nanites get to work. {sourceName} repairs {healAmount} damage. System integrity: {currentHP}/{maxHP}.",
      "Patching the chrome. {sourceName} restores {healAmount} HP. Now at {currentHP}/{maxHP}.",
    ],
  },
  playerDefeat: { 
    western: [
      "{playerName} was defeated by {enemyName}. The frontier claims another soul.",
      "The journey ends here for {playerName}, bested by {enemyName}.",
      "{enemyName} proved too much for {playerName}. Their story fades into the dust.",
    ],
    japan: [
      "{playerName} has fallen to {enemyName}. A warrior's journey ends in shadow.",
      "Defeated by {enemyName}, {playerName}'s tale becomes a cautionary one whispered in dojos.",
      "The blade of {enemyName} was too swift. {playerName}'s journey is over.",
    ],
    safari: [
      "{playerName} was bested by {enemyName}. The savanna is unforgiving.",
      "The great hunt ends in failure. {playerName} has fallen to {enemyName}.",
      "{enemyName} proved to be the apex predator. {playerName}'s expedition is over.",
    ],
    horror: [
      "{playerName} has been consumed by the darkness. The {enemyName} claims another victim.",
      "The nightmare triumphs. {playerName} is lost to the horrors of this land, defeated by {enemyName}.",
      "Defeated by {enemyName}, {playerName}'s screams now echo in this cursed place.",
    ],
    cyberpunk: [
      "{playerName} has been flatlined by {enemyName}. Another ghost in the machine.",
      "System shutdown. {playerName}'s run has been terminated by {enemyName}.",
      "The street always wins. {enemyName} proved too much for {playerName}.",
    ],
  },
  newDay: {
    western: [
      "Day {dayNumber}: The sun rises, casting long shadows across the plains.",
      "The morning brings a new set of challenges. Day {dayNumber}.",
      "Day {dayNumber}: A new dawn, a new day of survival.",
    ],
    japan: [
        "Day {dayNumber}: The morning mist lifts, revealing the path ahead.",
        "The sun rises over the mountains. Day {dayNumber}.",
        "Day {dayNumber}: A new day for the wandering samurai.",
    ],
    safari: [
        "Day {dayNumber}: The savanna awakens with the morning sun.",
        "The sounds of the bush greet the new day. Day {dayNumber}.",
        "Day {dayNumber}: The hunt continues under the African sun.",
    ],
    horror: [
        "Day {dayNumber}: Dawn breaks, but the shadows linger.",
        "The gray morning light offers little comfort. Day {dayNumber}.",
        "Day {dayNumber}: Another day survived in this cursed land.",
    ],
    cyberpunk: [
        "Day {dayNumber}: The smog-filtered sunlight breaks through the high-rises.",
        "Morning in the neon city. Day {dayNumber}.",
        "Day {dayNumber}: A new cycle. Time to make some creds.",
    ],
  },
  newDayWithIllnessWorsened: {
    western: [
      "Day {dayNumber}: A restless night. The {illnessName} has worsened.",
      "The fevered dawn of Day {dayNumber} arrives. The {illnessName} tightens its grip.",
    ],
    japan: [
      "Day {dayNumber}: The body is weak, the spirit tested. The {illnessName} lingers.",
      "Another sunrise, another battle against the {illnessName}. Day {dayNumber}.",
    ],
    safari: [
      "Day {dayNumber}: The oppressive heat worsens the {illnessName}.",
      "A difficult night passes. The {illnessName} persists on Day {dayNumber}.",
    ],
    horror: [
      "Day {dayNumber}: The malady deepens with the morning gloom. The {illnessName} festers.",
      "Sleep brought no peace. The {illnessName} has taken a greater hold. Day {dayNumber}.",
    ],
    cyberpunk: [
      "Day {dayNumber}: System diagnostics report worsening condition: {illnessName}.",
      "Reboot cycle complete. Warning: {illnessName} corruption has increased. Day {dayNumber}.",
    ],
  },
  objectiveVoided: {
    western: ["The terms of the contract were clear. By letting the target go, the objective '{objectiveName}' is now void."]
  },
   playerDeckFinalized: { western: [
    "Your kit is packed and ready for the trail. Health: {currentHP}/{maxHP}.",
    "Ready to ride! The journey begins with {currentHP}/{maxHP} HP.",
    "The hand's been dealt. You start with {currentHP}/{maxHP} HP.",
  ]},
  playerCuresIllness: { western: [
    "{playerName} shook off the {eventName} with {itemName}.",
    "That {itemName} worked wonders! {playerName} is cured of {eventName}.",
    "{playerName} fought off the {eventName} with a little help from {itemName}. Back to full strength!",
  ]},
  playerRecoversMaxHealth: { western: [
    "Vitality returning. Max health is now {newMaxHealth}.",
    "Strength flows back. Max HP increased to {newMaxHealth}.",
    "Growing stronger. Max health reaches {newMaxHealth}.",
  ]},
  animalWandersOff: { western: [
    "{enemyName} moseys on, uninterested in a tussle.",
    "{enemyName} decides you ain't worth the bother and wanders off.",
    "With a final glance, {enemyName} disappears into the brush.",
  ]},
  mountainSicknessDrawReduction: { western: [
    "The thin air takes its toll. You draw {reducedAmount} fewer cards due to Mountain Sickness.",
    "Gasping in the high altitude, you draw {reducedAmount} less cards.",
    "Your head pounds from Mountain Sickness. You draw {reducedAmount} fewer cards.",
  ]},
  illnessTemporaryCure: { western: [
    "{playerName} is no longer suffering from {illnessName}.",
    "The bout of {illnessName} has passed. {playerName} feels much better.",
    "{playerName} shook off the effects of {illnessName}.",
  ]},
  threatDefeated: { // Added a generic threatDefeated for personality logs to hook into
    western: ["The {enemyName} has been defeated."],
  },
  eventRevealThreat: { // A generic reveal for personality hook
    western: ["A {enemyName} appears!"],
  }
};

const bossLogTemplates: Record<string, Partial<Record<Theme, string[]>>> = {
  playerAttack: {
    western: [
      "{playerName} goes for broke, attacking {enemyName} with {itemName} for {attackPower} damage!",
      "With grim determination, {playerName} unleashes a devastating blow with the {itemName}, dealing {attackPower} damage to the legendary {enemyName}!",
      "The final showdown! {playerName} strikes the {enemyName} for {attackPower} damage!",
    ],
    japan: [
        "With the focus of a true master, {playerName} strikes {enemyName} with {itemName} for {attackPower} damage!",
        "A final, decisive blow! The {itemName} connects with {enemyName}, dealing {attackPower} damage!",
        "The duel of fates! {playerName}'s {itemName} finds its mark for {attackPower} damage!",
    ],
    safari: [
        "The hunt reaches its climax! {playerName} attacks {enemyName} with {itemName} for {attackPower} damage!",
        "The shot of a lifetime! {playerName}'s {itemName} hits the legendary {enemyName} for {attackPower} damage!",
        "No holding back! {playerName} strikes {enemyName} for {attackPower} damage!",
    ],
    horror: [
        "Against the abyss, {playerName} fights back, striking {enemyName} with {itemName} for {attackPower} damage!",
        "With a defiant scream, {playerName}'s {itemName} tears into the great evil, dealing {attackPower} damage!",
        "The final confrontation! {playerName} strikes the dreaded {enemyName} for {attackPower} damage!",
    ],
    cyberpunk: [
        "Overriding all limiters, {playerName} attacks {enemyName} with {itemName} for {attackPower} damage!",
        "Lethal force authorized! {playerName}'s {itemName} slams into {enemyName}'s chassis for {attackPower} damage!",
        "The final program is executed! {playerName}'s attack deals {attackPower} damage to {enemyName}!",
    ],
  },
  playerDamage: {
    western: [
      "The legendary {sourceName} lands a crushing blow! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.",
      "A brutal attack from {sourceName}! You're wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}.",
      "You take {damageAmount} damage from {sourceName}'s signature attack! Health: {currentHP}/{maxHP}.",
    ],
    japan: [
        "The great {sourceName} lands a masterstroke! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.",
        "A devastating blow from {sourceName}! You take {damageAmount} damage. Your ki wavers! Now at {currentHP}/{maxHP}.",
        "You are struck for {damageAmount} by the legendary {sourceName}! Health: {currentHP}/{maxHP}.",
    ],
    safari: [
        "The great beast {sourceName} charges! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.",
        "A brutal mauling from {sourceName}! You are wounded for {damageAmount} damage! Now at {currentHP}/{maxHP}.",
        "You take {damageAmount} damage from the apex predator {sourceName}! Health: {currentHP}/{maxHP}.",
    ],
    horror: [
        "The great evil {sourceName} inflicts a grievous wound! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.",
        "A soul-shattering blow from {sourceName}! You take {damageAmount} damage as your sanity frays! Now at {currentHP}/{maxHP}.",
        "You take {damageAmount} damage from the unspeakable {sourceName}! Health: {currentHP}/{maxHP}.",
    ],
    cyberpunk: [
        "The prime target {sourceName} lands a critical hit! You take {damageAmount} damage. System integrity: {currentHP}/{maxHP}.",
        "A devastating system shock from {sourceName}! You take {damageAmount} damage! Now at {currentHP}/{maxHP}.",
        "You take {damageAmount} damage from {sourceName}'s main weapon! System integrity: {currentHP}/{maxHP}.",
    ],
  },
  playerHeal: {
    western: [
      "No time to rest, but you must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.",
      "Buying a precious moment, the {sourceName} restores {healAmount} HP. The fight rages on at {currentHP}/{maxHP}.",
    ],
    japan: [
        "A moment of focus amidst the chaos! You use {sourceName} to restore {healAmount} HP. Now at {currentHP}/{maxHP}.",
        "Gathering your ki, the {sourceName} restores {healAmount} HP. The final duel continues at {currentHP}/{maxHP}.",
    ],
    safari: [
        "A moment to regroup! You use {sourceName} to restore {healAmount} HP. Now at {currentHP}/{maxHP}.",
        "Using your last reserves, the {sourceName} restores {healAmount} HP. The great hunt is not over yet. Now at {currentHP}/{maxHP}.",
    ],
    horror: [
        "A prayer in the dark! You use {sourceName} to restore {healAmount} HP. Now at {currentHP}/{maxHP}.",
        "Finding a sliver of hope, the {sourceName} restores {healAmount} HP. The nightmare continues at {currentHP}/{maxHP}.",
    ],
    cyberpunk: [
        "Emergency repairs! You use {sourceName} to restore {healAmount} HP. System integrity at {currentHP}/{maxHP}.",
        "Re-routing power, the {sourceName} restores {healAmount} HP. The final run continues at {currentHP}/{maxHP}.",
    ],
  },
  trapCaught: {
    western: [
      "In an unbelievable turn of events, the legendary {enemyName} stumbles right into the {trapName}!",
      "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName}!",
    ],
    japan: [
        "A stroke of genius! The great {enemyName} is caught in the {trapName}!",
        "Even the mighty {enemyName} could not foresee the cunning {trapName}!",
    ],
    safari: [
        "The perfect ambush! The legendary {enemyName} is caught in the {trapName}!",
        "The hunter becomes the hunted! The {trapName} catches the great {enemyName}!",
    ],
    horror: [
        "A desperate gambit pays off! The dreaded {enemyName} is ensnared in the {trapName}!",
        "Even nightmares can be trapped! The {trapName} holds the terrible {enemyName} fast!",
    ],
    cyberpunk: [
        "The ghost is in the machine! The prime target {enemyName} is caught in the {trapName}!",
        "A perfect exploit! The {trapName} ensnares the high-threat {enemyName}!",
    ],
  },
  trapBroken: {
    western: [
      "The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!",
      "With a contemptuous roar, {enemyName} demolishes the {trapName}, but not before taking {damageAmount} damage!",
    ],
    japan: [
        "With a furious kiai, {enemyName} smashes the {trapName}, but suffers {damageAmount} damage!",
        "The {trapName} is no match for the might of {enemyName}, but it leaves a mark: {damageAmount} damage!",
    ],
    safari: [
        "With a mighty roar, {enemyName} breaks free of the {trapName}, taking {damageAmount} damage!",
        "The {trapName} splinters under the sheer power of {enemyName}, but not before dealing {damageAmount} damage!",
    ],
    horror: [
        "With an unholy shriek, {enemyName} tears apart the {trapName}, taking {damageAmount} damage!",
        "The {trapName} cannot hold such evil, but it inflicts {damageAmount} damage as it breaks!",
    ],
    cyberpunk: [
        "With a surge of power, {enemyName} overloads the {trapName}, but takes {damageAmount} system damage!",
        "The {trapName} is bypassed, but the feedback loop deals {damageAmount} damage to {enemyName}!",
    ],
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
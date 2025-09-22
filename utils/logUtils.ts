
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
      "{playerName} barters for a new {itemName}, parting with {cost} Gold.",
      "The {itemName} changes hands for {cost} Gold. A fine purchase.",
      "{playerName} parts with {cost} Gold for a much-needed {itemName}.",
      "A deal is struck. The {itemName} is yours for {cost} Gold.",
    ],
  },
  itemSold: {
    western: [
      "{playerName} lightens their load, selling the {itemName} for {sellAmount} Gold.",
      "A savvy buyer takes that {itemName} off your hands for {sellAmount} Gold.",
      "A good trade! The {itemName} sold for {sellAmount} cold hard cash.",
    ],
  },
  itemEquipped: {
    western: [
      "{playerName} equips the {itemName}, ready for what's next.",
      "Gearing up. The {itemName} is now ready.",
      "The {itemName} is readied for the trail ahead.",
    ],
  },
  itemTaken: {
    western: [
      "{playerName} picks up the {itemName} and adds it to their gear.",
      "The {itemName} is yours now. It goes into your discard pile.",
      "{playerName} takes the {itemName}. A useful find.",
    ],
  },
  storeRestock: { 
    western: ["{playerName} pays the storekeep {cost} Gold to clear the shelves and put out new stock."],
  },
  eventRevealObjective: {
    western: ["A new contract arrives for {playerName}: '{objectiveName}'. The request is clear: {objective_description}"],
  },
  eventRevealThreatLow: {
    western: [
      "A {enemyName} shuffles into view. It looks hostile.",
      "A {enemyName} wanders onto the path, its eyes fixed on {playerName}.",
      "The rustle in the bushes reveals a {enemyName}. It doesn't look friendly.",
    ],
  },
  eventRevealThreatMid: {
    western: [
      "Trouble's brewin'... a {enemyName} rears its ugly head on the trail.",
      "The sound of trouble... a {enemyName} is blocking your way, {playerName}.",
    ],
  },
  eventRevealThreatHigh: {
    western: [
      "Hold your horses, {playerName}! An unwelcome visitor: the notorious {enemyName} appears!",
      "This is the big one! The legendary {enemyName} stands before {playerName}!",
    ],
  },
  eventRevealEnvironmental: {
    western: [
      "The sky darkens ominously... a {eventName} is upon you!",
      "The very land turns against {playerName}! A {eventName} strikes!",
      "Look out, {playerName}! A {eventName}!",
    ],
  },
  threatDefeatedLow: {
    western: ["{playerName} dealt with the {enemyName}. Just another day on the frontier."],
  },
  threatDefeatedMid: {
    western: ["Another one bites the dust. {playerName} sent the {enemyName} packing."],
  },
  threatDefeatedHigh: {
    western: ["The {enemyName} met its match today. The trail's a bit safer, thanks to {playerName}."],
  },
  laudanumHeal: {
    western: [
      "The {itemName} does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.",
      "A swig of {itemName} knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}.",
    ],
  },
  laudanumNoHeal: {
    western: [
      "A swig of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.",
      "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward.",
    ],
  },
  playerVictoryFinalDay: {
    western: [
      "{playerName} takes one last look at the setting sun, the long trail finally at its end.",
      "The dust settles. {playerName} has seen the journey through, a legend forged in grit and gunpowder.",
    ],
  },
  playerAttack: {
    western: [
      "{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.",
      "{playerName} unleashes hell on {enemyName} with the {itemName}, dealing {attackPower} damage.",
    ],
  },
  playerHeal: { 
    western: [
      "{playerName} patches themself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.",
      "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}.",
    ],
  },
  playerDefeat: { 
    western: [
      "{playerName} was defeated by {enemyName}. The frontier claims another soul.",
      "The journey ends here for {playerName}, bested by {enemyName}.",
    ],
  },
  newDay: {
    western: [
      "Day {dayNumber}: The sun rises, casting long shadows across the plains for {playerName}.",
      "The morning brings a new set of challenges for {playerName}. Day {dayNumber}.",
      "Day {dayNumber}: A new dawn, a new day of survival for {playerName}.",
    ],
  },
  newDayWithIllnessWorsened: {
    western: [
      "Day {dayNumber}: A restless night for {playerName}. The {illnessName} has worsened.",
      "The fevered dawn of Day {dayNumber} arrives. The {illnessName} tightens its grip on {playerName}.",
    ],
  },
  objectiveVoided: {
    western: ["The terms of the contract were clear. By letting the target go, the objective '{objectiveName}' is now void."],
  },
   playerDeckFinalized: { western: [
    "{playerName}'s kit is packed and ready for the trail. Health: {currentHP}/{maxHP}.",
    "Ready to ride! {playerName} begins the journey with {currentHP}/{maxHP} HP.",
    "The hand's been dealt. {playerName} starts with {currentHP}/{maxHP} HP.",
  ]},
  playerCuresIllness: { western: [
    "{playerName} shook off the {eventName} with {itemName}.",
    "That {itemName} worked wonders! {playerName} is cured of {eventName}.",
  ]},
  playerRecoversMaxHealth: { western: [
    "Vitality returning. {playerName}'s max health is now {newMaxHealth}.",
    "Strength flows back. {playerName}'s max HP increased to {newMaxHealth}.",
  ]},
  animalWandersOff: { western: [
    "{enemyName} moseys on, uninterested in a tussle with {playerName}.",
    "{enemyName} decides {playerName} ain't worth the bother and wanders off.",
  ]},
  mountainSicknessDrawReduction: { western: [
    "The thin air takes its toll on {playerName}. You draw {reducedAmount} fewer cards due to Mountain Sickness.",
    "Gasping in the high altitude, {playerName} draws {reducedAmount} less cards.",
  ]},
  illnessTemporaryCure: { western: [
    "{playerName} is no longer suffering from {illnessName}.",
    "The bout of {illnessName} has passed. {playerName} feels much better.",
  ]},
  threatDefeated: { 
    western: ["The {enemyName} has been defeated by {playerName}."],
  },
  eventRevealThreat: { 
    western: ["A {enemyName} appears before {playerName}!"],
  },
  playerDamage: {
    western: [
        "{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.",
        "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}.",
    ],
  },
  enemyAttackImmediate: {
    western: [
        "The {enemyName} attacks {playerName} without warning!",
        "Ambush! The {enemyName} strikes {playerName} immediately!",
    ],
  },
  threatFlees: {
    western: [
        "The {enemyName} decides {playerName} is not worth the trouble and flees.",
        "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the brush.",
    ],
  },
  // Add other generic templates here...
};

const bossLogTemplates: Record<string, Partial<Record<Theme, string[]>>> = {
  playerAttack: {
    western: [
      "{playerName} goes for broke, attacking {enemyName} with {itemName} for {attackPower} damage!",
      "With grim determination, {playerName} unleashes a devastating blow with the {itemName}, dealing {attackPower} damage to the legendary {enemyName}!",
    ],
  },
  playerDamage: {
    western: [
      "The legendary {sourceName} lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.",
      "A brutal attack from {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}.",
    ],
  },
  playerHeal: {
    western: [
      "No time to rest, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.",
      "Buying a precious moment, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}.",
    ],
  },
  trapCaught: {
    western: [
      "In an unbelievable turn of events, the legendary {enemyName} stumbles right into {playerName}'s {trapName}!",
      "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!",
    ],
  },
  trapBroken: {
    western: [
      "The mighty {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!",
      "With a contemptuous roar, {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!",
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

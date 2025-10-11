import { PlayerDetails, CardData, Theme } from '../types.ts';
import { getThemeName } from './themeUtils.ts';
import { POP_CULTURE_CHEATS, CheatPhraseCategory } from '../utils/cheatCodes.ts';

const traitLogTemplates: {
  trigger: string;
  condition: (player: PlayerDetails, card?: CardData, isBossFight?: boolean) => boolean;
  chance: number;
  messages: Partial<Record<Theme, string[]>>;
}[] = [
  // --- ARCHETYPES ---

  // The Stoic
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.6, messages: { western: ["Damage taken: {damageAmount}. It is noted.", "An injury. {damageAmount} damage sustained.", "The body is wounded for {damageAmount}. The will remains."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Stoic' && c?.subType === 'human', chance: 0.6, messages: { western: ["The man is neutralized. The path is clear.", "It is done. The human threat is no more.", "Human objective complete."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Stoic' && c?.subType === 'animal', chance: 0.6, messages: { western: ["The beast is neutralized. The path is clear.", "It is done. The animal threat is no more.", "Animal threat has been handled."]}},
  { 
    trigger: 'playerHeal', 
    condition: (p) => p.personality?.archetype === 'The Stoic', 
    chance: 0.6, 
    messages: { 
      western: ["Health restored by {healAmount}. The body endures.", "Damage repaired by {healAmount}. Vitality returning.", "The flesh is weak, but it can be mended. +{healAmount} HP."],
      cyberpunk: ["Integrity restored by {healAmount}. The chassis endures.", "Damage repaired by {healAmount}. Functionality returning.", "Nanite repair sequence complete. Restored {healAmount} integrity."]
    }
  },
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.3, messages: { western: ["Day {dayNumber}. Another day, another task.", "The sun rises on Day {dayNumber}. The mission continues.", "Day {dayNumber}. Acknowledged."]}},
  { 
    trigger: 'eventRevealThreat', 
    condition: (p) => p.personality?.archetype === 'The Stoic', 
    chance: 0.5, 
    messages: { 
      western: ["An obstacle has appeared: {enemyName}.", "Threat identified: {enemyName}. Engaging.", "Threat assessment: {enemyName}. Hostile."],
      cyberpunk: ["An anomaly has appeared: {enemyName}.", "Threat analysis: {enemyName}. Engaging protocol.", "New variable: {enemyName}. Recalibrating."]
    }
  },
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.5, messages: { western: ["A necessary tool. Acquired {itemName} for {cost}G.", "Acquired {itemName}. It serves a purpose.", "The asset {itemName} is now in possession."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.5, messages: { western: ["A practical measure. The fire will provide warmth and security.", "Logical. A heat source will deter nocturnal predators.", "The perimeter is now more secure."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.5, messages: { western: ["{goldAmount} Gold. A resource acquired.", "Currency located: {goldAmount}.", "A logistical improvement. {goldAmount} Gold."]}},
  { 
    trigger: 'playerAttack', 
    condition: (p, c) => p.personality?.archetype === 'The Stoic' && c?.subType === 'human',
    chance: 0.5, 
    messages: { 
      western: ["Human threat engaged. {attackPower} damage delivered.", "Applying force to the man. {attackPower} damage.", "Neutralizing human target. {attackPower} damage."],
      cyberpunk: ["Executing attack protocol on humanoid target. {attackPower} damage dealt.", "Offensive subroutine initiated against hostile human. {attackPower} damage output.", "Kinetic force applied. {attackPower} damage registered on target."]
    }
  },
  { 
    trigger: 'playerAttack', 
    condition: (p, c) => p.personality?.archetype === 'The Stoic' && c?.subType === 'animal',
    chance: 0.5, 
    messages: { 
      western: ["Animal threat engaged. {attackPower} damage delivered.", "Applying force to the beast. {attackPower} damage.", "Neutralizing animal target. {attackPower} damage."],
      cyberpunk: ["Executing attack protocol on bio-form. {attackPower} damage dealt.", "Offensive subroutine initiated against hostile creature. {attackPower} damage output.", "Kinetic force applied. {attackPower} damage registered on target."]
    }
  },
  { trigger: 'illnessContracts', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.6, messages: { western: ["Afflicted with {illnessName}. It will be overcome.", "System anomaly detected: {illnessName}.", "The body is compromised. Condition: {illnessName}."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.8, messages: { western: ["The tincture is applied. Pain receptors are suppressed. {healAmount} HP restored.", "A necessary application of the opiate. Damage is repaired. {healAmount} HP restored.", "The chemical reaction dulls the pain. A logical outcome. {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Stoic', chance: 0.8, messages: { western: ["The tincture's effect is noted. A dulling of the senses, though no pain was present.", "An unnecessary application of the opiate. The cognitive dampening is... inefficient.", "The world softens at the edges. A predictable chemical reaction." ]}},

  // The Idealist
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Idealist' && c?.subType === 'human', chance: 0.7, messages: { western: ["A life is a life. 'Was this the only way?'","'Must we resort to such violence?' A sad day.","'Another man falls...'", "They close the fallen man's eyes. 'May you find peace.'", "They look away, saddened. 'This violence solves nothing.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Idealist' && c?.subType === 'animal', chance: 0.7, messages: { western: ["They look at the fallen {enemyName}. 'I wish there had been another way.'", "'Forgive me, creature.'", "They take no pride in this. The animal was only defending its home."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["Kindness heals all wounds, even one's own. Healed {healAmount} HP.", "'Every life is precious, including my own.' Healed {healAmount} HP.", "'If I am to help others, I must first be whole.' Restores {healAmount} HP."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.5, messages: { western: ["Hopefully this {itemName} helps someone else. Sold for {sellAmount}G.", "'May this {itemName} bring its new owner peace.'", "'The coin is a means to an end: helping those in need.'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["A beacon of hope in the darkness. The fire is lit.", "'Let this fire be a symbol of hope for all who see it.'", "'Perhaps a lost soul will see this light and find their way.'"]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.3, messages: { western: ["Day {dayNumber}: A new chance to make things right.", "'May today be a day of peace.'", "'The world can be better. Today is a start.'"]}},
  { trigger: 'eventRevealItem', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["A gift from the trail! A {itemName} appears.", "'The world provides for those who would do good.' A {itemName} found.", "'Proof that kindness is rewarded.' Finds a {itemName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.6, messages: { western: ["This {goldAmount} Gold can be used for good.", "'This {goldAmount} Gold will not be squandered on vice.'", "'A chance to do some real good with this {goldAmount} Gold!'"]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.8, messages: { western: ["Peace is always the better way. The situation is resolved without bloodshed.", "'Violence begets violence. This was the better path.'", "'A soft word turns away wrath. I'm glad they listened.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Idealist' && c?.subType === 'human', chance: 0.5, messages: { western: ["'I do what I must, for the greater good!' They attack the man.", "'Forgive me, but you leave me no choice!' They attack the human.", "'This is for the good of all!' They strike at the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Idealist' && c?.subType === 'animal', chance: 0.5, messages: { western: ["'I'm sorry, creature, but you are a danger!' They attack the animal.", "'This is a sad necessity.' They attack the beast.", "'For its own good, it must be stopped.'"]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.8, messages: { western: ["'I must be strong to help others.' The laudanum restores {healAmount} HP.", "The tincture eases the pain. 'A necessary remedy to continue my work.' {healAmount} HP restored.", "They drink, grateful for the relief. 'This will help me carry on.' {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Idealist', chance: 0.8, messages: { western: [ "They take the laudanum, feeling a pang of guilt for the indulgence.", "'A moment of weakness... The temptation is a bitter thing.'", "They drink, hoping the haze will quiet the world's sorrows, if only for a moment." ]}},

  // The Pragmatist
  { trigger: 'itemSold', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["A necessary transaction. Sold {itemName} for {sellAmount}G.", "Liquidating an asset. The {itemName} is worth {sellAmount}G.", "Good business. The {itemName} brought in {sellAmount}G."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Pragmatist' && c?.subType === 'human', chance: 0.6, messages: { western: ["A human obstacle removed. That's all they were.", "Problem solved. The man is neutralized.", "A predictable outcome. The human is down."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Pragmatist' && c?.subType === 'animal', chance: 0.6, messages: { western: ["An animal obstacle removed. That's all it was.", "Problem solved. The beast is neutralized.", "A predictable outcome. The animal is down."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Pragmatist' && c?.subType === 'human', chance: 0.5, messages: { western: ["Engaging the human threat. A necessary action.", "Neutralizing the man. It's just business.", "The most efficient solution is a direct one. They attack the human."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Pragmatist' && c?.subType === 'animal', chance: 0.5, messages: { western: ["Engaging the animal threat. A necessary action.", "Neutralizing the beast. It's just business.", "The most efficient solution is a direct one. They attack the animal."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["'A calculated risk.' Took {damageAmount} damage, but still in the fight.", "An acceptable loss. {damageAmount} damage taken.", "An inefficient exchange. Sustained {damageAmount} damage."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["A worthwhile investment. {itemName} for {cost}G.", "This {itemName} fills a tactical need. Acquired.", "The cost-benefit analysis is positive. Bought {itemName}."]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["Refreshing the market for {cost}G is a sound tactic.", "The current options are suboptimal. Restocking.", "Diversifying my options for {cost}G."]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["An efficient solution. The {trapName} is set.", "Automating threat removal. {trapName} deployed.", "Passive threat mitigation system online. The {trapName} is set."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["Information is a valuable commodity. Scouting reveals a {eventName}.", "Foreknowledge is an advantage. Scouting ahead.", "Reducing variables. Ahead lies a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["Assets acquired. {goldAmount} Gold added to reserves.", "Capital increased by {goldAmount} Gold.", "A positive turn in accounts. {goldAmount} Gold found."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.6, messages: { western: ["A practical measure for survival. Campfire active.", "Establishing a secure perimeter for the night.", "A logical precaution against nocturnal threats."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.3, messages: { western: ["Day {dayNumber}: Time to assess the situation and plan the next move.", "Day {dayNumber}: Analyzing variables.", "Day {dayNumber}: Proceeding with the mission."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.8, messages: { western: ["An efficient use of a medical supply. Restored {healAmount} HP.", "A necessary expenditure to maintain operational effectiveness. {healAmount} HP restored.", "The cost-benefit analysis is positive. The pain is gone. {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Pragmatist', chance: 0.8, messages: { western: [ "An inefficient use of a medical supply. The resource is wasted.", "A calculated expenditure for a temporary boost in morale. The effect is... acceptable.", "They consider the cost versus the benefit of the opiate's calm. A poor trade." ]}},

  // The Coward
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Coward' && p.health > 0, chance: 0.8, messages: { western: ["'I'm alive?!' But took {damageAmount} damage...","'Too close... I need to get out of here!' Hit for {damageAmount}!","'Mercy!' Lost {damageAmount} health!"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Coward' && c?.subType === 'human', chance: 0.8, messages: { western: ["'He's... he's not getting up? I did it!' They stare at the fallen man.", "'I'm alive! He's not!' They can't believe their luck.", "'It's over? He's really gone?'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Coward' && c?.subType === 'animal', chance: 0.8, messages: { western: ["'It's dead! It's really dead!' They stare at the fallen {enemyName}.", "'I survived! I can't believe I survived!'", "'Is it playing dead? No, I think I got it!'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'Oh no, a {enemyName}! I have to hide!'", "'A {enemyName}! My journey ends here!'", "'Nope, nope, nope!' They see the {enemyName} and try to turn back."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'I don't want to look... a {eventName}!'", "'What fresh horror awaits?' Scouting reveals a {eventName}.", "'Tell me it's not another bear... please tell me... It's a {eventName}!'"]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.4, messages: { western: ["Day {dayNumber}: 'I survived the night?'", "Day {dayNumber}: 'Maybe today is the day I die.'", "Day {dayNumber}: 'I don't want to get out of my bedroll.'"]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.7, messages: { western: ["'Maybe this {trapName} will keep them away from me!'", "'A trap! So I don't have to fight it myself. Perfect!'", "'Please work, please work, please work...' They set the {trapName}."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Coward' && c?.subType === 'human', chance: 0.7, messages: { western: ["A desperate swing at the man! 'Stay back! Stay back!'", "They attack the human with their eyes closed, hoping for the best.", "'I'm sorry! Don't hurt me!' They flail wildly at the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Coward' && c?.subType === 'animal', chance: 0.7, messages: { western: ["A desperate swing at the beast! 'Get away from me!'", "They attack the animal with their eyes closed, praying for a miracle.", "'Aaaah!' They flail wildly at the animal."]}},
  { trigger: 'enemyAttackImmediate', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'It's coming right for me!'", "'I knew it! I knew this was a bad idea!'", "'Don't eat me! I'm mostly gristle!'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.7, messages: { western: ["'Will this be enough to keep them away?'", "'Maybe if I make the fire big enough, they won't see me behind it.'", "'It's so dark out there... I need more wood.'"]}},
  { trigger: 'enemyCampfireDeterred', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["'It worked! The fire... it actually worked!'", "'Thank the heavens! It left!'", "'I live to be terrified another day!'"]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: ["They drink the laudanum gratefully. The pain recedes, and with it, some of the fear. {healAmount} HP restored.", "The sweet relief washes over them. 'Maybe... maybe I can survive this.' {healAmount} HP restored.", "They down the tincture, the pain vanishing into a comforting haze. {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Coward', chance: 0.8, messages: { western: [ "'Just a little something to quiet the nerves... and the shadows.'", "They drink deeply, welcoming the sweet oblivion that pushes the fear away.", "The world is too sharp, too loud. They dull it with the tincture's warm embrace." ]}},

  // The Zealot
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Zealot' && c?.subType === 'human', chance: 0.7, messages: { western: ["'The wicked sinner {enemyName} has been purged!'", "'By holy fire, this land is cleansed of the man's sin!'", "'Another agent of darkness cast down!'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Zealot' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'The unholy beast {enemyName} has been purged!'", "'By holy fire, this land is cleansed of the creature's corruption!'", "'Another minion of the dark returned to dust!'"]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["'The righteous are preserved!' Healed for {healAmount} HP.", "'Faith is the greatest medicine.' Healed for {healAmount} HP.", "'The spirit is willing, and the flesh must be made so.' Restores {healAmount} health."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A test of faith! The spirit endures {damageAmount} damage.", "'My conviction is my shield!' Takes {damageAmount} damage.", "'The unholy strike, but I will not yield!'"]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.3, messages: { western: ["Day {dayNumber}: Another day to spread the faith!", "Day {dayNumber}: The work of the righteous is never done.", "Day {dayNumber}: Let the sinners and beasts tremble!"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A creature of sin! The {enemyName} must be cleansed!", "An unholy beast, the {enemyName}! A test of conviction!", "The {enemyName} appears. 'I shall be the instrument of its judgment!'"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.5, messages: { western: ["A tool for the holy quest. The {itemName} is mine.", "This {itemName} shall serve a righteous purpose.", "'With this {itemName}, I will smite the wicked!'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A light against the unholy dark. The fire burns bright.", "A consecrated flame to ward off the creatures of the night.", "Let the heathens see this light and know fear."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Zealot' && c?.subType === 'human', chance: 0.6, messages: { western: ["'By my faith, you are struck down, sinner!'", "'Repent!' They attack the human with righteous fury.", "'The power of my conviction compels you!' They attack the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Zealot' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'By my faith, you are struck down, beast!'", "'Be cleansed!' They attack the animal with righteous fury.", "'The power of my conviction compels you!' They attack the creature."]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.7, messages: { western: ["A trial sent to test my resolve! I am afflicted with {illnessName}!", "This {illnessName} is but a test from on high! My faith will see me through!", "The forces of darkness assail my body with {illnessName}, but my spirit is strong!"]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.6, messages: { western: ["A snare for the unrighteous beast! The {trapName} is set.", "Let the unholy creatures fall into this righteous {trapName}!", "This {trapName} will deliver swift judgment to the unwary sinner."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.8, messages: { western: ["'The body is a temple, and must be repaired to do holy work.' The laudanum restores {healAmount} HP.", "'This will grant me strength to smite the wicked.' {healAmount} HP restored.", "They drink, feeling a surge of righteous vigor. 'The Lord's work continues!' {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Zealot', chance: 0.8, messages: { western: [ "'A sinful indulgence... May I be forgiven for this weakness.'", "They drink, seeing strange visions in the swirling haze. 'The spirits speak...'", "'The body is weak, and must be fortified against the coming darkness.' They take the opiate." ]}},

  // The Mercenary
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Mercenary' && c?.subType === 'human', chance: 0.7, messages: { western: ["'Contract complete.' The man is down.", "The human target is neutralized. 'Now, where's my pay?'", "'Business is business.' The man is finished."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Mercenary' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Contract complete.' The beast is down.", "The animal target is neutralized. 'Hope the pelt is worth something.'", "'Business is business.' The beast is finished."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["An investment in my business. {itemName} for {cost}G.", "A professional requires professional tools. The {itemName} costs {cost}G.", "'You have to spend money to make money.' Buys a {itemName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.7, messages: { western: ["Profit margin increased by {goldAmount} Gold.", "A bonus. {goldAmount} acquired.", "Unexpected revenue. {goldAmount} Gold."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["Everything has a price. Sold {itemName} for {sellAmount}G.", "Surplus equipment sold for {sellAmount}G.", "Liquidated the {itemName} for {sellAmount}G. A good deal."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Mercenary' && c?.subType === 'human', chance: 0.6, messages: { western: ["'Nothing personal. Just a job.' They attack the man.", "'This is gonna cost you.' They attack the human.", "They attack the man with cold efficiency. 'Let's get this over with.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Mercenary' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'Nothing personal. Just a job.' They attack the beast.", "'This pelt will fetch a good price.' They attack the animal.", "They attack the beast with cold efficiency. 'Let's get this over with.'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["Looks like a new contract. The {enemyName} has a bounty on its head.", "'Wonder what the pay is for this one?' A {enemyName} appears.", "A new target of opportunity: {enemyName}."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.3, messages: { western: ["Day {dayNumber}: Time to make some money.", "Day {dayNumber}: Another day, another dollar.", "Day {dayNumber}: Let's see what contracts are available."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["'That'll cost you extra.' Took {damageAmount} damage.", "Takes a hit. 'Hazard pay.'", "'Gonna add that to the bill.' {damageAmount} damage taken."]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.6, messages: { western: ["'Let's see if this junk heap has anything worth buying.' Restocked for {cost}G.", "The current market is weak. Rerolling for {cost}G.", "This inventory is unacceptable. Restocking."]}},
  { trigger: 'trapCaught', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.7, messages: { western: ["An easy payday. The {enemyName} is trapped.", "Work smarter, not harder. The {enemyName} is caught.", "The trap paid for itself. The {enemyName} is neutralized."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.8, messages: { western: ["They take a swig. 'Can't have an injury slowing me down.' {healAmount} HP restored.", "The pain subsides. 'Good. Back in business.' {healAmount} HP restored.", "They down the tincture. 'Time to get back to work.' {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Mercenary', chance: 0.8, messages: { western: [ "They take a swig. 'A little something to keep the hands steady.' It's a business expense.", "The laudanum's haze is a familiar comfort on a long job.", "'Part of the pay.' They down the tincture without a second thought." ]}},
  
  // The Wanderer
  { trigger: 'newDay', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.3, messages: { western: ["Day {dayNumber}: Another horizon.", "The road goes on. Day {dayNumber} begins.", "Day {dayNumber}: Let's see where the trail leads today."]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["The trail presents a challenge: a {enemyName}.", "What's this up ahead? A {enemyName} blocks the path.", "The journey takes a dangerous turn. A {enemyName} appears."]}},
  { trigger: 'eventRevealItem', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["The trail offers a small gift: a {itemName}.", "What's this? A {itemName} on the path.", "The journey provides. A {itemName} is found."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["A small distraction. {goldAmount} Gold. The journey continues.", "The road provides. {goldAmount} Gold found.", "Enough for a hot meal. {goldAmount} Gold."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Wanderer' && c?.subType === 'human', chance: 0.7, messages: { western: ["The man is gone. The path ahead is clear again.", "One less danger on the road. The human has been dealt with.", "The trail is quiet once more. The man is defeated."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.archetype === 'The Wanderer' && c?.subType === 'animal', chance: 0.7, messages: { western: ["The beast is gone. The path ahead is clear again.", "One less danger on the road. The animal has been dealt with.", "The trail is quiet once more. The beast is defeated."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Wanderer' && c?.subType === 'human', chance: 0.5, messages: { western: ["A grim necessity of the road. They attack the man.", "The journey requires this. They engage the human.", "They sigh. 'Another soul lost to the trail.' They attack."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.archetype === 'The Wanderer' && c?.subType === 'animal', chance: 0.5, messages: { western: ["A sad part of the journey. They attack the beast.", "The wilderness can be cruel. They engage the animal.", "They move with a heavy heart. 'Forgive me, creature.' They attack."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.7, messages: { western: ["'What's over the next rise?' Scouting reveals a {eventName}.", "Let's see what the horizon holds. A {eventName} is ahead.", "Always good to know what's coming. Scouting ahead."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["A temporary home for the night. The fire is lit.", "Another night, another fire under the stars.", "A moment of peace by the fire before the journey continues."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.5, messages: { western: ["Something for the road. Bought a {itemName}.", "This {itemName} might be useful on the trail.", "A small purchase to lighten the journey. Got a {itemName}."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["Just another scar from the trail. Took {damageAmount} damage.", "The road has its price. {damageAmount} damage.", "Part of the journey. Took {damageAmount} damage."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.5, messages: { western: ["The road provides its own remedies. Healed for {healAmount}.", "A moment to mend. Healed {healAmount} HP.", "The body mends, the journey continues. Healed for {healAmount}."]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.6, messages: { western: ["A hardship of the journey. Afflicted with {illnessName}.", "Another trial on the long road. Contracted {illnessName}.", "The trail tests my endurance with {illnessName}."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.8, messages: { western: ["The road is hard, but its remedies are swift. The laudanum restores {healAmount} HP.", "They tend their wounds with the tincture. 'The journey continues.' {healAmount} HP restored.", "A moment of rest and repair before the next mile. {healAmount} HP restored."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.personality?.archetype === 'The Wanderer', chance: 0.8, messages: { western: [ "Another taste of the world's strange comforts. The road is long.", "The laudanum blurs the long miles ahead into a pleasant dream.", "They take it not for pain, but for the journey. The world melts away." ]}},


  // --- TEMPERAMENTS ---

  // Honorable
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Honorable' && c?.subType === 'human', chance: 0.6, messages: { western: ["A fair fight! They attack the man with the {itemName}.", "They meet the man head-on. 'En garde!'", "'Let this be a duel of honor!' They attack the human threat."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Honorable' && c?.subType === 'animal', chance: 0.6, messages: { western: ["They give the beast a chance to flee, but it stands its ground. They attack.", "A clean kill is the only honorable way. They attack the animal.", "'I take no pleasure in this, noble creature.' They attack."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Honorable' && c?.subType === 'human', chance: 0.6, messages: { western: ["They give a nod of respect. 'You fought with honor, {enemyName}.'", "They close the man's eyes. 'May you find peace.'", "They take no pleasure in this. 'A duel is a duel.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Honorable' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'A noble beast.' They dispatch the {enemyName} quickly.", "They give the fallen {enemyName} a moment of silence.", "A clean kill. The beast deserved no less."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.6, messages: { western: ["'A fair price.' The deal for the {itemName} is done.", "An honorable transaction. Bought the {itemName}.", "The merchant was honest. The {itemName} is mine."]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.8, messages: { western: ["A duel avoided is a victory in itself. Bloodshed was not necessary today.", "They sheathe their weapon. 'There is no honor in this fight.'", "A person of their word, the opponent leaves peacefully."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["A fair trade for the {itemName}. Sold for {sellAmount}G.", "The buyer seems honest. Sold the {itemName}.", "They give the buyer a firm handshake. 'A deal is a deal.'"]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["'I will not fall so easily.' Healed for {healAmount}.", "An honorable warrior must tend to their wounds. Healed {healAmount}.", "They rally their strength. 'The fight is not over.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["A worthy blow! Took {damageAmount} damage.", "They stumble but do not fall. 'A good hit.'", "'You have skill!' They take {damageAmount} damage."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.3, messages: { western: ["Day {dayNumber}: I will face this day with honor.", "Day {dayNumber}: Let my deeds be just.", "Day {dayNumber}: Another day to prove my worth."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Honorable', chance: 0.5, messages: { western: ["Fortune favors the just. {goldAmount} Gold found.", "'I will use this {goldAmount} Gold for a worthy cause.'", "An unexpected boon. {goldAmount} Gold."]}},

  // Deceitful
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.7, messages: { western: ["'A clever trap. It will do the dirty work for me.'", "'Let's see who falls for this.' The {trapName} is set.", "'Why fight when you can outsmart them?' The {trapName} is ready."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Deceitful' && c?.subType === 'human', chance: 0.6, messages: { western: ["'The fool never saw it coming.' The man is dealt with.", "'Too easy.' The human is dispatched.", "They sneer at the fallen man. 'Should have watched your back.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Deceitful' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'The dumb beast never saw it coming.' The animal is dealt with.", "'Too easy.' The creature is dispatched.", "They kick the fallen animal. 'Stupid creature.'"]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'The fool didn't know its true worth.'", "'Another sucker.' Sold the {itemName} for a tidy profit.", "They palm an extra coin. 'Pleasure doing business with you.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Deceitful' && c?.subType === 'human', chance: 0.6, messages: { western: ["A strike from the shadows at the man! {attackPower} damage!", "They throw dirt in the man's eyes before attacking!", "A feint, then a stab at the human! {attackPower} damage!"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Deceitful' && c?.subType === 'animal', chance: 0.6, messages: { western: ["A strike from the shadows at the beast! {attackPower} damage!", "They distract the creature before attacking!", "They attack the beast's blind spot! {attackPower} damage!"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'They don't know what a bargain they just gave me.' Bought {itemName} for {cost}G.", "They paid {cost}G for the {itemName}, but made it look like more. The merchant seems confused.", "They haggle the price down with a sob story. {itemName} acquired."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'Knowledge is power, especially when they don't know you have it.' A {eventName} is ahead.", "They peek from behind a rock. 'Good to know.'", "Spying on the path ahead reveals a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.6, messages: { western: ["'Finders keepers.' {goldAmount} Gold pocketed.", "They look around before snatching the {goldAmount} Gold.", "'Someone's loss is my gain.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.5, messages: { western: ["'The fool got a lucky hit.' Took {damageAmount} damage.", "'Curses! My plan was flawless!'", "They glare. 'You'll pay for that.'"]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.8, messages: { western: ["'They bought the lie. Perfect.' The situation is resolved.", "They talk their way out of it with a series of elaborate falsehoods.", "With a convincing performance of being a simple-minded fool, they avoid the fight."]}},
  { trigger: 'trapBroken', condition: (p) => p.personality?.temperament === 'Deceitful', chance: 0.7, messages: { western: ["'Hmph. A flawed design.' The {trapName} was broken by the {enemyName}.", "'Waste of a good trap.'", "'Next time, I'll use a bigger one.'"]}},

  // Reckless
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Reckless' && c?.subType === 'human', chance: 0.7, messages: { western: ["'Damn the consequences!' They charge the man with the {itemName}!", "'Yeehaw!' They attack the human with wild abandon!", "'Live or die, I'm giving this all I've got!' They charge the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Reckless' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Damn the consequences!' They charge the beast with the {itemName}!", "'Yeehaw!' They attack the animal with wild abandon!", "'Live or die, I'm giving this all I've got!' They charge the creature."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["'Just a scratch!' Took {damageAmount} damage.", "'Is that all you've got?!' Hit for {damageAmount}!", "They spit blood. 'I've had worse!'"]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["'Looks useful!' Bought the {itemName} for {cost}G.", "'I'll take it! What's it do?'", "They throw the coin at the merchant. 'Gimme the shiny one.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Reckless' && c?.subType === 'human', chance: 0.7, messages: { western: ["'Ha! Is that all you've got?' The man is finished.", "They spit on the ground. 'Next!' The human is no more.", "They laugh. 'That was fun! Who's next?'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Reckless' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Ha! Is that all you've got?' The beast is finished.", "They spit on the ground. 'Next!' The animal is no more.", "They laugh. 'That was fun! What's next?'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.8, messages: { western: ["'Finally, some action!' A {enemyName} appears!", "'Let's get this party started!' A {enemyName} stands in the way.", "'Bout time something interesting happened! A {enemyName}!"]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["'This stuff is junk! Let's see what's next!' Restocked for {cost}G.", "'Boring! Reroll!'", "They slam the gold on the counter. 'Show me something better!'"]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.5, messages: { western: ["'This'll be funny.' The {trapName} is set.", "'Let's see what happens!' They set the {trapName} haphazardly.", "'Traps are for people who think too much.' They kick it into place."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.5, messages: { western: ["'Scouting is for cowards, but fine...' Ahead is a {eventName}.", "'Why spoil the surprise?' They glance ahead anyway.", "A quick look reveals a {eventName}. 'Good. Was getting bored.'"]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.6, messages: { western: ["{goldAmount} Gold! 'More money for booze and bullets!'", "'Finders keepers!'", "'This'll buy a good time! {goldAmount} Gold.'"]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.temperament === 'Reckless', chance: 0.7, messages: { western: ["'A little {illnessName}? I'll walk it off.'", "'What's a little {illnessName} between friends?'", "'Bah! I've had worse.'"]}},

  // Cautious
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.8, messages: { western: ["'Best to know what's coming.' Scouting reveals a {eventName}.", "'Let's not walk into any surprises.' A {eventName} is ahead.", "A careful look ahead reveals a {eventName}."]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["'Better safe than sorry.' The {trapName} is set.", "A defensive measure. The {trapName} is in place.", "One can never be too prepared. {trapName} set."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.4, messages: { western: ["Day {dayNumber}: On guard.", "Day {dayNumber}: A new day of vigilance begins.", "Day {dayNumber}: Check supplies, check surroundings, proceed."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Cautious' && c?.subType === 'human', chance: 0.7, messages: { western: ["A sigh of relief. The danger posed by the man has passed.", "They check their surroundings carefully before approaching the fallen man.", "The human threat is neutralized. They remain vigilant."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Cautious' && c?.subType === 'animal', chance: 0.7, messages: { western: ["A sigh of relief. The danger posed by the beast has passed.", "They check their surroundings carefully before approaching the fallen animal.", "The animal threat is neutralized. They remain vigilant."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Cautious' && c?.subType === 'human', chance: 0.5, messages: { western: ["After assessing all options, they attack the man. 'No other choice.'", "They strike at the human's exposed weakness.", "A carefully aimed blow at the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Cautious' && c?.subType === 'animal', chance: 0.5, messages: { western: ["After assessing all options, they attack the beast. 'No other choice.'", "They strike at the animal's exposed weakness.", "A carefully aimed blow at the beast."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["A defensible position for the night. The fire should keep predators away.", "The fire is built with a good view of the surroundings.", "They build the fire in a small, sheltered spot."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.5, messages: { western: ["This {itemName} seems like a prudent purchase.", "They inspect the {itemName} carefully before buying.", "An ounce of prevention is worth a pound of cure. Buys a {itemName}."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.5, messages: { western: ["'Must keep my strength up.' Healed for {healAmount}.", "A small injury could be fatal out here. Best to treat it now. Healed {healAmount}.", "They tend to their wounds meticulously."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.6, messages: { western: ["'An avoidable injury! I must be more careful.' Took {damageAmount} damage.", "'A lapse in concentration!' Takes {damageAmount} damage.", "'That was a mistake. I will not make it again.'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.7, messages: { western: ["A threat: {enemyName}. 'I must assess the situation.'", "A {enemyName}. They immediately check for escape routes.", "They spot the {enemyName} from a distance. 'Time to make a plan.'"]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.temperament === 'Cautious', chance: 0.6, messages: { western: ["The current selection presents too many unknowns. Restocking for {cost}G.", "Nothing here seems reliable. Restocking.", "I need better tools. Restocking for {cost}G."]}},

  // Greedy
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.8, messages: { western: ["'Yes! More for me!' {goldAmount} Gold richer!","'This is it! I'm rich!' Another {goldAmount} Gold!","'A fool and their gold...' They bag {goldAmount} Gold."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Greedy' && c?.subType === 'human', chance: 0.8, messages: { western: ["'Now, let's see what you've got.' They rifle through the {enemyName}'s pockets.", "The {enemyName} is down. 'Hope they had something valuable.'", "'Let's see if this one was worth the effort.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Greedy' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Should fetch a good price.' They look over the fallen {enemyName}.", "'The pelt alone is worth the effort.' The {enemyName} is dealt with.", "'Another obstacle to my fortune removed.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Greedy' && c?.subType === 'human', chance: 0.5, messages: { western: ["'Get out of my way! There's profit to be made!' They attack the man.", "'You're standing between me and my money!' They attack the human.", "'Let's see what you're worth.' They attack the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Greedy' && c?.subType === 'animal', chance: 0.5, messages: { western: ["'Get out of my way! There's profit to be made!' They attack the beast.", "'Your pelt is worth more than your life!' They attack the animal.", "'Let's see what you're worth.' They attack the beast."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.7, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'Could have gotten more...'", "They count the coins carefully. 'Every bit helps.'", "Another {sellAmount}G closer to my goal."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.6, messages: { western: ["This {itemName} better be worth the {cost}G!", "'An investment in my future fortune.'", "'Hope I can sell this for more later.'"]}},
  { trigger: 'storeRestock', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.6, messages: { western: ["'Let's see if there's any real treasure in this dump.' Restocked for {cost}G.", "'This junk won't make me rich. Reroll!'", "'Come on, show me the money!' Restocks the store."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.5, messages: { western: ["'My gold! Don't touch my gold!' Took {damageAmount} damage.", "'That's coming out of your hide!'", "'You'll pay for that, with interest!'"]}},
  { trigger: 'eventRevealItem', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.7, messages: { western: ["A {itemName}. 'Is it valuable?'", "'What's this? Might be worth something.'", "They inspect the {itemName}. 'Looks valuable.'"]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Greedy', chance: 0.3, messages: { western: ["Day {dayNumber}: Time to increase the coffers.", "Day {dayNumber}: Another day, another opportunity for profit.", "Day {dayNumber}: The fortune won't find itself."]}},

  // Compassionate
  { trigger: 'eventRevealThreat', condition: (p, c) => p.personality?.temperament === 'Compassionate' && c?.subType === 'animal', chance: 0.7, messages: { western: ["A magnificent creature, the {enemyName}. 'A shame to harm it.'","The {enemyName} is just trying to survive, like us.","Such a beautiful animal. They hope to avoid a fight."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Compassionate' && c?.subType === 'human', chance: 0.7, messages: { western: ["A necessary evil. The man will threaten no one else.", "'May you find peace.' They say a quiet word over the fallen man.", "They feel a pang of regret. 'There was no other way.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Compassionate' && c?.subType === 'animal', chance: 0.7, messages: { western: ["A necessary evil. The beast will threaten no one else.", "'May you find peace.' They say a quiet word over the fallen animal.", "They feel a pang of regret. 'There was no other way.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Compassionate' && c?.subType === 'human', chance: 0.5, messages: { western: ["'I'm so sorry it has come to this.' They attack the man.", "'This is for the safety of others.' They engage the human threat.", "'Please, stand down!' They attack reluctantly."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Compassionate' && c?.subType === 'animal', chance: 0.5, messages: { western: ["'I'm so sorry, creature.' They attack the beast.", "'This is for its own good, to end its suffering or its rage.'", "'Forgive me.' They attack the animal."]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.6, messages: { western: ["'Thank heavens.' The wound is closing. Healed {healAmount}.", "'The body is a temple, it must be tended to.' Heals {healAmount} HP.", "'Even in this harsh land, life finds a way to mend.' Recovers {healAmount} health."]}},
  { trigger: 'itemSold', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.5, messages: { western: ["'I hope this {itemName} serves its new owner well.' Sold for {sellAmount}G.", "'May this bring someone else comfort.'", "The {sellAmount}G will be put to good use."]}},
  { trigger: 'itemBought', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.5, messages: { western: ["This {itemName} will help me help others.", "A tool for kindness. Bought a {itemName}.", "This {itemName} will bring comfort on the trail."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.5, messages: { western: ["Even in pain, there is a lesson. Took {damageAmount} damage.", "They wince. 'A reminder of the world's suffering.'", "Takes {damageAmount} damage. 'We must endure.'"]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.3, messages: { western: ["Day {dayNumber}: May I bring some kindness to the world today.", "Day {dayNumber}: Another chance to help someone in need.", "Day {dayNumber}: Let's see who I can help today."]}},
  { trigger: 'deEscalate', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.8, messages: { western: ["'I'm glad we could resolve this without bloodshed.'", "'Peace is a victory for us all.'", "'Go in peace, friend.'"]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.6, messages: { western: ["This {goldAmount} Gold can help someone in need.", "A gift! This {goldAmount} Gold will surely help another traveler.", "They smile. 'Enough to buy a meal for a hungry family.'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.temperament === 'Compassionate', chance: 0.6, messages: { western: ["A warm fire for any weary soul who might pass by.", "The fire is a welcome sight. They hope it brings comfort to others.", "A small light in a vast darkness."]}},

  // Superstitious
  { trigger: 'eventReveal', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'A bad omen...' A {eventName} appears.", "The cards foretold this! A {eventName} appears.", "'I had a dream about this... A {eventName}!'"]}},
  { trigger: 'playerHeal', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'The spirits are smiling.' Healed for {healAmount} HP.", "'My lucky charm must be working!' Healed {healAmount}.", "They whisper a quick prayer of thanks. Healed {healAmount} HP."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Superstitious' && c?.subType === 'human', chance: 0.6, messages: { western: ["'The dark spirits are banished from this man!' The {enemyName} is gone.", "They make a sign to ward off evil over the fallen man.", "The curse is broken! The man {enemyName} is defeated."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.personality?.temperament === 'Superstitious' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'The dark spirits are banished from this beast!' The {enemyName} is gone.", "They make a sign to ward off evil over the fallen beast.", "The curse is broken! The beast {enemyName} is defeated."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Superstitious' && c?.subType === 'human', chance: 0.5, messages: { western: ["They mutter a prayer of protection and attack the man.", "'Begone, foul spirit possessing this man!'", "They attack the human, convinced they are fighting a greater evil."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.personality?.temperament === 'Superstitious' && c?.subType === 'animal', chance: 0.5, messages: { western: ["They mutter a prayer of protection and attack the beast.", "'Begone, foul spirit possessing this beast!'", "They attack the animal, convinced they are fighting a greater evil."]}},
  { trigger: 'newDay', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.4, messages: { western: ["Day {dayNumber}: 'What do the entrails of the dawn portend?'", "Day {dayNumber}: 'I hope the stars are aligned in my favor.'", "Day {dayNumber}: They consult their lucky rabbit's foot."]}},
  { trigger: 'playerDamage', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'A dark omen!' Took {damageAmount} damage.", "'Someone's put the evil eye on me!'", "Takes {damageAmount} damage. 'I knew I shouldn't have walked under that ladder.'"]}},
  { trigger: 'trapSet', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["A ward against night spirits. The {trapName} is set.", "They mutter an incantation over the {trapName}.", "This {trapName} should keep the ghouls away."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.7, messages: { western: ["The flames will keep evil spirits at bay tonight.", "They throw a pinch of salt into the fire for good luck.", "A circle of fire to protect from what lurks in the dark."]}},
  { trigger: 'scoutAhead', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["'Peeking at what fate has in store...' Scouting reveals a {eventName}.", "'My gut told me to look ahead.' A {eventName} appears.", "They consult a strange knucklebone oracle. It shows a {eventName}."]}},
  { trigger: 'goldFound', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.6, messages: { western: ["A gift from the lucky spirits! {goldAmount} Gold.", "Their lucky horseshoe must be working! {goldAmount} Gold.", "'Lady Luck is with me!' Finds {goldAmount} Gold."]}},
  { trigger: 'illnessContracts', condition: (p) => p.personality?.temperament === 'Superstitious', chance: 0.7, messages: { western: ["A curse has taken hold! Afflicted with {illnessName}!", "'Someone's put a hex on me!'", "This {illnessName} feels like a dark premonition."]}},
];

const characterLogTemplates: {
  trigger: string;
  condition: (player: PlayerDetails, card?: CardData, isBossFight?: boolean) => boolean;
  chance: number;
  messages: Partial<Record<Theme, string[]>>;
}[] = [
  // Hunter
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'hunter' && c?.id.includes('bow') && c?.subType === 'human', chance: 0.8, messages: { western: ["'A silent arrow finds its mark on the man.' {attackPower} damage to {enemyName}.", "The bowstring sings. A warning to other outlaws. {attackPower} damage.", "They nock another arrow. 'This one's for you, varmint.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'hunter' && c?.id.includes('bow') && c?.subType === 'animal', chance: 0.8, messages: { western: ["'A silent arrow finds its mark on the beast.' {attackPower} damage to {enemyName}.", "The bowstring sings. A clean shot for a clean kill. {attackPower} damage.", "They nock another arrow. 'A fine hunt.'"]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'hunter' && c?.id.includes('knife') && c?.subType === 'human', chance: 0.8, messages: { western: ["'Too close for a bow. This will have to do.' They attack the man for {attackPower} damage.", "A quick, sharp movement. The knife finds its home in the outlaw.", "They move like a shadow, striking the man for {attackPower} damage."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'hunter' && c?.id.includes('knife') && c?.subType === 'animal', chance: 0.8, messages: { western: ["'Too close for a bow. A dangerous spot.' They attack the beast for {attackPower} damage.", "A quick, sharp movement. The knife finds its home in the beast.", "They move like a shadow, striking the animal for {attackPower} damage."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'hunter' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'Rest now, brother beast.' The hunt is over for the {enemyName}.", "They give a silent prayer to the spirit of the animal.", "A clean kill. The hunt is done."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'hunter' && c?.subType === 'human', chance: 0.6, messages: { western: ["'Just another bounty.' The {enemyName} won't be troubling folks again.", "They're a better tracker than a talker. The {enemyName} is down.", "The trail ends here for the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c) => p.character?.id === 'hunter' && c?.type === 'Provision', chance: 0.5, messages: { western: ["'A bit of jerky and I'm good to go.' Healed {healAmount}.", "'Just a scratch. The trail teaches you to mend quickly.' Heals {healAmount} HP.", "'A moment to patch up. Back to the hunt.' Recovers {healAmount} health."]}},
  { trigger: 'trapSet', condition: (p) => p.character?.id === 'hunter', chance: 0.7, messages: { western: ["'A simple snare. Should be enough.'", "They set the trap with a practiced hand.", "The ground here is good. A trap should work well."]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'hunter', chance: 0.9, messages: { western: ["They read the signs... 'Looks like a {eventName} up ahead.'", "The wind carries a scent. 'There's a {eventName} nearby.'", "Broken twigs and fresh tracks. 'A {eventName} passed this way.'"]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'hunter', chance: 0.25, messages: { western: ["Day {dayNumber}: The hunt begins again.", "Day {dayNumber}: A new trail.", "Day {dayNumber}: The wind is right for hunting."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'hunter' && c?.type === 'Trophy', chance: 0.8, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'The land provides.'", "A good price for this {itemName}.", "The trader knows a good pelt when they see one. {sellAmount}G."]}},
  { trigger: 'eventRevealItem', condition: (p) => p.character?.id === 'hunter', chance: 0.6, messages: { western: ["The trail provides. Found a {itemName}.", "A gift from the wilderness. A {itemName}.", "They spot something useful. 'Well now, what have we here?'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'hunter', chance: 0.7, messages: { western: ["They build a small fire, just enough to keep the beasts at bay.", "A small, smokeless fire. The hunter's way.", "The fire is lit. Time to rest and watch."]}},
  // Hunter - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'hunter' && !!isBossFight, chance: 0.8, messages: { western: ["'The ultimate hunt... I will not fail.' They loose an arrow at the {enemyName}.", "'This is the greatest trophy of all.' They line up a perfect shot on the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'hunter' && !!isBossFight, chance: 0.8, messages: { western: ["'A hunter must know how to tend to their own wounds.' Heals {healAmount}.", "'Just a moment to catch my breath before the final stalk.' Heals {healAmount} HP."]}},

  // Trapper
  { trigger: 'trapSet', condition: (p) => p.character?.id === 'trapper', chance: 0.8, messages: { western: ["'{trapName} won't fail. Something's walking into it.'", "They set the {trapName} with a grim satisfaction. 'Patience is a virtue.'", "Another trap for the line. The {trapName} is ready."]}},
  { trigger: 'trapCaught', condition: (p) => p.character?.id === 'trapper', chance: 0.8, messages: { western: ["A grim smile. 'Right where I wanted you, {enemyName}.'", "They hear the snap of the trap. 'Got one.'", "The line pays off. The {enemyName} is caught."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'trapper' && c?.id.includes('knife') && c?.subType === 'human', chance: 0.7, messages: { western: ["'Time to get my hands dirty on this fool.' {attackPower} damage to {enemyName}.", "The skinning knife is sharp enough for men too. {attackPower} damage.", "They move with a trapper's quiet efficiency, striking the man for {attackPower} damage."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'trapper' && c?.id.includes('knife') && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Time to get my hands dirty.' {attackPower} damage to {enemyName}.", "The skinning knife is sharp. {attackPower} damage.", "They move with a trapper's quiet efficiency, striking the beast for {attackPower} damage."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'trapper' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Another fine pelt.' The {enemyName} will fetch a good price.", "The work is done. Time to skin the {enemyName}.", "This {enemyName} will make a fine hat."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'trapper' && c?.subType === 'human', chance: 0.7, messages: { western: ["'Two-legged varmints are the worst kind.' The {enemyName} is dealt with.", "They clean their knife. 'Should have stayed off my line.'", "The {enemyName} won't be bothering anyone else."]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'trapper', chance: 0.5, messages: { western: ["'A quick poultice. Good enough.' Healed for {healAmount}.", "They use a bit of pine sap to seal the wound.", "The wilderness provides its own remedies. Healed {healAmount}."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'trapper' && c?.type === 'Trophy', chance: 0.8, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'Good, clean business.'", "The fur trader pays a fair price for the {itemName}.", "Another successful trade. {sellAmount}G."]}},
  { trigger: 'itemBought', condition: (p, c) => p.character?.id === 'trapper' && c?.effect?.type === 'trap', chance: 0.8, messages: { western: ["'{itemName} will pay for itself ten times over.' Cost {cost}G.", "Can never have too many traps.", "A fine piece of iron. This {itemName} will do nicely."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'trapper', chance: 0.25, messages: { western: ["Day {dayNumber}: Checking the lines.", "Day {dayNumber}: Time to see what the traps have caught.", "Day {dayNumber}: The air smells of pine and profit."]}},
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'trapper' && c?.subType === 'animal', chance: 0.6, messages: { western: ["They eye the {enemyName}. 'You'll look good on a stretching board.'", "A fine specimen. The {enemyName} will bring a good price.", "They measure the {enemyName} with their eye. 'A big one.'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'trapper', chance: 0.7, messages: { western: ["They check the lay of the land... 'A {eventName} is near.'", "They read the tracks. 'Looks like a {eventName} is ahead.'", "They smell the air. 'Something's coming.'"]}},
  // Trapper - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'trapper' && !!isBossFight, chance: 0.8, messages: { western: ["'You're too big for my traps, so this will have to do!' They attack the {enemyName} with their knife.", "'Every beast has a weak spot.' They probe the {enemyName}'s defenses."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'trapper' && !!isBossFight, chance: 0.8, messages: { western: ["'A trapper's gotta be tough to survive.' Heals {healAmount}.", "'Can't collect the bounty if I'm dead.' Heals {healAmount} HP."]}},

  // Gunslinger
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'gunslinger' && (c?.id.includes('shooter') || c?.id.includes('rifle')) && c?.subType === 'human', chance: 0.8, messages: { western: ["'Dance, varmint!' {attackPower} damage to the {enemyName}.", "'Eat lead, you bastard!' A hail of bullets deals {attackPower} damage.", "A flash of steel and a roar of thunder. {attackPower} damage to the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'gunslinger' && (c?.id.includes('shooter') || c?.id.includes('rifle')) && c?.subType === 'animal', chance: 0.8, messages: { western: ["'Damn beast!' {attackPower} damage to the {enemyName}.", "'Should have run faster!' A hail of bullets deals {attackPower} damage.", "A flash of steel and a roar of thunder. {attackPower} damage to the animal."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'gunslinger' && c?.subType === 'human', chance: 0.7, messages: { western: ["'They were slower.' The {enemyName} is pushing up daisies now.", "'Another notch on the iron.' The {enemyName} is finished.", "They blow the smoke from the barrel. 'Next.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'gunslinger' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Waste of a good bullet.' The {enemyName} is put down.", "They shrug. 'Should have run faster.'", "The beast is dispatched. 'Not much of a challenge.'"]}},
  { trigger: 'itemBought', condition: (p, c) => p.character?.id === 'gunslinger' && c?.effect?.type === 'weapon', chance: 0.8, messages: { western: ["'A fine piece of iron.' The {itemName} was worth the {cost} Gold.", "They check the action on the {itemName}. 'This will do.'", "A gunslinger can never have too many guns. Bought a {itemName}."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'gunslinger' && c?.type === 'Objective Proof', chance: 0.8, messages: { western: ["Another bounty collected. The {itemName} is worth {sellAmount}G.", "They collect the bounty. 'A job's a job.'", "The lawman pays up. {sellAmount}G for the {itemName}."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'gunslinger', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Sun's up.'", "Day {dayNumber}: Another day, another duel.", "Day {dayNumber}: 'Wonder who'll try their luck today.'"]}},
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'gunslinger' && c?.subType === 'human', chance: 0.7, messages: { western: ["The {enemyName} appears. 'Looks like they want to try their luck.'", "They sigh. 'Another amateur.'", "They rest their hand on their pistol. 'Let's dance.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'gunslinger', chance: 0.5, messages: { western: ["'Damn! They got a lucky shot in!' {damageAmount} damage.", "They grunt. 'Just a flesh wound.'", "Takes a hit. 'Now I'm mad.'"]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'gunslinger', chance: 0.6, messages: { western: ["{goldAmount} Gold. 'For whiskey and bullets.'", "A welcome sight. {goldAmount} Gold.", "They pocket the coin. 'Pays to be lucky.'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'gunslinger', chance: 0.6, messages: { western: ["Scouting reveals a {eventName}. 'Best see who's waiting in ambush.'", "They check the trail. 'Looks like trouble ahead.'", "A quick look reveals a {eventName}. 'Let's get this over with.'"]}},
  // Gunslinger - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'gunslinger' && !!isBossFight, chance: 0.8, messages: { western: ["'This town ain't big enough for the two of us.' They fan the hammer at the {enemyName}.", "'Let's see who's faster.' They draw and fire at the {enemyName} in a blur."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'gunslinger' && !!isBossFight, chance: 0.8, messages: { western: ["'Just a scratch. Time to reload.' Heals {healAmount}.", "'Spilled my whiskey... good thing I have this.' Heals {healAmount} HP."]}},

  // Doctor
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'doctor', chance: 0.8, messages: { western: ["'Physician, heal thyself.' Restored {healAmount} health with {sourceName}.", "'A proper application of medicine.' Heals for {healAmount}.", "'This should stabilize the patient... me.' Recovers {healAmount} health."]}},
  { trigger: 'playerCuresIllness', condition: (p, c) => p.character?.id === 'doctor' && !!c?.effect?.cures, chance: 0.9, messages: { western: ["'This {itemName} should do the trick.' The {eventName} is cured.", "They consult their journal. 'Yes, this {itemName} is the correct prescription.'", "'A remarkable recovery.' The {eventName} is no more."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'doctor' && c?.id.includes('knife') && c?.subType === 'human', chance: 0.8, messages: { western: ["'I swore an oath... but you are a sickness.' {attackPower} damage to the man.", "'This will be a precise incision.' They attack the human.", "'Sometimes, surgery is the only answer for the wicked.' They attack."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'doctor' && c?.id.includes('knife') && c?.subType === 'animal', chance: 0.8, messages: { western: ["'I swore an oath... but this beast is rabid.' {attackPower} damage to the animal.", "'This will be a precise, if regrettable, incision.' They attack the beast.", "'Sometimes, amputation is the only answer.' They attack the animal."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'doctor' && c?.subType === 'human', chance: 0.7, messages: { western: ["'A life wasted.' The {enemyName} gave them no choice.", "'The diagnosis was terminal.' The {enemyName} is gone.", "They sigh. 'Some maladies cannot be cured.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'doctor' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'A rabid beast. It was a mercy.' The {enemyName} is put out of its misery.", "They examine the creature. 'The infection was too advanced.'", "A necessary procedure. The animal is at peace."]}},
  { trigger: 'illnessContracts', condition: (p) => p.character?.id === 'doctor', chance: 0.9, messages: { western: ["Symptoms indicate {illnessName}. 'I must find a cure.'", "A clear case of {illnessName}. 'Now, where did I put my medical journal?'", "A textbook presentation of {illnessName}. 'Fascinating... and unfortunate.'"]}},
  { trigger: 'itemBought', condition: (p, c) => p.character?.id === 'doctor' && c?.type === 'Provision', chance: 0.7, messages: { western: ["'This {itemName} will save a life. Perhaps my own.' Cost: {cost}G.", "An essential supply. Bought {itemName}.", "They inspect the {itemName}. 'This will do.'"]}},
  { trigger: 'itemSold', condition: (p) => p.character?.id === 'doctor', chance: 0.5, messages: { western: ["Sold the {itemName} for {sellAmount}G to resupply the medical kit.", "The {sellAmount}G will go towards more important supplies.", "A necessary trade to keep the bag stocked."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'doctor', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Hoping for fewer patients.'", "Day {dayNumber}: Time to make my rounds.", "Day {dayNumber}: A new day to heal the sick."]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'doctor', chance: 0.6, messages: { western: ["'Dammit, I'm a doctor, not a soldier!' Took {damageAmount} damage.", "They assess the wound. 'This will require stitches.'", "Takes {damageAmount} damage. 'First, do no harm... to myself.'"]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'doctor', chance: 0.6, messages: { western: ["A fire to sterilize a needle, or just for warmth.", "They boil some water over the fire. 'Cleanliness is next to godliness.'", "The fire keeps the night chill at bay. Good for morale."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.character?.id === 'doctor', chance: 0.8, messages: { western: ["'A proper application of opiate analgesia.' The pain recedes as {healAmount} HP is restored."] } },
  { trigger: 'laudanumAbuse', condition: (p) => p.character?.id === 'doctor', chance: 0.8, messages: { western: ["'An improper dosage for a non-existent ailment. Note the sedative effects and mild euphoria. Fascinating.'"]}},
  // Doctor - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'doctor' && !!isBossFight, chance: 0.8, messages: { western: ["'Some diseases require surgery... with a knife!' They attack the {enemyName}.", "'I swore an oath to do no harm, but you are a plague!' They strike at the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'doctor' && !!isBossFight, chance: 0.8, messages: { western: ["'Physician, heal thyself... especially now!' Heals {healAmount}.", "'I must survive to treat the wounds this beast has caused.' Heals {healAmount} HP."]}},

  // Herbalist
  { trigger: 'playerHeal', condition: (p, c) => p.character?.id === 'herbalist' && !!c?.id.match(/juniper|basil|peppermint|sage/), chance: 0.9, messages: { western: ["'The earth provides its own medicine.' {sourceName} heals {healAmount}.", "'A simple poultice of {sourceName}.' Restores {healAmount} health.", "They chew the {sourceName} into a paste. 'This will work.' Heals {healAmount}."]}},
  { trigger: 'playerCuresIllness', condition: (p, c) => p.character?.id === 'herbalist' && !!c?.effect?.cures_illness, chance: 0.8, messages: { western: ["'This {itemName} will purge the {eventName}.'", "They find the right herbs. The {eventName} is cured.", "Nature's remedy for {eventName}."]}},
  { trigger: 'eventRevealItem', condition: (p, c) => p.character?.id === 'herbalist' && c?.type === 'Provision', chance: 0.8, messages: { western: ["'A lucky find!' A fresh {itemName} appears.", "They smile. 'The earth provides.'", "Just what they were looking for! A wild {itemName}."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'herbalist' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'I'm sorry, little brother. Your spirit returns to the earth.'", "They give thanks to the animal's spirit.", "A life for a life. The animal is at peace."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'herbalist' && c?.subType === 'human', chance: 0.6, messages: { western: ["'Their spirit is poisoned. There was no other cure.' The {enemyName} is gone.", "They were too far from the path. The {enemyName} is no more.", "A sad end to a troubled life."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'herbalist' && c?.type === 'Provision', chance: 0.7, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'They don't appreciate its power.'", "They hope the {itemName} is used well.", "A fair price for a piece of the earth."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'herbalist' && c?.subType === 'human', chance: 0.5, messages: { western: ["'The thorns must protect the rose.' {attackPower} damage to the man.", "They strike the man with the speed of a striking snake.", "Their attack on the man is swift and silent, like the forest itself."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'herbalist' && c?.subType === 'animal', chance: 0.5, messages: { western: ["'The thorns must protect the rose.' {attackPower} damage to the beast.", "They strike the beast with the speed of a striking snake.", "Their attack on the animal is swift and silent, like the forest itself."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'herbalist', chance: 0.25, messages: { western: ["Day {dayNumber}: Dew on the leaves.", "Day {dayNumber}: The forest is waking.", "Day {dayNumber}: Let's see what the earth offers today."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'herbalist', chance: 0.7, messages: { western: ["A fire to brew teas and keep the chill away.", "They add some fragrant herbs to the fire.", "The fire is a friend in the wilderness."]}},
  { trigger: 'storeRestock', condition: (p) => p.character?.id === 'herbalist', chance: 0.5, messages: { western: ["The merchant's stock is stale. A restock for {cost}G reveals new wares.", "These goods are unnatural. Let's see what else is available.", "They need fresher supplies. Restocking."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'herbalist', chance: 0.5, messages: { western: ["{goldAmount} Gold. 'A gift from the spirits.'", "The earth provides in mysterious ways. {goldAmount} Gold.", "This cold metal has its uses. {goldAmount} Gold."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.character?.id === 'herbalist', chance: 0.8, messages: { western: ["'The poppy has its uses, though its spirit is a troubled one.' The tincture restores {healAmount} HP."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.character?.id === 'herbalist', chance: 0.8, messages: { western: ["'The poppy's sleep is a false one. The earth offers truer peace.' They drink it with a clinical sigh." ]}},
  // Herbalist - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'herbalist' && !!isBossFight, chance: 0.8, messages: { western: ["'Even the most beautiful flower has thorns!' They attack the {enemyName}.", "'The earth itself cries out for your end!' They strike at the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'herbalist' && !!isBossFight, chance: 0.8, messages: { western: ["'The forest gives me strength for this final trial.' Heals {healAmount}.", "'A poultice for the body, a prayer for the spirit.' Heals {healAmount} HP."]}},

  // Explorer
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'explorer', chance: 0.9, messages: { western: ["To chart the unknown! Ahead lies a {eventName}.", "'Let's see what's over that ridge.' Scouting reveals a {eventName}.", "Their map is incomplete. Scouting adds a {eventName} to the page."]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'explorer', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Onward!'", "Day {dayNumber}: A new territory to explore.", "Day {dayNumber}: The adventure continues!"]}},
  { trigger: 'eventRevealItem', condition: (p) => p.character?.id === 'explorer', chance: 0.8, messages: { western: ["'A fascinating find!' A {itemName} just lying here.", "'This will be a fine addition to the collection.'", "They make a note in their journal about the {itemName}."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'explorer', chance: 0.8, messages: { western: ["'Treasure!' {goldAmount} Gold to fund the expedition.", "They mark the spot on their map. {goldAmount} Gold richer.", "'Fortune favors the bold!' {goldAmount} Gold found."]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'explorer' && (c?.type === 'Trophy' || c?.type === 'Objective Proof'), chance: 0.8, messages: { western: ["Sold the {itemName} for {sellAmount}G. 'Proof of my discoveries!'", "The museum will pay a fine price for this {itemName}.", "Another successful find. {sellAmount}G."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'explorer' && c?.subType === 'human', chance: 0.5, messages: { western: ["An obstacle to progress is dealt with. {attackPower} damage to the man.", "'For science!' They attack the human threat.", "They fight the man with the fervor of a person on a mission."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'explorer' && c?.subType === 'animal', chance: 0.5, messages: { western: ["An obstacle to progress is dealt with. {attackPower} damage to the beast.", "'For science!' They attack the animal threat.", "They fight the beast with the fervor of a person on a mission."]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'explorer', chance: 0.5, messages: { western: ["'A quick patch-up and back to it.' Healed {healAmount}.", "The expedition must continue. Healed for {healAmount}.", "No time for injuries. Healed {healAmount} HP."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'explorer' && c?.subType === 'human', chance: 0.6, messages: { western: ["The man is no longer an obstacle to progress.", "Another discovery made. The man has been catalogued... permanently.", "The path is clear. On to the next discovery!"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'explorer' && c?.subType === 'animal', chance: 0.6, messages: { western: ["The beast is no longer an obstacle to progress.", "Another discovery made. The animal has been catalogued... permanently.", "The path is clear. On to the next discovery!"]}},
  { trigger: 'itemBought', condition: (p) => p.character?.id === 'explorer', chance: 0.6, messages: { western: ["This {itemName} will be invaluable. Cost {cost}G.", "A necessary supply for the journey. Bought a {itemName}.", "They barter for the {itemName}. 'This will aid my expedition.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'explorer', chance: 0.6, messages: { western: ["'An unexpected peril!' Took {damageAmount} damage.", "They make a note of the danger in their journal. {damageAmount} damage.", "The frontier is a dangerous place. Took {damageAmount} damage."]}},
  // Explorer - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'explorer' && !!isBossFight, chance: 0.8, messages: { western: ["'The greatest discovery will be your demise!' They attack the {enemyName}.", "'This will make for one hell of a story!' They charge at the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'explorer' && !!isBossFight, chance: 0.8, messages: { western: ["'The expedition must not fail!' Heals {healAmount}.", "'Just another peril on the map.' Heals {healAmount} HP."]}},

  // Preacher
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'preacher' && c?.subType === 'human', chance: 0.7, messages: { western: ["'Smite the wicked sinner!' The {itemName} delivers {attackPower} damage unto the {enemyName}.", "'The power of faith compels you... to repent!' They attack the man.", "'Let the Lord sort you out!' They attack the human."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'preacher' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'Smite the unholy beast!' The {itemName} delivers {attackPower} damage unto the {enemyName}.", "'The power of faith compels you... to be cleansed!' They attack the animal.", "'Let the Lord sort you out!' They attack the beast."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'preacher' && c?.subType === 'human', chance: 0.7, messages: { western: ["'The sinner, {enemyName}, has been judged!'", "'The Lord has delivered this man, {enemyName}, into my hands!'", "'The wicked man {enemyName} is cast down!"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'preacher' && c?.subType === 'animal', chance: 0.7, messages: { western: ["'The Lord has delivered this beast, {enemyName}, into my hands!'", "'The unholy beast {enemyName} is cast down!'", "'The beast {enemyName} has been cleansed!"]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'preacher', chance: 0.6, messages: { western: ["'The Lord provides!' Health is restored by {healAmount}.", "'A moment of prayer restores the flesh.' Healed {healAmount}.", "'My faith is my shield... and my medicine.' Healed for {healAmount}."]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'preacher', chance: 0.6, messages: { western: ["'A test of my faith!' They take {damageAmount} damage, but do not falter.", "'My soul is resolute, though my flesh is weak!'", "They clutch their holy symbol. 'I will not be moved!'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.character?.id === 'preacher', chance: 0.7, messages: { western: ["A creature of sin! 'The {enemyName} must be cleansed!'", "An unholy beast! 'The {enemyName} must be sent back to hell!'", "They grip their shotgun. 'The path of the righteous... is beset on all sides by the {enemyName}!'"]}},
  { trigger: 'itemSold', condition: (p) => p.character?.id === 'preacher', chance: 0.5, messages: { western: ["'Tithing to the cause.' Sold {itemName} for {sellAmount}G.", "The {sellAmount}G will be used for the Lord's work.", "They sell the {itemName}. 'Material possessions are a burden.'"]}},
  { trigger: 'itemBought', condition: (p) => p.character?.id === 'preacher', chance: 0.5, messages: { western: ["'A tool of righteousness!' The {itemName} is worth every bit of {cost}G.", "This {itemName} will aid in my crusade.", "They buy the {itemName}. 'The Lord works in mysterious ways.'"]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'preacher', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Time for the Lord's work.'", "Day {dayNumber}: Let us pray.", "Day {dayNumber}: Another day to save some souls... or send them to be judged."]}},
  { trigger: 'campfireBuilt', condition: (p) => p.character?.id === 'preacher', chance: 0.7, messages: { western: ["A fire to read the good book by.", "They build a fire and say a prayer.", "The fire is a small piece of heaven in this hellish land."]}},
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'preacher', chance: 0.6, messages: { western: ["'A blessing!' The Lord has provided {goldAmount} Gold.", "They give thanks for the {goldAmount} Gold.", "This {goldAmount} Gold is a gift from on high."]}},
  { trigger: 'laudanumHeal', condition: (p) => p.character?.id === 'preacher', chance: 0.8, messages: { western: ["'The Lord provides medicine for the body, that the spirit may continue His work.' Restored {healAmount} HP."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.character?.id === 'preacher', chance: 0.8, messages: { western: ["'The Devil's comfort... a moment of weakness in the face of temptation. The spirit must be stronger than the flesh.'"]}},
  // Preacher - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'preacher' && !!isBossFight, chance: 0.8, messages: { western: ["'And the Lord said, let there be a reckoning!' They unload their shotgun at the {enemyName}.", "'By the power vested in me, I cast you out, demon!' They attack the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'preacher' && !!isBossFight, chance: 0.8, messages: { western: ["'My faith is my shield... but this helps too.' Heals {healAmount}.", "'The righteous shall not perish!' Heals {healAmount} HP."]}},

  // Prospector
  { trigger: 'goldFound', condition: (p) => p.character?.id === 'prospector', chance: 0.9, messages: { western: ["'Paydirt!' You're {goldAmount} Gold richer!","'Eureka!' Struck the mother lode! {goldAmount} Gold richer!","'Sweet motherlode!' {goldAmount} Gold in the pan!"]}},
  { trigger: 'itemSold', condition: (p, c) => p.character?.id === 'prospector' && c?.id.includes('nugget'), chance: 0.9, messages: { western: ["'Cashing in!' The {itemName} is worth {sellAmount} Gold.", "They bite the coin to make sure it's real. It is.", "The assayer confirms the value. {sellAmount}G."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'prospector' && c?.subType === 'human', chance: 0.6, messages: { western: ["'Get off my claim, you damn claim-jumper!' {attackPower} damage to {enemyName}.", "They swing their pickaxe at the man! {attackPower} damage!", "'This here's my spot!' They attack the man."]}},
  { trigger: 'playerAttack', condition: (p, c) => p.character?.id === 'prospector' && c?.subType === 'animal', chance: 0.6, messages: { western: ["'Get off my claim, you damn varmint!' {attackPower} damage to {enemyName}.", "They swing their pickaxe at the beast! {attackPower} damage!", "'This here's my spot!' They attack the beast."]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'prospector' && c?.subType === 'human', chance: 0.6, messages: { western: ["The man {enemyName} won't be jumping their claim again.", "'Now I can get back to the real work!' The human nuisance is no longer a problem.", "They spit. 'Should have known better than to mess with a prospector's claim.'"]}},
  { trigger: 'threatDefeated', condition: (p, c) => p.character?.id === 'prospector' && c?.subType === 'animal', chance: 0.6, messages: { western: ["The beast {enemyName} won't be bothering them again.", "'Now I can get back to the real work!' The animal nuisance is no longer a problem.", "They spit. 'Should have known better than to mess with a prospector.'"]}},
  { trigger: 'playerHeal', condition: (p) => p.character?.id === 'prospector', chance: 0.5, messages: { western: ["'A little snake oil and I'm good as gold.' Healed {healAmount}.", "They wrap the wound with a dirty rag. 'It'll do.'", "A swig of moonshine clears the head and dulls the pain. Healed {healAmount}."]}},
  { trigger: 'itemBought', condition: (p) => p.character?.id === 'prospector', chance: 0.5, messages: { western: ["'Gotta spend money to make money.' The {itemName} cost {cost}G.", "This {itemName} better not be fool's gold.", "They buy the {itemName}. 'An investment.'"]}},
  { trigger: 'eventRevealThreat', condition: (p) => p.character?.id === 'prospector', chance: 0.7, messages: { western: ["'A claim jumper!' The {enemyName} is trying to horn in on their territory.", "'This ain't your land!' They see the {enemyName}.", "They narrow their eyes. 'Looks like trouble.'"]}},
  { trigger: 'scoutAhead', condition: (p) => p.character?.id === 'prospector', chance: 0.6, messages: { western: ["A {eventName} is spotted. 'Gotta check for color... and for trouble.'", "They check the creek bed ahead.", "They squint at the horizon. 'What's that now?'"]}},
  { trigger: 'newDay', condition: (p) => p.character?.id === 'prospector', chance: 0.25, messages: { western: ["Day {dayNumber}: 'Hoping for paydirt.'", "Day {dayNumber}: Another day, another chance at riches.", "Day {dayNumber}: 'Today's the day I strike it big.'"]}},
  { trigger: 'playerDamage', condition: (p) => p.character?.id === 'prospector', chance: 0.5, messages: { western: ["'Hey! That's my gear!' Took {damageAmount} damage.", "They clutch their gold pouch. 'You ain't gettin' it!'", "Takes a hit. 'Dagnabbit!'"]}},
  { trigger: 'laudanumHeal', condition: (p) => p.character?.id === 'prospector', chance: 0.8, messages: { western: ["'Wooo-ee! That's the stuff! Numbs the ache in my bones.' Restored {healAmount} HP."]}},
  { trigger: 'laudanumAbuse', condition: (p) => p.character?.id === 'prospector', chance: 0.8, messages: { western: ["'Wooo-ee! That's the stuff! Numbs the ache in my bones, even when there ain't one.'"]}},
  // Prospector - Boss Fight
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.character?.id === 'prospector' && !!isBossFight, chance: 0.8, messages: { western: ["'You're standin' on my claim, you son of a bitch!' They attack the {enemyName}.", "'There's a bounty on your head, and I'm here to collect!' They strike at the {enemyName}."]}},
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.character?.id === 'prospector' && !!isBossFight, chance: 0.8, messages: { western: ["'Can't spend my gold if I'm dead!' Heals {healAmount}.", "'Just a little something to keep me in the fight for the motherlode.' Heals {healAmount} HP."]}},

  // Doctor
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'doctor' && !!c && c.id.includes('vagabond'), chance: 0.7, messages: { western: ["Another poor soul lost to the frontier. 'A tragedy.'","'This poor wretch needs medicine, not judgment.'","The state of these people... 'It breaks the heart.'"]}},
  // Gunslinger
  { trigger: 'eventRevealThreat', condition: (p, c) => p.character?.id === 'gunslinger' && !!c && c.id.includes('rattlesnake'), chance: 0.75, messages: { western: ["'Snakes... why'd it have to be snakes?'","'Dammit, I hate these slithering devils.'","A rattler... 'Figures. One more thing to shoot.'"]}},
];

const logTemplates: Record<string, Partial<Record<Theme, string[]>>> = {
  animalWandersOff: {
    western: ["{enemyName} moseys on, uninterested in a tussle with {playerName}.", "{enemyName} decides {playerName} ain't worth the bother and wanders off.", "The beast gives {playerName} a final, contemptuous look before melting back into the wilderness."],
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
  bountySold: {
    western: ["The bounty on {itemName} is paid. A hefty purse of {sellAmount}G for a job well done.", "The local law pays out {sellAmount}G for the {itemName}.", "Justice has its price. The warrant for {itemName} is cashed in for {sellAmount}G."],
    japan: ["The magistrate pays the reward of {sellAmount} mon for the head of {itemName}.", "Honor is satisfied, and so is the coin purse. {sellAmount} mon for {itemName}.", "{itemName}'s bounty is collected: {sellAmount} mon."],
    safari: ["The colonial governor is pleased. The bounty on {itemName} is paid: {sellAmount} shillings.", "Another dangerous element removed. The contract for {itemName} pays {sellAmount} shillings.", "The bounty is collected. {sellAmount} shillings for dealing with {itemName}."],
    horror: ["The old priest pays in silver for the proof of the {itemName}'s demise. {sellAmount} pieces.", "A heavy purse of {sellAmount} silver for a dark deed. The contract on {itemName} is complete.", "The village elder pays the reward. {sellAmount} silver for a moment of peace."],
    cyberpunk: ["The fixer transfers the payment. {sellAmount} creds for the {itemName} contract.", "Target retired. Payment of {sellAmount} creds received for {itemName}.", "Another contract closed. {sellAmount} creds transferred for neutralizing {itemName}."],
  },
  campfireBuilt: {
    western: ["The crackle of the campfire is a welcome sound. The wilderness feels a little less lonely.", "A roaring fire is built, pushing back the oppressive darkness.", "The campfire is lit. Its warmth is a small comfort against the cold night."],
    japan: ["The takibi is lit, its flames dancing like protective spirits.", "A fire is built, its light a stark contrast to the inky shadows of the forest."],
    safari: ["The campfire roars to life, its light keeping the eyes of the savanna at bay.", "A fire is built to ward off the chill of the African night."],
    horror: ["A sputtering fire is coaxed to life, a fragile bastion against the encroaching dread.", "The fire crackles, a defiant prayer against the things that lurk in the dark."],
    cyberpunk: ["The portable heater whirs to life, its orange glow a welcome sight in the grimy alley.", "The heat-coil activates, casting flickering shadows on the chrome walls."],
  },
  campfireDoused: {
    western: ["The morning light extinguishes the campfire's last embers.", "The campfire has burned out, its protection gone with the night.", "Ashes to ashes. The fire has died, leaving the camp vulnerable once more."],
    japan: ["The embers of the takibi die, their protective spirit fading with the morning mist.", "The campfire has turned to ash, its warmth a memory against the coming day."],
    safari: ["The last of the campfire smoke drifts into the vast African sky.", "The fire is out, leaving only the scent of acacia smoke and the sounds of the waking savanna."],
    horror: ["The protective circle of the campfire fades to cold ash, leaving you exposed to the grey dawn.", "The fire is dead. The shadows press in once more."],
    cyberpunk: ["The portable heater's power cell is depleted, its comforting glow extinguished.", "The heat-coil sputters and dies, plunging the alley back into cold darkness."],
  },
  cardsDrawn: {
    western: ["{playerName} draws {cardsDrawn} cards.", "The hand's been dealt. {playerName} draws {cardsDrawn} cards.", "Time to play the cards you're dealt. Drawing {cardsDrawn}."],
    japan: ["The warrior considers their options, drawing {cardsDrawn} new cards.", "A moment of stillness, then action. {playerName} draws {cardsDrawn} cards.", "The path forward reveals itself. {playerName} draws {cardsDrawn} cards."],
    safari: ["The hunt requires new tools. {playerName} draws {cardsDrawn} cards.", "New supplies for the expedition. {playerName} draws {cardsDrawn} cards.", "Preparing for the day's trek. {playerName} draws {cardsDrawn} cards."],
    horror: ["With a trembling hand, {playerName} draws {cardsDrawn} cards.", "What horrors await? {playerName} draws {cardsDrawn} cards to face them.", "The darkness presses in. {playerName} draws {cardsDrawn} cards, seeking a light."],
    cyberpunk: ["Booting up new subroutines. {playerName} draws {cardsDrawn} cards.", "Accessing new data streams. {playerName} draws {cardsDrawn} cards.", "Loading new software. {playerName} draws {cardsDrawn} cards."],
  },
  enemyAttackImmediate: {
    western: ["The {enemyName} attacks {playerName} without warning!", "Ambush! The {enemyName} strikes {playerName} immediately!", "No time to react! The {enemyName} is on {playerName} in a flash!"],
    japan: ["Kurae! The {enemyName} strikes {playerName} with blinding speed!", "From the shadows, the {enemyName} ambushes {playerName}!"],
    safari: ["A sudden charge! The {enemyName} attacks {playerName}!", "Out of the tall grass! The {enemyName} strikes {playerName}!"],
    horror: ["A screech in the darkness! The {enemyName} lurches at {playerName}!", "A shape of nightmare! The {enemyName} attacks {playerName} from the gloom!"],
    cyberpunk: ["Hostile engagement! The {enemyName} unit opens fire on {playerName}!", "Ambush protocol initiated! The {enemyName} targets {playerName}!"],
  },
  enemyAttackMorning: {
    western: ["With the morning sun comes a renewed assault! The {enemyName} attacks {playerName}!", "The {enemyName} survived the night and attacks {playerName} at first light!", "No time for coffee! The {enemyName} is on {playerName} at dawn!"],
    japan: ["The rising sun illuminates the attack! The {enemyName} strikes {playerName}!", "The stillness of dawn is broken! The {enemyName} attacks {playerName}!", "No respite with the morning light. The {enemyName} engages {playerName}."],
    safari: ["The savanna awakens with violence! The {enemyName} charges {playerName}!", "The hunt is not over! The {enemyName} attacks {playerName} at sunrise!", "First light brings a fresh attack from the {enemyName}!"],
    horror: ["The dawn brings no safety! The {enemyName} attacks {playerName} in the grey morning light!", "The nightmare did not end with the night! The {enemyName} lunges at {playerName}!", "The sun rises, but the horror remains. The {enemyName} strikes!"],
    cyberpunk: ["System reboot is interrupted by a hostile! The {enemyName} unit attacks {playerName}!", "The new cycle begins with an assault! The {enemyName} engages {playerName}!", "No downtime! The {enemyName}'s attack protocols are still active at dawn!"],
  },
  trapSet: {
    western: ["{playerName} sets a {trapName}, eyes scanning the horizon.", "The {trapName} is set. Now, to wait.", "'Something's bound to wander into this.' The {trapName} is ready.", "The ground is prepared. The {trapName} lies in wait.", "A careful hand sets the {trapName}, a silent promise of danger."],
    japan: ["{playerName} sets a {trapName}, its mechanisms hidden in the tall grass.", "The {trapName} is set. A silent threat awaits.", "'A simple but effective tool.' The {trapName} is placed with care.", "The path is now guarded. The {trapName} is set.", "A warrior's cunning at work. The {trapName} is ready for its prey."],
    safari: ["{playerName} sets a {trapName}, camouflaging it with dirt and leaves.", "The {trapName} is set. The savanna will provide.", "'This should do the trick.' The {trapName} is ready for its quarry.", "The hunter prepares for the night. The {trapName} is set.", "A clever snare is laid. The {trapName} is hidden from view."],
    horror: ["{playerName} sets a {trapName}, its iron jaws hungry for flesh.", "The {trapName} is set, a grim necessity in these cursed lands.", "'May this hold back the darkness, if only for a moment.' The {trapName} is armed.", "A circle of salt and iron. The {trapName} is set against the night.", "A desperate measure for a desperate time. The {trapName} is armed."],
    cyberpunk: ["{playerName} deploys a {trapName}, its sensors glowing faintly.", "The {trapName} is armed. Now, to wait for a target.", "'Another tool in the arsenal.' The {trapName} is primed and ready.", "The perimeter is secured. The {trapName} is active.", "A silent guardian for a dangerous street. The {trapName} is deployed."],
  },
  enemyAttackEndOfDay: {
    western: ["As darkness falls, the {enemyName} strikes at {playerName}!", "Under the cover of night, the {enemyName} ambushes {playerName}!"],
    japan: ["In the twilight, the {enemyName} sees an opportunity and attacks {playerName}!", "The shadows grow long, and the {enemyName} strikes at {playerName}!"],
    safari: ["As the sun dips below the horizon, the {enemyName} attacks {playerName}!", "The sounds of the savanna fall silent as the {enemyName} ambushes {playerName}!"],
    horror: ["In the deepening gloom, the {enemyName} lurches at {playerName}!", "The witching hour approaches, and the {enemyName} attacks {playerName}!"],
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
    western: ["The trail provides. {playerName} finds a {itemName}.", "A lucky find! A {itemName} lies on the path ahead.", "Something glints in the dust. {playerName} discovers a {itemName}!"],
    japan: ["A gift from a wandering kami. {playerName} finds a {itemName}.", "A fortunate discovery! A {itemName} rests by a roadside shrine.", "Something of value lies forgotten on the path: a {itemName}!"],
    safari: ["Remnants of an old hunter's camp! {playerName} finds a {itemName}.", "A lucky find in the bush! A {itemName} appears.", "Something useful has been left behind. {playerName} picks up a {itemName}."],
    horror: ["A glimmer in the dark. {playerName} finds a {itemName} clutched in a skeletal hand.", "A strange artifact, a {itemName}, lies on a crumbling altar.", "A desperate soul left this {itemName} behind. It is yours now."],
    cyberpunk: ["A forgotten data-cache contains a {itemName}.", "Glitching in from a corrupted ad-hoarding, a {itemName} materializes.", "Found a piece of last-gen tech still in its wrapper: a {itemName}!"],
  },
  eventRevealObjective: {
    western: ["A new contract arrives for {playerName}: '{objectiveName}'. The request is clear: {objective_description}"],
    japan: ["The Shogun's decree is delivered to {playerName}: '{objectiveName}'. The mission states: {objective_description}"],
    safari: ["The expedition's benefactor issues new orders for {playerName}: '{objectiveName}'. The telegram reads: {objective_description}"],
    horror: ["A cryptic prophecy is revealed to {playerName}: '{objectiveName}'. The strange text foretells: {objective_description}"],
    cyberpunk: ["A new contract appears on the net for {playerName}: '{objectiveName}'. The job details are clear: {objective_description}"],
  },
  eventRevealThreat: {
    western: ["A {enemyName} appears before {playerName}!", "The air grows heavy... a {enemyName} has found {playerName}."],
    japan: ["A {enemyName} emerges from the mist before {playerName}!"],
    safari: ["A {enemyName} appears from the bush before {playerName}!"],
    horror: ["A {enemyName} lurches from the shadows before {playerName}!"],
    cyberpunk: ["A {enemyName} powers up before {playerName}!"],
  },
  eventRevealThreatHigh: {
    western: ["Hold your horses, {playerName}! An unwelcome visitor: the notorious {enemyName} appears!", "This is the big one! The legendary {enemyName} stands before {playerName}!", "The stories are true... The {enemyName} is here!", "A shadow falls over the land. The dreaded {enemyName} has arrived."],
    japan: ["A true demon! The legendary {enemyName} blocks the path of {playerName}!", "The Shogun's champion, the mighty {enemyName}, has come for {playerName}!", "The air itself trembles. The great {enemyName} appears!", "An oni of legend! The fearsome {enemyName} stands in your way."],
    safari: ["The hunt of a lifetime! The legendary {enemyName} stands before {playerName}!", "By the gods, it's the great {enemyName}! A true test for {playerName}!", "The ground shakes. The mighty {enemyName} has appeared!", "The trackers were right... The legendary {enemyName} is here."],
    horror: ["A true nightmare! The legendary {enemyName} materializes before {playerName}!", "The source of the darkness, the great {enemyName}, has come for {playerName}!", "A creature of unspeakable horror... The {enemyName} is here!", "The ancient evil has awakened. The {enemyName} stands before you."],
    cyberpunk: ["Red alert! A legendary {enemyName} unit is online and targeting {playerName}!", "This is it, the ghost in the machine! The infamous {enemyName} appears before {playerName}!", "Mainframe compromised! The legendary {enemyName} has breached security!", "A corporate legend, the deadly {enemyName}, is active and hostile."],
  },
  eventRevealThreatLow: {
    western: ["A {enemyName} shuffles into view. It looks hostile.", "A {enemyName} wanders onto the path, its eyes fixed on {playerName}.", "The rustle in the bushes reveals a {enemyName}. It doesn't look friendly.", "Just a lowly {enemyName}. Barely worth the bullet."],
    japan: ["A lesser yōkai, a {enemyName}, emerges. It seems hostile.", "A wandering {enemyName} crosses your path, its intentions unclear.", "The rustle in the bamboo reveals a {enemyName}. It looks ready for a fight.", "A common {enemyName}. A minor nuisance."],
    safari: ["A {enemyName} emerges from the tall grass. It looks aggressive.", "A {enemyName} wanders into the camp, its eyes fixed on {playerName}.", "The rustle in the acacia reveals a {enemyName}. It doesn't look friendly.", "Just a {enemyName}. More of a pest, really."],
    horror: ["A lesser horror, a {enemyName}, shuffles into view. It looks hungry.", "A {enemyName} crawls from the shadows, its eyes fixed on {playerName}.", "A skittering in the dark reveals a {enemyName}. It does not look friendly.", "A minor spawn of darkness. The {enemyName} approaches."],
    cyberpunk: ["A low-level security drone, a {enemyName}, powers up. It looks hostile.", "A rogue {enemyName} unit wanders into your sector, its sensors fixed on {playerName}.", "The static in the comms reveals a {enemyName}. It doesn't look friendly.", "Just a standard {enemyName}. Hardly a threat."],
  },
  eventRevealThreatMid: {
    western: ["Trouble's brewin'... a {enemyName} rears its ugly head on the trail.", "The sound of trouble... a {enemyName} is blocking your way, {playerName}.", "A mean-looking {enemyName} stands its ground.", "This {enemyName} looks like it means business."],
    japan: ["A greater threat... a {enemyName} emerges from the fog.", "The sound of steel... a {enemyName} is blocking your path, {playerName}.", "A formidable {enemyName} appears, ready to fight.", "This {enemyName} is no mere bandit."],
    safari: ["A dangerous beast... a {enemyName} appears on the savanna.", "The sound of a predator... a {enemyName} is blocking your way, {playerName}.", "A mature {enemyName} stands before you, ready to charge.", "This {enemyName} is a worthy adversary."],
    horror: ["A greater horror... a {enemyName} emerges from the gloom.", "The sound of scraping claws... a {enemyName} is blocking your way, {playerName}.", "A twisted {enemyName} lurches into view.", "This {enemyName} is a creature of nightmare."],
    cyberpunk: ["A serious threat... a {enemyName} unit comes online.", "The sound of charging weapons... a {enemyName} is blocking your way, {playerName}.", "An upgraded {enemyName} model powers up.", "This {enemyName} is a serious piece of hardware."],
  },
  goldFoundFromItem: {
    western: ["{playerName}'s {itemName} yields {goldAmount} Gold!", "A glint of gold! The {itemName} pays off, providing {goldAmount} Gold.", "Success! The {itemName} reveals {goldAmount} Gold.", "The {itemName} proves its worth, adding {goldAmount} Gold to the coffers.", "'Well, look what we have here!' The {itemName} uncovers {goldAmount} Gold.", "The {itemName} was a good investment, revealing {goldAmount} Gold."],
    japan: ["{playerName}'s {itemName} yields {goldAmount} mon!", "A fortunate find! The {itemName} pays off, providing {goldAmount} mon.", "The {itemName} provides a bounty of {goldAmount} mon.", "Good fortune! The {itemName} uncovers {goldAmount} mon.", "'Fortune smiles!' The {itemName} yields {goldAmount} mon.", "The kami have been generous. {goldAmount} mon from the {itemName}."],
    safari: ["{playerName}'s {itemName} yields {goldAmount} shillings!", "A bit of luck! The {itemName} pays off, providing {goldAmount} shillings.", "The {itemName} unearths {goldAmount} shillings!", "A profitable tool! The {itemName} yields {goldAmount} shillings.", "The old map was right! The {itemName} leads to {goldAmount} shillings.", "A hidden cache revealed by the {itemName}! {goldAmount} shillings richer."],
    horror: ["{playerName}'s {itemName} yields {goldAmount} silver pieces!", "A glimmer of hope! The {itemName} pays off, providing {goldAmount} silver pieces.", "The {itemName} reveals {goldAmount} tarnished silver pieces.", "A small fortune found. The {itemName} provides {goldAmount} silver.", "A secret compartment! The {itemName} reveals {goldAmount} tarnished silver.", "The cursed object yields a reward: {goldAmount} silver pieces."],
    cyberpunk: ["{playerName}'s {itemName} yields {goldAmount} credits!", "Data transfer complete! The {itemName} pays off, providing {goldAmount} credits.", "Data mined. The {itemName} extracts {goldAmount} credits.", "The {itemName} pays out, adding {goldAmount} credits to the account.", "Decrypted the data-shard! The {itemName} yields {goldAmount} credits.", "A hidden sub-routine in the {itemName} pays out {goldAmount} creds."],
  },
  goldFoundWalking: {
    western: ["{playerName} finds {goldAmount} Gold while walking the trail.", "The journey itself is profitable! {playerName} finds {goldAmount} Gold.", "Fortune smiles! {playerName} stumbles upon {goldAmount} Gold on the path.", "A lucky find! {playerName} picks up {goldAmount} Gold from the dust.", "Someone's loss is {playerName}'s gain. {goldAmount} Gold found.", "A heavy pouch dropped by a careless traveler! {playerName} finds {goldAmount} Gold.", "A glint in the creek bed reveals {goldAmount} Gold.", "Tucked away in an old stump, {playerName} discovers {goldAmount} Gold.", "The rumors were true! {playerName} finds a small cache of {goldAmount} Gold."],
    japan: ["{playerName} finds {goldAmount} mon on the road.", "The journey is profitable! {playerName} finds {goldAmount} mon.", "A dropped purse! {playerName} finds {goldAmount} mon.", "{playerName} finds {goldAmount} mon near a Jizo statue.", "A lost purse on the Tōkaidō road! {goldAmount} mon richer.", "Beside a Jizo statue, a small offering of {goldAmount} mon is found.", "A dropped coin pouch near a tea house. {goldAmount} mon inside."],
    safari: ["{playerName} finds {goldAmount} shillings on the path.", "The safari is profitable! {playerName} finds {goldAmount} shillings.", "A lost pouch! {playerName} finds {goldAmount} shillings.", "{playerName} spots something glinting in the sun. {goldAmount} shillings!", "A lost pouch from a previous expedition! {goldAmount} shillings.", "The riverbed glitters with more than just mica. {goldAmount} shillings found.", "A hollow baobab tree holds a small treasure. {goldAmount} shillings!"],
    horror: ["{playerName} finds {goldAmount} silver pieces in the mud.", "The cursed road is profitable! {playerName} finds {goldAmount} silver pieces.", "A purse dropped in haste... {playerName} finds {goldAmount} silver.", "{playerName} finds {goldAmount} silver on a fresh grave.", "A rotting lockbox half-buried in the mud contains {goldAmount} silver.", "Found a purse clutched in a skeletal hand. {goldAmount} silver pieces.", "The old well grants a boon: {goldAmount} silver coins."],
    cyberpunk: ["{playerName} finds a lost credstick worth {goldAmount} credits.", "The sprawl is profitable! {playerName} finds {goldAmount} credits.", "A lost cred-chip! {playerName} finds {goldAmount} credits.", "An unsecured data-node leaks {goldAmount} credits to {playerName}'s account.", "A credstick lying in the gutter still has {goldAmount} credits on it!", "Hacked a public terminal for a quick score: {goldAmount} creds.", "Found a dead ganger's stash. {goldAmount} credits."],
  },
  goldStolen: {
    western: ["The {eventName} deftly relieves {playerName} of {stolenAmount} Gold!", "A quick hand and a flash of steel! The {eventName} makes off with {stolenAmount} Gold from {playerName}."],
    japan: ["The {eventName} skillfully pilfers {stolenAmount} mon from {playerName}!", "A blur of motion and a lightened coin purse! The {eventName} has taken {stolenAmount} mon."],
    safari: ["The cheeky {eventName} snatches {stolenAmount} shillings from {playerName}!", "Distracted for a moment, {playerName} finds their pouch {stolenAmount} shillings lighter thanks to the {eventName}."],
    horror: ["A skeletal hand darts from the shadows, taking {stolenAmount} silver pieces from {playerName}!", "The {eventName} whispers a dark promise and your coin purse feels lighter by {stolenAmount} silver."],
    cyberpunk: ["A quick hack and a data-spike! The {eventName} siphons {stolenAmount} credits from {playerName}!", "The {eventName}'s ghost-program transfers {stolenAmount} credits before you can react."],
  },
  hatSaved: {
    western: ["A close call! {playerName}'s {itemName} absorbs the blow from {sourceName}, but is destroyed in the process.", "That could have been nasty! The {itemName} takes the full force of the attack from {sourceName} and is ruined."],
    japan: ["Incredible! {playerName}'s {itemName} deflects the blow from {sourceName}, but is shattered in the process.", "The {itemName} saved your life! It is destroyed by the force of {sourceName}'s attack."],
    safari: ["A close shave! {playerName}'s {itemName} takes the brunt of the attack from {sourceName}, but is torn to shreds.", "That could have been the end! The trusty {itemName} is destroyed protecting you from {sourceName}."],
    horror: ["The blessed {itemName} intercedes! It absorbs the unholy blow from {sourceName}, but is rent asunder.", "Your {itemName} is destroyed, but it saved you from a terrible fate at the hands of {sourceName}."],
    cyberpunk: ["The armored {itemName} takes the hit! The force of {sourceName}'s attack fries its circuits, but you are unharmed.", "Shielding activated! Your {itemName} absorbs the impact from {sourceName}, but is now a useless piece of scrap."],
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
    japan: ["The affliction of {illnessName} strikes with sudden force, forcing {playerName} to rest. The day is lost.", "Overcome by {illnessName}, {playerName} can travel no further today."],
    safari: ["The debilitating {illnessName} takes hold under the hot sun. {playerName} must stop for the day.", "The safari is halted as {playerName} succumbs to {illnessName}."],
    horror: ["A wave of unnatural sickness, the {illnessName}, saps {playerName}'s will. The day's desperate journey ends here.", "The curse of {illnessName} takes root, forcing {playerName} to take shelter as darkness falls early."],
    cyberpunk: ["A system-wide crash hits {playerName} as the {illnessName} takes hold. The day's run ends abruptly.", "The {illnessName} dataphage hits {playerName}'s chrome hard, forcing an emergency shutdown for the cycle."],
  },
  illnessCured: {
    western: ["The active threat of {eventName} is resolved with a dose of {itemName}.", "{itemName} proves effective against the lingering {eventName}."],
    japan: ["The {eventName} is purged from the body with a potent {itemName}.", "The spirit of the {eventName} is soothed and departs, thanks to the {itemName}."],
    safari: ["The fever breaks! The {eventName} is cured with a dose of {itemName}.", "The {itemName} works its magic, curing {playerName} of the debilitating {eventName}."],
    horror: ["The curse of {eventName} is lifted by the {itemName}!", "A moment of purity! The {itemName} cleanses the affliction of {eventName}."],
    cyberpunk: ["System purge complete. The {itemName} has eliminated the {eventName} virus.", "The {itemName} patch was successful. The {eventName} dataphage is no more."],
  },
  illnessTemporaryCure: {
    western: ["{playerName} is no longer suffering from {illnessName}.", "The bout of {illnessName} has passed. {playerName} feels much better."],
    japan: ["The mountain spirits' anger has passed. {playerName} is no longer afflicted with {illnessName}.", "The thin air feels clean and sharp again. The {illnessName} is gone."],
    safari: ["The cool of the evening brings relief. {playerName} has recovered from {illnessName}.", "After finding shade and water, the {illnessName} has passed."],
    horror: ["The maddening whispers from the peaks fall silent. {playerName} is free of {illnessName}.", "The curse of the high places has lifted. {illnessName} is no more."],
    cyberpunk: ["System reboot successful. The {illnessName} has been purged from active memory.", "The data smog clears. {playerName} no longer suffers from {illnessName}."],
  },
  itemBought: {
    western: ["{playerName} barters for a new {itemName}, parting with {cost} Gold.", "The {itemName} changes hands for {cost} Gold. A fine purchase.", "{playerName} parts with {cost} Gold for a much-needed {itemName}."],
    japan: ["{playerName} trades for a new {itemName}, parting with {cost} mon.", "The merchant bows as the deal for the {itemName} is made.", "A deal is struck. The {itemName} is yours for {cost} mon."],
    safari: ["{playerName} barters for a new {itemName}, parting with {cost} shillings.", "The trader agrees on {cost} shillings for the {itemName}.", "{playerName} adds the {itemName} to their kit for {cost} shillings."],
    horror: ["A dark bargain is struck. The {itemName} is yours for {cost} silver pieces.", "The hooded figure accepts the {cost} silver pieces. The {itemName} is yours.", "A grim purchase, but necessary. {itemName} bought for {cost} silver."],
    cyberpunk: ["{playerName} acquires a new {itemName}, transferring {cost} credits.", "Transaction complete. The {itemName} is yours for {cost} credits.", "{playerName} buys a {itemName} from a street vendor for {cost} credits."],
  },
  itemDiscarded: {
    western: ["{playerName} discards the {itemName}, lightening their load.", "No longer needed, the {itemName} is left behind."],
    japan: ["The {itemName} has served its purpose. It is left behind with a small prayer.", "To travel light is to travel far. The {itemName} is discarded."],
    safari: ["Excess gear is jettisoned. The {itemName} is discarded.", "The {itemName} is left for the scavengers. Every ounce counts on the trail."],
    horror: ["Perhaps it was cursed. The {itemName} is cast aside.", "The {itemName} is discarded, a small offering to the darkness to be left alone."],
    cyberpunk: ["The {itemName} is obsolete. It is junked.", "Freeing up a slot. The {itemName} is deleted from inventory."],
  },
  itemEquipped: {
    western: ["{playerName} equips the {itemName}, ready for what's next.", "Gearing up. The {itemName} is now ready.", "The {itemName} is readied for the trail ahead."],
    japan: ["{playerName} dons the {itemName}, ready for what's next.", "Preparing for battle. The {itemName} is now ready.", "The warrior prepares. The {itemName} is now equipped."],
    safari: ["{playerName} equips the {itemName}, ready for what's next.", "Gearing up. The {itemName} is now ready.", "The {itemName} is readied for the hunt ahead."],
    horror: ["{playerName} equips the {itemName}, ready for the horrors to come.", "Steeling themselves. The {itemName} is now ready.", "The {itemName} is readied for the darkness ahead."],
    cyberpunk: ["{playerName} installs the {itemName}, ready for what's next.", "System online. The {itemName} is now active.", "The {itemName} is integrated into the combat suite."],
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
    japan: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} mon.", "A savvy merchant takes that {itemName} off your hands for {sellAmount} mon.", "The {itemName} is exchanged for {sellAmount} mon."],
    safari: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} shillings.", "The trader inspects the {itemName} and offers {sellAmount} shillings. Deal.", "Good business. The {itemName} is sold for {sellAmount} shillings."],
    horror: ["{playerName} lightens their load, selling the {itemName} for {sellAmount} silver pieces.", "A strange collector takes that {itemName} off your hands for {sellAmount} silver pieces.", "A quick sale in a dimly lit stall. {sellAmount} silver for the {itemName}."],
    cyberpunk: ["{playerName} offloads the {itemName} for {sellAmount} credits.", "A fixer takes that {itemName} off your hands for {sellAmount} credits.", "Transaction complete. {itemName} offloaded for {sellAmount} credits."],
  },
  itemStored: {
    western: ["{playerName} stores the {itemName} away safely in their satchel.", "The {itemName} is tucked into the satchel for later.", "Keeping the {itemName} in reserve. It's stored in the satchel."],
    japan: ["{playerName} stores the {itemName} away safely in their pouch.", "The {itemName} is carefully wrapped and stored for the journey.", "A wise decision. The {itemName} is stored away."],
    safari: ["{playerName} stores the {itemName} away safely in their rucksack.", "The {itemName} is stowed, ready for when it's needed most.", "A good hunter is well-prepared. The {itemName} is stored."],
    horror: ["{playerName} stores the {itemName} away safely in their bag.", "Hiding the {itemName} from prying eyes. It's stored away.", "The {itemName} is secured. For now."],
    cyberpunk: ["{playerName} stores the {itemName} away safely in their utility pouch.", "The {itemName} is stashed in a shielded pocket.", "Updating inventory. The {itemName} is now in storage."],
  },
  itemTaken: {
    western: ["{playerName} picks up the {itemName} and adds it to their gear.", "The {itemName} is yours now. It goes into your discard pile.", "{playerName} takes the {itemName}. A useful find."],
    japan: ["{playerName} takes the {itemName}. A fine addition to their equipment.", "The {itemName} is now in your possession, sent to your discard pile.", "A fortunate find. The {itemName} is taken."],
    safari: ["{playerName} adds the {itemName} to their safari kit.", "The {itemName} is taken and added to the discard pile.", "A valuable find in the bush. {playerName} takes the {itemName}."],
    horror: ["{playerName} cautiously takes the {itemName}.", "The strange {itemName} is now yours. It has been added to your discard pile.", "Hopefully this {itemName} isn't cursed. It is taken."],
    cyberpunk: ["{playerName} jacks the {itemName} into their rig.", "The {itemName} is acquired and sent to your data cache (discard pile).", "A useful piece of hardware. {playerName} takes the {itemName}."],
  },
  laudanumHeal: {
    western: ["The Laudanum does the trick. Pain fades as {healAmount} HP is restored. Health: {currentHP}/{maxHP}.", "A swig of Laudanum knits the wounds, recovering {healAmount} HP. Now at {currentHP}/{maxHP}.", "The bitter tincture works its magic, dulling the pain. Healed {healAmount} HP.", "The warm embrace of the poppy soothes the body. {healAmount} HP restored.", "A blessed relief from the pain. The Laudanum restores {healAmount} health."],
    japan: ["The Poppy Tincture brings a quiet calm, healing {healAmount} HP.", "The pain subsides into a warm haze. Healed {healAmount} HP.", "A moment of peace. The Poppy Tincture restores {healAmount} health.", "The bitter drink eases the agony. {healAmount} HP restored.", "The warrior's pain is washed away by the tincture. {healAmount} health regained."],
    safari: ["The Morphine Syrette's contents bring blessed relief, healing {healAmount} HP.", "The safari is harsh, but medicine helps. Healed {healAmount} HP.", "The pain dulls to a distant thrum. The Morphine Syrette restores {healAmount} health.", "A welcome respite from the agony of the bush. {healAmount} HP restored.", "The syrette's medicine flows, mending the flesh. {healAmount} health regained."],
    horror: ["The sweet Milk of the Poppy holds the horrors at bay, healing {healAmount} HP.", "A blessed oblivion from the pain. Healed {healAmount} HP.", "The world dissolves into a dreamless sleep. The Milk of the Poppy restores {healAmount} health.", "The darkness in the body is pushed back by the tincture. {healAmount} HP restored.", "The blessed draught brings peace to the flesh. {healAmount} health is restored."],
    cyberpunk: ["The Painkiller Synth's auto-injector brings blessed relief, healing {healAmount} HP.", "The pain is a glitch, now patched. Healed {healAmount} HP.", "System diagnostics report pain levels dropping. The Painkiller Synth restores {healAmount} health.", "The injector's contents flood the system, repairing damage. {healAmount} HP restored.", "A wave of synthetic calm washes away the pain. {healAmount} health regained."],
  },
  laudanumAbuse: {
    western: ["A swig of {itemName} is taken. The world goes fuzzy, but there was no pain to dull.", "Already feelin' fit as a fiddle, but the {itemName} is downed anyway. The pleasant haze is its own reward.", "The familiar warmth of the {itemName} spreads, a comfort taken not from need, but from habit."],
    japan: ["The poppy's comfort is a siren song. They take it without need.", "A moment of quiet contemplation, aided by the {itemName}.", "The mind is clear, but the habit remains. The {itemName} is taken."],
    safari: ["A preventative measure, they tell themselves. The {itemName} is taken.", "The long nights on the veldt are easier with the {itemName}.", "The stress of the hunt calls for a steadying dose. The {itemName} is consumed."],
    horror: ["To keep the nightmares at bay, they take the {itemName}.", "The darkness is easier to face with a little help. The {itemName} is taken.", "A moment of forgetting is worth the price. The {itemName} is consumed."],
    cyberpunk: ["A stim to take the edge off the chrome. The {itemName} is taken.", "The constant static of the city is easier to ignore with the {itemName}.", "A moment of digital peace is bought with the {itemName}."],
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
    japan: ["Day {dayNumber}: A night of troubled dreams for {playerName}. The {illnessName} has taken a deeper hold.", "The rising sun brings no warmth, only a renewed sense of the {illnessName}'s affliction."],
    safari: ["Day {dayNumber}: The African night offered little rest. The {illnessName} has worsened.", "Another day of the hunt begins under the shadow of the {illnessName}."],
    horror: ["Day {dayNumber}: The nightmares were relentless. {playerName}'s {illnessName} has worsened.", "The grey dawn reveals the toll of the night; the {illnessName} has festered."],
    cyberpunk: ["Cycle {dayNumber}: A system reboot offered no relief. The {illnessName} virus has corrupted more files.", "The new cycle begins with a cascade of error messages. The {illnessName} has intensified."],
  },
  noGoldToSteal: {
    western: ["The {eventName} tries to rob {playerName}, but finds only empty pockets.", "'Your money or your life!' the {eventName} demands. {playerName} has no money to give."],
    japan: ["The {eventName} searches {playerName} for coin but finds none. 'A poor samurai is no samurai at all!'", "The bandit finds nothing of value on {playerName} and leaves in disgust."],
    safari: ["The {eventName} attempts to pilfer from {playerName}, but the hunter's kit is purely practical.", "The poacher finds no sovereigns on {playerName}, only tools of the trade."],
    horror: ["The {eventName} pats down {playerName}, finding only grim determination and empty pockets.", "The grave robber sneers, finding no silver to steal from {playerName}."],
    cyberpunk: ["The {eventName} runs a scan on {playerName}'s accounts and finds a balance of zero.", "The ganger's cred-skimmer comes up empty. 'Broke-ass choom,' they mutter."],
  },
  objectiveVoided: {
    western: ["The terms of the contract were clear. By letting the target go, the objective '{objectiveName}' is now void.", "The bounty poster is torn in two. The objective '{objectiveName}' is no longer valid.", "The sheriff spits on the ground. 'You had one job.' Objective '{objectiveName}' is void."],
    japan: ["The daimyo's contract is broken. The objective '{objectiveName}' is void.", "A matter of honor. The terms were not met, and the objective '{objectiveName}' is forfeit.", "You have strayed from the path. The objective '{objectiveName}' is now meaningless."],
    safari: ["The client is displeased. The contract for '{objectiveName}' has been terminated.", "You failed to meet the expedition's terms. The objective '{objectiveName}' is void.", "The Great White Hunter withdraws their support. The '{objectiveName}' objective is a failure."],
    horror: ["You have angered the powers that be. The pact for '{objectiveName}' is broken.", "The ritual has failed. The objective '{objectiveName}' is now a curse upon you.", "The whispers fall silent. You have failed the objective '{objectiveName}'."],
    cyberpunk: ["Contract terminated by client. The job '{objectiveName}' is scrubbed.", "You violated the terms of the gig. Objective '{objectiveName}' is now offline.", "The fixer is not pleased. Your failure on the '{objectiveName}' objective will cost you."]
  },
  playerAttack: {
    western: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes hell on {enemyName} with the {itemName}, dealing {attackPower} damage.", "{playerName} presses the attack against {enemyName} with {itemName} for {attackPower} damage."],
    japan: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a flurry of blows on {enemyName} with the {itemName}, dealing {attackPower} damage.", "A swift strike with the {itemName}! {attackPower} damage to {enemyName}."],
    safari: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a devastating attack on {enemyName} with the {itemName}, dealing {attackPower} damage.", "The hunter takes their shot! {itemName} hits {enemyName} for {attackPower} damage."],
    horror: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a desperate attack on {enemyName} with the {itemName}, dealing {attackPower} damage.", "A desperate blow against the darkness! {itemName} strikes for {attackPower} damage."],
    cyberpunk: ["{playerName} attacks {enemyName} with {itemName} for {attackPower} damage.", "{playerName} unleashes a hail of fire on {enemyName} with the {itemName}, dealing {attackPower} damage.", "Target acquired. {itemName} deals {attackPower} damage."],
  },
  playerCuresIllness: { 
    western: ["{playerName} shook off the {eventName} with {itemName}.", "That {itemName} worked wonders! {playerName} is cured of {eventName}."],
    japan: ["The potent {itemName} purges the {eventName} from {playerName}'s body.", "The {itemName} proves to be a powerful remedy against the {eventName}."],
    safari: ["A dose of {itemName} brings relief! {playerName} is cured of {eventName}.", "The fever breaks! The {itemName} has cured the {eventName}."],
    horror: ["The blessed {itemName} casts out the {eventName} from {playerName}!", "A moment of purity! The {itemName} cleanses {playerName} of the {eventName}."],
    cyberpunk: ["System purge complete! The {itemName} has eliminated the {eventName} virus.", "The nanites in the {itemName} were successful. {eventName} is no longer a threat."],
  },
  playerDamage: {
    western: ["{sourceName} hits {playerName} for {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{playerName} takes {damageAmount} damage from {sourceName}. Now at {currentHP}/{maxHP}.", "A costly mistake. {playerName} suffers {damageAmount} damage from {sourceName}. Health is now {currentHP}/{maxHP}."],
    japan: ["A swift blow from {sourceName}! {playerName} takes {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{sourceName} finds an opening, dealing {damageAmount} damage to {playerName}. Now at {currentHP}/{maxHP}."],
    safari: ["A savage attack from {sourceName}! {playerName} takes {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{sourceName} strikes true, dealing {damageAmount} damage to {playerName}. Now at {currentHP}/{maxHP}."],
    horror: ["A terrifying blow from {sourceName}! {playerName} takes {damageAmount} damage. Health: {currentHP}/{maxHP}.", "{sourceName}'s attack rends flesh, dealing {damageAmount} damage to {playerName}. Now at {currentHP}/{maxHP}."],
    cyberpunk: ["Armor breach! {sourceName} hits {playerName} for {damageAmount} damage. Integrity: {currentHP}/{maxHP}.", "{sourceName}'s attack finds a weak point, dealing {damageAmount} damage to {playerName}. Now at {currentHP}/{maxHP}."],
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
    japan: ["{playerName} has fallen in battle against {enemyName}. A warrior's end.", "Dishonored in defeat, {playerName}'s journey is over."],
    safari: ["The hunt has ended for {playerName}, taken by the savanna's dangers.", "The safari claims another life. {playerName} was defeated by {enemyName}."],
    horror: ["The darkness consumes {playerName}. The nightmare has won.", "{playerName} has succumbed to the horrors, defeated by {enemyName}."],
    cyberpunk: ["{playerName} has been flatlined by {enemyName}. The sprawl is unforgiving.", "System failure. {playerName}'s run has ended at the hands of {enemyName}."],
  },
  playerHeal: { 
    western: ["{playerName} patches themself up with {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Using the {sourceName} restores {healAmount} HP. Back in the fight at {currentHP}/{maxHP}.", "A moment of respite. The {sourceName} restores {healAmount} health, bringing them to {currentHP}/{maxHP}."],
    japan: ["The {sourceName} mends the body and spirit. {healAmount} health restored. Now at {currentHP}/{maxHP}.", "Ki is restored. {healAmount} HP recovered thanks to {sourceName}.", "With a deep breath, {playerName} applies the {sourceName}, gaining {healAmount} health."],
    safari: ["The medicine works. {healAmount} HP recovered from the {sourceName}, now at {currentHP}/{maxHP}.", "A moment to patch up. The {sourceName} restores {healAmount} health.", "The safari doctor's poultice, {sourceName}, works wonders. Healed {healAmount} HP."],
    horror: ["A brief reprieve from the pain. {sourceName} restores {healAmount} HP. Now at {currentHP}/{maxHP}.", "The strange poultice, {sourceName}, stings, but it works. Healed {healAmount} HP.", "The blessed balm, {sourceName}, closes the wound. {healAmount} health gained."],
    cyberpunk: ["Nanites at work. {sourceName} repairs {healAmount} HP. System at {currentHP}/{maxHP}.", "System integrity restored by {healAmount} using {sourceName}. Now at {currentHP}/{maxHP}.", "The med-stim injects, restoring {healAmount} HP."],
  },
  playerRecoversMaxHealth: { 
    western: ["Vitality returning. {playerName}'s max health is now {newMaxHealth}.", "Strength flows back. {playerName}'s max HP increased to {newMaxHealth}.", "The trail makes you tougher. Max HP is now {newMaxHealth}."],
    japan: ["Through discipline, the body is strengthened. Max HP is now {newMaxHealth}.", "Ki flows more freely. Max HP increases to {newMaxHealth}.", "The warrior's spirit strengthens the body. Max HP now {newMaxHealth}."],
    safari: ["The savanna hardens the soul. Max HP is now {newMaxHealth}.", "Endurance for the long hunt. Max HP increases to {newMaxHealth}.", "Acclimatized to the harsh environment, Max HP is now {newMaxHealth}."],
    horror: ["What doesn't kill you... Max HP is now {newMaxHealth}.", "A fragment of hope restored. Max HP increases to {newMaxHealth}.", "Sanity holds, strengthening the body. Max HP is now {newMaxHealth}."],
    cyberpunk: ["Armor sub-systems reinforced. Max HP is now {newMaxHealth}.", "Bioware upgrade complete. Max HP increases to {newMaxHealth}.", "System optimization successful. Max HP now {newMaxHealth}."],
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
    japan: ["The {eventName} carries away {discardedItemNames} in its muddy torrent!", "The fury of the mountain claims its due! Lost: {discardedItemNames}."],
    safari: ["The flash flood sweeps away precious gear! Lost: {discardedItemNames}.", "Caught in the deluge, {playerName} loses {discardedItemNames}!"],
    horror: ["The crumbling ruin collapses, burying {discardedItemNames} under ancient stone!", "A grasping hand from the earth pulls {discardedItemNames} into the abyss!"],
    cyberpunk: ["A structural collapse sends {discardedItemNames} plummeting into the undercity!", "The grid surge fries your gear! Lost: {discardedItemNames}!"],
  },
  rockslideIronWillSave: {
    western: ["A torrent of rock and debris! {playerName} stands firm against the {eventName}, saving their gear!", "With an iron will, {playerName} holds their ground and their gear through the {eventName}!"],
    japan: ["With the resolve of a true bushi, {playerName} weathers the {eventName}, protecting their equipment!", "The landslide is fierce, but {playerName}'s footing is sure. Their gear is safe."],
    safari: ["A true survivor, {playerName} shields their gear from the worst of the {eventName}!", "The hunter's instincts prevail! {playerName} protects their kit from the flash flood."],
    horror: ["{playerName}'s will proves stronger than the ancient stones! Their gear is saved from the {eventName}.", "By sheer force of will, {playerName} holds onto their equipment through the unholy tremor."],
    cyberpunk: ["{playerName}'s mag-boots hold firm against the collapse! Their gear is secure.", "Emergency shielding protects {playerName}'s hardware from the worst of the {eventName}!"],
  },
  scoutAhead: {
    western: [
      "{playerName} scouts the trail ahead, spotting a {eventName}.",
      "A cautious look over the next rise reveals a {eventName}.",
      "Better to be safe than sorry. Scouting ahead shows a {eventName} is coming.",
      "The trail ahead holds a {eventName}. Good to know.",
    ],
    japan: [
      "{playerName} scouts the path ahead, spotting a {eventName}.",
      "A moment of caution. A {eventName} lies on the road ahead.",
      "The wind whispers of what's to come: a {eventName}.",
    ],
    safari: [
      "{playerName} checks the tracks, revealing a {eventName} is nearby.",
      "The guide points. A {eventName} is just over the next dune.",
      "Good instincts. Scouting ahead reveals a {eventName}.",
    ],
    horror: [
      "{playerName} peers into the oppressive darkness, glimpsing a {eventName}.",
      "A gut feeling... Something is wrong up ahead. It's a {eventName}.",
      "The shadows part for a moment, revealing a {eventName} in the path.",
    ],
    cyberpunk: [
      "{playerName} scans the sector, detecting a {eventName} on the grid.",
      "A quick network scan shows a {eventName} is approaching.",
      "Running a quick diagnostic on the area reveals a {eventName}.",
    ],
  },
  storeRestock: { 
    western: ["{playerName} pays the storekeep {cost} Gold to clear the shelves and put out new stock.", "'This merchant's stock is stale.' {playerName} pays {cost} Gold for a fresh selection."],
    japan: ["{playerName} pays the merchant {cost} mon to bring out new wares from the back.", "The current selection is uninspiring. {playerName} spends {cost} mon to see new goods."],
    safari: ["{playerName} pays the trader {cost} shillings to open a new crate of supplies.", "The current supplies are picked over. {playerName} pays {cost} shillings for a fresh lot."],
    horror: ["{playerName} slides {cost} silver pieces to the unsettling peddler for a look at their 'special' wares.", "The strange merchant reveals new, disturbing items for {cost} silver."],
    cyberpunk: ["{playerName} pays the vendor {cost} credits to cycle the inventory.", "The street vendor's chrome is yesterday's news. {playerName} pays {cost} credits to see the new shipment."],
  },
  threatDefeated: { 
    western: ["The {enemyName} has been defeated by {playerName}.", "The {enemyName} falls before {playerName}. The wilderness is a little less crowded.", "Another threat neutralized. The {enemyName} is no more."],
    japan: ["The {enemyName} has been vanquished.", "{playerName} has proven their skill against the {enemyName}.", "Honor is satisfied. The {enemyName} lies defeated."],
    safari: ["The hunt is successful. The {enemyName} is down.", "Another dangerous beast is dealt with. The {enemyName} is defeated.", "The savanna has one less predator. The {enemyName} is defeated."],
    horror: ["The nightmare is ended. The {enemyName} is destroyed.", "One less horror to haunt the night. The {enemyName} has been slain.", "The creature is sent back to the abyss. The {enemyName} is vanquished."],
    cyberpunk: ["Target neutralized. The {enemyName} unit is offline.", "{playerName} decommissions the {enemyName}.", "System shutdown complete. The {enemyName} is scrapped."],
  },
  threatDefeatedHigh: {
    western: ["The {enemyName} met its match today. The trail's a bit safer, thanks to {playerName}.", "The territory breathes a sigh of relief. The legendary {enemyName} has been put down by {playerName}.", "Tales of {playerName}'s victory over the great {enemyName} will be told around campfires for years."],
    japan: ["The province is safe once more. The great demon {enemyName} has been sealed by {playerName}.", "The Emperor will hear of this victory. {playerName} has vanquished the mighty {enemyName}.", "A legend is born from this battle. The tale of {playerName} and the fall of {enemyName} will be immortalized."],
    safari: ["The entire savanna seems to fall silent in awe. The legendary {enemyName} has been bested by {playerName}.", "The greatest trophy of all has been claimed. {playerName} stands victorious over the great {enemyName}.", "The safari has its ultimate prize. {playerName} has brought down the magnificent {enemyName}."],
    horror: ["A flicker of hope returns to the land. The ancient evil, {enemyName}, has been banished by {playerName}.", "The nightmare has ended. {playerName} has destroyed the unholy {enemyName}.", "The darkness recedes, if only for a time. {playerName} has defeated the great horror, {enemyName}."],
    cyberpunk: ["System stability restored. The rogue AI {enemyName} has been decommissioned by {playerName}.", "The net breathes a sigh of relief. {playerName} has purged the infamous ghost, {enemyName}.", "A legend of the sprawl is written. {playerName} has flatlined the legendary {enemyName}."],
  },
  threatDefeatedLow: {
    western: ["{playerName} dealt with the {enemyName}. Just another day on the frontier.", "A minor nuisance, the {enemyName}, is dispatched with ease by {playerName}.", "Quick work is made of the {enemyName}. Onward."],
    japan: ["A lesser spirit, the {enemyName}, is banished by {playerName}.", "The {enemyName} was a distraction, now removed.", "A swift end to a minor conflict. The {enemyName} is gone."],
    safari: ["The {enemyName} is dispatched. The safari continues.", "A quick resolution to a small problem. The {enemyName} is no more.", "The hunter deals with the {enemyName} efficiently."],
    horror: ["A lesser horror, the {enemyName}, is sent back to the pit.", "The {enemyName} is a footnote in a larger nightmare, now ended.", "One less creature of the night to worry about."],
    cyberpunk: ["A low-level threat, the {enemyName}, is taken offline.", "The {enemyName} was just noise in the system, now silenced.", "System resources optimized. The {enemyName} has been deleted."],
  },
  threatDefeatedMid: {
    western: ["Another one bites the dust. {playerName} sent the {enemyName} packing.", "A worthy fight, but the {enemyName} is defeated.", "The {enemyName} put up a struggle, but {playerName} was victorious."],
    japan: ["A test of skill. The {enemyName} falls to {playerName}'s blade.", "The {enemyName} fought with honor, but was ultimately defeated.", "The duel is over. {playerName} is the victor."],
    safari: ["A fine trophy. The {enemyName} has been taken down.", "The hunter's skill prevails against the {enemyName}.", "The beast fought well, but the hunter was better."],
    horror: ["The creature of the night is slain by {playerName}.", "The {enemyName}'s reign of terror is over.", "The darkness is pushed back. The {enemyName} is vanquished."],
    cyberpunk: ["The rogue unit is decommissioned by {playerName}.", "The {enemyName}'s protocols have been terminated.", "Another successful run. The {enemyName} is offline."],
  },
  threatFlees: {
    western: ["The {enemyName} decides {playerName} is not worth the trouble and flees.", "Seeing {playerName}, the {enemyName} thinks better of it and disappears into the brush.", "The {enemyName} tucks its tail and runs for the hills."],
    japan: ["The {enemyName} loses its nerve and retreats into the shadows.", "A wise decision. The {enemyName} chooses life over a pointless battle.", "Dishonorable! The {enemyName} flees the field of battle."],
    safari: ["The beast turns and runs, a flash of fur in the distance.", "A lucky break! The {enemyName} decides to seek easier prey.", "The {enemyName} gives a warning cry and retreats into the bush."],
    horror: ["The creature screeches and melts back into the darkness.", "A flicker of light, and the {enemyName} is gone, as if it were never there.", "The horror decides your soul is not yet ripe for the taking and retreats."],
    cyberpunk: ["The drone's self-preservation protocol kicks in, and it retreats.", "Target lock disengaged. The {enemyName} unit withdraws.", "The rogue AI calculates its odds and decides on a tactical retreat."],
  },
  trapBroken: {
    western: ["The powerful {enemyName} breaks free from the {trapName}, taking {damageAmount} damage in the process!", "With a roar, the {enemyName} smashes the {trapName}, but not before taking {damageAmount} damage.", "The {trapName} wasn't strong enough! The {enemyName} escapes, but not unharmed, taking {damageAmount} damage."],
    japan: ["The yōkai's strength is too great! The {trapName} splinters, but not before dealing {damageAmount} damage to the {enemyName}!", "With a furious kiai, the {enemyName} breaks the {trapName}, taking {damageAmount} damage as it escapes."],
    safari: ["The beast's fury destroys the {trapName}, but it takes {damageAmount} damage in its escape!", "The gin trap wasn't strong enough! The {enemyName} breaks free, wounded for {damageAmount} damage."],
    horror: ["The nightmare's power is too much! The holy ward of the {trapName} shatters, inflicting {damageAmount} damage!", "With an unearthly screech, the {enemyName} destroys the {trapName}, taking {damageAmount} damage from the blessed iron."],
    cyberpunk: ["The rogue AI's defenses are too strong! The {trapName} is overloaded, dealing {damageAmount} feedback damage to the {enemyName}!", "With a surge of power, the {enemyName} shorts out the {trapName}, taking {damageAmount} electrical damage."],
  },
  trapCaught: {
    western: ["Success! The {trapName} snaps shut on the unsuspecting {enemyName}!", "Got 'em! The {enemyName} is caught fast in the {trapName}.", "The trap springs! The {enemyName} is ensnared."],
    japan: ["A well-laid plan comes to fruition. The {enemyName} is caught.", "The yōkai is caught in the {trapName}!", "The trap springs true, ensnaring the {enemyName}!"],
    safari: ["The hunter's trap finds its mark. The {enemyName} is caught.", "The pitfall trap works perfectly! The {enemyName} is caught.", "A successful snare! The {enemyName} is trapped."],
    horror: ["The blessed trap holds fast! The {enemyName} is caught.", "The glyphs on the ground flare to life, trapping the {enemyName}!", "The trap's iron jaws, inscribed with holy runes, snap shut on the {enemyName}!"],
    cyberpunk: ["The EMP mine detonates, disabling the {enemyName}!", "The stasis field activates, trapping the {enemyName}!", "Target acquired and immobilized. The {trapName} is successful."],
  },
  trapHumanBrokeNoDamage: {
    western: ["The wily {enemyName} spots the {trapName} at the last second and disables it.", "'Not today,' mutters the {enemyName}, carefully disarming the {trapName}.", "The {enemyName} avoids the trap with a practiced step."],
    japan: ["A warrior's senses save the {enemyName} from the {trapName}.", "The ninja laughs and disarms the {trapName} with ease.", "'A clumsy attempt,' the {enemyName} sneers, stepping over the trap."],
    safari: ["A poacher's instinct saves the {enemyName} from the {trapName}.", "The mercenary laughs and kicks the {trapName} aside.", "The guide spots the trap easily. 'You'll have to be cleverer than that.'"],
    horror: ["A sixth sense saves the {enemyName} from the {trapName}.", "The cultist laughs and kicks the {trapName} aside.", "The creature seems to know where the {trapName} is and avoids it with unnatural grace."],
    cyberpunk: ["Enhanced optics save the {enemyName} from the {trapName}.", "The street samurai laughs and deactivates the {trapName} with ease.", "The ganger's scanner detects the {trapName} and they sidestep it with a smirk."],
  },
  useCheatItem: {
    western: [
      "{playerName} uses the legendary {itemName}.",
      "A strange power emanates from the {itemName} as {playerName} uses it.",
      "The {itemName}, an item of some renown, is put to use.",
    ],
  },
  equipCheatItem: {
    western: [
      "{playerName} equips the legendary {itemName}.",
      "The {itemName}, an item of some renown, is equipped.",
      "A strange power emanates from the {itemName} as {playerName} equips it.",
    ],
  },
};

const bossLogTemplates: Record<string, Partial<Record<Theme, string[]>>> = {
  playerAttack: {
    western: ["{playerName} goes for broke, attacking the legendary {enemyName} with {itemName} for {attackPower} damage!", "With grim determination, {playerName} unleashes a devastating blow with the {itemName}, dealing {attackPower} damage!", "This is for all the folks you've wronged! {playerName} attacks {enemyName} for {attackPower} damage!"],
    japan: ["{playerName} unleashes a secret technique, striking {enemyName} with the {itemName} for {attackPower} damage!", "For the honor of my clan! {playerName}'s {itemName} bites deep, dealing {attackPower} damage to the mighty {enemyName}!", "A final, desperate clash of steel! {playerName} attacks the great {enemyName} for {attackPower} damage!"],
    safari: ["{playerName} takes the shot of a lifetime, hitting {enemyName} with the {itemName} for {attackPower} damage!", "With the roar of the savanna in their heart, {playerName} strikes the legendary {enemyName} for {attackPower} damage!", "For the glory of the hunt! {playerName} attacks the great beast {enemyName} for {attackPower} damage!"],
    horror: ["Against all hope, {playerName} strikes a blow against the darkness! The {itemName} deals {attackPower} damage to {enemyName}!", "'Back to the hell that spawned you!' {playerName} attacks {enemyName} for {attackPower} damage!", "With a prayer on their lips, {playerName} lands a desperate blow for {attackPower} damage on the {enemyName}!"],
    cyberpunk: ["{playerName} executes a critical exploit, hitting {enemyName} with the {itemName} for {attackPower} damage!", "Overcharging all systems! {playerName}'s {itemName} slams into the legendary {enemyName} for {attackPower} damage!", "This is for the streets! {playerName} attacks the corporate legend {enemyName} for {attackPower} damage!"],
  },
  playerDamage: {
    western: ["The legend lands a crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from the outlaw king, {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final fight! Now at {currentHP}/{maxHP}.", "The final showdown takes its toll! {sourceName} hits for a devastating {damageAmount} damage."],
    japan: ["The Oni lands a devastating strike on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A fierce blow from the Shogun's champion, {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final duel! Now at {currentHP}/{maxHP}.", "A master's stroke! {sourceName} deals {damageAmount} damage in the final battle."],
    safari: ["The great beast lands a savage blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A brutal attack from the apex predator, {sourceName}! {playerName} is wounded for {damageAmount} damage. This is the final hunt! Now at {currentHP}/{maxHP}.", "The king of the savanna, {sourceName}, mauls you for {damageAmount} damage!"],
    horror: ["The nightmare lands a soul-crushing blow on {playerName}! You take {damageAmount} damage. Health: {currentHP}/{maxHP}.", "A terrifying attack from the ancient evil, {sourceName}! {playerName} is wounded for {damageAmount} damage. The end is near! Now at {currentHP}/{maxHP}.", "The darkness itself strikes! {sourceName} deals {damageAmount} damage, a blow to body and soul."],
    cyberpunk: ["The rogue AI lands a critical hit on {playerName}! You take {damageAmount} damage. Integrity: {currentHP}/{maxHP}.", "A brutal system shock from the mainframe, {sourceName}! {playerName} is damaged for {damageAmount}. This is the final run! Now at {currentHP}/{maxHP}.", "The corporation's ultimate weapon, {sourceName}, unleashes its full power for {damageAmount} damage!"],
  },
  playerHeal: {
    western: ["No time to rest in a duel with death, but {playerName} must! You use {sourceName}, restoring {healAmount} HP. Now at {currentHP}/{maxHP}.", "Buying a precious moment in the final showdown, the {sourceName} restores {healAmount} HP for {playerName}. The fight rages on at {currentHP}/{maxHP}.", "A quick patch-up in the heat of battle. {sourceName} restores {healAmount} health."],
    japan: ["Even in a battle of legends, a warrior must tend their wounds. {sourceName} restores {healAmount} HP. Now at {currentHP}/{maxHP}.", "Finding a moment of clarity amidst the storm of battle, {sourceName} restores {healAmount} HP for {playerName}. The duel continues at {currentHP}/{maxHP}.", "A moment of focus. {sourceName} restores {healAmount} health."],
    safari: ["In the heart of the hunt, a moment to regroup. {sourceName} restores {healAmount} HP. Now at {currentHP}/{maxHP}.", "The hunter pauses, patching their wounds with {sourceName} to continue the fight. Restored {healAmount} HP, now at {currentHP}/{maxHP}.", "A quick field dressing. {sourceName} restores {healAmount} health."],
    horror: ["A desperate prayer in the face of oblivion. {sourceName} restores {healAmount} HP. Now at {currentHP}/{maxHP}.", "A moment of respite from the unending nightmare, the {sourceName} restores {healAmount} HP for {playerName}. The terror continues at {currentHP}/{maxHP}.", "A brief reprieve. {sourceName} restores {healAmount} health."],
    cyberpunk: ["Re-routing power to repair systems. {sourceName} restores {healAmount} integrity. Now at {currentHP}/{maxHP}.", "Initiating emergency bio-repair sequence, the {sourceName} restores {healAmount} HP for {playerName}. The run continues at {currentHP}/{maxHP}.", "A quick system patch. {sourceName} restores {healAmount} health."],
  },
  trapCaught: {
    western: ["In an unbelievable turn, the legend {enemyName} stumbles right into {playerName}'s {trapName}!", "The ultimate prize! The {trapName} holds fast, ensnaring the great {enemyName} for {playerName}!", "The hunter becomes the hunted! The notorious {enemyName} is caught in the {trapName}!"],
    japan: ["An unforeseen tactic! The mighty {enemyName} is caught in the {trapName}!", "Even a demon can be ensnared! The {trapName} holds the {enemyName}!", "The Shogun's champion, {enemyName}, is caught in a dishonorable but effective {trapName}!"],
    safari: ["The hunter's cunning pays off! The great beast {enemyName} is caught in the {trapName}!", "A stroke of genius! The legendary {enemyName} is trapped!", "The ultimate trophy is ensnared! The {trapName} holds the great {enemyName}!"],
    horror: ["The nightmare is snared! The blessed trap holds the unholy {enemyName}!", "Even a creature of darkness can be caught! The {trapName} springs on {enemyName}!", "The ancient evil, {enemyName}, is held fast by the holy wards of the {trapName}!"],
    cyberpunk: ["System override! The rogue AI {enemyName} triggers the {trapName}!", "A logic bomb in the system! The {trapName} ensnares the mighty {enemyName}!", "The corporate legend, {enemyName}, is caught in a simple, effective {trapName}!"],
  },
  trapBroken: {
    western: ["The mighty outlaw {enemyName} shrugs off the {trapName}, shattering it but taking {damageAmount} damage in the process!", "With a contemptuous roar, the legend {enemyName} demolishes {playerName}'s {trapName}, but not before taking {damageAmount} damage!", "The {trapName} was no match for the likes of {enemyName}! It breaks, but not before dealing {damageAmount} damage."],
    japan: ["The Oni's strength is too great! The {trapName} shatters, but not before dealing {damageAmount} damage to the {enemyName}!", "With a furious kiai, the {enemyName} breaks the {trapName}, taking {damageAmount} damage as it escapes!", "The {trapName} is a minor inconvenience for the great {enemyName}, but it still deals {damageAmount} damage!"],
    safari: ["The great beast's fury destroys the {trapName}, but it takes {damageAmount} damage in its escape!", "With a savage roar, the {enemyName} tears the {trapName} apart, taking {damageAmount} damage in the process!", "The {trapName} could not hold the might of {enemyName}, but it leaves a nasty wound for {damageAmount} damage."],
    horror: ["The nightmare's power is too much! The holy ward of the {trapName} shatters, inflicting {damageAmount} damage!", "With an unearthly screech, the {enemyName} destroys the {trapName}, taking {damageAmount} damage from the blessed iron!", "The ancient evil {enemyName} tears free from the {trapName}, but not before taking {damageAmount} damage from its holy power."],
    cyberpunk: ["The rogue AI's defenses are too strong! The {trapName} is overloaded, dealing {damageAmount} feedback damage to the {enemyName}!", "With a surge of power, the {enemyName} shorts out the {trapName}, taking {damageAmount} electrical damage!", "The {trapName}'s primitive tech is no match for {enemyName}, but it still manages to deal {damageAmount} damage on failure."],
  },
};

const characterMotivationLogTemplates: {
  trigger: string;
  condition: (player: PlayerDetails, card?: CardData, isBossFight?: boolean) => boolean;
  chance: number;
  messages: Partial<Record<Theme, string[]>>;
}[] = [
  // --- MOTIVATIONS - BOSS FIGHTS ---
  // Seeking Redemption
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Redemption' && !!isBossFight, chance: 0.8, messages: { western: ["'This is my penance!' They strike the {enemyName} with all their might!", "'For those I failed!' Their attack on the {enemyName} is fueled by regret."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Redemption' && !!isBossFight, chance: 0.8, messages: { western: ["'I must live to see this through... to be redeemed.' Heals {healAmount}.", "'The past will not claim me today.' Heals {healAmount} to continue the fight."] } },
  // Seeking Fortune
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Fortune' && !!isBossFight, chance: 0.8, messages: { western: ["'The bounty on your head is mine!' They attack the {enemyName} with fervor.", "'Every hit brings me closer to the prize!' They strike at the {enemyName}."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Fortune' && !!isBossFight, chance: 0.8, messages: { western: ["'Can't spend the reward if I'm dead!' Heals {healAmount} HP.", "'This is just a business expense.' Heals {healAmount} to protect their investment."] } },
  // Seeking Vengeance
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Vengeance' && !!isBossFight, chance: 0.8, messages: { western: ["'This is for what you've done!' Their attack against {enemyName} is filled with hatred.", "'You took everything from me! Now I take your life!' They scream as they attack."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Vengeance' && !!isBossFight, chance: 0.8, messages: { western: ["'I will not die until you have paid!' Heals {healAmount} HP.", "'My hatred sustains me, but this helps too.' Heals {healAmount}."] } },
  // Seeking Knowledge
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Knowledge' && !!isBossFight, chance: 0.8, messages: { western: ["'Such a unique specimen!' They attack the {enemyName}, studying its reactions.", "'Every action reveals a new secret!' They press the attack on the {enemyName}."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Knowledge' && !!isBossFight, chance: 0.8, messages: { western: ["'I must survive to document this encounter.' Heals {healAmount} HP.", "'Fascinating... the body's resilience is remarkable.' Heals {healAmount}."] } },
  // Seeking Escape
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Escape' && !!isBossFight, chance: 0.8, messages: { western: ["'You're the last thing between me and freedom!' They attack the {enemyName} desperately.", "'I'm getting out of here, one way or another!' They strike the {enemyName}."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Escape' && !!isBossFight, chance: 0.8, messages: { western: ["'I can't fall here! Not when I'm so close!' Heals {healAmount} HP.", "'Just a little longer... I have to hold on.' Heals {healAmount}."] } },
  // Seeking Power
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Power' && !!isBossFight, chance: 0.8, messages: { western: ["'Your legend will be the foundation of mine!' They attack the {enemyName} ruthlessly.", "'There can be only one!' They strike at the {enemyName} to claim its power."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Power' && !!isBossFight, chance: 0.8, messages: { western: ["'The powerful do not succumb to mere wounds.' Heals {healAmount} HP.", "'This is but a momentary setback on my path to glory.' Heals {healAmount}."] } },
  // Seeking Peace
  { trigger: 'playerAttack', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Peace' && !!isBossFight, chance: 0.8, messages: { western: ["'Only in your defeat will this land know peace!' They attack the {enemyName}.", "'This violence must end, and it ends with you!' They strike the {enemyName}."] } },
  { trigger: 'playerHeal', condition: (p, c, isBossFight) => p.personality?.motivation === 'Seeking Peace' && !!isBossFight, chance: 0.8, messages: { western: ["'I must endure, for the sake of a peaceful tomorrow.' Heals {healAmount} HP.", "'To find peace, one must first survive the war.' Heals {healAmount}."] } },
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
  
  // NORMALIZE CATEGORY FIRST (BUG FIX)
  let triggerCategory = category;
  if (['threatDefeatedLow', 'threatDefeatedMid', 'threatDefeatedHigh'].includes(category)) {
    triggerCategory = 'threatDefeated';
  }
  if (['eventRevealThreatLow', 'eventRevealThreatMid', 'eventRevealThreatHigh'].includes(category)) {
    triggerCategory = 'eventRevealThreat';
    params.enemyName = card?.name;
  }

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

  // --- 1. Gather all potential messages ---
  const popCultureMessages: string[] = [];
  if (player?.name && player.character) {
    const lowerCasePlayerName = player.name.toLowerCase();
    const activeCheat = POP_CULTURE_CHEATS.find(
      c => c.name.toLowerCase() === lowerCasePlayerName && c.requiredCharacterId === player.character?.id
    );

    if (activeCheat?.effects.catchphrases) {
      let categoryToUse: CheatPhraseCategory = triggerCategory as CheatPhraseCategory;

      // 1. Determine the most specific category available for cheats
      if ((triggerCategory === 'playerAttack' || triggerCategory === 'threatDefeated') && card?.subType) {
        let specificCategory: CheatPhraseCategory | null = null;
        if (triggerCategory === 'playerAttack' && card.subType === 'human') specificCategory = 'playerAttackHuman';
        if (triggerCategory === 'playerAttack' && card.subType === 'animal') specificCategory = 'playerAttackAnimal';
        if (triggerCategory === 'threatDefeated' && card.subType === 'human') specificCategory = 'threatDefeatedHuman';
        if (triggerCategory === 'threatDefeated' && card.subType === 'animal') specificCategory = 'threatDefeatedAnimal';
  
        // If the specific category exists in the cheat's catchphrases, use it.
        if (specificCategory && activeCheat.effects.catchphrases[specificCategory]) {
            categoryToUse = specificCategory;
        }
      }

      // 2. Get the phrases for the determined category
      const phrasesForCategory = activeCheat.effects.catchphrases[categoryToUse];
      
      if (phrasesForCategory) {
        let specificPhrases: string[] | undefined;

        if (Array.isArray(phrasesForCategory)) {
          specificPhrases = phrasesForCategory;
        } else if (typeof phrasesForCategory === 'object' && card?.id) {
          // This handles item-specific phrases like for 'equipCheatItem'
          specificPhrases = (phrasesForCategory as Record<string, string[]>)[card.id];
        }

        if (specificPhrases && specificPhrases.length > 0) {
          popCultureMessages.push(...specificPhrases);
        }
      }
    }
  }

  const personalityMessages: string[] = [];
  if (player) {
    const allPersonalityLogs = [...characterLogTemplates, ...traitLogTemplates, ...characterMotivationLogTemplates];
    const potentialLogs = allPersonalityLogs.filter(log => log.trigger === triggerCategory);

    for (const log of potentialLogs) {
      if (log.condition(player, card, isBossFight) && Math.random() < log.chance) {
        const themedMessages = log.messages[theme] || log.messages['western'];
        if (themedMessages && themedMessages.length > 0) {
          personalityMessages.push(...themedMessages);
        }
      }
    }
  }
  
  const categoryTemplates = isBossFight ? (bossLogTemplates[category] || logTemplates[category]) : logTemplates[category];
  const genericMessages = (categoryTemplates && (categoryTemplates[theme] || categoryTemplates['western'])) || [];
  
  // --- 2. Select Final Message with Prioritization ---
  let finalMessagePool: string[] = [];
  const usePopCulture = Math.random() < 0.90; // 90% chance
  const usePersonality = Math.random() < 0.8; // 80% chance

  if (popCultureMessages.length > 0 && usePopCulture) {
      finalMessagePool = popCultureMessages;
  } else if (personalityMessages.length > 0 && usePersonality) {
      finalMessagePool = personalityMessages;
  } else if (genericMessages.length > 0) {
      finalMessagePool = genericMessages;
  } else {
      // Final fallback chain if primary choices fail
      if (popCultureMessages.length > 0) finalMessagePool = popCultureMessages;
      else if (personalityMessages.length > 0) finalMessagePool = personalityMessages;
      else finalMessagePool = genericMessages;
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

  // Replace any un-filled placeholders to avoid showing "{placeholder}" in the log
  template = template.replace(/{[^}]+}/g, (match) => {
    return `[${match.substring(1, match.length - 1)} unset]`;
  });

  return template;
}
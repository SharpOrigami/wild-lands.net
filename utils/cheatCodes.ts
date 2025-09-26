import { Character, CardData } from '../types.ts';

/**
 * Defines the types of game events that can trigger a special catchphrase.
 */
export type CheatPhraseCategory =
  | 'playerAttack'
  | 'threatDefeated'
  | 'goldFound'
  | 'itemBought'
  | 'itemTaken'
  | 'playerDamage'
  | 'playerHeal'
  | 'laudanumAbuse';

/**
 * Defines the effects of a pop culture cheat code.
 * All properties are optional.
 */
export interface PopCultureCheatEffect {
  /** A list of custom cards to add to the player's discard pile at the start of the game. */
  addCustomCards?: CardData[];
  /** Amount of gold to add to the player's starting total. */
  addGold?: number;
  /** Amount to increase the player's maximum health. */
  addMaxHealth?: number;
  /** Amount to permanently increase the difficulty of all events for the run. */
  increaseDifficulty?: number;
  /** A collection of character-specific phrases to be used in the game log for certain events. */
  catchphrases?: Partial<Record<CheatPhraseCategory, string[]>>;
}

/**
 * Defines a pop culture cheat, linking a name to a character and specific effects.
 */
export interface PopCultureCheat {
  /** The name to be typed into the character name field (case-insensitive). */
  name: string;
  /** The ID of the character that must be selected for the cheat to activate. */
  requiredCharacterId: Character['id'];
  /** The collection of effects to apply when the game starts with this cheat. */
  effects: PopCultureCheatEffect;
}

/**
 * A list of all pop culture cheats available in the game.
 * The game checks this list when a player starts a new game. If the entered name
 * and selected character match an entry, the specified effects are applied.
 */
export const POP_CULTURE_CHEATS: PopCultureCheat[] = [
  // --- GUNSLINGER ---
  {
    name: "the man with no name",
    requiredCharacterId: 'gunslinger', 
    effects: {
      addGold: 200,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_clint_poncho', name: "Man with No Name's Poncho", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 7, persistent: true }, description: "This dusty poncho has seen a lot. It offers more than just protection from the sun.", sellValue: 25, isCheat: true, illustrationId: 'upgrade_plain_duster_t1' },
        { id: 'item_six_shooter_clint', name: "Peacemaker", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "A revolver that has settled many disputes.", sellValue: 20, isCheat: true, illustrationId: 'item_six_shooter_t1' }
      ],
      catchphrases: {
        playerAttack: ["'You've gotta ask yourself one question: 'Do I feel lucky?' Well, do ya, punk?'", "'Go ahead, make my day.'", "He squints. 'My mule don't like people laughing. He gets the crazy idea you're laughin' at him.'", "This is the .44 Magnum, the most powerful handgun in the world."],
        threatDefeated: ["Another one bites the dust. 'Every gun makes its own tune.'", "'A man's got to know his limitations.' The {enemyName} found theirs.", "He blows the smoke from his six-shooter. 'You see, in this world there's two kinds of people, my friend... Those with loaded guns and those who dig. You dig.'", "'Deserve's got nothin' to do with it.'"],
        goldFound: ["He picks up the {goldAmount} Gold. 'A fistful of dollars.'", "'For a few dollars more...'", "'The Good, the Bad, and the Ugly... and I'm the one with the gold.'"],
        playerDamage: ["He takes the hit without a word, just a cold stare.", "A bullet grazes him. He just chews on his cigarillo.", "'I'm not a man to be trifled with.'"],
        itemBought: ["He pays the {cost}G. 'A man's gotta have a code.'", "'This will come in handy.'"]
      }
    },
  },
  {
    name: "arthur morgan",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 100,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'item_rifle_arthur', name: "Arthur's Rifle", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A reliable Lancaster Repeater. Has seen a lot of use.", sellValue: 25, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'custom_arthur_journal', name: "Arthur's Journal", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A moment of reflection brings clarity and soothes the body. Draw 2 cards and heal 2 HP.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal', immediateEffect: { type: 'heal', amount: 2 } }
      ],
      catchphrases: {
        playerAttack: ["'You got a kind face... The kind I like to punch!'", "'Outta the damn way!'", "'Sure.' He opens fire."],
        threatDefeated: ["'You, sir, are a fish.' The {enemyName} is no more.", "He tips his hat. 'We're thieves in a world that don't want us no more.'", "'Maybe when your mother's finished mourning your father, I'll keep her in black on your behalf.'", "'You enjoy being a rich man's toy, do ya?'"],
        goldFound: ["'Just a bit more, and we're off to Tahiti.' He finds {goldAmount} Gold.", "'All I'm saying is... there's always a goddamn train.'", "'One more score, and we're gone.'"],
        playerDamage: ["Takes a hit. 'Sure.'", "A racking cough echoes. 'I'm afraid.'", "He grimaces. 'Vengeance is an idiot's game.'"],
        laudanumAbuse: ["He takes a swig. 'Just need to clear my head.'", "'Helps with the cough.'", "'This is all a big joke to you, ain't it?'"]
      }
    },
  },
  {
    name: "rooster cogburn",
    requiredCharacterId: 'gunslinger',
    effects: {
       addGold: 150,
       addMaxHealth: 3,
       addCustomCards: [
        { id: 'item_six_shooter_rooster', name: "Rooster's Colt Dragoon", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "A heavy, reliable revolver. Smells of whiskey.", sellValue: 20, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_rooster_whiskey', name: "Bottle of Whiskey", type: 'Provision', effect: { type: 'heal', amount: 6 }, description: "Liquid courage for medicinal purposes. Heal 6 HP and draw 1 card.", sellValue: 5, isCheat: true, illustrationId: 'provision_laudanum_t1', immediateEffect: { type: 'draw', amount: 1 } },
      ],
      catchphrases: {
        playerAttack: ["'Fill your hand, you son of a bitch!'", "'I can do nothin' for you, son.'", "'I call that bold talk for a one-eyed fat man!'"],
        threatDefeated: ["He takes a pull from his flask. 'I'm a Rooster, not a chicken!'", "'Baby sister, I was born game and I intend to go out that way.'", "'You can't serve papers on a rat, baby sister.'"],
        playerDamage: ["Takes a hit. 'I'm a-comin', Ned!'", "'They told me you had grit.'", "'This is the real thing!'"],
        laudanumAbuse: ["He chases the laudanum with a swig of whiskey. 'That's got a bite!'", "'By God! That's a brave sight! The far shore!'"],
        goldFound: ["Finds {goldAmount} gold. 'Time is short, and I've got a job to do.'", "'That's a tall drink of water.'"]
      }
    },
  },
  {
    name: "roland deschain",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 19,
      increaseDifficulty: 1,
       addCustomCards: [
        { id: 'item_six_shooter_roland1', name: "Sandalwood Revolver", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "One of a pair, forged from the steel of Excalibur. It has seen other worlds.", sellValue: 50, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'item_six_shooter_roland2', name: "Sandalwood Revolver", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "The other of a pair. The wood grips are worn smooth from use.", sellValue: 50, isCheat: true, illustrationId: 'item_six_shooter_t1' },
      ],
      catchphrases: {
        playerAttack: ["'I do not aim with my hand; he who aims with his hand has forgotten the face of his father. I aim with my eye.'", "'I do not shoot with my hand; I shoot with my mind.'", "'I do not kill with my gun; I kill with my heart.'"],
        threatDefeated: ["The {enemyName} has forgotten the face of their father.", "'Go then, there are other worlds than these.'", "'First comes smiles, then lies. Last is gunfire.'", "'The man in black fled across the desert, and the gunslinger followed.'"],
        laudanumAbuse: ["He takes the 'demon's medicine'. 'Ka is a wheel.'", "The bitter taste reminds him of Tull, of loss."],
        playerDamage: ["He takes the hit. 'The world has moved on.'", "'There will be water if God wills it.'", "'Long days and pleasant nights.'"],
        playerHeal: ["'Ka-tet. One from many.'", "'I have been a gunslinger, a paladin, a lonely man of the blood.'"]
      }
    },
  },
  {
    name: "the man in black",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 666,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'item_six_iron_mib', name: "LeMat Revolver", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A custom revolver for a man who gets what he wants.", sellValue: 30, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_mib_maze', name: "The Maze", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "This game is meant for you. Draw 2 cards.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_treasure_map' }
      ],
      catchphrases: {
        playerAttack: ["'This world is a story. And I'm here to write my own ending.'", "'The game begins now.'", "'Have you ever questioned the nature of your reality?'", "'Winning doesn't mean anything unless someone else loses.'"],
        threatDefeated: ["'Doesn't look like anything to me.'", "The {enemyName} was just another host on a loop.", "'Some people choose to see the ugliness in this world. The disarray. I choose to see the beauty.'", "'This world is a fiction, one we tell ourselves over and over.' The {enemyName} was just a part of the story."],
        playerDamage: ["He takes the hit, a flicker of a smile on his face. 'I'm not the hero.'", "'The maze wasn't meant for you.'", "'Revenge is just a different prayer at a different altar, and I am answered.'"],
        goldFound: ["'You can't play God without being acquainted with the devil.'", "'The stakes are very high.'"],
        itemBought: ["He buys the {itemName}. 'A little souvenir of my stay.'", "'Everything is code.'"]
      }
    },
  },
  {
    name: "angel eyes",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 150,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_hunting_rifle_angel', name: "Angel Eyes' Rifle", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A rifle for seeing jobs through to the end.", sellValue: 25, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_angel_knife', name: "Bowie Knife", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "For close work.", sellValue: 10, isCheat: true, illustrationId: 'item_sharp_knife_t1' },
      ],
      catchphrases: {
        playerAttack: ["'When I'm paid, I always see the job through.'", "'Even a filthy beggar like that has a price.'", "'You see, in this world there's two kinds of people, my friend: Those with loaded guns and those who dig. You dig.'"],
        threatDefeated: ["The bounty is collected. 'Such ingratitude, after all the times I've saved your life.'", "'I like to get my information from the original source.'", "He collects the bounty. 'A job's a job.'"],
        goldFound: ["Finds {goldAmount} gold. 'It's a small world.'", "'I'm a man of business.' Finds {goldAmount} Gold.", "'Half is better than nothing.'"],
        playerDamage: ["'You're a soldier. You know what I'm talking about.'", "'I bet you've got a lot of friends.'"],
        itemBought: ["'I'll pay you a thousand dollars. I think that's a handsome price.'", "'Another beautiful friendship.'"]
      }
    },
  },
  {
    name: "john ruth",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 100,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_six_shooter_ruth', name: "The Hangman's Revolver", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "This gun has seen its share of bounties brought to justice.", sellValue: 20, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_ruth_warrant', name: "Bounty Warrant", type: 'Item', effect: { type: 'gold', amount: 25 }, description: "A legal document worth a pretty penny when cashed in.", sellValue: 25, isCheat: true, illustrationId: 'generic_bounty_proof' }
      ],
      catchphrases: {
        playerAttack: ["'Got me a bounty worth ten thousand dollars!'", "'No one said this job was supposed to be easy.'", "'When the handbill says 'dead or alive', the rest of us shoot you in the back from up on top of a perch somewhere and bring you in dead over a saddle.'", "'No one said this job is supposed to be easy. It's a job.'"],
        threatDefeated: ["'When you get to hell, John, tell 'em Daisy sent ya.'", "Justice is served. The {enemyName} is no more.", "'Justice delivered... ain't the same as justice served.'", "'You only need to hang mean bastards, but mean bastards you need to hang!'"],
        playerDamage: ["'I'm taking you to hang, and that's the way it's gonna be.'", "'Well, that's the problem with old men. You can't depend on 'em.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A man's gotta make a living.'", "'This country's goin' to the dogs.'"],
        itemBought: ["'This here is a letter from Abraham Lincoln.'", "'A man's gotta have the right tools for the job.'"]
      }
    },
  },
  {
    name: "wyatt earp",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 100,
      addMaxHealth: 3,
      addCustomCards: [
        { id: 'item_six_iron_earp', name: "Buntline Special", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A long-barreled revolver for a long-tailed lawman.", sellValue: 30, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_earp_badge', name: "U.S. Marshal Badge", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 1, persistent: true }, description: "This badge ain't just for show.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_lucky_bullet' }
      ],
      catchphrases: {
        playerAttack: ["'You tell 'em I'm comin'! And hell's comin' with me!'", "'You called down the thunder, well now you've got it!'", "'Skin that smoke-wagon and see what happens.'", "'Are you gonna do somethin' or just stand there and bleed?'"],
        threatDefeated: ["'The law is coming. You tell 'em I'm coming!'", "'You're a daisy if you do!'", "'It's not revenge he's after. It's a reckoning.'"],
        playerDamage: ["'I'm not gonna let you kill me, Wyatt.'", "'What's it like to be a lawman?'"],
        goldFound: ["Finds {goldAmount} Gold. 'For a man who's got everything, you're a pretty poor specimen.'"],
        itemBought: ["Buys the {itemName}. 'I'm a peaceable man. But I won't be pushed.'"]
      }
    },
  },
  {
    name: "annie oakley",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 200,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'item_rifle_oakley', name: "Sharpshooter's Rifle", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "A light, accurate rifle. It never misses.", sellValue: 30, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'custom_oakley_medal', name: "Exhibition Medal", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'firearm_boost', amount: 2, persistent: true }, description: "A medal for marksmanship. It brings a steady hand.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_lucky_bullet' },
      ],
      catchphrases: {
        playerAttack: ["'Aim at a high mark and you will hit it.'", "A perfect shot.", "'Anything you can do, I can do better.'", "'I'm not just a showgirl.'"],
        threatDefeated: ["'I ain't afraid to love a man. I ain't afraid to shoot him either.'", "'My rifle is my best friend.'", "'I was a sure shot.'", "'I can hit a running quail.'"],
        playerDamage: ["'I've been in more exhibitions than you've had hot dinners.'", "'The show must go on.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A little something for my trouble.'", "'The wages of a performer.'"],
        itemBought: ["'A new prop for the show.'", "'This will add a little something to my act.'"]
      }
    },
  },
  {
    name: "ash williams",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 12,
      addMaxHealth: 3,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'item_sawed_off_ash', name: "Boomstick", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A twelve-gauge, double-barreled Remington. S-Mart's top of the line.", sellValue: 20, isCheat: true, illustrationId: 'item_sawed_off_t1_sh' },
        { id: 'item_sharp_knife_ash', name: "Chainsaw Hand", type: 'Item', effect: { type: 'weapon', attack: 9, subtype: 'sword' }, description: "Groovy.", sellValue: 20, isCheat: true, illustrationId: 'item_sharp_knife_t2_sh' },
      ],
      catchphrases: {
        playerAttack: ["'Groovy.'", "'Hail to the king, baby.'", "'This... is my BOOMSTICK!'"],
        threatDefeated: ["'Gimme some sugar, baby.'", "The {enemyName} is defeated. 'Good. Bad. I'm the guy with the gun.'", "'Come get some.'", "'Who's laughin' now?'"],
        playerDamage: ["'Swallow this!' He takes {damageAmount} damage.", "'Look, maybe I didn't say every single little tiny syllable, no. But basically I said them, yeah.'", "'Workshed.' Takes {damageAmount} damage."],
        itemBought: ["He buys the {itemName}. 'Shop smart. Shop S-Mart.'", "'Yeah... that's right. Who's laughin' now?'"],
        playerHeal: ["Heals for {healAmount}. 'First you wanna kill me, now you wanna kiss me.'"]
      }
    },
  },
  {
    name: "fred durst",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 99,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_durst_cap', name: "Red Yankee Cap", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 3, persistent: true }, description: "A backwards baseball cap. For when you just wanna break stuff.", sellValue: 7, isCheat: true, illustrationId: 'upgrade_stetson_hat' },
        { id: 'custom_durst_water', name: "Hot Dog Flavored Water", type: 'Provision', effect: { type: 'heal', amount: 4 }, description: "It's all about the he-said she-said. Heals 4 HP and lets you draw a card.", sellValue: 1, isCheat: true, illustrationId: 'provision_laudanum_t1', immediateEffect: { type: 'draw', amount: 1 } }
      ],
      catchphrases: {
        playerAttack: ["'I'll skin your ass raw!' He attacks with the {itemName}!", "'Give me somethin' to break!'", "'It's all about the he-said, she-said bullshit!'", "He attacks. 'Keep rollin', rollin', rollin', rollin' (WHAT?)'"],
        threatDefeated: ["The {enemyName} is gone. 'Now I know y'all be lovin' this shit right here.'", "'You can take that cookie... and stick it up your, YEAH!'", "The {enemyName} has been dealt with. 'My way or the highway.'", "Another one bites the dust. 'And the winner is... LIMP BIZKIT!'"],
        playerDamage: ["Takes {damageAmount} damage. 'It's just one of those days...'", "He takes a hit. 'Everything is fucked up and everybody sucks.'", "Hit for {damageAmount}. 'I think you better quit lettin' shit slip out your mouth!'"],
        goldFound: ["'I did it all for the nookie.' He pockets {goldAmount} Gold.", "'Lookin' for the cash flow.' Finds {goldAmount} Gold.", "Another {goldAmount} Gold. 'I'm a rockstar.'"],
        itemBought: ["Buys the {itemName}. 'Another platinum record on the wall.'", "'This is my generation.'"],
        laudanumAbuse: ["He downs the bottle. 'Feelin' like a freight train...'", "'I pack a chainsaw... I'll skin your ass raw!'", "'I'm a psycho... a port-a-potty.' He takes a drink."]
      }
    },
  },
  {
    name: "robocop",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 50,
      addMaxHealth: 10,
      addCustomCards: [
        { id: 'item_rifle_robocop', name: "Auto-9", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A machine pistol with a three-round burst. Highly effective.", sellValue: 40, isCheat: true, illustrationId: 'item_rifle_t1_cp' },
        { id: 'custom_robocop_armor', name: "OCP Armor", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 2, persistent: true, max_health: 5 }, description: "Titanium armor with Kevlar laminate. Increases Max Health by 5 and reduces incoming damage by 2.", sellValue: 30, isCheat: true, illustrationId: 'upgrade_iron_will_cp' },
      ],
      catchphrases: {
        playerAttack: ["'Your move, creep.'", "'Dead or alive, you're coming with me.'", "'Come quietly or there will be... trouble.'"],
        threatDefeated: ["'Thank you for your cooperation.'", "'Stay out of trouble.'"],
        playerDamage: ["The shot sparks off his armor. 'Your programming is inferior.'", "'My programming is a little sensitive.'", "'Directive 4 classified.'"],
        itemBought: ["'I'd buy that for a dollar!'", "'This unit is now equipped with the {itemName}.'"],
        goldFound: ["Finds {goldAmount} Gold. 'Seized as evidence.'"]
      }
    },
  },
  // --- EXPLORER ---
  {
    name: "tuco ramirez",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 50,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_tuco_noose', name: "Tuco's Noose", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "A rope that's seen better days, and worse necks.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_bandolier_t1' },
        { id: 'custom_tuco_supplies', name: "Stolen Supplies", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "Liberated from a less-deserving owner.", sellValue: 1, isCheat: true, illustrationId: 'provision_hardtack' }
      ],
      catchphrases: {
        playerAttack: ["'When you have to shoot, shoot. Don't talk.'", "'I'll kill you for that!'", "'There are two kinds of spurs, my friend. Those that come in by the door, and those that come in by the window.'"],
        threatDefeated: ["The Ugly one wins. 'The world is divided into two parts, my friend...'", "'Blondieee! You know what you are?! Just a dirty son-of-a-b-!'", "'The Good, the Bad, and me.' The Ugly one wins."],
        playerDamage: ["'You pig! You're the son of a thousand fathers!'", "'Hey, Blondie! You want to know my name?'", "He takes a hit. 'You are the son of a thousand fathers!'"],
        goldFound: ["'If you're going to shoot, shoot! Don't talk!' He grabs the {goldAmount} Gold.", "'I'm looking for the gold, Blondie! The gold!'"]
      }
    },
  },
  {
    name: "davy crockett",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 50,
      addMaxHealth: 3,
      addCustomCards: [
        { id: 'custom_crockett_rifle', name: "Old Betsy", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A trusty rifle that's seen the far side of the frontier.", sellValue: 25, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'custom_crockett_cap', name: "Coonskin Cap", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_negation', max_health: 4, persistent: true }, description: "King of the Wild Frontier.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_raccoon_skin_hat' },
      ],
      catchphrases: {
        playerAttack: ["'Be sure you're right, then go ahead.'", "'I'm half-horse, half-alligator and a little attached with a snapping turtle.'", "'I can whip my weight in wildcats.'"],
        threatDefeated: ["He grins. 'Killed him a bear when he was only three.'", "'I know I am going to hell, so I will make the most of my time on earth.'", "'We're not just fighting for ourselves, but for all our kin.'"],
        playerDamage: ["'Heaven is a great deal bigger than the earth.'", "'Let your tongue speak what your heart thinks.'"],
        goldFound: ["Finds {goldAmount} Gold. 'I've got a whole country to see.'", "'This will help me on my way.'"],
        itemTaken: ["'This will be useful on the trail.'", "'The land provides.'", "'A fine specimen.'"]
      }
    },
  },
  {
    name: "meriwether lewis",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 100,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_lewis_journal', name: "Lewis's Journal", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 3, persistent: true }, description: "A detailed account of the flora and fauna of the West.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' },
        { id: 'custom_lewis_scout', name: "Corps of Discovery", type: 'Action', effect: { type: 'scout' }, description: "Charting the unknown territory ahead reveals new opportunities. Scout and draw 1 card.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead', immediateEffect: { type: 'draw', amount: 1 } }
      ],
      catchphrases: {
        playerAttack: ["'We proceed on.'", "'The object of my curiosity is to acquire a knowledge of the different languages.'"],
        threatDefeated: ["'The country is, as it were, motionless and silent.'", "'I am about to embark on an enterprise of some moment.'"],
        itemTaken: ["'A specimen for the collection.'", "'This will be documented in the journal.'", "'Most extraordinary!'"],
        playerDamage: ["'This is an arduous journey.'", "'We must be vigilant.'"],
        playerHeal: ["'The men are in good spirits.'", "'A moment's rest before we proceed on.'"]
      }
    },
  },
  {
    name: "william clark",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 100,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_clark_map', name: "Clark's Map", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 5, persistent: true }, description: "A masterfully drawn map of the new frontier.", sellValue: 15, isCheat: true, illustrationId: 'upgrade_treasure_map' },
        { id: 'item_six_shooter_clark', name: "Clark's Revolver", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A reliable sidearm for a cartographer in a dangerous land.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' }
      ],
      catchphrases: {
        playerAttack: ["'A necessary action for the expedition.'", "'The map will be accurate, I assure you.'"],
        threatDefeated: ["'Another landmark noted.'", "'This will be an important entry on the map.'"],
        playerHeal: ["'The men are in good spirits.'", "'A moment's rest before we proceed on.'"],
        playerDamage: ["'The terrain is difficult, but we will persevere.'", "'A small setback.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A resource for the expedition.'"]
      }
    },
  },
  {
    name: "miyamoto musashi",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 20,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'custom_musashi_katana_1', name: "Musashi's Katana", type: 'Item', effect: { type: 'weapon', attack: 9, subtype: 'sword' }, description: "One of a pair. The Way of the warrior is the resolute acceptance of death.", sellValue: 20, isCheat: true, illustrationId: 'item_katana_t1_fj' },
        { id: 'custom_musashi_katana_2', name: "Musashi's Wakizashi", type: 'Item', effect: { type: 'weapon', attack: 7, subtype: 'sword' }, description: "The companion blade. To know the Way is to see it in all things.", sellValue: 15, isCheat: true, illustrationId: 'item_wakizashi_t1_fj' },
      ],
      catchphrases: {
        playerAttack: ["'There is nothing outside of yourself.' He strikes with two blades.", "The Way of the warrior is the resolute acceptance of death.", "'In battle, if you make your opponent flinch, you have already won.'"],
        threatDefeated: ["'Do nothing that is of no use.' The {enemyName} was of no use.", "'Perceive that which cannot be seen with the eye.'", "'The only reason a warrior is alive is to fight, and the only reason a warrior fights is to win.'", "'You can only fight the way you practice.'"],
        playerDamage: ["He takes the blow. 'To know ten thousand things, know one well.'", "'Today I am victorious over myself of yesterday.'"],
        playerHeal: ["He binds his wounds. 'The path is long.'"],
        itemBought: ["'The sword has no master but the soul.'"]
      }
    },
  },
  {
    name: "jin sakai",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 50,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'custom_sakai_katana', name: "Sakai Clan Katana", type: 'Item', effect: { type: 'weapon', attack: 10, subtype: 'sword' }, description: "The storm is coming.", sellValue: 30, isCheat: true, illustrationId: 'item_katana_t1_fj' },
        { id: 'custom_sakai_tanto', name: "Ghost's Tanto", type: 'Item', effect: { type: 'weapon', attack: 6, subtype: 'sword' }, description: "For when honor is not enough.", sellValue: 15, isCheat: true, illustrationId: 'item_knife_t1_fj' },
      ],
      catchphrases: {
        playerAttack: ["'I am the Ghost.'", "'You have no honor.'", "'For the people of Tsushima!'", "'I will not be a slave to my past.'"],
        threatDefeated: ["'Honor died on the beach.' The {enemyName} is defeated.", "He cleans his blade. 'The Ghost will haunt you.'"],
        playerHeal: ["He takes a moment to reflect. 'A new haiku...'", "'I must find my uncle.'", "'The wind guides me.'"],
        playerDamage: ["'I am not your son. I am the Ghost.'", "'I have been a samurai my entire life.'"],
        itemTaken: ["'This will aid my cause.'", "'The people of Tsushima thank you.'"]
      }
    },
  },
  {
    name: "allan quatermain",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 150,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_elephant_gun_quatermain', name: "Quatermain's Elephant Gun", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "A heavy rifle for the biggest of game.", sellValue: 40, isCheat: true, illustrationId: 'item_elephant_gun_t1_as' },
        { id: 'custom_quatermain_map', name: "Map to King Solomon's Mines", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 15, persistent: true }, description: "A map to legendary riches.", sellValue: 50, isCheat: true, illustrationId: 'upgrade_treasure_map_as' }
      ],
      catchphrases: {
        playerAttack: ["He levels his elephant gun. 'Steady now.'", "'The league of extraordinary gentlemen send their regards.'"],
        threatDefeated: ["The hunt is over. 'Time for a smoke.'", "He consults his map. 'The diamond mines of King Solomon await!'", "'There is no hunting like the hunting of man.'", "'I've seen things that would make a hyena vomit.' "],
        goldFound: ["'For a map, this is proving quite profitable.' Finds {goldAmount} Gold."],
        laudanumAbuse: ["'A gentleman's vice.' He takes a dose to steady his nerves, though they are already quite steady."],
        playerDamage: ["'The jungle has its price.'", "'Just a scratch. The trick is not to bleed.'"]
      }
    },
  },
  {
    name: "indiana jones",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 350,
      addMaxHealth: 1,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'item_webley_revolver_indy', name: "Indy's Revolver", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "Good for arguments where swords are involved.", sellValue: 20, isCheat: true, illustrationId: 'item_webley_revolver_t1_as'},
        { id: 'custom_indy_whip', name: "Bullwhip", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "Not just for swinging across chasms.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_bandolier_t1'}
      ],
      catchphrases: {
        playerAttack: ["He cracks his whip!", "A quick shot from the revolver. 'Trust me.'", "'X never, ever marks the spot!'"],
        threatDefeated: ["The {enemyName} is defeated. 'It's not the years, honey, it's the mileage.'", "'That belongs in a museum!'", "He dusts off his hat. 'I'm making this up as I go!'"],
        goldFound: ["He pockets the {goldAmount} Gold. 'Fortune and glory, kid. Fortune and glory.'"],
        itemTaken: ["'This should have been in a museum!' He takes the {itemName}.", "'It's a fake. You can tell by the cross-section.'"],
        playerDamage: ["'Snakes. Why'd it have to be snakes?' He takes {damageAmount} damage.", "Takes a punch. 'I hate snakes!'", "'They're trying to kill us!'"],
        laudanumAbuse: ["'This is for the mileage, not the years.'"]
      }
    },
  },
  {
    name: "lara croft",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 500,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_six_shooter_lara1', name: "Dual Pistols", type: 'Item', effect: {type: 'weapon', attack: 9}, description: "A pair of iconic pistols. For when you mean business.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'item_six_shooter_lara2', name: "Dual Pistols", type: 'Item', effect: {type: 'weapon', attack: 9}, description: "A pair of iconic pistols. For when you mean business.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' }
      ],
      catchphrases: {
        playerAttack: ["With a flip and a flourish, she opens fire.", "'I make my own luck.'", "'From this moment, every breath you take is a gift from me.'", "'I've simplified your payroll.' "],
        threatDefeated: ["'The extraordinary is in what we do, not who we are.'", "'A famous explorer once said, that the extraordinary is in what we do, not who we are.'", "'Everything lost is meant to be found.'", "'A survivor is born.'"],
        itemTaken: ["'This belongs in a museum.' She takes the {itemName}.", "'I'm not a thief. I'm a tomb raider.'"],
        playerDamage: ["'Right. Let's get on with it then.'", "'It's not a party until something gets broken.'", "'The path to redemption is never easy.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A lady should be prepared for anything.'"]
      }
    },
  },
  {
    name: "nathan drake",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 100,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'item_six_shooter_drake', name: "Nate's Pistol", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A well-used sidearm that's seen better days, but never fails.", sellValue: 10, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_drake_grapple', name: "Grappling Hook", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "For reaching high places, or getting out of trouble. Draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead' }
      ],
      catchphrases: {
        playerAttack: ["'Here goes nothing!' He opens fire.", "'Sic Parvis Magna.'", "'Look out! Grenade!' (There is no grenade)"],
        threatDefeated: ["He wipes sweat from his brow. 'Well, that could've gone better.'", "'Another day, another historical artifact trying to kill me.'", "'Don't you have a priceless artifact to steal?'", "'Greatness from small beginnings.'"],
        playerDamage: ["'Oh, crap.' Takes {damageAmount} damage.", "'No, no, no!' Takes a hit."],
        goldFound: ["'Kitty got wet.' Finds {goldAmount} Gold."],
        laudanumAbuse: ["'Hair of the dog.' He downs the bottle.", "'Just a little something to take the edge off... all the edges.'"]
      }
    },
  },
  {
    name: "rick o'connell",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 100,
      addMaxHealth: 4,
      addCustomCards: [
        { id: 'item_webley_revolver_rick1', name: "Rick's Pistol", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "One of a pair. Good for shooting mummies.", sellValue: 20, isCheat: true, illustrationId: 'item_webley_revolver_t1_as' },
        { id: 'item_webley_revolver_rick2', name: "Rick's Other Pistol", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "The other of a pair. Has more sand in it.", sellValue: 20, isCheat: true, illustrationId: 'item_webley_revolver_t2_as' },
      ],
      catchphrases: {
        playerAttack: ["'Looks to me like I've got all the horses!'", "'Here I come, you filthy dogs!'", "'Rescue the damsel in distress, kill the bad guy, and save the world.'"],
        threatDefeated: ["'Patience is a virtue.' The {enemyName} is finally gone.", "'Goodbye, Beni.'", "'This is not good.'", "'Think I'll get me a cup of coffee.'"],
        playerDamage: ["'This is bad, Evy! This is really bad!' Takes {damageAmount} damage.", "'I'm a little rusty.'", "'My library card's been revoked!'"],
        itemBought: ["He buys the {itemName}. 'I am a librarian!'"],
        goldFound: ["'I've found something!' Finds {goldAmount} Gold."]
      }
    },
  },
  {
    name: "adam jensen",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 1000,
      addMaxHealth: 5,
      addCustomCards: [
        { id: 'custom_jensen_typhoon', name: "Typhoon System", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "Explosive ordnance for crowd control. Draws 2 cards.", sellValue: 20, isCheat: true, illustrationId: 'provision_stamina_tonic_t1_cp' },
        { id: 'item_sharp_knife_jensen', name: "Arm Blades", type: 'Item', effect: { type: 'weapon', attack: 9, subtype: 'sword' }, description: "Retractable nanoceramic blades. Lethal and silent.", sellValue: 25, isCheat: true, illustrationId: 'item_sharp_knife_t1_cp' },
      ],
      catchphrases: {
        playerAttack: ["'This is how it has to be.'", "He deploys his augments.", "'If you want to make enemies, try to change something.'", "'The past can be a prison.'"],
        threatDefeated: ["'The world is a dangerous place.'", "'I never asked for this.'", "'Some say it's the end of the world. Some say it's the beginning.'", "'Survival is a matter of adaptation.'"],
        playerDamage: ["His dermal armor takes the hit. 'I didn't ask for this.'", "'They're just men. Flesh and blood. And I'm going to make them bleed.'", "'The human body is a machine.'"],
        playerHeal: ["'Nanites repairing trauma.'", "'System integrity returning.'"],
        itemBought: ["He buys the {itemName}. 'This will be a useful upgrade.'"]
      }
    },
  },
  // --- DOCTOR ---
  {
    name: "doc holliday",
    requiredCharacterId: 'doctor',
    effects: {
      addGold: 200,
      addMaxHealth: -5,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'item_six_shooter_holliday', name: "Doc's Nickel-Plated Revolver", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "A gentleman's weapon for a deadly game.", sellValue: 25, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_holliday_satchel', name: "Gambler's Satchel", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "Take another card and heal 1 HP. You're in your prime.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_leather_satchel_t1', immediateEffect: { type: 'heal', amount: 1 } },
      ],
      catchphrases: { 
        playerAttack: ["'I'm your huckleberry.'", "'Say when.'"], 
        threatDefeated: ["'You're no daisy. You're no daisy at all.'", "He sighs. 'My hypocrisy goes only so far.'"],
        playerDamage: ["He coughs. 'Forgive me if I don't shake hands.'", "Takes a hit. 'I have not yet begun to defile myself.'"],
        laudanumAbuse: ["'It appears my hypocrisy knows no bounds.'", "He drinks. 'Why, Johnny Ringo, you look like somebody just walked over your grave.'"],
        playerHeal: ["'It's not my fault if I'm a lunger.' He heals {healAmount} HP."]
      }
    },
  },
  {
    name: "dr quinn",
    requiredCharacterId: 'doctor',
    effects: {
      addGold: 50,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_quinn_kit', name: "Doctor's Kit", type: 'Provision', effect: { type: 'heal', amount: 8, cures: true }, description: "A proper medical kit for a proper doctor.", sellValue: 15, isCheat: true, illustrationId: 'provision_miracle_cure_t1' },
        { id: 'custom_quinn_journal', name: "Medical Journal", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 2, persistent: true }, description: "Knowledge is the best medicine.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' }
      ],
      catchphrases: {
        playerHeal: ["'The body has a remarkable ability to heal itself, if given a chance.'", "'A doctor's work is never done.'", "'This is a simple poultice of herbs.'"],
        threatDefeated: ["'Sometimes, a woman's touch is a firm hand.'", "'I believe in medicine, not violence, but I also believe in survival.'", "'Sometimes you have to be firm.'"],
        playerAttack: ["'This is for your own good!'", "'I am a doctor, but I am also a survivor!'"],
        playerDamage: ["'This is highly unprofessional!'", "'Sully! Get the children!'"],
        itemBought: ["'This will be very useful for my practice.'", "'A new tool to help the sick.'"]
      }
    },
  },
  {
    name: "florence nightingale",
    requiredCharacterId: 'doctor',
    effects: {
      addGold: 100,
      addMaxHealth: 3,
      addCustomCards: [
        { id: 'custom_nightingale_kit', name: "Nurse's Kit", type: 'Provision', effect: { type: 'heal', amount: 10, cures: true }, description: "A kit filled with clean bandages and radical ideas about hygiene.", sellValue: 20, isCheat: true, illustrationId: 'provision_miracle_cure_t1' },
        { id: 'custom_nightingale_journal', name: "Notes on Nursing", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 3, persistent: true }, description: "Knowledge is the best medicine.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' },
      ],
      catchphrases: {
        playerHeal: ["'The very first requirement in a hospital is that it should do the sick no harm.'", "'The first rule of nursing is to keep the air within as pure as the air without.'", "'Let us never consider ourselves finished nurses... we must be learning all of our lives.'"],
        playerDamage: ["'I attribute my success to this: I never gave or took any excuse.'", "'How very little can be done under the spirit of fear.'", "'Live life when you have it. Life is a splendid gift.'"],
        threatDefeated: ["'The world is put back by the death of every one who has to sacrifice the development of his or her peculiar gifts to conventionality.'", "'A necessary, if unpleasant, procedure.'"],
        itemBought: ["'This will improve sanitation.'", "'A new tool for the ward.'"]
      }
    },
  },
  {
    name: "dr livesey",
    requiredCharacterId: 'doctor',
    effects: {
      addGold: 150,
      addMaxHealth: 3,
      addCustomCards: [
        { id: 'item_six_shooter_livesey', name: "Doctor's Pistol", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A steady hand is good for more than just surgery.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_livesey_rum', name: "A Grog of Rum", type: 'Provision', effect: { type: 'heal', amount: 6 }, description: "A surprisingly effective restorative.", sellValue: 5, isCheat: true, illustrationId: 'provision_laudanum_t1' },
      ],
      catchphrases: {
        threatDefeated: ["'If you keep on drinking rum, the world will soon be quit of a very dirty scoundrel!'", "'Fifteen men on a dead man's chest... Yo-ho-ho and a bottle of rum!'", "'If you were sent by Long John, I'll have you know I'm a magistrate.'"],
        laudanumAbuse: ["He downs the bottle. 'The name of rum is 'grief'!'", "'The word 'rum' and the word 'death' mean the same thing to you.'", "'That's a jim-dandy of a tale, to be sure.'"],
        playerAttack: ["'I'll have the leg off you in a jiffy.'", "'Silence, sir! I am a magistrate.'"],
        playerHeal: ["'A little something to mend the constitution.'", "'The sea air is good for what ails you.'"],
        itemBought: ["'This will be useful for the voyage.'", "'A wise investment for a long journey.'"]
      }
    },
  },
  {
    name: "kenshin himura",
    requiredCharacterId: 'doctor',
    effects: {
      addGold: 10,
      increaseDifficulty: 2,
      addCustomCards: [
        { id: 'custom_kenshin_sakabato', name: "Sakabatō", type: 'Item', effect: { type: 'weapon', attack: 9, subtype: 'sword' }, description: "A reverse-blade sword. A weapon that cannot kill, in the hands of one who has killed too many.", sellValue: 20, isCheat: true, illustrationId: 'item_katana_t2_fj' },
        { id: 'custom_kenshin_vow', name: "Vow of Non-Killing", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 2, persistent: true }, description: "A vow to never take another life strengthens the spirit against all harm.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_iron_will_fj' }
      ],
      catchphrases: {
        playerAttack: ["'Oro?' He strikes with the back of his blade.", "A Hiten Mitsurugi-ryū technique!", "'A sword is a tool to protect. A tool to save lives.'", "'I will not kill, but I will not let you kill either.'"],
        threatDefeated: ["'A sword is a weapon. The art of swordsmanship is learning how to kill. That is the truth.' The {enemyName} is defeated, but not slain."],
        playerDamage: ["'This is my atonement.'", "'The scar on my cheek is a reminder.'"],
        playerHeal: ["'I must become stronger to protect those I care for.'", "'This one is not strong enough.'"]
      }
    },
  },
  // --- HUNTER ---
  {
    name: "major marquis warren",
    requiredCharacterId: 'hunter',
    effects: {
      addGold: 100,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_six_iron_warren', name: "Warren's Revolver", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A reliable sidearm from a man who's seen it all.", sellValue: 25, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_warren_pipe', name: "Warren's Pipe", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A moment to think can reveal a path forward. Draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal' }
      ],
      catchphrases: {
        playerAttack: ["'The only time black folks are safe, is when white folks are disarmed.'", "'Got room for one more?'"],
        threatDefeated: ["He looks at the fallen {enemyName}. 'This here is a letter from Abraham Lincoln.'"],
        playerDamage: ["He takes the hit, unflinching. 'Starts to get cold on the plains.'", "'Justice ain't blind. It's just too damn scared to look.'"],
        goldFound: ["Finds {goldAmount} Gold. 'This bounty's gettin' bigger.'"],
        itemBought: ["'A man's gotta be prepared.' Buys the {itemName}."]
      }
    },
  },
  {
    name: "daniel boone",
    requiredCharacterId: 'hunter',
    effects: {
      addGold: 30,
      addMaxHealth: 3,
      addCustomCards: [
        { id: 'item_rifle_boone', name: "Old Betsy", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A trusty rifle that's seen the far side of the frontier.", sellValue: 25, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_boone_coat', name: "Deerskin Coat", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 5, persistent: true }, description: "Made for walking quietly through the woods.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_deer_skin_coat_t1' },
      ],
      catchphrases: {
        threatDefeated: ["'Be sure you're right, then go ahead.'", "'May the Lord have mercy on your soul.'", "'I'm going now. My time is come.'"],
        itemTaken: ["'I've never been lost, but I was bewildered once for three days.' He takes the {itemName}.", "'Curiosity is natural to the soul of man.'", "'The land provides.'"],
        playerAttack: ["'I'm half-horse, half-alligator and a little attached with a snapping turtle.'", "'I can whip my weight in wildcats.'"],
        playerDamage: ["'All you need for happiness is a good gun, a good horse, and a good wife.'", "'Let's trace the trail of the bear.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A little something for the journey.'"]
      }
    },
  },
  {
    name: "kit carson",
    requiredCharacterId: 'hunter',
    effects: {
      addGold: 40,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_rifle_carson', name: "Hawken Rifle", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "A rifle that's seen the whole frontier.", sellValue: 20, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'item_sharp_knife_carson', name: "Scout's Knife", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "A reliable blade for a man of the mountains.", sellValue: 10, isCheat: true, illustrationId: 'item_sharp_knife_t1' },
      ],
      catchphrases: {
        threatDefeated: ["He nods grimly. 'The trail is clear.'", "'I've seen the elephant.'", "'The mountains call to me.'", "'A man must live with the choices he makes.'"],
        playerAttack: ["'The bear is a formidable foe.'", "'This is a dangerous business.'"],
        playerDamage: ["'The frontier is a harsh mistress.'", "'A lesson learned.'"],
        itemTaken: ["'A useful find.'", "'The land provides for those who know how to look.'"]
      }
    },
  },
  {
    name: "artemis",
    requiredCharacterId: 'hunter',
    effects: {
      addGold: 0,
      addMaxHealth: 5,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'item_long_bow_artemis', name: "Bow of the Huntress", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A silver bow that never misses its mark.", sellValue: 30, isCheat: true, illustrationId: 'item_long_bow_t1' },
        { id: 'custom_artemis_arrowhead', name: "Moonstone Arrowhead", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'bow_boost', amount: 3, persistent: true }, description: "An arrowhead that glows with a faint lunar light.", sellValue: 15, isCheat: true, illustrationId: 'upgrade_lucky_arrowhead' },
      ],
      catchphrases: {
        playerAttack: ["An arrow loosed under the eye of the moon.", "'Let the hunt commence!'", "'By the light of the full moon!'", "'The huntress does not fail.'"],
        threatDefeated: ["The {enemyName} falls. 'A tribute to the wilds.'", "'The balance is restored.'"],
        playerDamage: ["A mortal strikes a goddess. 'Insolence!'", "'This is but a scratch to an immortal.'"],
        playerHeal: ["'The wilds mend their own.'", "'My strength returns with the rising moon.'"]
      }
    },
  },
  {
    name: "the hunter",
    requiredCharacterId: 'hunter',
    effects: {
      addGold: 0,
      increaseDifficulty: 2,
      addCustomCards: [
        { id: 'item_sharp_knife_bloodborne', name: "Saw Cleaver", type: 'Item', effect: { type: 'weapon', attack: 10, subtype: 'sword' }, description: "A trick weapon from Yharnam. Unfolds for extended reach.", sellValue: 25, isCheat: true, illustrationId: 'item_sharp_knife_t1_sh' },
        { id: 'item_six_shooter_hunter', name: "Hunter's Pistol", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "A firearm used for parrying beasts, not for damage.", sellValue: 10, isCheat: true, illustrationId: 'item_six_shooter_t1_sh' },
      ],
      catchphrases: {
        playerAttack: ["'A hunter must hunt.'", "He strikes with visceral speed."],
        threatDefeated: ["'Farewell, good hunter. May you find your worth in the waking world.'", "PREY SLAUGHTERED"],
        playerDamage: ["'Fear the Old Blood.' He takes {damageAmount} damage.", "'The sweet blood, oh, it sings to me.'"],
        playerHeal: ["He injects a Blood Vial.", "'Just a little blood, to keep me going.'"],
        itemBought: ["He buys the {itemName}. 'A hunter is never alone.'"]
      }
    },
  },
  // --- TRAPPER ---
  {
    name: "jeremiah johnson",
    requiredCharacterId: 'trapper',
    effects: {
      addGold: 20,
      addMaxHealth: 4,
      addCustomCards: [
        { id: 'item_hunting_rifle_jeremiah', name: ".50 Caliber Hawken", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A heavy rifle for a mountain man.", sellValue: 35, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_jeremiah_coat', name: "Mountain Man's Coat", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 5, persistent: true }, description: "Made from... well, you don't ask.", sellValue: 15, isCheat: true, illustrationId: 'upgrade_bearskin_coat' },
      ],
      catchphrases: {
        playerAttack: ["He nods. '...and some say he's still up there.'", "'You've come far, pilgrim.'", "'Watch your topknot.'"],
        threatDefeated: ["'The Rocky Mountains are the marrow of the world.'", "'Would you happen to have a spare pocket watch with a chain?'", "'Elk don't know how many feet a horse has!'"],
        playerDamage: ["He takes the hit. 'It's a hard life.'", "'The mountains test a man.'"],
        itemTaken: ["'This will be useful.'", "'The mountain provides.'"],
        goldFound: ["'I'll trade this for some supplies.'"]
      }
    },
  },
  {
    name: "hugh glass",
    requiredCharacterId: 'trapper',
    effects: {
      addGold: 10,
      addMaxHealth: -10,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'custom_glass_hide', name: "Grizzly Hide", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 10, persistent: true }, description: "A heavy hide that serves as a grim reminder.", sellValue: 20, isCheat: true, illustrationId: 'upgrade_bearskin_coat' },
        { id: 'custom_glass_revenge', name: "Revenant's Fury", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "Fueled by sheer will. Draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_iron_will' },
      ],
      catchphrases: {
        playerAttack: ["'As long as you can still grab a breath, you fight.'", "'Revenge is in God's hands... not mine.' But he attacks anyway.", "'They don't hear your voice! They just see the color of your face.'"],
        threatDefeated: ["'He's afraid. He knows how far I came for him.'"],
        playerDamage: ["He takes the hit, unfazed. 'I ain't afraid to die anymore. I'd done it already.'", "'I'm right here. I'll be right here.'", "He takes a hit, remembering the bear."],
        playerHeal: ["'I must survive.'", "'My son... he watches over me.'"],
        itemTaken: ["'This will help me survive.'", "'The earth provides.'"]
      }
    },
  },
  {
    name: "jim bridger",
    requiredCharacterId: 'trapper',
    effects: {
      addGold: 50,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_bridger_trap1', name: "Bridger's Large Trap", type: 'Item', effect: { type: 'trap', size: 'large', breakDamage: 6 }, description: "A trap for a man who knows what's out there.", sellValue: 10, isCheat: true, illustrationId: 'item_large_trap_t1' },
        { id: 'custom_bridger_trap2', name: "Bridger's Medium Trap", type: 'Item', effect: { type: 'trap', size: 'medium', breakDamage: 4 }, description: "A versatile trap for the trail.", sellValue: 8, isCheat: true, illustrationId: 'item_medium_trap_t1' },
        { id: 'custom_bridger_scout', name: "Mountain Man's Knowledge", type: 'Action', effect: { type: 'scout' }, description: "He knows these lands like the back of his hand. Scout and draw 1 card.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead', immediateEffect: { type: 'draw', amount: 1 } },
      ],
      catchphrases: {
        threatDefeated: ["He surveys the area. 'This country is not for greenhorns.'", "'This valley is a paradise.'", "'I've seen geysers that spout water a hundred feet high.'", "'The Great Salt Lake is bottomless, I tell you.'"],
        playerAttack: ["'This is how it's done in the mountains.'", "'A simple, effective solution.'"],
        itemTaken: ["'This will be useful.'", "'The land provides.'"],
        playerDamage: ["'A scrape. Nothing more.'", "'The mountains test your resolve.'"]
      }
    },
  },
  // --- PREACHER ---
  {
    name: "the preacher",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 50,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_six_iron_preacher', name: "Pale Rider's Revolver", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A gun that deals in judgment.", sellValue: 30, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_preacher_symbol', name: "Holy Symbol", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 1, persistent: true }, description: "A symbol of faith that offers some protection from the evils of this world.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_lucky_bullet' }
      ],
      catchphrases: {
        playerAttack: ["'And I looked, and behold a pale horse: and his name that sat on him was Death, and Hell followed with him.'", "'There's a lot of sinners hereabouts.'", "'Nothing like a nice piece of hickory.'"],
        threatDefeated: ["'There's nothing like a nice piece of hickory.'", "'Go on, get outta here. Don't come back.'", "'It's what's on the inside that counts.'"],
        playerDamage: ["'The Lord works in mysterious ways.'", "'A test of faith.'"],
        playerHeal: ["'The spirit is willing.'", "'My faith is my shield.'"]
      }
    },
  },
  {
    name: "padre",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 25,
      addMaxHealth: 3,
      addCustomCards: [
        { id: 'custom_padre_bible', name: "Padre's Bible", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 3, persistent: true }, description: "Its words offer comfort, its cover offers protection.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_tattered_bible' },
        { id: 'custom_padre_water', name: "Flask of Holy Water", type: 'Provision', effect: { type: 'heal', amount: 5, cures: true }, description: "A blessing against the evils of this world.", sellValue: 10, isCheat: true, illustrationId: 'provision_water_t1' },
      ],
      catchphrases: {
        playerHeal: ["'Let us pray.'", "'Bless you, my child.'", "'The Lord is my shepherd.'", "'Through Him, all things are possible.'"],
        playerAttack: ["'Forgive me, Lord, for what I am about to do.'", "'The power of Christ compels you!'"],
        threatDefeated: ["'Go in peace.'", "'May God have mercy on your soul.'"],
        playerDamage: ["'A trial from the Lord.'", "'My faith will not falter.'"]
      }
    },
  },
  {
    name: "claude frollo",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 150,
      increaseDifficulty: 2,
      addCustomCards: [
        { id: 'custom_frollo_dagger', name: "Dagger of Judgment", type: 'Item', effect: { type: 'weapon', attack: 8, subtype: 'sword' }, description: "A silver dagger, cold to the touch. For delivering righteous judgment to the wicked and unworthy.", sellValue: 13, isCheat: true, illustrationId: 'item_sharp_knife_t1_sh' },
        { id: 'custom_frollo_ring', name: "Ring of the Archdeacon", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 2, persistent: true }, description: "The symbol of his holy office. It protects the body, but offers no comfort to the soul.", sellValue: 66, isCheat: true, illustrationId: 'item_jewelry_sh' }
      ],
      catchphrases: {
        playerAttack: ["'The wicked shall not go unpunished!'", "'I am a righteous man!'", "'And He shall smite the wicked and plunge them into the fiery pit!'", "'Choose me... or the fire!'"],
        threatDefeated: ["'Beata Maria, you know I am a righteous man...'", "The {enemyName} is purged. 'So concludes a tragic story.'", "'Now justice is done.'", "'The world is a wicked place. And it is my sacred duty to cleanse it.'"],
        playerDamage: ["'A test from the Almighty!'", "'This is my cross to bear.'", "'The fires of hell... they burn...'", "'My virtue is my shield!'"],
        goldFound: ["'The Lord provides the means for his work.' He takes the {goldAmount} Gold.", "'This worldly dross will serve a holy purpose.' He collects {goldAmount} Gold.", "'Even in this cesspool of sin, there is opportunity.'"],
        itemBought: ["'A tool for the work of the righteous.' He acquires the {itemName}.", "'This will serve the cause of justice.'"],
        playerHeal: ["'The spirit is willing, and the flesh must be made so.' He tends to his wounds.", "'My strength is not my own, but His.' Heals for {healAmount}."],
        laudanumAbuse: ["He takes the tincture to quiet the tempest in his soul. 'She will be mine or she will burn!'", "'This gypsy witch... this devil... has put a spell on me!'"]
      }
    },
  },
  {
    name: "shepherd book",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 75,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_sawed_off_book', name: "Shepherd's Shotgun", type: 'Item', effect: { type: 'weapon', attack: 8 }, description: "For protecting the flock.", sellValue: 20, isCheat: true, illustrationId: 'item_sawed_off_t1' },
        { id: 'custom_book_medkit', name: "Shepherd's Medkit", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 2, persistent: true }, description: "A shepherd tends to his flock.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' },
      ],
      catchphrases: {
        playerAttack: ["'A shepherd's job is simple: to find a pasture and feed his flock.'", "'Though I walk through the valley of the shadow of death, I will fear no evil.'", "'I'm just a Shepherd.' He opens fire."],
        threatDefeated: ["'The Bible is a little fuzzy on the subject of kneecaps.'", "'I am a Shepherd. My business is not to judge, but to tend my flock.'", "'If you can't do something smart, do something right.'"],
        playerDamage: ["'I've been out of the game for a long time.'", "'That's a trap.'"],
        playerHeal: ["'The flock must be tended.'", "'A moment of peace.'"]
      }
    },
  },
  // --- HERBALIST ---
  {
    name: "sacagawea",
    requiredCharacterId: 'herbalist',
    effects: {
      addGold: 15,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_sacagawea_guide', name: "Native Guide", type: 'Action', effect: { type: 'scout' }, description: "Knowledge of the land is the greatest tool. Scout and draw 1 card.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead', immediateEffect: { type: 'draw', amount: 1 } },
        { id: 'custom_sacagawea_pouch', name: "Gatherer's Pouch", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "A collection of potent herbs.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_herb_pouch' },
      ],
      catchphrases: {
        playerHeal: ["'The earth provides for its children.'", "'This will help.'", "'The spirits of the plants lend their strength.'"],
        itemTaken: ["She examines the {itemName}. 'This will be useful.'", "'The land provides all we need.'", "'A gift from the earth.'"],
        playerAttack: ["'This is a last resort.'", "'The spirits of the earth aid me.'"],
        threatDefeated: ["'The land is at peace again.'", "'Go back to the earth.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A gift from the traders.'"]
      }
    },
  },
  {
    name: "pocahontas",
    requiredCharacterId: 'herbalist',
    effects: {
      addGold: 10,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_pocahontas_blessing', name: "River Spirit's Blessing", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "The spirits of the river offer their aid.", sellValue: 10, isCheat: true, illustrationId: 'provision_water_t1' },
        { id: 'custom_pocahontas_herbs1', name: "Sun-Kissed Berries", type: 'Provision', effect: { type: 'heal', amount: 3, cures_illness: 'Malaria' }, description: "Berries that ward off fever.", sellValue: 5, isCheat: true, illustrationId: 'provision_juniper_t1' },
        { id: 'custom_pocahontas_herbs2', name: "Forest Flowers", type: 'Provision', effect: { type: 'heal', amount: 3, cures_illness: 'Dysentery' }, description: "Flowers that calm a troubled stomach.", sellValue: 5, isCheat: true, illustrationId: 'provision_basil_t1' },
      ],
      catchphrases: {
        playerHeal: ["'Listen with your heart, you will understand.'", "'You can own the Earth and still, all you'll own is Earth until you can paint with all the colors of the wind.'", "'Sometimes the right path is not the easiest one.'"],
        threatDefeated: ["'The forest is at peace again.'", "'The spirits are quiet now.'"],
        playerAttack: ["'This is not the way of peace.'", "'The spirits cry out.'"],
        itemTaken: ["'A gift from the forest.'", "'The earth provides.'"]
      }
    },
  },
  {
    name: "laura ingalls wilder",
    requiredCharacterId: 'herbalist',
    effects: {
      addGold: 5,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_laura_hardtack1', name: "Ma's Hardtack", type: 'Provision', effect: { type: 'heal', amount: 3 }, description: "Simple, tough, and will see you through the winter.", sellValue: 3, isCheat: true, illustrationId: 'provision_hardtack' },
        { id: 'custom_laura_hardtack2', name: "Ma's Hardtack", type: 'Provision', effect: { type: 'heal', amount: 3 }, description: "Simple, tough, and will see you through the winter.", sellValue: 3, isCheat: true, illustrationId: 'provision_hardtack' },
        { id: 'custom_laura_remedies', name: "Prairie Remedies", type: 'Provision', effect: { type: 'heal', amount: 5, cures: true }, description: "Knowledge passed down through generations.", sellValue: 10, isCheat: true, illustrationId: 'provision_miracle_cure_t1' },
      ],
      catchphrases: {
        playerHeal: ["'It is the sweet, simple things of life which are the real ones after all.'", "'Home is the nicest word there is.'", "'A good laugh is sunshine in the house.'", "'There's no great loss without some small gain.'"],
        threatDefeated: ["'The only good Indian is a dead Indian.'", "'We must be brave.'"],
        playerDamage: ["'This is a hard land.'", "'We must endure.'"],
        playerAttack: ["'Pa said we must be ready for anything.'", "'For the family.'"]
      }
    },
  },
  {
    name: "tonto",
    requiredCharacterId: 'herbalist',
    effects: {
      addGold: 20,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_bow_tonto', name: "Tonto's Bow", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "A simple bow for a resourceful man.", sellValue: 10, isCheat: true, illustrationId: 'item_bow_t1' },
        { id: 'item_sharp_knife_tonto', name: "Tonto's Knife", type: 'Item', effect: { type: 'weapon', attack: 4 }, description: "A keen blade for any situation.", sellValue: 8, isCheat: true, illustrationId: 'item_knife_t1' },
        { id: 'custom_tonto_poultice', name: "Herbal Poultice", type: 'Provision', effect: { type: 'heal', amount: 6 }, description: "A mixture of herbs to mend wounds.", sellValue: 5, isCheat: true, illustrationId: 'provision_juniper_t1' },
      ],
      catchphrases: {
        threatDefeated: ["'That him, Kemo Sabe.'", "'Get-um up, Scout!'", "'That right, Kemo Sabe.'", "'Me know.'"],
        playerAttack: ["'Me do.'", "'Go, Scout!'"],
        itemTaken: ["'This good, Kemo Sabe.'", "'Me find.'"],
        playerHeal: ["'This make better.'", "'Good medicine.'"]
      }
    },
  },
  {
    name: "beatrix potter",
    requiredCharacterId: 'herbalist',
    effects: {
      addGold: 100,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_beatrix_journal', name: "Naturalist's Journal", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A detailed sketch can reveal new insights. Draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal' },
        { id: 'custom_beatrix_tea', name: "Peter Rabbit's Chamomile", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "A soothing tea for a naughty rabbit.", sellValue: 5, isCheat: true, illustrationId: 'provision_peppermint_t1' },
      ],
      catchphrases: {
        playerHeal: ["'There is something delicious about writing the first words of a story.'", "'Even the smallest one can change the world.'", "'Thank goodness I was never sent to school; it would have rubbed off some of the originality.'", "'There is something delicious about writing the first words of a story.'"],
        threatDefeated: ["'This is a fierce bad rabbit.'", "'The tale of the {enemyName} is concluded.'"],
        itemTaken: ["'This will make a fine illustration.'", "'A new character for my stories.'"],
        playerAttack: ["'Even a gentle hand must sometimes be firm.'", "'I cannot rest, I must draw, however poor the result.'"]
      }
    },
  },
  // --- PROSPECTOR ---
  {
    name: "mr pocket",
    requiredCharacterId: 'prospector',
    effects: {
      addGold: 25,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_pocket_pan', name: "Mr. Pocket's Gold Pan", type: 'Item', effect: { type: 'gold', amount: 15 }, description: "This pan has seen the color of gold more than most.", sellValue: 5, isCheat: true, illustrationId: 'item_gold_pan' },
        { id: 'custom_pocket_nugget', name: "Pocket Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 30, description: "A fine specimen.", isCheat: true, illustrationId: 'item_gold_nugget' },
      ],
      catchphrases: {
        goldFound: ["'There's gold in that river!'", "'It's a pocket! A pocket full of gold!'", "'I'm rich! I'm rich!'"],
        threatDefeated: ["'You ain't gettin' my poke!'", "'Back off! This is my claim!'", "'No one's gettin' my gold!'"],
        playerAttack: ["'Get off my land!'", "'This is for my claim!'"],
        playerDamage: ["'They're after my gold!'", "'I'll not be driven off!'"],
        itemBought: ["'This will help me find more gold.'", "'An investment in my future.'"]
      }
    },
  },
  {
    name: "calamity jane",
    requiredCharacterId: 'prospector',
    effects: {
      addGold: 30,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'item_six_shooter_jane', name: "Jane's Revolver", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A well-used revolver for a woman of the plains.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_jane_meat1', name: "Dried Meat", type: 'Provision', effect: { type: 'heal', amount: 3 }, description: "Sustenance for the long road.", sellValue: 2, isCheat: true, illustrationId: 'provision_dried_meat' },
        { id: 'custom_jane_meat2', name: "Dried Meat", type: 'Provision', effect: { type: 'heal', amount: 3 }, description: "Sustenance for the long road.", sellValue: 2, isCheat: true, illustrationId: 'provision_dried_meat' },
        { id: 'custom_jane_laudanum', name: "Laudanum", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "For the aches and pains of a hard life.", sellValue: 7, isCheat: true, illustrationId: 'provision_laudanum_t1' },
      ],
      catchphrases: {
        playerAttack: ["'I'm a woman of the plains, and I fear no man.'", "'If you've got troubles, I've got a gun.'", "'This calls for a drink.'"],
        threatDefeated: ["'Leave me alone and let me go to hell by my own route.'", "'I figure if a girl wants to be a legend, she should go ahead and be one.'", "'I was a wild one, and I could lick any man in the country.'"],
        playerDamage: ["'It's a hard life, but it's my life.'", "'I've had worse.'"],
        laudanumAbuse: ["'A little something to take the edge off.'", "'It's for medicinal purposes.'"],
        goldFound: ["Finds {goldAmount} Gold. 'Well, I'll be.'"]
      }
    },
  },
  {
    name: "walter huston",
    requiredCharacterId: 'prospector',
    effects: {
      addGold: 100,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_huston_pan', name: "Prospector's Pan", type: 'Item', effect: { type: 'gold', amount: 12 }, description: "A pan that's seen many a hopeful sunrise.", sellValue: 10, isCheat: true, illustrationId: 'item_gold_pan' },
        { id: 'custom_huston_pickaxe', name: "Pickaxe", type: 'Item', effect: { type: 'weapon', attack: 4 }, description: "For breaking rocks, or heads.", sellValue: 5, isCheat: true, illustrationId: 'item_sharp_knife_t1' }
      ],
      catchphrases: {
        goldFound: ["'Hey you fellas, have you got a few pennies for a fellow American down on his luck?'", "'Gold is a devilish sort of thing. It makes you crazy.'"],
        threatDefeated: ["He dances a jig. 'The gold of the Sierra Madre!'", "'Badges? We ain't got no badges. We don't need no badges! I don't have to show you any stinking badges!'", "'Laugh? That's a good one.'"],
        playerAttack: ["'I know what gold does to men's souls.'", "'This is my claim!'"],
        playerDamage: ["'This ain't no time for jokes.'", "'It's a long way to the top of the mountain.'"],
        itemBought: ["'A man's gotta have the right tools.'"]
      }
    },
  },
  {
    name: "stinky pete",
    requiredCharacterId: 'prospector',
    effects: {
      addGold: 50,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_pete_nugget1', name: "Large Gold Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 35, description: "It's a motherlode!", isCheat: true, illustrationId: 'item_gold_nugget_t2' },
        { id: 'custom_pete_nugget2', name: "Large Gold Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 35, description: "It's a motherlode!", isCheat: true, illustrationId: 'item_gold_nugget_t2' },
      ],
      catchphrases: {
        goldFound: ["'It's a gold rush!'", "'Yee-haw!'", "'I'm a prospector! I'm a connoisseur of dirt!'"],
        itemTaken: ["'That's not for you!'", "'This is my chance!'", "'I've been waiting for this for years!'"],
        playerAttack: ["'You can't rush art.'", "'Get away from me!'"],
        threatDefeated: ["'This is my moment!'", "'I'm free!'"],
        playerDamage: ["'My box! He's stealing my box!'", "'The museum... I'm going to the museum!'"]
      }
    },
  },
  {
    name: "hosea matthews",
    requiredCharacterId: 'prospector',
    effects: {
      addGold: 150,
      addMaxHealth: -2,
      addCustomCards: [
        { id: 'custom_hosea_map', name: "Hosea's Map", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 10, persistent: true }, description: "A map to a forgotten score. Or is it?", sellValue: 50, isCheat: true, illustrationId: 'upgrade_treasure_map' },
        { id: 'custom_hosea_book', name: "Book of Stories", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A well-told story can reveal new opportunities. Draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal' }
      ],
      catchphrases: {
        threatDefeated: ["'I wish I had acquired wisdom at less of a price.'", "'There's always a buyer for a good story.'", "'I know you. You're a good man.'", "'The trick is to be a survivor.'"],
        itemTaken: ["'There's always a buyer for a good story.'", "'There's always a market for a bit of... creativity.'", "'It's all part of the act.'"],
        playerAttack: ["'This is not the way.'", "'A necessary evil.'"],
        playerHeal: ["'I'm an old man.'", "'A moment to catch my breath.'"],
        goldFound: ["'A fine addition to the camp funds.'", "'This will help us on our way.'"]
      }
    },
  },
  {
    name: "gold rush gus",
    requiredCharacterId: 'prospector',
    effects: {
      addGold: 200,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_gus_pan', name: "Gus's Lucky Pan", type: 'Item', effect: { type: 'gold', amount: 20 }, description: "This pan's seen more color than a San Francisco saloon.", sellValue: 10, isCheat: true, illustrationId: 'item_gold_pan' },
        { id: 'custom_gus_nugget', name: "Gus's Big Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 50, description: "The one that started it all!", isCheat: true, illustrationId: 'item_gold_nugget_t2' },
      ],
      catchphrases: {
        goldFound: ["'Yeehaw! Rich at last!'", "'Gold! Gold! Gold!'", "'I've struck it rich!'", "'This is the life!'"],
        playerAttack: ["'Get away from my claim!'", "'This is my gold!'"],
        threatDefeated: ["'Nobody's takin' my gold!'", "'I'm the king of this here mountain!'"],
        itemBought: ["'Gotta spend it to make it!'", "'This'll help me find more gold!'"],
        playerDamage: ["'Ouch! That's comin' out of your share!'", "'You'll not get a penny from me!'"]
      }
    },
  },
];


/**
 * Simple cheat codes that are activated immediately upon typing.
 */
export const CHEAT_CODES = {
  ADD_GOLD: "a fistful of dollars",
  UNLOCK_NG: "whistle dixie",
  INCREASE_EVENT_DIFFICULTY: "true grit",
  ADD_MAX_HEALTH: "rawhide",
};

export const CHEAT_ADD_GOLD_AMOUNT = 500;

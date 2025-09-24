import { Character } from '../types.ts';

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
  /** If true, the character's entire starting deck will be AI-remixed. */
  remixDeck?: boolean;
  /** A list of base card IDs to be AI-remixed and added to the player's starting deck. */
  addRemixedCards?: string[];
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
  {
    name: "clint eastwood",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: [
          "'You've gotta ask yourself one question: 'Do I feel lucky?' Well, do ya, punk?'",
          "'Go ahead, make my day.'",
          "He squints. 'My mule don't like people laughing. He gets the crazy idea you're laughin' at him.'",
        ],
        threatDefeated: [
          "Another one bites the dust. 'Every gun makes its own tune.'",
          "'A man's got to know his limitations.' The {enemyName} found theirs.",
          "He blows the smoke from his six-shooter. 'There's two kinds of people in this world, my friend... Those with loaded guns and those who dig. You dig.'",
        ],
        goldFound: [
          "He picks up the {goldAmount} Gold. 'A fistful of dollars.'",
          "'For a few dollars more...'",
        ]
      }
    },
  },
  {
    name: "indiana jones",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 300,
      addMaxHealth: 1,
      increaseDifficulty: 1,
      addRemixedCards: ['item_six_iron_t2', 'upgrade_stetson_hat'],
      catchphrases: {
        playerAttack: [
          "He cracks his whip!",
          "A quick shot from the revolver. 'Trust me.'",
          "'X never, ever marks the spot!'",
        ],
        threatDefeated: [
          "The {enemyName} is defeated. 'It's not the years, honey, it's the mileage.'",
          "'That belongs in a museum!'",
          "He dusts off his hat. 'I'm making this up as I go!'",
        ],
        goldFound: [
          "He pockets the {goldAmount} Gold. 'Fortune and glory, kid. Fortune and glory.'",
        ],
        itemTaken: [
          "'This should have been in a museum!' He takes the {itemName}.",
        ],
        playerDamage: [
          "'Snakes. Why'd it have to be snakes?' He takes {damageAmount} damage.",
          "Takes a punch. 'I hate snakes!'",
          "'They're trying to kill us!'",
        ],
        laudanumAbuse: ["'This is for the mileage, not the years.'"]
      }
    },
  },
  {
    name: "arthur morgan",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addGold: 50,
      catchphrases: {
        playerAttack: [
          "'You got a kind face... The kind I like to punch!'",
          "'Outta the damn way!'",
          "'Sure.' He opens fire."
        ],
        threatDefeated: [
          "'You, sir, are a fish.' The {enemyName} is no more.",
          "He tips his hat. 'We're thieves in a world that don't want us no more.'",
        ],
        goldFound: [
          "'Just a bit more, and we're off to Tahiti.' He finds {goldAmount} Gold.",
          "'All I'm saying is... there's always a goddamn train.'",
        ],
        playerDamage: [
          "Takes a hit. 'Sure.'",
          "A racking cough echoes. 'I'm afraid.'",
        ],
        laudanumAbuse: ["He takes a swig. 'Just need to clear my head.'", "'Helps with the cough.'"]
      }
    },
  },
  {
    name: "the preacher",
    requiredCharacterId: 'preacher',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_six_shooter_t2'],
      catchphrases: {
        playerAttack: [
          "'Nothing like a good piece of hickory.'",
          "The Pale Rider strikes.",
        ],
        threatDefeated: [
          "The smoke clears. 'And I looked, and behold a pale horse: and his name that sat on him was Death, and Hell followed with him.'",
          "'Go on, get! Get out of here! And don't you come back!'",
        ],
        playerDamage: [
          "He stumbles, but seems unfazed. 'The wicked get no rest.'",
        ],
      }
    },
  },
  {
    name: "django",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addGold: 100,
      catchphrases: {
        playerAttack: [
          "The D is silent. He attacks.",
          "'I'm the one that's gonna kill you.'",
          "'I'm a bounty hunter. The law's on my side.'",
        ],
        threatDefeated: [
          "'I like the way you die, boy.' The {enemyName} is finished.",
          "'The H is silent.'",
        ],
      }
    },
  },
  {
    name: "miyamoto musashi",
    requiredCharacterId: 'explorer',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sharp_knife_t2_fj', 'item_knife_t2_fj'],
      catchphrases: {
        playerAttack: [
          "'There is nothing outside of yourself.' He strikes with two blades.",
          "The Way of the warrior is the resolute acceptance of death.",
          "'In battle, if you make your opponent flinch, you have already won.'",
        ],
        threatDefeated: [
          "'Do nothing that is of no use.' The {enemyName} was of no use.",
          "'Perceive that which cannot be seen with the eye.'",
        ],
      }
    },
  },
  {
    name: "zatoichi",
    requiredCharacterId: 'doctor',
    effects: {
      remixDeck: true,
      increaseDifficulty: 2,
      catchphrases: {
        playerAttack: [
          "A flash of steel from the blind swordsman.",
          "He listens for the faintest sound before striking with his cane-sword.",
          "'I am a blind man. I do not know your face, nor your name.'",
        ],
        threatDefeated: [
          "'Even with my eyes closed, I could see the greed in your heart.'",
          "He sheathes his cane-sword. 'It's better not to see the ugliness in the world.'",
        ],
        playerDamage: [
          "He stumbles, but is not beaten. 'A lucky strike.'",
          "'This world has grown dark indeed.'",
        ],
      }
    },
  },
  {
    name: "william adams",
    requiredCharacterId: 'explorer',
    effects: {
      addRemixedCards: ['item_six_shooter_t1', 'item_katana_t1_fj'],
      addMaxHealth: 5,
      catchphrases: {
        playerAttack: [
          "'Guardian Spirit, lend me your strength!'",
          "He switches stances, blade flashing.",
          "'Another Yokai? Fine by me.'",
        ],
        threatDefeated: [
          "He sheathes his blade. 'Time to send you back.'",
          "He purifies the area with a prayer.",
        ],
      }
    },
  },
  {
    name: "allan quatermain",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 100,
      addRemixedCards: ['item_hunting_rifle_t1_as', 'upgrade_treasure_map_as'],
      catchphrases: {
        playerAttack: [
          "He levels his elephant gun. 'Steady now.'",
          "'The league of extraordinary gentlemen send their regards.'",
        ],
        threatDefeated: [
          "The hunt is over. 'Time for a smoke.'",
          "He consults his map. 'The diamond mines of King Solomon await!'",
        ],
        goldFound: [
          "'For a map, this is proving quite profitable.' Finds {goldAmount} Gold.",
        ],
        laudanumAbuse: ["'A gentleman's vice.' He takes a dose to steady his nerves, though they are already quite steady."]
      }
    },
  },
  {
    name: "lara croft",
    requiredCharacterId: 'explorer',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_six_shooter_t1', 'item_six_shooter_t1'],
      catchphrases: {
        playerAttack: [
          "With a flip and a flourish, she opens fire.",
          "'I make my own luck.'",
        ],
        threatDefeated: [
          "'The extraordinary is in what we do, not who we are.'",
          "'A famous explorer once said, that the extraordinary is in what we do, not who we are.'",
        ],
        itemTaken: [
          "'This belongs in a museum.' She takes the {itemName}.",
          "'I'm not a thief. I'm a tomb raider.'",
        ],
      }
    },
  },
  {
    name: "nathan drake",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 50,
      addRemixedCards: ['item_six_shooter_t1'],
      catchphrases: {
        playerAttack: [
          "'Here goes nothing!' He opens fire.",
          "'Sic Parvis Magna.'",
          "'Look out! Grenade!' (There is no grenade)",
        ],
        threatDefeated: [
          "He wipes sweat from his brow. 'Well, that could've gone better.'",
          "'Another day, another historical artifact trying to kill me.'",
        ],
        playerDamage: [
          "'Oh, crap.' Takes {damageAmount} damage.",
          "'No, no, no!' Takes a hit.",
        ],
        goldFound: [
          "'Kitty got wet.' Finds {goldAmount} Gold.",
        ],
        laudanumAbuse: ["'Hair of the dog.' He downs the bottle.", "'Just a little something to take the edge off... all the edges.'"]
      }
    },
  },
  {
    name: "van helsing",
    requiredCharacterId: 'preacher',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_bow_t1_sh', 'item_sharp_knife_t1_sh'],
      catchphrases: {
        playerAttack: [
          "'For the salvation of mankind!' He attacks with holy purpose.",
          "'My life's work is to destroy evil.'",
          "'We must sterilize this earth, this cursed soil.'",
        ],
        threatDefeated: [
          "'Back to the abyss, foul thing!' The {enemyName} is vanquished.",
          "He checks his notes. 'The vampire is a mortal being. And we will send it to its death.'",
        ],
      }
    },
  },
  {
    name: "ash williams",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sawed_off_t1_sh'],
      catchphrases: {
        playerAttack: [
          "'Groovy.' He attacks with his BOOMSTICK.",
          "'Come get some.'",
          "His chainsaw hand roars to life.",
        ],
        threatDefeated: [
          "'Hail to the king, baby.' The {enemyName} is toast.",
          "'Swallow this.'",
        ],
        laudanumAbuse: ["'Gimme some sugar, baby.' He chugs the laudanum.", "'Shop smart. Shop S-Mart. And take your medicine.'"]
      }
    },
  },
  {
    name: "buffy summers",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sharp_knife_t1_sh'],
      catchphrases: {
        playerAttack: [
          "She quips, 'And you are...?' before striking.",
          "'Strong is fighting. It's hard and it's painful and it's every day.'",
          "'If the apocalypse comes, beep me.'",
        ],
        threatDefeated: [
          "'That'll put a damper on the prom.' The {enemyName} turns to dust.",
        ],
        playerDamage: [
          "'The hardest thing in this world is to live in it.' Takes {damageAmount} damage.",
        ],
      }
    },
  },
  {
    name: "hellboy",
    requiredCharacterId: 'preacher',
    effects: {
      addMaxHealth: 10,
      addRemixedCards: ['item_six_shooter_t2_sh'],
      increaseDifficulty: 1,
      catchphrases: {
        playerAttack: [
          "'I'm not a very good shot... but the Samaritan here, she's a HELL of a shot.'",
          "The Right Hand of Doom connects with a crunch.",
        ],
        threatDefeated: [
          "'Didn't I kill you already?' The {enemyName} is down for good.",
          "He files down his horns. 'I'm on your side!'",
        ],
        playerDamage: [
          "'Aw, crap.' Takes {damageAmount} damage.",
        ],
      }
    },
  },
  {
    name: "deckard",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: [
          "'Replicants are like any other machine. They're either a benefit or a hazard.' He fires.",
          "'Is this testing whether I'm a Replicant or a lesbian, Mr. Deckard?'",
        ],
        threatDefeated: [
          "The {enemyName} is retired. 'Time to die.'",
          "'All those moments will be lost in time, like tears in rain.'",
        ],
        laudanumAbuse: ["He downs the bottle, the world blurring slightly. 'Just one more to forget.'", "The bitter taste is a familiar comfort against the acid rain and neon glow."]
      }
    },
  },
  {
    name: "major kusanagi",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      increaseDifficulty: 2,
      catchphrases: {
        playerAttack: [
          "'If we all reacted the same way, we'd be predictable.' She attacks.",
          "'The net is vast and infinite.'",
        ],
        threatDefeated: [
          "'I am a vessel. And I am ready for my journey.' The {enemyName} is disconnected.",
        ],
      }
    },
  },
  {
    name: "adam jensen",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addRemixedCards: ['upgrade_plain_duster_t1_cp'],
      catchphrases: {
        playerAttack: [
          "His augmentations whir as he attacks.",
          "He takes down the target, lethally or non-lethally. It's his choice.",
        ],
        threatDefeated: [
          "'Some people are best viewed from a distance.' The {enemyName} is neutralized.",
        ],
        playerDamage: [
          "Takes a hit. 'I never asked for this.'",
          "'The past is a puzzle, like a broken mirror.'",
        ],
      }
    },
  },
  {
    name: "goemon ishikawa",
    requiredCharacterId: 'trapper',
    effects: {
      addGold: 100,
      addRemixedCards: ['item_katana_t1_fj'],
      catchphrases: {
        playerAttack: ["A flash of Zantetsuken!"],
        threatDefeated: ["'Once again, I have cut a worthless object.'"],
      }
    },
  },
  {
    name: "john wick",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_six_shooter_t2'],
      increaseDifficulty: 1,
      catchphrases: {
        playerAttack: [
          "'Yeah, I'm thinking I'm back.'", 
          "'Consequences.' He opens fire.", 
          "He reloads with brutal efficiency."
        ],
        threatDefeated: [
          "'Whoever comes, whoever it is... I'll kill them. I'll kill them all.'", 
          "The {enemyName} is excommunicado."
        ],
        itemTaken: [
          "Takes the {itemName}. 'Guns. Lots of guns.'", 
          "'I'm going to need a bigger gun.'"
        ]
      }
    },
  },
  {
    name: "v",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_six_shooter_t1_cp', 'item_sharp_knife_t1_cp', 'upgrade_plain_duster_t1_cp', 'upgrade_iron_will_cp'],
      catchphrases: {
        playerAttack: [
          "'Time to party like it's 2023.'",
          "'Wake the f*ck up, Samurai. We have a city to burn.'",
          "His cyberware whirs to life as he attacks."
        ],
        threatDefeated: [
          "'Another one flatlined.'", 
          "'Just another Tuesday in Night City.'"
        ],
        goldFound: [
          "'Preem eddies for some new chrome.'", 
          "'Gotta pay Vik back somehow.'"
        ],
        playerDamage: [
          "'Just a scratch, choom.'", 
          "'Damn, that was some heavy-duty chrome.'"
        ]
      }
    },
  },
  {
    name: "john marston",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: [
          "'I'm an outlaw, not a monster.'",
          "'Some trees flourish, others die. Some cattle grow strong, others are taken by wolves.'",
        ],
        threatDefeated: [
          "'It ain't no secret I'm a killer.'",
          "'When a man with a six-gun meets a man with a rifle, you said, the man with the pistol's a dead man. Let's see if that's true.'",
        ],
        playerDamage: [
          "'My side ain't chosen. My side is what I make it.'",
          "'People don't forget. Nothing gets forgiven.'",
        ],
        laudanumAbuse: ["'Just one more... for the pain.'", "He stares into the bottle. 'It don't have to be like this.'"]
      }
    },
  },
  {
    name: "doc holliday",
    requiredCharacterId: 'doctor',
    effects: {
      addRemixedCards: ['item_six_shooter_t1', 'provision_laudanum_t1'],
      increaseDifficulty: 1,
      catchphrases: {
        playerAttack: [
          "'I have two guns, one for each of ya.'", 
          "'Say when.' He draws.",
          "A sudden, racking cough, followed by a flash of gunfire."
        ],
        threatDefeated: [
          "'You're a daisy if you do.'", 
          "'It appears my hypocrisy knows no bounds.'", 
          "He holsters his pistol. 'Why, Johnny Ringo, you look like somebody just walked over your grave.'"
        ],
        playerHeal: [
          "He takes a pull from his flask. 'There's no normal life, Wyatt, there's just life. You get on with it.'",
        ],
        laudanumAbuse: ["He smiles weakly. 'My hypocrisy knows no bounds.'", "Another dose to quiet the cough. 'I'm in my prime.'", "'Forgive me if I don't shake hands.'"]
      }
    },
  },
  {
    name: "zorro",
    requiredCharacterId: 'explorer',
    effects: {
      addRemixedCards: ['item_sharp_knife_t2'],
      catchphrases: {
        playerAttack: ["A flash of the blade!", "He laughs from the shadows before striking."],
        threatDefeated: [
          "The mark of Zorro is left behind.", 
          "'The fox has struck again!'", 
          "'When the people cry for help, the fox will come.'"
        ]
      }
    },
  },
  {
    name: "jin sakai",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_katana_t1_fj'],
      catchphrases: {
        playerAttack: [
          "'I am the Ghost.'", 
          "'Face me!'", 
          "A blur of steel and shadows."
        ],
        threatDefeated: [
          "'You have no honor.'", 
          "'And you have my pity.'", 
          "'The storm is coming for our enemies.'"
        ]
      }
    },
  },
  {
    name: "sekiro",
    requiredCharacterId: 'trapper',
    effects: {
      addRemixedCards: ['item_sharp_knife_t1_fj'],
      addMaxHealth: 5,
      catchphrases: {
        playerAttack: ["A flurry of blows from the one-armed wolf."],
        threatDefeated: [
          "'Hesitation is defeat.'", 
          "'Death of a shadow... You taught me well.'",
        ],
        playerDamage: ["'I will not die... a second time.'"],
      }
    },
  },
  {
    name: "san",
    requiredCharacterId: 'hunter',
    effects: {
      addRemixedCards: ['item_sharp_knife_t1_fj'],
      catchphrases: {
        playerAttack: ["'The Forest Spirit gives and takes away.' She attacks."],
        threatDefeated: [
          "'The forest will be at peace again.'", 
          "'Go back to the forest spirit!'", 
          "'The humans must learn their place.'"
        ],
      }
    },
  },
  {
    name: "rick o'connell",
    requiredCharacterId: 'explorer',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sawed_off_t1_as', 'upgrade_tattered_bible_sh'],
      catchphrases: {
        playerAttack: [
          "'Looks to me like I've got all the horses!'", 
          "'Here I come, kiddies!'", 
          "'Think I'll have me a drink.'"
        ],
        threatDefeated: [
          "'Goodbye, Beni.'", 
          "'This is not good.' But the {enemyName} is gone."
        ],
        laudanumAbuse: ["'Well, that's not good.' He takes the medicine anyway.", "'Seems to me you're on the wrong side of the RI-VER!' He says to the bottle before drinking."]
      }
    },
  },
  {
    name: "tarzan",
    requiredCharacterId: 'hunter',
    effects: {
      addRemixedCards: ['item_panga_machete_t1_as'],
      addMaxHealth: 10,
      catchphrases: {
        playerAttack: [
          "A primal yell echoes through the jungle.", 
          "He swings in on a vine, knife flashing.", 
          "'Me, Tarzan. You, dead.'"
        ],
      }
    },
  },
  {
    name: "teddy roosevelt",
    requiredCharacterId: 'explorer',
    effects: {
      addRemixedCards: ['item_hunting_rifle_t1_as'],
      addMaxHealth: 5,
      catchphrases: {
        playerAttack: [
          "'Bully!' He charges into the fray.",
          "'Speak softly and carry a big stick; you will go far.'",
        ],
        threatDefeated: [
          "The {enemyName} is defeated. 'The credit belongs to the man who is actually in the arena.'",
          "'It is not the critic who counts; not the man who points out how the strong man stumbles.'",
        ]
      }
    },
  },
  {
    name: "geralt of rivia",
    requiredCharacterId: 'trapper',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sharp_knife_t2_sh'],
      catchphrases: {
        playerAttack: [
          "'How do you like that silver?'",
          "A flash of steel, a blur of leather, and the sign of Igni.",
        ],
        threatDefeated: [
          "'Damn, you're ugly.'",
          "'Evil is Evil. Lesser, greater, middling… makes no difference. The degree is arbitrary. The definition’s blurred. If I’m to choose between one evil and another… I’d rather not choose at all.'",
        ],
        goldFound: [
          "'Wind's howling.' He finds {goldAmount} Gold.",
        ],
      }
    },
  },
  {
    name: "simon belmont",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_knife_t1_sh'],
      catchphrases: {
        playerAttack: [
          "He cracks his whip, the Vampire Killer.",
          "He throws a flask of holy water.",
        ],
        threatDefeated: [
          "The creature of the night is vanquished.",
          "'What a horrible night to have a curse.'",
        ],
      }
    },
  },
  {
    name: "leon s. kennedy",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: ["'Got some gum.' He attacks."],
        threatDefeated: [
          "'Where's everyone going? Bingo?'",
          "'No thanks, bro!'",
        ],
      }
    },
  },
  {
    name: "ellen ripley",
    requiredCharacterId: 'gunslinger',
    effects: {
      addRemixedCards: ['item_rifle_t1_sh'],
      increaseDifficulty: 1,
      catchphrases: {
        playerAttack: ["'Did IQs just drop sharply while I was away?'"],
        threatDefeated: [
          "'Get away from her, you bitch!'",
          "'Game over, man! Game over!'",
        ],
      }
    },
  },
  {
    name: "the doom slayer",
    requiredCharacterId: 'preacher',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sawed_off_t1_sh'],
      catchphrases: {
        playerAttack: ["*Heavy metal music intensifies*"],
        threatDefeated: [
          "'Rip and tear, until it is done.'",
          "'They are rage, brutal, without mercy. But you. You will be worse.'",
        ],
      }
    },
  },
  {
    name: "spike spiegel",
    requiredCharacterId: 'gunslinger',
    effects: {
      addRemixedCards: ['item_six_shooter_t1_cp'],
      catchphrases: {
        playerAttack: [
          "'Bang.'",
          "'Whatever happens, happens.'",
        ],
        threatDefeated: [
          "'See you, space cowboy...'",
          "'You're gonna carry that weight.'",
        ],
        laudanumAbuse: ["He sighs, taking a swig. 'Whatever happens, happens.'", "The bitter liquid does little to fill the emptiness."]
      }
    },
  },
  {
    name: "judge dredd",
    requiredCharacterId: 'preacher',
    effects: {
      remixDeck: true,
      increaseDifficulty: 2,
      catchphrases: {
        playerAttack: [
          "'I am the law!'",
          "'Judgement time.'",
        ],
        threatDefeated: [
          "The {enemyName}'s sentence has been carried out.",
          "'Mega-City One is a metropolis of the future. But the future is not a nice place.'",
        ],
      }
    },
  },
  {
    name: "robocop",
    requiredCharacterId: 'preacher',
    effects: {
      addMaxHealth: 15,
      addRemixedCards: ['item_six_shooter_t2_cp'],
      catchphrases: {
        playerAttack: [
          "'Dead or alive, you're coming with me.'",
          "'Your move, creep.'",
        ],
        threatDefeated: [
          "'Thank you for your cooperation.'",
          "'Stay out of trouble.'",
        ],
      }
    },
  },
  {
    name: "solid snake",
    requiredCharacterId: 'trapper',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: [
          "'Kept you waiting, huh?'",
          "'This is Snake. Do you read me?'",
        ],
        playerDamage: [
          "'A cornered fox is more dangerous than a jackal!'",
          "'Hurt me more!'",
        ],
        threatDefeated: [
          "The enemy falls. A cardboard box nearby rustles suspiciously.",
        ]
      }
    },
  },
  {
    name: "mad max",
    requiredCharacterId: 'trapper',
    effects: {
      addRemixedCards: ['item_sawed_off_t1'],
      catchphrases: {
        playerAttack: ["'My name is Max. My world is fire and blood.'"],
        threatDefeated: [
          "'Oh, what a day! What a lovely day!'",
          "'Mediocre.'",
        ],
      }
    },
  },
  {
    name: "judge holden",
    requiredCharacterId: 'preacher',
    effects: {
      addRemixedCards: ['item_sawed_off_t1_sh'],
      increaseDifficulty: 3,
      catchphrases: {
        playerAttack: ["He attacks with a terrifying, gleeful violence."],
        threatDefeated: [
          "'Whatever exists without my knowledge exists without my consent.' The {enemyName} no longer exists.",
          "He smiles. 'War is god.'",
        ],
      }
    },
  },
  {
    name: "annie oakley",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_rifle_t1'],
      catchphrases: {
        playerAttack: ["'Aim at a high mark and you will hit it.'"],
        threatDefeated: ["'I ain't afraid to love a man. I ain't afraid to shoot him neither.'"],
      }
    },
  },
  {
    name: "rooster cogburn",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_rifle_t1', 'item_six_shooter_t1'],
      catchphrases: {
        playerAttack: ["'Fill your hand, you son of a bitch!'"],
        threatDefeated: [
          "He takes a pull from his flask. 'I'm a Rooster, not a chicken!'",
          "He shoots from the hip with two revolvers!",
        ],
        playerDamage: ["Takes a hit. 'I'm a-comin', Ned!'"],
        laudanumAbuse: ["He chases the laudanum with a swig of whiskey. 'That's got a bite!'", "'By God! That's a brave sight! The far shore!'"]
      }
    },
  },
  {
    name: "natty bumppo",
    requiredCharacterId: 'hunter',
    effects: {
      addRemixedCards: ['item_hunting_rifle_t1', 'item_sharp_knife_t1'],
      catchphrases: {
        playerAttack: ["His long rifle cracks once."],
        threatDefeated: ["'The woods are callin', and I must go.'"],
      }
    },
  },
  {
    name: "jedediah smith",
    requiredCharacterId: 'explorer',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: ["'I wanted to be the first to view a country on which the eyes of a white man had never gazed.'"],
        playerDamage: ["Even mauled by a grizzly, his resolve holds."],
        threatDefeated: ["One more obstacle removed from the map."],
      }
    },
  },
  {
    name: "jeremiah johnson",
    requiredCharacterId: 'trapper',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_hunting_rifle_t1'],
      catchphrases: {
        playerAttack: ["'I am Bear Claw Chris Lapp, and I am blood brother to the Crow.' He attacks."],
        threatDefeated: ["'Just hope you can skin grizz.'"],
      }
    },
  },
  {
    name: "roland deschain",
    requiredCharacterId: 'gunslinger',
    effects: {
      remixDeck: true,
      increaseDifficulty: 1,
      catchphrases: {
        playerAttack: [
          "'I do not aim with my hand; he who aims with his hand has forgotten the face of his father. I aim with my eye.'",
          "'I do not shoot with my hand; I shoot with my mind.'",
          "'I do not kill with my gun; I kill with my heart.'",
        ],
        threatDefeated: [
          "The {enemyName} has forgotten the face of their father.",
          "'Go then, there are other worlds than these.'",
        ],
        laudanumAbuse: ["He takes the 'demon's medicine'. 'Ka is a wheel.'", "The bitter taste reminds him of Tull, of loss."]
      }
    },
  },
  {
    name: "hugh glass",
    requiredCharacterId: 'explorer',
    effects: {
      addMaxHealth: 10,
      remixDeck: true,
      catchphrases: {
        playerAttack: ["He attacks with a primal scream."],
        playerHeal: ["He cauterizes the wound with gunpowder."],
        threatDefeated: ["'Revenge is in God's hands... not mine.' But the {enemyName} is gone anyway."],
        playerDamage: ["He withstands the blow. 'As long as you can still grab a breath, you fight.'"],
        laudanumAbuse: ["He drinks to forget the cold, the bear, the betrayal.", "The warmth spreads, a temporary peace in a world of pain."]
      }
    },
  },
  {
    name: "daniel boone",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: ["'I've never been lost, but I was once bewildered for three days.'"],
        threatDefeated: ["'All you need for happiness is a good gun, a good horse, and a good wife.' He has one of the three."],
      }
    },
  },
  {
    name: "jim bridger",
    requiredCharacterId: 'trapper',
    effects: {
      addRemixedCards: ['upgrade_treasure_map'],
      catchphrases: {
        playerAttack: ["He attacks with the cunning of a man who's seen it all."],
        threatDefeated: ["'You can't get lost in the woods if you're the one making the map.'"],
      }
    },
  },
  {
    name: "bear grylls",
    requiredCharacterId: 'trapper',
    effects: {
      addRemixedCards: ['provision_water_t1'],
      catchphrases: {
        playerAttack: ["'Improvise. Adapt. Overcome.'"],
        playerHeal: ["'This might look disgusting, but it's packed with protein.' Heals for {healAmount}."],
        playerDamage: ["'This is where the training pays off.'"],
      }
    },
  },
  {
    name: "katniss everdeen",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_bow_t1', 'provision_juniper_t1'],
      catchphrases: {
        playerAttack: ["She lets an arrow fly. 'May the odds be ever in your favor.'"],
        threatDefeated: ["'Thank you for your consideration.'"],
      }
    },
  },
  {
    name: "reverend harry powell",
    requiredCharacterId: 'preacher',
    effects: {
      remixDeck: true,
      increaseDifficulty: 1,
      catchphrases: {
        playerAttack: ["He brandishes his knuckles. 'L-O-V-E... H-A-T-E...'"],
        threatDefeated: ["'The Lord gave, and the Lord hath taken away.'"],
        goldFound: ["'There's a story about a fella who hid ten thousand dollars...'"],
        laudanumAbuse: ["'The Lord works in mysterious ways.' He drinks, the letters H-A-T-E on his knuckles glinting.", "'A little something to fortify the spirit against the sins of the flesh.'"]
      }
    },
  },
  {
    name: "alice",
    requiredCharacterId: 'hunter',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sawed_off_t1_sh', 'item_six_shooter_t1_sh'],
      catchphrases: {
        playerAttack: ["She moves with inhuman speed and precision."],
        threatDefeated: ["'My name is Alice. And this is my world.'"],
      }
    },
  },
  {
    name: "percy fawcett",
    requiredCharacterId: 'explorer',
    effects: {
      remixDeck: true,
      catchphrases: {
        threatDefeated: ["'We are all guests of the jungle, and must behave accordingly.'"],
        playerDamage: ["'A man's reach should exceed his grasp, or what's a heaven for?'"],
      }
    },
  },
  {
    name: "eli",
    requiredCharacterId: 'preacher',
    effects: {
      remixDeck: true,
      addRemixedCards: ['item_sharp_knife_t2_sh', 'upgrade_tattered_bible_sh'],
      catchphrases: {
        playerAttack: ["He moves with the guidance of faith. 'Stay on the path.'"],
        threatDefeated: ["'Cursed is the ground for thy sake.'"],
      }
    },
  },
  {
    name: "elmer gantry",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 100,
      catchphrases: {
        playerAttack: ["'I'm going to give you a sermon that'll make your hair stand on end!'"],
        threatDefeated: ["'He who seeks the Lord, finds Him. He who seeks a bottle... also finds Him.'"],
        laudanumAbuse: ["'For medicinal purposes, of course! A preacher's throat gets awfully dry.'", "'Sinners, I have seen the light! And it is pleasantly hazy!'"]
      }
    },
  },
  {
    name: "father callahan",
    requiredCharacterId: 'preacher',
    effects: {
      addRemixedCards: ['item_six_shooter_t1_sh', 'provision_miracle_cure_t1_sh'],
      catchphrases: {
        playerAttack: ["'God forgive me.' He opens fire."],
        threatDefeated: ["'There are other worlds than these.'"],
        laudanumAbuse: ["He drinks, trying to drown out the vampires in his head.", "'Just a little something to keep the faith.'"]
      }
    },
  },
  {
    name: "crocodile dundee",
    requiredCharacterId: 'trapper',
    effects: {
      addRemixedCards: ['item_sharp_knife_t2_as'],
      catchphrases: {
        playerAttack: ["'That's not a knife... THAT's a knife.'"],
        threatDefeated: ["'Just a big, ugly bugger.'"],
      }
    },
  },
  {
    name: "billy sole",
    requiredCharacterId: 'hunter',
    effects: {
      addRemixedCards: ['item_hunting_knife_t1_as'],
      catchphrases: {
        playerAttack: ["He moves silently through the undergrowth."],
        threatDefeated: ["'I'm a scorpion, and I'm a good one.'"],
      }
    },
  },
  {
    name: "dr moreau",
    requiredCharacterId: 'doctor',
    effects: {
      remixDeck: true,
      catchphrases: {
        threatDefeated: ["'The study of Nature makes a man at last as remorseless as Nature.'"],
        playerHeal: ["'The beast flesh is healing nicely.'"],
      }
    },
  },
  {
    name: "sacagawea",
    requiredCharacterId: 'explorer',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerAttack: ["She points the way forward... and attacks."],
        itemTaken: ["'This will be useful for the journey.'"],
      }
    },
  },
  {
    name: "dr frankenstein",
    requiredCharacterId: 'doctor',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerHeal: ["'It's ALIVE!' Heals for {healAmount}."],
        threatDefeated: ["'I have created a monster, and it is my task to destroy it.'"],
        laudanumAbuse: ["'For the nerves!' he mutters, his hands shaking slightly. 'The work must continue!'", "He seeks oblivion in the bottle, but finds only more vivid nightmares."]
      }
    },
  },
  {
    name: "elizabeth blackwell",
    requiredCharacterId: 'doctor',
    effects: {
      remixDeck: true,
      catchphrases: {
        playerHeal: ["'A systematic application of poultices should suffice.' Heals for {healAmount}."],
        threatDefeated: ["'The affliction has been... excised.'"],
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

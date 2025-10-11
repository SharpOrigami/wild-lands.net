import { Character, CardData } from '../types.ts';

/**
 * Defines the types of game events that can trigger a special catchphrase.
 */
export type CheatPhraseCategory =
  | 'bountySold'
  | 'campfireBuilt'
  | 'equipCheatItem'
  | 'eventRevealBear'
  | 'eventRevealSnake'
  | 'eventRevealThreat'
  | 'goldFound'
  | 'illnessContracts'
  | 'illnessContractsHolliday'
  | 'itemBought'
  | 'itemSold'
  | 'itemTaken'
  | 'laudanumAbuse'
  | 'newDay'
  | 'playerAttack'
  | 'playerAttackAnimal'
  | 'playerAttackBear'
  | 'playerAttackHorror'
  | 'playerAttackHuman'
  | 'playerAttackSnake'
  | 'playerDamage'
  | 'playerHeal'
  | 'scoutAhead'
  | 'threatDefeated'
  | 'threatDefeatedAnimal'
  | 'threatDefeatedHuman'
  | 'trapCaught'
  | 'trapSet'
  | 'useCheatItem'
  | 'itemEquipped'
  | 'deEscalate';

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
  /** 
   * A collection of character-specific phrases to be used in the game log for certain events. 
   * For 'equipCheatItem' and 'useCheatItem', this can be an object keyed by the item ID.
   */
  catchphrases?: Partial<Record<CheatPhraseCategory, string[] | Partial<Record<string, string[]>>>>;
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
        { id: 'custom_clint_poncho', name: "Man with No Name's Poncho", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 10, persistent: true }, description: "This dusty poncho has seen a lot. It offers more than just protection from the sun.", sellValue: 25, isCheat: true, illustrationId: 'upgrade_plain_duster_t1' },
        { id: 'item_six_shooter_clint', name: "Peacemaker", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A revolver that has settled many disputes.", sellValue: 20, isCheat: true, illustrationId: 'item_six_shooter_t1' }
      ],
      catchphrases: {
        playerAttackHuman: ["'Every gun makes its own tune.'", "'My mule don't like people laughing.'", "'When a man with a .45 meets a man with a rifle, you said, the man with a pistol's a dead man. Let's see if that's true.'"],
        playerAttackAnimal: ["He fires without a word. Just another creature in a harsh land.", "The sound of his gun is swallowed by the plains."],
        threatDefeatedHuman: ["'You see, in this world there's two kinds of people, my friend... Those with loaded guns and those who dig. You dig.'", "'Get three coffins ready.'", "'Such ingratitude, after all the times I've saved your life.'"],
        threatDefeatedAnimal: ["'Just a dumb animal.' He reloads his revolver.", "He takes no notice of the dead creature, his eyes already scanning the horizon."],
        goldFound: ["He picks up the {goldAmount} Gold. 'A fistful of dollars.'", "'For a few dollars more...'"],
        playerDamage: ["He takes the hit without a word, just a cold stare.", "A bullet grazes him. He just chews on his cigarillo.", "Takes {damageAmount} damage. 'The man with the rifle... he's a dead man.'"],
        itemBought: ["He pays the {cost}G. 'I'll sleep with my eyes open.'", "'This will come in handy.'"],
        equipCheatItem: {
          'custom_clint_poncho': ["He dons the dusty poncho. It feels... familiar."],
          'item_six_shooter_clint': ["He checks the action on the Peacemaker. 'Alright.'"]
        },
        useCheatItem: {
          'item_six_shooter_clint': ["He fires the Peacemaker. The sound echoes across the plains.", "'Every gun makes its own tune.'"]
        }
      }
    },
  },
    {
    name: "My Mom",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 250,
      addMaxHealth: 1,
      addCustomCards: [
        { 
          id: 'custom_suzyann_rifle', 
          name: "The Retiree's Revenge", 
          type: 'Item', 
          effect: { type: 'weapon', attack: 12 }, 
          description: "Fires with the fury of someone who no longer has to deal with morning commutes or annoying bosses. It's surprisingly powerful.", 
          sellValue: 200, 
          isCheat: true, 
          illustrationId: 'item_rifle_t2' 
        },
        { 
          id: 'custom_suzyann_zeke_bag', 
          name: "Zeke's 'Go Bag'", 
          type: 'Player Upgrade', 
          effect: { type: 'upgrade', subtype: 'persistent_heal', amount: 10, persistent: true }, 
          description: "A well-stocked bag carried by the best boy. Zeke's preparedness is so comforting, it heals you for 10 HP at the start of each day.", 
          sellValue: 150, 
          isCheat: true, 
          illustrationId: 'upgrade_leather_satchel_t1' 
        },
        { 
          id: 'custom_suzyann_morsels', 
          name: "Migraine-Free Morsels", 
          type: 'Provision', 
          effect: { type: 'heal', amount: 15 }, 
          immediateEffect: { type: 'draw', amount: 1 },
          description: "Guaranteed free of chocolate and lemon. So delicious, it'll put you in a good mood. Heals 15 HP and draws 1 card.", 
          sellValue: 50, 
          isCheat: true, 
          illustrationId: 'provision_steak' 
        },
      ],
      catchphrases: {
        newDay: [
            "Time to start another day of not working! I am LOVING retirement!",
            "Zeke, you ready for a hike today? Good boy!",
            "Is the camper ready yet? I want to get this show on the road!",
            "Ah, another beautiful day. I remember when I had to work four jobs. This is better.",
            "Alright, let's see what trouble we can get into today.",
            "No meetings, no deadlines... just me and the open trail. It's glorious.",
            "Let's see... what's on the agenda today? Oh right, whatever I want.",
            "Another day, another opportunity to not set an alarm clock.",
            "Good morning, wilderness! Try not to kill me today, I've got plans.",
            "I could get used to this. Oh wait, I already have."
        ],
        eventRevealThreat: [
            "Oh, for crying out loud. Another one?",
            "Zeke, get 'em! Just kidding, stay here, you're too precious.",
            "Is that thing made of chocolate? Get it away from me, I've got things to do today.",
            "Honestly, some creatures just have no respect for a retiree's schedule.",
            "Well, you don't look very friendly. Let's get this over with.",
            "Seriously? I'm on a fixed income, I can't afford all this excitement.",
            "You must be new here. We have a schedule, and it's called 'nap time'.",
            "Oh, wonderful. Just what I needed. Another mouth to feed... lead.",
            "You're interrupting my 'me time'. This will not end well for you.",
            "Do I look like I'm on the clock? Go bother someone else."
        ],
        playerAttack: [
            "This is for all those years working three jobs!",
            "Take that, you whippersnapper!",
            "Retirement isn't for the weak!",
            "You think raising two kids on my own was easy? This is nothing!",
            "I'm not mad, I'm just disappointed... that you're still standing.",
            "I'm going to count to three. One...",
            "Don't make me use my 'mom voice' on you!",
            "This is what happens when you skip your nap!",
            "You're about to experience a world of hurt, mister.",
            "This is going to hurt you more than it hurts me. ...Actually, no, this is all on you."
        ],
        playerAttackHuman: [
            "You remind me of my old boss. This is gonna feel good.",
            "Somebody's getting a time-out. A permanent one.",
            "Don't you have something better to do? Some of us are retired, you know.",
            "I've dealt with worse than you before, just ask my son.",
            "This is what happens when you interrupt my game time.",
            "You have one of those faces I just want to... rearrange.",
            "Someone clearly wasn't raised right.",
            "Let me guess, you think you're a tough guy? Cute.",
            "I've had telemarketers more threatening than you."
        ],
        playerAttackAnimal: [
            "Aww, it's just a baby... a baby that wants to eat my face.",
            "Zeke is a good boy. You are NOT a good boy.",
            "I love my dog Zeke! But you... you I'm not so sure about.",
            "This is not the kind of wildlife I wanted to see on my hike.",
            "Sorry, fella. It's you or me.",
            "Look, I love animals, but you're being a real jerk.",
            "You're not cute enough to get away with this.",
            "Zeke has better manners than you. And he's a dog.",
            "Sorry, Bambi. Circle of life."
        ],
        threatDefeatedHuman: [
            "And stay down! Some of us are trying to enjoy retirement.",
            "Well, that's one way to solve a problem. A messy one, but solved.",
            "That's what you get for messing with a woman who worked four jobs to raise her kids.",
            "Okay, who's next? I've got all day.",
            "He should have retired.",
            "Now, back to my regularly scheduled retirement.",
            "Some people just don't know when to quit. He does now.",
            "And that's why you respect your elders.",
            "Okay, problem solved. Anyone have some ibuprofen?",
            "He should've stayed home and played a nice game."
        ],
        threatDefeatedAnimal: [
            "Poor thing. Zeke would have been a better influence on you.",
            "Okay, back to our regularly scheduled hike.",
            "He was definitely not a good boy. Zeke is the only good boy.",
            "The circle of life is a beautiful thing. Especially when I'm at the top of it.",
            "And that's that. Now, where did I put my trail mix?",
            "See? This is why Zeke is an inside dog.",
            "Well, that's one way to solve a pest problem.",
            "Nature is beautiful. And sometimes, it needs to be put in its place.",
            "Right. Where's my skinning knife?"
        ],
        playerDamage: [
            "Ow! Right in my retirement fund!",
            "Hey! I worked four jobs to get this far, you're not stopping me now!",
            "That's it, I'm writing a strongly worded letter to your manager!",
            "Did you just hit a retiree?! Have you no shame?",
            "That's gonna leave a mark. Good thing I don't have to go to an office tomorrow.",
            "Hey! I just had this outfit cleaned!",
            "Do you know how long it takes for these bruises to heal at my age?",
            "Ow! My sciatica!",
            "Rude. Just... incredibly rude.",
            "Okay, that was uncalled for."
        ],
        playerHeal: [
            "Ah, that's better. Like a day without a migraine.",
            "A little rest and relaxation. Retirement is the best.",
            "Tastes... definitely not like lemon. Thank goodness.",
            "A quick patch-up. Good as new. Well, new-ish.",
            "Just what the doctor ordered. And I should know, I've seen enough of 'em.",
            "Ahhh. That's the stuff.",
            "Feeling good as new. Or, you know, as good as a retiree can feel.",
            "Okay, I'm ready for my close-up now.",
            "Alright, back in the game."
        ],
        goldFound: [
            "{goldAmount} gold? That's almost a day's pay from one of my old jobs!",
            "Ooh, shiny! This'll go right into the camping fund.",
            "Well, look at that. My Social Security came in early.",
            "Finding {goldAmount} Gold is nice, but not having to work for it is even better.",
            "Well hello there, handsome.",
            "This goes straight into the 'Don't Tell Joel' fund.",
            "Look at that! More money, fewer problems.",
            "I remember when I had to work a whole week for this much.",
            "Score! This will buy a lot of dog treats for Zeke."
        ],
        itemBought: [
            "Treat yourself, honey. You've earned it.",
            "Does this come with a senior discount? No? Fine, I'll take it anyway.",
            "This looks useful for our next camping trip.",
            "Look what I found! It was on sale. ...What do you mean, there are no 'sales' out here?",
            "Do I need it? No. Do I want it? Absolutely.",
            "This is my retirement, I'll spend my money how I want!",
            "Ooh, this looks handy. Or shiny. Or both.",
            "Retail therapy, even in the wilderness."
        ],
        campfireBuilt: [
            "Nothing like a campfire after a long day of... not working.",
            "Just like camping with the kids. But much, much quieter.",
            "Zeke, curl up by the fire. Good boy.",
            "This is the life. Just me, the stars, and no deadlines.",
            "Now this is what I call retirement.",
            "Now this is my kind of nightlife.",
            "Time to kick back and relax. Don't mind the screams from the woods.",
            "The perfect end to a perfect day of doing whatever I want.",
            "Ah, the simple things."
        ],
        illnessContracts: [
            "Ugh, this feels like one of my lemon migraines.",
            "I'd rather work four jobs again than have {illnessName}.",
            "Is this from chocolate? I swear if this is from chocolate...",
            "Oh great. Just what I needed.",
            "Of course. Because my day wasn't interesting enough.",
            "This is worse than working retail on Black Friday.",
            "I feel like a used dishrag.",
            "If I die, tell Zeke he was the best boy.",
            "I'd like to speak to the manager of this illness, please."
        ],
        equipCheatItem: {
            'custom_suzyann_zeke_bag': ["Alright Zeke, you got the snacks? Good boy.", "My best boy, always prepared to take care of his mama.", "Zeke, you're the best pack mule a mom could ask for."],
            'custom_suzyann_rifle': ["Time to show these young punks how it's done.", "They think I'm just a sweet old lady. They're half right.", "Alright, let's see what this old girl can do.", "Say hello to my little friend. Well, not so little."]
        },
        useCheatItem: {
            'custom_suzyann_morsels': [
                "Mmm, delicious. And no headache! Take that, lemons!", 
                "So good. Makes me feel all warm and fuzzy inside. And slightly less murdery.",
                "Tastes like victory. And beef.",
                "That's the stuff. Now I feel like being nice. Maybe."
            ]
        }
      }
    }
  },
  {
  name: "big balls jimmy",
  requiredCharacterId: 'gunslinger',
  effects: {
    addGold: 100,
    catchphrases: {
      newDay: [
          "Ugh, my head feels like a badger's nesting in it. Anyone got a breakfast sandwich?",
          "Is it morning? Feels like it. Smells like it. Tastes like... regret.",
          "Time to rise and grind! Or just... rise. Grinding is hard.",
          "Okay, new day. Where did I leave my pants?",
          "Big Balls Jimmy in the hizzy, B!",
      ],
      eventRevealThreat: [
          "Whoa, a {enemyName}! Should we... uh... reason with it? With fists?",
          "Is that thing friendly? It's not smiling. That's a bad sign.",
          "Alright, stay cool, Jimmy. It can probably smell fear. And the week-old jerky in my pocket.",
          "It's just a {enemyName}. Big deal. I've seen scarier things in my bong water.",
          "Did someone order a knuckle sandwich? 'Cause I think this guy did, and I'm all out of bread.",
      ],
      playerAttack: [
          "Eat this! Whatever this is! It's pointy!",
          "Take that! And that! I'm like, a whirlwind of... mild violence!",
          "This is for all the breakfast sandwiches you've never made me!",
          "I'm gonna hit you so hard your kids'll be born dizzy!",
          "One-hitter quitter! That's me!",
          "Big Balls Jimmy comin' at ya!",
      ],
      playerAttackHuman: [
          "Hey man, chill out! Or, uh, don't! Whatever!",
          "Gonna send you to sleepy-town, fella.",
          "This is gonna hurt you more than it hurts me... probably. I dunno.",
          "Whoa, easy there, buddy. Let's talk this out... with my fists!",
          "You're harshin' my mellow, dude."
      ],
      playerAttackAnimal: [
          "Whoa, a fuzzy thing! Is it friendly? Guess not!",
          "Look, I don't wanna do this, but you're getting fur all over my vibe.",
          "It's comin' right for us! Like in that movie!",
          "Bad doggy! Or... bad whatever-you-are!",
          "Hey, I was gonna eat that! ...Wait, what was I gonna eat?"
      ],
      playerDamage: [
          "Ow! Right in my munchies-hole!",
          "Dude! Not the face! This is my money-maker!",
          "My everything hurts! Even my hair!",
          "That's it! You're uninvited to my birthday party!",
          "I'm seeing colors! Like, groovy colors, man.",
          "You have made a powerful enemy this day!",
      ],
      playerHeal: [
          "Ahh, that's like a bacon, egg, and cheese for the soul.",
          "Tastes like chocolatey goodness! And not dying!",
          "My health bar is green again! That's my favorite color! Besides, like, pizza.",
          "Hooray! I feel... less full of holes!",
          "That's the good stuff. Now where's the chocolate milk?",
      ],
      threatDefeated: [
          "Did I win? I won! I'm the king of the world! Or at least this patch of dirt.",
          "He's taking a nap. A dirt nap! ... Is it lunch time?",
          "Phew. That was, like, super intense. I need a nap.",
          "Big Balls Jimmy strikes again! You're welcome, world.",
          "And that's how you do that. Probably. I wasn't really watching.",
      ],
      threatDefeatedHuman: [
          "He's takin' a dirt nap. Sweet dreams, dude.",
          "Whoops. My bad. ...Anyone got snacks?",
          "Well, that's one way to solve a disagreement.",
          "He's all tuckered out. Nighty-night.",
          "And... scene. That was intense. I need a burrito."
      ],
      threatDefeatedAnimal: [
          "Aww, poor little guy. He was just hangry.",
          "Did I win? I think I won. Cool.",
          "It's just sleeping, right? ...Right?",
          "Phew. Close one. Now, where was I? Oh yeah, naps.",
          "Okay, nature. You can have this one back. I'm good."
      ],
      goldFound: [
          "Floor gold! The best kind of gold! Now, where's the nearest Taco Hut?",
          "Dude! I'm rich! I can buy, like, ten whole breakfast sandwiches!",
          "This is way better than that time I found a half-eaten burrito.",
          "Shiny! I'm gonna make a necklace out of it!",
          "This almost makes up for the... uh... fighting and stuff.",
      ],
      itemBought: [
          "One {itemName}, please. Does this work on bears? It looks like it works on bears.",
          "I'll take it! It's so... pointy!",
          "Sweet! This {itemName} is way better than the one I found in a dumpster.",
          "This is for... uh... adventuring stuff. Yeah, that's it."
      ],
      itemSold: [
          "This thing is harshing my mellow. It's gotta go.",
          "This {itemName} is too complicated. It has too many... parts.",
          "I'd rather have burrito money. Sold!",
          "Someone else can have this junk. I'm out.",
          "Here's a furry thing. It's kinda gross, but you said you'd pay for it.",
          "Is this worth, like, a lifetime supply of pizza?",
          "This used to be an animal. Now it's money. Weird."
      ],
      bountySold: [
           "Whoa, I was supposed to bring this guy in? My bad. Here's the... proof.",
           "This guy was a real jerk. You're welcome.",
           "Here's your... uh... whatever. Now, about that reward..."
      ],
      illnessContracts: [
          "Whoa, my insides feel like a lava lamp.",
          "I've got the... the wibbly-wobblies. Is that a thing?",
          "Dude, I think that berry was, like, not a food berry.",
          "I feel like I licked a weird toad.",
      ],
      trapSet: [
          "This is my surprise party hole. The surprise is, there's a hole with pointy things.",
          "Hope a sandwich falls in here.",
          "Okay, little trap thingy, do your... trappy thing.",
          "It's a trap! Get it? 'Cause it's... a trap."
      ],
      trapCaught: [
          "My hole-friend brought me a new friend! ...This one's kinda bitey.",
          "Yes! Free lunch! ...Wait, can I eat this?",
          "Whoa, it worked! I'm like, a genius or something.",
          "Aww, look at the little guy. He's so... stuck."
      ],
      laudanumAbuse: [
          "Whoa, man. I'm not even hurt, but this stuff is... groovy.",
          "My health bar was full, but my chill bar was totally empty. We're good now.",
          "The whole world is starting to look like a giant breakfast sandwich... a really, really tasty one.",
          "I can taste colors now. This one tastes like... purple.",
          "This makes the scary trees look like... friendly, fuzzy broccoli. Yeah, broccoli.",
          "Did the bottle just wink at me? I think we're best friends now.",
          "My pain level was zero, but my boredom level was, like, a million. Problem solved.",
          "Okay, everything's in slow motion now. That's gotta make me, like, super good at dodging, right?",
          "This stuff is like a warm blanket for your brain. A really fuzzy, weird-smelling blanket.",
      ],
      itemEquipped: [
          "Lookin' sharp! And... pointy!",
          "This totally completes my outfit. I'm, like, an action hero now.",
          "Sweet! New gear! Does it have pockets for snacks?",
          "Time to accessorize... with pain!"
      ],
      campfireBuilt: [
          "Fire! Heh-heh. Fire.",
          "Let's get toasty. Anyone bring marshmallows?",
          "This is way better than rubbing two sticks together. That's, like, effort.",
          "Behold! The power of... fire! Now, where's the TV?"
      ]
    }
  }
},
  {
    name: "arthur morgan",
    requiredCharacterId: 'gunslinger',
    effects: {
      addGold: 100,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'item_rifle_arthur', name: "Arthur's Rifle", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "A reliable Lancaster Repeater. Has seen a lot of use.", sellValue: 25, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'custom_arthur_journal', name: "Arthur's Journal", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A moment of reflection brings clarity and soothes the body. Draw 2 cards and heal 4 HP.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal', immediateEffect: { type: 'heal', amount: 4 } }
      ],
      catchphrases: {
        playerAttackHuman: ["'You got a kind face... The kind I like to punch!'", "'Outta the damn way!'", "'Sure.' He opens fire.", "'You've got a price on your head, friend.'", "'This ain't gonna be pretty.'"],
        playerAttackAnimal: ["'Easy, girl... easy now.' He raises his gun.", "'Just a dumb animal, but it's in my way.'", "'Sorry, friend.' He opens fire on the beast.", "'You're a fine animal. I'm sorry.'"],
        threatDefeatedHuman: ["'You see, in this world there's two kinds of people, my friend... Those with loaded guns and those who dig. You dig.'", "He tips his hat. 'We're thieves in a world that don't want us no more.'", "'Maybe when your mother's finished mourning your father, I'll keep her in black on your behalf.'", "'You didn't have to make me do this.'"],
        threatDefeatedAnimal: ["He sketches the fallen {enemyName} in his journal. 'A fine specimen.'", "'Just part of the food chain, I suppose.'", "'Well... that's that, then.' He looks sadly at the animal.", "'Rest now, friend.'"],
        goldFound: ["'Just a bit more, and we're off to Tahiti.' He finds {goldAmount} Gold.", "'All I'm saying is... there's always a goddamn train.'", "'One more score, and we're gone.'"],
        playerDamage: ["Takes a hit. 'Sure.'", "A racking cough echoes. 'I'm afraid.'", "He grimaces. 'Vengeance is an idiot's game.'"],
        laudanumAbuse: ["He takes a swig. 'Just need to clear my head.'", "'Helps with the cough.'", "'This is all a big joke to you, ain't it?'"],
        equipCheatItem: {
          'item_rifle_arthur': ["He slings the rifle over his shoulder. 'Let's ride.'"]
        },
        useCheatItem: {
          'item_rifle_arthur': ["He cleans his rifle with practiced hands. 'This has been a good friend to me.'"],
          'custom_arthur_journal': ["He takes a moment to write in his journal, sketching the landscape."]
        }
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
        { id: 'item_six_shooter_rooster', name: "Rooster's Colt Dragoon", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A heavy, reliable revolver. Smells of whiskey.", sellValue: 20, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_rooster_whiskey', name: "Bottle of Whiskey", type: 'Provision', effect: { type: 'heal', amount: 8 }, description: "Liquid courage for medicinal purposes. Heal 8 HP and draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'provision_laudanum_t1', immediateEffect: { type: 'draw', amount: 2 } },
      ],
      catchphrases: {
        playerAttackHuman: ["'Fill your hand, you son of a bitch!'", "'I can do nothin' for you, son.'", "'I call that bold talk for a one-eyed fat man!'"],
        playerAttackAnimal: ["'Damn varmint!' He fires his Colt.", "'Get outta here, you beast!'", "He drunkenly takes aim at the creature. 'Hold still now...'"],
        threatDefeatedHuman: ["He takes a pull from his flask. 'I'm a Rooster, not a chicken!'", "'Baby sister, I was born game and I intend to go out that way.'", "'You can't serve papers on a rat.'"],
        threatDefeatedAnimal: ["He looks at the fallen animal. 'Well, that's that.' He takes a drink.", "'Waste of a good bullet.'", "He spits. 'Nasty critter.'"],
        playerDamage: ["Takes a hit. 'I'm a-comin', Ned!'", "'They told me you had grit.'", "'This is the real thing!'"],
        laudanumAbuse: ["He chases the laudanum with a swig of whiskey. 'That's got a bite!'", "'By God! That's a brave sight! The far shore!'"],
        goldFound: ["Finds {goldAmount} gold. 'Time is short, and I've got a job to do.'", "'That's a tall drink of water.'"],
        equipCheatItem: {
          'item_six_shooter_rooster': ["He holsters the big Colt Dragoon. 'A man with a gun is a citizen. A man without is a subject.'"]
        },
        useCheatItem: {
          'custom_rooster_whiskey': ["He takes a long pull from the whiskey bottle. 'By God! She's a brave sight!'"],
          'item_six_shooter_rooster': ["He fires the big Colt. The recoil nearly knocks him over."]
        }
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
        { id: 'item_six_shooter_roland1', name: "Sandalwood Revolver", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "One of a pair, forged from the steel of Excalibur. It has seen other worlds.", sellValue: 50, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'item_six_shooter_roland2', name: "Sandalwood Revolver", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "The other of a pair. The wood grips are worn smooth from use.", sellValue: 50, isCheat: true, illustrationId: 'item_six_shooter_t1' },
      ],
      catchphrases: {
        playerAttackHuman: ["'I do not aim with my hand; he who aims with his hand has forgotten the face of his father. I aim with my eye.'", "'I do not shoot with my hand; I shoot with my mind.'", "'I do not kill with my gun; I kill with my heart.'", "'Ka is a wheel, and your part in it is over.'"],
        playerAttackAnimal: ["'Creatures of the thinny... It must be sent back.'", "'The world has moved on. So should you.' He attacks the beast.", "His revolvers bark, ending the creature's strange journey.", "'It is not my quarry, but it is in my path.'"],
        threatDefeatedHuman: ["The {enemyName} has forgotten the face of their father.", "'Go then, there are other worlds than these.'", "'First comes smiles, then lies. Last is gunfire.'", "'The Tower is closer now.'"],
        threatDefeatedAnimal: ["He looks at the fallen beast, a strange creature of this broken world. 'Ka is a wheel.'", "The animal is dispatched. He feels no remorse, only a vast emptiness.", "He reloads. The beast was just another test on his path to the Tower.", "'The world has moved on. It produces only monsters now.'"],
        laudanumAbuse: ["He takes the 'demon's medicine'. 'Ka is a wheel.'", "The bitter taste reminds him of Tull, of loss."],
        playerDamage: ["He takes the hit. 'The world has moved on.'", "'There will be water if God wills it.'", "'Long days and pleasant nights.'"],
        playerHeal: ["'Ka-tet. One from many.'", "'I have been a gunslinger, a paladin, a lonely man of the blood.'"],
        equipCheatItem: {
          'item_six_shooter_roland1': ["He holsters one of the Sandalwood guns. 'I am the last.'"],
          'item_six_shooter_roland2': ["He checks the action on the second Sandalwood revolver. 'Ka is a wheel.'"]
        },
        useCheatItem: {
          'item_six_shooter_roland1': ["The revolver, ancient and heavy, barks its deadly song."],
          'item_six_shooter_roland2': ["He reloads with impossible speed."]
        }
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
        { id: 'item_six_iron_mib', name: "LeMat Revolver", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A custom revolver for a man who gets what he wants.", sellValue: 30, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_mib_maze', name: "The Maze", type: 'Action', effect: { type: 'draw', amount: 3 }, description: "This game is meant for you. Draw 3 cards.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_treasure_map' }
      ],
      catchphrases: {
        playerAttackHuman: ["'This world is a story. And I'm here to write my own ending.'", "'The game begins now.'", "'Have you ever questioned the nature of your reality?'", "'Winning doesn't mean anything unless someone else loses.'"],
        playerAttackAnimal: ["'Just another pawn in the game.' He attacks the beast.", "'Even the animals in this world play their part.'", "He smiles cruelly as he takes aim at the creature.", "'Predictable.'"],
        threatDefeatedHuman: ["'Doesn't look like anything to me.'", "The {enemyName} was just another host on a loop.", "'Some people choose to see the ugliness in this world. The disarray. I choose to see the beauty.'", "'This world is a fiction, one we tell ourselves over and over.' The {enemyName} was just a part of the story."],
        threatDefeatedAnimal: ["The beast falls. 'It had its part to play. And now it's done.'", "'Doesn't look like anything to me.'", "He looks at the fallen animal. 'Another meaningless death in a meaningless world.'", "'A minor character written out of the script.'"],
        playerDamage: ["He takes the hit, a flicker of a smile on his face. 'I'm not the hero.'", "'The maze wasn't meant for you.'", "'Revenge is just a different prayer at a different altar, and I am answered.'"],
        goldFound: ["'You can't play God without being acquainted with the devil.'", "'The stakes are very high.'"],
        itemBought: ["He buys the {itemName}. 'A little souvenir of my stay.'", "'Everything is code.'"],
        equipCheatItem: {
          'item_six_iron_mib': ["The heavy revolver feels comfortable in his hand. 'A tool of the trade.'"]
        },
        useCheatItem: {
          'custom_mib_maze': ["'This game is meant for you.' He draws two cards from the Maze."],
          'item_six_iron_mib': ["The LeMat Revolver fires with a deafening roar."]
        }
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
        { id: 'item_hunting_rifle_angel', name: "Angel Eyes' Rifle", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A rifle for seeing jobs through to the end.", sellValue: 25, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_angel_knife', name: "Bowie Knife", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "For close work.", sellValue: 10, isCheat: true, illustrationId: 'item_sharp_knife_t1' },
      ],
      catchphrases: {
        playerAttackHuman: ["'When I'm paid, I always see the job through.'", "'Even a filthy beggar like that has a price.'", "'It's a dirty job, but someone has to do it.'"],
        playerAttackAnimal: ["'This is not in the contract, but it is an obstacle.'", "'A distraction from the real prize.'", "He dispatches the beast with cold efficiency."],
        threatDefeatedHuman: ["The bounty is collected. 'Such ingratitude, after all the times I've saved your life.'", "'I like to get my information from the original source.'", "He collects the bounty. 'A job's a job.'"],
        threatDefeatedAnimal: ["The animal is dispatched. 'A waste of time and a bullet.'", "'The job is done.' He reloads.", "He doesn't spare a glance for the fallen beast."],
        goldFound: ["Finds {goldAmount} Gold. 'It's a small world.'", "'I'm a man of business.' Finds {goldAmount} Gold."],
        playerDamage: ["'You're a soldier. You know what I'm talking about.'", "'I bet you've got a lot of friends.'"],
        itemBought: ["'I'll pay you a thousand dollars. I think that's a handsome price.'", "'Another beautiful friendship.'"],
        equipCheatItem: {
          'item_hunting_rifle_angel': ["He checks the sight on his rifle. 'A professional's tool.'"],
          'custom_angel_knife': ["The big knife feels solid. 'For close work.'"]
        },
        useCheatItem: {
          'item_hunting_rifle_angel': ["The rifle shot is clean, professional."],
          'custom_angel_knife': ["A quick, brutal slash from the bowie knife."]
        }
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
        { id: 'item_six_shooter_ruth', name: "The Hangman's Revolver", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "This gun has seen its share of bounties brought to justice.", sellValue: 20, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_ruth_warrant', name: "Bounty Warrant", type: 'Item', effect: { type: 'gold', amount: 50 }, description: "A legal document worth a pretty penny when cashed in.", sellValue: 50, isCheat: true, illustrationId: 'generic_bounty_proof' }
      ],
      catchphrases: {
        playerAttackHuman: ["'Got me a bounty worth ten thousand dollars!'", "'No one said this job was supposed to be easy.'", "'When the handbill says 'dead or alive', the rest of us shoot you in the back from up on top of a perch somewhere and bring you in dead over a saddle.'", "'You only need to hang mean bastards, but mean bastards you need to hang!'"],
        playerAttackAnimal: ["'Damn varmints!' He fires his revolver at the beast.", "'Get out of my way, you creature!'", "He attacks the animal. 'This is no place for beasts.'"],
        threatDefeatedHuman: ["'Justice delivered... ain't the same as justice served.'", "'Another one for the gallows.'", "'When I get to Red Rock, that {enemyName}'s gonna hang.'"],
        threatDefeatedAnimal: ["He looks at the fallen animal. 'Just a dumb beast. Not worth a bounty.'", "'That's one less pest to worry about.'", "He spits. 'Nasty creature.'"],
        playerDamage: ["'I'm taking you to hang, and that's the way it's gonna be.'", "'Well, that's the problem with old men. You can't depend on 'em.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A man's gotta make a living.'", "'This country's goin' to the dogs.'"],
        itemBought: ["'A man's gotta have the right tools for the job.'"],
        equipCheatItem: {
          'item_six_shooter_ruth': ["He holsters the Hangman's Revolver. 'This'll bring 'em in.'"]
        },
        useCheatItem: {
          'custom_ruth_warrant': ["He cashes in the Bounty Warrant. 'Justice is served... and paid for.'"],
          'item_six_shooter_ruth': ["The Hangman's Revolver barks, another step closer to justice."]
        }
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
        { id: 'item_six_iron_earp', name: "Buntline Special", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A long-barreled revolver for a long-tailed lawman.", sellValue: 30, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_earp_badge', name: "U.S. Marshal Badge", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 2, persistent: true }, description: "This badge ain't just for show.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_lucky_bullet' }
      ],
      catchphrases: {
        playerAttackHuman: ["'You tell 'em I'm comin'! And hell's comin' with me!'", "'You called down the thunder, well now you've got it!'", "'Skin that smoke-wagon and see what happens.'", "'Are you gonna do somethin' or just stand there and bleed?'"],
        playerAttackAnimal: ["'Get out of this town, you damn beast!' He fires his Buntline.", "'The law applies to man and beast alike.' He attacks the creature.", "He takes aim at the animal. 'This is for the good of the town.'"],
        threatDefeatedHuman: ["'The law is coming. You tell 'em I'm coming!'", "'You're a daisy if you do!'", "'It's not revenge he's after. It's a reckoning.'", "'The law is satisfied.'"],
        threatDefeatedAnimal: ["He holsters his weapon. 'Just another stray.'", "The animal is put down. 'This town is a little safer now.'", "He looks at the beast. 'Order must be maintained.'"],
        playerDamage: ["He takes a hit. 'I'm your huckleberry.' (Wait, that's the other guy...)", "'I'm a peaceable man... but I won't be pushed.'", "'They got my brother... they'll get what's comin' to 'em.'"],
        goldFound: ["Finds {goldAmount} Gold. 'For a man who's got everything, you're a pretty poor specimen.'"],
        itemBought: ["Buys the {itemName}. 'I'm a peaceable man. But I won't be pushed.'"],
        equipCheatItem: {
          'item_six_iron_earp': ["The Buntline Special feels heavy and solid. 'Time for a reckoning.'"],
          'custom_earp_badge': ["He polishes the Marshal Badge. 'The law is coming.'"]
        },
        useCheatItem: {
          'item_six_iron_earp': ["The long barrel of the Buntline barks its final judgment."]
        }
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
        { id: 'item_rifle_oakley', name: "Sharpshooter's Rifle", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A light, accurate rifle. It never misses.", sellValue: 30, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'custom_oakley_medal', name: "Exhibition Medal", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'firearm_boost', amount: 3, persistent: true }, description: "A medal for marksmanship. It brings a steady hand.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_lucky_bullet' },
      ],
      catchphrases: {
        playerAttackHuman: ["'I'm not just a showgirl.' She takes aim at the man.", "'This is no exhibition.' She fires at the man.", "'Anything you can do, I can do better.'", "'I don't miss.'"],
        playerAttackAnimal: ["'A moving target is the best kind of target.' She takes aim at the beast.", "'This one will make a fine trophy.' She fires at the animal.", "'Aim at a high mark and you will hit it.'", "'Hold still now, darling.'"],
        threatDefeatedHuman: ["'I ain't afraid to love a man. I ain't afraid to shoot him either.'", "'My rifle is my best friend.'", "'I was a sure shot.'", "'The performance is over.'"],
        threatDefeatedAnimal: ["A perfect shot. 'That's how it's done.'", "'This will look good on the wall.'", "She reloads. 'Another successful hunt.'", "'A fine trophy.'"],
        playerDamage: ["'I've been in more exhibitions than you've had hot dinners.'", "'The show must go on.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A little something for my trouble.'", "'The wages of a performer.'"],
        itemBought: ["'A new prop for the show.'", "'This will add a little something to my act.'"],
        equipCheatItem: {
          'item_rifle_oakley': ["The rifle feels light and balanced in her hands. 'Perfect.'"],
          'custom_oakley_medal': ["She pins the medal to her coat. 'A reminder of my skill.'"]
        },
        useCheatItem: {
          'item_rifle_oakley': ["The Sharpshooter's Rifle fires true, another bullseye."]
        }
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
        { id: 'item_sawed_off_ash', name: "Boomstick", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A twelve-gauge, double-barreled Remington. S-Mart's top of the line.", sellValue: 20, isCheat: true, illustrationId: 'item_sawed_off_t1_sh' },
        { id: 'item_sharp_knife_ash', name: "Chainsaw Hand", type: 'Item', effect: { type: 'weapon', attack: 11, subtype: 'sword' }, description: "Groovy.", sellValue: 20, isCheat: true, illustrationId: 'item_sharp_knife_t2_sh' },
      ],
      catchphrases: {
        playerAttackHuman: ["'Look, pal, you ain't leadin' but two things right now: Jack and shit. And Jack left town.'", "'You primitive screwheads!'", "'Good. Bad. I'm the guy with the gun.' He attacks."],
        playerAttackAnimal: ["'What're you? Some kinda mutated squirrel?'", "'Get back to the pet cemetery, Fido!'", "'Come get some!' He attacks the beast.", "'Swallow this!'"],
        threatDefeatedHuman: ["'Alright you primitive screwheads, listen up!' The man is defeated.", "'That's it. I'm outta here.' The man is down.", "'Who's laughin' now? Huh? Who's laughin' now?!'"],
        threatDefeatedAnimal: ["'Groovy.' The animal is dispatched.", "'Just another Deadite... or whatever you are.'", "'Who's laughin' now? Huh? Who's laughin' now?!'"],
        playerAttackHorror: ["'Yo, she-bitch! Let's go!'", "'Swallow this!'"],
        playerDamage: ["'Swallow this!' He takes {damageAmount} damage.", "'Look, maybe I didn't say every single little tiny syllable, no. But basically I said them, yeah.'", "'Workshed.' Takes {damageAmount} damage."],
        itemBought: ["He buys the {itemName}. 'Shop smart. Shop S-Mart.'", "'Yeah... that's right. Who's laughin' now?'"],
        playerHeal: ["Heals for {healAmount}. 'First you wanna kill me, now you wanna kiss me.'"],
        equipCheatItem: {
          'item_sawed_off_ash': ["He checks the shells in the Boomstick. 'Hail to the king, baby.'"],
          'item_sharp_knife_ash': ["He revs the chainsaw. 'Groovy.'"]
        },
        useCheatItem: {
          'item_sawed_off_ash': ["The Boomstick fires with a thunderous clap."],
          'item_sharp_knife_ash': ["The roar of the chainsaw fills the air."]
        }
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
        { id: 'custom_durst_cap', name: "Red Yankee Cap", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 6, persistent: true }, description: "A backwards baseball cap. For when you just wanna break stuff.", sellValue: 7, isCheat: true, illustrationId: 'upgrade_squirrel_fur_cap_cp' },
        { id: 'custom_durst_water', name: "Hot Dog Flavored Water", type: 'Provision', effect: { type: 'heal', amount: 6 }, description: "It's all about the he-said she-said. Heals 6 HP and lets you draw 2 cards.", sellValue: 1, isCheat: true, illustrationId: 'provision_laudanum_t1', immediateEffect: { type: 'draw', amount: 2 } }
      ],
      catchphrases: {
        playerAttackHuman: ["'I'll skin your ass raw!' He attacks the man!", "'Give me somethin' to break!' He lunges at the human.", "'It's all about the he-said, she-said bullshit!' He attacks."],
        playerAttackAnimal: ["'What's this fuzzy thing?' He attacks the beast.", "'Get outta my way, you... thing!'", "'Keep rollin', rollin', rollin', rollin' (WHAT?)' He attacks the animal."],
        threatDefeatedHuman: ["'You can take that cookie... and stick it up your, YEAH!' The man is defeated.", "'Now I know y'all be lovin' this shit right here.' The human is gone.", "Another one bites the dust. 'And the winner is... LIMP BIZKIT!'"],
        threatDefeatedAnimal: ["The beast is gone. 'My way or the highway.'", "'That was... weird.'", "'I did it all for the nookie.' The animal is defeated."],
        playerDamage: ["Takes {damageAmount} damage. 'It's just one of those days...'", "He takes a hit. 'Everything is fucked up and everybody sucks.'", "Hit for {damageAmount}. 'I think you better quit lettin' shit slip out your mouth!'"],
        goldFound: ["'I did it all for the nookie.' He pockets {goldAmount} Gold.", "'Lookin' for the cash flow.' Finds {goldAmount} Gold.", "Another {goldAmount} Gold. 'I'm a rockstar.'"],
        itemBought: ["Buys the {itemName}. 'Another platinum record on the wall.'", "'This is my generation.'"],
        laudanumAbuse: ["He downs the bottle. 'Feelin' like a freight train...'", "'I pack a chainsaw... I'll skin your ass raw!'", "'I'm a psycho... a port-a-potty.' He takes a drink."],
        equipCheatItem: {
          'custom_durst_cap': ["He turns his Red Yankee Cap backwards. 'It's time to break some stuff.'"]
        },
        useCheatItem: {
          'custom_durst_water': ["He chugs the Hot Dog Flavored Water. 'It's all about the he-said she-said.'"]
        }
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
        { id: 'item_rifle_robocop', name: "Auto-9", type: 'Item', effect: { type: 'weapon', attack: 13 }, description: "A machine pistol with a three-round burst. Highly effective.", sellValue: 40, isCheat: true, illustrationId: 'item_six_iron_t2_cp' },
        { id: 'custom_robocop_armor', name: "OCP Armor", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 3, persistent: true, max_health: 7 }, description: "Titanium armor with Kevlar laminate. Increases Max Health by 7 and reduces incoming damage by 3.", sellValue: 30, isCheat: true, illustrationId: 'upgrade_iron_will_cp' },
      ],
      catchphrases: {
        playerAttackHuman: ["'Your move, creep.'", "'Dead or alive, you're coming with me.'", "'Come quietly or there will be... trouble.'", "'You are under arrest.'", "'Serve the public trust. Protect the innocent. Uphold the law.'"],
        playerAttackAnimal: ["'Unidentified biological entity. Cease hostility.'", "'You are in violation of park regulations. I am authorized to use physical force.'", "'Threat level: minimal.' He engages the creature."],
        threatDefeatedHuman: ["'Thank you for your cooperation.'", "'Stay out of trouble.'", "'Justice is served.'", "'You are terminated.'"],
        threatDefeatedAnimal: ["'Biological threat neutralized. Resuming patrol.'", "'Animal control has been notified.'", "'Area secured.'"],
        playerDamage: ["The shot sparks off his armor. 'Your programming is inferior.'", "'My programming is a little sensitive.'", "'Directive 4: Classified.'"],
        itemBought: ["Acquiring {itemName}. 'This will serve a law enforcement function.'", "'This unit is now equipped with the {itemName}.'"],
        goldFound: ["Finds {goldAmount} Gold. 'Seized as evidence.'"],
        equipCheatItem: {
          'item_rifle_robocop': ["The Auto-9 emerges from his thigh holster. 'Ready.'"],
          'custom_robocop_armor': ["He equips the OCP armor. 'My directives are clear.'"]
        },
        useCheatItem: {
          'item_rifle_robocop': ["The Auto-9 fires a three-round burst with mechanical precision."]
        }
      }
    },
  },
  // --- EXPLORER ---
  {
    name: "philip j fry",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 93,
      addMaxHealth: 0,
      addCustomCards: [
        { id: 'custom_fry_jacket', name: "Red Bomber Jacket", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 8, persistent: true }, description: "A super sweet jacket. Red. It's not armor, but it makes you feel a little tougher.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_plain_duster_t2_cp' },
        { id: 'custom_fry_tonic', name: "Can of Slurm", type: 'Provision', effect: { type: 'heal', amount: 4 }, description: "It's highly addictive! Heals 4 HP and lets you draw 3 cards.", sellValue: 1, isCheat: true, illustrationId: 'custom_fry_tonic', immediateEffect: { type: 'draw', amount: 3 }},
        { id: 'custom_fry_clover', name: "Seven-Leaf Clover", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 10, persistent: true }, description: "Brings 20th-century luck to this backwards time period. Increases sell value of all items by 10.", sellValue: 777, isCheat: true, illustrationId: 'custom_fry_clover' }
      ],
      catchphrases: {
        playerAttackHuman: ["'I'm not a fighter! I'm a delivery boy!'", "'Wooo!' He flails wildly.", "'Hey, you're not a robot! Or a brain!'"],
        playerAttackAnimal: ["'Aww, it's like a fuzzy little potato... a mean, fuzzy potato!'", "'Maybe it just wants a hug! Oh, nope, definitely biting!'", "'Scruffy! The janitor on Mars!'"],
        threatDefeatedHuman: ["'I did a thing!'", "'Sweet zombie Jesus, it worked!'", "'Whoa, I'm a hero! I think?'", "'Is he dead? Or just sleeping with his eyes open?'"],
        threatDefeatedAnimal: ["'Sorry, little guy! You were just too bitey.'", "'I'm a monster! A monster who needs this pelt for... reasons.'", "'I'm walking on sunshine!'"],
        playerDamage: ["'Ow, my sperm!'", "'My only regret is... that I have... boneitis.'", "'I'm bleeding! Wait... that's just jam from my pocket.'"],
        goldFound: ["'I'm rich! I can buy a million cans of Slurm!'", "'A hundred dollars! That's like, a hundred things!'", "'I'm a hundredaire!'"],
        itemBought: ["'Shut up and take my money!'", "'Neat!' *click*"],
        laudanumAbuse: ["'Whoa, I can see the music!'", "'My hands... they can touch everything but themselves... oh wait.'", "'I'm walking on sunshine!'"],
        equipCheatItem: {
          'custom_fry_jacket': ["'Sweet. A jacket.'"],
          'custom_fry_clover': ["'My seven-leaf clover! This should bring me some luck!'"]
        },
        useCheatItem: {
          'custom_fry_tonic': ["He cracks open the Slurm. 'It's highly addictive!'", "'Ahhh, Slurm. The cause of, and solution to, all of life's problems.'"]
        }
      }
    },
  },
  {
    name: "tuco ramirez",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 50,
      addMaxHealth: 2,
      addCustomCards: [
        { id: 'custom_tuco_noose', name: "Tuco's Noose", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A rope that's seen better days, and worse necks.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_bandolier_t1' },
        { id: 'custom_tuco_supplies', name: "Stolen Supplies", type: 'Provision', effect: { type: 'heal', amount: 8 }, description: "Liberated from a less-deserving owner.", sellValue: 1, isCheat: true, illustrationId: 'provision_hardtack' }
      ],
      catchphrases: {
        playerAttackHuman: ["'When you have to shoot, shoot. Don't talk.'", "'I'll kill you for that!'", "'There are two kinds of spurs, my friend. Those that come in by the door, and those that come in by the window.'"],
        playerAttackAnimal: ["'Stupid animal!'", "'Get away from me, you beast!'", "'I'll make a stew out of you!'", "'You are a dumb beast!'"],
        threatDefeatedHuman: ["'Blondieee! You know what you are?! Just a dirty son-of-a-b-!'", "'The Good, the Bad, and me.' The Ugly one wins.", "'If you work for a living, why do you kill yourself working?'"],
        threatDefeatedAnimal: ["The Ugly one wins. 'Ugly animal!'", "'Hah! Not so tough now!'", "'Maybe I can sell this skin.'"],
        playerDamage: ["'You pig! You're the son of a thousand fathers!'", "'Hey, Blondie! You want to know my name?'", "He takes a hit. 'You are the son of a thousand fathers!'"],
        goldFound: ["'If you're going to shoot, shoot! Don't talk!' He grabs the {goldAmount} Gold.", "'I'm looking for the gold, Blondie! The gold!'"],
        equipCheatItem: {
          'custom_tuco_noose': ["He slings the noose over his shoulder. 'This has saved my neck more than once.'"]
        },
        useCheatItem: {
          'custom_tuco_supplies': ["He quickly eats the Stolen Supplies. 'A man's gotta eat.'"],
          'custom_tuco_noose': ["The noose whips out with surprising speed."]
        }
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
        { id: 'custom_crockett_rifle', name: "Old Betsy", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "A trusty rifle that's seen the far side of the frontier.", sellValue: 25, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_crockett_cap', name: "Coonskin Cap", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_negation', max_health: 6, persistent: true }, description: "King of the Wild Frontier.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_raccoon_skin_hat' },
      ],
      catchphrases: {
        playerAttackHuman: ["'Be sure you're right, then go ahead.' He attacks the man.", "'I'm half-horse, half-alligator and a little attached with a snapping turtle.' He attacks the human.", "'I can whip my weight in wildcats.' He attacks the man."],
        playerAttackAnimal: ["He grins. 'Killed him a bear when he was only three.' He attacks the beast.", "'I'm a hunter, a warrior, and a pioneer.' He attacks the animal.", "'This one's for the pot.'"],
        threatDefeatedHuman: ["'We're not just fighting for ourselves, but for all our kin.'", "'Let your tongue speak what your heart thinks.' The man is silent now.", "'May the Lord have mercy on your soul.'"],
        threatDefeatedAnimal: ["He grins. 'Killed him a bear when he was only three.' The beast is down.", "'The land provides.'", "'A fine trophy.'"],
        itemTaken: ["'This will be useful on the trail.'", "'The land provides.'", "'A fine specimen.'"],
        playerDamage: ["'Heaven is a great deal bigger than the earth.'", "'Let your tongue speak what your heart thinks.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A little something for the journey.'", "'This will help me on my way.'"],
        equipCheatItem: {
          'custom_crockett_rifle': ["He shoulders Old Betsy. 'A good rifle is a good friend.'"],
          'custom_crockett_cap': ["He puts on the Coonskin Cap. 'King of the wild frontier.'"]
        },
        useCheatItem: {
          'custom_crockett_rifle': ["Old Betsy barks with authority."]
        }
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
        { id: 'custom_lewis_journal', name: "Lewis's Journal", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 4, persistent: true }, description: "A detailed account of the flora and fauna of the West.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' },
        { id: 'custom_lewis_scout', name: "Corps of Discovery", type: 'Action', effect: { type: 'scout' }, description: "Charting the unknown territory ahead reveals new opportunities. Scout and draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead', immediateEffect: { type: 'draw', amount: 2 } }
      ],
      catchphrases: {
        playerAttackHuman: ["'An obstacle to the expedition.' He attacks the man.", "'We proceed on.'", "'A regrettable but necessary action.'"],
        playerAttackAnimal: ["'A new species for the journal.' He attacks the beast.", "'Most extraordinary!' He attacks the animal.", "'For the purposes of scientific discovery.'"],
        threatDefeatedHuman: ["'The country is, as it were, motionless and silent.' The man is defeated.", "'This will be noted in the log.'", "'The path is now clear to proceed.'"],
        threatDefeatedAnimal: ["'The country is, as it were, motionless and silent.' The beast is defeated.", "'A specimen for the collection.'", "'Its temperament was... hostile.'"],
        itemTaken: ["'A specimen for the collection.'", "'This will be documented in the journal.'", "'Most extraordinary!'"],
        playerDamage: ["'This is an arduous journey.'", "'We must be vigilant.'"],
        playerHeal: ["'The men are in good spirits.'", "'A moment's rest before we proceed on.'"],
        equipCheatItem: {
          'custom_lewis_journal': ["He equips his Journal. 'For the purposes of scientific discovery.'"]
        },
        useCheatItem: {
          'custom_lewis_scout': ["He uses his knowledge as a guide to find the safest path."],
          'custom_lewis_journal': ["He makes an entry in his journal about a new discovery."]
        }
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
        { id: 'custom_clark_map', name: "Clark's Map", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 8, persistent: true }, description: "A masterfully drawn map of the new frontier.", sellValue: 15, isCheat: true, illustrationId: 'upgrade_treasure_map' },
        { id: 'item_six_shooter_clark', name: "Clark's Revolver", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A reliable sidearm for a cartographer in a dangerous land.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' }
      ],
      catchphrases: {
        playerAttackHuman: ["'A necessary action for the expedition.' He attacks the man.", "'Hostile natives. A regrettable necessity.'", "'We must clear a path.'"],
        playerAttackAnimal: ["'A dangerous beast. It must be put down for the safety of the corps.'", "'Another specimen for the record.' He attacks the animal.", "'We cannot allow it to impede our progress.'"],
        threatDefeatedHuman: ["'Another landmark noted.'", "'This will be an important entry on the map.' The man is defeated.", "'The way forward is secure.'"],
        threatDefeatedAnimal: ["'Another landmark noted.'", "'This will be an important entry on the map.' The beast is defeated.", "'The specimen has been... collected.'"],
        playerHeal: ["'The men are in good spirits.'", "'A moment's rest before we proceed on.'"],
        playerDamage: ["'The terrain is difficult, but we will persevere.'", "'A small setback.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A resource for the expedition.'"],
        equipCheatItem: {
          'custom_clark_map': ["He consults his map. 'The path is clear.'"],
          'item_six_shooter_clark': ["The revolver is a necessary tool for this dangerous work."]
        },
        useCheatItem: {
          'item_six_shooter_clark': ["His revolver fires, a grim necessity for the expedition."]
        }
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
        { id: 'custom_musashi_katana_1', name: "Musashi's Katana", type: 'Item', effect: { type: 'weapon', attack: 11, subtype: 'sword' }, description: "One of a pair. The Way of the warrior is the resolute acceptance of death.", sellValue: 20, isCheat: true, illustrationId: 'item_katana_t1_fj' },
        { id: 'custom_musashi_katana_2', name: "Musashi's Wakizashi", type: 'Item', effect: { type: 'weapon', attack: 9, subtype: 'sword' }, description: "The companion blade. To know the Way is to see it in all things.", sellValue: 15, isCheat: true, illustrationId: 'item_wakizashi_t1_fj' },
      ],
      catchphrases: {
        playerAttackHuman: ["'There is nothing outside of yourself.' He strikes the man with two blades.", "The Way of the warrior is the resolute acceptance of death. He attacks the human.", "'In battle, if you make your opponent flinch, you have already won.' He attacks the man."],
        playerAttackAnimal: ["'To know ten thousand things, know one well.' He attacks the beast.", "'Even a beast has its place in the world... but not here.' He attacks the animal.", "'The Way is in training.' He attacks the creature."],
        threatDefeatedHuman: ["'Do nothing that is of no use.' The {enemyName} was of no use.", "'Perceive that which cannot be seen with the eye.' The man is gone.", "'You can only fight the way you practice.' The human is defeated."],
        threatDefeatedAnimal: ["'The only reason a warrior is alive is to fight, and the only reason a warrior fights is to win.' The beast is defeated.", "'The Way is in all things.' He looks at the fallen animal.", "The creature's struggle is over. 'All things are one.'"],
        playerDamage: ["He takes the blow. 'To know ten thousand things, know one well.'", "'Today I am victorious over myself of yesterday.'"],
        playerHeal: ["He binds his wounds. 'The path is long.'"],
        itemBought: ["'The sword has no master but the soul.'"],
        equipCheatItem: {
          'custom_musashi_katana_1': ["He draws his twin blades. 'The Way is in training.'"],
          'custom_musashi_katana_2': ["He draws his twin blades. 'The Way is in training.'"]
        },
        useCheatItem: {
          'custom_musashi_katana_1': ["His two blades move like a whirlwind of steel."],
          'custom_musashi_katana_2': ["His two blades move like a whirlwind of steel."]
        }
      }
    },
  },
  {
    name: "jin sakai",
    requiredCharacterId: 'explorer',
    effects: {
      addGold: 50,
      increaseDifficulty: 1,
      addMaxHealth: 1,
      addCustomCards: [
        { id: 'custom_sakai_armor', name: "Sakai Clan Armor", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 12, persistent: true }, description: "The iconic armor of the Sakai clan. A symbol of strength and defiance. Increases Max Health by 12 and its strong plating offers some protection from blows.", sellValue: 40, isCheat: true, illustrationId: 'upgrade_bearskin_coat_fj' },
        { id: 'custom_sakai_katana', name: "Sakai Clan Katana", type: 'Item', effect: { type: 'weapon', attack: 12, subtype: 'sword' }, description: "The storm is coming.", sellValue: 30, isCheat: true, illustrationId: 'item_katana_t1_fj' },
        { id: 'custom_sakai_tanto', name: "Ghost's Tanto", type: 'Item', effect: { type: 'weapon', attack: 8, subtype: 'sword' }, description: "For when honor is not enough.", sellValue: 15, isCheat: true, illustrationId: 'item_knife_t1_fj' },
      ],
      catchphrases: {
        playerAttackHuman: ["'I am the Ghost.' He attacks the man.", "'You have no honor.' He attacks the human.", "'For the people of Tsushima!' He attacks the man.", "'My storm will claim you.'"],
        playerAttackAnimal: ["'The spirits of the forest are angry.' He attacks the beast.", "'Even the beasts of this island suffer.' He attacks the animal.", "'A necessary evil.' He attacks the creature.", "'This is for your own good.'"],
        threatDefeatedHuman: ["'Honor died on the beach.' The {enemyName} is defeated.", "He cleans his blade. 'The Ghost will haunt you.'", "'I will not be a slave to my past.' The man is gone.", "'You are not a warrior. You are a coward.'"],
        threatDefeatedAnimal: ["The animal is at peace. 'The forest is quiet now.'", "'Another victim of the invasion.' He looks at the fallen beast.", "'May your spirit find peace.'"],
        playerHeal: ["He takes a moment to reflect. 'A new haiku...'", "'I must find my uncle.'", "'The wind guides me.'"],
        playerDamage: ["'I am not your son. I am the Ghost.'", "'I have been a samurai my entire life.'"],
        itemTaken: ["'This will aid my cause.'", "'The people of Tsushima thank you.'"],
        equipCheatItem: {
          'custom_sakai_katana': ["He draws the Sakai blade. 'For my father.'"],
          'custom_sakai_tanto': ["The Ghost's Tanto is a tool for a new kind of war."]
        },
        useCheatItem: {
          'custom_sakai_katana': ["The Sakai blade sings a song of vengeance."],
          'custom_sakai_tanto': ["A swift, silent strike from the Ghost's Tanto."]
        }
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
        { id: 'item_elephant_gun_quatermain', name: "Quatermain's Elephant Gun", type: 'Item', effect: { type: 'weapon', attack: 13 }, description: "A heavy rifle for the biggest of game.", sellValue: 40, isCheat: true, illustrationId: 'item_elephant_gun_t1_as' },
        { id: 'custom_quatermain_map', name: "Map to King Solomon's Mines", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 20, persistent: true }, description: "A map to legendary riches.", sellValue: 50, isCheat: true, illustrationId: 'upgrade_treasure_map_as' }
      ],
      catchphrases: {
        playerAttackHuman: ["He levels his elephant gun. 'There is no hunting like the hunting of man.'", "'The league of extraordinary gentlemen send their regards.' He attacks the man.", "'A messy business, this.' He attacks the human."],
        playerAttackAnimal: ["He levels his elephant gun. 'Steady now.' He attacks the beast.", "'A fine specimen for the hunt.' He attacks the animal.", "'For the glory of the hunt.' He attacks the creature."],
        threatDefeatedHuman: ["The hunt is over. 'Time for a smoke.' The man is defeated.", "'I've seen things that would make a hyena vomit.' The human is gone.", "'Another one for the books.'"],
        threatDefeatedAnimal: ["He consults his map. 'The diamond mines of King Solomon await!' The beast is dispatched.", "'A fine trophy.' The animal is defeated.", "'The savanna is a little quieter now.'"],
        goldFound: ["'For a map, this is proving quite profitable.' Finds {goldAmount} Gold."],
        laudanumAbuse: ["'A gentleman's vice.' He takes a dose to steady his nerves, though they are already quite steady."],
        playerDamage: ["'The jungle has its price.'", "'Just a scratch. The trick is not to bleed.'"],
        equipCheatItem: {
          'item_elephant_gun_quatermain': ["He checks the action on the big rifle. 'Reliable.'"],
          'custom_quatermain_map': ["He consults the map. 'The mines can't be far.'"]
        },
        useCheatItem: {
          'item_elephant_gun_quatermain': ["The Elephant Gun roars, a sound that shakes the very trees."]
        }
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
        { id: 'item_webley_revolver_indy', name: "Indy's Revolver", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "Good for arguments where swords are involved.", sellValue: 20, isCheat: true, illustrationId: 'item_webley_revolver_t1_as'},
        { id: 'custom_indy_whip', name: "Bullwhip", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "Not just for swinging across chasms.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_bandolier_t1'}
      ],
      catchphrases: {
        playerAttackHuman: ["A quick shot from the revolver. 'Trust me.'", "'X never, ever marks the spot!' He attacks the man.", "'They're trying to kill us!' He attacks the human.", "'You want to talk to God? Let's go see him together.'"],
        playerAttackAnimal: ["He cracks his whip at the beast!", "'I'm making this up as I go!' He attacks the animal.", "'Stay back, you foul creature!'", "'I don't like animals that are bigger than me.'"],
        playerAttackSnake: ["'I hate snakes!'", "'Snakes... why did it have to be snakes?'"],
        threatDefeatedHuman: ["'That belongs in a museum!' The {enemyName} is defeated.", "'I'm making this up as I go!' The man is gone.", "'It's not the years, honey, it's the mileage.' The human is defeated.", "'No ticket.'"],
        threatDefeatedAnimal: ["He dusts off his hat. 'Nasty creature.'", "'Another one for the books.' The beast is dispatched.", "'I'm getting too old for this.'"],
        goldFound: ["He pockets the {goldAmount} Gold. 'Fortune and glory, kid. Fortune and glory.'"],
        itemTaken: ["'This should have been in a museum!' He takes the {itemName}.", "'It's a fake. You can tell by the cross-section.'"],
        playerDamage: ["'Snakes. Why'd it have to be snakes?' He takes {damageAmount} damage.", "Takes a punch. 'I hate snakes!'", "'They're trying to kill us!'"],
        laudanumAbuse: ["'This is for the mileage, not the years.'"],
        eventRevealSnake: ["'Snakes... why did it have to be snakes?'"],
        equipCheatItem: {
          'item_webley_revolver_indy': ["He holsters the revolver. 'I'm a scientist.'"],
          'custom_indy_whip': ["He coils his whip. 'Ready for anything.'"]
        },
        useCheatItem: {
          'custom_indy_whip': ["The loud CRACK of the bullwhip echoes."],
          'item_webley_revolver_indy': ["The revolver barks, a no-nonsense solution to a complex problem."]
        }
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
        { id: 'item_six_shooter_lara1', name: "Dual Pistols", type: 'Item', effect: {type: 'weapon', attack: 11}, description: "A pair of iconic pistols. For when you mean business.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'item_six_shooter_lara2', name: "Dual Pistols", type: 'Item', effect: {type: 'weapon', attack: 11}, description: "A pair of iconic pistols. For when you mean business.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' }
      ],
      catchphrases: {
        playerAttackHuman: ["'I make my own luck.' She attacks the man.", "'I've simplified your payroll.' She attacks the human.", "'From this moment, every breath you take is a gift from me.' She attacks the man."],
        playerAttackAnimal: ["With a flip and a flourish, she opens fire on the beast.", "'A survivor is born.' She attacks the animal.", "'I'm not afraid of a little competition.' She attacks the creature."],
        threatDefeatedHuman: ["'The extraordinary is in what we do, not who we are.' The {enemyName} is defeated.", "'A famous explorer once said, that the extraordinary is in what we do, not who we are.' The man is gone.", "'Well, this has been a day.'"],
        threatDefeatedAnimal: ["'Everything lost is meant to be found.' The beast is dispatched.", "'A survivor is born.' The animal is defeated.", "'Just another Tuesday.'"],
        itemTaken: ["'This belongs in a museum.' She takes the {itemName}.", "'I'm not a thief. I'm a tomb raider.'"],
        playerDamage: ["'Right. Let's get on with it then.'", "'It's not a party until something gets broken.'", "'The path to redemption is never easy.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A lady should be prepared for anything.'"],
        equipCheatItem: {
          'item_six_shooter_lara1': ["She holsters one of her pistols. 'Time to raid some tombs.'"],
          'item_six_shooter_lara2': ["She holsters one of her pistols. 'Time to raid some tombs.'"]
        },
        useCheatItem: {
          'item_six_shooter_lara1': ["A blur of motion as she draws and fires her twin pistols."],
          'item_six_shooter_lara2': ["A blur of motion as she draws and fires her twin pistols."]
        }
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
        { id: 'item_six_shooter_drake', name: "Nate's Pistol", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A well-used sidearm that's seen better days, but never fails.", sellValue: 10, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_drake_grapple', name: "Grappling Hook", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "For reaching high places, or getting out of trouble. Draw 2 cards and heal 2 HP.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead', immediateEffect: { type: 'heal', amount: 2 } }
      ],
      catchphrases: {
        playerAttackHuman: ["'Here goes nothing!' He opens fire on the man.", "'Sic Parvis Magna.' He attacks the human.", "'Look out! Grenade!' (There is no grenade) He attacks the man."],
        playerAttackAnimal: ["'Oh, crap. Monsters. Why is it always monsters?' He attacks the beast.", "'Great, now the wildlife is trying to kill me.' He attacks the animal.", "'Stay back, you overgrown hamster!' He attacks the creature."],
        threatDefeatedHuman: ["He wipes sweat from his brow. 'Well, that could've gone better.'", "'Don't you have a priceless artifact to steal?' The man is defeated.", "'Greatness from small beginnings.' The human is gone."],
        threatDefeatedAnimal: ["'Another day, another historical artifact trying to kill me.' The beast is dispatched.", "'Kitty got wet.' The animal is defeated.", "'Should have stayed in your cage.'"],
        playerDamage: ["'Oh, crap.' Takes {damageAmount} damage.", "'No, no, no!' Takes a hit.", "'I'm getting too old for this.'"],
        goldFound: ["'Kitty got wet.' Finds {goldAmount} Gold.", "'Well, look at that.'"],
        laudanumAbuse: ["'Hair of the dog.' He downs the bottle.", "'Just a little something to take the edge off... all the edges.'"],
        equipCheatItem: {
          'item_six_shooter_drake': ["He checks his pistol. 'Well, here we go again.'"]
        },
        useCheatItem: {
          'custom_drake_grapple': ["He uses the grappling hook to get a better vantage point... or just to show off."],
          'item_six_shooter_drake': ["Nate's Pistol fires. It's not fancy, but it gets the job done."]
        }
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
        { id: 'item_webley_revolver_rick1', name: "Rick's Pistol", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "One of a pair. Good for shooting mummies.", sellValue: 20, isCheat: true, illustrationId: 'item_webley_revolver_t1_as' },
        { id: 'item_webley_revolver_rick2', name: "Rick's Other Pistol", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "The other of a pair. Has more sand in it.", sellValue: 20, isCheat: true, illustrationId: 'item_webley_revolver_t2_as' },
      ],
      catchphrases: {
        playerAttackHuman: ["'Looks to me like I've got all the horses!' He attacks the man.", "'Here I come, you filthy dogs!' He attacks the human.", "'Rescue the damsel in distress, kill the bad guy, and save the world.' He attacks the man."],
        playerAttackAnimal: ["'I'll be seeing you again, I'm sure.' He attacks the beast.", "'This is not good.' He attacks the animal.", "'I'm a little rusty.' He attacks the creature."],
        threatDefeatedHuman: ["'Patience is a virtue.' The {enemyName} is finally gone.", "'Goodbye, Beni.' The man is defeated.", "'This is not good.' The human is gone."],
        threatDefeatedAnimal: ["'Think I'll get me a cup of coffee.' The beast is dispatched.", "'Another one for the history books.' The animal is defeated.", "'Just another day at the office.'"],
        playerDamage: ["'This is bad, Evy! This is really bad!' Takes {damageAmount} damage.", "'I'm a little rusty.'", "'My library card's been revoked!'"],
        itemBought: ["He buys the {itemName}. 'I am a librarian!'"],
        goldFound: ["'I've found something!' Finds {goldAmount} Gold."],
        equipCheatItem: {
          'item_webley_revolver_rick1': ["He holsters his pistol. 'Time to fight some mummies.'"],
          'item_webley_revolver_rick2': ["He holsters his pistol. 'Time to fight some mummies.'"]
        },
        useCheatItem: {
          'item_webley_revolver_rick1': ["He fires his pistol with a grin. 'I love this job.'"],
          'item_webley_revolver_rick2': ["He fires his pistol with a grin. 'I love this job.'"]
        }
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
        { id: 'custom_jensen_typhoon', name: "Typhoon System", type: 'Action', effect: { type: 'draw', amount: 3 }, description: "Explosive ordnance for crowd control. Draws 3 cards and heals 3 HP.", sellValue: 20, isCheat: true, illustrationId: 'provision_stamina_tonic_t1_cp', immediateEffect: { type: 'heal', amount: 3 } },
        { id: 'item_sharp_knife_jensen', name: "Arm Blades", type: 'Item', effect: { type: 'weapon', attack: 11, subtype: 'sword' }, description: "Retractable nanoceramic blades. Lethal and silent.", sellValue: 25, isCheat: true, illustrationId: 'item_sharp_knife_t1_cp' },
      ],
      catchphrases: {
        playerAttackHuman: ["'This is how it has to be.' He attacks the man.", "'If you want to make enemies, try to change something.' He attacks the human.", "'They're just men. Flesh and blood. And I'm going to make them bleed.' He attacks the man."],
        playerAttackAnimal: ["'Unidentified biological threat. Neutralizing.'", "'Survival is a matter of adaptation.' He attacks the beast.", "'The past can be a prison.' He attacks the animal."],
        threatDefeatedHuman: ["'I never asked for this.' The {enemyName} is defeated.", "'Some say it's the end of the world. Some say it's the beginning.' The man is gone.", "'It's not the end of the world. But you can see it from here.'"],
        threatDefeatedAnimal: ["'The world is a dangerous place.' The beast is dispatched.", "'Adapt or perish.' The animal is defeated.", "'It was just a machine.'"],
        playerDamage: ["His dermal armor takes the hit. 'I never asked for this.'", "'They're just men. Flesh and blood. And I'm going to make them bleed.'", "'The human body is a machine.'"],
        playerHeal: ["'Nanites repairing trauma.'", "'System integrity returning.'"],
        itemBought: ["He buys the {itemName}. 'This will be a useful upgrade.'"],
        equipCheatItem: {
          'item_sharp_knife_jensen': ["The nanoceramic blades slide from his arms with a faint hiss."]
        },
        useCheatItem: {
          'custom_jensen_typhoon': ["He deploys the Typhoon system, a whirlwind of steel and explosions."],
          'item_sharp_knife_jensen': ["The arm blades strike silently and efficiently."]
        }
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
        { id: 'item_six_shooter_holliday', name: "Doc's Nickel-Plated Revolver", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A gentleman's weapon for a deadly game.", sellValue: 25, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_holliday_satchel', name: "Gambler's Satchel", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "Take another card and heal 3 HP. You're in your prime.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_leather_satchel_t1', immediateEffect: { type: 'heal', amount: 3 } },
      ],
      catchphrases: { 
        playerAttackHuman: ["'I'm your huckleberry.'", "'Say when.'", "'Why, Johnny Ringo, you look like somebody just walked over your grave.'"], 
        playerAttackAnimal: ["'Nasty beast. Not my game.'", "'This is undignified.'", "'I do believe I am in my prime.'"],
        threatDefeatedHuman: ["'You're no daisy. You're no daisy at all.'", "He sighs. 'My hypocrisy goes only so far.'", "'It appears my hypocrisy knows no bounds.'"],
        threatDefeatedAnimal: ["The beast is dead. 'Well, that was tiresome.'", "'A filthy creature.'", "'Now, for a game of cards.'"],
        playerDamage: ["He coughs. 'Forgive me if I don't shake hands.'", "Takes a hit. 'I have not yet begun to defile myself.'"],
        laudanumAbuse: ["'It appears my hypocrisy knows no bounds.'", "He drinks. 'Why, Johnny Ringo, you look like somebody just walked over your grave.'"],
        playerHeal: ["'It's not my fault if I'm a lunger.' He heals {healAmount} HP."],
        illnessContractsHolliday: ["He coughs blood into a handkerchief. 'It's just my tuberculosis.'", "'I'm dying anyway.'"],
        equipCheatItem: {
          'item_six_shooter_holliday': ["He slips the nickel-plated revolver into his coat. 'A gentleman's accessory.'"]
        },
        useCheatItem: {
          'custom_holliday_satchel': ["He draws a new hand from the Gambler's Satchel. 'The game is afoot.'"],
          'item_six_shooter_holliday': ["The revolver fires, a surprisingly loud report from a sick man."]
        }
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
        { id: 'custom_quinn_kit', name: "Doctor's Kit", type: 'Provision', effect: { type: 'heal', amount: 12, cures: true }, description: "A proper medical kit for a proper doctor.", sellValue: 15, isCheat: true, illustrationId: 'provision_miracle_cure_t1' },
        { id: 'custom_quinn_journal', name: "Medical Journal", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 3, persistent: true }, description: "Knowledge is the best medicine.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' }
      ],
      catchphrases: {
        playerHeal: ["'The body has a remarkable ability to heal itself, if given a chance.'", "'A doctor's work is never done.'", "'This is a simple poultice of herbs.'"],
        threatDefeatedHuman: ["'Sometimes, a woman's touch is a firm hand.' The man is defeated.", "'I believe in medicine, not violence, but I also believe in survival.' The human is gone.", "'He should have known better.'"],
        threatDefeatedAnimal: ["'Sometimes you have to be firm.' The beast is defeated.", "'Poor creature.' The animal is dispatched.", "'It was for its own good.'"],
        playerAttackHuman: ["'This is for your own good!' She attacks the man.", "'I am a doctor, but I am also a survivor!' She attacks the human.", "'I will not be intimidated!'"],
        playerAttackAnimal: ["'This beast is a danger to the town.' She attacks the animal.", "'I'm sorry it has to be this way.' She attacks the creature.", "'I will not let you harm anyone else.'"],
        playerDamage: ["'This is highly unprofessional!'", "'Sully! Get the children!'"],
        itemBought: ["'This will be very useful for my practice.'", "'A new tool to help the sick.'"],
        equipCheatItem: {
          'custom_quinn_journal': ["She consults her Medical Journal. 'Knowledge is the best medicine.'"]
        },
        useCheatItem: {
          'custom_quinn_kit': ["She uses her Doctor's Kit to patch up a wound. 'This should do the trick.'"]
        }
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
        { id: 'custom_nightingale_kit', name: "Nurse's Kit", type: 'Provision', effect: { type: 'heal', amount: 15, cures: true }, description: "A kit filled with clean bandages and radical ideas about hygiene.", sellValue: 20, isCheat: true, illustrationId: 'provision_miracle_cure_t1' },
        { id: 'custom_nightingale_journal', name: "Notes on Nursing", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 4, persistent: true }, description: "Knowledge is the best medicine.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' },
      ],
      catchphrases: {
        playerHeal: ["'The very first requirement in a hospital is that it should do the sick no harm.'", "'The first rule of nursing is to keep the air within as pure as the air without.'", "'Let us never consider ourselves finished nurses... we must be learning all of our lives.'"],
        playerDamage: ["'I attribute my success to this: I never gave or took any excuse.'", "'How very little can be done under the spirit of fear.'", "'Live life when you have it. Life is a splendid gift.'"],
        threatDefeatedHuman: ["'The world is put back by the death of every one who has to sacrifice the development of his or her peculiar gifts to conventionality.'", "'A necessary, if unpleasant, procedure.'", "'Some infections must be purged.'"],
        threatDefeatedAnimal: ["'A necessary, if unpleasant, procedure.'", "'The creature was a carrier of disease.'", "'The world is a cleaner place now.'"],
        itemBought: ["'This will improve sanitation.'", "'A new tool for the ward.'"],
        equipCheatItem: {
          'custom_nightingale_journal': ["She consults her 'Notes on Nursing'. 'The foundation of all nursing is a clean environment.'"]
        },
        useCheatItem: {
          'custom_nightingale_kit': ["She applies a clean bandage from her Nurse's Kit. 'Proper care is everything.'"]
        }
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
        { id: 'item_six_shooter_livesey', name: "Doctor's Pistol", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A steady hand is good for more than just surgery.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_livesey_rum', name: "A Grog of Rum", type: 'Provision', effect: { type: 'heal', amount: 10 }, description: "A surprisingly effective restorative.", sellValue: 5, isCheat: true, illustrationId: 'provision_laudanum_t1' },
      ],
      catchphrases: {
        threatDefeatedHuman: ["'If you keep on drinking rum, the world will soon be quit of a very dirty scoundrel!'", "'Fifteen men on a dead man's chest... Yo-ho-ho and a bottle of rum!'", "'If you were sent by Long John, I'll have you know I'm a magistrate.'"],
        threatDefeatedAnimal: ["The beast is dispatched. 'A jim-dandy of a tale, to be sure.'", "'Ha-ha-ha-ha-ha!' The creature is defeated.", "'A most unsavory specimen.'"],
        laudanumAbuse: ["He downs the bottle. 'The name of rum is 'grief'!'", "'The word 'rum' and the word 'death' mean the same thing to you.'", "'That's a jim-dandy of a tale, to be sure.'"],
        playerAttackHuman: ["'I'll have the leg off you in a jiffy.'", "'Silence, sir! I am a magistrate.'", "'Ha-ha-ha-ha-ha!'"],
        playerAttackAnimal: ["He attacks the beast. 'A most unsavory creature.'", "'This will make a fine story.'", "'Ha-ha-ha-ha-ha!'"],
        playerHeal: ["'A little something to mend the constitution.'", "'The sea air is good for what ails you.'"],
        itemBought: ["'This will be useful for the voyage.'", "'A wise investment for a long journey.'"],
        equipCheatItem: {
          'item_six_shooter_livesey': ["He checks his pistol. 'A doctor must be prepared for anything.'"]
        },
        useCheatItem: {
          'custom_livesey_rum': ["He takes a healthy swig of rum. 'For medicinal purposes, of course.'"],
          'item_six_shooter_livesey': ["The pistol fires with a steady hand. 'I am a doctor, but I am also a magistrate.'"]
        }
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
        { id: 'custom_kenshin_sakabato', name: "Sakabatō", type: 'Item', effect: { type: 'weapon', attack: 11, subtype: 'sword' }, description: "A reverse-blade sword. A weapon that cannot kill, in the hands of one who has killed too many.", sellValue: 20, isCheat: true, illustrationId: 'item_katana_t2_fj' },
        { id: 'custom_kenshin_vow', name: "Vow of Non-Killing", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 3, persistent: true }, description: "A vow to never take another life strengthens the spirit against all harm.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_iron_will_fj' }
      ],
      catchphrases: {
        playerAttackHuman: ["'Oro?' He strikes with the back of his blade.", "A Hiten Mitsurugi-ryū technique!", "'A sword is a tool to protect. A tool to save lives.'", "'I will not kill, but I will not let you kill either.'"],
        playerAttackAnimal: ["'Oro?' He strikes the beast with the back of his blade.", "'Even a beast deserves a chance to live.' He attacks to disable.", "'This one must be stopped, that it must.'"],
        threatDefeatedHuman: ["'A sword is a weapon. The art of swordsmanship is learning how to kill. That is the truth.' The {enemyName} is defeated, but not slain.", "'This one has learned their lesson, that they have.'"],
        threatDefeatedAnimal: ["The beast is subdued. 'Go now, and cause no more trouble.'", "'The forest is a dangerous place. Be careful.'"],
        playerDamage: ["'This is my atonement.'", "'The scar on my cheek is a reminder.'"],
        playerHeal: ["'I must become stronger to protect those I care for.'", "'This one is not strong enough.'"],
        itemBought: ["'The sword has no master but the soul.'"],
        equipCheatItem: {
          'custom_kenshin_sakabato': ["The Sakabatō is a symbol of his vow."],
          'custom_kenshin_vow': ["He equips his vow. 'I will not kill again.'"]
        },
        useCheatItem: {
          'custom_kenshin_sakabato': ["The reverse-blade sword strikes, a blow to disable, not to kill."]
        }
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
        { id: 'item_six_iron_warren', name: "Warren's Revolver", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "A reliable sidearm from a man who's seen it all.", sellValue: 25, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_warren_pipe', name: "Warren's Pipe", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A moment to think can reveal a path forward. Draw 2 cards and heal 2 HP.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal', immediateEffect: { type: 'heal', amount: 2 } }
      ],
      catchphrases: {
        playerAttackHuman: ["'The only time black folks are safe, is when white folks are disarmed.'", "'Got room for one more?'", "'This is for you, Jody.'"],
        playerAttackAnimal: ["He attacks the beast. 'Just another dumb animal.'", "'A distraction from the real business.'", "'This one ain't worth a bounty.'"],
        threatDefeatedHuman: ["He looks at the fallen {enemyName}. 'This here is a letter from Abraham Lincoln.'", "'Now that's one cold son-of-a-bitch'", "'The business is concluded.'"],
        threatDefeatedAnimal: ["The beast is dispatched. 'Not worth a bounty.'", "'Back to the hunt.'", "'The plains are a dangerous place.'"],
        playerDamage: ["He takes the hit, unflinching. 'Starts to get cold on the plains.'", "'Justice ain't blind. It's just too damn scared to look.'"],
        goldFound: ["Finds {goldAmount} Gold. 'This bounty's gettin' bigger.'"],
        itemBought: ["'A man's gotta be prepared.' Buys the {itemName}."],
        bountySold: ["'This here's a letter from Abraham Lincoln. It's what got me into the bounty hunting business in the first place.'", "'I know the man on this paper. And if he's the man I know, he's worth a lot more than {sellAmount}G.'", "'A bounty's just a contract. I'm a businessman.'"],
        equipCheatItem: {
          'item_six_iron_warren': ["He checks his revolver. 'A man's gotta have a reliable friend.'"]
        },
        useCheatItem: {
          'custom_warren_pipe': ["He lights his pipe. 'Helps me think.'"],
          'item_six_iron_warren': ["His revolver fires with cold precision."]
        }
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
        { id: 'custom_boone_rifle', name: "Old Betsy", type: 'Item', effect: { type: 'weapon', attack: 11 }, description: "A trusty rifle that's seen the far side of the frontier.", sellValue: 25, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_boone_coat', name: "Deerskin Coat", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 8, persistent: true }, description: "Made for walking quietly through the woods.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_deer_skin_coat_t1' },
      ],
      catchphrases: {
        playerAttackHuman: ["'Be sure you're right, then go ahead.' He attacks the man.", "'I'm half-horse, half-alligator and a little attached with a snapping turtle.' He attacks the human.", "'I can whip my weight in wildcats.' He attacks the man."],
        playerAttackAnimal: ["He grins. 'Killed him a bear when he was only three.' He attacks the beast.", "'I'm a hunter, a warrior, and a pioneer.' He attacks the animal.", "'This one's for the pot.'"],
        threatDefeatedHuman: ["'We're not just fighting for ourselves, but for all our kin.'", "'Let your tongue speak what your heart thinks.' The man is silent now.", "'May the Lord have mercy on your soul.'"],
        threatDefeatedAnimal: ["He grins. 'Killed him a bear when he was only three.' The beast is down.", "'The land provides.'", "'A fine trophy.'"],
        itemTaken: ["'This will be useful on the trail.'", "'The land provides.'", "'A fine specimen.'"],
        playerDamage: ["'Heaven is a great deal bigger than the earth.'", "'Let your tongue speak what your heart thinks.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A little something for the journey.'", "'This will help me on my way.'"],
        equipCheatItem: {
          'custom_boone_rifle': ["He shoulders Old Betsy. 'A good rifle is a good friend.'"],
          'custom_boone_coat': ["The Deerskin Coat is light and quiet."]
        },
        useCheatItem: {
          'custom_boone_rifle': ["Old Betsy barks with authority."]
        }
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
        { id: 'item_rifle_carson', name: "Hawken Rifle", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "A rifle that's seen the whole frontier.", sellValue: 20, isCheat: true, illustrationId: 'item_rifle_t1' },
        { id: 'item_sharp_knife_carson', name: "Scout's Knife", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A reliable blade for a man of the mountains.", sellValue: 10, isCheat: true, illustrationId: 'item_sharp_knife_t1' },
      ],
      catchphrases: {
        playerAttack: ["'This is how it's done in the mountains.'", "'A simple, effective solution.'", "'Some men just need puttin' down.'"],
        threatDefeated: ["He nods grimly. 'The trail is clear.'", "'I've seen the elephant.'", "'A man must live with the choices he makes.'", "'Another soul lost to the frontier.'"],
        itemTaken: ["'This will be useful.'", "'The land provides for those who know how to look.'"],
        playerDamage: ["'A scrape. Nothing more.'", "'The mountains test your resolve.'"],
        useCheatItem: {
          'item_rifle_carson': ["The Hawken rifle fires, a familiar sound in the wilderness."],
          'item_sharp_knife_carson': ["A quick, efficient cut from the Scout's Knife."]
        }
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
        { id: 'item_long_bow_artemis', name: "Bow of the Huntress", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A silver bow that never misses its mark.", sellValue: 30, isCheat: true, illustrationId: 'item_long_bow_t1' },
        { id: 'custom_artemis_arrowhead', name: "Moonstone Arrowhead", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'bow_boost', amount: 4, persistent: true }, description: "An arrowhead that glows with a faint lunar light.", sellValue: 15, isCheat: true, illustrationId: 'upgrade_lucky_arrowhead' },
      ],
      catchphrases: {
        playerAttackHuman: ["'Let the hunt commence!'", "'By the light of the full moon!'", "'The huntress does not fail.'", "'A mortal's folly.'"],
        playerAttackAnimal: ["An arrow loosed under the eye of the moon. She attacks the beast.", "'The wilds must be respected.'", "'A tribute to the moon.'"],
        threatDefeatedHuman: ["The mortal falls. 'They should have known better than to challenge a goddess.'", "'A life for a life.'"],
        threatDefeatedAnimal: ["The {enemyName} falls. 'A tribute to the wilds.'", "'The balance is restored.'", "'The hunt is concluded.'"],
        playerDamage: ["A mortal strikes a goddess. 'Insolence!'", "'This is but a scratch to an immortal.'"],
        playerHeal: ["'The wilds mend their own.'", "'My strength returns with the rising moon.'"],
        equipCheatItem: {
          'item_long_bow_artemis': ["She strings her silver bow. 'The hunt begins.'"],
          'custom_artemis_arrowhead': ["The Moonstone Arrowhead glows softly."]
        },
        useCheatItem: {
          'item_long_bow_artemis': ["A silver arrow flies, silent and deadly."]
        }
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
        { id: 'item_sharp_knife_bloodborne', name: "Saw Cleaver", type: 'Item', effect: { type: 'weapon', attack: 12, subtype: 'sword' }, description: "A trick weapon from Yharnam. Unfolds for extended reach.", sellValue: 25, isCheat: true, illustrationId: 'item_sharp_knife_t1_sh' },
        { id: 'item_six_shooter_hunter', name: "Hunter's Pistol", type: 'Item', effect: { type: 'weapon', attack: 7 }, description: "A firearm used for parrying beasts, not for damage.", sellValue: 10, isCheat: true, illustrationId: 'item_six_shooter_t1_sh' },
      ],
      catchphrases: {
        playerAttackHuman: ["'A hunter must hunt.'", "He strikes with visceral speed.", "'You are no beast, but you are a threat.'"],
        playerAttackAnimal: ["'A hunter must hunt.'", "He strikes with visceral speed.", "'Beast... foul beast!'"],
        threatDefeatedHuman: ["'Farewell, good hunter. May you find your worth in the waking world.'", "PREY SLAUGHTERED", "'Another dream ends.'"],
        threatDefeatedAnimal: ["'Farewell, good hunter. May you find your worth in the waking world.'", "PREY SLAUGHTERED", "'You are no longer a beast. You are free.'"],
        playerDamage: ["'Fear the Old Blood.' He takes {damageAmount} damage.", "'The sweet blood, oh, it sings to me.'"],
        playerHeal: ["He injects a Blood Vial.", "'Just a little blood, to keep me going.'"],
        itemBought: ["He buys the {itemName}. 'A hunter is never alone.'"],
        equipCheatItem: {
          'item_sharp_knife_bloodborne': ["The Saw Cleaver unfolds with a satisfying click."],
          'item_six_shooter_hunter': ["The pistol is for parrying, but feels heavy nonetheless."]
        },
        useCheatItem: {
          'item_sharp_knife_bloodborne': ["The Saw Cleaver rends and tears with brutal efficiency."],
          'item_six_shooter_hunter': ["The Hunter's Pistol barks, seeking an opening."]
        }
      }
    },
  },
  // --- TRAPPER ---
  {
  name: "Sekiro",
  requiredCharacterId: 'trapper',
  effects: {
    increaseDifficulty: 1,
    addCustomCards: [
      { 
        id: 'custom_sekiro_blade', 
        name: "Mortal Blade", 
        type: 'Item', 
        effect: { type: 'weapon', attack: 15, subtype: 'sword' }, 
        description: "The blade that can sever the immortal. A perilous weapon that thirsts for life.", 
        sellValue: 66, 
        isCheat: true, 
        illustrationId: 'item_nodachi_t1_fj' 
      },
      { 
        id: 'custom_sekiro_hook', 
        name: "Shinobi Grappling Hook", 
        type: 'Action', 
        effect: { type: 'scout' }, 
        immediateEffect: { type: 'draw', amount: 2 },
        description: "A shinobi's tool for traversal and gaining a tactical advantage. Scout the path ahead and draw 2 cards.", 
        sellValue: 10, 
        isCheat: true, 
        illustrationId: 'action_scout_ahead_fj'
      },
      { 
        id: 'custom_sekiro_gourd', 
        name: "Healing Gourd", 
        type: 'Provision', 
        effect: { type: 'heal', amount: 15, cures: true }, 
        description: "A gourd filled with potent medicinal waters. A shinobi's best friend in a long fight. Heals for a large amount and cures all ailments.", 
        sellValue: 20, 
        isCheat: true, 
        illustrationId: 'upgrade_waterskin_canteen_t1_fj' 
      }
    ],
    catchphrases: {
      playerAttack: [
        "'Hesitation is defeat.'",
        "'Face me... Sekiro.'",
        "'For my master...'",
        "'I will not die. Not again.'"
      ],
      threatDefeated: [
        "The {enemyName} falls. 'Death is not the end.'",
        "'A shinobi would know the difference between honor and victory.'",
        "'It is done.'",
        "He sheathes his blade. 'The path is clear.'"
      ],
      playerDamage: [
        "Takes a hit. 'A shinobi's resolve is not so easily broken.'",
        "Takes {damageAmount} damage. 'This pain... is a reminder.'",
        "He stumbles. 'I will not falter.'",
        "'Just a scratch... I have died before.'"
      ],
      playerHeal: [
        "The gourd's waters are restorative. Healed {healAmount} HP.",
        "'I must not die. Not yet.'",
        "He drinks from the gourd. 'Strength returns.'",
        "Heals for {healAmount}. 'The dragon's blood flows within me.'"
      ],
      newDay: [
        "Another day... another step on the path.", 
        "The sun rises. The mission continues.", 
        "A new cycle begins."
      ],
      eventRevealThreat: [
        "A {enemyName} appears. 'A new challenge.'",
        "'Another obstacle.'",
        "He draws his blade. 'So, you are the one...'",
        "The air grows heavy. 'I sense a powerful foe.'"
      ],
      scoutAhead: [
        "He surveys the area with a shinobi's eye. A {eventName} lies ahead.",
        "The path is treacherous. Scouting reveals a {eventName}.",
        "He grapples to a high perch. 'I see what lies ahead... a {eventName}.'"
      ],
      equipCheatItem: {
        'custom_sekiro_blade': ["He draws the crimson Mortal Blade. Its ominous hum fills the air."]
      },
      useCheatItem: {
        'custom_sekiro_blade': ["The Mortal Blade strikes, a blow that can sever fate itself."],
        'custom_sekiro_hook': ["He fires the grappling hook, gaining a tactical advantage."],
        'custom_sekiro_gourd': ["He takes a deep drink from the Healing Gourd."]
      }
    }
  }
  },
  {
    name: "jeremiah johnson",
    requiredCharacterId: 'trapper',
    effects: {
      addGold: 20,
      addMaxHealth: 4,
      addCustomCards: [
        { id: 'item_hunting_rifle_jeremiah', name: ".50 Caliber Hawken", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A heavy rifle for a mountain man.", sellValue: 35, isCheat: true, illustrationId: 'item_hunting_rifle_t1' },
        { id: 'custom_jeremiah_coat', name: "Mountain Man's Coat", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 8, persistent: true }, description: "Made from... well, you don't ask.", sellValue: 15, isCheat: true, illustrationId: 'upgrade_bearskin_coat' },
      ],
      catchphrases: {
        playerAttackHuman: ["'You've come far, pilgrim.' He attacks the man.", "'Watch your topknot.' He attacks the human.", "'Ain't this somethin'?'"],
        playerAttackAnimal: ["'The Rocky Mountains are the marrow of the world.' He attacks the beast.", "'Elk don't know how many feet a horse has!' He attacks the animal.", "'Just another meal.'"],
        threatDefeatedHuman: ["'They were trespassers. This is my land.'", "'Some say he's still up there, looking for who done his family wrong.'", "'It is done.'"],
        threatDefeatedAnimal: ["'The mountains provide.' The beast is defeated.", "'A good day for huntin'.'", "'This will make a fine coat.'"],
        itemTaken: ["'This will be useful.'", "'The mountain provides.'"],
        playerDamage: ["He takes the hit. 'It's a hard life.'", "'The mountains test a man.'"],
        goldFound: ["'I'll trade this for some supplies.'"],
        equipCheatItem: {
          'item_hunting_rifle_jeremiah': ["He shoulders Old Betsy. 'A good rifle is a good friend.'"],
          'custom_jeremiah_coat': ["He dons the heavy coat. 'The mountains provide.'"]
        },
        useCheatItem: {
          'item_hunting_rifle_jeremiah': ["The Hawken roars, a sound of the mountains themselves."]
        }
      }
    },
  },
  {
    name: "ace ventura",
    requiredCharacterId: 'trapper',
    effects: {
        addGold: 100,
        addMaxHealth: 2,
        addCustomCards: [
            { id: 'custom_ace_dart_gun', name: "Tranquilizer Dart Gun", type: 'Item', effect: { type: 'weapon', attack: 5 }, description: "For putting unruly beasts to sleep... or just really, really annoying them. Do NOT use on humans.", sellValue: 5, isCheat: true, illustrationId: 'item_six_shooter_t1' },
            { id: 'custom_ace_card', name: "Pet Detective Business Card", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 5, persistent: true }, description: "Ace Ventura, Pet Detective. At your service.", sellValue: 1, isCheat: true, illustrationId: 'upgrade_treasure_map' },
            { id: 'custom_ace_hair', name: "The Hair", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 5, persistent: true }, description: "This hair isn't just for show. It's... aerodynamic. And provides surprising protection from head trauma.", sellValue: 1, isCheat: true, illustrationId: 'upgrade_cavalry_hat' },
        ],
        catchphrases: {
            newDay: [ "Allllllrighty then! Time to get this party started!", "A new day, a new crime scene. Spank you, smacks!", "Re-he-he-heally? Morning already?" ],
            eventRevealThreat: [ "Well, what do we have here? Captain Winkie!", "Holy testicle Tuesday! A {enemyName}!", "Warning! Assholes are closer than they appear! It's a {enemyName}!" ],
            playerAttack: [ "Let me show you something!", "Take that, you lousy... animal... thing!", "I'm ready for my close-up, Mr. DeMille!", "Do NOT go in there! Wooo!" ],
            playerAttackAnimal: [ "Come to me, my jungle friends!", "That's a lovely Accent you have. New Jersey?", "This is a lovely room of death.", "I'm gonna get you, you furry little football!" ],
            playerDamage: [ "Kinda hot in these rhinos...", "I'm in psychoville and Finkle's the mayor.", "Ouch! Right in the fun-buns!", "That's a big-a-boy!" ],
            playerHeal: [ "Like a glove!", "I feel... reborn!", "Ah, that's better. Now, where was I?" ],
            threatDefeated: [ "And you get a plunger! And you get a plunger!", "Loooooser!", "And that's how you do that. Allllllrighty then!" ],
            threatDefeatedAnimal: [ "Your ball is in my court now, pretty boy!", "The beast is... sleeping. With his eyes open.", "Gotcha! Another case solved." ],
            goldFound: [ "Money, money, money! All for me!", "This will buy a lot of bird seed.", "'Finders keepers, losers weepers.' But I'm not a weeper!" ],
            itemBought: [ "This is a lovely piece of equipment. Re-he-he-heally!", "I'll take it! This is my department, and it's all part of the job." ],
            itemSold: [ "Take it. I don't want it. It's got... cooties.", "One man's trash is another man's... well, still trash." ],
            bountySold: [ "Here's your man... or what's left of him. Case closed!", "Another one for the books. The Pet Detective always gets his man... or beast." ],
            illnessContracts: [ "I'm feeling a little... under the weather. Like, a hurricane is on my head.", "My body is a temple... of doom!", "That's not a food berry... that's a bad berry!" ],
            trapSet: [ "It's a trap! But, like, my trap. So it's a good trap.", "This should work. If it doesn't... deny everything.", "Shh! Be vewy, vewy quiet. I'm huntin'... animals." ],
            trapCaught: [ "Gotcha! It's all in the reflexes.", "Aha! Another successful capture for Ace Ventura, Pet Detective!", "It's... it's alive! IT'S ALIVE!" ],
            laudanumAbuse: [ "This stuff is... magical. I can see the animals talking.", "Whoa, everything is so... colorful. And fuzzy.", "I'm not drunk! I'm... uh... performance-enhanced." ],
            itemEquipped: [ "This new accessory really brings the whole outfit together.", "Lookin' sharp! And ready for action!", "New gear? Allllllrighty then!" ],
            campfireBuilt: [ "Let there be light! And s'mores! Anyone got s'mores?", "Kumbaya, my lord, kumbaya... Oh, sorry. Got carried away.", "A nice, toasty fire. Perfect for... telling scary stories!" ],
            scoutAhead: [ "Let me just... take a peek-a-loo.", "I see you... and you... and you!", "The coast is clear! Or... is it? Dun dun DUNNNN!" ],
            deEscalate: [ "All righty then! Let's just talk this out.", "'Scuse me, I'd like to ass you a few questions.", "I have to go now. I'm having a baby. It's a... boy." ]
        }
    }
  },
  {
    name: "hugh glass",
    requiredCharacterId: 'trapper',
    effects: {
      addGold: 10,
      addMaxHealth: -10,
      increaseDifficulty: 1,
      addCustomCards: [
        { id: 'custom_glass_hide', name: "Grizzly Hide", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'max_health', amount: 12, persistent: true }, description: "A heavy hide that serves as a grim reminder.", sellValue: 20, isCheat: true, illustrationId: 'upgrade_bearskin_coat' },
        { id: 'custom_glass_revenge', name: "Revenant's Fury", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "Fueled by sheer will. Draw 2 cards and heal 2 HP.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_iron_will', immediateEffect: { type: 'heal', amount: 2 } },
      ],
      catchphrases: {
        playerAttackHuman: ["'As long as you can still grab a breath, you fight.'", "'Revenge is in God's hands... not mine.' But he attacks anyway.", "'They don't hear your voice! They just see the color of your face.'", "'You are just another man who left me to die.'"],
        playerAttackAnimal: ["'I've faced worse than you.' He attacks the beast.", "'The wilderness is a cruel mother.' He attacks the animal.", "'You are not the one I seek.' He attacks with cold fury."],
        playerAttackBear: ["He screams, a sound of pure rage and memory. 'I ain't afraid to die anymore. I'd done it already.'", "'He's afraid. He knows how far I came for him.'"],
        eventRevealBear: ["His eyes narrow. He remembers the cold, the pain, the betrayal. He remembers the bear.", "'I'm right here. I'll be right here.' He stares down the bear.", "He touches the scars on his back. 'This time, it's different.'"],
        threatDefeatedHuman: ["'He's afraid. He knows how far I came for him.'", "'It is not enough. He is still out there.'", "He looks at the fallen man. 'You were just in the way.'"],
        threatDefeatedAnimal: ["The beast falls. 'It is done.' He moves on, his purpose unchanged.", "He looks at the animal. 'The world is filled with things that will kill you.'", "'Another ghost for the forest.'"],
        playerDamage: ["He takes the hit, unfazed. 'I ain't afraid to die anymore. I'd done it already.'", "'I'm right here. I'll be right here.'", "He takes a hit, remembering the bear."],
        playerHeal: ["'I must survive.'", "'My son... he watches over me.'"],
        itemTaken: ["'This will be useful.'", "'The earth provides.'"],
        equipCheatItem: {
          'custom_glass_hide': ["He wears the Grizzly Hide. 'It keeps me warm.'"]
        },
        useCheatItem: {
          'custom_glass_revenge': ["He taps into a deep well of rage. 'I'm still here!'"]
        }
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
        { id: 'custom_bridger_trap1', name: "Bridger's Large Trap", type: 'Item', effect: { type: 'trap', size: 'large', breakDamage: 8 }, description: "A trap for a man who knows what's out there.", sellValue: 10, isCheat: true, illustrationId: 'item_large_trap_t1' },
        { id: 'custom_bridger_trap2', name: "Bridger's Medium Trap", type: 'Item', effect: { type: 'trap', size: 'medium', breakDamage: 6 }, description: "A versatile trap for the trail.", sellValue: 8, isCheat: true, illustrationId: 'item_medium_trap_t1' },
        { id: 'custom_bridger_scout', name: "Mountain Man's Knowledge", type: 'Action', effect: { type: 'scout' }, description: "He knows these lands like the back of his hand. Scout and draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'action_scout_ahead', immediateEffect: { type: 'draw', amount: 2 } },
      ],
      catchphrases: {
        playerAttack: ["'This is how it's done in the mountains.'", "'A simple, effective solution.'", "'Some men just need puttin' down.'"],
        threatDefeated: ["He nods grimly. 'This country is not for greenhorns.'", "'I've seen the elephant.'", "'The mountains call to me.'", "'A man must live with the choices he makes.'"],
        itemTaken: ["'This will be useful.'", "'The land provides for those who know how to look.'"],
        playerDamage: ["'A scrape. Nothing more.'", "'The mountains test your resolve.'"],
        useCheatItem: {
          'custom_bridger_trap1': ["He sets one of his custom traps with practiced ease."],
          'custom_bridger_trap2': ["He sets one of his custom traps with practiced ease."],
          'custom_bridger_scout': ["He uses his knowledge of the land to scout the path ahead."]
        }
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
        { id: 'item_six_iron_preacher', name: "Pale Rider's Revolver", type: 'Item', effect: { type: 'weapon', attack: 12 }, description: "A gun that deals in judgment.", sellValue: 30, isCheat: true, illustrationId: 'item_six_iron_t2' },
        { id: 'custom_preacher_symbol', name: "Holy Symbol", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 2, persistent: true }, description: "A symbol of faith that offers some protection from the evils of this world.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_lucky_bullet' }
      ],
      catchphrases: {
        playerAttack: ["'And I looked, and behold a pale horse: and his name that sat on him was Death, and Hell followed with him.'", "'There's a lot of sinners hereabouts.'", "'Nothing like a nice piece of hickory.'"],
        threatDefeated: ["'There's nothing like a nice piece of hickory.'", "'Go on, get outta here. Don't come back.'", "'It's what's on the inside that counts.'"],
        playerDamage: ["'The Lord works in mysterious ways.'", "'A test of faith.'"],
        playerHeal: ["'The spirit is willing.'", "'My faith is my shield.'"],
        equipCheatItem: {
          'item_six_iron_preacher': ["The Pale Rider's Revolver feels heavy with judgment."],
          'custom_preacher_symbol': ["He grips his Holy Symbol. 'Faith is my shield.'"]
        },
        useCheatItem: {
          'item_six_iron_preacher': ["The Pale Rider's Revolver speaks with divine authority."]
        }
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
        { id: 'custom_padre_bible', name: "Padre's Bible", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 4, persistent: true }, description: "Its words offer comfort, its cover offers protection.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_tattered_bible' },
        { id: 'custom_padre_water', name: "Flask of Holy Water", type: 'Provision', effect: { type: 'heal', amount: 8, cures: true }, description: "A blessing against the evils of this world.", sellValue: 10, isCheat: true, illustrationId: 'provision_water_t1' },
      ],
      catchphrases: {
        playerHeal: ["'Let us pray.'", "'Bless you, my child.'", "'The Lord is my shepherd.'", "'Through Him, all things are possible.'"],
        playerAttack: ["'Forgive me, Lord, for what I am about to do.'", "'The power of Christ compels you!'"],
        threatDefeated: ["'Go in peace.'", "'May God have mercy on your soul.'"],
        playerDamage: ["'A trial from the Lord.'", "'My faith will not falter.'"],
        equipCheatItem: {
          'custom_padre_bible': ["He clutches his bible. 'The Lord is my shepherd.'"]
        },
        useCheatItem: {
          'custom_padre_water': ["He anoints his wounds with Holy Water. 'Bless this child.'"]
        }
      }
    },
  },
  {
    name: "Ma",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 500,
      addMaxHealth: 1,
      addCustomCards: [
        { 
          id: 'custom_ma_satchel', 
          name: "Unicorn Satchel", 
          type: 'Player Upgrade', 
          effect: { type: 'upgrade', subtype: 'storage', capacity: 9, persistent: true }, 
          description: "A satchel that holds all the love... and a surprising amount of provisions.", 
          sellValue: 100, 
          isCheat: true, 
          illustrationId: 'upgrade_large_satchel_t2' 
        },
        { 
          id: 'item_bow_custom_ma_knifebow', 
          name: "The Heck..?", 
          type: 'Item', 
          effect: { type: 'weapon', attack: 8, subtype: 'sword' }, 
          description: "A unique weapon that combines the grace of a bow with the... pointiness of a knife. It benefits from both bow and bladed weapon upgrades.", 
          sellValue: 150, 
          isCheat: true, 
          illustrationId: 'item_bow_t1_sh' 
        },
        { 
          id: 'custom_ma_laudanum', 
          name: "Tina's 'Special' Tea", 
          type: 'Provision', 
          effect: { type: 'heal', amount: 25, cures: true }, 
          immediateEffect: { type: 'draw', amount: 5 },
          description: "A surprisingly potent remedy. Heals for a ton, cures anything, and really helps you focus. What's in this thing, anyway?", 
          sellValue: 200, 
          isCheat: true, 
          illustrationId: 'provision_laudanum_t1_sh' 
        },
      ],
      catchphrases: {
        newDay: [
            "Good morning, sunshine!", "Ready for a new day of adventures?",
            "Did you sleep well, my love?", "Go get 'em, tiger!",
            "Another beautiful day to watch my sexy spouse conquer the wilderness.",
            "Okay, hunny, what's the plan for today? Besides being ridiculously sexy?",
            "You've got this, cutie.", "I believe in you!"
        ],
        eventRevealThreat: [
            "Oh, look! A new friend! ...Wait, is it friendly?",
            "Sweetie, there's a... a thing. A big, angry-looking thing.",
            "Be careful, my love!", "That {enemyName} looks like it means business!",
            "You got this, hunny. Just... you know, don't get hurt.",
            "Okay, deep breaths. It's just a {enemyName}. You're way scarier before you've had coffee."
        ],
        playerAttack: [
            "Get 'em, hunny! Show 'em who's boss!",
            "Wow, look at you go! So strong! So sexy!",
            "That's my baby! Right in the... uh... weak spot!",
            "You are so hot when you do that."
        ],
        playerAttackHuman: [
            "Oh my GOD, hunny, did you just stab that man?! I mean, he probably deserved it, but WOW.",
            "You showed him, cutie!", "Teach him not to mess with my baby!",
            "Is he... is he bleeding?", "Oh, sweetie, you're so strong!",
            "You tell him, sweetie! He started it!",
            "That guy is a real jerk. Get him!"
        ],
        playerAttackAnimal: [
            "You just... you just shot that fluffy thing!", "What did it ever do to you, you monster?!", "I love you.",
            "Aww, poor little {enemyName}. It was probably just scared!",
            "Right in the fuzzy bits! You're a natural, sexy!",
            "Aww, but it's so fluffy! ...Okay, it's a fluffy monster. Get it.",
            "I'm sorry, little {enemyName}, but you messed with the wrong adventurer's spouse!"
        ],
        threatDefeatedHuman: [
            "Well, he's definitely not getting up. Are you okay, sweetie? You look a little flushed.",
            "You did it! You defeated the mean man! Who's a big, strong adventurer? You are!",
            "Is it over? Good. I was getting worried. Not really, you had it the whole time.",
            "He had it coming. He had a very punchable face.",
            "Okay, now loot his pockets before anyone sees."
        ],
        threatDefeatedAnimal: [
            "It's in a better place now, honey. A place without you shooting at it. Let's go get some gold.",
            "You're the queen of the forest! A very sexy, slightly terrifying queen.",
            "Look at what you did!", "It's... it's just sleeping, right?", "A forever-sleep?",
            "Aww, it's kind of cute now that it's... not moving.",
            "You're so brave, my love. And a little terrifying."
        ],
        playerDamage: [
            "My poor baby! Did that mean old {sourceName} hurt you? Mama's gonna make them pay!",
            "Oh, sweetie, no! Are you okay? Do you need a kiss? Or just like, a bandage or something?",
            "That's it! You get 'em, hunny! Nobody hurts my baby!",
            "Hey! Don't you touch my spouse!",
            "That {sourceName} is going on my list. My very short list."
        ],
        playerHeal: [
            "Oh, my sweet baby! Let mama kiss it and make it better.",
            "There we go, all better! See? A little {sourceName} makes everything better.",
            "Look at you, taking care of yourself! You're so responsible.",
            "That's right... Drink up... Drink till your problems all fade away.",
            "Good job, sweetie. Self-care is very important.",
            "Whew, that's a relief. I was starting to worry."
        ],
        goldFound: [
            "Look at you, my little treasure hunter! You found {goldAmount} Gold! I hope it was worth all the noise!",
            "Ooh, shiny! You're rich, sweetie! Don't spend it all in one place... unless it's on something for me.",
            "Is that gold? My baby is so smart and resourceful!",
            "Ooh, we're rich! Let's buy a pony! Or... more bullets. Your choice.",
            "Look at my smarty-pants, finding treasure!"
        ],
        itemBought: [
            "Ooh, a new {itemName}! Does it come in other colors? It looks great on you, cutie.",
            "You bought a {itemName}! You have such good taste, hunny.",
            "Spending your gold already, huh? Well, you deserve a little treat.",
            "Are you sure you need another {itemName}, hunny? You have so many already.",
            "As long as it makes you happy, sweetie."
        ],
        itemSold: [
            "You're selling your {itemName}? Are you sure, sweetie? Okay, well, you know best.",
            "Good call, hunny. That {itemName} was clashing with your eyes anyway.",
            "Cha-ching! Look at my little businessman! So smart.",
            "Finally, getting rid of that {itemName}. It was taking up so much space.",
            "More money for us! I mean... for the adventure. Yes."
        ],
        bountySold: [
           "Look at you, my little lawbringer! So official.",
           "You got paid for that? We should do this more often.",
           "So proud of you, bringing in the bad guys!"
        ],
        illnessContracts: [
            "Oh no, my poor baby! You've got {illnessName}!",
            "You're sick? Don't worry, I'll take care of you. Just... from a distance.",
            "You look a little green, sweetie. Are you okay?"
        ],
        trapSet: [
            "Ooh, a trap! You're so clever, my love.",
            "Be careful with that, hunny. Don't catch your own cute butt in it.",
            "What's that for? Is it for catching snacks?",
            "Look at my little trapper! So resourceful."
        ],
        trapCaught: [
            "You caught one! What is it? Is it fuzzy?",
            "Oh, look what you did! You're a genius, sweetie!",
            "Is it... supposed to make that noise? It sounds angry.",
            "You caught a {enemyName}! I'm so proud and a little scared!"
        ],
        laudanumAbuse: [
            "Honey, are you sure you need that? You're not even hurt.",
            "You're just drinking that for fun, aren't you? You silly goose.",
            "Whoa, careful with that stuff, sexy. Don't want you getting too loopy.",
            "Okay, space cadet, you coming back to Earth anytime soon?",
            "I love you even when you're being a weirdo."
        ],
        itemEquipped: [
            "Ooh, look at you! That {itemName} looks so good on you.",
            "Wow, a new {itemName}! You look so handsome and dangerous.",
            "Is that new? You're going to be the best-dressed adventurer in the whole wild land.",
            "That's a good look, cutie. Very... intimidating."
        ],
        campfireBuilt: [
            "Aww, a campfire! You're so romantic.",
            "Let's get cozy by the fire, my love.",
            "Good job, hunny! I'll get the marshmallows. ...We don't have any? Oh.",
            "Nothing better than a warm fire with my favorite person."
        ],
        deEscalate: [
            "See? You just had to use your words, sweetie.", "I always said you were a charmer.",
            "Aww, you talked him down!", "You didn't even have to get your hands dirty.", "What a gentleman.",
            "He just needed to see your handsome face and hear your sweet voice.", "Who could stay mad at you?"
        ],
        scoutAhead: [
            "What's that, sweetie? You see something? Oh, a {eventName}!", "You have such good eyes.",
            "Be careful, hunny! Look what's up ahead! A {eventName}!",
            "Good thinking, checking ahead. That's my smart lady!"
        ],
        useCheatItem: {
          'custom_ma_laudanum': [
              "Hunny, are you sure you should be drinking that?", "You're not even hurt!", "You're gonna see sounds, you silly goose.",
              "Whoa, look at all those new ideas you just had! You're so smart, my love.",
              "That's it, drink up!", "A focused baby is a happy baby."
          ]
        },
        equipCheatItem: {
            'custom_ma_satchel': ["Aww, look at that big bag! You can hold so many snacks in there!", "That's it, pack up your things.", "Don't forget to call your mother!"],
            'item_bow_custom_ma_knifebow': ["What in the world is that thing, hunny?", "It's... creative!", "Be careful with the pointy end. And the other pointy end."]
        }
      }
    }
  },
  {
    name: "claude frollo",
    requiredCharacterId: 'preacher',
    effects: {
      addGold: 150,
      increaseDifficulty: 2,
      addCustomCards: [
        { id: 'custom_frollo_dagger', name: "Dagger of Judgment", type: 'Item', effect: { type: 'weapon', attack: 10, subtype: 'sword' }, description: "A silver dagger, cold to the touch. For delivering righteous judgment to the wicked and unworthy.", sellValue: 13, isCheat: true, illustrationId: 'item_sharp_knife_t1_sh' },
        { id: 'custom_frollo_ring', name: "Ring of the Archdeacon", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'damage_reduction', amount: 3, persistent: true }, description: "The symbol of his holy office. It protects the body, but offers no comfort to the soul.", sellValue: 66, isCheat: true, illustrationId: 'item_jewelry_sh' }
      ],
      catchphrases: {
        playerAttack: ["'The wicked shall not go unpunished!'", "'I am a righteous man!'", "'And He shall smite the wicked and plunge them into the fiery pit!'", "'Choose me... or the fire!'"],
        threatDefeated: ["'Beata Maria, you know I am a righteous man...'", "The {enemyName} is purged. 'So concludes a tragic story.'", "'Now justice is done.'", "'The world is a wicked place. And it is my sacred duty to cleanse it.'"],
        playerDamage: ["'A test from the Almighty!'", "'This is my cross to bear.'", "'The fires of hell... they burn...'", "'My virtue is my shield!'"],
        goldFound: ["'The Lord provides the means for his work.' He takes the {goldAmount} Gold.", "'This worldly dross will serve a holy purpose.' He collects {goldAmount} Gold.", "'Even in this cesspool of sin, there is opportunity.'"],
        itemBought: ["'A tool for the work of the righteous.' He acquires the {itemName}.", "'This will serve the cause of justice.'"],
        playerHeal: ["'The spirit is willing, and the flesh must be made so.' He tends to his wounds.", "'My strength is not my own, but His.' Heals for {healAmount}."],
        laudanumAbuse: ["He takes the tincture to quiet the tempest in his soul. 'She will be mine or she will burn!'", "'This gypsy witch... this devil... has put a spell on me!'"],
        equipCheatItem: {
          'custom_frollo_ring': ["The Archdeacon's ring glints coldly. 'For the glory of God.'"],
          'custom_frollo_dagger': ["The Dagger of Judgment is drawn. 'Time to purge the wicked.'"]
        },
        useCheatItem: {
          'custom_frollo_dagger': ["The Dagger of Judgment strikes, a cold and righteous blow."]
        }
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
        { id: 'item_sawed_off_book', name: "Shepherd's Shotgun", type: 'Item', effect: { type: 'weapon', attack: 10 }, description: "For protecting the flock.", sellValue: 20, isCheat: true, illustrationId: 'item_sawed_off_t1' },
        { id: 'custom_book_medkit', name: "Shepherd's Medkit", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'provision_heal_boost', amount: 3, persistent: true }, description: "A shepherd tends to his flock.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_medical_journal' },
      ],
      catchphrases: {
        playerAttack: ["'A shepherd's job is simple: to find a pasture and feed his flock.'", "'Though I walk through the valley of the shadow of death, I will fear no evil.'", "'I'm just a Shepherd.' He opens fire."],
        threatDefeated: ["'The Bible is a little fuzzy on the subject of kneecaps.'", "'I am a Shepherd. My business is not to judge, but to tend my flock.'", "'If you can't do something smart, do something right.'"],
        playerDamage: ["'I've been out of the game for a long time.'", "'That's a trap.'"],
        playerHeal: ["'The flock must be tended.'", "'A moment of peace.'"],
        equipCheatItem: {
          'item_sawed_off_book': ["The shotgun feels heavy, a tool for a different kind of shepherding."],
          'custom_book_medkit': ["He checks his medkit. 'A shepherd must tend to his flock.'"]
        },
        useCheatItem: {
          'item_sawed_off_book': ["The Shepherd's shotgun delivers a sermon of buckshot."]
        }
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
        { id: 'custom_sacagawea_pouch', name: "Gatherer's Pouch", type: 'Provision', effect: { type: 'heal', amount: 6 }, description: "A collection of potent herbs.", sellValue: 10, isCheat: true, illustrationId: 'upgrade_herb_pouch' },
      ],
      catchphrases: {
        playerHeal: ["'The earth provides for its children.'", "'This will help.'", "'The spirits of the plants lend their strength.'"],
        itemTaken: ["She examines the {itemName}. 'This will be useful.'", "'The land provides all we need.'", "'A gift from the earth.'"],
        playerAttack: ["'This is a last resort.'", "'The spirits of the earth aid me.'"],
        threatDefeated: ["'The land is at peace again.'", "'Go back to the earth.'"],
        goldFound: ["Finds {goldAmount} Gold. 'A gift from the traders.'"],
        useCheatItem: {
          'custom_sacagawea_guide': ["She uses her knowledge as a guide to find the safest path."],
          'custom_sacagawea_pouch': ["She prepares a poultice from her Gatherer's Pouch."]
        }
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
        itemTaken: ["'A gift from the forest.'", "'The earth provides.'"],
        useCheatItem: {
          'custom_pocahontas_blessing': ["She drinks the blessed water. 'The river spirit protects me.'"],
          'custom_pocahontas_herbs1': ["She uses the berries to ward off sickness."],
          'custom_pocahontas_herbs2': ["The forest flowers bring a soothing calm."]
        }
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
        threatDefeated: ["The threat is gone. 'We must be brave.'", "'The land is a little safer now.'"],
        playerDamage: ["'This is a hard land.'", "'We must endure.'"],
        playerAttack: ["'Pa said we must be ready for anything.'", "'For the family.'"],
        useCheatItem: {
          'custom_laura_hardtack1': ["She eats some of Ma's hardtack. 'It's not fancy, but it's good.'"],
          'custom_laura_hardtack2': ["She eats some of Ma's hardtack. 'It's not fancy, but it's good.'"],
          'custom_laura_remedies': ["She uses a prairie remedy. 'Ma always knew what to do.'"]
        }
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
        playerHeal: ["'This make better.'", "'Good medicine.'"],
        equipCheatItem: {
          'item_bow_tonto': ["He strings his bow. 'Ready, Kemo Sabe.'"],
          'item_sharp_knife_tonto': ["The knife is a trusty tool."]
        },
        useCheatItem: {
          'item_bow_tonto': ["An arrow flies true from Tonto's bow."],
          'item_sharp_knife_tonto': ["The knife is sharp."],
          'custom_tonto_poultice': ["He applies the herbal poultice. 'Good medicine.'"]
        }
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
        { id: 'custom_beatrix_journal', name: "Naturalist's Journal", type: 'Action', effect: { type: 'draw', amount: 3 }, description: "A detailed sketch can reveal new insights. Draw 2 cards.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal' },
        { id: 'custom_beatrix_tea', name: "Peter Rabbit's Chamomile", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "A soothing tea for a naughty rabbit.", sellValue: 5, isCheat: true, illustrationId: 'provision_peppermint_t1', immediateEffect: { type: 'draw', amount: 2 } },
      ],
      catchphrases: {
        playerHeal: ["'There is something delicious about writing the first words of a story.'", "'Even the smallest one can change the world.'", "'Thank goodness I was never sent to school; it would have rubbed off some of the originality.'", "'There is something delicious about writing the first words of a story.'"],
        threatDefeated: ["'This is a fierce bad rabbit.'", "'The tale of the {enemyName} is concluded.'"],
        itemTaken: ["'This will make a fine illustration.'", "'A new character for my stories.'"],
        playerAttack: ["'Even a gentle hand must sometimes be firm.'", "'I cannot rest, I must draw, however poor the result.'"],
        useCheatItem: {
          'custom_beatrix_journal': ["She sketches in her journal, observing the world with a keen eye."],
          'custom_beatrix_tea': ["She sips the chamomile tea. 'First he ate some lettuces and then some French beans; and then he ate some radishes...'"]
        }
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
        { id: 'custom_pocket_pan', name: "Mr. Pocket's Gold Pan", type: 'Item', effect: { type: 'gold', amount: 25 }, description: "This pan has seen the color of gold more than most.", sellValue: 5, isCheat: true, illustrationId: 'item_gold_pan' },
        { id: 'custom_pocket_nugget', name: "Pocket Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 50, description: "A fine specimen.", isCheat: true, illustrationId: 'item_gold_nugget' },
      ],
      catchphrases: {
        goldFound: ["'There's gold in that river!'", "'It's a pocket! A pocket full of gold!'", "'I'm rich! I'm rich!'"],
        threatDefeated: ["'You ain't gettin' my poke!'", "'Back off! This is my claim!'", "'No one's gettin' my gold!'"],
        playerAttack: ["'Get off my land!'", "'This is for my claim!'"],
        playerDamage: ["'They're after my gold!'", "'I'll not be driven off!'"],
        itemBought: ["'This will help me find more gold.'", "'An investment in my future.'"],
        useCheatItem: {
          'custom_pocket_pan': ["He swirls the pan with a practiced hand. 'There's color!'"],
          'custom_pocket_nugget': ["He holds up the Pocket Nugget. 'A beauty, ain't she?'"]
        }
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
        { id: 'item_six_shooter_jane', name: "Jane's Revolver", type: 'Item', effect: { type: 'weapon', attack: 9 }, description: "A well-used revolver for a woman of the plains.", sellValue: 15, isCheat: true, illustrationId: 'item_six_shooter_t1' },
        { id: 'custom_jane_meat1', name: "Dried Meat", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "Sustenance for the long road.", sellValue: 2, isCheat: true, illustrationId: 'provision_dried_meat' },
        { id: 'custom_jane_meat2', name: "Dried Meat", type: 'Provision', effect: { type: 'heal', amount: 5 }, description: "Sustenance for the long road.", sellValue: 2, isCheat: true, illustrationId: 'provision_dried_meat' },
        { id: 'custom_jane_laudanum', name: "Laudanum", type: 'Provision', effect: { type: 'heal', amount: 7 }, description: "For the aches and pains of a hard life. Draw 2 cards.", sellValue: 7, isCheat: true, illustrationId: 'provision_laudanum_t1', immediateEffect: { type: 'draw', amount: 2 } },
      ],
      catchphrases: {
        playerAttack: ["'I'm a woman of the plains, and I fear no man.'", "'If you've got troubles, I've got a gun.'", "'This calls for a drink.'"],
        threatDefeated: ["'Leave me alone and let me go to hell by my own route.'", "'I figure if a girl wants to be a legend, she should go ahead and be one.'", "'I was a wild one, and I could lick any man in the country.'"],
        playerDamage: ["'It's a hard life, but it's my life.'", "'I've had worse.'"],
        laudanumAbuse: ["'A little something to take the edge off.'", "'It's for medicinal purposes.'"],
        goldFound: ["Finds {goldAmount} Gold. 'Well, I'll be.'"],
        equipCheatItem: {
          'item_six_shooter_jane': ["She checks her revolver. 'A girl's gotta be prepared.'"]
        },
        useCheatItem: {
          'item_six_shooter_jane': ["The revolver bucks in her hand. 'Not bad for a girl, eh?'"],
          'custom_jane_laudanum': ["She takes a swig of laudanum. 'For the pain.'"],
          'custom_jane_meat1': ["She eats some dried meat. 'Sustenance for the road.'"],
          'custom_jane_meat2': ["She eats some dried meat. 'Sustenance for the road.'"]
        }
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
        { id: 'custom_huston_pan', name: "Prospector's Pan", type: 'Item', effect: { type: 'gold', amount: 20 }, description: "A pan that's seen many a hopeful sunrise.", sellValue: 10, isCheat: true, illustrationId: 'item_gold_pan' },
        { id: 'custom_huston_pickaxe', name: "Pickaxe", type: 'Item', effect: { type: 'weapon', attack: 6 }, description: "For breaking rocks, or heads.", sellValue: 5, isCheat: true, illustrationId: 'item_sharp_knife_t1' }
      ],
      catchphrases: {
        goldFound: ["'Hey you fellas, have you got a few pennies for a fellow American down on his luck?'", "'Gold is a devilish sort of thing. It makes you crazy.'"],
        threatDefeated: ["He dances a jig. 'The gold of the Sierra Madre!'", "'Badges? We ain't got no badges. We don't need no badges! I don't have to show you any stinking badges!'", "'Laugh? That's a good one.'"],
        playerAttack: ["'I know what gold does to men's souls.'", "'This is my claim!'"],
        playerDamage: ["'This ain't no time for jokes.'", "'It's a long way to the top of the mountain.'"],
        itemBought: ["'A man's gotta have the right tools.'"],
        equipCheatItem: {
          'custom_huston_pickaxe': ["He hefts the pickaxe. 'This'll do the job.'"]
        },
        useCheatItem: {
          'custom_huston_pan': ["He swirls the pan with a practiced hand. 'Come on, just a little color.'"],
          'custom_huston_pickaxe': ["He swings the pickaxe with surprising force."]
        }
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
        { id: 'custom_pete_nugget1', name: "Large Gold Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 50, description: "It's a motherlode!", isCheat: true, illustrationId: 'item_gold_nugget_t2' },
        { id: 'custom_pete_nugget2', name: "Large Gold Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 50, description: "It's a motherlode!", isCheat: true, illustrationId: 'item_gold_nugget_t2' },
      ],
      catchphrases: {
        goldFound: ["'It's a gold rush!'", "'Yee-haw!'", "'I'm rich! I'm rich!'"],
        itemTaken: ["'That's not for you!'", "'This is my chance!'", "'I've been waiting for this for years!'"],
        playerAttack: ["'You can't rush art.'", "'Get away from me!'"],
        threatDefeated: ["'This is my moment!'", "'I'm free!'"],
        playerDamage: ["'My box! He's stealing my box!'", "'The museum... I'm going to the museum!'"],
        useCheatItem: {
          'custom_pete_nugget1': ["He cashes in the nugget. 'I'm goin' to a museum! Finally!'"],
          'custom_pete_nugget2': ["He cashes in the nugget. 'I'm goin' to a museum! Finally!'"]
        }
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
        { id: 'custom_hosea_map', name: "Hosea's Map", type: 'Player Upgrade', effect: { type: 'upgrade', subtype: 'sell_boost', amount: 15, persistent: true }, description: "A map to a forgotten score. Or is it?", sellValue: 50, isCheat: true, illustrationId: 'upgrade_treasure_map' },
        { id: 'custom_hosea_book', name: "Book of Stories", type: 'Action', effect: { type: 'draw', amount: 2 }, description: "A well-told story can reveal new opportunities. Draw 2 cards and heal 2 HP.", sellValue: 5, isCheat: true, illustrationId: 'upgrade_medical_journal', immediateEffect: { type: 'heal', amount: 2 } }
      ],
      catchphrases: {
        threatDefeated: ["'I wish I had acquired wisdom at less of a price.'", "'There's always a buyer for a good story.'", "'I know you. You're a good man.'", "'The trick is to be a survivor.'"],
        itemTaken: ["'There's always a buyer for a good story.'", "'There's always a market for a bit of... creativity.'", "'It's all part of the act.'"],
        playerAttack: ["'This is not the way.'", "'A necessary evil.'"],
        playerHeal: ["'I'm an old man.'", "'A moment to catch my breath.'"],
        goldFound: ["'A fine addition to the camp funds.'", "'This will help us on our way.'"],
        equipCheatItem: {
          'custom_hosea_map': ["He consults his map. 'I've got a plan.'"]
        },
        useCheatItem: {
          'custom_hosea_book': ["He reads from his book of stories. 'Now this reminds me of a tale...'"]
        }
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
        { id: 'custom_gus_pan', name: "Gus's Lucky Pan", type: 'Item', effect: { type: 'gold', amount: 75 }, description: "This pan's seen more color than a San Francisco saloon.", sellValue: 10, isCheat: true, illustrationId: 'item_gold_pan' },
        { id: 'custom_gus_nugget', name: "Gus's Big Nugget", type: 'Item', effect: { type: 'gold' }, sellValue: 750, description: "The one that started it all!", isCheat: true, illustrationId: 'item_gold_nugget_t2' },
      ],
      catchphrases: {
        goldFound: ["'Yeehaw! Rich at last!'", "'Gold! Gold! Gold!'", "'I've struck it rich!'", "'This is the life!'"],
        playerAttack: ["'Get away from my claim!'", "'This is my gold!'"],
        threatDefeated: ["'Nobody's takin' my gold!'", "'I'm the king of this here mountain!'"],
        itemBought: ["'Gotta spend it to make it!'", "'This'll help me find more gold!'"],
        playerDamage: ["'Ouch! That's comin' out of your share!'", "'You'll not get a penny from me!'"],
        useCheatItem: {
          'custom_gus_pan': ["He swirls his lucky pan. 'Yee-haw! Look at that color!'"],
          'custom_gus_nugget': ["He holds up the Big Nugget. 'This is the one that'll make me rich!'"]
        }
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
  REMIX_DECK: "remix my deck",
};

export const CHEAT_ADD_GOLD_AMOUNT = 5000;

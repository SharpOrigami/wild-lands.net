import { CardData } from '../../types.ts';

export const OBJECTIVE_CARDS: { [id: string]: CardData } = {
    'objective_take_em_alive': { 
        id: 'objective_take_em_alive', 
        name: "Wanted: Alive", 
        type: 'Event', 
        subType: 'objective', 
        description: "A territorial governor wants to make an example of the final threat, not a martyr. The poster is clear: bring them in alive, if barely.\n\nOBJECTIVE: The final boss must be captured alive. This can be done in two ways: by landing a final blow that deals 5 or less damage, OR by weakening the boss to 4 or less health and ending the day to capture them overnight.\nREWARD: +100 Gold.\nFAILURE: If the final blow deals more than 5 damage, or they are defeated by other means, the objective is void.", 
        effect: { 
            type: 'objective_boss_condition', 
            objective_description: "The final boss must be captured alive. This can be done in two ways: by landing a final blow that deals 5 or less damage, OR by weakening the boss to 4 or less health and ending the day to capture them overnight.", 
            reward_description: "+100 Gold.", 
            failure_description: "If the final blow deals more than 5 damage, or they are defeated by other means, the objective is void." 
        }
    },
    'objective_swift_justice': { id: 'objective_swift_justice', name: "Swift Justice", type: 'Event', subType: 'objective', description: "A wealthy land baron's family was wronged by the final threat, and their patience has run out. They want justice, and they want it now.\n\nOBJECTIVE: Defeat the final boss on or before Day 30.\nREWARD: Start your next journey with an AI-remixed legendary themed hat.\nFAILURE: If the boss is defeated on Day 31 or later, the contract is void.", effect: { type: 'objective_boss_condition', objective_description: "Defeat the final boss on or before Day 30.", reward_description: "Start your next journey with an AI-remixed legendary themed hat.", failure_description: "If the boss is defeated on Day 31 or later, the contract is void. No reward." }},
    'objective_the_purist': { id: 'objective_the_purist', name: "The Purist", type: 'Event', subType: 'objective', description: "An eccentric naturalist believes that sickness is a weakness of character. They will only pay for a 'pure' specimen, demanding you face the final threat in perfect health.\n\nOBJECTIVE: Defeat the final boss while not suffering from any persistent illness (e.g., Dysentery, Malaria, Snake Bite).\nREWARD: Start your next journey with an AI-remixed legendary themed provision.\nFAILURE: If you are afflicted with any persistent illness upon victory, the objective is void.", effect: { type: 'objective_boss_condition', objective_description: "Defeat the final boss while not suffering from any persistent illness (e.g., Dysentery, Malaria, Snake Bite).", reward_description: "Start your next journey with an AI-remixed legendary themed provision.", failure_description: "If you are afflicted with any persistent illness upon victory, the objective is void. No reward." }},
    'objective_the_hoarder': { id: 'objective_the_hoarder', name: "The Hoarder", type: 'Event', subType: 'objective', description: "A secretive society of financiers sees wealth as the ultimate measure of a person. They've issued a challenge: defeat the great threat not just with skill, but with a display of immense prosperity.\n\nOBJECTIVE: Possess 250 or more Gold at the moment you defeat the final boss.\nREWARD: Begin your next journey with an additional +50 Gold.\nFAILURE: If you have less than 250 Gold upon victory, the objective is void.", effect: { type: 'objective_player_condition', objective_description: "Possess 250 or more Gold at the moment you defeat the final boss.", reward_description: "Begin your next journey with an additional +50 Gold.", failure_description: "If you have less than 250 Gold upon victory, the objective is void. No reward." }},
    'objective_a_beasts_end': { 
        id: 'objective_a_beasts_end', 
        name: "Apex Hunter", 
        type: 'Event', 
        subType: 'objective', 
        description: "The Royal Society for the Study of Arcane Fauna has put out a contract for a true apex predator. They believe facing such a creature is the ultimate test of a hunter's skill, regardless of who the final bounty is.\n\nOBJECTIVE: Defeat any 'Apex Predator' type animal during your run (e.g., Grizzly Bear, Wolf Pack, Cougar).\nREWARD: Start your next journey with an AI-remixed legendary themed fur coat.\nFAILURE: If you complete the run without defeating an Apex Predator, the objective is void.", 
        effect: { 
            type: 'objective_player_condition', 
            objective_description: "Defeat any 'Apex Predator' type animal during your run (e.g., Grizzly Bear, Wolf Pack, Cougar).", 
            reward_description: "Start your next journey with an AI-remixed legendary themed fur coat.", 
            failure_description: "If you complete the run without defeating an Apex Predator, the objective is void. No reward." 
        }
    },
    'objective_mans_inhumanity': { id: 'objective_mans_inhumanity', name: "Man's Inhumanity", type: 'Event', subType: 'objective', description: "A circuit judge, tired of the lawlessness of the frontier, wants a clear message sent. They will only pay for the head of a human culprit, believing the greatest monsters walk on two legs.\n\nOBJECTIVE: The final boss you face and defeat must be of the 'human' subtype.\nREWARD: Start your next journey with an AI-remixed legendary themed weapon.\nFAILURE: If the final boss is of the 'animal' subtype, the objective is void.", effect: { type: 'objective_boss_condition', objective_description: "The final boss you face and defeat must be of the 'human' subtype.", reward_description: "Start your next journey with an AI-remixed legendary themed weapon.", failure_description: "If the final boss is of the 'animal' subtype, the objective is void. No reward." }},
    'objective_the_last_stand': { id: 'objective_the_last_stand', name: "The Last Stand", type: 'Event', subType: 'objective', description: "A mysterious, scarred veteran has posted this notice, seeking a hunter who lives on the edge. They believe a true victory is only earned when you have nothing left to lose.\n\nOBJECTIVE: Defeat the final boss while your own health is at 5 HP or less.\nREWARD: Your character's base health is permanently increased by 2 for this lineage.\nFAILURE: If your health is 6 or more upon victory, the objective is void.", effect: { type: 'objective_player_condition', objective_description: "Defeat the final boss while your own health is at 5 HP or less.", reward_description: "Your character's base health is permanently increased by 2 for this lineage.", failure_description: "If your health is 6 or more upon victory, the objective is void. No reward." }},
    'objective_well_prepared': { id: 'objective_well_prepared', name: "Well-Prepared", type: 'Event', subType: 'objective', description: "A Guild of Provisioners wants to sponsor a hunter who exemplifies their values of preparation and endurance. They want to see someone who plans ahead, gathering supplies for the long road.\n\nOBJECTIVE: Collect (buy from the store or take from the trail) 5 or more 'Provision' type cards before the final boss appears.\nREWARD: Your starter 'Dried Meat' is upgraded to 'Steak' on your next journey.\nFAILURE: If you have collected fewer than 5 'Provision' cards when the boss appears, the objective is void.", effect: { type: 'objective_player_condition', objective_description: "Collect (buy from the store or take from the trail) 5 or more 'Provision' type cards before the final boss appears.", reward_description: "Your starter 'Dried Meat' is upgraded to 'Steak' next run.", failure_description: "If you have collected fewer than 5 'Provision' cards when the boss appears, the objective is void. No reward." }},
    'objective_the_marksman': { id: 'objective_the_marksman', name: "The Marksman", type: 'Event', subType: 'objective', description: "The 'Peacemaker' Firearms Company wants a living advertisement. They'll handsomely reward any hunter who can prove the superiority of gunpowder by ending the great threat with a bullet.\n\nOBJECTIVE: Deliver the final, defeating blow to the boss with a firearm-type weapon (e.g. Six Shooter, Rifle).\nREWARD: Start your next journey with an AI-remixed legendary themed weapon.\nFAILURE: If the final blow is from any other source (bow, knife, trap, etc.), the objective is void.", effect: { type: 'objective_boss_condition', objective_description: "Deliver the final, defeating blow to the boss with a firearm-type weapon (e.g. Six Shooter, Rifle).", reward_description: "Start your next journey with an AI-remixed legendary themed weapon.", failure_description: "If the final blow is from any other source (bow, knife, trap, etc.), the objective is void." }},
    'objective_the_stalker': { id: 'objective_the_stalker', name: "The Stalker", type: 'Event', subType: 'objective', description: "The elite 'Silent Arrow' hunting society scoffs at noisy firearms. They have issued a challenge for a true hunter to prove that skill, silence, and a well-placed arrow are all one needs.\n\nOBJECTIVE: Deliver the final, defeating blow to the boss with a bow-type weapon (e.g. Bow, Long Bow).\nREWARD: Start your next journey with an AI-remixed legendary themed bow.\nFAILURE: If the final blow is from any other source (firearm, knife, trap, etc.), the objective is void.", effect: { type: 'objective_boss_condition', objective_description: "Deliver the final, defeating blow to the boss with a bow-type weapon (e.g. Bow, Long Bow).", reward_description: "Start your next journey with an AI-remixed legendary themed bow.", failure_description: "If the final blow is from any other source (firearm, knife, trap, etc.), the objective is void." }},
    'objective_cut_throat': { id: 'objective_cut_throat', name: "Cut-Throat", type: 'Event', subType: 'objective', description: "An anonymous notice, stained with something dark, calls for a visceral, personal touch. The poster wants the final threat ended not from a distance, but with cold steel.\n\nOBJECTIVE: Deliver the final, defeating blow to the boss with a bladed weapon (e.g. Knife, Sharp Knife).\nREWARD: Start your next journey with an AI-remixed legendary themed bladed weapon.\nFAILURE: If the final blow is from any other source (firearm, bow, trap, etc.), the objective is void.", effect: { type: 'objective_boss_condition', objective_description: "Deliver the final, defeating blow to the boss with a bladed weapon (e.g. Knife, Sharp Knife).", reward_description: "Start your next journey with an AI-remixed legendary themed bladed weapon.", failure_description: "If the final blow is from any other source (firearm, bow, trap, etc.), the objective is void." }},
    'objective_the_expediter': { id: 'objective_the_expediter', name: "The Expediter", type: 'Event', subType: 'objective', description: "An impatient railroad tycoon believes the final threat is disrupting their expansion. They don't have time for a protracted hunt and will reward you for a swift resolution.\n\nACTION: From your hand, discard 5 'Provision' type cards at once to immediately summon the final boss.\nREWARD: +100 Gold on victory for expediting the hunt.\nFAILURE: If you defeat the boss without using this action, the objective is void.", effect: { type: 'objective_discard_to_win', objective_description: "Action: From your hand, discard 5 'Provision' type cards at once to immediately summon the final boss.", reward_description: "+100 Gold on victory for expediting the hunt.", failure_description: "If you defeat the boss without using this action, the objective is void. No reward." }},
    'objective_master_trapper': { id: 'objective_master_trapper', name: "Master Trapper", type: 'Event', subType: 'objective', description: "The Frontier Trappers Guild is looking for a new master. To prove your worth, you must demonstrate your skill with traps against the creatures of the wild before facing the ultimate quarry.\n\nOBJECTIVE: Before the final boss appears, defeat at least 3 separate 'animal' subtype threats using traps.\nREWARD: Start your next journey with an AI-remixed legendary themed trap.\nFAILURE: If you defeat fewer than 3 animals with traps before the boss appears, the objective is void.", effect: { type: 'objective_player_condition', objective_description: "Before the final boss appears, defeat at least 3 separate 'animal' subtype threats using traps.", reward_description: "Start your next journey with an AI-remixed legendary themed trap.", failure_description: "If you defeat fewer than 3 animals with traps before the boss appears, the objective is void. No reward." }},
    'objective_fur_trader': {
        id: 'objective_fur_trader',
        name: "The Fur Trader",
        type: 'Event',
        subType: 'objective',
        description: "The trading post has a large order to fill and they're paying top dollar. They need furs, hides, antlers - any trophy you can bring them from the wilds.\n\nOBJECTIVE: Sell 5 'Trophy' type cards before defeating the final boss.\nREWARD: Start your next journey with an AI-remixed legendary themed fur coat.\nFAILURE: If you sell fewer than 5 Trophies, the objective is void.",
        effect: {
            type: 'objective_player_condition',
            objective_description: "Sell 5 'Trophy' type cards before defeating the final boss.",
            reward_description: "Start your next journey with an AI-remixed legendary themed fur coat.",
            failure_description: "If you sell fewer than 5 Trophies, the objective is void."
        }
    },
    'objective_the_lawman': {
        id: 'objective_the_lawman',
        name: "The Lawman",
        type: 'Event',
        subType: 'objective',
        description: "The local marshal is swamped with bounties and is outsourcing the work. Bring in proof of 3 collected bounties and you'll earn a hefty bonus.\n\nOBJECTIVE: Sell 3 'Objective Proof' type cards before defeating the final boss.\nREWARD: +100 Gold.\nFAILURE: If you sell fewer than 3 'Objective Proof' cards, the objective is void.",
        effect: {
            type: 'objective_player_condition',
            objective_description: "Sell 3 'Objective Proof' type cards before defeating the final boss.",
            reward_description: "+100 Gold.",
            failure_description: "If you sell fewer than 3 'Objective Proof' cards, the objective is void."
        }
    },
    'objective_human_peacemaker': {
        id: 'objective_human_peacemaker',
        name: "Human Peacemaker",
        type: 'Event',
        subType: 'objective',
        description: "A mysterious stranger believes violence is not always the answer. They will reward those who can show mercy and understanding to their fellow man.\n\nOBJECTIVE: Successfully de-escalate 1 encounter with a 'human' threat by talking them down.\nREWARD: Start your next journey with an AI-remixed legendary themed weapon.\nFAILURE: If you do not de-escalate any human encounters, the objective is void.",
        effect: {
            type: 'objective_player_condition',
            objective_description: "Successfully de-escalate 1 encounter with a 'human' threat by talking them down.",
            reward_description: "Start your next journey with an AI-remixed legendary themed weapon.",
            failure_description: "If you do not de-escalate any human encounters, the objective is void."
        }
    },
    'objective_animal_peacemaker': {
        id: 'objective_animal_peacemaker',
        name: "Animal Peacemaker",
        type: 'Event',
        subType: 'objective',
        description: "A mysterious stranger believes in respecting the creatures of the wild. They will reward those who show kindness to the beasts of the frontier.\n\nOBJECTIVE: Successfully pacify 1 'animal' threat by petting it.\nREWARD: Start your next journey with an AI-remixed legendary themed provision.\nFAILURE: If you do not pacify any animal encounters, the objective is void.",
        effect: {
            type: 'objective_player_condition',
            objective_description: "Successfully pacify 1 'animal' threat by petting it.",
            reward_description: "Start your next journey with an AI-remixed legendary themed provision.",
            failure_description: "If you do not pacify any animal encounters, the objective is void."
        }
    },
    'objective_big_spender': {
        id: 'objective_big_spender',
        name: "The Big Spender",
        type: 'Event',
        subType: 'objective',
        description: "The local storekeep is struggling and has promised a special dividend to their most loyal customer. Keep the local economy booming!\n\nOBJECTIVE: Spend at least 500 Gold at the General Store by buying items (restocking does not count).\nREWARD: Begin your next journey with an additional +100 Gold.\nFAILURE: If you spend less than 500 Gold, the objective is void.",
        effect: {
            type: 'objective_player_condition',
            objective_description: "Spend at least 500 Gold at the General Store by buying items (restocking does not count).",
            reward_description: "Begin your next journey with an additional +100 Gold.",
            failure_description: "If you spend less than 500 Gold, the objective is void."
        }
    }
};

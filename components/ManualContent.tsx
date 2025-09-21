import React from 'react';

interface ManualContentProps {
  isManualPreloading: boolean;
  manualPreloadProgress: number;
  handlePreloadAllAssets: () => void;
}

const ManualContent: React.FC<ManualContentProps> = ({
  isManualPreloading,
  manualPreloadProgress,
  handlePreloadAllAssets,
}) => {
  return (
    <div className="text-sm">
      <p className="italic mb-3">Alright, partner! Here's the lowdown on how to survive and thrive in the Wild Lands. Keep this guide handy, and you might just make a name for yourself!</p>

      <h4 className="font-western text-xl mt-3 mb-1">The Lay of the Land: Your Goal</h4>
      <p>Your main goal is to survive the treacherous journey through the Wild Lands and ultimately defeat the formidable, AI-generated Boss that stands as the final challenge. The frontier is a harsh mistress, and you'll need wit, grit, and a bit of luck.</p>

      <h4 className="font-western text-xl mt-3 mb-1">Gearing Up: Game Setup</h4>
      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Choose Your Character:</h5>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li>You'll start by picking a Character. Each character comes with:
          <ul className="list-disc list-inside ml-6">
            <li>A unique name and backstory.</li>
            <li>Different starting Health and Gold.</li>
            <li>A special Ability (passive bonus).</li>
            <li>A unique Starter Deck of 10 cards.</li>
          </ul>
        </li>
        <li>Enter a name for your chosen character.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">A Day in the Wilds: Game Flow</h4>
      <p>The game progresses in Days (turns). Each day is divided into three phases: Daylight, Dusk, and Dawn.</p>
      
      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Daylight (Player Actions):</h5>
      <p>This is where you make your moves! You can generally perform actions in any order, but some have limits:</p>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Play Cards from Hand:</span>
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Provisions:</span> Consume for effects like healing, curing illness, or drawing cards.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Items (Weapons):</span> Use against an active Threat.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #92400e 30%)' }}>Items (Traps):</span> Set an active trap (replaces any current one).</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Items (Other):</span> Use for their specific effects (e.g., Gold Pan for immediate gold, Firewood for campfire).</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Actions:</span> Play for unique effects (e.g., Scout Ahead, Trick Shot).</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Player Upgrades:</span> These are usually equipped for persistent bonuses, not "played" for a one-time effect from hand.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Equip Items/Upgrades:</span>
          <ul className="list-disc list-inside ml-6">
            <li>You can equip one Item or Player Upgrade from your hand per day.</li>
            <li>These go into your limited Equip Slots (usually 3).</li>
            <li>Equipped weapons often get a damage bonus. Upgrades provide ongoing benefits.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Hats (Damage Negation Upgrades)</span> provide a one-time damage block and then are discarded.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Interact with Threats:</span>
          <ul className="list-disc list-inside ml-6">
            <li>Instead of fighting, you can click on an active Human or Animal threat to attempt a peaceful interaction. This counts as your main action for the turn.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Talking (Humans):</span> Success depends on your character's Talk skill. A successful talk will make them leave peacefully.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Petting (Animals):</span> Success depends on your Petting skill. A successful pet will make them non-hostile for the turn, and they will leave at night.</li>
            <li><span className="font-bold uppercase text-[var(--blood-red)]">Final Boss:</span> Successfully talking down the final boss counts as a victory! They will pay you their bounty to let them go. However, this peaceful resolution will **void any active run Objectives**, as their conditions require defeating the boss in combat.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Use Equipped Items:</span> Some equipped items can be actively used (like a weapon).</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Store Provisions:</span> If you have a Satchel equipped, you can move Provision cards from your hand into the Satchel (up to its capacity).</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Use Provisions from Satchel:</span> You can use a Provision directly from your Satchel.</li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Interact with the Store:</span>
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Buy:</span> Purchase items from the 3 displayed Store Items using Gold.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Restock:</span> Pay a scaling amount of Gold (starts at 10G) to discard the current Store Items and draw 3 new ones. This can be done once per day.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Trading Blocked:</span> You cannot buy or restock if a "hostile" Event is active (generally, any threat that can attack or steal from you).</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Sell Items:</span>
          <ul className="list-disc list-inside ml-6">
            <li>You can sell most items from your hand (or equipped items) for Gold. Trophy/Objective Proof cards are prime for selling.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Trading Blocked:</span> Selling is also blocked by hostile events.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Take Event Item:</span> If the current "Event" is actually a non-hostile Item, Provision, or Upgrade, you can choose to take it. This usually counts as your main action for the turn.</li>
      </ul>

      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Dusk (End of Day):</h5>
      <p>When you click the "End Day" button, the Night Phase begins:</p>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Night Attacks:</span> Some threats (like Thieves, Vagabonds, Skunks, or Rattlesnakes) attack at night if they are the active event. An active Campfire will deter certain animal attackers (like Skunks and Rattlesnakes), but not humans.</li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Hand Discard:</span> All cards remaining in your hand are discarded.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--scarlet-fever-color) 30%)' }}>Illness Worsens:</span> If you have a persistent illness (Malaria, Dysentery, etc.), your Maximum Health is permanently reduced by 1.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #92400e 30%)' }}>Campfire Consumed:</span> If your Campfire was active, it's now used up. Its protection lasts through the night and the following morning's events.</li>
      </ul>

      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Dawn (Start of the Next Day):</h5>
      <p>A new day begins with a sequence of automatic events:</p>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #7e22ce 30%)' }}>New Event:</span> If no event is active and you didn't have a campfire burning through the night, a new card is drawn from the Event Deck.
            <ul className="list-disc list-inside ml-6">
                <li>Immediate effects (like a Thief's steal or a Lightning Strike) happen instantly.</li>
                <li>If a threat is drawn that matches your active Trap, the trap will trigger.</li>
            </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Morning Attack:</span> Any hostile threat that is now active (either carried over from yesterday or just drawn) will attack you.</li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Morning Routine:</span> Passive item effects trigger.
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Waterskin Canteen:</span> Heals you a bit.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Gold Pan:</span> Grants you some gold.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Max Health Recovery:</span> If you are not suffering from a persistent illness, you'll recover 1 point of lost Maximum Health.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Card Draw:</span> You draw cards from your Player Deck until your hand is full.
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--puke-yellow) 30%)' }}>Mountain Sickness:</span> If you had this, you'll draw 1 fewer card this turn, and then the sickness is gone.</li>
            <li>If your Player Deck runs out, your Player Discard pile is shuffled to form a new deck.</li>
          </ul>
        </li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">Objectives of the Frontier</h4>
      <p>At the start of your journey, you'll be presented with an Objective card. This is an optional, special challenge for the entire run, on top of simple survival. This card will stay visible on the Frontier panel as a constant reminder of your goal.</p>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Complete the objective</span> and then defeat the final boss to claim your reward.</li>
        <li><span className="font-bold uppercase text-[var(--ink-secondary)]">If you fail the objective</span>, there's no penalty other than missing out on the reward.</li>
        <li><span className="font-bold uppercase text-[var(--tarnished-gold)]">The rewards</span> are often powerful, providing bonuses for your next run in that character's lineage.</li>
      </ul>
      <h5 className="font-pulp-title text-lg mt-2 mb-0.5">Available Objectives:</h5>
      <ul className="list-disc list-inside ml-4 mb-1 text-xs">
        <li><strong className="text-base">Take 'Em Alive:</strong> Defeat the boss with a final blow of 5 or less damage. Reward: +100 Gold for the current run.</li>
        <li><strong className="text-base">Swift Justice:</strong> Defeat the boss on or before Day 30. Reward: Start next journey with an AI-remixed legendary themed hat.</li>
        <li><strong className="text-base">The Purist:</strong> Defeat the boss while not suffering from any persistent illness. Reward: Start next journey with an AI-remixed legendary themed provision.</li>
        <li><strong className="text-base">The Hoarder:</strong> Possess 250 or more Gold when you defeat the boss. Reward: Start your next journey with +50 Gold.</li>
        <li><strong className="text-base">A Beast's End:</strong> The final boss must be an 'animal'. Reward: Start next journey with an AI-remixed legendary themed fur coat.</li>
        <li><strong className="text-base">Man's Inhumanity:</strong> The final boss must be 'human'. Reward: Start next journey with an AI-remixed legendary themed weapon.</li>
        <li><strong className="text-base">The Last Stand:</strong> Defeat the boss while you have 5 or less HP. Reward: +2 permanent Max Health for your character's lineage.</li>
        <li><strong className="text-base">Well-Prepared:</strong> Collect (buy or take) 5 or more Provisions before the boss appears. Reward: Your starter 'Dried Meat' becomes 'Steak' on your next journey.</li>
        <li><strong className="text-base">The Marksman:</strong> Land the final blow on the boss with a firearm. Reward: Start next journey with an AI-remixed legendary themed weapon.</li>
        <li><strong className="text-base">The Stalker:</strong> Land the final blow on the boss with a bow. Reward: Start next journey with an AI-remixed legendary themed bow.</li>
        <li><strong className="text-base">Cut-Throat:</strong> Land the final blow on the boss with a bladed weapon. Reward: Start next journey with an AI-remixed legendary themed bladed weapon.</li>
        <li><strong className="text-base">The Expediter:</strong> Use the card's action (discard 5 Provisions from hand) to immediately summon the boss. Reward: +100 Gold upon victory.</li>
        <li><strong className="text-base">Master Trapper:</strong> Defeat at least 3 'animal' threats with traps before the boss appears. Reward: Start next journey with an AI-remixed legendary themed trap.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">Walk the Trail: Pedometer (Optional)</h4>
      <p>For a more immersive journey, you can enable the Pedometer feature. This is an entirely voluntary feature that uses your device's GPS.</p>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Enable:</span> Click the "Enable Pedometer" button on the setup screen. You may need to grant location permissions.</li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Function:</span> While active, the game tracks your real-world movement and converts it to steps. The game includes logic to pause step-counting if it detects you are moving too fast (e.g., in a vehicle).</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Rewards:</span> For your efforts on the trail, you will be rewarded:
          <ul className="list-disc list-inside ml-6">
            <li>1 Gold for every 50 steps taken.</li>
            <li>1 Health for every 100 steps taken.</li>
            <li>1 Card Draw for every 250 steps taken.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase text-[var(--ink-secondary)]">Privacy:</span> No location data is saved or transmitted externally from your device by this application. All calculations are done locally on your device.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">Tools of the Trade: Card Types</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Events:</span> These are drawn from the Event Deck and represent encounters.
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Threats (Animals & Humans):</span> These are enemies you'll likely have to fight. They have Health, attack you for damage, and often give Gold and a Trophy/Objective Proof card when defeated.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--scarlet-fever-color) 30%)' }}>Illnesses:</span> These cards give you a negative status condition.
              <ul className="list-disc list-inside ml-8">
                <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--scarlet-fever-color) 30%)' }}>Malaria, Dysentery, Scarlet Fever, Snake Bite:</span> Persistent. Reduce Max HP by 1 each day if uncured.</li>
                <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--puke-yellow) 30%)' }}>Mountain Sickness:</span> Temporary. Draw 1 fewer card the next day, then it's gone.</li>
              </ul>
            </li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #c2410c 30%)' }}>Environmental:</span> One-time bad events like Rockslides or Lightning Strikes.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Found Items/Provisions:</span> Sometimes the "event" is just finding a useful card.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Provisions:</span> Consumable items.
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Herbs (Juniper, Basil, Peppermint, Sage):</span> Heal 1 HP AND cure a specific illness.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Fever Tonic:</span> Heals 3 HP & cures Scarlet Fever.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Miracle Cure:</span> Heals 5 HP AND cures ANY illness.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Other Food/Tonics:</span> Heal HP or provide other benefits (like drawing cards via Stamina Tonic).</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Items:</span>
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Weapons (Guns, Bows, Knives):</span> Used to attack Threats. More effective when equipped.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #92400e 30%)' }}>Traps:</span> Can be set to automatically defeat or damage certain animal Threats when they are revealed. Less effective or just break against larger animals or humans, possibly dealing some damage.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Valuables (Gold Nuggets, Jewelry):</span> Primarily for selling for Gold.</li>
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #92400e 30%)' }}>Firewood:</span> Used to build a Campfire to protect you through the night.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Player Upgrades:</span> These are equipped for long-term benefits.
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Examples:</span> Coats (Max HP), Satchels (store provisions), Hats (one-time damage negation + Max HP), Bandoliers (double firearm damage), Quivers (double bow damage), specific weapon type boosts.</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Actions:</span> Cards played from hand for a special effect.
          <ul className="list-disc list-inside ml-6">
            <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-blue) 30%)' }}>Examples:</span> Scout Ahead (preview next event), Trick Shot (conditional weapon attack).</li>
          </ul>
        </li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #92400e 30%)' }}>Trophy/Objective Proof:</span> Earned by defeating Threats. Sell them for Gold.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">Showdown: Combat</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li>To fight an active Threat, play a weapon Item from your hand or use an equipped weapon.
          <ul className="list-disc list-inside ml-6">
            <li>The damage dealt is based on the weapon's attack power, plus bonuses from being equipped, and any relevant Player Upgrades (e.g., a Bandolier doubles firearm damage, Lucky Bullet adds to firearm damage).</li>
          </ul>
        </li>
        <li>Reduce the Threat's Health by the damage dealt.</li>
        <li>If the Threat's Health reaches 0, it's defeated! You'll typically get Gold and a Trophy/Objective Proof card added to your discard pile.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">The General Store</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li>The store always displays 3 items for sale.</li>
        <li>You can buy any displayed item if you have enough Gold. Purchased items go to your discard pile.</li>
        <li>Once per day, you can pay a scaling amount of Gold (starts at 10G) to "Restock" the store. This discards the current items and draws 3 new ones.</li>
        <li>You cannot buy or restock if a "hostile" Event is active.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">Sickness and Health</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Juniper Berries:</span> Heal 1 HP & cure Malaria.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Wild Basil:</span> Heal 1 HP & cure Dysentery.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Peppermint:</span> Heal 1 HP & cure Scarlet Fever.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Wild Sage:</span> Heal 1 HP & cure Snake Bite.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Fever Tonic:</span> Heals 3 HP & cures Scarlet Fever.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Miracle Cure:</span> Heals 5 HP AND cures ANY illness.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--puke-yellow) 30%)' }}>Mountain Sickness:</span> Draw 1 fewer card next day, then it automatically resolves. Does not reduce Max Health.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--scarlet-fever-color) 30%)' }}>Persistent Illnesses (Malaria, etc.):</span> If you end the day with one of these, your Maximum Health is reduced by 1.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>Recovering Max Health:</span> If you are not suffering from a persistent illness, you regain 1 point of lost Maximum Health at the start of each day, up to your character's natural maximum (plus any permanent bonuses from NG+ or certain upgrades).</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">The End of the Trail: Winning & Losing</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, #16a34a 30%)' }}>Victory:</span> You win by defeating the AI-generated final Boss! The boss typically appears when the Event Deck is depleted, but may arrive sooner if you take too many days (around Day 40)!</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Defeat:</span> If your Health drops to 0, your journey ends. You can then retry the same NG+ level from the start.</li>
      </ul>
      
      <h4 className="font-western text-xl mt-3 mb-1">Resetting Your Progress</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Reset:</span> From the main character selection screen, you can 'Reset' your game. This will erase all your progress, including unlocked NG+ levels, and start you fresh at NG+0. Your lifetime statistics will be preserved.</li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Restart:</span> During a game, you can 'Restart' the current run. This will return you to the character selection screen with your initial deck and items for that NG+ level, allowing you to try again. All progress within the current run will be lost.</li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Reset All Stats:</span> This option is available in the 'View Stats' modal. It will permanently erase all your lifetime statistics. This action cannot be undone.</li>
      </ul>

      <h4 className="font-western text-xl mt-3 mb-1">New Game Plus (NG+):</h4>
      <ul className="list-disc list-inside ml-4 mb-1">
        <li>If you've conquered the frontier before (defeated the boss), you might be starting an NG+ run!</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>Rewards:</span> At the start of an NG+ run, you'll choose one of these permanent (for that character lineage) cumulative bonuses:
            <ul className="list-disc list-inside ml-6">
                <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--faded-green) 30%)' }}>+1 Maximum Health:</span> This stacks with each time you pick it across NG+ levels.</li>
                <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--tarnished-gold) 30%)' }}>+100 Gold:</span> Added to your starting gold for that run.</li>
            </ul>
        </li>
        <li><span className="font-bold uppercase text-[var(--ink-main)]">Carry-Over:</span> After a victory, you enter a Deck Review screen to select up to 7 cards from your previous deck to keep. Unselected cards are sold for gold. Your gold, equipped items, and satchel contents also carry over. Your new deck is built from your selected cards, starter cards, and then filled to the target size.</li>
        <li><span className="font-bold uppercase" style={{ color: 'color-mix(in srgb, var(--ink-main) 70%, var(--blood-red) 30%)' }}>Increased Difficulty:</span> Expect tougher challenges! Enemies will have more health, hit harder, and might be worth more gold. The very cards you encounter might be "remixed" at certain NG+ milestones (e.g., NG+10, NG+20), offering new twists.</li>
      </ul>
      
      <div className="mt-6 pt-4 border-t-2 border-dashed border-[var(--border-color)]">
          <div className='text-left'>
            <h4 className="font-western text-lg text-[var(--ink-secondary)] mb-2">Offline Play</h4>
            <p className="text-xs italic mb-3">For the best offline experience, you can preload all game assets. This will download all images and sounds to your device. AI features like story generation will still require an internet connection.</p>
            <button
                onClick={handlePreloadAllAssets}
                disabled={isManualPreloading}
                className="button !bg-slate-700 hover:!bg-slate-800 !text-white !border-slate-900 !text-xs !py-1 !px-2"
            >
                {isManualPreloading ? `Preloading...` : 'Preload All Assets'}
            </button>
            {isManualPreloading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${manualPreloadProgress}%` }}></div>
                    <p className="text-xs text-center mt-1">{manualPreloadProgress.toFixed(0)}% Complete</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ManualContent;

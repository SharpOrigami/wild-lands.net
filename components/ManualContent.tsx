import React from 'react';

interface ManualContentProps {
  isManualPreloading: boolean;
  manualPreloadProgress: number;
  handlePreloadAllAssets: () => void;
  areAllAssetsPreloaded: boolean;
}

const ManualSection: React.FC<{ id: string; title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ id, title, children, defaultOpen = false }) => (
  <details open={defaultOpen} className="mb-2 border-b border-dashed border-[var(--border-color)] pb-2">
    <summary id={id} className="font-western text-xl text-[var(--ink-secondary)] cursor-pointer hover:text-[var(--ink-main)] list-inside">
      {title}
    </summary>
    <div className="pl-4 pt-2">
      {children}
    </div>
  </details>
);

const ManualSubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <details className="mt-2">
    <summary className="font-pulp-title text-lg cursor-pointer hover:text-black">
      {title}
    </summary>
    <div className="pl-4 pt-1">
      {children}
    </div>
  </details>
);

const ManualContent: React.FC<ManualContentProps> = ({
  isManualPreloading,
  manualPreloadProgress,
  handlePreloadAllAssets,
  areAllAssetsPreloaded,
}) => {
  return (
    <div className="text-sm text-left">
      <p className="italic mb-4">Alright, partner! Here's the lowdown on how to survive and thrive in the Wild Lands. Keep this guide handy, and you might just make a name for yourself!</p>

      <ManualSection id="goal" title="Your Goal" defaultOpen>
        <p>Your main goal is to survive the treacherous journey through the Wild Lands and ultimately defeat the formidable, AI-generated Boss that stands as the final challenge. The frontier is a harsh mistress, and you'll need wit, grit, and a bit of luck.</p>
      </ManualSection>
      
      <ManualSection id="game-flow" title="A Day in the Wilds: Game Flow">
        <p>The game progresses in Days (turns). Each day is divided into three phases: Daylight, Dusk, and Dawn.</p>
        <ManualSubSection title="Daylight (Player Actions)">
          <p>This is where you make your moves! You can generally perform actions in any order, but some have limits:</p>
          <ul className="list-disc list-inside ml-4 mb-1">
            <li><span className="font-bold uppercase text-[var(--ink-main)]">Play Cards:</span> Use Provisions, Weapons, Items, and Actions from your hand for various effects.</li>
            <li><span className="font-bold uppercase text-[var(--ink-main)]">Equip (Once per day):</span> Move one Item or Player Upgrade from your hand to an empty Equip Slot for persistent benefits.</li>
            <li><span className="font-bold uppercase text-[var(--ink-main)]">Interact with Threats (Action):</span> Instead of fighting, you can click on an active Human or Animal threat to attempt a peaceful interaction. This counts as your main action for the turn (you cannot take another item or interact again).
              <ul className="list-disc list-inside ml-6 text-xs">
                  <li><strong className="text-base">Talking (Humans):</strong> Success depends on your character's Talk skill. A successful talk will make them leave peacefully.</li>
                  <strong className="text-base">Petting (Animals):</strong> Success depends on your Petting skill. A successful pet will make them non-hostile, allowing you to trade at the store. They will leave at night.
                  <strong className="text-base text-[var(--blood-red)]">Final Boss:</strong> Successfully talking down the final boss counts as a peaceful victory! They will pay you their bounty to let them go. However, this resolution will **void any active run Objectives**, as their conditions require defeating the boss in combat.
              </ul>
            </li>
            <li><span className="font-bold uppercase text-[var(--ink-main)]">Store Provisions:</span> If you have a Satchel equipped, you can move Provision cards from your hand into the Satchel (up to its capacity). You can also use Provisions directly from the Satchel.</li>
            <li><span className="font-bold uppercase text-[var(--ink-main)]">Interact with the Store:</span> Buy items or Restock the store's inventory once per day.</li>
            <li><span className="font-bold uppercase text-[var(--ink-main)]">Take Event Item (Action):</span> If the current "Event" is a non-hostile card, you can take it. This counts as your main action for the turn.</li>
          </ul>
        </ManualSubSection>
        <ManualSubSection title="Dusk (End of Day)">
          <p>When you click "End Day", the Night Phase begins:</p>
          <ul className="list-disc list-inside ml-4 mb-1">
            <li><span className="font-bold uppercase text-[var(--blood-red)]">Night Attacks:</span> Certain threats (like Thieves or Rattlesnakes) that are left active will attack you. An active Campfire deters some animal attackers.</li>
            <li><span className="font-bold uppercase">Hand Discard:</span> All cards remaining in your hand are discarded.</li>
            <li><span className="font-bold uppercase text-[var(--scarlet-fever-color)]">Illness Worsens:</span> If you have a persistent illness, your Maximum Health is permanently reduced by 1.</li>
            <li><span className="font-bold uppercase">Campfire Consumed:</span> If your Campfire was active, it's now used up.</li>
          </ul>
        </ManualSubSection>
        <ManualSubSection title="Dawn (Start of Next Day)">
          <p>A new day begins automatically:</p>
          <ul className="list-disc list-inside ml-4 mb-1">
            <li><span className="font-bold uppercase text-[var(--faded-blue)]">New Event:</span> If no event is active and you didn't have a campfire, a new card is drawn from the Event Deck. Traps may trigger.</li>
            <li><span className="font-bold uppercase text-[var(--blood-red)]">Morning Attack:</span> Any hostile threat now active may attack you.</li>
            <li><span className="font-bold uppercase">Morning Routine:</span> Passive items (Waterskin, Gold Pan) trigger, and you may recover 1 lost Max Health if you are not ill.</li>
            <li><span className="font-bold uppercase text-[var(--faded-blue)]">Card Draw:</span> You draw cards until your hand is full.</li>
          </ul>
        </ManualSubSection>
      </ManualSection>
      
      <ManualSection id="card-types" title="Card Types & Rules">
        <ManualSubSection title="Events & Hostility">
          <p>Events are encounters from the Event Deck. Some are "hostile," which blocks you from using the Store.</p>
          <p className="font-bold mt-2">An event is considered HOSTILE if:</p>
          <ul className="list-disc list-inside ml-4 text-xs">
              <li>It's a threat (Animal or Human) with **more than 6 health**.</li>
              <li>It's a Thief or a venomous snake (Rattlesnake, Mamushi, Mamba), regardless of its health.</li>
              <li>It's an Environmental event that deals damage or forces you to discard items.</li>
          </ul>
           <p className="font-bold mt-2">An event is NOT hostile if:</p>
           <ul className="list-disc list-inside ml-4 text-xs">
              <li>It's a threat with **6 or less health** (you can trade while a pesky Raccoon is active, but not a Wolf).</li>
              <li>It's a non-venomous animal that doesn't attack on reveal (like a Rabbit or Squirrel).</li>
              <li>It's an Illness.</li>
              <li>You successfully "Pet" an animal threat, making it non-hostile for the turn.</li>
           </ul>
        </ManualSubSection>
        <ManualSubSection title="Provisions & Upgrades">
           <p><strong className="uppercase text-green-700">Provisions</strong> are one-time use consumables for effects like healing or drawing cards. <strong className="uppercase text-yellow-700">Player Upgrades</strong> are equipped for powerful, persistent bonuses.</p>
        </ManualSubSection>
         <ManualSubSection title="Items & Actions">
           <p><strong className="uppercase text-blue-700">Items</strong> are physical objects like Weapons, Traps, and Firewood. <strong className="uppercase text-blue-700">Actions</strong> are special maneuvers like Scout Ahead or Trick Shot.</p>
           <p className="mt-2"><strong className="uppercase text-amber-800">Satchels</strong> are special Upgrades that allow you to store Provisions for later use, freeing up hand space.</p>
        </ManualSubSection>
      </ManualSection>

      <ManualSection id="combat" title="Combat">
        <p>To fight a Threat, play a weapon Item from your hand or use an equipped one. Damage is calculated as follows:</p>
         <ol className="list-decimal list-inside ml-4 text-xs space-y-1">
            <li>Start with the weapon's base attack power.</li>
            <li>Add +1 damage if the weapon is **equipped**.</li>
            <li>Add any flat bonuses from **other equipped items** (e.g., Worn Whetstone).</li>
            <li>Apply any multipliers from **equipped items** (e.g., Bandolier) to this subtotal.</li>
            <li>Finally, add any flat bonuses from items **in your hand** (e.g., an unequipped Lucky Bullet).</li>
        </ol>
        <p className="mt-2 text-sm"><strong className="text-blue-800">Action Cards</strong> like 'Fire Arrow' and 'Trick Shot' benefit from all your buffs! They calculate the full, final damage of your strongest appropriate weapon (bow or firearm) and then add their own bonus damage on top.</p>
      </ManualSection>

      <ManualSection id="store" title="The General Store">
         <p>The store displays 3 items for sale. You can buy any item if you have enough Gold. Once per day, you can pay a scaling amount of Gold to "Restock" and draw 3 new items. Remember, you cannot buy or restock if a hostile Event is active.</p>
      </ManualSection>
      
       <ManualSection id="objectives" title="Objectives">
        <p>At the start of your journey, you'll choose up to two optional Objectives. These provide special challenges for the run. Completing an objective and defeating the final boss will grant a powerful reward, often for your next journey.</p>
      </ManualSection>

      <ManualSection id="sickness" title="Sickness & Health">
        <ul className="list-disc list-inside ml-4 text-xs">
            <li><strong className="text-base text-red-600">Persistent Illnesses (Malaria, etc.):</strong> If you end the day with one, your Maximum Health is permanently reduced by 1. Cure them with specific herbs or a Miracle Cure.</li>
            <li><strong className="text-base text-yellow-600">Mountain Sickness:</strong> Temporary. You draw 1 fewer card the next day, then it automatically resolves.</li>
            <li><strong className="text-base text-green-700">Recovering Max Health:</strong> If you are not ill, you regain 1 lost Maximum Health at the start of each day.</li>
        </ul>
      </ManualSection>

      <ManualSection id="ng-plus" title="New Game Plus (NG+)">
        <p>After a victory, you'll advance to the next NG+ level. The frontier gets tougher, but you get stronger too.</p>
        <ul className="list-disc list-inside ml-4 text-xs">
            <li><strong className="text-base">Rewards:</strong> At the start of an NG+ run, choose a permanent bonus for that character's lineage: +1 Max Health or +100 Gold for the run.</li>
            <li><strong className="text-base">Deck Review:</strong> After winning, you choose a set number of cards from your previous deck to carry over. Unselected cards are sold for gold.</li>
            <li><strong className="text-base">Carry-Over:</strong> Your gold, equipped items, and satchel contents also carry over.</li>
        </ul>
      </ManualSection>

       <ManualSection id="pedometer" title="Pedometer (Optional)">
        <p>Enable this feature on the setup screen to use your device's GPS to track real-world movement. No location data is saved or transmitted.</p>
        <p className="font-bold mt-2">Rewards for Walking:</p>
         <ul className="list-disc list-inside ml-4 text-xs">
            <li>1 Gold per 50 steps.</li>
            <li>1 Health per 100 steps.</li>
            <li>1 Card Draw per 250 steps.</li>
        </ul>
      </ManualSection>

      <ManualSection id="saving" title="Saving & Loading">
        <p>You can save or load your game at any time using the "Menu" button in the top-right corner of the screen during setup or gameplay. This opens the "Manage Game Saves" screen where you can save to a slot, load a previous game, or start a new run in an empty slot.</p>
      </ManualSection>

      <ManualSection id="offline" title="Offline Play">
          <div className='text-left'>
            <p className="text-xs italic mb-3">For the best offline experience, you can preload all game assets. This will download all images and sounds to your device. AI features like story generation will still require an internet connection.</p>
            <button
                onClick={handlePreloadAllAssets}
                disabled={isManualPreloading || areAllAssetsPreloaded}
                className="button !bg-slate-700 hover:!bg-slate-800 !text-white !border-slate-900 !text-xs !py-1 !px-2"
            >
                {isManualPreloading ? `Preloading...` : (areAllAssetsPreloaded ? 'All Assets Preloaded' : 'Preload All Assets')}
            </button>
            {isManualPreloading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${manualPreloadProgress}%` }}></div>
                    <p className="text-xs text-center mt-1">{manualPreloadProgress.toFixed(0)}% Complete</p>
                </div>
            )}
          </div>
      </ManualSection>
    </div>
  );
};

export default ManualContent;
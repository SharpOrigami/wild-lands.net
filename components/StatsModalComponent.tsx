import React from 'react';
import { LifetimeStats } from '../types.ts';
import ModalComponent from './ModalComponent.tsx';
import { CHARACTERS_DATA_MAP } from '../constants.ts';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: LifetimeStats;
  onReset: () => void;
}

const StatRow: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="flex justify-between border-b border-dashed border-[var(--border-color)] py-1 text-sm">
    <span>{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
);

const StatsModalComponent: React.FC<StatsModalProps> = ({ isOpen, onClose, stats, onReset }) => {
  const getFavoriteCharacter = (victoriesByChar: { [key: string]: number } | undefined): string => {
    if (!victoriesByChar || Object.keys(victoriesByChar).length === 0) {
      return 'None Yet';
    }

    const favorite = Object.entries(victoriesByChar).reduce((fav, current) => {
      return current[1] > fav[1] ? current : fav;
    });

    const characterName = CHARACTERS_DATA_MAP[favorite[0]]?.name || favorite[0];
    return `${characterName} (${favorite[1]} wins)`;
  };
  
  const favoriteCharacter = getFavoriteCharacter(stats.victoriesByCharacter);

  const totalKillsByFirearm = (stats.animals_killed_by_firearm || 0) + (stats.humans_killed_by_firearm || 0);
  const totalKillsByBow = (stats.animals_killed_by_bow || 0) + (stats.humans_killed_by_bow || 0);
  const totalKillsByBladed = (stats.animals_killed_by_bladed || 0) + (stats.humans_killed_by_bladed || 0);
  const totalKillsByTrap = (stats.animals_killed_by_trap || 0) + (stats.humans_killed_by_trap || 0);
  
  const totalProvisionsUsed = (stats.provisions_used_before_boss || 0) + (stats.provisions_used_during_boss || 0);

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Lifetime Statistics"
      singleActionText="Close"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 font-['Special_Elite'] text-[var(--ink-main)]">
        
        {/* Column 1: Milestones & Feats */}
        <div className="flex flex-col gap-2">
          <h4 className="font-western text-xl text-[var(--ink-secondary)] mb-1 border-b-2 border-[var(--border-color)]">Milestones & Feats</h4>
          <StatRow label="Highest NG+ Level" value={stats.highestNGPlusLevel || 0} />
          <StatRow label="Total Victories" value={stats.totalVictories || 0} />
          <StatRow label="Total Days Survived" value={stats.totalDaysSurvived || 0} />
          <StatRow label="Objectives Completed" value={stats.objectivesCompleted || 0} />
          <StatRow label="De-escalations" value={stats.deEscalations || 0} />
          <StatRow label="Favorite Character" value={favoriteCharacter} />
          <StatRow label="Biggest Single Hit" value={stats.biggestSingleHit || 0} />
          <StatRow label="Close Calls (<=5 HP)" value={stats.closeCalls || 0} />
          <StatRow label="Lightning Strikes Survived" value={stats.lightningStrikesSurvived || 0} />
          <StatRow label="Total Steps Taken" value={stats.totalStepsTaken || 0} />
        </div>

        {/* Column 2: Hunting & Bounties */}
        <div className="flex flex-col gap-2">
            <h4 className="font-western text-xl text-[var(--ink-secondary)] mb-1 border-b-2 border-[var(--border-color)]">Hunting & Bounties</h4>
            <StatRow label="Total Threats Defeated" value={stats.threats_defeated || 0} />
            <StatRow label="Apex Predators Slain" value={stats.apexPredatorsSlain || 0} />
            <StatRow label="Pests Exterminated" value={stats.pestsExterminated || 0} />
            <StatRow label="Animals Pet" value={stats.animalsPet || 0} />
            <StatRow label="Kodama Defeated" value={stats.kodamaKilled || 0} />
            <StatRow label="Traps Sprung" value={stats.trapsSprung || 0} />
            <StatRow label="Bounties Collected" value={stats.objectives_sold || 0} />
            
            <h5 className="font-western text-lg text-[var(--ink-secondary)] mt-3">Total Kills By...</h5>
            <StatRow label="Firearm" value={totalKillsByFirearm} />
            <StatRow label="Bow" value={totalKillsByBow} />
            <StatRow label="Bladed Weapon" value={totalKillsByBladed} />
            <StatRow label="Trap" value={totalKillsByTrap} />
        </div>

        {/* Column 3: General & Economy */}
        <div className="flex flex-col gap-2">
          <h4 className="font-western text-xl text-[var(--ink-secondary)] mb-1 border-b-2 border-[var(--border-color)]">General & Economy</h4>
          <StatRow label="Gold Earned" value={stats.gold_earned || 0} />
          <StatRow label="Gold Spent" value={stats.gold_spent || 0} />
          <StatRow label="Most Gold Held" value={stats.mostGoldHeld || 0} />
          <StatRow label="Campfires Built" value={stats.campfiresBuilt || 0} />
          <StatRow label="Times Skunked" value={stats.timesSkunked || 0} />
          <StatRow label="Laudanum Abuse" value={stats.laudanumAbuse || 0} />
          <StatRow label="Provisions Used" value={totalProvisionsUsed} />
          <StatRow label="Illnesses Contracted" value={stats.illnesses_contracted || 0} />
          <StatRow label="Illnesses Cured" value={stats.illnesses_cured || 0} />
        </div>
      </div>
       <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onReset}
            className="button button-danger"
          >
            Reset All Stats
          </button>
        </div>
    </ModalComponent>
  );
};

export default StatsModalComponent;
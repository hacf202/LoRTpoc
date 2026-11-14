import React from 'react';
import ChampionRoster from '../components/ChampionRoster';

/**
 * Dedicated Champions Page View (/champions)
 * Clean, minimalistic, modern layout with 3-Breakpoint compliance
 */
export default function ChampionsView({
  filters,
  updateFilters,
  onSelectChampion
}) {
  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full">
        <ChampionRoster
          filters={filters}
          updateFilters={updateFilters}
          onSelectChampion={onSelectChampion}
        />
      </div>
    </div>
  );
}

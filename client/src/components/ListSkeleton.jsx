import React from 'react';

/**
 * Standardized Skeleton Grid for all List Views
 * Supports 3 card types:
 * - 'champion': aspect-[4/3] cards for ChampionRoster
 * - 'card': aspect-[680/1024] portrait cards for CardsView
 * - 'entity': horizontal badges + icon for Relics, Items, Powers, and Maps
 */
export default function ListSkeleton({ type = 'entity', count = 12, gridClassName = '' }) {
  if (type === 'champion') {
    return (
      <div
        className={
          gridClassName ||
          'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-5 animate-in fade-in duration-200'
        }
      >
        {Array.from({ length: count || 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-[#0e1320] animate-pulse select-none"
          >
            <div className="w-full aspect-[4/3] bg-white/5 relative">
              <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-7 sm:w-8 h-4 sm:h-5 rounded-md bg-white/10" />
              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-8 sm:w-10 h-4 sm:h-5 rounded-md bg-white/10" />
            </div>
            <div className="p-2 sm:p-3.5 flex flex-col gap-1.5 sm:gap-2">
              <div className="h-3.5 sm:h-4 bg-white/10 rounded-md w-3/4" />
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white/10" />
                <div className="h-2.5 sm:h-3 bg-white/10 rounded w-14 sm:w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div
        className={
          gridClassName ||
          'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 animate-in fade-in duration-200'
        }
      >
        {Array.from({ length: count || 12 }).map((_, idx) => (
          <div
            key={idx}
            className="relative w-full aspect-[680/1024] rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/5 animate-pulse overflow-hidden p-3 flex flex-col justify-end"
          >
            <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Default 'entity' skeleton for Relics, Items, Powers, and Maps (2 columns on mobile)
  return (
    <div
      className={
        gridClassName ||
        'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 animate-in fade-in duration-200'
      }
    >
      {Array.from({ length: count || 12 }).map((_, idx) => (
        <div
          key={idx}
          className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/10 animate-pulse flex items-center gap-2 sm:gap-3 min-h-[58px] sm:min-h-[72px]"
        >
          <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="h-3 sm:h-3.5 w-10 sm:w-14 bg-white/10 rounded-md" />
              <div className="h-3 sm:h-3.5 w-8 sm:w-10 bg-white/10 rounded-md" />
            </div>
            <div className="h-3 sm:h-4 w-3/4 bg-white/15 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

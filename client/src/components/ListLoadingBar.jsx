import React from 'react';

/**
 * Standardized Subtle Loading Progress Bar for all List Views (Rule 9)
 * Renders a sleek 2px progress bar with glowing cyan accent (#8CC0EB)
 * and smooth fade transition to eliminate jarring UI flashes.
 */
export default function ListLoadingBar({ isTransitioning }) {
  return (
    <div
      className={`h-0.5 w-full mb-3 rounded-full overflow-hidden transition-opacity duration-200 ${
        isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isTransitioning}
    >
      <div className="h-full bg-[#8CC0EB] animate-pulse w-full shadow-[0_0_8px_rgba(140,192,235,0.6)]" />
    </div>
  );
}

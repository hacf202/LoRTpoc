import React from 'react';

/**
 * Reusable Champion Item Card
 */
export default function ChampionCard({ champion, onClick }) {
  if (!champion) return null;

  const avatarUrl =
    champion.assets?.[0]?.avatar || 'https://images.lortpoc.com/avatarChampions/Xerath.webp';
  const regionsStr = Array.isArray(champion.regions)
    ? champion.regions.join(' • ')
    : champion.regions || 'Runeterra';
  const starsCount = Math.min(champion.maxStar || 3, 6);
  const tierShort = champion.tier ? champion.tier.split('//')[0].trim() : null;

  return (
    <div
      onClick={() => onClick?.(champion)}
      className="flex items-center justify-between px-3 h-[60px] flex-shrink-0 rounded-xl cursor-pointer border border-transparent transition-all duration-150 hover:bg-[#8CC0EB]/10 hover:border-[#8CC0EB]/25 group"
    >
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={champion.name}
          className="w-10 h-10 rounded-full object-cover border border-[#BFDDF0]/50 bg-slate-800 flex-shrink-0"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://dd.b.pvp.net/latest/set5/en_us/img/cards/05SH014.png';
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white group-hover:text-[#8CC0EB] transition-colors truncate font-heading">
            {champion.name}
          </span>
          <span className="text-xs text-[#FFEBCC] font-medium truncate">{regionsStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-[#FFF9D2] tracking-widest">
          {'★'.repeat(starsCount)}
        </span>
        {tierShort && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-heading">
            {tierShort}
          </span>
        )}
      </div>
    </div>
  );
}

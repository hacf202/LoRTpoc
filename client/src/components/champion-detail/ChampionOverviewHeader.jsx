import React from 'react';
import { getRegionIconUrl, getRegionDisplayName } from '../../utils/regionIcons';
import { getTierTheme } from './constants';
import { handleImageError } from '../../utils/imageFallback';

export default function ChampionOverviewHeader({
  champion,
  name,
  stars,
  regions,
  tierShort,
  tierDesc,
  avatarUrl,
  ratings,
  tags,
  isEn,
  t
}) {
  const tierTheme = getTierTheme(champion.tier);

  return (
    <div className="flex flex-col gap-3 sm:gap-5 p-2 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border-2 border-white/20 shadow-xl">
      {/* Main Identity Row */}
      <div className="flex flex-col md:flex-row items-start gap-5">
        {/* Avatar Portrait */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#070a10] border-2 border-[#8CC0EB] flex-shrink-0 shadow-lg">
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover object-center"
            onError={(e) => handleImageError(e, 'champion')}
          />
          {champion.cost !== undefined && (
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0b2545] text-sky-200 border border-sky-400">
              {champion.cost} Mana
            </span>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {/* Tier Badge */}
            <span className={`px-2 sm:px-2.5 py-0.5 text-xs font-black uppercase rounded-md border tracking-wider ${tierTheme.badge}`}>
              {tierShort.toUpperCase().includes('TIER') ? tierShort : `Tier ${tierShort}`}
            </span>

            {/* Stars */}
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#452600] text-amber-200 border border-amber-400">
              ★ {stars} {isEn ? 'Max Stars' : 'Sao Tối Đa'}
            </span>

            {/* Card Code */}
            {champion.cardCode && (
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-[#161d2d] text-slate-300 border border-white/10">
                {champion.cardCode}
              </span>
            )}

            {/* Regions */}
            {regions.map((reg) => {
              const cleanKey = String(reg).toLowerCase().trim();
              const iconUrl = getRegionIconUrl(cleanKey);
              const regionName = getRegionDisplayName(cleanKey, t);
              return (
                <span
                  key={reg}
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 text-xs font-semibold uppercase rounded-md bg-[#141b2a] text-slate-200 border border-white/15"
                >
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-4 h-4 object-contain flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <span>{regionName}</span>
                </span>
              );
            })}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            {name}
          </h2>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block">{isEn ? 'Tier Ranking:' : 'Xếp hạng sức mạnh:'}</span>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase border ${tierTheme.badge}`}>
                  {tierShort}
                </span>
                {tierDesc && (
                  <span className="text-slate-300 text-xs font-medium">
                    — {tierDesc}
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">{isEn ? 'Optimal Stars:' : 'Mốc sao chuẩn:'}</span>
              <span className="font-bold text-[#FFF9D2] mt-1 block">{champion.optimalStars || `${stars} Sao`}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isEn ? 'Playstyle:' : 'Lối chơi:'}</span>
              <span className="font-bold text-slate-200 truncate block mt-1">{champion.playStyle || 'Combo'}</span>
            </div>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2 sm:mt-3">
              {tags.map((tg) => (
                <span
                  key={tg}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#161f30] text-slate-300 border border-white/10"
                >
                  #{tg}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* General Ratings & Power Attributes (1 - 10) */}
      <div className="pt-2 sm:pt-4 border-t border-white/10 space-y-2 sm:space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Damage */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#080c14] border border-white/10 space-y-1 sm:space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-rose-400">{isEn ? 'Damage' : 'Sát Thương'}</span>
              <span className="font-mono text-white">{ratings.damage ?? 7}/10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#141b29] border border-white/10 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((Number(ratings.damage ?? 7)) / 10) * 100))}%` }}
              />
            </div>
          </div>

          {/* Defense */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#080c14] border border-white/10 space-y-1 sm:space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-sky-400">{isEn ? 'Defense' : 'Phòng Thủ'}</span>
              <span className="font-mono text-white">{ratings.defense ?? 7}/10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#141b29] border border-white/10 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((Number(ratings.defense ?? 7)) / 10) * 100))}%` }}
              />
            </div>
          </div>

          {/* Synergy */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#080c14] border border-white/10 space-y-1 sm:space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-purple-400">{isEn ? 'Synergy' : 'Combo'}</span>
              <span className="font-mono text-white">{ratings.synergy ?? 7}/10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#141b29] border border-white/10 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((Number(ratings.synergy ?? 7)) / 10) * 100))}%` }}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#080c14] border border-white/10 space-y-1 sm:space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-amber-400">{isEn ? 'Difficulty' : 'Độ Khó'}</span>
              <span className="font-mono text-white">{ratings.difficulty ?? 5}/10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#141b29] border border-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((Number(ratings.difficulty ?? 5)) / 10) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

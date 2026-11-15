import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl } from '../utils/regionIcons';

// Tier badge styling with crisp high contrast using the new pastel palette
const getTierStyle = (tier) => {
  if (!tier) return null;
  const t = tier.toUpperCase();
  if (t.startsWith('S+')) return 'bg-[#FFF9D2] text-[#07090e] border-[#FFEBCC] font-black shadow-md';
  if (t.startsWith('S')) return 'bg-[#FFEBCC] text-[#07090e] border-[#FFF9D2] font-bold shadow-md';
  if (t.startsWith('A')) return 'bg-[#8CC0EB] text-[#07090e] border-[#BFDDF0] font-bold';
  if (t.startsWith('B')) return 'bg-[#065f46] text-[#d1fae5] border-[#34d399] font-bold';
  if (t.startsWith('C')) return 'bg-[#334155] text-slate-200 border-slate-500 font-bold';
  if (t.startsWith('D')) return 'bg-[#292524] text-stone-200 border-stone-600 font-bold';
  return 'bg-[#1e293b] text-slate-200 border-slate-500';
};

/**
 * Modern LoR Champion Card for the Grid Roster
 */
export default function ChampionGridCard({ champion, onClick }) {
  const { language, t } = useLanguage();
  if (!champion) return null;

  // Localized display name
  const displayName = language === 'en' && champion.translations?.en?.name
    ? champion.translations.en.name
    : champion.name;

  // Primary avatar image
  const avatarUrl = champion.assets?.[0]?.avatar || 'https://images.lortpoc.com/avatarChampions/Xerath.webp';
  const fallbackUrl = champion.assets?.[0]?.gameAbsolutePath || 'https://dd.b.pvp.net/latest/set5/en_us/img/cards/05SH014.png';

  // Stars and Tier
  const stars = champion.maxStar || 3;
  const tierShort = champion.tier ? champion.tier.split('//')[0].trim() : null;
  const tierStyle = getTierStyle(tierShort);

  // Region tags
  const rawRegions = Array.isArray(champion.regions) ? champion.regions : [champion.region || 'runeterra'];

  const champKey = champion.name || champion.championID || champion.cardCode;
  const championHref = `/champion/${encodeURIComponent(champKey)}`;

  return (
    <a
      href={championHref}
      onClick={(e) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          onClick?.(champion);
        }
      }}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(140,192,235,0.22)] border border-white/15 hover:border-[#8CC0EB] bg-[#0e1320] hover:bg-[#141b2b] [transform:translateZ(0)] [backface-visibility:hidden]"
    >
      {/* Top Banner with Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#0e1320] group-hover:bg-[#141b2b] transition-colors [transform:translateZ(0)]">
        <img
          src={avatarUrl}
          alt={displayName}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-108 group-hover:brightness-105 block [transform:translateZ(0)]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackUrl;
          }}
        />

        {/* Seamless dark vignette on bottom of image overlapping seam */}
        <div className="absolute inset-x-0 -bottom-1 h-12 bg-gradient-to-t from-[#0e1320] group-hover:from-[#141b2b] to-transparent pointer-events-none transition-colors duration-300" />

        {/* Tier Badge (Top-Right) */}
        {tierShort && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 transition-transform duration-300 group-hover:scale-105">
            <span className={`text-[9px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-md border tracking-wider uppercase ${tierStyle}`}>
              {tierShort}
            </span>
          </div>
        )}

        {/* Stars Badge (Top-Left) */}
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10 flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#070a10] border border-[#BFDDF0]/40 shadow-md transition-transform duration-300 group-hover:scale-105">
          <span className="text-[#FFF9D2] text-[10px] sm:text-sm font-bold">★</span>
          <span className="text-[#FFEBCC] text-[10px] sm:text-xs font-extrabold tracking-wide">{stars}</span>
        </div>
      </div>

      {/* Card Info Body - Overlap top by 1px to eliminate any subpixel hairline gap */}
      <div className="relative z-10 -mt-px p-2 sm:p-3.5 flex flex-col bg-[#0e1320] group-hover:bg-[#141b2b] transition-colors duration-300">
        {/* Champion Name */}
        <h3 className="text-xs sm:text-base font-extrabold text-white tracking-wide truncate group-hover:text-[#8CC0EB] transition-colors duration-200">
          {displayName}
        </h3>

        {/* Regions with Icon: Single line only with ellipsis on overflow */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 w-full min-w-0 overflow-hidden flex-nowrap">
          {rawRegions.map((regKey) => {
            const cleanKey = String(regKey).toLowerCase().trim();
            const regionName = t(`regions.${cleanKey}`) || regKey;
            const iconUrl = getRegionIconUrl(cleanKey);

            return (
              <span
                key={cleanKey}
                className="inline-flex items-center gap-1.5 min-w-0 shrink text-[11px] sm:text-xs font-semibold text-slate-300 capitalize overflow-hidden"
                title={regionName}
              >
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 object-contain shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <span className="hidden sm:inline truncate">{regionName}</span>
              </span>
            );
          })}
        </div>
      </div>
    </a>
  );
}
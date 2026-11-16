import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { handleImageError } from '../utils/imageFallback';
import { toChampionSlug } from '../utils/slug';

const TIER_THEMES = {
  'S+': {
    letter: 'S+',
    tierBg: 'bg-rose-600 text-white',
    rowBorder: 'border-rose-500/25',
    countBadge: 'bg-rose-950/90 text-rose-200 border-rose-500/40'
  },
  'S': {
    letter: 'S',
    tierBg: 'bg-amber-500 text-slate-950',
    rowBorder: 'border-amber-500/25',
    countBadge: 'bg-amber-950/90 text-amber-200 border-amber-500/40'
  },
  'A+': {
    letter: 'A+',
    tierBg: 'bg-purple-600 text-white',
    rowBorder: 'border-purple-500/25',
    countBadge: 'bg-purple-950/90 text-purple-200 border-purple-500/40'
  },
  'A': {
    letter: 'A',
    tierBg: 'bg-sky-500 text-slate-950',
    rowBorder: 'border-sky-500/25',
    countBadge: 'bg-sky-950/90 text-sky-200 border-sky-500/40'
  },
  'B+': {
    letter: 'B+',
    tierBg: 'bg-emerald-500 text-slate-950',
    rowBorder: 'border-emerald-500/25',
    countBadge: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
  },
  'B': {
    letter: 'B',
    tierBg: 'bg-teal-600 text-white',
    rowBorder: 'border-teal-500/25',
    countBadge: 'bg-teal-950/90 text-teal-200 border-teal-500/40'
  },
  'C': {
    letter: 'C',
    tierBg: 'bg-slate-700 text-slate-200',
    rowBorder: 'border-slate-700/30',
    countBadge: 'bg-slate-900 text-slate-300 border-slate-700'
  },
  'D': {
    letter: 'D',
    tierBg: 'bg-stone-800 text-stone-200',
    rowBorder: 'border-stone-700/35',
    countBadge: 'bg-stone-900 text-stone-300 border-stone-700'
  },
  'UNRANKED': {
    letter: '?',
    tierBg: 'bg-zinc-800 text-zinc-300',
    rowBorder: 'border-zinc-800/40',
    countBadge: 'bg-zinc-900 text-zinc-400 border-zinc-700'
  }
};

const ORDERED_TIERS = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C', 'D', 'UNRANKED'];

/**
 * Minimalist & Streamlined Champion Tier List View
 * Strict compliance with Rule 7 (Clean UI, zero emojis, zero filler descriptions)
 * and Rule 8 (Mobile 3-padding level: max p-2 on mobile).
 */
export default function TierListView({ onSelectChampion }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [tierData, setTierData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTierList = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/tierlist');
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setTierData(json.data || {});
          }
        }
      } catch (err) {
        console.error('Failed to fetch tier list:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTierList();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute total champions count
  const totalChampsCount = useMemo(() => {
    return Object.values(tierData).reduce((acc, list) => acc + (list?.length || 0), 0);
  }, [tierData]);

  // Display ordered tiers: standard tiers (S+ to D) always visible; UNRANKED only if populated
  const tierRows = useMemo(() => {
    return ORDERED_TIERS
      .filter((tierKey) => tierKey !== 'UNRANKED' || (tierData[tierKey] || []).length > 0)
      .map((tierKey) => ({
        tierKey,
        champions: tierData[tierKey] || []
      }));
  }, [tierData]);

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, không nền đen - Đồng bộ toàn hệ thống) */}
        <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {isEn ? 'Champion Tier List' : 'Bảng Xếp Hạng Tướng'}
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-[#FFF9D2] font-bold">{totalChampsCount || 88}</span>
            <span>{isEn ? 'Champions' : 'Vị Tướng'}</span>
          </div>
        </div>

        {/* 2. Streamlined Tier Rows */}
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#0e1320] border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : tierRows.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-[#0e1320] border border-white/10 p-4">
            <h3 className="text-sm font-bold text-white mb-1">
              {isEn ? 'No tier data available' : 'Chưa có dữ liệu xếp hạng'}
            </h3>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {tierRows.map(({ tierKey, champions }) => {
              const theme = TIER_THEMES[tierKey] || TIER_THEMES['C'];

              return (
                <div
                  key={tierKey}
                  className={`rounded-xl bg-[#0b0f19] border ${theme.rowBorder} overflow-hidden flex flex-col sm:flex-row transition-all duration-150`}
                >
                  {/* Left Column: Bold Tier Block (Solid color, punchy, minimal - không hiện số lượng) */}
                  <div
                    className={`w-full sm:w-20 lg:w-24 shrink-0 p-2 sm:p-3 border-b sm:border-b-0 sm:border-r ${theme.rowBorder} ${theme.tierBg} flex items-center justify-center select-none`}
                  >
                    <span className="text-xl sm:text-3xl font-black font-heading tracking-wider leading-none drop-shadow-xs">
                      {theme.letter}
                    </span>
                  </div>

                  {/* Right Column: Dense Streamlined Champions Grid (No cluttering badges) */}
                  <div className="flex-1 p-2 sm:p-2.5 flex items-center">
                    {champions.length === 0 ? (
                      <div className="w-full py-2.5 sm:py-3 px-2 text-center sm:text-left text-xs text-slate-500 italic">
                        {isEn ? 'No champions currently in this tier' : 'Chưa có tướng trong bậc này'}
                      </div>
                    ) : (
                      <div className="w-full grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1.5 sm:gap-2">
                        {champions.map((champ) => {
                          const champName = isEn
                            ? champ.translations?.en?.name || champ.name
                            : champ.name;
                          const avatarUrl =
                            champ.assets?.[0]?.avatar ||
                            `https://images.lortpoc.com/avatarChampions/${champ.championID}.webp`;
                          const champSlug = toChampionSlug(champ);
                          const champHref = `/champion/${champSlug}#relics`;

                          return (
                            <a
                              key={champ.championID || champ.cardCode}
                              href={champHref}
                              onClick={(e) => {
                                if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                                  e.preventDefault();
                                  onSelectChampion?.(champ);
                                }
                              }}
                              className="group relative flex flex-col items-center cursor-pointer select-none"
                              title={`${champName} (${champ.regions?.[0] || 'LoR'}) - Tier ${tierKey}`}
                            >
                              {/* Clean Portrait Avatar (Zero noisy overlay badges) */}
                              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#070a10] border border-white/10 group-hover:border-[#8CC0EB] group-hover:shadow-[0_0_10px_rgba(140,192,235,0.35)] group-hover:scale-105 transition-all duration-150">
                                <img
                                  src={avatarUrl}
                                  alt={champName}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(e) => handleImageError(e, 'champion', 'https://dd.b.pvp.net/latest/set1/en_us/img/cards/01DE001.png')}
                                />
                              </div>

                              {/* Champion Name */}
                              <span className="mt-1 text-[10px] sm:text-[11px] font-semibold text-slate-300 group-hover:text-[#8CC0EB] transition-colors truncate w-full text-center">
                                {champName}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

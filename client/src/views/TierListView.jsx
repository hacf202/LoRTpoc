import React, { useState, useEffect } from 'react';
import { Swords, Sparkles } from 'lucide-react';
import TierListChampions from '../components/tierlist/TierListChampions';
import TierListRelics from '../components/tierlist/TierListRelics';
import { useLanguage } from '../context/LanguageContext';

/**
 * Dedicated Tier List View (/tierlist)
 * Uniform Page Header design matching ChampionsView, RelicsView, PowersView, CardsView
 * - Centered bold heading with drop-shadow
 * - Standardized rounded count badge with brand pastel accents
 * - Sleek centered sub-tab switcher (Champions / Relics)
 * - Strict compliance with Rule 7 (Clean UI, zero unnecessary emojis) & Rule 8 (Mobile padding discipline)
 */
export default function TierListView({ filters, updateFilters, onSelectChampion }) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const isRelicsActive =
    filters?.tierType === 'relics' ||
    (typeof window !== 'undefined' &&
      (window.location.pathname.includes('/relics') ||
        window.location.search.includes('type=relics')));
  const activeTab = isRelicsActive ? 'relics' : 'champions';

  const [totalCount, setTotalCount] = useState(activeTab === 'champions' ? 88 : 155);

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const endpoint =
          activeTab === 'champions'
            ? '/api/v1/champions?summary=true&limit=1'
            : '/api/v1/relics?summary=true&limit=1';
        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          const total =
            json.pagination?.total ||
            json.total ||
            (activeTab === 'champions' ? 88 : 155);
          if (isMounted) setTotalCount(total);
        }
      } catch {
        // Fallback default
      }
    };
    fetchCount();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    if (updateFilters) {
      updateFilters({ tierType: newTab === 'relics' ? 'relics' : undefined });
    }
  };

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, không nền đen - Đồng bộ toàn hệ thống) */}
        <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {activeTab === 'champions'
              ? (isEn ? 'Champion Tier List' : 'Bảng Xếp Hạng Tướng')
              : (isEn ? 'Relic Tier List' : 'Bảng Xếp Hạng Cổ Vật')}
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-[#FFF9D2] font-bold">{totalCount}</span>
            <span>
              {activeTab === 'champions'
                ? (isEn ? 'Champions' : 'Vị Tướng')
                : (isEn ? 'Relics' : 'Cổ Vật')}
            </span>
          </div>
        </div>

        {/* 2. Sub-Tab Switcher: Centered clean floating pill */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex bg-[#0b0f19] p-1 rounded-xl border border-white/15 select-none shadow-lg">
            <button
              type="button"
              onClick={() => handleTabChange('champions')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'champions'
                  ? 'bg-[#8CC0EB] text-slate-950 shadow-[0_0_14px_rgba(140,192,235,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Swords size={16} />
              <span>{t('tierList.tabChampions') || (isEn ? 'CHAMPIONS' : 'TƯỚNG')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('relics')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'relics'
                  ? 'bg-[#8CC0EB] text-slate-950 shadow-[0_0_14px_rgba(140,192,235,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles size={16} />
              <span>{t('tierList.tabRelics') || (isEn ? 'RELICS' : 'CỔ VẬT')}</span>
            </button>
          </div>
        </div>

        {/* 3. Content Tab View */}
        <div className="min-h-[600px] w-full">
          {activeTab === 'champions' ? (
            <TierListChampions onSelectChampion={onSelectChampion} />
          ) : (
            <TierListRelics />
          )}
        </div>
      </section>
    </div>
  );
}

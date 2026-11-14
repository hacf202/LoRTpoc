import React, { useRef, useState, useCallback, useEffect } from 'react';

export default function ChampionDetailTabNav({ activeTab, onSelectTab, isEn }) {
  const tabsRef = useRef(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollTabsLeft(el.scrollLeft > 6);
    setCanScrollTabsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkTabsScroll();
    window.addEventListener('resize', checkTabsScroll);
    return () => window.removeEventListener('resize', checkTabsScroll);
  }, [checkTabsScroll]);

  const scrollTabs = (delta) => {
    tabsRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const tabs = [
    { id: 'builds', label: isEn ? 'Relic Builds' : 'Bộ Cổ Vật' },
    { id: 'combos', label: isEn ? 'How to Play' : 'Cách Vận Hành' },
    { id: 'synergies', label: isEn ? 'Items & Powers' : 'Vật Phẩm & Sức Mạnh' },
    { id: 'constellation', label: isEn ? 'Constellation' : 'Chòm Sao' },
    { id: 'deck', label: isEn ? 'Starting Deck' : 'Bộ bài khởi đầu' }
  ];

  return (
    <div className="relative flex items-center border-b-2 border-white/10 pb-1 w-full">
      {canScrollTabsLeft && (
        <button
          type="button"
          onClick={() => scrollTabs(-200)}
          className="absolute left-0 z-20 w-7 h-7 flex items-center justify-center rounded-lg bg-[#0c101c] border border-white/20 text-slate-200 hover:text-white hover:border-[#8CC0EB] shadow-xl cursor-pointer"
          aria-label="Scroll left"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <div
        ref={tabsRef}
        onScroll={checkTabsScroll}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full px-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-t-xl text-xs sm:text-sm font-bold font-heading transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                : 'bg-[#0e1320] text-slate-300 hover:text-white border border-white/10 border-b-0'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {canScrollTabsRight && (
        <button
          type="button"
          onClick={() => scrollTabs(200)}
          className="absolute right-0 z-20 w-7 h-7 flex items-center justify-center rounded-lg bg-[#0c101c] border border-white/20 text-slate-200 hover:text-white hover:border-[#8CC0EB] shadow-xl cursor-pointer"
          aria-label="Scroll right"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

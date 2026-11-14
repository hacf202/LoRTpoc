import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { stripLorMarkup } from '../utils/lorMarkupParser';
import { useLanguage } from '../context/LanguageContext';

/**
 * Omnisearch Dropdown for Legends of Runeterra: The Path of Champions
 * Displays concise suggestions: Icon, Name, Short Description, and Entity Type.
 * Follows strict guideline: No redundant icons in category headers/titles.
 */
const SearchDropdown = forwardRef(function SearchDropdown(
  {
    isOpen,
    loading,
    results = {}, // { categories: { champions, relics, powers, items, cards, maps }, flat, total }
    searchTerm = '',
    onSelect
  },
  ref
) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [activeCategory, setActiveCategory] = useState('all');

  const tabsContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Normalize results format (support both legacy array and new omni categories object)
  const categories = results?.categories || {
    champions: Array.isArray(results) ? results : [],
    relics: [],
    powers: [],
    items: [],
    cards: [],
    maps: []
  };

  const totalResults = results?.total || (Array.isArray(results) ? results.length : 0);

  // Clean category configs without redundant icons
  const categoryConfigs = [
    { id: 'all', label: isEn ? 'All' : 'Tất cả', count: totalResults },
    { id: 'champions', label: isEn ? 'Champions' : 'Tướng', count: categories.champions?.length || 0 },
    { id: 'relics', label: isEn ? 'Relics' : 'Cổ vật', count: categories.relics?.length || 0 },
    { id: 'powers', label: isEn ? 'Powers' : 'Sức mạnh', count: categories.powers?.length || 0 },
    { id: 'items', label: isEn ? 'Items' : 'Vật phẩm', count: categories.items?.length || 0 },
    { id: 'cards', label: isEn ? 'Cards' : 'Lá bài', count: categories.cards?.length || 0 },
    { id: 'maps', label: isEn ? 'Adventures' : 'Bản đồ', count: categories.maps?.length || 0 }
  ].filter((c) => c.id === 'all' || c.count > 0);

  // Dynamic scroll detection for navigation buttons
  const checkScroll = useCallback(() => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for DOM layout render
      const timer = setTimeout(checkScroll, 50);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [isOpen, checkScroll, categoryConfigs.length]);

  const handleScroll = (direction) => {
    if (!tabsContainerRef.current) return;
    const shift = direction === 'left' ? -150 : 150;
    tabsContainerRef.current.scrollBy({ left: shift, behavior: 'smooth' });
    setTimeout(checkScroll, 220);
  };

  if (!isOpen) return null;

  // Filter items to display based on category tab
  const getDisplayItems = () => {
    if (activeCategory === 'all') {
      return results?.flat || (Array.isArray(results) ? results : []);
    }
    return categories[activeCategory] || [];
  };

  const displayItems = getDisplayItems();

  const getTypeBadge = (type) => {
    switch (type) {
      case 'champion':
        return { label: isEn ? 'Champion' : 'Tướng', color: 'bg-amber-950/80 text-amber-300 border-amber-500/40' };
      case 'relic':
        return { label: isEn ? 'Relic' : 'Cổ vật', color: 'bg-sky-950/80 text-sky-300 border-sky-500/40' };
      case 'power':
        return { label: isEn ? 'Power' : 'Sức mạnh', color: 'bg-purple-950/80 text-purple-300 border-purple-500/40' };
      case 'item':
        return { label: isEn ? 'Item' : 'Vật phẩm', color: 'bg-teal-950/80 text-teal-300 border-teal-500/40' };
      case 'card':
        return { label: isEn ? 'Card' : 'Lá bài', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' };
      case 'map':
        return { label: isEn ? 'Adventure' : 'Bản đồ', color: 'bg-rose-950/80 text-rose-300 border-rose-500/40' };
      default:
        return { label: isEn ? 'Item' : 'Mục', color: 'bg-slate-800 text-slate-300 border-slate-600' };
    }
  };

  const getShortDescription = (item) => {
    if (item.type === 'champion') {
      const rawDesc = item.description || item.translations?.en?.description || '';
      if (rawDesc) {
        return stripLorMarkup(rawDesc);
      }
      const regionsStr = Array.isArray(item.regions) ? item.regions.join(', ') : 'Runeterra';
      return `${regionsStr} • ${item.stars || 3}★`;
    }

    const rawDesc = item.descriptionRaw || item.description || '';
    if (rawDesc) {
      return stripLorMarkup(rawDesc);
    }

    if (item.type === 'map') {
      return item.region || (isEn ? 'Adventure Map' : 'Bản đồ phiêu lưu');
    }

    return '';
  };

  return (
    <div
      ref={ref}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="absolute top-[calc(100%+10px)] left-0 w-full max-h-[44vh] sm:max-h-[48vh] md:max-h-[50vh] flex flex-col rounded-2xl bg-[#090d16] border-2 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-50 overflow-hidden font-sans overscroll-contain"
    >
      {/* 1. Header Filter Navigation: Loại bỏ scrollbar, có nút chuyển trái/phải, thuần chữ không icon */}
      {totalResults > 0 && categoryConfigs.length > 2 && (
        <div className="relative flex items-center px-2 py-2 border-b border-white/10 bg-[#0e1422] select-none">
          {/* Nút chuyển sang trái */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="mr-1.5 p-1 rounded-lg bg-[#161d2d] hover:bg-[#1e273c] text-slate-300 hover:text-white border border-white/10 shrink-0 cursor-pointer shadow-sm transition-colors"
              aria-label="Chuyển sang trái"
              title="Sang trái"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Danh sách các tab phân loại (Ẩn hoàn toàn thanh cuộn scrollbar ngang) */}
          <div
            ref={tabsContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 overflow-x-auto scroll-smooth flex-1 no-scrollbar"
          >
            {categoryConfigs.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8CC0EB] text-[#07090e] font-bold shadow-sm'
                      : 'bg-[#161d2d] text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-75 ml-1">({cat.count})</span>
                </button>
              );
            })}
          </div>

          {/* Nút chuyển sang phải */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="ml-1.5 p-1 rounded-lg bg-[#161d2d] hover:bg-[#1e273c] text-slate-300 hover:text-white border border-white/10 shrink-0 cursor-pointer shadow-sm transition-colors"
              aria-label="Chuyển sang phải"
              title="Sang phải"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 2. Items List: Gọn gàng chỉ gồm Icon, Tên, Mô tả ngắn và Loại */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[#090d16] overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-t-[#8CC0EB] border-r-transparent border-b-[#8CC0EB] border-l-transparent rounded-full animate-spin" />
            <span>{t('hero.searching')}</span>
          </div>
        ) : displayItems.length > 0 ? (
          displayItems.map((item, idx) => {
            const typeInfo = getTypeBadge(item.type);
            const name = (isEn ? item.enName : item.name) || item.name || 'Không tên';
            const desc = getShortDescription(item);
            const img =
              item.imageUrl ||
              item.image ||
              item.assetAbsolutePath ||
              item.gameAbsolutePath ||
              item.assets?.[0]?.avatar;

            const itemCode =
              item.type === 'champion'
                ? item.name || item.id
                : item.raw?.cardCode || item.raw?.relicCode || item.raw?.powerCode || item.raw?.itemCode || item.raw?.adventureID || item.code || item.id;
            const itemHref = `/${item.type || 'champion'}/${encodeURIComponent(itemCode)}`;

            return (
              <a
                key={item.id || idx}
                href={itemHref}
                onClick={(e) => {
                  if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                    e.preventDefault();
                    onSelect?.(item);
                  }
                }}
                className="group flex items-center justify-between gap-3 px-3 py-2 sm:py-2.5 rounded-xl hover:bg-[#141b2a] border border-transparent hover:border-white/15 transition-all duration-200 cursor-pointer select-none text-left no-underline"
              >
                {/* Khối bên trái: Icon + Tên & Mô tả ngắn */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* 1. Icon */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#06080e] border border-white/15 flex-shrink-0 flex items-center justify-center overflow-hidden p-0.5 shadow-sm group-hover:border-[#8CC0EB]/50 transition-colors">
                    {img ? (
                      <img
                        src={img}
                        alt={name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">LoR</span>
                    )}
                  </div>

                  {/* 2. Tên + 3. Một chút mô tả */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold font-heading text-white group-hover:text-[#8CC0EB] transition-colors truncate">
                      {name}
                    </h4>
                    {desc && (
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5 font-normal leading-tight">
                        {desc}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Loại (Type) */}
                <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shrink-0 ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </a>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('hero.noResults', { query: searchTerm })}
          </div>
        )}
      </div>
    </div>
  );
});

export default SearchDropdown;

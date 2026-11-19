import React, { useState, useEffect, useRef, useCallback } from 'react';
import CardFiltersSidebar, { TYPE_OPTIONS, RARITY_OPTIONS } from '../components/CardFiltersSidebar';
import Pagination from '../components/Pagination';
import ListLoadingBar from '../components/ListLoadingBar';
import ListSkeleton from '../components/ListSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl } from '../utils/regionIcons';
import { handleImageError } from '../utils/imageFallback';
import { useQueryCache } from '../hooks/useQueryCache';

/**
 * Modern LoR Cards Vault View (/cards)
 * Standardized with Relics, Powers, and Champions Views:
 * - Single Clean Heroic Header (Centered, typography, count pill badge)
 * - 2-Column Responsive Layout: Left Sticky Sidebar + Right Grid
 * - Mobile Quick Search & Slide Drawer Filter
 * - Active Filter Chips Bar (Supports multi-select on all dimensions)
 * - Rule 9 Debounce (350ms) + Subtle Loading Transition
 * - Rule 10 On-Demand 24-Item Pagination & In-Memory Query Cache
 */
export default function CardsView({ filters = {}, updateFilters, onSelectCard }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const rosterTopRef = useRef(null);

  // Parse filters from URL state
  const selectedRegions = (filters.regions || (filters.region && filters.region !== 'all' ? filters.region : ''))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedCosts = (filters.costs || filters.cost || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedTypes = (filters.types || filters.type || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const selectedRarities = (filters.rarities || filters.rarity || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const sortBy = filters.sort || 'cost-asc';
  const currentPage = filters.page || 1;
  const itemsPerPage = 24;

  // Filters & Search state with Rule 9 Debounce (350ms)
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // UI state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Sync search input when filters.q changes externally (e.g. Back/Forward)
  useEffect(() => {
    setSearchInput(filters.q || '');
  }, [filters.q]);

  // Debounce search input by 350ms with subtle loading transition (Rule 9)
  useEffect(() => {
    const clean = searchInput.trim();
    if ((filters.q || '') !== clean) {
      setIsSearchDebouncing(true);
    }
    const timer = setTimeout(() => {
      if ((filters.q || '') !== clean) {
        updateFilters?.({ q: clean, page: 1 });
      }
      setIsSearchDebouncing(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.q, updateFilters]);

  // Query dimensions (normalized for deterministic cache keys)
  const querySearch = (filters.q || '').trim();
  const queryRegion = selectedRegions.slice().sort().join(',');
  const queryCost = selectedCosts.slice().sort().join(',');
  const queryType = selectedTypes.slice().sort().join(',');
  const queryRarity = selectedRarities.slice().sort().join(',');

  // Unified Query Cache Hook (Rule 10: In-Memory LRU Cache & Rule 9: Smooth Transitions)
  const {
    data: cards,
    total: totalItems,
    totalPages,
    loading,
    isTransitioning: queryTransitioning
  } = useQueryCache({
    namespace: 'cards',
    key: {
      search: querySearch,
      region: queryRegion,
      cost: queryCost,
      type: queryType,
      rarity: queryRarity,
      sort: sortBy,
      page: currentPage,
      limit: itemsPerPage
    },
    fetcher: async ({ signal }) => {
      const params = new URLSearchParams();
      if (querySearch) params.append('search', querySearch);
      if (queryRegion) params.append('region', queryRegion);
      if (queryCost) params.append('cost', queryCost);
      if (queryType) params.append('type', queryType);
      if (queryRarity) params.append('rarity', queryRarity);
      if (sortBy) params.append('sort', sortBy);
      params.append('fields', 'cardCode,name,cost,regions,rarity,type,gameAbsolutePath,descriptionRaw,description,translations');
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));

      const res = await fetch(`/api/v1/cards?${params.toString()}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        data: json.data || [],
        total: json.total || 0,
        totalPages: json.pagination?.totalPages || 1
      };
    }
  });

  const isTransitioning = isSearchDebouncing || queryTransitioning;

  // Filter Toggles (Multi-Select)
  const handleToggleRegion = useCallback((val) => {
    const next = selectedRegions.includes(val)
      ? selectedRegions.filter((r) => r !== val)
      : [...selectedRegions, val];
    updateFilters?.({ regions: next.join(','), page: 1 });
  }, [selectedRegions, updateFilters]);

  const handleToggleCost = useCallback((val) => {
    const next = selectedCosts.includes(val)
      ? selectedCosts.filter((c) => c !== val)
      : [...selectedCosts, val];
    updateFilters?.({ costs: next.join(','), page: 1 });
  }, [selectedCosts, updateFilters]);

  const handleToggleType = useCallback((val) => {
    const cleanVal = val.toLowerCase();
    const next = selectedTypes.includes(cleanVal)
      ? selectedTypes.filter((t) => t !== cleanVal)
      : [...selectedTypes, cleanVal];
    updateFilters?.({ types: next.join(','), type: next.join(','), page: 1 });
  }, [selectedTypes, updateFilters]);

  const handleToggleRarity = useCallback((val) => {
    const cleanVal = val.toLowerCase();
    const next = selectedRarities.includes(cleanVal)
      ? selectedRarities.filter((r) => r !== cleanVal)
      : [...selectedRarities, cleanVal];
    updateFilters?.({ rarities: next.join(','), rarity: next.join(','), page: 1 });
  }, [selectedRarities, updateFilters]);

  const handleSortChange = useCallback((val) => {
    updateFilters?.({ sort: val, page: 1 });
  }, [updateFilters]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    updateFilters?.({
      q: '',
      regions: '',
      costs: '',
      types: '',
      type: '',
      rarities: '',
      rarity: '',
      sort: 'cost-asc',
      page: 1
    });
  }, [updateFilters]);

  const handlePageChange = useCallback((page) => {
    updateFilters?.({ page });
    if (rosterTopRef.current) {
      rosterTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [updateFilters]);

  const hasActiveFilters =
    Boolean((filters.q || '').trim()) ||
    selectedRegions.length > 0 ||
    selectedCosts.length > 0 ||
    selectedTypes.length > 0 ||
    selectedRarities.length > 0 ||
    sortBy !== 'cost-asc';

  const activeFiltersCount =
    (searchInput.trim() ? 1 : 0) +
    selectedRegions.length +
    selectedCosts.length +
    selectedTypes.length +
    selectedRarities.length +
    (sortBy !== 'cost-asc' ? 1 : 0);

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <section ref={rosterTopRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, không nền đen - Giống trang tướng, cổ vật, sức mạnh) */}
        <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {isEn ? 'Cards List' : 'Danh Sách Lá Bài'}
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-[#FFF9D2] font-bold">{totalItems}</span>
            <span>{isEn ? 'Cards' : 'Lá Bài'}</span>
          </div>
        </div>

        {/* 2. Mobile Action Bar (<640px): Quick Search & Mobile Drawer Trigger */}
        <div className="sm:hidden flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isEn ? 'Search cards...' : 'Tìm kiếm lá bài...'}
              className="w-full h-10 pl-9 pr-7 text-xs bg-[#090d16] border border-white/15 focus:border-[#8CC0EB] rounded-xl text-white placeholder-slate-500 outline-none"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-[#8CC0EB] text-[#07090e] border-[#BFDDF0]'
                : 'bg-[#090d16] text-white border-white/15 hover:border-white/25'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{isEn ? 'Filters' : 'Bộ Lọc'}</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#07090e] text-[#8CC0EB] text-[10px] font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* 3. Main Layout Container: 2 Columns */}
        <div className="flex items-start gap-5 lg:gap-6 w-full min-h-[720px] sm:min-h-[820px]">
        {/* Left Column: Filter Sidebar */}
        <CardFiltersSidebar
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          selectedRegions={selectedRegions}
          onToggleRegion={handleToggleRegion}
          selectedCosts={selectedCosts}
          onToggleCost={handleToggleCost}
          selectedTypes={selectedTypes}
          onToggleType={handleToggleType}
          selectedRarities={selectedRarities}
          onToggleRarity={handleToggleRarity}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          isOpenMobile={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        {/* Right Column: Cards Grid + Pagination */}
        <main className="flex-1 w-full min-w-0">
          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2 rounded-xl bg-[#0e1320]/60 border border-white/10 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading mr-1">
                {isEn ? 'Active:' : 'Đang lọc:'}
              </span>

              {searchInput.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#8CC0EB]/20 text-[#8CC0EB] border border-[#8CC0EB]/40 text-xs">
                  <span>"{searchInput}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      updateFilters?.({ q: '', page: 1 });
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedRegions.map((reg) => {
                const iconUrl = getRegionIconUrl(reg);
                return (
                  <span
                    key={reg}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#8CC0EB]/15 text-[#8CC0EB] border border-[#8CC0EB]/30 text-xs"
                  >
                    {iconUrl && (
                      <img
                        src={iconUrl}
                        alt=""
                        aria-hidden="true"
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span>{reg}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleRegion(reg)}
                      className="hover:text-white cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })}

              {selectedCosts.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs"
                >
                  <span>{c === '8' ? '8+ Mana' : `${c} Mana`}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleCost(c)}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedTypes.map((t) => {
                const tOption = TYPE_OPTIONS.find((opt) => opt.value === t);
                const label = tOption ? (isEn ? tOption.labelEn : tOption.labelVi) : t;
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs capitalize"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleType(t)}
                      className="hover:text-white cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                );
              })}

              {selectedRarities.map((r) => {
                const rOption = RARITY_OPTIONS.find((opt) => opt.value === r);
                const label = rOption ? (isEn ? rOption.labelEn : rOption.labelVi) : r;
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs capitalize"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleRarity(r)}
                      className="hover:text-white cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                );
              })}

              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-[11px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
              >
                {isEn ? 'Clear all' : 'Xóa tất cả'}
              </button>
            </div>
          )}

          {/* Standardized Subtle Loading Progress Line (Rule 9) */}
          <ListLoadingBar isTransitioning={isTransitioning} />

          {/* Cards Grid with Subtle Loading Opacity (4 Columns Portrait Grid) */}
          <div className={`flex-1 transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && cards.length === 0 ? (
              <ListSkeleton type="card" count={12} />
            ) : cards.length === 0 ? (
              <div className="w-full mt-2 py-10 px-4 text-center rounded-2xl bg-[#0e1320] border border-white/10">
                <h3 className="text-base font-bold text-white mb-1">
                  {isEn ? 'No cards found' : 'Không tìm thấy lá bài nào'}
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  {isEn
                    ? 'Try adjusting your search keyword or filters.'
                    : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase cursor-pointer"
                  >
                    {isEn ? 'Reset Filters' : 'Đặt lại bộ lọc'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {cards.map((card) => {
                const cardName =
                  isEn && card.translations?.en?.cardName
                    ? card.translations.en.cardName
                    : card.cardName || card.name || card.cardCode;

                const cardImg =
                  (isEn && card.translations?.en?.gameAbsolutePath) ||
                  card.gameAbsolutePath ||
                  card.assetAbsolutePath ||
                  `https://dd.b.pvp.net/latest/set1/en_us/img/cards/${card.cardCode}.png`;

                return (
                  <button
                    key={card.cardCode}
                    type="button"
                    onClick={() => onSelectCard?.(card)}
                    className="group relative w-full aspect-[680/1024] rounded-xl sm:rounded-2xl p-1 bg-[#070a10]/60 border border-white/10 hover:border-[#8CC0EB] hover:shadow-[0_0_25px_rgba(140,192,235,0.25)] transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden hover:-translate-y-1.5"
                    title={`${cardName} (${card.cardCode})`}
                    aria-label={cardName}
                  >
                    <img
                      src={cardImg}
                      alt={cardName}
                      loading="lazy"
                      className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      onError={(e) => handleImageError(e, 'card')}
                    />
                  </button>
                );
              })}
            </div>
          )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>
      </div>
    </section>
  </div>
);
}

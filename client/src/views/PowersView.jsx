import React, { useState, useEffect, useRef, useCallback } from 'react';
import PowerFiltersSidebar from '../components/PowerFiltersSidebar';
import EntityCard from '../components/EntityCard';
import Pagination from '../components/Pagination';
import ListLoadingBar from '../components/ListLoadingBar';
import ListSkeleton from '../components/ListSkeleton';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modern LoR Powers Vault View (/powers)
 * Fully aligned with Relics Vault & Champions Roster layout & styling:
 * - Single Clean Heroic Header (Centered, large typography, count pill badge)
 * - 2-Column Responsive Layout: Left Sticky Sidebar + Right Grid
 * - Mobile Quick Search & Slide Drawer Filter
 * - Active Filter Chips Bar
 * - Rule 9 Debounce (350ms) + Subtle Loading Transition
 * - Rule 10 On-Demand 24-Item Pagination & In-Memory Query Cache
 */
export default function PowersView({ filters = {}, updateFilters, onSelectPower }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const rosterTopRef = useRef(null);

  // In-memory Query Cache ref (Rule 10)
  const queryCache = useRef(new Map());

  // Data state
  const [powers, setPowers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Parse filters from URL state
  const selectedRarities = (filters.rarity || filters.rarities || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const selectedTypes = (filters.type || filters.types || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const sortBy = filters.sort || 'name-asc';
  const currentPage = filters.page || 1;
  const itemsPerPage = 24;

  // Filters & Search state with Rule 9 Debounce (350ms)
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // UI state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Sync search input when filters.q changes externally (e.g. Back/Forward)
  useEffect(() => {
    setSearchInput(filters.q || '');
  }, [filters.q]);

  // Debounce search input by 350ms with subtle loading transition (Rule 9)
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      const clean = searchInput.trim();
      if ((filters.q || '') !== clean) {
        updateFilters?.({ q: clean, page: 1 });
      } else {
        setIsTransitioning(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.q, updateFilters]);

  // Query Fetcher with Cache-First Strategy & Smooth Loading (Rules 9 & 10)
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setIsTransitioning(true);

    const querySearch = (filters.q || '').trim();
    const queryRarity = selectedRarities.slice().sort().join(',');
    const queryType = selectedTypes.slice().sort().join(',');

    const cacheKey = JSON.stringify({
      search: querySearch,
      rarity: queryRarity,
      type: queryType,
      sort: sortBy,
      page: currentPage,
      limit: itemsPerPage
    });

    // Check In-Memory Cache first with subtle smooth transition
    if (queryCache.current.has(cacheKey)) {
      const cached = queryCache.current.get(cacheKey);
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setPowers(cached.data);
          setTotalItems(cached.total);
          setTotalPages(cached.totalPages);
          setLoading(false);
          setIsTransitioning(false);
        }
      }, 180);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }

    // Cache miss: Fetch from server on demand with smooth transition timing
    const fetchPowers = async () => {
      const startTime = performance.now();
      try {
        const params = new URLSearchParams();
        if (querySearch) params.append('search', querySearch);
        if (queryRarity) params.append('rarity', queryRarity);
        if (queryType) params.append('type', queryType);
        if (sortBy) params.append('sort', sortBy);
        params.append('fields', 'powerCode,name,rarity,type,assetAbsolutePath,descriptionRaw,description,translations');
        params.append('page', String(currentPage));
        params.append('limit', String(itemsPerPage));

        const res = await fetch(`/api/v1/powers?${params.toString()}`);

        const elapsed = performance.now() - startTime;
        const remainingDelay = Math.max(0, 320 - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (res.ok) {
          const json = await res.json();
          if (json.success && !isCancelled) {
            const resultData = json.data || [];
            const resultTotal = json.total || 0;
            const resultTotalPages = json.pagination?.totalPages || 1;

            // Store in cache with 50-item LRU cap to prevent memory bloat
            if (queryCache.current.size >= 50) {
              const oldestKey = queryCache.current.keys().next().value;
              queryCache.current.delete(oldestKey);
            }
            queryCache.current.set(cacheKey, {
              data: resultData,
              total: resultTotal,
              totalPages: resultTotalPages
            });

            setPowers(resultData);
            setTotalItems(resultTotal);
            setTotalPages(resultTotalPages);
          }
        }
      } catch (err) {
        console.error('Failed to fetch powers:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setIsTransitioning(false);
        }
      }
    };

    fetchPowers();

    return () => {
      isCancelled = true;
    };
  }, [filters.q, filters.rarity, filters.type, sortBy, currentPage]);

  // Filter toggle handlers
  const handleToggleRarity = useCallback((rarityVal) => {
    const val = rarityVal.toLowerCase();
    const next = selectedRarities.includes(val)
      ? selectedRarities.filter((r) => r !== val)
      : [...selectedRarities, val];
    updateFilters?.({ rarity: next.join(','), page: 1 });
  }, [selectedRarities, updateFilters]);

  const handleToggleType = useCallback((typeVal) => {
    const next = selectedTypes.includes(typeVal)
      ? selectedTypes.filter((t) => t !== typeVal)
      : [...selectedTypes, typeVal];
    updateFilters?.({ type: next.join(','), page: 1 });
  }, [selectedTypes, updateFilters]);

  const handleSortChange = useCallback((newSort) => {
    updateFilters?.({ sort: newSort, page: 1 });
  }, [updateFilters]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    updateFilters?.({ q: '', rarity: '', type: '', sort: 'name-asc', page: 1 });
  }, [updateFilters]);

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
    selectedRarities.length > 0 ||
    selectedTypes.length > 0 ||
    sortBy !== 'name-asc'
  );

  const activeFiltersCount =
    (searchInput.trim() ? 1 : 0) +
    selectedRarities.length +
    selectedTypes.length +
    (sortBy !== 'name-asc' ? 1 : 0);

  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const handlePageChange = useCallback((p) => {
    updateFilters?.({ page: p });
    if (rosterTopRef.current) {
      rosterTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [updateFilters]);

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <section ref={rosterTopRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, giống kho cổ vật & trang tướng) */}
        <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {isEn ? 'Powers List' : 'Danh Sách Sức Mạnh'}
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-[#FFF9D2] font-bold">{totalItems}</span>
            <span>{isEn ? 'Powers' : 'Sức Mạnh'}</span>
          </div>
        </div>

        {/* 2. Mobile Action Bar (<640px): Quick Search & Mobile Drawer Trigger */}
        <div className="sm:hidden flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isEn ? 'Search powers...' : 'Tìm kiếm sức mạnh...'}
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

        {/* 3. Main Responsive 2-Column Layout */}
        <div className="flex items-start gap-5 lg:gap-6 w-full min-h-[720px] sm:min-h-[820px]">
          {/* Left Column: Vertical Sidebar on PC/Tablet & Mobile Drawer */}
          <PowerFiltersSidebar
            searchTerm={searchInput}
            onSearchChange={(val) => setSearchInput(val)}
            selectedRarities={selectedRarities}
            onToggleRarity={handleToggleRarity}
            selectedTypes={selectedTypes}
            onToggleType={handleToggleType}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            isOpenMobile={isMobileDrawerOpen}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />

          {/* Right Column: Active Chips + Cards Grid + Pagination */}
          <div className="flex-1 min-w-0 flex flex-col min-h-[720px] sm:min-h-[820px]">
            {/* Active Filters Chips Bar */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap pb-4 mb-4 border-b border-white/10 text-xs">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                  {isEn ? 'Active:' : 'Đang lọc:'}
                </span>

                {searchInput.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15">
                    <span>"{searchInput}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="hover:text-red-400 cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {selectedRarities.map((r) => {
                  const labelMap = {
                    common: isEn ? 'Common' : 'Thường',
                    rare: isEn ? 'Rare' : 'Hiếm',
                    epic: isEn ? 'Epic' : 'Sử Thi',
                    legendary: isEn ? 'Legendary' : 'Huyền Thoại',
                    special: isEn ? 'Special' : 'Đặc Biệt'
                  };
                  return (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8CC0EB]/20 text-[#8CC0EB] border border-[#8CC0EB]/40 font-semibold"
                    >
                      <span>{labelMap[r] || r}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleRarity(r)}
                        className="hover:text-red-400 cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}

                {selectedTypes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/15 font-semibold"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleType(t)}
                      className="hover:text-red-400 cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}

                {sortBy !== 'name-asc' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e1320] text-slate-300 border border-white/15">
                    <span className="text-slate-400">{isEn ? 'Sort:' : 'Xếp:'}</span>
                    <span>
                      {sortBy === 'name-desc'
                        ? isEn ? 'Z - A' : 'Z - A'
                        : sortBy === 'rarity-desc'
                        ? isEn ? 'Rarity ↓' : 'Độ hiếm ↓'
                        : isEn ? 'Rarity ↑' : 'Độ hiếm ↑'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSortBy('name-asc')}
                      className="hover:text-red-400 cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold ml-auto cursor-pointer"
                >
                  {isEn ? 'Clear all' : 'Xóa tất cả'}
                </button>
              </div>
            )}

            {/* Standardized Subtle Loading Progress Line (Rule 9) */}
            <ListLoadingBar isTransitioning={isTransitioning} />

            {/* Powers Cards Grid */}
            <div className={`flex-1 transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {loading && powers.length === 0 ? (
                <ListSkeleton
                  type="entity"
                  count={12}
                  gridClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                />
              ) : powers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {powers.map((power) => (
                    <EntityCard
                      key={power.powerCode}
                      item={power}
                      type="power"
                      onClick={(clicked) => {
                        if (onSelectPower) {
                          onSelectPower(clicked.powerCode || clicked.code);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#070a10] border border-white/10 flex items-center justify-center text-slate-500">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold font-heading text-white mb-1">
                    {isEn ? 'No powers found' : 'Không tìm thấy sức mạnh phù hợp'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    {isEn
                      ? 'Try modifying your search query or clearing active filters.'
                      : 'Hãy thử đổi từ khóa tìm kiếm hoặc bấm đặt lại để xem toàn bộ sức mạnh.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#BFDDF0] transition-colors"
                    >
                      {isEn ? 'Reset Filters' : 'Đặt Lại Bộ Lọc'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalItems > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={24}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

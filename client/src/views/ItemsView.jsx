import React, { useState, useEffect, useRef, useCallback } from 'react';
import ItemFiltersSidebar from '../components/ItemFiltersSidebar';
import EntityCard from '../components/EntityCard';
import Pagination from '../components/Pagination';
import ListLoadingBar from '../components/ListLoadingBar';
import ListSkeleton from '../components/ListSkeleton';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modern LoR Items Vault View (/items)
 * Standardized with Relics & Powers Vault:
 * - Single Clean Heroic Header (Centered, typography, count pill badge)
 * - 2-Column Responsive Layout: Left Sticky Sidebar + Right Grid
 * - Mobile Quick Search & Slide Drawer Filter
 * - Active Filter Chips Bar
 * - Rule 9 Debounce (350ms) + Subtle Loading Transition
 * - Rule 10 On-Demand 24-Item Pagination & In-Memory Query Cache
 */
export default function ItemsView({ filters = {}, updateFilters, onSelectItem }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const rosterTopRef = useRef(null);

  // In-memory Query Cache ref (Rule 10)
  const queryCache = useRef(new Map());

  // Data state
  const [items, setItems] = useState([]);
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

  const sortBy = filters.sort || 'rarity-desc';
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
          setItems(cached.data);
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
    const fetchItems = async () => {
      const startTime = performance.now();
      try {
        const params = new URLSearchParams();
        if (querySearch) params.append('search', querySearch);
        if (queryRarity) params.append('rarity', queryRarity);
        if (queryType) params.append('type', queryType);
        if (sortBy) params.append('sort', sortBy);
        params.append('fields', 'itemCode,name,rarity,assetAbsolutePath,descriptionRaw,description,translations');
        params.append('page', String(currentPage));
        params.append('limit', String(itemsPerPage));

        const res = await fetch(`/api/v1/items?${params.toString()}`);

        const elapsed = performance.now() - startTime;
        const remainingDelay = Math.max(0, 320 - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (res.ok) {
          const json = await res.json();
          if (json.success && !isCancelled) {
            const resultData = json.data || [];
            const resultTotal = json.pagination?.total || 0;
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

            setItems(resultData);
            setTotalItems(resultTotal);
            setTotalPages(resultTotalPages);
          }
        }
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setIsTransitioning(false);
        }
      }
    };

    fetchItems();

    return () => {
      isCancelled = true;
    };
  }, [filters.q, filters.rarity, filters.type, sortBy, currentPage]);

  // Filter Toggles
  const handleToggleRarity = useCallback((val) => {
    const rVal = val.toLowerCase();
    const next = selectedRarities.includes(rVal)
      ? selectedRarities.filter((r) => r !== rVal)
      : [...selectedRarities, rVal];
    updateFilters?.({ rarity: next.join(','), page: 1 });
  }, [selectedRarities, updateFilters]);

  const handleToggleType = useCallback((val) => {
    const next = selectedTypes.includes(val)
      ? selectedTypes.filter((t) => t !== val)
      : [...selectedTypes, val];
    updateFilters?.({ type: next.join(','), page: 1 });
  }, [selectedTypes, updateFilters]);

  const handleSortChange = useCallback((val) => {
    updateFilters?.({ sort: val, page: 1 });
  }, [updateFilters]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    updateFilters?.({ q: '', rarity: '', type: '', sort: 'rarity-desc', page: 1 });
  }, [updateFilters]);

  const handlePageChange = useCallback((page) => {
    updateFilters?.({ page });
    if (rosterTopRef.current) {
      rosterTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [updateFilters]);

  const hasActiveFilters =
    Boolean((filters.q || '').trim()) ||
    selectedRarities.length > 0 ||
    selectedTypes.length > 0 ||
    sortBy !== 'rarity-desc';

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <section ref={rosterTopRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, không nền đen - Giống trang tướng, cổ vật, sức mạnh) */}
        <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {isEn ? 'Items List' : 'Danh Sách Vật Phẩm'}
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-[#FFF9D2] font-bold">{totalItems}</span>
            <span>{isEn ? 'Items' : 'Vật Phẩm'}</span>
          </div>
        </div>

        {/* 2. Main Layout Container: 2 Columns */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column: Filter Sidebar */}
        <ItemFiltersSidebar
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
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

        {/* Right Column: Items Grid + Pagination */}
        <main className="flex-1 w-full min-w-0">
          {/* Mobile Quick Search Bar & Filter Toggle Button */}
          <div className="lg:hidden flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isEn ? 'Search items...' : 'Tìm kiếm vật phẩm...'}
                className="w-full h-9 pl-8 pr-7 text-xs bg-[#0e1320] border border-white/15 focus:border-[#8CC0EB] rounded-xl text-white placeholder-slate-500 outline-none transition-colors"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="h-9 px-3 rounded-xl bg-[#0e1320] border border-white/15 hover:border-[#8CC0EB] text-[#8CC0EB] flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer shrink-0 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>{isEn ? 'Filter' : 'Lọc'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#8CC0EB]" />
              )}
            </button>
          </div>

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

              {selectedRarities.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs capitalize"
                >
                  <span>{r}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleRarity(r)}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedTypes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleType(t)}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

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

          {/* Items Grid with Subtle Loading Opacity */}
          <div className={`flex-1 transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && items.length === 0 ? (
              <ListSkeleton
                type="entity"
                count={12}
                gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5"
              />
            ) : items.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
                <h3 className="text-base font-bold text-white mb-1">
                  {isEn ? 'No items found' : 'Không tìm thấy vật phẩm nào'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                {items.map((item) => (
                  <EntityCard
                    key={item.itemCode || item.name}
                    item={item}
                    type="item"
                    onClick={onSelectItem}
                  />
                ))}
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

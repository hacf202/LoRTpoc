import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapFiltersSidebar, { DIFFICULTY_OPTIONS, TYPE_OPTIONS } from '../components/MapFiltersSidebar';
import EntityCard from '../components/EntityCard';
import Pagination from '../components/Pagination';
import ListLoadingBar from '../components/ListLoadingBar';
import ListSkeleton from '../components/ListSkeleton';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modern LoR Adventures / Maps Vault View (/maps)
 * Standardized with Champions, Relics, Powers, and Cards Views:
 * - Single Clean Heroic Header (Centered, typography, count pill badge)
 * - 2-Column Responsive Layout: Left Sticky Sidebar + Right Grid
 * - Mobile Quick Search & Slide Drawer Filter
 * - Active Filter Chips Bar (Supports multi-select on all dimensions)
 * - Rule 9 Debounce (350ms) + Subtle Loading Transition
 * - Rule 10 On-Demand 24-Item Pagination & In-Memory Query Cache
 */
export default function MapsView({ filters = {}, updateFilters, onSelectMap }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const rosterTopRef = useRef(null);

  // In-memory Query Cache ref (Rule 10)
  const queryCache = useRef(new Map());

  // Data state
  const [maps, setMaps] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Local search input for immediate UX typing (Rule 9)
  const [searchInput, setSearchInput] = useState(filters.q || filters.search || '');

  // Parse multi-select filter dimensions from URL (memoized to prevent render loops)
  const selectedDifficulties = useMemo(
    () => (filters.difficulty || '').split(',').map((s) => s.trim()).filter(Boolean),
    [filters.difficulty]
  );

  const selectedTypes = useMemo(
    () => (filters.type || '').split(',').map((s) => s.trim()).filter(Boolean),
    [filters.type]
  );

  const sortBy = filters.sort || 'difficulty-asc';
  const currentPage = parseInt(filters.page || '1', 10) || 1;

  // Active filters detection
  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      selectedDifficulties.length > 0 ||
      selectedTypes.length > 0 ||
      (sortBy && sortBy !== 'difficulty-asc')
  );

  // Synchronize local search with URL prop when browser nav occurs
  useEffect(() => {
    setSearchInput(filters.q || filters.search || '');
  }, [filters.q, filters.search]);

  // Rule 9: 350ms Debounced search synchronization to URL with subtle loading transition
  useEffect(() => {
    const currentQuery = (filters.q || filters.search || '').trim();
    if (searchInput.trim() !== currentQuery) {
      setIsTransitioning(true);
    }
    const timer = setTimeout(() => {
      if (searchInput.trim() !== currentQuery) {
        updateFilters?.({ q: searchInput.trim(), page: 1 });
      } else {
        setIsTransitioning(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters.q, filters.search, updateFilters]);

  // Smooth Data Fetcher with In-Memory Query Cache (Rules 9 & 10)
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setIsTransitioning(true);

    const queryDiff = selectedDifficulties.slice().sort().join(',');
    const queryType = selectedTypes.slice().sort().join(',');
    const querySearch = (filters.q || filters.search || '').trim();

    const cacheKey = JSON.stringify({
      q: querySearch,
      diff: queryDiff,
      type: queryType,
      sort: sortBy,
      page: currentPage
    });

    // Cache-First (Rule 10): serve from cache with subtle smooth transition
    if (queryCache.current.has(cacheKey)) {
      const cached = queryCache.current.get(cacheKey);
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setMaps(cached.data);
          setTotalItems(cached.pagination?.total || cached.data.length);
          setTotalPages(cached.pagination?.totalPages || 1);
          setIsTransitioning(false);
          setLoading(false);
        }
      }, 180);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }

    const fetchAdventures = async () => {
      const startTime = performance.now();
      try {
        const params = new URLSearchParams();
        if (querySearch) params.append('q', querySearch);
        if (queryDiff) params.append('difficulty', queryDiff);
        if (queryType) params.append('type', queryType);
        if (sortBy) params.append('sort', sortBy);
        params.append('fields', 'adventureID,adventureName,difficulty,background,assetAbsolutePath,typeAdventure,Bosses,translations');
        params.append('page', String(currentPage));
        params.append('limit', '24');

        const res = await fetch(`/api/v1/maps?${params.toString()}`);

        const elapsed = performance.now() - startTime;
        const remainingDelay = Math.max(0, 320 - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (json.success && Array.isArray(json.data) && !isCancelled) {
          // Store in cache with 50-item LRU cap to prevent memory bloat
          if (queryCache.current.size >= 50) {
            const oldestKey = queryCache.current.keys().next().value;
            queryCache.current.delete(oldestKey);
          }
          queryCache.current.set(cacheKey, {
            data: json.data,
            pagination: json.pagination
          });
          setMaps(json.data);
          setTotalItems(json.pagination?.total || 0);
          setTotalPages(json.pagination?.totalPages || 1);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch adventures:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsTransitioning(false);
          setLoading(false);
        }
      }
    };

    fetchAdventures();
    return () => {
      isCancelled = true;
    };
  }, [filters.q, filters.search, selectedDifficulties, selectedTypes, sortBy, currentPage]);

  // Filter Toggle Handlers with immediate transition feedback
  const handleToggleDifficulty = useCallback(
    (diffVal) => {
      setIsTransitioning(true);
      const next = selectedDifficulties.includes(diffVal)
        ? selectedDifficulties.filter((d) => d !== diffVal)
        : [...selectedDifficulties, diffVal];
      updateFilters?.({ difficulty: next.join(','), page: 1 });
    },
    [selectedDifficulties, updateFilters]
  );

  const handleToggleType = useCallback(
    (typeVal) => {
      setIsTransitioning(true);
      const next = selectedTypes.includes(typeVal)
        ? selectedTypes.filter((t) => t !== typeVal)
        : [...selectedTypes, typeVal];
      updateFilters?.({ type: next.join(','), page: 1 });
    },
    [selectedTypes, updateFilters]
  );

  const handleSortChange = useCallback(
    (newSort) => {
      setIsTransitioning(true);
      updateFilters?.({ sort: newSort, page: 1 });
    },
    [updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    setIsTransitioning(true);
    setSearchInput('');
    updateFilters?.({
      q: '',
      difficulty: '',
      type: '',
      sort: 'difficulty-asc',
      page: 1
    });
  }, [updateFilters]);

  const handlePageChange = useCallback(
    (newPage) => {
      setIsTransitioning(true);
      updateFilters?.({ page: newPage });
      rosterTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    [updateFilters]
  );

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <section ref={rosterTopRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, không nền đen - Giống trang tướng, cổ vật, sức mạnh) */}
        <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {isEn ? 'Adventures List' : 'Danh Sách Cuộc Phiêu Lưu'}
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-[#FFF9D2] font-bold">{totalItems}</span>
            <span>{isEn ? 'Adventures' : 'Cuộc Phiêu Lưu'}</span>
          </div>
        </div>

        {/* 2. Main Layout Container: 2 Columns */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left Sticky Sidebar (Desktop & Tablet) */}
          <MapFiltersSidebar
            searchTerm={searchInput}
            onSearchChange={setSearchInput}
            selectedDifficulties={selectedDifficulties}
            onToggleDifficulty={handleToggleDifficulty}
            selectedTypes={selectedTypes}
            onToggleType={handleToggleType}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            isOpenMobile={isMobileDrawerOpen}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />

          {/* Right Main Content Area */}
          <main className="flex-1 w-full min-w-0">
            {/* Mobile Action Bar (<640px) */}
            <div className="sm:hidden flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={isEn ? 'Search adventures...' : 'Tìm cuộc phiêu lưu...'}
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
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hasActiveFilters
                    ? 'bg-[#8CC0EB] text-[#07090e] border-[#BFDDF0]'
                    : 'bg-[#090d16] text-white border-white/15 hover:border-white/25'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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

                {selectedDifficulties.map((diff) => {
                  const dOption = DIFFICULTY_OPTIONS.find((opt) => opt.value === diff);
                  const label = dOption ? (isEn ? dOption.labelEn : dOption.labelVi) : `${diff}★`;
                  return (
                    <span
                      key={diff}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleDifficulty(diff)}
                        className="hover:text-white cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                {selectedTypes.map((typeVal) => {
                  const tOption = TYPE_OPTIONS.find((opt) => opt.value === typeVal);
                  const label = tOption ? (isEn ? tOption.labelEn : tOption.labelVi) : typeVal;
                  return (
                    <span
                      key={typeVal}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 text-xs"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleType(typeVal)}
                        className="hover:text-white cursor-pointer ml-0.5"
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

            {/* Adventures Grid with Subtle Loading Opacity */}
            <div className={`flex-1 transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {loading && maps.length === 0 ? (
                <ListSkeleton
                  type="entity"
                  count={12}
                  gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5"
                />
              ) : maps.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
                  <h3 className="text-base font-bold text-white mb-1">
                    {isEn ? 'No adventures found' : 'Không tìm thấy cuộc phiêu lưu nào'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    {isEn
                      ? 'Try adjusting your search keyword or difficulty filters.'
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
                  {maps.map((mapItem) => (
                    <EntityCard
                      key={mapItem.adventureID}
                      item={mapItem}
                      type="map"
                      onClick={() => onSelectMap?.(mapItem.adventureID || mapItem.adventureName)}
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

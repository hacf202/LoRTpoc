import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChampionGridCard from './ChampionGridCard';
import ChampionFiltersSidebar from './ChampionFiltersSidebar';
import Pagination from './Pagination';
import ListLoadingBar from './ListLoadingBar';
import ListSkeleton from './ListSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl, getRegionDisplayName, getTagLabel } from '../utils/regionIcons';

/**
 * Modern LoR Champion Roster with Vertical Left Sidebar, Multi-Select Filters,
 * Full Accent-Insensitive Search, Sorting, and Server-Side Pagination
 * Compliant with 3-Breakpoint Rule: Mobile (<640px), Tablet (640-1279px), PC (>=1280px)
 */
export default function ChampionRoster({
  filters = {},
  updateFilters,
  onSelectChampion
}) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const rosterTopRef = useRef(null);

  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    stars: [7, 6, 3],
    costs: [1, 2, 3, 4, 5, 6, 7],
    tiers: [],
    tags: []
  });

  // Champion data and loading state
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pagination, setPagination] = useState({
    page: filters.page || 1,
    limit: filters.limit || 24,
    total: 0,
    totalPages: 1,
    hasMore: false
  });

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Local search state for input debouncing
  const [localSearch, setLocalSearch] = useState(filters.q || '');

  // Parse arrays from URL comma-separated strings
  const selectedRegions = (filters.regions || (filters.region && filters.region !== 'all' ? filters.region : ''))
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

  const selectedCosts = (filters.costs || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const selectedStars = (filters.stars && filters.stars !== 'all' ? filters.stars : '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  const selectedTags = (filters.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const sortBy = filters.sort || 'name-asc';
  const currentPage = filters.page || 1;
  const currentLimit = 24;

  const hasActiveFilters = Boolean(
    localSearch.trim() ||
    selectedRegions.length > 0 ||
    selectedCosts.length > 0 ||
    selectedStars.length > 0 ||
    selectedTags.length > 0 ||
    sortBy !== 'name-asc'
  );

  // Total active filter badge count
  const activeFiltersCount =
    (localSearch.trim() ? 1 : 0) +
    selectedRegions.length +
    selectedCosts.length +
    selectedStars.length +
    selectedTags.length +
    (sortBy !== 'name-asc' ? 1 : 0);

  // 1. Fetch Filter Options on Mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/champions/filters')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data && isMounted) {
          setFilterOptions(json.data);
        }
      })
      .catch((err) => console.error('Failed to load champion filter options:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Paginated Champions based on Current Filters
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchChampions = async () => {
      setIsTransitioning(true);
      if (champions.length === 0) {
        setLoading(true);
      }
      const startTime = performance.now();

      try {
        const params = new URLSearchParams();
        params.set('summary', 'true');
        params.set('page', String(currentPage));
        params.set('limit', String(currentLimit));

        if (localSearch.trim()) {
          params.set('search', localSearch.trim());
        }
        if (selectedRegions.length > 0) {
          params.set('regions', selectedRegions.join(','));
        }
        if (selectedCosts.length > 0) {
          params.set('costs', selectedCosts.join(','));
        }
        if (selectedStars.length > 0) {
          params.set('stars', selectedStars.join(','));
        }
        if (selectedTags.length > 0) {
          params.set('tags', selectedTags.join(','));
        }
        if (sortBy) {
          params.set('sort', sortBy);
        }

        const res = await fetch(`/api/v1/champions?${params.toString()}`, {
          signal: abortController.signal
        });

        // Enforce smooth minimum 320ms duration to eliminate jarring instant flash (Rule 9)
        const elapsed = performance.now() - startTime;
        const remainingDelay = Math.max(0, 320 - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setChampions(json.data || []);
            if (json.pagination) {
              setPagination(json.pagination);
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch champions:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsTransitioning(false);
        }
      }
    };

    fetchChampions();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [localSearch, filters.regions, filters.region, filters.costs, filters.stars, filters.tags, sortBy, currentPage, currentLimit]);

  // Synchronize local search when filters.q changes externally (e.g. browser navigation)
  useEffect(() => {
    setLocalSearch(filters.q || '');
  }, [filters.q]);

  // Sync local search with debounce (350ms - Rule 9) to URL
  useEffect(() => {
    const currentQuery = (filters.q || '').trim();
    if (localSearch.trim() !== currentQuery) {
      setIsTransitioning(true);
    }
    const timer = setTimeout(() => {
      if (localSearch.trim() !== currentQuery) {
        updateFilters?.({ q: localSearch.trim(), page: 1 });
      } else {
        setIsTransitioning(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, filters.q, updateFilters]);

  // Handlers for toggling multi-select filter items with immediate transition feedback
  const handleToggleRegion = useCallback(
    (regKey) => {
      setIsTransitioning(true);
      const cleanKey = regKey.toLowerCase().trim();
      const next = selectedRegions.includes(cleanKey)
        ? selectedRegions.filter((r) => r !== cleanKey)
        : [...selectedRegions, cleanKey];

      updateFilters?.({
        regions: next.join(','),
        region: next.length === 1 ? next[0] : 'all',
        page: 1
      });
    },
    [selectedRegions, updateFilters]
  );

  const handleToggleCost = useCallback(
    (costVal) => {
      setIsTransitioning(true);
      const next = selectedCosts.includes(costVal)
        ? selectedCosts.filter((c) => c !== costVal)
        : [...selectedCosts, costVal];

      updateFilters?.({ costs: next.join(','), page: 1 });
    },
    [selectedCosts, updateFilters]
  );

  const handleToggleStar = useCallback(
    (starVal) => {
      setIsTransitioning(true);
      const numVal = parseInt(starVal, 10);
      const next = selectedStars.includes(numVal)
        ? selectedStars.filter((s) => s !== numVal)
        : [...selectedStars, numVal];

      updateFilters?.({
        stars: next.length > 0 ? next.join(',') : 'all',
        page: 1
      });
    },
    [selectedStars, updateFilters]
  );

  const handleToggleTag = useCallback(
    (tagVal) => {
      setIsTransitioning(true);
      const next = selectedTags.includes(tagVal)
        ? selectedTags.filter((t) => t !== tagVal)
        : [...selectedTags, tagVal];

      updateFilters?.({ tags: next.join(','), page: 1 });
    },
    [selectedTags, updateFilters]
  );

  const handleSortChange = useCallback(
    (newSort) => {
      setIsTransitioning(true);
      updateFilters?.({ sort: newSort, page: 1 });
    },
    [updateFilters]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      setIsTransitioning(true);
      updateFilters?.({ page: newPage });
      if (rosterTopRef.current) {
        rosterTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    setIsTransitioning(true);
    setLocalSearch('');
    updateFilters?.({
      q: '',
      regions: '',
      region: 'all',
      costs: '',
      stars: 'all',
      tags: '',
      sort: 'name-asc',
      page: 1
    });
  }, [updateFilters]);

  return (
    <section ref={rosterTopRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* 1. Single Clean Page Header (Ra giữa, chữ lớn lên, không nền đen) */}
      <div className="w-full text-center pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/10 select-none">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
          {t('roster.title')}
        </h1>
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
          <span className="text-[#FFF9D2] font-bold">{pagination.total}</span>
          <span>{isEn ? 'Champions' : 'Vị Tướng'}</span>
        </div>
      </div>

      {/* 2. Mobile Action Bar (<640px): Quick Search & Mobile Drawer Trigger */}
      <div className="sm:hidden flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={t('roster.searchInList')}
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

      {/* 3. Main Responsive 2-Column Layout with Stable Minimum Height */}
      <div className="flex items-start gap-5 lg:gap-6 w-full min-h-[720px] sm:min-h-[820px]">
        {/* Left Column: Vertical Sidebar on PC/Tablet & Mobile Drawer */}
        <ChampionFiltersSidebar
          searchTerm={localSearch}
          onSearchChange={setLocalSearch}
          selectedRegions={selectedRegions}
          onToggleRegion={handleToggleRegion}
          selectedCosts={selectedCosts}
          onToggleCost={handleToggleCost}
          selectedStars={selectedStars}
          onToggleStar={handleToggleStar}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          filterOptions={filterOptions}
          isOpenMobile={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        {/* Right Column: Active Chips + Cards Grid + Pagination (Anchor Min Height) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-[720px] sm:min-h-[820px]">
          {/* Active Filters Chips Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap pb-4 mb-4 border-b border-white/10 text-xs">
              <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                {isEn ? 'Active:' : 'Đang lọc:'}
              </span>

              {localSearch.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15">
                  <span>"{localSearch}"</span>
                  <button
                    type="button"
                    onClick={() => setLocalSearch('')}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}

              {selectedRegions.map((reg) => (
                <span
                  key={reg}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8CC0EB]/20 text-[#8CC0EB] border border-[#8CC0EB]/40 font-semibold capitalize text-xs"
                >
                  <img
                    src={getRegionIconUrl(reg)}
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span>{getRegionDisplayName(reg, t)}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleRegion(reg)}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {selectedCosts.map((cost) => (
                <span
                  key={cost}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-950/80 text-sky-200 border border-sky-400/50 font-bold text-xs"
                >
                  <span>{cost} Mana</span>
                  <button
                    type="button"
                    onClick={() => handleToggleCost(cost)}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {selectedStars.map((st) => (
                <span
                  key={st}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/80 text-amber-200 border border-amber-400/50 font-bold text-xs"
                >
                  <span>★{st}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleStar(st)}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-200 border border-purple-400/50 font-semibold text-xs"
                >
                  <span>{getTagLabel(tag, language)}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer ml-auto"
              >
                {t('roster.clearAll')}
              </button>
            </div>
          )}

          {/* Standardized Subtle Loading Progress Line (Rule 9) */}
          <ListLoadingBar isTransitioning={isTransitioning} />

          {/* Cards Grid / Skeleton / Empty State */}
          <div className={`flex-1 flex flex-col transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && champions.length === 0 ? (
              <ListSkeleton type="champion" count={8} />
            ) : champions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-5 animate-in fade-in duration-200">
                {champions.map((champion) => (
                  <ChampionGridCard
                    key={champion.championID || champion.cardCode || champion.name}
                    champion={champion}
                    onClick={onSelectChampion}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full mt-2 py-10 px-4 text-center rounded-2xl bg-[#090d16] border border-white/10 animate-in fade-in duration-200">
                <div className="w-12 h-12 mx-auto mb-3 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {t('roster.noResultsTitle')}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  {t('roster.noResultsDesc')}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-[#BFDDF0] transition-colors"
                >
                  {t('roster.resetFilters')}
                </button>
              </div>
            )}
          </div>

          {/* Pagination (Cố định 24 mục mỗi trang, loại bỏ bộ chọn 12/24/48) */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-auto pt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={24}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

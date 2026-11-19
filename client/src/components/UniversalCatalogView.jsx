import React, { useState, useMemo, useEffect } from 'react';
import EntityCard from './EntityCard';
import EntityDetailModal from './EntityDetailModal';
import Pagination from './Pagination';
import { useLanguage } from '../context/LanguageContext';
import { rankSearchResults } from '../utils/searchUtils';

/**
 * Universal Reusable LoR Catalog View Component
 * Supports search, multi-faceted filtering, sorting, responsive 3-breakpoint grid,
 * pagination, and interactive entity inspection modal.
 */
export default function UniversalCatalogView({
  title,
  subtitle,
  badgeText,
  items = [],
  loading = false,
  entityType = 'relic',
  filtersConfig = [], // [{ id, label, options: [{ value, label }], activeValue, onChange }]
  sortOptions = [
    { value: 'name-asc', label: 'Tên (A - Z)' },
    { value: 'name-desc', label: 'Tên (Z - A)' },
    { value: 'rarity', label: 'Độ hiếm' }
  ],
  customSortFn,
  customFilterFn,
  renderCard,
  searchPlaceholder = 'Tìm kiếm...'
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  // Local state with Rule 9 Debounce (350ms)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value || 'name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const [selectedItem, setSelectedItem] = useState(null);

  // Debounce search input by 350ms
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
      setTimeout(() => setIsTransitioning(false), 120);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filtered & Sorted items calculation
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Custom filter function if provided (ví dụ lọc độ hiếm, vùng đất)
    if (customFilterFn) {
      result = result.filter(customFilterFn);
    }

    // 2. Text search: Không dấu, đa ngữ Việt - Anh, ưu tiên độ tương thích cao & ngắn nhất lên đầu (Debounced)
    const q = debouncedSearch.trim();
    if (q) {
      result = rankSearchResults(result, q, (item) => ({
        nameVi: item.name || item.adventureName || item.cardName || '',
        nameEn: item.translations?.en?.name || item.translations?.en?.adventureName || '',
        code: item.relicCode || item.powerCode || item.itemCode || item.cardCode || item.adventureID || '',
        desc: item.descriptionRaw || item.description || item.requirement || ''
      }));
    }

    // 3. Sorting (Nếu đang tìm kiếm và người dùng để sắp xếp mặc định name-asc thì giữ nguyên xếp hạng tương thích)
    const isDefaultSort = !sortBy || sortBy === 'name-asc';
    if (!q || !isDefaultSort) {
      if (customSortFn) {
        result.sort(customSortFn);
      } else {
        result.sort((a, b) => {
          const nameA = (isEn ? a.translations?.en?.name : a.name) || a.name || a.adventureName || a.cardName || '';
          const nameB = (isEn ? b.translations?.en?.name : b.name) || b.name || b.adventureName || b.cardName || '';

          if (sortBy === 'name-asc') {
            return nameA.localeCompare(nameB);
          }
          if (sortBy === 'name-desc') {
            return nameB.localeCompare(nameA);
          }
          if (sortBy === 'rarity') {
            const rank = { common: 1, thường: 1, rare: 2, hiếm: 2, epic: 3, 'sử thi': 3, legendary: 4, 'huyền thoại': 4 };
            const rA = rank[(a.rarity || '').toLowerCase()] || 0;
            const rB = rank[(b.rarity || '').toLowerCase()] || 0;
            return rB - rA;
          }
          if (sortBy === 'cost') {
            return (a.cost || 0) - (b.cost || 0);
          }
          if (sortBy === 'difficulty') {
            return (a.difficulty || 0) - (b.difficulty || 0);
          }
          return 0;
        });
      }
    }

    return result;
  }, [items, debouncedSearch, customFilterFn, customSortFn, sortBy, isEn]);

  // Pagination calculation
  const totalItems = processedItems.length;
  const isAll = itemsPerPage === 'all';
  const effectivePageSize = isAll ? Math.max(1, totalItems) : itemsPerPage;
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;

  // Auto adjust page when out of bounds
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    if (isAll) return processedItems;
    const startIndex = (safePage - 1) * effectivePageSize;
    return processedItems.slice(startIndex, startIndex + effectivePageSize);
  }, [processedItems, safePage, effectivePageSize, isAll]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
  };

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* 1. Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold font-heading bg-[#182030] text-[#FFF9D2] border border-[#8CC0EB]/50 shadow-sm">
            {badgeText || `${totalItems} ${isEn ? 'Items' : 'Mục'}`}
          </span>
          <span className="text-xs text-slate-300">
            {isEn ? 'Total in database:' : 'Tổng cơ sở dữ liệu:'} <strong className="text-white">{items.length}</strong>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* 2. Control & Filter Bar */}
      <div className="mb-6 sm:mb-8 p-2 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/15 shadow-xl flex flex-col gap-3 sm:gap-4">
        {/* Top Controls: Search + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141b29] border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#8CC0EB] focus:ring-1 focus:ring-[#8CC0EB] transition-all font-sans"
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          {sortOptions.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-300 hidden md:inline font-sans">
                {isEn ? 'Sort by:' : 'Sắp xếp:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl bg-[#141b29] border border-white/15 text-white text-xs sm:text-sm font-sans focus:outline-none focus:border-[#8CC0EB] cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#141b29] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Categories Pills */}
        {filtersConfig.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
            {filtersConfig.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-300 min-w-[70px] font-heading">
                  {filter.label}:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filter.options.map((opt) => {
                    const isActive = filter.activeValue === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          filter.onChange(opt.value);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#8CC0EB] text-[#07090e] font-extrabold shadow-md'
                            : 'bg-[#141b29] text-slate-200 hover:text-white border border-white/10 hover:border-white/25'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtle Loading Progress Line (Rule 9) */}
      <div className={`h-0.5 w-full -mt-4 mb-4 rounded-full overflow-hidden transition-opacity duration-200 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full bg-[#8CC0EB] animate-pulse w-full shadow-[0_0_8px_rgba(140,192,235,0.6)]" />
      </div>

      {/* 3. Items Grid Section (Responsive 4 columns on PC, smaller on others) */}
      <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-[#0e1320] border border-white/10 animate-pulse flex flex-col gap-3 min-h-[160px]"
            >
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/15 rounded w-1/3" />
                  <div className="h-4 bg-white/20 rounded w-3/4" />
                </div>
              </div>
              <div className="h-10 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : paginatedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
          {paginatedItems.map((item, idx) => {
            const key =
              item.relicCode ||
              item.powerCode ||
              item.itemCode ||
              item.cardCode ||
              item.adventureID ||
              item.championID ||
              idx;

            if (renderCard) {
              return <React.Fragment key={key}>{renderCard(item, () => setSelectedItem(item))}</React.Fragment>;
            }

            return (
              <EntityCard
                key={key}
                item={item}
                type={entityType}
                onClick={(clicked) => setSelectedItem(clicked)}
              />
            );
          })}
        </div>
      ) : (
        <div className="w-full mt-2 py-10 px-4 text-center bg-[#0c1017]/40 border border-white/5 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="text-lg font-bold font-heading text-white mb-1">
            {isEn ? 'No items found' : 'Không tìm thấy dữ liệu'}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {isEn
              ? 'Try modifying your search keywords or clearing active filters.'
              : 'Hãy thử đổi từ khóa tìm kiếm hoặc xóa các điều kiện lọc hiện tại.'}
          </p>
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="px-4 py-2 rounded-xl bg-[#161f30] hover:bg-[#1e293b] border border-white/10 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              {isEn ? 'Clear Search' : 'Xóa từ khóa'}
            </button>
          )}
        </div>
      )}
      </div>

      {/* 4. Pagination */}
      {!loading && totalItems > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={24}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 5. Detail Modal */}
      {selectedItem && (
        <EntityDetailModal
          item={selectedItem}
          type={entityType}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

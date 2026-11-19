import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl, getRegionDisplayName, getTagLabel } from '../utils/regionIcons';
import DropdownFilter from './DropdownFilter';
import MultiSelectFilter from './MultiSelectFilter';

const DEFAULT_REGIONS = [
  'bandlecity',
  'bilgewater',
  'demacia',
  'freljord',
  'ionia',
  'noxus',
  'piltoverzaun',
  'runeterra',
  'shadowisles',
  'shurima',
  'spiritblossom',
  'targon'
];

const COST_OPTIONS = ['1', '2', '3', '4', '5', '6', '7+'];
const STAR_OPTIONS = [3, 6, 7];

/**
 * Tactical Champion Filter Sidebar
 * Uses floating vertical dropdowns for zero-layout-shift experience.
 */
export default function ChampionFiltersSidebar({
  searchTerm = '',
  onSearchChange,
  selectedRegions = [],
  onToggleRegion,
  selectedCosts = [],
  onToggleCost,
  selectedStars = [],
  onToggleStar,
  selectedTags = [],
  onToggleTag,
  sortBy = 'name-asc',
  onSortChange,
  onResetFilters,
  hasActiveFilters = false,
  filterOptions = {},
  isOpenMobile = false,
  onCloseMobile
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const availableTags = filterOptions?.tags?.length
    ? filterOptions.tags
    : [
        'Aggro',
        'Control',
        'Combo',
        'Midrange',
        'Spells',
        'Swarm',
        'Tech',
        'Creation',
        'Buff Stat',
        'Infinite Value',
        '6 Sao Ko Skin'
      ];

  const sortOptions = [
    { value: 'name-asc', label: isEn ? 'Name (A - Z)' : 'Tên (A - Z)' },
    { value: 'name-desc', label: isEn ? 'Name (Z - A)' : 'Tên (Z - A)' },
    { value: 'stars-desc', label: isEn ? 'Stars (High → Low)' : 'Cấp sao (Cao → Thấp)' },
    { value: 'stars-asc', label: isEn ? 'Stars (Low → High)' : 'Cấp sao (Thấp → Cao)' },
    { value: 'cost-asc', label: isEn ? 'Cost (Low → High)' : 'Năng lượng (Thấp → Cao)' },
    { value: 'cost-desc', label: isEn ? 'Cost (High → Low)' : 'Năng lượng (Cao → Thấp)' },
    { value: 'tier', label: isEn ? 'Tier List' : 'Thứ hạng sức mạnh' }
  ];

  const regionOptions = DEFAULT_REGIONS.map((regKey) => ({
    value: regKey,
    label: getRegionDisplayName(regKey, t),
    iconUrl: getRegionIconUrl(regKey)
  }));

  const costOptions = COST_OPTIONS.map((c) => ({
    value: c,
    label: c === '7+' ? (isEn ? '7+ Mana' : '7+ Năng lượng') : `${c} Mana`
  }));

  const starOptions = STAR_OPTIONS.map((s) => ({
    value: s,
    label: `${s} ★`
  }));

  const tagOptions = availableTags.map((tag) => ({
    value: tag,
    label: getTagLabel(tag, t)
  }));

  const content = (
    <div className="flex flex-col gap-3 text-sans select-none">
      {/* 1. Search Bar */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-heading">
          {isEn ? 'Search Champions' : 'Tìm Kiếm Tướng'}
        </label>
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isEn ? 'Champion name or region...' : 'Tên tướng hoặc khu vực...'}
            className="w-full h-9 pl-8 pr-7 text-xs bg-[#090d16] border border-white/15 focus:border-[#8CC0EB] rounded-xl text-white placeholder-slate-500 outline-none transition-colors"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-1 text-slate-400 hover:text-white cursor-pointer"
              title={isEn ? 'Clear' : 'Xóa'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sort Dropdown */}
      <DropdownFilter
        label={isEn ? 'Sort By' : 'Sắp Xếp'}
        options={sortOptions}
        selectedValue={sortBy}
        onChange={onSortChange}
        placeholder={isEn ? 'Select sort order...' : 'Chọn thứ tự sắp xếp...'}
      />

      {/* 3. Regions Multi-Select */}
      <MultiSelectFilter
        label={isEn ? 'Regions' : 'Khu Vực'}
        options={regionOptions}
        selectedValues={selectedRegions}
        onChange={(newValues) => {
          // Sync with parent toggle signature
          newValues.forEach((v) => {
            if (!selectedRegions.includes(v)) onToggleRegion(v);
          });
          selectedRegions.forEach((v) => {
            if (!newValues.includes(v)) onToggleRegion(v);
          });
        }}
        placeholder={isEn ? 'All Regions' : 'Tất cả khu vực'}
        badgeLabel={isEn ? 'regions' : 'khu vực'}
      />

      {/* 4. Costs Multi-Select */}
      <MultiSelectFilter
        label={isEn ? 'Cost (Mana)' : 'Năng Lượng'}
        options={costOptions}
        selectedValues={selectedCosts}
        onChange={(newValues) => {
          newValues.forEach((v) => {
            if (!selectedCosts.includes(v)) onToggleCost(v);
          });
          selectedCosts.forEach((v) => {
            if (!newValues.includes(v)) onToggleCost(v);
          });
        }}
        placeholder={isEn ? 'All Costs' : 'Tất cả năng lượng'}
        badgeLabel="mana"
      />

      {/* 5. Stars Multi-Select */}
      <MultiSelectFilter
        label={isEn ? 'Max Stars' : 'Cấp Sao'}
        options={starOptions}
        selectedValues={selectedStars}
        onChange={(newValues) => {
          newValues.forEach((v) => {
            if (!selectedStars.includes(v)) onToggleStar(v);
          });
          selectedStars.forEach((v) => {
            if (!newValues.includes(v)) onToggleStar(v);
          });
        }}
        placeholder={isEn ? 'All Stars' : 'Tất cả cấp sao'}
        badgeLabel="sao"
      />

      {/* 6. Tags Multi-Select */}
      <MultiSelectFilter
        label={isEn ? 'Playstyle & Tags' : 'Lối Chơi & Tags'}
        options={tagOptions}
        selectedValues={selectedTags}
        onChange={(newValues) => {
          newValues.forEach((v) => {
            if (!selectedTags.includes(v)) onToggleTag(v);
          });
          selectedTags.forEach((v) => {
            if (!newValues.includes(v)) onToggleTag(v);
          });
        }}
        placeholder={isEn ? 'All Playstyles' : 'Tất cả lối chơi'}
        badgeLabel="tags"
      />

      {/* 7. Reset Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 w-full py-2 px-3 rounded-xl border border-rose-500/30 hover:border-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>{isEn ? 'Reset Filters' : 'Đặt Lại Bộ Lọc'}</span>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sticky Sidebar (Floating dropdowns prevent layout shifting) */}
      <aside className="hidden sm:block w-52 lg:w-56 shrink-0 sticky top-20 rounded-2xl bg-[#0c101c]/95 border border-white/10 p-3 shadow-xl backdrop-blur-md">
        {content}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 right-0 max-w-[300px] w-full bg-[#0c101c] border-l border-white/10 p-2 sm:p-4 shadow-2xl flex flex-col justify-between">
            <div className="flex-1 overflow-y-visible pr-1">
              <div className="flex items-center justify-between pb-2 mb-2 sm:pb-3 sm:mb-3 border-b border-white/10">
                <h3 className="text-xs sm:text-sm font-bold font-heading text-white uppercase tracking-wider">
                  {isEn ? 'Filter Champions' : 'Bộ Lọc Tướng'}
                </h3>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {content}
            </div>

            <div className="pt-3 border-t border-white/10 mt-3 shrink-0 flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  {isEn ? 'Reset' : 'Đặt Lại'}
                </button>
              )}
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex-1 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md hover:bg-[#a0cef2] transition-colors"
              >
                {isEn ? 'View Results' : 'Xem Kết Quả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

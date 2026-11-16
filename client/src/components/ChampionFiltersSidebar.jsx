import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl, getRegionDisplayName, getTagLabel } from '../utils/regionIcons';

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
 * Filter Sidebar for Champions Roster
 * Styled identically to PowerFiltersSidebar:
 * - Search bar with inner icon
 * - Sort dropdown
 * - Collapsible filter sections (Regions, Costs, Stars, Tags) with checkmark box style
 * - Reset Filters button with rose accent
 * - Mobile slide-out drawer
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

  const [openSections, setOpenSections] = useState({
    regions: true,
    costs: true,
    stars: true,
    tags: false
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const content = (
    <div className="flex flex-col gap-3.5 text-sans select-none">
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
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-heading">
          {isEn ? 'Sort By' : 'Sắp Xếp'}
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full h-9 px-2.5 text-xs bg-[#090d16] border border-white/15 focus:border-[#8CC0EB] rounded-xl text-white outline-none cursor-pointer transition-colors"
        >
          <option value="name-asc">{isEn ? 'Name (A - Z)' : 'Tên (A - Z)'}</option>
          <option value="name-desc">{isEn ? 'Name (Z - A)' : 'Tên (Z - A)'}</option>
          <option value="stars-desc">{isEn ? 'Stars (High to Low)' : 'Cấp sao (Cao → Thấp)'}</option>
          <option value="stars-asc">{isEn ? 'Stars (Low to High)' : 'Cấp sao (Thấp → Cao)'}</option>
          <option value="cost-asc">{isEn ? 'Cost (Low to High)' : 'Năng lượng (Thấp → Cao)'}</option>
          <option value="cost-desc">{isEn ? 'Cost (High to Low)' : 'Năng lượng (Cao → Thấp)'}</option>
          <option value="tier">{isEn ? 'Tier List' : 'Thứ hạng sức mạnh'}</option>
        </select>
      </div>

      {/* 3. Filter Section: Regions (Khu Vực) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('regions')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Regions' : 'Khu Vực'}</span>
            {selectedRegions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedRegions.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.regions ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.regions && (
          <div className="p-3 pt-0 max-h-56 overflow-y-auto no-scrollbar flex flex-col gap-1.5 border-t border-white/5">
            {DEFAULT_REGIONS.map((regKey) => {
              const isChecked = selectedRegions.includes(regKey);
              const label = getRegionDisplayName(regKey, t);
              const iconUrl = getRegionIconUrl(regKey);

              return (
                <label
                  key={regKey}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#8CC0EB]/15 text-[#8CC0EB] font-bold border border-[#8CC0EB]/40'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleRegion(regKey)}
                      className="hidden"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked ? 'bg-[#8CC0EB] border-[#8CC0EB]' : 'border-white/30 bg-[#070a10]'
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-2.5 h-2.5 text-[#07090e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {iconUrl && (
                      <img
                        src={iconUrl}
                        alt=""
                        aria-hidden="true"
                        className="w-4 h-4 object-contain shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span className="capitalize truncate">{label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Filter Section: Mana Cost (Năng Lượng) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('costs')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Cost' : 'Năng Lượng'}</span>
            {selectedCosts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedCosts.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.costs ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.costs && (
          <div className="p-3 pt-0 flex flex-col gap-1.5 border-t border-white/5">
            {COST_OPTIONS.map((cost) => {
              const isChecked = selectedCosts.includes(cost);
              return (
                <label
                  key={cost}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#8CC0EB]/15 text-[#8CC0EB] font-bold border border-[#8CC0EB]/40'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCost(cost)}
                      className="hidden"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked ? 'bg-[#8CC0EB] border-[#8CC0EB]' : 'border-white/30 bg-[#070a10]'
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-2.5 h-2.5 text-[#07090e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{cost} Mana</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Filter Section: Max Stars (Cấp Sao) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('stars')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Max Stars' : 'Cấp Sao'}</span>
            {selectedStars.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedStars.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.stars ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.stars && (
          <div className="p-3 pt-0 flex flex-col gap-1.5 border-t border-white/5">
            {STAR_OPTIONS.map((st) => {
              const isChecked = selectedStars.includes(st);
              return (
                <label
                  key={st}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#8CC0EB]/15 text-[#8CC0EB] font-bold border border-[#8CC0EB]/40'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleStar(st)}
                      className="hidden"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked ? 'bg-[#8CC0EB] border-[#8CC0EB]' : 'border-white/30 bg-[#070a10]'
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-2.5 h-2.5 text-[#07090e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{st} {isEn ? 'Stars' : 'Sao'}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Filter Section: Playstyle / Tags (Lối Chơi) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('tags')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Playstyle' : 'Lối Chơi'}</span>
            {selectedTags.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedTags.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.tags ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.tags && (
          <div className="p-3 pt-0 max-h-56 overflow-y-auto no-scrollbar flex flex-col gap-1.5 border-t border-white/5">
            {availableTags.map((tag) => {
              const isChecked = selectedTags.includes(tag);
              const label = getTagLabel(tag, language);

              return (
                <label
                  key={tag}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#8CC0EB]/15 text-[#8CC0EB] font-bold border border-[#8CC0EB]/40'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleTag(tag)}
                      className="hidden"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked ? 'bg-[#8CC0EB] border-[#8CC0EB]' : 'border-white/30 bg-[#070a10]'
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-2.5 h-2.5 text-[#07090e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Reset Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
      {/* Desktop & Tablet Sticky Sidebar */}
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
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#0c101c] border-l border-white/10 p-4 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <h3 className="text-sm font-bold font-heading text-white uppercase tracking-wider">
                  {isEn ? 'Filter Champions' : 'Bộ Lọc Tướng'}
                </h3>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {content}
            </div>

            <div className="pt-4 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider cursor-pointer"
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

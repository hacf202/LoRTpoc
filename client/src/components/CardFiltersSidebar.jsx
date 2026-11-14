import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl } from '../utils/regionIcons';

const REGIONS = [
  'Demacia',
  'Freljord',
  'Ionia',
  'Noxus',
  'Piltover & Zaun',
  'Thành Phố Bandle',
  'Quần Đảo Bóng Đêm',
  'Bilgewater',
  'Targon',
  'Shurima',
  'Runeterra'
];

const COST_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];

export const TYPE_OPTIONS = [
  { value: 'unit', labelVi: 'Bài Quân', labelEn: 'Unit' },
  { value: 'spell', labelVi: 'Bài Phép', labelEn: 'Spell' },
  { value: 'landmark', labelVi: 'Địa Danh', labelEn: 'Landmark' },
  { value: 'equipment', labelVi: 'Trang Bị', labelEn: 'Equipment' }
];

export const RARITY_OPTIONS = [
  { value: 'champion', labelVi: 'Anh Hùng', labelEn: 'Champion' },
  { value: 'epic', labelVi: 'Sử Thi', labelEn: 'Epic' },
  { value: 'rare', labelVi: 'Hiếm', labelEn: 'Rare' },
  { value: 'common', labelVi: 'Thường', labelEn: 'Common' }
];

export default function CardFiltersSidebar({
  searchTerm = '',
  onSearchChange,
  selectedRegions = [],
  onToggleRegion,
  selectedCosts = [],
  onToggleCost,
  selectedTypes = [],
  onToggleType,
  selectedRarities = [],
  onToggleRarity,
  sortBy = 'cost-asc',
  onSortChange,
  onResetFilters,
  hasActiveFilters = false,
  isOpenMobile = false,
  onCloseMobile
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [openSections, setOpenSections] = useState({
    cost: true,
    region: true,
    type: true,
    rarity: false
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const content = (
    <div className="flex flex-col gap-3.5 text-sans select-none">
      {/* 1. Search Bar */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-heading">
          {isEn ? 'Search Cards' : 'Tìm Kiếm Lá Bài'}
        </label>
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isEn ? 'Name, code or description...' : 'Tên, mã hoặc mô tả...'}
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
          <option value="cost-asc">{isEn ? 'Champions First, then Cost (Low → High)' : 'Tướng trước, Tiêu hao (Thấp → Cao)'}</option>
          <option value="cost-desc">{isEn ? 'Cost (High to Low)' : 'Năng lượng (Cao → Thấp)'}</option>
          <option value="name-asc">{isEn ? 'Name (A - Z)' : 'Tên (A - Z)'}</option>
          <option value="name-desc">{isEn ? 'Name (Z - A)' : 'Tên (Z - A)'}</option>
          <option value="rarity-desc">{isEn ? 'Rarity (High to Low)' : 'Độ hiếm (Cao → Thấp)'}</option>
        </select>
      </div>

      {/* 3. Filter Section: Cost (Năng Lượng) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('cost')}
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
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.cost ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.cost && (
          <div className="p-3 pt-0 max-h-56 overflow-y-auto no-scrollbar flex flex-col gap-1.5 border-t border-white/5">
            {COST_OPTIONS.map((c) => {
              const isChecked = selectedCosts.includes(c);
              const label = c === '8' ? '8+ Mana' : `${c} Mana`;
              return (
                <label
                  key={c}
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
                      onChange={() => onToggleCost(c)}
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
                    <span>{label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Filter Section: Region (Khu Vực) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('region')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Region' : 'Khu Vực'}</span>
            {selectedRegions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedRegions.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.region ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.region && (
          <div className="p-3 pt-0 max-h-56 overflow-y-auto no-scrollbar flex flex-col gap-1.5 border-t border-white/5">
            {REGIONS.map((reg) => {
              const isChecked = selectedRegions.includes(reg);
              return (
                <label
                  key={reg}
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
                      onChange={() => onToggleRegion(reg)}
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
                    {getRegionIconUrl(reg) && (
                      <img
                        src={getRegionIconUrl(reg)}
                        alt=""
                        aria-hidden="true"
                        className="w-4 h-4 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="truncate">{reg}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Filter Section: Card Type (Loại Thẻ) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Card Type' : 'Loại Thẻ'}</span>
            {selectedTypes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedTypes.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.type ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.type && (
          <div className="p-3 pt-0 flex flex-col gap-1.5 border-t border-white/5">
            {TYPE_OPTIONS.map((t) => {
              const isChecked = selectedTypes.includes(t.value);
              return (
                <label
                  key={t.value}
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
                      onChange={() => onToggleType(t.value)}
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
                    <span>{isEn ? t.labelEn : t.labelVi}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Filter Section: Rarity (Độ Hiếm) */}
      <div className="rounded-xl border border-white/10 bg-[#090d16] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('rarity')}
          className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>{isEn ? 'Rarity' : 'Độ Hiếm'}</span>
            {selectedRarities.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8CC0EB] text-[#07090e] text-[10px] font-black">
                {selectedRarities.length}
              </span>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.rarity ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {openSections.rarity && (
          <div className="p-3 pt-0 flex flex-col gap-1.5 border-t border-white/5">
            {RARITY_OPTIONS.map((r) => {
              const isChecked = selectedRarities.includes(r.value);
              return (
                <label
                  key={r.value}
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
                      onChange={() => onToggleRarity(r.value)}
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
                    <span>{isEn ? r.labelEn : r.labelVi}</span>
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
                  {isEn ? 'Filter Cards' : 'Bộ Lọc Lá Bài'}
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

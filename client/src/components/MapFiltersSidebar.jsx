import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import DropdownFilter from './DropdownFilter';
import MultiSelectFilter from './MultiSelectFilter';

export const DIFFICULTY_OPTIONS = [
  { value: 'low', labelVi: '0.5★ - 2★ (Cơ Bản)', labelEn: '0.5★ - 2★ (Starter)' },
  { value: 'mid', labelVi: '2.5★ - 4★ (Trung Cấp)', labelEn: '2.5★ - 4★ (Intermediate)' },
  { value: 'high', labelVi: '4.5★ - 6.5★ (Bậc Cao)', labelEn: '4.5★ - 6.5★ (Advanced)' },
  { value: 'nightmare', labelVi: '10★ (Ác Mộng)', labelEn: '10★ (Nightmare)' }
];

export const TYPE_OPTIONS = [
  { value: 'Ác Mộng', labelVi: 'Ác Mộng', labelEn: 'Nightmare' },
  { value: 'Phiêu Lưu Khắp Thế Giới', labelVi: 'Thế Giới', labelEn: 'World' },
  { value: 'Người Khổng Lồ Của Runeterra', labelVi: 'Khổng Lồ', labelEn: 'Colossus' },
  { value: 'Hoa Linh Lục Địa', labelVi: 'Hoa Linh', labelEn: 'Spirit Blossom' },
  { value: 'Tên Cướp Runeterra', labelVi: 'Tên Cướp', labelEn: 'Scourge' },
  { value: 'Huyền Thoại Arcane', labelVi: 'Arcane', labelEn: 'Arcane' }
];

export default function MapFiltersSidebar({
  searchTerm = '',
  onSearchChange,
  selectedDifficulties = [],
  onToggleDifficulty,
  selectedTypes = [],
  onToggleType,
  sortBy = 'difficulty-asc',
  onSortChange,
  onResetFilters,
  hasActiveFilters = false,
  isOpenMobile = false,
  onCloseMobile
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const sortOptions = [
    { value: 'difficulty-asc', label: isEn ? 'Difficulty (Low → High)' : 'Độ khó (Thấp → Cao)' },
    { value: 'difficulty-desc', label: isEn ? 'Difficulty (High → Low)' : 'Độ khó (Cao → Thấp)' },
    { value: 'name-asc', label: isEn ? 'Name (A - Z)' : 'Tên (A - Z)' },
    { value: 'name-desc', label: isEn ? 'Name (Z - A)' : 'Tên (Z - A)' }
  ];

  const difficultyOptions = DIFFICULTY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: isEn ? opt.labelEn : opt.labelVi
  }));

  const typeOptions = TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: isEn ? opt.labelEn : opt.labelVi
  }));

  const content = (
    <div className="flex flex-col gap-3 text-sans select-none">
      {/* 1. Search Bar */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-heading">
          {isEn ? 'Search Adventures' : 'Tìm Cuộc Phiêu Lưu'}
        </label>
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isEn ? 'Adventure name or boss...' : 'Tên bản đồ hoặc trùm...'}
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

      {/* 3. Difficulty Multi-Select */}
      <MultiSelectFilter
        label={isEn ? 'Difficulty Tier' : 'Bậc Độ Khó'}
        options={difficultyOptions}
        selectedValues={selectedDifficulties}
        onChange={(newValues) => {
          newValues.forEach((v) => {
            if (!selectedDifficulties.includes(v)) onToggleDifficulty(v);
          });
          selectedDifficulties.forEach((v) => {
            if (!newValues.includes(v)) onToggleDifficulty(v);
          });
        }}
        placeholder={isEn ? 'All Difficulties' : 'Tất cả độ khó'}
        badgeLabel={isEn ? 'tiers' : 'bậc'}
      />

      {/* 4. Type Multi-Select */}
      <MultiSelectFilter
        label={isEn ? 'Adventure Mode' : 'Chế Độ Phiêu Lưu'}
        options={typeOptions}
        selectedValues={selectedTypes}
        onChange={(newValues) => {
          newValues.forEach((v) => {
            if (!selectedTypes.includes(v)) onToggleType(v);
          });
          selectedTypes.forEach((v) => {
            if (!newValues.includes(v)) onToggleType(v);
          });
        }}
        placeholder={isEn ? 'All Modes' : 'Tất cả chế độ'}
        badgeLabel={isEn ? 'modes' : 'chế độ'}
      />

      {/* 5. Reset Filters Button */}
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
          <div className="fixed inset-y-0 right-0 max-w-[300px] w-full bg-[#0c101c] border-l border-white/10 p-2 sm:p-4 shadow-2xl flex flex-col justify-between">
            <div className="flex-1 overflow-y-visible pr-1">
              <div className="flex items-center justify-between pb-2 mb-2 sm:pb-3 sm:mb-3 border-b border-white/10">
                <h3 className="text-xs sm:text-sm font-bold font-heading text-white uppercase tracking-wider">
                  {isEn ? 'Filter Adventures' : 'Bộ Lọc Phiêu Lưu'}
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

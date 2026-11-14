import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Universal Responsive LoR Pagination Component
 * 3-Breakpoint compliant: Mobile (<640px), Tablet (640px-1279px), PC (>=1280px)
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 24,
  onPageChange,
  className = ''
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (totalPages <= 1 && totalItems <= (typeof itemsPerPage === 'number' ? itemsPerPage : totalItems)) {
    return null;
  }

  // Calculate start & end item indexes
  const startItem = itemsPerPage === 'all' ? 1 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = itemsPerPage === 'all' ? totalItems : Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const showEllipsisStart = currentPage > 4;
    const showEllipsisEnd = currentPage < totalPages - 3;

    pages.push(1);

    if (showEllipsisStart) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (showEllipsisEnd) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`w-full flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-4 bg-[#0e1320] border border-white/15 rounded-2xl shadow-xl select-none ${className}`}
    >
      {/* 1. Item range stats */}
      <div className="text-xs sm:text-sm text-slate-300 font-sans">
        {isEn ? (
          <>
            Showing <span className="font-semibold text-white">{startItem}</span> -{' '}
            <span className="font-semibold text-white">{endItem}</span> of{' '}
            <span className="font-semibold text-[#8CC0EB]">{totalItems}</span> items
          </>
        ) : (
          <>
            Hiển thị <span className="font-semibold text-white">{startItem}</span> -{' '}
            <span className="font-semibold text-white">{endItem}</span> trên{' '}
            <span className="font-semibold text-[#8CC0EB]">{totalItems}</span> mục
          </>
        )}
      </div>

      {/* 2. Page Navigation Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border border-white/15 bg-[#141b29] text-slate-200 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
          title={isEn ? 'Previous page' : 'Trang trước'}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">{isEn ? 'Prev' : 'Trước'}</span>
        </button>

        {/* Numbered Page Buttons (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[34px] h-[34px] px-2 rounded-lg text-xs sm:text-sm font-extrabold font-heading transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#8CC0EB] text-[#07090e] shadow-md scale-105'
                    : 'bg-[#141b29] border border-white/15 text-slate-200 hover:text-white hover:border-white/30'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Mobile Page Indicator */}
        <div className="sm:hidden px-3 py-1 bg-[#141b29] border border-white/15 rounded-lg text-xs font-bold text-white">
          {currentPage} / {totalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border border-white/15 bg-[#141b29] text-slate-200 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
          title={isEn ? 'Next page' : 'Trang tiếp'}
        >
          <span className="hidden sm:inline">{isEn ? 'Next' : 'Tiếp'}</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>


    </div>
  );
}

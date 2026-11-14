import React, { forwardRef } from 'react';

/**
 * Reusable Glassmorphism Search Bar
 */
const SearchBar = forwardRef(function SearchBar(
  {
    value,
    onChange,
    onClear,
    onFocus,
    onBlur,
    onKeyDown,
    placeholder = 'Tìm kiếm.... ',
    className = ''
  },
  ref
) {
  return (
    <div
      className={`flex items-center w-full h-[60px] sm:h-[64px] px-5 sm:px-7 rounded-full bg-[#0d121d] border-2 border-white/20 shadow-2xl transition-all duration-200 focus-within:bg-[#121824] focus-within:border-[#8CC0EB] focus-within:-translate-y-0.5 ${className}`}
    >
      {/* Search Icon */}
      <div className="flex items-center justify-center text-[#8CC0EB] mr-3.5">
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={ref}
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-slate-400 font-heading"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
      />

      {/* Clear Button */}
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors mr-1 cursor-pointer"
          aria-label="Xóa nội dung"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default SearchBar;

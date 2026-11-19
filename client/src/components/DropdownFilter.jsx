import React, { useState, useRef, useEffect } from 'react';

/**
 * Tactical Dropdown Filter (Single Select)
 * Floating absolute menu that never resizes or causes layout shifts in the parent container.
 */
export default function DropdownFilter({
  label,
  options = [],
  selectedValue,
  onChange,
  placeholder = 'Chọn tùy chọn...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayedLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative w-full select-none" ref={dropdownRef}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-heading">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 rounded-xl border flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
          isOpen
            ? 'bg-[#121824] border-[#8CC0EB] text-white shadow-md'
            : 'bg-[#090d16] border-white/15 text-slate-200 hover:text-white hover:border-white/30'
        }`}
      >
        <span className="truncate font-medium">{displayedLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#8CC0EB]' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Floating Absolute Menu (Overlay - Does not alter web height or width) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-[#0c101c] border border-white/15 rounded-xl shadow-2xl max-h-56 overflow-y-auto no-scrollbar py-1 backdrop-blur-xl">
          {options.map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#8CC0EB]/15 text-[#8CC0EB] font-bold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-[#8CC0EB] shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

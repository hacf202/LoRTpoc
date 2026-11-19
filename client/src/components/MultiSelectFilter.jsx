import React, { useState, useRef, useEffect } from 'react';

/**
 * Tactical Multi-Select Filter with Floating Absolute Menu
 * Displays smart selection summary (0: placeholder, 1-2: names, 3+: count badge).
 * Menu floats above content without resizing or pushing parent containers.
 */
export default function MultiSelectFilter({
  label,
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Chọn tất cả...',
  badgeLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(next);
  };

  // Smart Summary Label
  const renderSummary = () => {
    if (selectedValues.length === 0) {
      return <span className="text-slate-400 font-medium truncate">{placeholder}</span>;
    }
    if (selectedValues.length <= 2) {
      const names = selectedValues
        .map((val) => options.find((opt) => opt.value === val)?.label || val)
        .join(', ');
      return <span className="text-white font-semibold truncate">{names}</span>;
    }
    return (
      <span className="inline-flex items-center gap-1 text-[#8CC0EB] font-bold text-[11px] truncate">
        <span className="px-1.5 py-0.2 rounded bg-[#8CC0EB]/20 text-[#8CC0EB] font-black">
          {selectedValues.length}
        </span>
        <span>{badgeLabel || 'đã chọn'}</span>
      </span>
    );
  };

  return (
    <div className="relative w-full select-none" ref={wrapperRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
            {label}
          </label>
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Xóa ({selectedValues.length})
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 rounded-xl border flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
          isOpen
            ? 'bg-[#121824] border-[#8CC0EB] text-white shadow-md'
            : selectedValues.length > 0
            ? 'bg-[#0f1624] border-[#8CC0EB]/50 text-white'
            : 'bg-[#090d16] border-white/15 text-slate-200 hover:text-white hover:border-white/30'
        }`}
      >
        <div className="flex-1 min-w-0 pr-1">{renderSummary()}</div>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
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
            const isChecked = selectedValues.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-[#8CC0EB]/15 text-[#8CC0EB] font-bold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.iconUrl && (
                    <img
                      src={opt.iconUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-4 h-4 object-contain shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {opt.iconComponent && (
                    <span className="shrink-0">{opt.iconComponent}</span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>

                {/* Checkbox indicator */}
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                    isChecked
                      ? 'bg-[#8CC0EB] border-[#8CC0EB]'
                      : 'border-white/30 bg-[#070a10]'
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-2.5 h-2.5 text-[#07090e]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3.5}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

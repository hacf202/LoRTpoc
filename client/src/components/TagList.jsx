import React from 'react';

/**
 * Reusable Filter / Quick Tag List
 */
export default function TagList({ tags = [], selectedTag = '', onSelectTag, className = '' }) {
  if (!tags.length) return null;

  return (
    <div className={`flex items-center justify-center flex-wrap gap-2 mt-4 ${className}`}>
      {tags.map((tag) => {
        const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[#8CC0EB]/20 border border-[#8CC0EB]/50 text-[#8CC0EB]'
                : 'bg-[#121826]/50 border border-white/10 text-slate-400 hover:bg-[#8CC0EB]/15 hover:border-[#8CC0EB]/40 hover:text-white hover:-translate-y-0.5'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

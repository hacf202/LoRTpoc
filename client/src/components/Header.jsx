import React from 'react';

/**
 * Reusable Header Bar
 */
export default function Header({ onLogoClick, title = '', icon = null }) {
  return (
    <header className="relative z-10 w-full px-6 md:px-12 py-6 flex items-center justify-between">
      <div
        onClick={onLogoClick}
        className="flex items-center cursor-pointer select-none group"
      >
        <img
          src="/logo.webp"
          alt="Logo"
          className="w-8 h-8 object-contain transition-transform group-hover:scale-105 drop-shadow-[0_0_12px_rgba(140,192,235,0.35)]"
        />
        {title && (
          <span className="ml-2.5 text-sm font-bold uppercase tracking-wider text-white/90 group-hover:text-white transition-colors">
            {title}
          </span>
        )}
      </div>
    </header>
  );
}

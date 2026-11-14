import React, { useState } from 'react';
import LorMarkup from './LorMarkup';
import { useLanguage } from '../context/LanguageContext';

/**
 * Universal Entity Card for Relics, Items, Powers, Cards, and Maps
 * Displays authentic data artwork, rarity glow, metadata badges, and rich formatted text.
 */
export default function EntityCard({ item, type = 'relic', onClick }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [imgError, setImgError] = useState(false);

  if (!item) return null;

  // Extract common fields (only current localized name)
  const name =
    (isEn ? (item.translations?.en?.adventureName || item.translations?.en?.name) : (item.adventureName || item.name)) ||
    item.name ||
    item.adventureName ||
    item.cardName ||
    'Không tên';

  const rawRarity = (item.rarity || item.translations?.en?.rarity || '').toLowerCase();
  
  // Normalize rarity category with high-contrast, clean solid styling (no colored borders)
  let rarityStyle = {
    badge: 'bg-[#1a202c] text-slate-300 border-white/15',
    label: isEn ? 'Common' : 'Thường'
  };

  if (rawRarity.includes('rare') || rawRarity.includes('hiếm')) {
    rarityStyle = {
      badge: 'bg-[#0b2545] text-sky-200 border-white/15',
      label: isEn ? 'Rare' : 'Hiếm'
    };
  } else if (rawRarity.includes('epic') || rawRarity.includes('sử thi') || rawRarity.includes('su thi')) {
    rarityStyle = {
      badge: 'bg-[#2d114d] text-purple-200 border-white/15',
      label: isEn ? 'Epic' : 'Sử Thi'
    };
  } else if (rawRarity.includes('champion') || rawRarity.includes('anh hùng') || rawRarity.includes('anh hung') || rawRarity.includes('tướng')) {
    rarityStyle = {
      badge: 'bg-[#452600] text-amber-200 border-white/15',
      label: isEn ? 'Champion' : 'Anh Hùng'
    };
  } else if (rawRarity.includes('legendary') || rawRarity.includes('huyền thoại')) {
    rarityStyle = {
      badge: 'bg-[#452600] text-amber-200 border-white/15',
      label: isEn ? 'Legendary' : 'Huyền Thoại'
    };
  } else if (rawRarity.includes('special') || rawRarity.includes('đặc biệt') || rawRarity.includes('dac biet')) {
    rarityStyle = {
      badge: 'bg-[#4c0519] text-rose-200 border-white/15',
      label: isEn ? 'Special' : 'Đặc Biệt'
    };
  }

  // Determine image URL
  const imageUrl =
    item.image ||
    item.assetAbsolutePath ||
    item.assetFullAbsolutePath ||
    item.gameAbsolutePath ||
    item.background ||
    item.assets?.[0]?.avatar;

  // Format description
  const description =
    (isEn
      ? item.translations?.en?.descriptionRaw || item.translations?.en?.description
      : item.descriptionRaw || item.description) ||
    item.requirement ||
    '';

  return (
    <div
      onClick={() => onClick?.(item)}
      className="group relative flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl bg-[#0e1320] hover:bg-[#141b2b] border border-white/10 hover:border-white/25 shadow-md hover:shadow-xl transition-all duration-200 ease-out cursor-pointer hover:-translate-y-1 select-none"
    >
      {/* Entity Icon / Artwork */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-108">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
            LoR
          </div>
        )}
      </div>

      {/* Name & Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {type === 'map' ? (
            <>
              {item.typeAdventure && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-[#121929] text-sky-200 border-sky-500/30">
                  {item.typeAdventure}
                </span>
              )}
              {item.difficulty !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#452600] text-amber-200 border border-amber-500/30 rounded-md">
                  ★ {item.difficulty}
                </span>
              )}
              {Array.isArray(item.Bosses) && item.Bosses.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#161d2d] text-slate-300 border border-white/10 rounded-md">
                  {item.Bosses.length} {isEn ? 'Bosses' : 'Trùm'}
                </span>
              )}
            </>
          ) : (
            <>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${rarityStyle.badge}`}>
                {rarityStyle.label}
              </span>
              {item.cost !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#0b2545] text-sky-200 border border-white/15 rounded-md">
                  {item.cost} Mana
                </span>
              )}
              {item.difficulty !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#452600] text-amber-200 border border-white/15 rounded-md">
                  {item.difficulty}★
                </span>
              )}
            </>
          )}
        </div>

        <h3 className="text-xs sm:text-sm font-bold font-heading text-white group-hover:text-[#8CC0EB] transition-colors duration-200 truncate">
          {name}
        </h3>
      </div>

      {/* Single Detailed Tooltip on Hover (Desktop) */}
      {description && (
        <div className="hidden sm:block absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 max-w-xs p-3 rounded-xl bg-[#070a10]/95 backdrop-blur-md border border-[#8CC0EB]/40 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100">
          <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1 border-b border-white/10">
            <span className="text-xs font-bold text-white font-heading truncate">
              {name}
            </span>
            <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded border ${rarityStyle.badge}`}>
              {rarityStyle.label}
            </span>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed font-sans">
            <LorMarkup text={description} />
          </div>
        </div>
      )}
    </div>
  );
}

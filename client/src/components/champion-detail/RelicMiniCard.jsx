import React from 'react';
import LorMarkup from '../LorMarkup';
import { getRarityBadgeStyle } from './constants';
import { handleImageError } from '../../utils/imageFallback';

/**
 * Compact Relic Card for Core Relics and Other Relic Options
 * Unified height: h-full min-h-[142px] sm:min-h-[148px]
 */
export default function RelicMiniCard({ relicCode, relicInfo, isEn, isCore, onClick }) {
  const name = (isEn ? relicInfo?.translations?.en?.name : relicInfo?.name) || relicInfo?.name || relicCode;
  const description =
    (isEn
      ? relicInfo?.translations?.en?.description || relicInfo?.translations?.en?.descriptionRaw || relicInfo?.description
      : relicInfo?.description || relicInfo?.descriptionRaw || relicInfo?.translations?.en?.description) || '';
  const rarity = (isEn ? relicInfo?.translations?.en?.rarity : relicInfo?.rarity) || relicInfo?.rarity || '';

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col justify-between p-2.5 sm:p-3 rounded-xl transition-all h-full min-h-[142px] sm:min-h-[148px] ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${
        isCore
          ? 'bg-[#090d16] border border-[#8CC0EB]/40 hover:border-[#8CC0EB] shadow-md'
          : 'bg-[#090d16] border border-white/15 hover:border-[#8CC0EB] shadow-md'
      }`}
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
            <img
              src={`https://images.lortpoc.com/relics/${relicCode}.webp`}
              alt={name}
              className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              onError={(e) => handleImageError(e, 'relic', 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png')}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                {relicCode}
              </span>
              {rarity && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getRarityBadgeStyle(rarity)}`}>
                  {rarity}
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate block mt-0.5 group-hover:text-sky-300 transition-colors" title={name}>
              {name}
            </h4>
          </div>
        </div>

        {description && (
          <div className="mt-2 pt-1.5 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed font-sans flex-1">
            <LorMarkup text={description} />
          </div>
        )}
      </div>
    </div>
  );
}

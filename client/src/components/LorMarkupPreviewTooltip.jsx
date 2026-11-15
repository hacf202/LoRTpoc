import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { getEntityPreview, getCachedEntityPreview } from '../utils/entityPreviewService';
import { formatKeywordEn } from '../utils/lorMarkupParser';
import { handleImageError } from '../utils/imageFallback';

const TYPE_CONFIG = {
  cd: { label: 'Thẻ Bài', labelEn: 'Card', color: 'text-sky-400' },
  p: { label: 'Sức Mạnh', labelEn: 'Power', color: 'text-orange-400' },
  r: { label: 'Cổ Vật', labelEn: 'Relic', color: 'text-cyan-400' },
  i: { label: 'Vật Phẩm', labelEn: 'Item', color: 'text-teal-400' },
  c: { label: 'Tướng', labelEn: 'Champion', color: 'text-indigo-400' },
  m: { label: 'Bản Đồ', labelEn: 'Map', color: 'text-emerald-400' },
  k: { label: 'Từ Khóa', labelEn: 'Keyword', color: 'text-amber-400' }
};

export default function LorMarkupPreviewTooltip({ token, position }) {
  if (!token || !position) return null;

  const { language } = useLanguage();
  const isEn = language === 'en';

  const tagType = (token.tagType || '').toLowerCase();
  const config = TYPE_CONFIG[tagType] || TYPE_CONFIG.k;
  const typeLabel = isEn ? (config.labelEn || config.label) : config.label;

  const [entityData, setEntityData] = useState(() => getCachedEntityPreview(tagType, token.id));

  useEffect(() => {
    let isMounted = true;
    const cached = getCachedEntityPreview(tagType, token.id);
    if (cached) {
      setEntityData(cached);
      return;
    }

    getEntityPreview(tagType, token.id, token.label).then((res) => {
      if (isMounted) {
        setEntityData(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tagType, token.id, token.label]);

  // Hiển thị duy nhất một tên theo ngôn ngữ đang chọn
  let displayName = '';
  if (tagType === 'k') {
    displayName = isEn ? formatKeywordEn(token.id) : (token.label || token.id);
  } else if (isEn) {
    displayName = entityData?.nameEn || entityData?.name || token.label || token.id;
  } else {
    displayName = entityData?.name || entityData?.nameEn || token.label || token.id;
  }

  const image = entityData?.image;

  const tooltipContent = (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 99999
      }}
      className="pointer-events-none transition-opacity duration-150 animate-fadeIn"
    >
      <div className="w-60 sm:w-64 bg-[#0a0f1d]/95 backdrop-blur-md border border-white/15 rounded-xl shadow-xl shadow-black/80 overflow-hidden p-1.5 sm:p-2 text-slate-200">
        <div className="flex items-center gap-2.5">
          {/* Ảnh thu nhỏ tinh gọn */}
          <div
            className={`${
              tagType === 'cd' ? 'w-13 h-19 sm:w-14 sm:h-20' : 'w-11 h-11'
            } rounded-lg bg-black/60 border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden`}
          >
            {image ? (
              <img
                src={image}
                alt={displayName}
                className={`w-full h-full ${tagType === 'c' ? 'rounded-full object-cover' : 'object-contain'}`}
                onError={(e) => {
                  const fallbackType = tagType === 'c' ? 'champion' : tagType === 'r' ? 'relic' : tagType === 'p' ? 'power' : tagType === 'i' ? 'item' : tagType === 'cd' ? 'card' : 'default';
                  handleImageError(e, fallbackType);
                }}
              />
            ) : (
              <span className="text-[10px] font-mono text-slate-400 uppercase">{tagType}</span>
            )}
          </div>

          {/* Thông tin cốt lõi duy nhất theo ngôn ngữ hiện tại */}
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-bold text-xs sm:text-sm text-white truncate leading-tight">
              {displayName}
            </h4>

            {/* Micro badges: Loại, Mana/Tier, Độ hiếm */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px]">
              <span className={`font-semibold ${config.color}`}>
                {typeLabel}
              </span>
              {entityData?.cost !== null && entityData?.cost !== undefined && (
                <span className="font-mono text-sky-300 font-bold bg-sky-950/60 border border-sky-800/40 px-1 py-0.2 rounded">
                  {entityData.cost} Mana
                </span>
              )}
              {entityData?.tier && (
                <span className="text-amber-300 font-bold">
                  • Tier {entityData.tier}
                </span>
              )}
              {entityData?.rarity && (
                <span className="text-slate-400 truncate">
                  • {entityData.rarity}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(tooltipContent, document.body);
}

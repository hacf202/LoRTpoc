import React, { useEffect } from 'react';
import LorMarkup from './LorMarkup';
import { useLanguage } from '../context/LanguageContext';

/**
 * Universal Entity Detail Modal
 * Detailed inspection popup for Relics, Items, Powers, Cards, and Maps.
 */
export default function EntityDetailModal({ item, type = 'relic', onClose }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const name = (isEn ? item.translations?.en?.name : item.name) || item.name || item.adventureName || item.cardName || 'Chi tiết';
  const subName = isEn ? item.name : item.translations?.en?.name || item.translations?.en?.adventureName;

  const rawRarity = (item.rarity || item.translations?.en?.rarity || '').toLowerCase();
  let rarityBadge = 'bg-slate-800 text-slate-300 border-slate-600';
  let rarityLabel = isEn ? 'Common' : 'Thường';

  if (rawRarity.includes('rare') || rawRarity.includes('hiếm')) {
    rarityBadge = 'bg-blue-950 text-blue-300 border-blue-500';
    rarityLabel = isEn ? 'Rare' : 'Hiếm';
  } else if (rawRarity.includes('epic') || rawRarity.includes('sử thi') || rawRarity.includes('su thi')) {
    rarityBadge = 'bg-purple-950 text-purple-300 border-purple-500';
    rarityLabel = isEn ? 'Epic' : 'Sử Thi';
  } else if (rawRarity.includes('champion') || rawRarity.includes('anh hùng') || rawRarity.includes('anh hung') || rawRarity.includes('tướng')) {
    rarityBadge = 'bg-amber-950 text-amber-300 border-amber-500';
    rarityLabel = isEn ? 'Champion' : 'Anh Hùng';
  } else if (rawRarity.includes('legendary') || rawRarity.includes('huyền thoại')) {
    rarityBadge = 'bg-amber-950 text-amber-300 border-amber-500';
    rarityLabel = isEn ? 'Legendary' : 'Huyền Thoại';
  } else if (rawRarity.includes('special') || rawRarity.includes('đặc biệt') || rawRarity.includes('dac biet')) {
    rarityBadge = 'bg-rose-950 text-rose-300 border-rose-500';
    rarityLabel = isEn ? 'Special' : 'Đặc Biệt';
  }

  const imageUrl =
    item.image ||
    item.assetFullAbsolutePath ||
    item.assetAbsolutePath ||
    item.gameAbsolutePath ||
    item.background;

  const description =
    (isEn
      ? item.translations?.en?.descriptionRaw || item.translations?.en?.description
      : item.descriptionRaw || item.description) ||
    item.requirement ||
    '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0a0e17] border-2 border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#161f30] hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header Header Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
          {/* Big Artwork Icon */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#121927] border border-white/10 flex items-center justify-center p-2 shadow-2xl flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              />
            ) : (
              <div className="text-slate-500 font-bold">LoR</div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-2">
              <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-md border ${rarityBadge}`}>
                {rarityLabel}
              </span>
              {(item.relicCode || item.powerCode || item.itemCode || item.cardCode || item.adventureID) && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#161f30] text-slate-300 border border-white/10 rounded-md">
                  {item.relicCode || item.powerCode || item.itemCode || item.cardCode || item.adventureID}
                </span>
              )}
              {item.difficulty !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40 rounded-md">
                  {item.difficulty}★ {isEn ? 'Difficulty' : 'Độ khó'}
                </span>
              )}
              {item.cost !== undefined && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-sky-950 text-sky-300 border border-sky-500/40 rounded-md">
                  {item.cost} Mana
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              {name}
            </h2>

            {subName && subName !== name && (
              <p className="text-sm text-slate-400 italic mt-0.5">
                {subName}
              </p>
            )}
          </div>
        </div>

        {/* Description Section with LorMarkup */}
        {description && (
          <div className="mb-6 p-4 rounded-2xl bg-[#121927]/80 border border-white/10">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 font-heading">
              {isEn ? 'Effect / Rules' : 'Hiệu Ứng / Luật Đấu'}
            </h4>
            <div className="text-sm text-slate-200 leading-relaxed font-sans">
              <LorMarkup text={description} />
            </div>
          </div>
        )}

        {/* Detailed Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {item.stack && (
            <div className="p-3 rounded-xl bg-[#121927]/60 border border-white/5">
              <span className="text-slate-400 block mb-1 font-semibold">{isEn ? 'Max Stack' : 'Số lượng cộng dồn'}</span>
              <span className="text-white font-bold">{item.stack}</span>
            </div>
          )}

          {item.source && (
            <div className="p-3 rounded-xl bg-[#121927]/60 border border-white/5">
              <span className="text-slate-400 block mb-1 font-semibold">{isEn ? 'Unlock Source' : 'Cách sở hữu'}</span>
              <span className="text-amber-300 font-bold">{item.source}</span>
            </div>
          )}

          {item.requirements && (
            <div className="p-3 rounded-xl bg-[#121927]/60 border border-white/5 col-span-full">
              <span className="text-slate-400 block mb-1 font-semibold">{isEn ? 'Requirements' : 'Yêu cầu gắn'}</span>
              <span className="text-slate-200">{item.requirements}</span>
            </div>
          )}

          {item.regions && item.regions.length > 0 && (
            <div className="p-3 rounded-xl bg-[#121927]/60 border border-white/5">
              <span className="text-slate-400 block mb-1 font-semibold">{isEn ? 'Regions' : 'Khu vực'}</span>
              <span className="text-white font-bold">{item.regions.join(', ')}</span>
            </div>
          )}

          {item.championXP && (
            <div className="p-3 rounded-xl bg-[#121927]/60 border border-white/5">
              <span className="text-slate-400 block mb-1 font-semibold">{isEn ? 'Champion XP' : 'Kinh nghiệm Tướng'}</span>
              <span className="text-emerald-400 font-bold font-mono">+{item.championXP} XP</span>
            </div>
          )}
        </div>

        {/* Special Adventure Rules (for Maps) */}
        {item.specialRules && item.specialRules.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-2 font-heading">
              {isEn ? 'Special Adventure Rules' : 'Quy Tắc Đặc Biệt'}
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {item.specialRules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span><LorMarkup text={typeof rule === 'string' ? rule : rule.description || ''} /></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

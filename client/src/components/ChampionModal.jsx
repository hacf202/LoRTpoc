import React, { useEffect, useState } from 'react';
import ChampionElementsDetail from './ChampionElementsDetail';
import { useLanguage } from '../context/LanguageContext';

/**
 * Universal Champion Elements Detail Modal
 * Houses the dedicated ChampionElementsDetail component with hierarchical breadcrumbs and direct link sharing.
 */
export default function ChampionModal({ champion, onClose, onNavigate }) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!champion) return null;

  const displayName = isEn && champion.translations?.en?.name
    ? champion.translations.en.name
    : champion.name;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-1 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#0a0e17] border sm:border-2 border-white/20 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] overflow-y-auto p-2 sm:p-7 shadow-[0_30px_80px_rgba(0,0,0,0.95)] custom-scrollbar [scrollbar-gutter:stable]"
      >
        {/* Top Control Bar: Breadcrumb & Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-4 mb-2 sm:mb-4 border-b border-white/10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 overflow-x-auto">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('home');
                else onClose?.();
              }}
              className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {isEn ? 'Home' : 'Trang chủ'}
            </a>
            <span className="text-slate-600">/</span>
            <a
              href="/champions"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('champions');
                else onClose?.();
              }}
              className="hover:text-white transition-colors cursor-pointer whitespace-nowrap text-[#8CC0EB]"
            >
              {isEn ? 'Champions' : 'Tướng'}
            </a>
            <span className="text-slate-600">/</span>
            <span className="text-white font-bold truncate max-w-[120px] sm:max-w-[200px]">
              {displayName}
            </span>
          </nav>

          {/* Action Buttons: Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Back to Champions Button */}
            <button
              type="button"
              onClick={onClose}
              title={isEn ? 'Back to Champions' : 'Quay lại danh sách'}
              aria-label={isEn ? 'Back to Champions' : 'Quay lại danh sách'}
              className="w-8 h-8 rounded-full bg-[#121929] hover:bg-[#1a243a] border border-[#8CC0EB]/40 hover:border-[#8CC0EB] text-[#8CC0EB] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md group"
            >
              <svg className="w-4 h-4 transform transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Close (X) Icon Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#141b29] hover:bg-rose-950/80 border border-white/15 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer shadow-md"
              aria-label={t('championModal.close')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dedicated Champion Elements Component */}
        <ChampionElementsDetail champion={champion} />
      </div>
    </div>
  );
}

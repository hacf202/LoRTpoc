import React from 'react';
import ChampionElementsDetail from '../components/ChampionElementsDetail';
import { useLanguage } from '../context/LanguageContext';

/**
 * Dedicated Full-Page Champion Detail View (/champion/:name)
 * Replaces popup modal with a world-class, responsive, immersive guide page.
 */
export default function ChampionDetailView({
  champion,
  loading = false,
  onBack,
  onNavigate,
  currentHash,
  onHashChange,
  onSelectRelic,
  onSelectPower,
  onSelectItem,
  onSelectCard
}) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  // Localized champion name
  const displayName = isEn && champion?.translations?.en?.name
    ? champion.translations.en.name
    : champion?.name || '';

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 py-2 sm:py-8">
        {/* 1. Top Bar: Back Button & Minimal Breadcrumb */}
        <div className="flex items-center justify-between pb-3 mb-4 sm:mb-6 border-b border-white/10 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              title={isEn ? 'Back to Champions List' : 'Quay lại danh sách tướng'}
              aria-label={isEn ? 'Back to Champions List' : 'Quay lại danh sách tướng'}
              className="w-9 h-9 rounded-xl bg-[#121929] hover:bg-[#1a243a] border border-[#8CC0EB]/40 hover:border-[#8CC0EB] text-[#8CC0EB] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md group"
            >
              <svg
                className="w-4 h-4 transform transition-transform group-hover:-translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>

            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <a
                href="/champions"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate ? onNavigate('champions') : onBack?.();
                }}
                className="hover:text-white transition-colors cursor-pointer text-[#8CC0EB]"
              >
                {isEn ? 'Champions List' : 'Danh Sách Tướng'}
              </a>
              {displayName && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[360px]">
                    {displayName}
                  </span>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* 2. Main Detail Content */}
        {loading && !champion ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-10 h-10 border-3 border-[#8CC0EB] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-400">
              {t('hero.searching') || 'Đang tải dữ liệu vị tướng...'}
            </span>
          </div>
        ) : champion ? (
          <ChampionElementsDetail
            champion={champion}
            currentHash={currentHash}
            onHashChange={onHashChange}
            onSelectRelic={onSelectRelic}
            onSelectPower={onSelectPower}
            onSelectItem={onSelectItem}
            onSelectCard={onSelectCard}
          />
        ) : (
          <div className="py-24 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              {isEn ? 'Champion Not Found' : 'Không tìm thấy vị tướng này'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {isEn
                ? 'The requested champion data could not be located.'
                : 'Dữ liệu vị tướng có thể đã bị di chuyển hoặc đổi tên.'}
            </p>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-[#8CC0EB] text-[#07090e] font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-[#BFDDF0] transition-colors"
            >
              {isEn ? 'Back to Champions' : 'Quay lại danh sách'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

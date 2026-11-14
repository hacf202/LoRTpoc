import React from 'react';
import LorMarkup from '../LorMarkup';

export default function ChampionStrategyTab({ champion, ratings, isEn }) {
  const playstyleGuide = isEn
    ? (champion.translations?.en?.ratings?.playstyleNote || champion.translations?.en?.description || champion.translations?.en?.descriptionRaw || ratings?.playstyleNote || champion.description)
    : (ratings?.playstyleNote || champion.description);

  if (!playstyleGuide) {
    return (
      <div id="strategy" className="p-4 sm:p-6 text-center text-xs sm:text-sm text-slate-400 bg-[#0e1320] rounded-xl sm:rounded-2xl border border-white/15">
        {isEn ? 'No operational guide recorded.' : 'Chưa có thông tin vận hành cho tướng này.'}
      </div>
    );
  }

  return (
    <div id="strategy" className="space-y-4 sm:space-y-6">
      <div className="p-2 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/15 sm:border-2 shadow-xl space-y-3">
        <h3 className="text-sm sm:text-base font-bold font-heading text-white border-b border-white/10 pb-2.5 sm:pb-3">
          {isEn ? 'Strategy & Playstyle' : 'Cách Vận Hành'}
        </h3>
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
          <LorMarkup text={playstyleGuide} />
        </div>
      </div>
    </div>
  );
}

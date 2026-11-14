import React, { useState } from 'react';
import LorMarkup from '../LorMarkup';
import ConstellationMap from '../ConstellationMap';

export default function ChampionConstellationTab({
  champion,
  starPowers,
  bonusStars,
  isEn,
  navigateTo
}) {
  const [constellationView, setConstellationView] = useState('map');

  return (
    <div id="constellation" className="p-2 sm:p-7 rounded-xl sm:rounded-2xl bg-[#0e1320] border border-white/15 sm:border-2 shadow-2xl space-y-3 sm:space-y-6">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-5 border-b border-white/10 gap-2 sm:gap-4">
        <h3 className="text-sm sm:text-xl font-bold font-heading text-[#FFF9D2] leading-tight">
          {isEn ? `${champion.name}'s Constellation` : `Chòm Sao Của ${champion.name}`}
        </h3>

        {/* View Mode Toggle: Bản Đồ Sao / Danh Sách Chi Tiết */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-[#070a10] border border-white/15 shrink-0 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setConstellationView('map')}
            className={`px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              constellationView === 'map'
                ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEn ? 'Star Map' : 'Bản Đồ Sao'}
          </button>
          <button
            type="button"
            onClick={() => setConstellationView('list')}
            className={`px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              constellationView === 'list'
                ? 'bg-[#8CC0EB] text-[#07090e] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEn ? 'Node List' : 'Danh Sách Nút'}
          </button>
        </div>
      </div>

      {/* View Mode 1: Interactive Constellation Map */}
      {constellationView === 'map' && (
        <div>
          <ConstellationMap
            constellation={champion.constellation}
            championName={champion.name}
            onSelectPower={(pCode) => navigateTo('power', pCode)}
          />
        </div>
      )}

      {/* View Mode 2: Detailed List Breakdown */}
      {constellationView === 'list' && (
        <div className="space-y-3 sm:space-y-6">
          {/* Group 1: Star Powers (1★ to 6★) */}
          <div className="space-y-2 sm:space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
              {starPowers.map((node, idx) => {
                const starIndex = node.nodeID === 'n1' ? 1
                  : node.nodeID === 'n2' ? 2
                  : node.nodeID === 'n3' ? 3
                  : node.nodeID === 'n4' ? 4
                  : node.nodeID === 'n5' ? 5
                  : node.nodeID === 'n6' ? 6
                  : (idx + 1);

                const nodeName = (isEn ? node.translations?.en?.name : node.name) || node.name || node.powerCode || `Star Power ${starIndex}`;
                const nodeDesc = (isEn
                  ? (node.translations?.en?.description || node.translations?.en?.descriptionRaw)
                  : (node.description || node.descriptionRaw)) || '';
                const nodeImage = node.image || (node.powerCode ? `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${node.powerCode}.png` : null) || 'https://images.lortpoc.com/icon/starIcon.webp';
                const rarity = (isEn ? node.translations?.en?.rarity : node.rarity) || node.rarity;

                return (
                  <div
                    key={node.nodeID || idx}
                    onClick={() => node.powerCode && navigateTo('power', node.powerCode)}
                    className={`flex flex-col justify-between p-2 sm:p-5 rounded-xl sm:rounded-2xl bg-[#090d16] border border-white/10 hover:border-[#8CC0EB]/50 transition-all shadow-lg space-y-2 sm:space-y-3 ${
                      node.powerCode ? 'cursor-pointer hover:-translate-y-0.5' : ''
                    }`}
                  >
                    {/* Top Row: Star Badge, Title, Rarity & Recommended */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-black bg-amber-400 text-black shrink-0 shadow-sm">
                          {starIndex}★
                        </span>
                        <h5 className="text-xs sm:text-base font-bold font-heading text-[#FFF9D2] truncate" title={nodeName}>
                          {nodeName}
                        </h5>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {rarity && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-sky-950/70 border border-sky-500/40 text-sky-200">
                            {rarity}
                          </span>
                        )}
                        {node.isRecommended && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                            {isEn ? 'Core' : 'Ưu tiên'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Power Artwork + Detailed LorMarkup description */}
                    <div className="flex items-start gap-2 sm:gap-3.5 pt-1">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={nodeImage}
                          alt={nodeName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.lortpoc.com/icon/starIcon.webp';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                        {nodeDesc ? (
                          <LorMarkup text={nodeDesc} />
                        ) : (
                          <span className="italic text-slate-500">{isEn ? 'No description available.' : 'Chưa có mô tả chi tiết.'}</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Cost Requirements */}
                    <div className="flex items-center gap-1 sm:gap-1.5 pt-2 sm:pt-2.5 border-t border-white/10 text-xs flex-wrap">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">{isEn ? 'Cost:' : 'Yêu cầu:'}</span>
                      {node.requirements && node.requirements.length > 0 ? (
                        node.requirements.map((req, rIdx) => {
                          const reqLabel = req.type === 'Fragment' ? (isEn ? 'Fragment' : 'Mảnh tướng')
                            : req.type === 'Gemstone' ? (isEn ? 'Gemstone' : 'Ngọc bổ trợ')
                            : req.type === 'Star Crystal' ? (isEn ? 'Star Crystal' : 'Tinh thể sao')
                            : req.type === 'Nova Crystal' ? (isEn ? 'Nova Crystal' : 'Tinh thể siêu tân tinh')
                            : req.type;
                          return (
                            <span key={rIdx} className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-[#141b2a] text-[#FFEBCC] border border-amber-500/25">
                              {req.value} {reqLabel}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] sm:text-[11px] text-slate-500">{isEn ? 'Free / Inherent' : 'Mặc định'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Bonus Stars & Gem Upgrades */}
          {bonusStars.length > 0 && (
            <div className="space-y-2.5 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 sm:pb-2">
                <h4 className="text-xs sm:text-base font-bold font-heading text-sky-300">
                  {isEn ? 'Bonus Stars & Special Upgrades' : 'Sao Bổ Trợ & Nâng Cấp Đặc Biệt'}
                </h4>
                <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  {bonusStars.length} {isEn ? 'nodes' : 'nhánh'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {bonusStars.map((node, bIdx) => {
                  const bName = (isEn ? node.translations?.en?.name : node.name) || node.name || `Upgrade #${bIdx + 1}`;
                  const bDesc = (isEn
                    ? (node.translations?.en?.description || node.translations?.en?.descriptionRaw)
                    : (node.description || node.descriptionRaw)) || '';
                  const bImage = node.image || (node.powerCode ? `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${node.powerCode}.png` : null) || 'https://images.lortpoc.com/icon/starIcon.webp';

                  return (
                    <div
                      key={node.nodeID || bIdx}
                      onClick={() => node.powerCode && navigateTo('power', node.powerCode)}
                      className={`flex flex-col justify-between p-2 sm:p-3 rounded-xl bg-[#080d16] border border-white/10 hover:border-sky-400/40 transition-all shadow-md space-y-2 ${
                        node.powerCode ? 'cursor-pointer hover:-translate-y-0.5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#04060a] border border-white/15 p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={bImage}
                            alt={bName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.lortpoc.com/icon/starIcon.webp';
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h6 className="text-xs sm:text-sm font-bold text-white truncate" title={bName}>
                            {bName}
                          </h6>
                          <div className="text-[11px] text-slate-300 mt-1 line-clamp-3 leading-snug">
                            {bDesc ? <LorMarkup text={bDesc} /> : <span className="italic text-slate-500">Chưa có mô tả</span>}
                          </div>
                        </div>
                      </div>

                      {/* Requirements */}
                      {node.requirements && node.requirements.length > 0 && (
                        <div className="pt-2 border-t border-white/5 flex items-center gap-1 flex-wrap text-[10px]">
                          {node.requirements.map((req, rIdx) => (
                            <span key={rIdx} className="px-1.5 py-0.5 rounded bg-[#101726] text-amber-200 border border-amber-500/20 font-mono">
                              {req.value} {req.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

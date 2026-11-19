import React, { useRef, useState, useCallback, useEffect } from 'react';
import LorMarkup from '../LorMarkup';
import RelicMiniCard from './RelicMiniCard';
import { getRarityBadgeStyle } from './constants';
import { handleImageError } from '../../utils/imageFallback';

export default function ChampionRelicBuildsTab({
  champion,
  suitableData,
  relicSets,
  activeBuildIndex,
  setActiveBuildIndex,
  relicMap,
  isEn,
  navigateTo,
  otherRelicOptions
}) {
  // Horizontal scroll state for builds sub-pills
  const buildsRef = useRef(null);
  const [canScrollBuildsLeft, setCanScrollBuildsLeft] = useState(false);
  const [canScrollBuildsRight, setCanScrollBuildsRight] = useState(false);

  const checkBuildsScroll = useCallback(() => {
    const el = buildsRef.current;
    if (!el) return;
    setCanScrollBuildsLeft(el.scrollLeft > 6);
    setCanScrollBuildsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkBuildsScroll();
    window.addEventListener('resize', checkBuildsScroll);
    return () => window.removeEventListener('resize', checkBuildsScroll);
  }, [checkBuildsScroll, relicSets.length]);

  const scrollBuilds = (delta) => {
    buildsRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const rawCurrentBuild = relicSets[activeBuildIndex] || relicSets[0];
  const currentBuild = rawCurrentBuild
    ? Array.isArray(rawCurrentBuild)
      ? { items: rawCurrentBuild, title: `Bộ ${activeBuildIndex + 1}` }
      : rawCurrentBuild
    : null;

  return (
    <div id="relics" className="flex flex-col gap-6">
      {/* 1. Suitable Relics Section (Các Cổ Vật Phù Hợp - Dạng Sơ Đồ Cây A + B or | + C / + D) */}
      {(suitableData.mandatory.length > 0 || suitableData.options.length > 0) && (() => {
        const mandatoryCount = suitableData.mandatory.length;
        const maxOptionItems = suitableData.options.length > 0
          ? Math.max(...suitableData.options.map((opt) => opt.length), 1)
          : 0;
        const hasBoth = mandatoryCount > 0 && suitableData.options.length > 0;
        const totalColumns = mandatoryCount + maxOptionItems;

        return (
          <div className="p-2 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border-2 border-[#8CC0EB]/35 shadow-xl space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/10 flex-wrap gap-2">
              <h3 className="text-base sm:text-lg font-bold font-heading text-[#FFF9D2]">
                {isEn ? 'Suitable Relics' : 'Các Cổ Vật Phù Hợp'}
              </h3>
              {hasBoth && (
                <span className="text-[11px] sm:text-xs text-sky-300/80 font-sans hidden sm:inline-block">
                  {isEn ? 'Core Relics + Situational Options' : 'Cổ vật cốt lõi + Nhánh tùy chọn'}
                </span>
              )}
            </div>

            {/* --- MOBILE VIEW: Sơ đồ cây phân nhánh tối giản - Chỉ hiển thị Icon, không chữ --- */}
            <div className="sm:hidden w-full overflow-x-auto py-2">
              <div className="flex items-center justify-center min-w-fit mx-auto gap-0 px-2 select-none">
                {/* 1. Vế trái: Cổ vật cố định bắt buộc (Mandatory) */}
                {suitableData.mandatory.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0 pr-1">
                    {suitableData.mandatory.map((code, idx) => {
                      const item = relicMap[code];
                      const relicName =
                        (isEn ? item?.translations?.en?.name : item?.name) || item?.name || code;
                      return (
                        <React.Fragment key={code}>
                          {idx > 0 && (
                            <span className="text-base font-black text-[#8CC0EB] px-0.5 select-none">
                              +
                            </span>
                          )}
                          <div
                            onClick={() => navigateTo('relic', code)}
                            title={relicName}
                            className="group relative flex items-center justify-center w-12 h-12 p-0.5 cursor-pointer active:scale-95 transition-all shrink-0 bg-[#090d16] rounded-lg border border-[#8CC0EB]/40 shadow-sm"
                          >
                            <img
                              src={`https://images.lortpoc.com/relics/${code}.webp`}
                              alt={relicName}
                              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform"
                              onError={(e) => handleImageError(e, 'relic')}
                            />
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* 2. Đường kẻ ngang nối từ vế trái sang trục dọc */}
                {hasBoth && (
                  <div className="w-5 h-0.5 bg-sky-400/60 shrink-0" />
                )}

                {/* 3. Vế phải: Trục dọc và các nhánh tùy chọn (Options) */}
                {suitableData.options.length > 0 && (
                  <div className="flex flex-col justify-center gap-2.5 relative py-1 shrink-0">
                    {suitableData.options.map((optItems, optIdx) => {
                      const isFirst = optIdx === 0;
                      const isLast = optIdx === suitableData.options.length - 1;
                      const isSingle = suitableData.options.length === 1;

                      return (
                        <div
                          key={optIdx}
                          className="relative flex items-center gap-2 pl-4 sm:pl-6 group"
                        >
                          {/* Trục dọc: Chỉ nối từ tâm hàng đầu tiên đến tâm hàng cuối cùng */}
                          {!isSingle && isFirst && (
                            <div className="absolute left-0 top-1/2 -bottom-2.5 w-0.5 bg-sky-400/60" />
                          )}
                          {!isSingle && isLast && (
                            <div className="absolute left-0 top-0 bottom-1/2 w-0.5 bg-sky-400/60" />
                          )}
                          {!isSingle && !isFirst && !isLast && (
                            <div className="absolute left-0 top-0 -bottom-2.5 w-0.5 bg-sky-400/60" />
                          )}

                          {/* Nhánh ngang nối từ trục dọc vào hàng icon */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 sm:w-6 h-0.5 bg-sky-400/60 group-hover:bg-sky-400 transition-colors" />

                          {/* Danh sách icon trong nhánh này */}
                          <div className="flex items-center gap-2">
                            {optItems.map((code, sIdx) => {
                              const item = relicMap[code];
                              const relicName =
                                (isEn ? item?.translations?.en?.name : item?.name) || item?.name || code;
                              return (
                                <React.Fragment key={code}>
                                  {sIdx > 0 && (
                                    <span className="text-sm font-black text-sky-400 px-0.5 select-none shrink-0">
                                      +
                                    </span>
                                  )}
                                  <div
                                    onClick={() => navigateTo('relic', code)}
                                    title={relicName}
                                    className="group/item relative flex items-center justify-center w-12 h-12 p-0.5 cursor-pointer active:scale-95 transition-all shrink-0 bg-[#090d16] rounded-lg border border-white/20 shadow-sm"
                                  >
                                    <img
                                      src={`https://images.lortpoc.com/relics/${code}.webp`}
                                      alt={relicName}
                                      className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] group-hover/item:scale-110 transition-transform"
                                      onError={(e) => handleImageError(e, 'relic', 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png')}
                                    />
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* --- DESKTOP & TABLET VIEW: Sơ đồ rẽ nhánh chuẩn mực, co giãn linh hoạt (Flexible Balanced Tree) --- */}
            <div className="hidden sm:block w-full overflow-x-auto no-scrollbar py-1">
              <div
                className="flex items-stretch gap-0 w-full"
                style={{
                  minWidth: hasBoth ? `${Math.max(totalColumns * 250 + 40, 680)}px` : '100%'
                }}
              >
                {/* 1. Vế trái: Cổ vật cố định bắt buộc (Mandatory) */}
                {mandatoryCount > 0 && (
                  <div
                    className="flex items-center gap-2.5 lg:gap-3 self-center"
                    style={{
                      flex: hasBoth ? `${mandatoryCount} 1 0%` : '1 1 0%'
                    }}
                  >
                    {suitableData.mandatory.map((code, idx) => (
                      <React.Fragment key={code}>
                        {idx > 0 && (
                          <span className="text-lg lg:text-xl font-black text-[#8CC0EB] text-center select-none shrink-0 px-0.5">
                            +
                          </span>
                        )}
                        <div className="flex-1 min-w-[200px] h-full flex flex-col justify-center">
                          <RelicMiniCard
                            relicCode={code}
                            relicInfo={relicMap[code]}
                            isEn={isEn}
                            isCore={true}
                            onClick={() => navigateTo('relic', code)}
                          />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* 2. Đường kẻ ngang nối từ vế trái sang trục dọc vế phải */}
                {hasBoth && (
                  <div className="w-6 lg:w-8 h-0.5 bg-sky-400/60 shrink-0 self-center" />
                )}

                {/* 3. Vế phải: Nhánh các tùy chọn linh hoạt (Options) */}
                {suitableData.options.length > 0 && (
                  <div
                    className="grid grid-cols-1 gap-3 relative"
                    style={{
                      flex: hasBoth ? `${maxOptionItems} 1 0%` : '1 1 0%',
                      gridTemplateRows: `repeat(${suitableData.options.length}, minmax(0, 1fr))`
                    }}
                  >
                    {suitableData.options.map((optItems, optIdx) => {
                      const isFirst = optIdx === 0;
                      const isLast = optIdx === suitableData.options.length - 1;
                      const isSingle = suitableData.options.length === 1;

                      return (
                        <div
                          key={optIdx}
                          className="relative flex items-stretch pl-6 lg:pl-8 group h-full"
                        >
                          {/* Trục dọc liền mạch không thừa: Chỉ chạy từ tâm món đầu tới tâm món cuối */}
                          {!isSingle && isFirst && (
                            <div className="absolute left-0 top-1/2 -bottom-3 w-0.5 bg-sky-400/60" />
                          )}
                          {!isSingle && isLast && (
                            <div className="absolute left-0 top-0 bottom-1/2 w-0.5 bg-sky-400/60" />
                          )}
                          {!isSingle && !isFirst && !isLast && (
                            <div className="absolute left-0 top-0 -bottom-3 w-0.5 bg-sky-400/60" />
                          )}

                          {/* Đường nhánh ngang nối trực tiếp từ trục dọc vào thẻ */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 lg:w-8 h-0.5 bg-sky-400/60 group-hover:bg-sky-400 transition-colors" />

                          {/* Hàng thẻ trong nhánh này: Co giãn đều đặn theo số lượng item */}
                          <div className="flex items-center gap-2.5 w-full h-full">
                            {optItems.map((code, sIdx) => (
                              <React.Fragment key={code}>
                                {sIdx > 0 && (
                                  <span className="text-base font-black text-sky-400 select-none shrink-0 px-0.5">
                                    +
                                  </span>
                                )}
                                <div className="flex-1 min-w-[200px] h-full">
                                  <RelicMiniCard
                                    relicCode={code}
                                    relicInfo={relicMap[code]}
                                    isEn={isEn}
                                    isCore={false}
                                    onClick={() => navigateTo('relic', code)}
                                  />
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Mô tả giải thích chiến thuật / lý do phù hợp (Hiển thị đầy đủ cả trên Mobile & PC) */}
            {suitableData.description && (
              <div className="p-2.5 sm:p-4 rounded-xl bg-[#080c14] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                <LorMarkup text={suitableData.description} />
              </div>
            )}
          </div>
        );
      })()}

      {/* 2. Other Relic Sets Section (Các Bộ Cổ Vật Khác) - NẰM Ở GIỮA */}
      <div className="p-2 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border-2 border-white/15 shadow-xl space-y-3 sm:space-y-5">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/10 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-bold font-heading text-white">
            {isEn ? 'Other Relic Builds' : 'Các Bộ Cổ Vật Khác'}
          </h3>
          {currentBuild?.recommendedStars && (
            <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#452600] text-amber-200 border border-amber-400">
              {isEn ? `Recommended: ${currentBuild.recommendedStars}★` : `Khuyên dùng: ${currentBuild.recommendedStars} Sao`}
            </span>
          )}
        </div>

        {/* Sub-selector pills for builds with Left/Right Buttons and NO scrollbar */}
        {relicSets.length > 1 && (
          <div className="relative flex items-center w-full">
            {canScrollBuildsLeft && (
              <button
                type="button"
                onClick={() => scrollBuilds(-240)}
                className="absolute left-0 z-10 w-6 h-6 flex items-center justify-center rounded-lg bg-[#0c101c] border border-white/20 text-slate-200 hover:text-white hover:border-[#8CC0EB] shadow-md cursor-pointer"
                aria-label="Scroll left"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div
              ref={buildsRef}
              onScroll={checkBuildsScroll}
              className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-0.5 py-1"
            >
              {relicSets.map((b, idx) => {
                const isSelected = activeBuildIndex === idx;
                const title = isEn ? `Build ${idx + 1}` : `Bộ ${idx + 1}`;
                const items = Array.isArray(b) ? b : (b?.items || b?.value || []);
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveBuildIndex(idx)}
                    className={`flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#0b2545] text-sky-200 border-2 border-sky-400 shadow-md shadow-sky-950/60'
                        : 'bg-[#080d16] text-slate-300 border-2 border-white/15 hover:border-[#8CC0EB]/50 hover:text-white hover:bg-[#0c1424]'
                    }`}
                  >
                    <span className="font-heading">{title}</span>
                    {items && items.length > 0 && (
                      <div className="flex items-center gap-1">
                        {items.slice(0, 3).map((relicCode, slotIdx) => {
                          const item = relicMap[relicCode];
                          const relicName = (isEn ? item?.translations?.en?.name : item?.name) || item?.name || relicCode;
                          return (
                            <div
                              key={slotIdx}
                              className="w-6 h-6 flex items-center justify-center shrink-0"
                              title={relicName}
                            >
                              <img
                                src={`https://images.lortpoc.com/relics/${relicCode}.webp`}
                                alt={relicName}
                                className="w-full h-full object-contain drop-shadow-sm"
                                onError={(e) => handleImageError(e, 'relic', 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png')}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {canScrollBuildsRight && (
              <button
                type="button"
                onClick={() => scrollBuilds(240)}
                className="absolute right-0 z-10 w-6 h-6 flex items-center justify-center rounded-lg bg-[#0c101c] border border-white/20 text-slate-200 hover:text-white hover:border-[#8CC0EB] shadow-md cursor-pointer"
                aria-label="Scroll right"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        )}

        {currentBuild ? (
          <div className="space-y-5 min-h-[220px]">
            {/* 3 Relic Slots with Real CDN artwork & Detailed Effects */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(currentBuild.items || []).map((relicCode, slotIdx) => {
                  const item = relicMap[relicCode];
                  const relicName = (isEn ? item?.translations?.en?.name : item?.name) || item?.name || relicCode;
                  const relicDesc = isEn
                    ? (item?.translations?.en?.description || item?.translations?.en?.descriptionRaw || item?.description)
                    : (item?.description || item?.descriptionRaw || item?.translations?.en?.description);
                  const rarity = isEn
                    ? (item?.translations?.en?.rarity || item?.rarity)
                    : (item?.rarity || item?.translations?.en?.rarity);

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => navigateTo('relic', relicCode)}
                      className="flex flex-col justify-between p-3 rounded-xl bg-[#090d16] border border-white/15 hover:border-[#8CC0EB] transition-all cursor-pointer hover:-translate-y-0.5 shadow-md group h-full min-h-[142px] sm:min-h-[148px]"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
                            <img
                              src={`https://images.lortpoc.com/relics/${relicCode}.webp`}
                              alt={relicName}
                              className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                              onError={(e) => handleImageError(e, 'relic', 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png')}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-mono text-slate-400 block">
                                Slot {slotIdx + 1}
                              </span>
                              {rarity && (
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300`}>
                                  {rarity}
                                </span>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-white truncate block mt-0.5 group-hover:text-sky-300 transition-colors" title={relicName}>
                              {relicName}
                            </span>
                          </div>
                        </div>

                        {relicDesc && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed font-sans">
                            <LorMarkup text={relicDesc} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Description with LorMarkup */}
            {(() => {
              const buildDesc = isEn
                ? (currentBuild.translations?.en?.description || currentBuild.translations?.en?.descriptionRaw || currentBuild.description)
                : (currentBuild.description || currentBuild.descriptionRaw || currentBuild.translations?.en?.description);
              if (!buildDesc) return null;
              return (
                <div className="p-2 sm:p-4 rounded-xl bg-[#080c14] border border-white/10">
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    <LorMarkup text={buildDesc} />
                  </div>
                </div>
              );
            })()}

            {/* Video Tutorial if available */}
            {currentBuild.videoLink && (
              <div className="pt-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-2 font-heading">
                  {isEn ? 'Gameplay Video Guide:' : 'Video Hướng Dẫn Vận Hành:'}
                </span>
                <div className="aspect-video w-full max-w-[360px] sm:max-w-[380px] rounded-xl overflow-hidden border border-white/15 bg-black shadow-lg">
                  <iframe
                    src={currentBuild.videoLink}
                    title="Video Guide"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400 bg-[#0e1320] rounded-2xl border border-white/10">
            {isEn ? 'No build loadouts recorded.' : 'Chưa có dữ liệu bộ trang bị cho tướng này.'}
          </div>
        )}
      </div>

      {/* 3. Other Relic Options Section (Tùy Chọn Cổ Vật Khác) - NẰM DƯỚI CÙNG */}
      {otherRelicOptions.length > 0 && (
        <div className="p-2 sm:p-6 rounded-xl sm:rounded-2xl bg-[#0e1320] border-2 border-white/15 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/10 flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold font-heading text-slate-200">
              {isEn ? 'Other Relic Options' : 'Tùy Chọn Cổ Vật Khác'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
            {otherRelicOptions.map((code) => (
              <RelicMiniCard
                key={code}
                relicCode={code}
                relicInfo={relicMap[code]}
                isEn={isEn}
                isCore={false}
                onClick={() => navigateTo('relic', code)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

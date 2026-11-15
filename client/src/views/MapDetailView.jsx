import React, { useState, useEffect } from 'react';
import LorMarkup from '../components/LorMarkup';
import AdventureMapVisualizer from '../components/AdventureMapVisualizer';
import ListLoadingBar from '../components/ListLoadingBar';
import DetailSkeleton from '../components/DetailSkeleton';
import SEOHead from '../components/SEOHead';
import { getMapKeywords } from '../utils/seoKeywords';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl } from '../utils/regionIcons';

// In-memory cache for map details (Rule 10)
const mapDetailCache = new Map();

const ADVENTURE_TYPE_EN = {
  'Ác Mộng': 'Nightmare Adventures',
  'Phiêu Lưu Khắp Thế Giới': 'World Adventures',
  'Người Khổng Lồ Của Runeterra': 'Titans of Runeterra',
  'Hoa Linh Lục Địa': 'Spirit Blossom',
  'Tên Cướp Runeterra': 'Rogues of Runeterra',
  'Huyền Thoại Arcane': 'Legends of Arcane'
};

export default function MapDetailView({
  mapId,
  onBack,
  onNavigateChampion,
  onNavigateTab
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [map, setMap] = useState(() => mapDetailCache.get(mapId) || null);
  const [loading, setLoading] = useState(!mapDetailCache.has(mapId));
  const [error, setError] = useState(null);

  // Section collapse/visibility toggles (matching the original project design)
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isBossesVisible, setIsBossesVisible] = useState(true);
  const [isReqVisible, setIsReqVisible] = useState(true);
  const [isRewardsVisible, setIsRewardsVisible] = useState(true);

  useEffect(() => {
    if (!mapId) return;

    let isMounted = true;

    if (mapDetailCache.has(mapId)) {
      const cached = mapDetailCache.get(mapId);
      const timer = setTimeout(() => {
        if (isMounted) {
          setMap(cached);
          setLoading(false);
        }
      }, 350);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    const fetchMap = async () => {
      const startTime = performance.now();
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/maps/${encodeURIComponent(mapId)}`);
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, 380 - elapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        if (json.success && isMounted) {
          mapDetailCache.set(mapId, json.data);
          setMap(json.data);
        } else if (isMounted) {
          setError(json.message || 'Map not found');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch map details:', err);
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMap();
    return () => {
      isMounted = false;
    };
  }, [mapId]);

  const mapName = isEn
    ? map?.translations?.en?.adventureName || map?.adventureName
    : map?.adventureName || map?.translations?.en?.adventureName;

  const adventureType = isEn
    ? (map?.translations?.en?.typeAdventure || ADVENTURE_TYPE_EN[map?.typeAdventure] || map?.typeAdventure)
    : (map?.typeAdventure || map?.translations?.en?.typeAdventure);

  const bgImage = map?.background || map?.assetAbsolutePath;

  const hasRequirements =
    (Array.isArray(map?.resolvedChampions) && map.resolvedChampions.length > 0) ||
    (Array.isArray(map?.requirement?.regions) && map.requirement.regions.length > 0);

  const hasRewards = Array.isArray(map?.rewards) && map.rewards.length > 0;

  // SEO metadata computation (Rule 1 & Rule 4)
  const mapStars = map?.difficultyStars || map?.stars || 3;
  const seoTitle = isEn
    ? `${adventureName} Adventure (${mapStars}★) - Boss Strategy & Rewards`
    : `Cuộc Phiêu Lưu ${adventureName} (${mapStars}★) - Chiến Thuật & Phần Thưởng`;

  const seoDesc = isEn
    ? `Full walkthrough for ${adventureName} (${adventureType}, ${mapStars} Stars) in The Path of Champions. Boss strategies, encounter powers, and rewards.`
    : `Cẩm nang vượt cuộc phiêu lưu ${adventureName} (${adventureType}, ${mapStars} Sao) trong Con Đường Anh Hùng. Chiến thuật diệt trùm, sức mạnh đặc biệt và phần thưởng.`;

  const seoUrl = `https://thepathofchampions.guide/map/${encodeURIComponent(mapId)}`;
  const seoKeywords = getMapKeywords(map, language);
  const seoImage = bgImage || '/assets/hero-bg.jpg';

  const seoJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isEn ? 'Home' : 'Trang Chủ',
            item: 'https://thepathofchampions.guide/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isEn ? 'Adventures' : 'Cuộc Phiêu Lưu',
            item: 'https://thepathofchampions.guide/?tab=maps'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: adventureName,
            item: seoUrl
          }
        ]
      },
      {
        '@type': 'ItemPage',
        mainEntity: {
          '@type': 'Place',
          name: adventureName,
          description: seoDesc,
          image: seoImage
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 animate-in fade-in duration-300">
      {/* Dynamic Bilingual SEO */}
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        keywords={seoKeywords}
        image={seoImage}
        url={seoUrl}
        jsonLd={seoJsonLd}
        type="article"
        lang={language}
      />
      {/* 1. Top Bar: Breadcrumbs & Back Navigation */}
      <header className="sticky top-0 z-30 bg-[#07090e]/90 backdrop-blur-md border-b border-white/10 px-2 sm:px-6 py-2 sm:py-2.5 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              title={isEn ? 'Back to Adventures List' : 'Quay lại danh sách cuộc phiêu lưu'}
              aria-label={isEn ? 'Back to Adventures List' : 'Quay lại danh sách cuộc phiêu lưu'}
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

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <a
                href="/maps"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab ? onNavigateTab('maps') : onBack?.();
                }}
                className="hover:text-white transition-colors cursor-pointer text-[#8CC0EB]"
              >
                {isEn ? 'Adventures List' : 'Danh Sách Cuộc Phiêu Lưu'}
              </a>
              {mapName && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[360px]">
                    {mapName}
                  </span>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto p-2 sm:p-5">
        {loading ? (
          <div className="space-y-4">
            <ListLoadingBar isTransitioning={true} />
            <DetailSkeleton type="map" />
          </div>
        ) : error || !map ? (
          <div className="py-20 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-2">
              {isEn ? 'Adventure Not Found' : 'Không tìm thấy cuộc phiêu lưu'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">{error || 'Data is unavailable'}</p>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase cursor-pointer"
            >
              {isEn ? 'Back to Adventures' : 'Quay lại danh sách'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ListLoadingBar isTransitioning={loading} />
            <div className={`space-y-5 sm:space-y-6 transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {/* 2. HERO SECTION (Banner with difficulty, title, XP) */}
            <section className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0e1320] shadow-2xl">
              {bgImage && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={bgImage}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover object-center opacity-30 filter blur-sm scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1320] via-[#0e1320]/80 to-transparent" />
                </div>
              )}

              <div className="relative z-10 p-3 sm:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                {/* Adventure Artwork Card */}
                {bgImage && (
                  <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-xl overflow-hidden border border-white/20 bg-black/60 shrink-0 shadow-lg">
                    <img
                      src={bgImage}
                      alt={mapName}
                      className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Adventure Info Header */}
                <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap mb-2">
                    {adventureType && (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border bg-[#121929] text-sky-200 border-sky-500/30">
                        {adventureType}
                      </span>
                    )}
                    {map.difficulty !== undefined && (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#452600] text-amber-200 border border-amber-500/40 rounded-md">
                        ★ {map.difficulty}
                      </span>
                    )}
                    {map.championXP !== undefined && (
                      <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-[#0b2545] text-sky-200 border border-white/15 rounded-md">
                        +{map.championXP.toLocaleString()} XP
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded-md">
                      ID: {map.adventureID}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading text-white tracking-wide mb-3">
                    {mapName}
                  </h1>

                  {/* Special Rules Preview if present */}
                  {Array.isArray(map.resolvedSpecialRules) && map.resolvedSpecialRules.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                        <span>{isEn ? 'Special Rules' : 'Luật Đặc Biệt'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {map.resolvedSpecialRules.map((rule, idx) => {
                          const rName = isEn
                            ? rule.translations?.en?.name || rule.name
                            : rule.name || rule.translations?.en?.name;
                          const rDesc = isEn
                            ? rule.translations?.en?.description || rule.description
                            : rule.description || rule.translations?.en?.description;
                          const rIcon = rule.assetAbsolutePath || rule.assetFullAbsolutePath;

                          return (
                            <div
                              key={rule.powerCode || idx}
                              className="p-2 sm:p-2.5 rounded-xl bg-[#070a10]/80 border border-amber-500/20 flex items-start gap-2.5"
                            >
                              {rIcon && (
                                <img
                                  src={rIcon}
                                  alt=""
                                  aria-hidden="true"
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-black/40 border border-white/10 shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-xs font-bold text-amber-200">{rName}</h3>
                                <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                                  <LorMarkup text={rDesc || rule.descriptionRaw || ''} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 3. INTERACTIVE ADVENTURE MAP VISUALIZER */}
            {Array.isArray(map.nodes) && map.nodes.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[#0e1320] p-2.5 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#8CC0EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    <h2 className="text-sm sm:text-base font-bold font-heading text-white uppercase tracking-wider">
                      {isEn ? 'Adventure Map' : 'Bản Đồ Phiêu Lưu'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#8CC0EB]/15 text-[#8CC0EB] text-[11px] font-bold">
                      {map.nodes.length} nodes
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMapVisible((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isMapVisible ? (isEn ? 'Hide' : 'Ẩn') : (isEn ? 'Show' : 'Hiện')}</span>
                  </button>
                </div>

                {isMapVisible && (
                  <div className="mt-3">
                    <AdventureMapVisualizer
                      nodes={map.nodes}
                      background={map.background}
                      resolvedBosses={map.resolvedBosses}
                    />
                  </div>
                )}
              </section>
            )}

            {/* 4. ENCOUNTERS & BOSSES SECTION */}
            {Array.isArray(map.resolvedBosses) && map.resolvedBosses.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[#0e1320] p-2.5 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <h2 className="text-sm sm:text-base font-bold font-heading text-white uppercase tracking-wider">
                      {isEn ? 'Encounters & Bosses' : 'Danh Sách Kẻ Địch & Trùm'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold">
                      {map.resolvedBosses.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBossesVisible((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isBossesVisible ? (isEn ? 'Hide' : 'Ẩn') : (isEn ? 'Show' : 'Hiện')}</span>
                  </button>
                </div>

                {isBossesVisible && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {map.resolvedBosses.map((boss, idx) => {
                      const bName = isEn
                        ? boss.translations?.en?.bossName || boss.bossName
                        : boss.bossName || boss.translations?.en?.bossName;

                      return (
                        <div
                          key={boss.bossID || idx}
                          className="rounded-xl p-2.5 sm:p-3.5 bg-[#070a10] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2.5 shadow-md"
                        >
                          {/* Boss Header */}
                          <div className="flex items-center gap-2.5">
                            {boss.background && (
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-white/15 bg-black/40 shrink-0">
                                <img
                                  src={boss.background}
                                  alt={bName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs sm:text-sm font-bold font-heading text-white truncate">
                                {bName}
                              </h3>
                              <span className="text-[10px] font-mono text-slate-400">
                                {boss.bossID}
                              </span>
                            </div>
                          </div>

                          {/* Strategy Note */}
                          {boss.note && (
                            <div className="p-2 sm:p-2.5 rounded-lg bg-sky-950/20 border border-sky-500/20 text-xs text-sky-200 leading-relaxed">
                              <span className="font-bold text-sky-400 mr-1.5 text-[11px] uppercase tracking-wider">
                                {isEn ? 'Strategy Note:' : 'Chiến thuật:'}
                              </span>
                              <LorMarkup text={boss.note} />
                            </div>
                          )}

                          {/* Native Boss Powers */}
                          {(() => {
                            const bossPowers = boss.powers || boss.resolvedPowers || [];
                            if (!Array.isArray(bossPowers) || bossPowers.length === 0) return null;

                            return (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {isEn ? 'Boss Powers' : 'Sức Mạnh Trùm'}
                                </span>
                                <div className="space-y-1.5">
                                  {bossPowers.map((p, pIdx) => {
                                    const pName = isEn
                                      ? p.translations?.en?.name || p.name
                                      : p.name || p.translations?.en?.name;
                                    const pDesc = isEn
                                      ? p.translations?.en?.description || p.description
                                      : p.description || p.translations?.en?.description;
                                    const pIcon = p.assetAbsolutePath || p.assetFullAbsolutePath;

                                    return (
                                      <div
                                        key={p.powerCode || pIdx}
                                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2"
                                      >
                                        {pIcon && (
                                          <img
                                            src={pIcon}
                                            alt=""
                                            aria-hidden="true"
                                            className="w-6 h-6 rounded object-contain bg-black/30 shrink-0 mt-0.5"
                                          />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-bold text-white">{pName}</div>
                                          <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                                            <LorMarkup text={pDesc || p.descriptionRaw || ''} />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Map Bonus Powers */}
                          {Array.isArray(boss.bonusPowers) && boss.bonusPowers.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                {isEn ? 'Adventure Bonus Modifier' : 'Hiệu Ứng Bổ Sung Ải'}
                              </span>
                              <div className="space-y-1.5">
                                {boss.bonusPowers.map((bp, bpIdx) => {
                                  const bpName = isEn
                                    ? bp.translations?.en?.name || bp.name
                                    : bp.name || bp.translations?.en?.name;
                                  const bpDesc = isEn
                                    ? bp.translations?.en?.description || bp.description
                                    : bp.description || bp.translations?.en?.description;
                                  const bpIcon = bp.assetAbsolutePath || bp.assetFullAbsolutePath;

                                  return (
                                    <div
                                      key={bp.powerCode || bpIdx}
                                      className="p-1.5 sm:p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 flex items-start gap-2"
                                    >
                                      {bpIcon && (
                                        <img
                                          src={bpIcon}
                                          alt=""
                                          aria-hidden="true"
                                          className="w-6 h-6 rounded object-contain bg-black/30 shrink-0 mt-0.5"
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-amber-200">{bpName}</div>
                                        <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                                          <LorMarkup text={bpDesc || bp.descriptionRaw || ''} />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* 5. REQUIREMENTS SECTION (Champions & Regions) */}
            {hasRequirements && (
              <section className="rounded-2xl border border-white/10 bg-[#0e1320] p-2.5 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                    <h2 className="text-sm sm:text-base font-bold font-heading text-white uppercase tracking-wider">
                      {isEn ? 'Requirements & Slots' : 'Tướng & Khu Vực Yêu Cầu'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReqVisible((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isReqVisible ? (isEn ? 'Hide' : 'Ẩn') : (isEn ? 'Show' : 'Hiện')}</span>
                  </button>
                </div>

                {isReqVisible && (
                  <div className="mt-3 space-y-3">
                    {/* Required Champions */}
                    {Array.isArray(map.resolvedChampions) && map.resolvedChampions.length > 0 && (
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          {isEn ? 'Eligible Champions' : 'Tướng Thỏa Mãn Điều Kiện'} ({map.resolvedChampions.length})
                        </span>
                        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar p-1">
                          {map.resolvedChampions.map((c) => {
                            const cName = isEn && c.translations?.en?.name ? c.translations.en.name : c.name;
                            return (
                              <button
                                key={c.championID}
                                type="button"
                                onClick={() => onNavigateChampion?.(c.name || c.championID)}
                                className="group flex items-center gap-2 p-1.5 rounded-xl bg-[#070a10] border border-white/10 hover:border-[#8CC0EB] text-left transition-all cursor-pointer"
                              >
                                {c.avatar && (
                                  <img
                                    src={c.avatar}
                                    alt={cName}
                                    className="w-7 h-7 rounded-lg object-cover bg-black/40 border border-white/10"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = 'https://images.lortpoc.com/avatarChampions/Aatrox.webp';
                                    }}
                                  />
                                )}
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white pr-1">
                                  {cName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Required Regions */}
                    {Array.isArray(map.requirement?.regions) && map.requirement.regions.length > 0 && (
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          {isEn ? 'Required Regions' : 'Khu Vực Bắt Buộc'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {map.requirement.regions.map((reg) => {
                            const iconUrl = getRegionIconUrl(reg);
                            return (
                              <div
                                key={reg}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070a10] border border-white/10"
                              >
                                {iconUrl && (
                                  <img src={iconUrl} alt={reg} className="w-4 h-4 object-contain" />
                                )}
                                <span className="text-xs font-bold text-white capitalize">{reg}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* 6. REWARDS SECTION */}
            {hasRewards && (
              <section className="rounded-2xl border border-white/10 bg-[#0e1320] p-2.5 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <line x1="12" y1="22" x2="12" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                    <h2 className="text-sm sm:text-base font-bold font-heading text-white uppercase tracking-wider">
                      {isEn ? 'Adventure Rewards' : 'Phần Thưởng Cuộc Phiêu Lưu'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRewardsVisible((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isRewardsVisible ? (isEn ? 'Hide' : 'Ẩn') : (isEn ? 'Show' : 'Hiện')}</span>
                  </button>
                </div>

                {isRewardsVisible && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
                    {map.rewards.flatMap((rw, rIdx) =>
                      (rw.items || []).map((item, itemIdx) => (
                        <div
                          key={`${rIdx}-${itemIdx}`}
                          className="p-2.5 rounded-xl bg-[#070a10] border border-white/10 flex items-center justify-between gap-2"
                        >
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {item.name}
                          </span>
                          {item.count && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#8CC0EB]/20 text-[#8CC0EB] border border-[#8CC0EB]/30 shrink-0">
                              {item.count >= 1000 ? `+${item.count.toLocaleString()}` : `x${item.count}`}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import LorMarkup from '../components/LorMarkup';
import ListLoadingBar from '../components/ListLoadingBar';
import DetailSkeleton from '../components/DetailSkeleton';
import SEOHead from '../components/SEOHead';
import { getRelicKeywords } from '../utils/seoKeywords';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl } from '../utils/regionIcons';
import { handleImageError } from '../utils/imageFallback';

// In-memory cache for relic details (Rule 10)
const relicDetailCache = new Map();

function getRarityStyle(rarity) {
  const lower = (rarity || '').toLowerCase();
  if (lower.includes('sử thi') || lower.includes('epic')) {
    return {
      badge: 'bg-purple-950/60 text-purple-200 border-purple-500/40',
      border: 'border-purple-500/40',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]'
    };
  }
  if (lower.includes('hiếm') || lower.includes('rare')) {
    return {
      badge: 'bg-sky-950/60 text-sky-200 border-sky-500/40',
      border: 'border-sky-500/40',
      glow: 'shadow-[0_0_15px_rgba(56,189,248,0.15)]'
    };
  }
  if (lower.includes('thường') || lower.includes('common')) {
    return {
      badge: 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40',
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_15px_rgba(52,211,153,0.12)]'
    };
  }
  if (lower.includes('huyền thoại') || lower.includes('legendary')) {
    return {
      badge: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]'
    };
  }
  return {
    badge: 'bg-slate-800 text-slate-300 border-white/10',
    border: 'border-white/15',
    glow: ''
  };
}

export default function RelicDetailView({
  relicCode,
  onBack,
  onNavigateChampion,
  onSelectRelic,
  onNavigateTab,
  currentHash = '',
  onHashChange
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [relic, setRelic] = useState(() => relicDetailCache.get(relicCode) || null);
  const [loading, setLoading] = useState(!relicDetailCache.has(relicCode));
  const [error, setError] = useState(null);
  const [selectedChampKey, setSelectedChampKey] = useState(null);

  // Fetch enriched relic data with on-demand caching (Rule 10)
  useEffect(() => {
    if (!relicCode) return;

    let isMounted = true;

    if (relicDetailCache.has(relicCode)) {
      const cached = relicDetailCache.get(relicCode);
      const timer = setTimeout(() => {
        if (isMounted) {
          setRelic(cached);
          setLoading(false);
          setError(null);
        }
      }, 350);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    fetch(`/api/v1/relics/${encodeURIComponent(relicCode)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Relic ${relicCode} not found`);
        return res.json();
      })
      .then(async (json) => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, 380 - elapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

        if (json.success && json.data) {
          relicDetailCache.set(relicCode, json.data);
          if (isMounted) {
            setRelic(json.data);
            setLoading(false);
          }
        } else {
          throw new Error(json.message || 'Failed to load relic');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [relicCode]);

  // Scroll to top on relic change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [relicCode]);

  const relicName = isEn && relic?.translations?.en?.name
    ? relic.translations.en.name
    : relic?.name || relicCode;

  const relicRarity = isEn && relic?.translations?.en?.rarity
    ? relic.translations.en.rarity
    : relic?.rarity || '';

  const rarityStyle = getRarityStyle(relicRarity);

  const relicDesc = isEn
    ? relic?.translations?.en?.descriptionRaw || relic?.translations?.en?.description || relic?.descriptionRaw
    : relic?.descriptionRaw || relic?.description;

  const compatibleChamps = relic?.compatibleChampions || [];
  const companionRelicsMap = relic?.companionRelicsMap || {};

  // Helper to find champion in compatible list by name, id or translation
  const findChampion = useCallback((targetKey, list) => {
    if (!targetKey || !list || !list.length) return null;
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = norm(targetKey);
    return list.find((c) =>
      norm(c.name) === targetNorm ||
      norm(c.championID) === targetNorm ||
      norm(c.translations?.en?.name) === targetNorm ||
      norm(c.cardCode) === targetNorm
    ) || null;
  }, []);

  // Synchronize selection with URL hash or auto-select first core
  useEffect(() => {
    if (!compatibleChamps.length) {
      setSelectedChampKey(null);
      return;
    }

    // 1. Try to match from URL hash or currentHash
    let rawHash = currentHash || (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '');
    try {
      rawHash = decodeURIComponent(rawHash);
    } catch {
      // keep rawHash if decode fails
    }

    const hashMatch = findChampion(rawHash, compatibleChamps);
    if (hashMatch) {
      const matchKey = hashMatch.name || hashMatch.championID;
      setSelectedChampKey(matchKey);
      return;
    }

    // 2. If current selection is already valid in list, preserve it
    setSelectedChampKey((prev) => {
      const prevMatch = findChampion(prev, compatibleChamps);
      if (prevMatch) {
        return prevMatch.name || prevMatch.championID;
      }

      // 3. Fallback to first core or first champion
      const firstCore = compatibleChamps.find((c) => c.isCore);
      const chosen = firstCore || compatibleChamps[0];
      const chosenKey = chosen.name || chosen.championID;

      // Sync default champion to URL hash
      if (onHashChange) {
        onHashChange(chosenKey);
      } else if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', `#${encodeURIComponent(chosenKey)}`);
      }

      return chosenKey;
    });
  }, [compatibleChamps, currentHash, findChampion, onHashChange]);

  // Listen for direct window hash changes (e.g. browser back/forward or typing in URL)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined' || !compatibleChamps.length) return;
      let rawHash = window.location.hash.replace(/^#/, '');
      try {
        rawHash = decodeURIComponent(rawHash);
      } catch {
        // keep rawHash
      }
      const match = findChampion(rawHash, compatibleChamps);
      if (match) {
        setSelectedChampKey(match.name || match.championID);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [compatibleChamps, findChampion]);

  // Active champion currently displayed in the 3-part detail box (must be initialized before height-measuring useEffect)
  const activeChampion = useMemo(() => {
    if (!compatibleChamps.length) return null;
    return findChampion(selectedChampKey, compatibleChamps) || compatibleChamps[0];
  }, [compatibleChamps, selectedChampKey, findChampion]);

  // Subtle transition state & height stabilization to prevent jarring page layout shifts (Rule 9)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef(null);
  const [boxHeight, setBoxHeight] = useState(580);

  // Measure content and smoothly adapt container height
  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const naturalHeight = contentRef.current.offsetHeight + 40; // 40px padding
        const minFloor = typeof window !== 'undefined' && window.innerWidth < 1024 ? 460 : 580;
        setBoxHeight(Math.max(minFloor, naturalHeight));
      }
    };

    updateHeight();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [activeChampion]);

  // Handle focusing/selecting a champion and updating the URL hash (#ChampionName)
  const handleSelectChampion = (targetKey) => {
    const champ = findChampion(targetKey, compatibleChamps);
    const resolvedKey = champ ? (champ.name || champ.championID) : targetKey;
    if (resolvedKey === selectedChampKey) return;

    setIsTransitioning(true);
    setSelectedChampKey(resolvedKey);

    const hashVal = champ ? (champ.name || champ.championID) : resolvedKey;
    if (onHashChange) {
      onHashChange(hashVal);
    } else if (typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', `#${encodeURIComponent(hashVal)}`);
    }

    setTimeout(() => {
      setIsTransitioning(false);
    }, 180);
  };

  // List of compatible champions for the right selector sidebar
  const filteredChamps = compatibleChamps;

  // SEO metadata computation (Rule 1 & Rule 4)
  const seoTitle = isEn
    ? `${relicName} Relic Guide (${relicRarity || 'Relic'}) - Best Champions & Effects`
    : `Cổ Vật ${relicName} (${relicRarity || 'Cổ Vật'}) - Hiệu Ứng & Tướng Phù Hợp`;

  const seoDesc = isEn
    ? `Comprehensive guide for ${relicName} (${relicRarity}) in LoR: The Path of Champions. Detailed effect, stat upgrades, and top champion synergies.`
    : `Cẩm nang chi tiết cổ vật ${relicName} (${relicRarity}) trong Con Đường Anh Hùng. Hiệu ứng trang bị, chỉ số và danh sách tướng kết hợp mạnh nhất.`;

  const seoImage = relic?.imageUrl || relic?.image || '/assets/hero-bg.jpg';
  const seoUrl = `https://thepathofchampions.guide/relic/${encodeURIComponent(relicCode)}`;
  const seoKeywords = getRelicKeywords(relic, language);

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
            name: isEn ? 'Relics' : 'Cổ Vật',
            item: 'https://thepathofchampions.guide/?tab=relics'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: relicName,
            item: seoUrl
          }
        ]
      },
      {
        '@type': 'ItemPage',
        mainEntity: {
          '@type': 'Thing',
          name: relicName,
          description: seoDesc,
          image: seoImage
        }
      }
    ]
  };

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center animate-in fade-in duration-300">
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
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-6 py-2 sm:py-8">
        {/* 1. Top Bar: Back Button & Minimal Breadcrumb */}
        <div className="flex items-center justify-between pb-3 mb-4 sm:mb-6 border-b border-white/10 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={isEn ? 'Back to Relics List' : 'Quay lại danh sách cổ vật'}
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
                href="/relics"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab ? onNavigateTab('relics') : onBack?.();
                }}
                className="hover:text-white transition-colors cursor-pointer text-[#8CC0EB]"
              >
                {isEn ? 'Relics List' : 'Danh Sách Cổ Vật'}
              </a>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[360px]">
                {relicName}
              </span>
            </nav>
          </div>
        </div>

        {/* 2. Loading / Error States */}
        {loading && !relic ? (
          <div className="space-y-4">
            <ListLoadingBar isTransitioning={true} />
            <DetailSkeleton type="entity" />
          </div>
        ) : error || !relic ? (
          <div className="py-20 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
            <h3 className="text-base font-bold text-white mb-2">
              {isEn ? 'Relic Not Found' : 'Không tìm thấy cổ vật'}
            </h3>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase cursor-pointer"
            >
              {isEn ? 'Back to Relics' : 'Quay lại'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ListLoadingBar isTransitioning={loading || isTransitioning} />
            <div className={`space-y-6 transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {/* 3. Tinh gọn Hero Relic Card */}
            <div className={`p-3 sm:p-5 rounded-2xl bg-[#0e1320] border ${rarityStyle.border} ${rarityStyle.glow}`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
                {/* Relic Icon */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#070a10] border ${rarityStyle.border} p-1.5 flex-shrink-0 flex items-center justify-center`}>
                  <img
                    src={`https://images.lortpoc.com/relics/${relic.relicCode}.webp`}
                    alt={relicName}
                    className="w-full h-full object-contain"
                    onError={(e) => handleImageError(e, 'relic')}
                  />
                </div>

                {/* Relic Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {relic.relicCode}
                    </span>

                    {relicRarity && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rarityStyle.badge}`}>
                        {relicRarity}
                      </span>
                    )}

                    {Array.isArray(relic.type) && relic.type.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300"
                      >
                        {t}
                      </span>
                    ))}

                    {relic.stack && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                        x{relic.stack}
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black font-heading text-white">
                    {relicName}
                  </h1>

                  {/* Description Box */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-[#070a10] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    <LorMarkup text={relicDesc} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Tướng Phù Hợp & Các Bộ Cổ Vật Khuyên Dùng (Bố cục 3/1 Master-Detail) */}
            <div className="space-y-2.5 sm:space-y-3">
              {/* Section Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold font-heading uppercase text-white tracking-wider">
                    {isEn ? 'Compatible Champions' : 'Tướng Phù Hợp'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#8CC0EB]/20 border border-[#8CC0EB]/40 text-[#8CC0EB] text-[11px] font-bold">
                    {compatibleChamps.length}
                  </span>
                </div>
              </div>

              {/* Mobile Horizontal Selector Strip: Avatar Only, No Names, Bigger Icons */}
              {compatibleChamps.length > 1 && (
                <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth">
                  {compatibleChamps.map((champ) => {
                    const champKey = champ.championID || champ.name;
                    const isSelected = Boolean(
                      activeChampion &&
                      ((champ.championID && champ.championID === activeChampion.championID) ||
                       (champ.name && champ.name === activeChampion.name))
                    );
                    const champName =
                      isEn && champ.translations?.en?.name ? champ.translations.en.name : champ.name;
                    const avatarUrl =
                      champ.assets?.[0]?.avatar ||
                      `https://images.lortpoc.com/avatarChampions/${champ.name}.webp`;

                    return (
                      <button
                        key={champKey}
                        type="button"
                        onClick={() => handleSelectChampion(champ.name || champ.championID)}
                        title={champName}
                        aria-label={champName}
                        className={`relative p-0.5 rounded-xl border shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8CC0EB]/25 border-[#8CC0EB] ring-2 ring-[#8CC0EB]/60 shadow-md scale-105'
                            : 'bg-[#090d16] border-white/10 hover:border-white/30 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={avatarUrl}
                          alt={champName}
                          className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-white/10 pointer-events-none"
                          onError={(e) => handleImageError(e, 'champion')}
                        />
                        {champ.isCore && (
                          <span
                            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-black shadow-sm"
                            title={isEn ? 'Core' : 'Cốt lõi'}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3/1 Master-Detail Layout */}
              {compatibleChamps.length > 0 && activeChampion ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch min-h-[460px] lg:min-h-[580px]">
                  {/* Left Column (3 parts): Active Champion Showcase Detail Box */}
                  <div
                    style={{
                      minHeight: `${boxHeight}px`,
                      transition: 'min-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="lg:col-span-3 rounded-2xl bg-[#0e1320] border border-white/10 p-2 sm:p-5 shadow-xl"
                  >
                    <div
                      ref={contentRef}
                      className={`space-y-3 sm:space-y-4 transition-opacity duration-200 ${
                        isTransitioning ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      {/* Champion Header Row */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <img
                          src={
                            activeChampion.assets?.[0]?.avatar ||
                            `https://images.lortpoc.com/avatarChampions/${activeChampion.name}.webp`
                          }
                          alt={activeChampion.name}
                          className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover border border-[#8CC0EB]/50 bg-[#070a10] shrink-0 shadow-md"
                          onError={(e) => handleImageError(e, 'champion')}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-lg font-bold font-heading text-white truncate">
                              {isEn && activeChampion.translations?.en?.name
                                ? activeChampion.translations.en.name
                                : activeChampion.name}
                            </h3>
                            {activeChampion.tier && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-heading font-semibold">
                                {activeChampion.tier.split('//')[0].trim()}
                              </span>
                            )}
                            {activeChampion.isCore && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {isEn ? 'Core' : 'Cốt lõi'}
                              </span>
                            )}
                            {(activeChampion.isOtherOption || activeChampion.isOption) && !activeChampion.isCore && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                {isEn ? 'Optional' : 'Cổ vật tùy chọn'}
                              </span>
                            )}
                          </div>

                          {/* Regions and Stars */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                            {Array.isArray(activeChampion.regions) && (
                              <div className="flex items-center gap-1">
                                {activeChampion.regions.map((reg) => {
                                  const iconUrl = getRegionIconUrl(reg);
                                  return iconUrl ? (
                                    <img
                                      key={reg}
                                      src={iconUrl}
                                      alt={reg}
                                      className="w-3.5 h-3.5 object-contain"
                                      title={reg}
                                    />
                                  ) : null;
                                })}
                                <span className="text-xs text-slate-300 capitalize">
                                  {activeChampion.regions.join(' • ')}
                                </span>
                              </div>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-[#FFF9D2] tracking-wider">
                              {'★'.repeat(Math.min(activeChampion.maxStar || 3, 6))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Navigate to Champion (Icon Only) */}
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateChampion?.(
                            activeChampion.name || activeChampion.championID,
                            'relics'
                          )
                        }
                        title={isEn ? 'View Champion Details' : 'Xem chi tiết tướng'}
                        aria-label={isEn ? 'View Champion Details' : 'Xem chi tiết tướng'}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#8CC0EB] hover:bg-white text-[#07090e] transition-all cursor-pointer flex items-center justify-center shadow-md hover:shadow-lg shrink-0"
                      >
                        <svg
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Core Description Note */}
                    {activeChampion.isCore && activeChampion.coreDescription && (
                      <div className="p-2 sm:p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs sm:text-sm text-amber-200 leading-relaxed font-sans">
                        <span className="font-bold text-amber-300 mr-1.5 uppercase text-[11px] tracking-wider">
                          {isEn ? 'Core Synergy:' : 'Chiến thuật Cốt Lõi:'}
                        </span>
                        <LorMarkup text={activeChampion.coreDescription} />
                      </div>
                    )}

                    {/* Matching Build Sets */}
                    {Array.isArray(activeChampion.matchingSets) &&
                    activeChampion.matchingSets.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
                          {isEn ? 'Other Relic Builds' : 'Các Bộ Cổ Vật Khác'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                          {activeChampion.matchingSets.map((set, sIdx) => {
                            const setTitle = isEn
                              ? (set.translations?.en?.title || (set.title ? set.title.replace(/^Bộ\s*/i, 'Build ') : `Build ${sIdx + 1}`))
                              : (set.title || `Bộ ${sIdx + 1}`);

                            const setDescription = isEn
                              ? (set.translations?.en?.description || set.translations?.en?.descriptionRaw || set.description)
                              : set.description;

                            return (
                              <div
                                key={sIdx}
                                className="p-2 sm:p-3 rounded-xl bg-[#070a10] border border-white/10 space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                  <span>{setTitle}</span>
                                  {set.recommendedStars && (
                                    <span className="text-[#FFF9D2] text-[11px] font-semibold">
                                      {set.recommendedStars} ★
                                    </span>
                                  )}
                                </div>

                                {/* 3 Relics in build */}
                                <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                                  {set.items.map((itemCode, itemIdx) => {
                                    const isCurrent = itemCode === relic.relicCode;
                                    const compInfo = companionRelicsMap[itemCode] || {};
                                    const compName =
                                      isEn && compInfo.translations?.en?.name
                                        ? compInfo.translations.en.name
                                        : compInfo.name || itemCode;

                                    return (
                                      <div
                                        key={itemIdx}
                                        onClick={() => {
                                          if (!isCurrent && onSelectRelic) {
                                            onSelectRelic(itemCode);
                                          }
                                        }}
                                        title={compName}
                                        className={`p-1 sm:p-1.5 rounded-lg border flex items-center gap-1 sm:gap-1.5 transition-all ${
                                          isCurrent
                                            ? 'bg-[#8CC0EB]/20 border-[#8CC0EB] ring-1 ring-[#8CC0EB]/40'
                                            : 'bg-[#0e1320] border-white/10 hover:border-[#8CC0EB] cursor-pointer'
                                        }`}
                                      >
                                        <img
                                          src={`https://images.lortpoc.com/relics/${itemCode}.webp`}
                                          alt={compName}
                                          className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0"
                                          onError={(e) => handleImageError(e, 'relic')}
                                        />
                                        <span
                                          className={`text-[9px] sm:text-[10px] font-bold line-clamp-1 leading-tight ${
                                            isCurrent ? 'text-[#8CC0EB]' : 'text-slate-300'
                                          }`}
                                        >
                                          {compName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {setDescription && (
                                  <div className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1 border-t border-white/5">
                                    <LorMarkup text={setDescription} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : Array.isArray(activeChampion.companionRelicCodes) &&
                      activeChampion.companionRelicCodes.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
                          {isEn ? 'Companion Relics' : 'Cổ Vật Đi Kèm'}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeChampion.companionRelicCodes.map((cCode) => {
                            const cInfo = companionRelicsMap[cCode] || {};
                            const cName =
                              isEn && cInfo.translations?.en?.name
                                ? cInfo.translations.en.name
                                : cInfo.name || cCode;
                            return (
                              <button
                                key={cCode}
                                type="button"
                                onClick={() => onSelectRelic?.(cCode)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#070a10] border border-white/10 hover:border-[#8CC0EB] text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
                              >
                                <img
                                  src={`https://images.lortpoc.com/relics/${cCode}.webp`}
                                  alt={cName}
                                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                                  onError={(e) => handleImageError(e, 'relic')}
                                />
                                <span>{cName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Dòng Cổ vật tùy chọn nếu nằm trong phần lựa chọn khác - Đặt dưới cùng */}
                    {(activeChampion.isOtherOption || activeChampion.isOption) && (
                      <div className="p-2 sm:p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-sky-300 flex-wrap">
                          <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/40">
                            {isEn ? 'Optional Relic' : 'Cổ vật tùy chọn'}
                          </span>
                          <span className="text-slate-300 font-normal">
                            {isEn
                              ? `${relicName} is an optional relic for ${activeChampion.name}.`
                              : `${relicName} là cổ vật tùy chọn cho ${activeChampion.name}.`}
                          </span>
                        </div>
                        {Array.isArray(activeChampion.otherRelicOptions) &&
                          activeChampion.otherRelicOptions.length > 0 && (
                            <div className="pt-2 border-t border-sky-500/20 flex flex-wrap items-center gap-2">
                              {activeChampion.otherRelicOptions.map((optCode) => {
                                const isCurrent = optCode === relic.relicCode;
                                const optInfo = companionRelicsMap[optCode] || {};
                                const optName =
                                  isEn && optInfo.translations?.en?.name
                                    ? optInfo.translations.en.name
                                    : optInfo.name || optCode;

                                return (
                                  <button
                                    key={optCode}
                                    type="button"
                                    onClick={() => {
                                      if (!isCurrent && onSelectRelic) {
                                        onSelectRelic(optCode);
                                      }
                                    }}
                                    className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border transition-all ${
                                      isCurrent
                                        ? 'bg-sky-500/25 border-sky-400 ring-2 ring-sky-400/50 shadow-md shadow-sky-500/20 cursor-default'
                                        : 'bg-[#070a10] border-white/10 hover:border-[#8CC0EB] hover:scale-105 hover:bg-[#121929] cursor-pointer'
                                    }`}
                                    title={optName}
                                    aria-label={optName}
                                  >
                                    <img
                                      src={`https://images.lortpoc.com/relics/${optCode}.webp`}
                                      alt={optName}
                                      className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow"
                                      onError={(e) => handleImageError(e, 'relic')}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Right Column (1 part): Selector List of All Compatible Champions */}
                  <div className="hidden lg:block lg:col-span-1 relative min-h-0">
                    <div className="lg:absolute lg:inset-0 flex flex-col rounded-2xl bg-[#0e1320] border border-white/10 p-2.5 space-y-2 shadow-xl">
                      <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10 shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
                          {isEn ? 'Other Champions' : 'Tướng Phù Hợp'}
                        </span>
                        <span className="text-xs font-bold text-[#8CC0EB]">
                          {filteredChamps.length}
                        </span>
                      </div>

                      {/* Scrollable Champions List: 2 Columns, Avatar Only */}
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5 auto-rows-max content-start">
                        {filteredChamps.map((champ) => {
                          const champKey = champ.championID || champ.name;
                          const isSelected = Boolean(
                            activeChampion &&
                            ((champ.championID && champ.championID === activeChampion.championID) ||
                             (champ.name && champ.name === activeChampion.name))
                          );
                          const champName =
                            isEn && champ.translations?.en?.name
                              ? champ.translations.en.name
                              : champ.name;
                          const avatarUrl =
                            champ.assets?.[0]?.avatar ||
                            `https://images.lortpoc.com/avatarChampions/${champ.name}.webp`;

                          return (
                            <button
                              key={champKey}
                              type="button"
                              onClick={() => handleSelectChampion(champ.name || champ.championID)}
                              title={champName}
                              aria-label={champName}
                              className={`group relative flex items-center justify-center p-1 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#8CC0EB]/20 border-[#8CC0EB] ring-2 ring-[#8CC0EB]/50 shadow-md'
                                  : 'bg-[#070a10] border-white/10 hover:border-[#8CC0EB]/60 hover:bg-white/5'
                              }`}
                            >
                              <img
                                src={avatarUrl}
                                alt={champName}
                                className="w-full aspect-square rounded-lg object-cover bg-black/40 border border-white/10 group-hover:scale-105 transition-transform"
                                onError={(e) => handleImageError(e, 'champion')}
                              />
                              {champ.isCore && (
                                <span
                                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-black shadow-sm"
                                  title={isEn ? 'Core' : 'Cốt lõi'}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center rounded-xl bg-[#0e1320] border border-white/10 p-4">
                  <p className="text-xs text-slate-400">
                    {isEn
                      ? 'No compatible champions recorded for this relic.'
                      : 'Chưa có tướng nào được ghi nhận phù hợp với cổ vật này.'}
                  </p>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

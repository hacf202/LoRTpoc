import React, { useState, useEffect } from 'react';
import LorMarkup from '../components/LorMarkup';
import ListLoadingBar from '../components/ListLoadingBar';
import DetailSkeleton from '../components/DetailSkeleton';
import SEOHead from '../components/SEOHead';
import { getPowerKeywords } from '../utils/seoKeywords';
import { useLanguage } from '../context/LanguageContext';

// In-memory cache for power details (Rule 10)
const powerDetailCache = new Map();

function getRarityStyle(rarity) {
  const lower = (rarity || '').toLowerCase();
  if (lower.includes('đặc biệt') || lower.includes('dac biet') || lower.includes('special')) {
    return {
      badge: 'bg-rose-950/60 text-rose-200 border-rose-500/40',
      border: 'border-rose-500/40',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]'
    };
  }
  if (lower.includes('huyền thoại') || lower.includes('legendary')) {
    return {
      badge: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]'
    };
  }
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
  return {
    badge: 'bg-slate-800 text-slate-300 border-white/10',
    border: 'border-white/15',
    glow: ''
  };
}

export default function PowerDetailView({
  powerCode,
  onBack,
  onNavigateChampion,
  onNavigateTab
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [power, setPower] = useState(() => powerDetailCache.get(powerCode) || null);
  const [loading, setLoading] = useState(!powerDetailCache.has(powerCode));
  const [error, setError] = useState(null);

  // Fetch enriched power data with on-demand caching (Rule 10)
  useEffect(() => {
    if (!powerCode) return;

    let isMounted = true;

    if (powerDetailCache.has(powerCode)) {
      const cached = powerDetailCache.get(powerCode);
      const timer = setTimeout(() => {
        if (isMounted) {
          setPower(cached);
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

    fetch(`/api/v1/powers/${encodeURIComponent(powerCode)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Power ${powerCode} not found`);
        return res.json();
      })
      .then(async (json) => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, 380 - elapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

        if (json.success && json.data) {
          powerDetailCache.set(powerCode, json.data);
          if (isMounted) {
            setPower(json.data);
            setLoading(false);
          }
        } else {
          throw new Error(json.message || 'Failed to load power');
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
  }, [powerCode]);

  // Scroll to top on power change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [powerCode]);

  const powerName =
    isEn && power?.translations?.en?.name
      ? power.translations.en.name
      : power?.name || powerCode;

  const rawRarity = (power?.rarity || power?.translations?.en?.rarity || '').toLowerCase();
  const powerRarityLabel = (() => {
    if (!rawRarity || rawRarity === 'none') return '';
    if (rawRarity.includes('special') || rawRarity.includes('đặc biệt') || rawRarity.includes('dac biet')) {
      return isEn ? 'Special' : 'Đặc Biệt';
    }
    if (rawRarity.includes('legendary') || rawRarity.includes('huyền thoại')) {
      return isEn ? 'Legendary' : 'Huyền Thoại';
    }
    if (rawRarity.includes('epic') || rawRarity.includes('sử thi')) {
      return isEn ? 'Epic' : 'Sử Thi';
    }
    if (rawRarity.includes('rare') || rawRarity.includes('hiếm')) {
      return isEn ? 'Rare' : 'Hiếm';
    }
    if (rawRarity.includes('common') || rawRarity.includes('thường')) {
      return isEn ? 'Common' : 'Thường';
    }
    return rawRarity;
  })();

  const rarityStyle = getRarityStyle(rawRarity);

  const powerDesc = isEn
    ? power?.translations?.en?.descriptionRaw || power?.translations?.en?.description || power?.descriptionRaw
    : power?.descriptionRaw || power?.description;

  const powerImg =
    power?.assetAbsolutePath ||
    power?.image ||
    power?.assetFullAbsolutePath ||
    `https://dd.b.pvp.net/latest/set1/en_us/img/powers/${powerCode}.png`;

  const compatibleChamps = power?.compatibleChampions || [];

  // SEO metadata computation (Rule 1 & Rule 4)
  const seoTitle = isEn
    ? `${powerName} Power (${powerRarityLabel || 'Power'}) - Stats & Synergies`
    : `Sức Mạnh ${powerName} (${powerRarityLabel || 'Sức Mạnh'}) - Chi Tiết & Tướng Sở Hữu`;

  const seoDesc = isEn
    ? `Detailed effects, rarity tier, and compatible champions for ${powerName} in LoR: The Path of Champions.`
    : `Chi tiết hiệu ứng, phân loại sức mạnh và danh sách tướng sở hữu ${powerName} trong Con Đường Anh Hùng.`;

  const seoUrl = `https://thepathofchampions.guide/power/${encodeURIComponent(powerCode)}`;
  const seoKeywords = getPowerKeywords(power, language);

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
            name: isEn ? 'Powers' : 'Sức Mạnh',
            item: 'https://thepathofchampions.guide/?tab=powers'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: powerName,
            item: seoUrl
          }
        ]
      },
      {
        '@type': 'ItemPage',
        mainEntity: {
          '@type': 'Thing',
          name: powerName,
          description: seoDesc,
          image: powerImg
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
        image={powerImg}
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
              aria-label={isEn ? 'Back to Powers List' : 'Quay lại danh sách sức mạnh'}
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
                href="/powers"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab ? onNavigateTab('powers') : onBack?.();
                }}
                className="hover:text-white transition-colors cursor-pointer text-[#8CC0EB]"
              >
                {isEn ? 'Powers List' : 'Danh Sách Sức Mạnh'}
              </a>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[360px]">
                {powerName}
              </span>
            </nav>
          </div>
        </div>

        {/* 2. Loading / Error States */}
        {loading ? (
          <div className="space-y-4">
            <ListLoadingBar isTransitioning={true} />
            <DetailSkeleton type="entity" />
          </div>
        ) : error || !power ? (
          <div className="py-20 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
            <h3 className="text-base font-bold text-white mb-2">
              {isEn ? 'Power Not Found' : 'Không tìm thấy sức mạnh'}
            </h3>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase cursor-pointer"
            >
              {isEn ? 'Back to Powers' : 'Quay lại'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ListLoadingBar isTransitioning={loading} />
            <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {/* 3. Hero Power Card */}
            <div className={`p-3 sm:p-5 rounded-2xl bg-[#0e1320] border ${rarityStyle.border} ${rarityStyle.glow}`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
                {/* Power Icon */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#070a10] border ${rarityStyle.border} p-1.5 shrink-0 flex items-center justify-center shadow-lg`}>
                  <img
                    src={powerImg}
                    alt={powerName}
                    className="w-full h-full object-contain drop-shadow"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/P0156.png';
                    }}
                  />
                </div>

                {/* Power Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {power.powerCode}
                    </span>

                    {powerRarityLabel && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rarityStyle.badge}`}>
                        {powerRarityLabel}
                      </span>
                    )}

                    {Array.isArray(power.type) && power.type.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black font-heading text-white">
                    {powerName}
                  </h1>

                  {/* Description Box */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-[#070a10] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans text-left">
                    <LorMarkup text={powerDesc} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Tướng Phù Hợp (Chỉ danh sách avatar) */}
            <div className="space-y-3">
              {/* Section Header */}
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

              {/* Champions Avatar Grid */}
              {compatibleChamps.length > 0 ? (
                <div className="p-2.5 sm:p-5 rounded-2xl bg-[#0e1320] border border-white/10 shadow-xl">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
                    {compatibleChamps.map((champ) => {
                      const champKey = champ.championID || champ.name;
                      const champName =
                        isEn && champ.translations?.en?.name ? champ.translations.en.name : champ.name;
                      const avatarUrl =
                        champ.assets?.[0]?.avatar ||
                        `https://images.lortpoc.com/avatarChampions/${champ.name}.webp`;
                      const targetHash = champ.isStarPower ? 'constellation' : 'synergies';

                      return (
                        <button
                          key={champKey}
                          type="button"
                          onClick={() => onNavigateChampion?.(champ.name || champ.championID, targetHash)}
                          title={`${champName}${champ.isStarPower ? (isEn ? ' (Star Power)' : ' (Sức Mạnh Sao)') : ''}`}
                          aria-label={champName}
                          className="group relative p-1 rounded-xl bg-[#070a10] border border-white/10 hover:border-[#8CC0EB] hover:scale-105 transition-all cursor-pointer shadow-sm hover:shadow-md hover:bg-white/5"
                        >
                          <img
                            src={avatarUrl}
                            alt={champName}
                            className="w-full aspect-square rounded-lg object-cover bg-black/40 border border-white/10 pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'https://images.lortpoc.com/avatarChampions/Aatrox.webp';
                            }}
                          />
                          {champ.isStarPower && (
                            <span
                              className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 ring-2 ring-black shadow-sm"
                              title={isEn ? 'Star Power' : 'Sức Mạnh Sao'}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center rounded-xl bg-[#0e1320] border border-white/10 p-4">
                  <p className="text-xs text-slate-400">
                    {isEn
                      ? 'No champions directly linked to this power in our guide dataset.'
                      : 'Chưa có tướng nào được liên kết trực tiếp với sức mạnh này trong dữ liệu cẩm nang.'}
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

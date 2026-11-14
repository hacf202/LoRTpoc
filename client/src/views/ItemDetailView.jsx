import React, { useState, useEffect } from 'react';
import LorMarkup from '../components/LorMarkup';
import { useLanguage } from '../context/LanguageContext';

// In-memory cache for item details (Rule 10)
const itemDetailCache = new Map();

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
  return {
    badge: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]'
  };
}

export default function ItemDetailView({
  itemCode,
  onBack,
  onNavigateChampion,
  onNavigateTab
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [item, setItem] = useState(() => itemDetailCache.get(itemCode) || null);
  const [loading, setLoading] = useState(!itemDetailCache.has(itemCode));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!itemCode) return;

    if (itemDetailCache.has(itemCode)) {
      setItem(itemDetailCache.get(itemCode));
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/items/${encodeURIComponent(itemCode)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        if (json.success && isMounted) {
          itemDetailCache.set(itemCode, json.data);
          setItem(json.data);
        } else if (isMounted) {
          setError(json.message || 'Item not found');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch item details:', err);
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchItem();
    return () => {
      isMounted = false;
    };
  }, [itemCode]);

  // Scroll to top on item change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [itemCode]);

  // Derived styling & data
  const itemName = isEn
    ? item?.translations?.en?.name || item?.name
    : item?.name || item?.translations?.en?.name;

  const itemRarity = isEn
    ? item?.translations?.en?.rarity || item?.rarity
    : item?.rarity || item?.translations?.en?.rarity;

  const rarityStyle = getRarityStyle(itemRarity);

  const itemDesc = isEn
    ? item?.translations?.en?.descriptionRaw || item?.translations?.en?.description
    : item?.descriptionRaw || item?.description;

  const itemImg =
    item?.assetAbsolutePath ||
    item?.image ||
    item?.assetFullAbsolutePath ||
    `https://dd.b.pvp.net/latest/set1/en_us/img/items/${itemCode}.png`;

  const compatibleChamps = item?.compatibleChampions || [];

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-6 py-2 sm:py-8">
        {/* 1. Top Bar: Back Button & Minimal Breadcrumb */}
        <div className="flex items-center justify-between pb-3 mb-4 sm:mb-6 border-b border-white/10 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={isEn ? 'Back to Items List' : 'Quay lại danh sách vật phẩm'}
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
                href="/items"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab ? onNavigateTab('items') : onBack?.();
                }}
                className="hover:text-white transition-colors cursor-pointer text-[#8CC0EB]"
              >
                {isEn ? 'Items List' : 'Danh Sách Vật Phẩm'}
              </a>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[360px]">
                {itemName || itemCode}
              </span>
            </nav>
          </div>
        </div>

        {/* 2. Loading / Error States */}
        {loading && !item ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 border-2 border-[#8CC0EB] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400">
              {isEn ? 'Loading item details...' : 'Đang tải thông tin vật phẩm...'}
            </span>
          </div>
        ) : error || !item ? (
          <div className="py-20 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
            <h3 className="text-base font-bold text-white mb-2">
              {isEn ? 'Item Not Found' : 'Không tìm thấy vật phẩm'}
            </h3>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase cursor-pointer"
            >
              {isEn ? 'Back to Items' : 'Quay lại'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* 3. Hero Item Card */}
            <div className={`p-3 sm:p-5 rounded-2xl bg-[#0e1320] border ${rarityStyle.border} ${rarityStyle.glow}`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
                {/* Item Icon */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#070a10] border ${rarityStyle.border} p-1.5 shrink-0 flex items-center justify-center shadow-lg`}>
                  <img
                    src={itemImg}
                    alt={itemName}
                    className="w-full h-full object-contain drop-shadow"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/items/I0038.png';
                    }}
                  />
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {item.itemCode}
                    </span>

                    {itemRarity && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rarityStyle.badge}`}>
                        {itemRarity}
                      </span>
                    )}

                    {Array.isArray(item.type) && item.type.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black font-heading text-white">
                    {itemName}
                  </h1>

                  {/* Description Box */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-[#070a10] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans text-left">
                    <LorMarkup text={itemDesc || (isEn ? 'No description available.' : 'Không có mô tả.')} />
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
                      const targetHash = champ.isRecommended ? 'synergies' : 'deck';

                      return (
                        <button
                          key={champKey}
                          type="button"
                          onClick={() => onNavigateChampion?.(champ.name || champ.championID, targetHash)}
                          title={`${champName}${champ.isDeck ? (isEn ? ' (Starting Deck)' : ' (Bộ Bài)') : champ.isRecommended ? (isEn ? ' (Recommended)' : ' (Khuyên Dùng)') : ''}`}
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
                          {champ.isDeck && (
                            <span
                              className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 ring-2 ring-black shadow-sm"
                              title={isEn ? 'Starting Deck' : 'Bộ Bài Khởi Đầu'}
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
                      ? 'No specific champion builds currently link to this item.'
                      : 'Chưa có tướng nào được liên kết cụ thể với vật phẩm này.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

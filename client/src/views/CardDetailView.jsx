import React, { useState, useEffect } from 'react';
import LorMarkup from '../components/LorMarkup';
import { useLanguage } from '../context/LanguageContext';
import { getRegionIconUrl } from '../utils/regionIcons';

// In-memory cache for card details (Rule 10)
const cardDetailCache = new Map();

function getRarityStyle(rarity) {
  const lower = (rarity || '').toLowerCase();
  if (lower.includes('champion') || lower.includes('tướng')) {
    return {
      badge: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]'
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

export default function CardDetailView({
  cardCode,
  onBack,
  onNavigateChampion,
  onSelectCard,
  onNavigateTab
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [card, setCard] = useState(() => cardDetailCache.get(cardCode) || null);
  const [loading, setLoading] = useState(!cardDetailCache.has(cardCode));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cardCode) return;

    if (cardDetailCache.has(cardCode)) {
      setCard(cardDetailCache.get(cardCode));
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchCard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/cards/${encodeURIComponent(cardCode)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        if (json.success && isMounted) {
          cardDetailCache.set(cardCode, json.data);
          setCard(json.data);
        } else if (isMounted) {
          setError(json.message || 'Card not found');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch card details:', err);
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCard();
    return () => {
      isMounted = false;
    };
  }, [cardCode]);

  // Scroll to top on card change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cardCode]);

  // Derived styling & data
  const cardName = isEn
    ? card?.translations?.en?.cardName || card?.cardName
    : card?.cardName || card?.translations?.en?.cardName;

  const rawRarity = (card?.rarity || card?.translations?.en?.rarity || '').toLowerCase();
  const cardRarityLabel = (() => {
    if (!rawRarity || rawRarity === 'none') return '';
    if (rawRarity.includes('champion') || rawRarity.includes('tướng') || rawRarity.includes('anh hùng')) {
      return isEn ? 'Champion' : 'Anh Hùng';
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

  const cardDesc = isEn
    ? card?.translations?.en?.descriptionRaw || card?.descriptionRaw
    : card?.descriptionRaw || card?.translations?.en?.descriptionRaw;

  const cardImg =
    card?.gameAbsolutePath ||
    card?.assetAbsolutePath ||
    `https://dd.b.pvp.net/latest/set1/en_us/img/cards/${cardCode}.png`;

  const compatibleChamps = card?.compatibleChampions || [];

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-6 py-2 sm:py-8">
        {/* 1. Top Bar: Back Button & Minimal Breadcrumb */}
        <div className="flex items-center justify-between pb-3 mb-4 sm:mb-6 border-b border-white/10 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={isEn ? 'Back to Cards List' : 'Quay lại danh sách lá bài'}
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
                href="/cards"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab ? onNavigateTab('cards') : onBack?.();
                }}
                className="hover:text-white transition-colors cursor-pointer text-[#8CC0EB]"
              >
                {isEn ? 'Cards List' : 'Danh Sách Lá Bài'}
              </a>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[360px]">
                {cardName || cardCode}
              </span>
            </nav>
          </div>
        </div>

        {/* 2. Main Content Body */}
        {loading && !card ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 border-2 border-[#8CC0EB] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400">
              {isEn ? 'Loading card details...' : 'Đang tải thông tin lá bài...'}
            </span>
          </div>
        ) : error || !card ? (
          <div className="py-20 text-center rounded-2xl bg-[#0e1320] border border-white/10 p-6">
            <h3 className="text-base font-bold text-white mb-2">
              {isEn ? 'Card Not Found' : 'Không tìm thấy lá bài'}
            </h3>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase cursor-pointer"
            >
              {isEn ? 'Back to Cards' : 'Quay lại'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* 3. Hero Card Details */}
            <div className={`p-3 sm:p-5 rounded-2xl bg-[#0e1320] border ${rarityStyle.border} ${rarityStyle.glow}`}>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                {/* LoR Card Artwork */}
                <div className="w-48 sm:w-56 shrink-0 flex items-center justify-center">
                  <img
                    src={cardImg}
                    alt={cardName}
                    className="w-full h-auto object-contain rounded-xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://dd.b.pvp.net/latest/set1/en_us/img/cards/01DE001.png';
                    }}
                  />
                </div>

                {/* Card Info & Stats */}
                <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {card.cardCode}
                    </span>

                    {cardRarityLabel && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rarityStyle.badge}`}>
                        {cardRarityLabel}
                      </span>
                    )}

                    {card.type && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300 uppercase">
                        {card.type}
                      </span>
                    )}

                    {Array.isArray(card.regions) && card.regions.map((reg) => {
                      const iconUrl = getRegionIconUrl(reg);
                      return (
                        <span
                          key={reg}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0b2545]/50 border border-white/15 text-[10px] font-semibold text-sky-200 capitalize"
                        >
                          {iconUrl && (
                            <img
                              src={iconUrl}
                              alt=""
                              aria-hidden="true"
                              className="w-3 h-3 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span>{reg}</span>
                        </span>
                      );
                    })}
                  </div>

                  <h1 className="text-xl sm:text-3xl font-black font-heading text-white">
                    {cardName}
                  </h1>

                  {/* Stats Badges */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    {card.cost !== undefined && (
                      <div className="px-3 py-1 rounded-xl bg-[#0b2545] border border-sky-500/30 text-sky-200 text-xs font-bold font-mono">
                        {card.cost} Mana
                      </div>
                    )}
                    {card.attack !== undefined && card.health !== undefined && (
                      <div className="px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-bold font-mono">
                        {card.attack} Công | {card.health} Máu
                      </div>
                    )}
                    {card.spellSpeed && (
                      <div className="px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-bold">
                        {card.spellSpeed}
                      </div>
                    )}
                  </div>

                  {/* Description Box */}
                  <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#070a10] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans text-left">
                    <LorMarkup text={cardDesc || (isEn ? 'No card description.' : 'Không có mô tả.')} />
                  </div>

                  {/* Keywords if available */}
                  {Array.isArray(card.keywords) && card.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1 justify-center md:justify-start">
                      {card.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3.5. LÁ BÀI LIÊN QUAN & BIẾN THỂ (associatedCards) */}
            {Array.isArray(card.associatedCards) && card.associatedCards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <h2 className="text-sm sm:text-base font-bold font-heading uppercase text-white tracking-wider">
                    {isEn ? 'Associated Cards' : 'Lá Bài Liên Quan'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#8CC0EB]/20 text-[#8CC0EB] border border-[#8CC0EB]/40">
                    {card.associatedCards.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {card.associatedCards.map((assoc) => {
                    const assocName = isEn
                      ? assoc.translations?.en?.cardName || assoc.cardName
                      : assoc.cardName;
                    const assocImg =
                      assoc.gameAbsolutePath ||
                      assoc.assetAbsolutePath ||
                      `https://dd.b.pvp.net/latest/set1/en_us/img/cards/${assoc.cardCode}.png`;
                    const assocRarityStyle = getRarityStyle(assoc.rarity);

                    return (
                      <a
                        key={assoc.cardCode}
                        href={`/card/${encodeURIComponent(assoc.cardCode)}`}
                        onClick={(e) => {
                          if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                            e.preventDefault();
                            onSelectCard?.(assoc.cardCode);
                          }
                        }}
                        className={`group relative flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-[#0e1320] hover:bg-[#141b2b] border ${assocRarityStyle.border} hover:border-[#8CC0EB]/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer select-none`}
                        title={`${assocName} (${assoc.cardCode})`}
                      >
                        {/* Artwork Thumbnail */}
                        <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-[#070a10] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <img
                            src={assocImg}
                            alt={assocName}
                            loading="lazy"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://dd.b.pvp.net/latest/set1/en_us/img/cards/01DE001.png';
                            }}
                          />
                        </div>

                        {/* Info Block */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-black/50 border border-white/10 text-[9px] font-mono text-slate-300 font-bold uppercase">
                              {assoc.cardCode}
                            </span>

                            {assoc.cost !== undefined && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-[#0b2545] text-sky-200 border border-white/10">
                                {assoc.cost}M
                              </span>
                            )}

                            {assoc.attack !== undefined && assoc.health !== undefined && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-amber-950/40 text-amber-200 border border-amber-500/20">
                                {assoc.attack}|{assoc.health}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold font-heading text-white group-hover:text-[#8CC0EB] transition-colors truncate">
                            {assocName}
                          </h3>

                          {assoc.type && (
                            <div className="text-[10px] text-slate-400 capitalize truncate">
                              {assoc.type} {assoc.spellSpeed ? `• ${assoc.spellSpeed}` : ''}
                            </div>
                          )}
                        </div>

                        <svg
                          className="w-4 h-4 text-slate-500 group-hover:text-[#8CC0EB] group-hover:translate-x-0.5 transition-all shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. TƯỚNG LIÊN QUAN (Chỉ danh sách avatar) */}
            <div className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold font-heading uppercase text-white tracking-wider">
                    {isEn ? 'Related Champions' : 'Tướng Liên Quan'}
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

                      return (
                        <button
                          key={champKey}
                          type="button"
                          onClick={() => onNavigateChampion?.(champ.name || champ.championID, 'deck')}
                          title={`${champName}${champ.isChampionCard ? (isEn ? ' (Champion)' : ' (Tướng Bản Thể)') : champ.isStartingDeck ? (isEn ? ' (Starting Deck)' : ' (Bộ Bài Khởi Đầu)') : ''}`}
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
                          {champ.isChampionCard && (
                            <span
                              className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 ring-2 ring-black shadow-sm"
                              title={isEn ? 'Champion' : 'Tướng Bản Thể'}
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
                      ? 'This card is not in any starting champion deck.'
                      : 'Lá bài này không thuộc bộ bài khởi đầu của tướng nào.'}
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

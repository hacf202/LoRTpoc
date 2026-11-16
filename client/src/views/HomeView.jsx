import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import SearchDropdown from '../components/SearchDropdown';
import ScrollFab from '../components/ScrollFab';
import { useLanguage } from '../context/LanguageContext';
import { handleImageError } from '../utils/imageFallback';

/**
 * Enhanced Landing Page / Home View
 * Features:
 * - Minimalist & atmospheric Hero section with fast search
 * - Comprehensive Database Portals divided into 4 structured categories
 *   covering all 17 collections from backup_rework_full_archive
 * - Strictly adhering to 3 breakpoints: Mobile (<640px), Tablet (640-1279px), PC (>=1280px)
 */
export default function HomeView({
  searchTerm,
  onSearchChange,
  onClearSearch,
  searchInputRef,
  dropdownRef,
  isDropdownOpen,
  setIsDropdownOpen,
  loading,
  results,
  onSelectChampion,
  onNavigateTab
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [isFocused, setIsFocused] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // Chỉ nâng thanh tìm kiếm khi ở trên cùng (chưa cuộn xuống) và đang focus / mở dropdown
  const isLifted = !isScrolledDown && (isDropdownOpen || isFocused || Boolean(searchTerm && searchTerm.trim()));

  // Quản lý trạng thái cuộn: tự động đóng dropdown và trả thanh tìm kiếm về bình thường khi cuộn xuống
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isDown = scrollY > 60;
      setIsScrolledDown(isDown);

      if (isDown) {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
        setIsFocused(false);
        if (searchInputRef?.current && document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDropdownOpen, setIsDropdownOpen, searchInputRef]);

  // 4 Structured Categories covering all data collections from backup_rework_full_archive
  const EXPLORE_GROUPS = [
    {
      groupId: 'champions',
      title: t('home.groups.champions'),
      accentBorder: 'border-amber-500/20',
      items: [
        {
          id: 'champions',
          image: 'https://images.lortpoc.com/avatarChampions/AurelionSol.webp',
          bgImage: 'https://images.lortpoc.com/backgrounds/1920px-01FR008T1-hd-full.webp',
          title: t('home.cards.champions.title'),
          desc: t('home.cards.champions.desc'),
          badge: t('home.cards.champions.badge'),
          gradient: 'from-amber-500/20 via-amber-900/10 to-transparent',
          borderHover: 'hover:border-[#8CC0EB]',
          textColor: 'group-hover:text-[#FFF9D2]'
        },
        {
          id: 'cards',
          image: 'https://dd.b.pvp.net/latest/set1/vi_vn/img/cards/01PZ040.png',
          bgImage: 'https://dd.b.pvp.net/latest/set1/vi_vn/img/cards/01PZ040.png',
          title: t('home.cards.cards.title'),
          desc: t('home.cards.cards.desc'),
          badge: t('home.cards.cards.badge'),
          gradient: 'from-cyan-500/20 via-cyan-900/10 to-transparent',
          borderHover: 'hover:border-[#8CC0EB]',
          textColor: 'group-hover:text-[#8CC0EB]'
        },
        {
          id: 'subChampions',
          image: 'https://dd.b.pvp.net/6_3_0/set1/vi_vn/img/cards/01DE012.png',
          bgImage: 'https://dd.b.pvp.net/6_3_0/set1/vi_vn/img/cards/01DE012-full.png',
          title: t('home.cards.subChampions.title'),
          desc: t('home.cards.subChampions.desc'),
          badge: t('home.cards.subChampions.badge'),
          gradient: 'from-blue-500/20 via-blue-900/10 to-transparent',
          borderHover: 'hover:border-blue-400',
          textColor: 'group-hover:text-blue-300'
        }
      ]
    },
    {
      groupId: 'equipment',
      title: t('home.groups.equipment'),
      accentBorder: 'border-sky-500/20',
      items: [
        {
          id: 'relics',
          image: 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png',
          bgImage: 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0001.png',
          title: t('home.cards.relics.title'),
          desc: t('home.cards.relics.desc'),
          badge: t('home.cards.relics.badge'),
          gradient: 'from-sky-500/20 via-sky-900/10 to-transparent',
          borderHover: 'hover:border-[#8CC0EB]',
          textColor: 'group-hover:text-[#8CC0EB]'
        },
        {
          id: 'powers',
          image: 'https://dd.b.pvp.net/7_11_0/adventure/vi_vn/img/powers/FP0000.png',
          bgImage: 'https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/P0302.png',
          title: t('home.cards.powers.title'),
          desc: t('home.cards.powers.desc'),
          badge: t('home.cards.powers.badge'),
          gradient: 'from-amber-500/20 via-orange-950/10 to-transparent',
          borderHover: 'hover:border-amber-400',
          textColor: 'group-hover:text-amber-300'
        },
        {
          id: 'items',
          image: 'https://dd.b.pvp.net/6_11_0/adventure/vi_vn/img/items/I0000.png',
          bgImage: 'https://images.lortpoc.com/items/I00001.webp',
          title: t('home.cards.items.title'),
          desc: t('home.cards.items.desc'),
          badge: t('home.cards.items.badge'),
          gradient: 'from-teal-500/20 via-teal-950/10 to-transparent',
          borderHover: 'hover:border-teal-400',
          textColor: 'group-hover:text-teal-300'
        },
        {
          id: 'runes',
          image: 'https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/P0059.png',
          bgImage: 'https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/P0073.png',
          title: t('home.cards.runes.title'),
          desc: t('home.cards.runes.desc'),
          badge: t('home.cards.runes.badge'),
          gradient: 'from-purple-500/20 via-purple-950/10 to-transparent',
          borderHover: 'hover:border-purple-400',
          textColor: 'group-hover:text-purple-300'
        },
        {
          id: 'bonusStars',
          image: 'https://images.lortpoc.com/icon/starIcon.webp',
          bgImage: 'https://images.lortpoc.com/icon/starIcon.webp',
          title: t('home.cards.bonusStars.title'),
          desc: t('home.cards.bonusStars.desc'),
          badge: t('home.cards.bonusStars.badge'),
          gradient: 'from-yellow-500/20 via-yellow-950/10 to-transparent',
          borderHover: 'hover:border-yellow-400',
          textColor: 'group-hover:text-yellow-300'
        }
      ]
    },
    {
      groupId: 'adventure',
      title: t('home.groups.adventure'),
      accentBorder: 'border-emerald-500/20',
      items: [
        {
          id: 'maps',
          image: 'https://images.lortpoc.com/backgrounds/1920px-01PZ008T2-full.webp',
          bgImage: 'https://images.lortpoc.com/backgrounds/1920px-01PZ008T2-full.webp',
          title: t('home.cards.maps.title'),
          desc: t('home.cards.maps.desc'),
          badge: t('home.cards.maps.badge'),
          gradient: 'from-emerald-500/20 via-emerald-950/10 to-transparent',
          borderHover: 'hover:border-emerald-400',
          textColor: 'group-hover:text-emerald-300'
        },
        {
          id: 'bosses',
          image: 'https://images.lortpoc.com/backgrounds/1920px-01IO043-full.webp',
          bgImage: 'https://images.lortpoc.com/backgrounds/1920px-01IO043-full.webp',
          title: t('home.cards.bosses.title'),
          desc: t('home.cards.bosses.desc'),
          badge: t('home.cards.bosses.badge'),
          gradient: 'from-rose-500/20 via-rose-950/10 to-transparent',
          borderHover: 'hover:border-rose-400',
          textColor: 'group-hover:text-rose-300'
        }
      ]
    },
    {
      groupId: 'meta',
      title: t('home.groups.meta'),
      accentBorder: 'border-fuchsia-500/20',
      items: [
        {
          id: 'tierlist',
          image: 'https://images.lortpoc.com/backgrounds/1920px-01FR008T1-hd-full.webp',
          bgImage: 'https://images.lortpoc.com/backgrounds/1920px-01FR008T1-hd-full.webp',
          title: t('home.cards.tierlist.title'),
          desc: t('home.cards.tierlist.desc'),
          badge: t('home.cards.tierlist.badge'),
          gradient: 'from-fuchsia-500/20 via-purple-950/10 to-transparent',
          borderHover: 'hover:border-fuchsia-400',
          textColor: 'group-hover:text-fuchsia-300'
        }
      ]
    }
  ];

  return (
    <div className="relative z-10 w-full flex flex-col items-center">
      {/* 1. Hero Viewport Section: Cân đối, tinh gọn & chuẩn xác trên Mobile (<640px) */}
      <section className="min-h-[75vh] sm:min-h-screen sm:h-screen w-full flex flex-col items-center justify-center px-2 sm:px-6 pt-6 pb-8 sm:pb-16 md:pb-20 snap-start">
        
        {/* Adaptive Lift Wrapper: Nâng nhẹ cụm khi focus hoặc tìm kiếm */}
        <div className={`w-full flex flex-col items-center transition-all duration-300 ease-out ${
          isLifted
            ? '-translate-y-[80px] sm:-translate-y-[140px] md:-translate-y-[180px]'
            : 'translate-y-0'
        }`}>
          {/* Main Header: Tỷ lệ vàng 2 dòng, không rớt chữ trên mobile */}
          <div className={`text-center select-none px-2 transition-all duration-300 ease-out origin-center -translate-y-2 sm:-translate-y-[16px] ${
            isLifted
              ? 'scale-85 sm:scale-75 md:scale-70 opacity-90 mb-3 sm:mb-5 -mt-6 sm:-mt-18 md:-mt-24'
              : 'scale-100 opacity-100 mb-5 sm:mb-12 md:mb-14 mt-0 sm:-mt-8 md:-mt-16'
          }`}>
            <h1 className="text-3xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase text-white tracking-tight sm:tracking-normal drop-shadow-[0_4px_45px_rgba(0,0,0,0.98)] leading-tight sm:leading-[0.92] space-y-0.5 sm:space-y-2">
              <span className="block whitespace-nowrap">{t('hero.titleLine1')}</span>
              <span className="block whitespace-nowrap text-white/95">{t('hero.titleLine2')}</span>
            </h1>
          </div>

          {/* Search Bar Container */}
          <div className="w-full max-w-[660px]">
            <div className="relative w-full">
              <SearchBar
                ref={searchInputRef}
                value={searchTerm}
                onChange={onSearchChange}
                onClear={onClearSearch}
                onFocus={() => {
                  setIsFocused(true);
                  if (searchTerm.trim() && (results.flat?.length > 0 || results.total > 0 || results.length > 0)) {
                    setIsDropdownOpen(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (document.activeElement !== searchInputRef?.current) {
                      setIsFocused(false);
                    }
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const firstItem = (results?.flat && results.flat.length > 0)
                      ? results.flat[0]
                      : (Array.isArray(results) && results.length > 0 ? results[0] : null);
                    if (firstItem) {
                      onSelectChampion?.(firstItem);
                    }
                  }
                }}
                placeholder={t('hero.searchPlaceholder')}
              />

              <SearchDropdown
                ref={dropdownRef}
                isOpen={isDropdownOpen}
                loading={loading}
                results={results}
                searchTerm={searchTerm}
                onSelect={onSelectChampion}
              />
            </div>

            {/* Quick Category Chips: Cân bằng không gian phía dưới search bar trên mobile */}
            <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-5 px-1 select-none">
              <span className="text-[11px] sm:text-xs text-slate-400 font-semibold mr-0.5">
                {t('hero.quickTagsLabel') || 'Gợi ý'}:
              </span>
              {[
                { id: 'champions', label: t('nav.champions') || 'Tướng' },
                { id: 'relics', label: t('nav.relics') || 'Cổ Vật' },
                { id: 'powers', label: t('nav.powers') || 'Sức Mạnh' },
                { id: 'items', label: t('nav.items') || 'Vật Phẩm' },
                { id: 'cards', label: t('nav.cards') || 'Lá Bài' },
                { id: 'tierlist', label: t('nav.tierlist') || 'Bảng Xếp Hạng' }
              ].map((tag) => (
                <a
                  key={tag.id}
                  href={`/${tag.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateTab(tag.id);
                  }}
                  className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#121929]/80 hover:bg-[#1a253c] border border-white/15 hover:border-[#8CC0EB] text-[11px] sm:text-xs text-slate-300 hover:text-white transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                >
                  {tag.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Comprehensive Explore Section with 4 Categorized Groups */}
      <section id="explore" className="w-full max-w-7xl mx-auto px-2 sm:px-6 xl:px-8 pt-8 sm:pt-20 pb-12 sm:pb-24 space-y-8 sm:space-y-16 snap-start">
        
        {/* Compact Section Header: 1 Dòng KHÁM PHÁ THÊM nổi bật */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#8CC0EB]/30 to-[#8CC0EB]/50 flex-1 max-w-xs sm:max-w-sm" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-[#FFF9D2] drop-shadow-[0_2px_15px_rgba(140,192,235,0.25)] select-none">
            {t('home.exploreMore')}
          </h2>
          <div className="h-px bg-gradient-to-l from-transparent via-[#8CC0EB]/30 to-[#8CC0EB]/50 flex-1 max-w-xs sm:max-w-sm" />
        </div>

        {/* 4 Categorized Hub Groups */}
        {EXPLORE_GROUPS.map((group) => (
          <div key={group.groupId} className="space-y-4 sm:space-y-6">
            
            {/* Group Header */}
            <div className="pb-2.5 sm:pb-3 border-b border-white/10">
              <h3 className="text-base sm:text-xl font-extrabold uppercase text-white tracking-wide">
                {group.title}
              </h3>
            </div>

            {/* Group Cards Grid: 2 columns on Mobile (<640px) */}
            <div className={`grid gap-2 sm:gap-5 ${
              group.groupId === 'equipment'
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4'
                : group.groupId === 'champions'
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3'
                : group.groupId === 'adventure'
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {group.items.map((item) => {
                const targetPath = item.id === 'runes' ? '/powers' : item.id === 'bonusStars' ? '/champions' : `/${item.id}`;
                const targetTab = item.id === 'runes' ? 'powers' : item.id === 'bonusStars' ? 'champions' : item.id;
                return (
                  <a
                    key={item.id}
                    href={targetPath}
                    onClick={(e) => {
                      if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                        e.preventDefault();
                        onNavigateTab(targetTab);
                      }
                    }}
                    className={`group relative flex flex-col p-2 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer border border-white/15 bg-[#0e1320] hover:bg-[#141b2b] ${item.borderHover} transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-2xl overflow-hidden ${
                      group.items.length === 1 ? 'col-span-2 sm:col-span-1' : ''
                    }`}
                  >
                  {/* Subtle Background Art Overlay */}
                  {item.bgImage && (
                    <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl pointer-events-none z-0">
                      <img
                        src={item.bgImage}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-center opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-[#0e1320]/80" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      {/* Top: Real Game Image Asset & Badge with high-contrast styling */}
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="w-9 h-9 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center transition-all duration-300">
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain object-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => handleImageError(e, 'default')}
                          />
                        </div>
                        <span className="text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#161d2d] text-white border border-white/15 shadow-sm">
                          {item.badge}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h4 className={`text-xs sm:text-lg font-extrabold text-white mb-1 transition-colors ${item.textColor} truncate`}>
                        {item.title}
                      </h4>

                      {/* Card Description */}
                      <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
            </div>
          </div>
        ))}
      </section>

      {/* Floating Action Button (FAB): Smooth Scroll Down to Explore & Back to Top */}
      <ScrollFab targetId="explore" />
    </div>
  );
}
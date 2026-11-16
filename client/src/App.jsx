import React, { useState, useEffect, useRef, useCallback } from 'react';
import BackgroundHero from './components/BackgroundHero';
import Navbar from './components/Navbar';
import EntityDetailModal from './components/EntityDetailModal';
import SEOHead from './components/SEOHead';
import { getGlobalKeywords, getChampionKeywords, getTabKeywords } from './utils/seoKeywords';
import { toChampionSlug } from './utils/slug';
import HomeView from './views/HomeView';
import ChampionsView from './views/ChampionsView';
import ChampionDetailView from './views/ChampionDetailView';
import RelicsView from './views/RelicsView';
import RelicDetailView from './views/RelicDetailView';
import PowersView from './views/PowersView';
import PowerDetailView from './views/PowerDetailView';
import ItemsView from './views/ItemsView';
import ItemDetailView from './views/ItemDetailView';
import CardsView from './views/CardsView';
import CardDetailView from './views/CardDetailView';
import MapsView from './views/MapsView';
import MapDetailView from './views/MapDetailView';
import TierListView from './views/TierListView';
import AdminView from './views/AdminView';
import NotFoundView from './views/NotFoundView';
import ErrorBoundary from './components/ErrorBoundary';
import { useLanguage } from './context/LanguageContext';
import { useUrlFilters } from './hooks/useUrlFilters';

export default function App() {
  const { language, t } = useLanguage();
  const [filters, updateFilters] = useUrlFilters();

  const activeTab = filters.tab || 'home';
  const searchTerm = filters.q;
  const selectedRegion = filters.region;
  const selectedStars = filters.stars;
  const sortBy = filters.sort;

  const [results, setResults] = useState({ total: 0, flat: [], categories: {} });
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState('relic');

  // All champions state for the full roster
  const [allChampions, setAllChampions] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [championDetailLoading, setChampionDetailLoading] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch compact champions list for the roster (reduces payload by 94%)
  const fetchAllChampions = useCallback(async () => {
    try {
      setRosterLoading(true);
      const res = await fetch(
        `/api/v1/champions?fields=name,cardCode,championID,cost,regions,maxStar,tier,assets,translations&_t=${Date.now()}`,
        { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAllChampions(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch champions roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllChampions();

    // Lắng nghe sự kiện cập nhật dữ liệu từ trang quản trị Admin để tự động làm mới đồng bộ
    const handleDataUpdated = () => {
      fetchAllChampions();
    };

    window.addEventListener('poc-data-updated', handleDataUpdated);
    return () => {
      window.removeEventListener('poc-data-updated', handleDataUpdated);
    };
  }, [fetchAllChampions]);

  // Fetch on-demand champion details
  const loadChampionDetails = useCallback(async (champ) => {
    if (!champ) {
      setChampionDetailLoading(false);
      return;
    }

    // If champ already has full details (relicSets, constellation, resolvedRelics), set immediately
    if (champ.relicSets && champ.constellation && champ.resolvedRelics) {
      setSelectedChampion(champ);
      setChampionDetailLoading(false);
      return;
    }

    setChampionDetailLoading(true);
    setSelectedChampion(champ);
    const startTime = performance.now();
    try {
      const targetId = champ.championID || champ.cardCode || champ.name;
      const res = await fetch(
        `/api/v1/champions/${encodeURIComponent(targetId)}?_t=${Date.now()}`,
        { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }
      );
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, 380 - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSelectedChampion(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load full champion details:', err);
    } finally {
      setChampionDetailLoading(false);
    }
  }, []);

  // Synchronize hierarchical /champion/:name URL with selectedChampion state
  useEffect(() => {
    if (!filters.champion) {
      if (selectedChampion) setSelectedChampion(null);
      setChampionDetailLoading(false);
      return;
    }

    const targetParam = filters.champion.trim().toLowerCase();
    const targetSlug = toChampionSlug(targetParam);
    const targetNorm = targetSlug.replace(/-/g, '');

    // If already displaying this champion with full details, don't re-fetch
    if (
      selectedChampion &&
      selectedChampion.relicSets &&
      ((selectedChampion.championID && selectedChampion.championID.toLowerCase() === targetParam) ||
        (selectedChampion.cardCode && selectedChampion.cardCode.toLowerCase() === targetParam) ||
        (selectedChampion.name && selectedChampion.name.toLowerCase() === targetParam) ||
        (selectedChampion.translations?.en?.name && selectedChampion.translations.en.name.toLowerCase() === targetParam) ||
        toChampionSlug(selectedChampion.name) === targetSlug ||
        toChampionSlug(selectedChampion.translations?.en?.name) === targetSlug ||
        (targetNorm && (
          toChampionSlug(selectedChampion.name).replace(/-/g, '') === targetNorm ||
          toChampionSlug(selectedChampion.translations?.en?.name).replace(/-/g, '') === targetNorm ||
          (selectedChampion.championID && selectedChampion.championID.toLowerCase() === targetNorm) ||
          (selectedChampion.cardCode && selectedChampion.cardCode.toLowerCase() === targetNorm)
        )))
    ) {
      setChampionDetailLoading(false);
      return;
    }

    const found = allChampions.find(
      (c) =>
        (c.championID && c.championID.toLowerCase() === targetParam) ||
        (c.cardCode && c.cardCode.toLowerCase() === targetParam) ||
        (c.name && c.name.toLowerCase() === targetParam) ||
        (c.translations?.en?.name && c.translations.en.name.toLowerCase() === targetParam) ||
        toChampionSlug(c.name) === targetSlug ||
        toChampionSlug(c.translations?.en?.name) === targetSlug ||
        (targetNorm && (
          toChampionSlug(c.name).replace(/-/g, '') === targetNorm ||
          toChampionSlug(c.translations?.en?.name).replace(/-/g, '') === targetNorm ||
          (c.championID && c.championID.toLowerCase() === targetNorm) ||
          (c.cardCode && c.cardCode.toLowerCase() === targetNorm)
        ))
    );

    if (found) {
      loadChampionDetails(found);
    } else {
      setChampionDetailLoading(true);
      const startTime = performance.now();
      fetch(`/api/v1/champions/${encodeURIComponent(filters.champion)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(async (data) => {
          const elapsed = performance.now() - startTime;
          const remaining = Math.max(0, 380 - elapsed);
          if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

          if (data?.success && data?.data) {
            setSelectedChampion(data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load champion from URL:', err);
        })
        .finally(() => {
          setChampionDetailLoading(false);
        });
    }
  }, [filters.champion, allChampions, loadChampionDetails]);

  // Keyboard shortcut listener (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !searchInputRef.current?.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query for instant omnisearch dropdown with abort controller
  useEffect(() => {
    const cleanQuery = searchTerm.trim();
    // Khi rỗng thì xóa kết quả và đóng dropdown
    if (!cleanQuery) {
      setResults({ total: 0, flat: [], categories: {} });
      setIsDropdownOpen(false);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    // Debounce 300ms để người dùng nhập liên tục không bị spam request
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search/omni?q=${encodeURIComponent(cleanQuery)}&limit=15`, {
          signal: abortController.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setResults(data.data || { total: 0, flat: [], categories: {} });
            setIsDropdownOpen(true);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Omnisearch request failed:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchTerm]);

  const handleSelectOmniItem = (item) => {
    if (!item) return;
    setIsDropdownOpen(false);

    if (item.type === 'nav') {
      handleNavigateTab(item.targetTab);
      return;
    }

    if (item.type === 'champion' || (!item.type && (item.championID || item.cardCode))) {
      handleSelectChampion(item.raw || item);
    } else if (item.type === 'relic' || item.relicCode || item.raw?.relicCode) {
      const code = item.raw?.relicCode || item.relicCode || item.code || item.id;
      updateFilters({ relic: code, champion: '', power: '', item: '', card: '', map: '', hash: '' }, { push: true });
    } else if (item.type === 'power' || item.powerCode || item.raw?.powerCode) {
      const code = item.raw?.powerCode || item.powerCode || item.code || item.id;
      updateFilters({ power: code, champion: '', relic: '', item: '', card: '', map: '', hash: '' }, { push: true });
    } else if (item.type === 'item' || item.itemCode || item.raw?.itemCode) {
      const code = item.raw?.itemCode || item.itemCode || item.code || item.id;
      updateFilters({ item: code, champion: '', relic: '', power: '', card: '', map: '', hash: '' }, { push: true });
    } else if (item.type === 'card' || item.cardCode || item.raw?.cardCode) {
      const code = item.raw?.cardCode || item.cardCode || item.code || item.id;
      updateFilters({ card: code, champion: '', relic: '', power: '', item: '', map: '', hash: '' }, { push: true });
    } else if (item.type === 'map' || item.adventureID || item.raw?.adventureID) {
      const code = item.raw?.adventureID || item.adventureID || item.code || item.id;
      updateFilters({ map: code, champion: '', relic: '', power: '', item: '', card: '', hash: '' }, { push: true });
    } else {
      setSelectedEntity(item.raw || item);
      setSelectedEntityType(item.type || 'relic');
    }
  };

  const handleSelectChampion = useCallback((champ) => {
    if (!champ) return;
    setIsDropdownOpen(false);

    // Update URL to match current champion for direct sharing & SEO (e.g. /champion/ahri-chieu-hon-thien-ho#relics)
    const champKey = toChampionSlug(champ);
    const currentHash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
    const hash = currentHash || 'relics';
    updateFilters(
      { champion: champKey, hash, relic: '', power: '', item: '', card: '', map: '' },
      { isModal: true }
    );
    loadChampionDetails(champ);
  }, [updateFilters, loadChampionDetails]);

  const handleCloseModal = useCallback(() => {
    setSelectedChampion(null);
    if (typeof window !== 'undefined' && window.history.state?.isModal) {
      window.history.back();
    } else {
      updateFilters({ champion: '', hash: '' });
    }
  }, [updateFilters]);

  // Clean Tab Navigation (Rule 4 & Strict Token Discipline: drops foreign filters when switching tabs)
  const handleNavigateTab = useCallback((targetTab) => {
    updateFilters((prev) => ({
      tab: targetTab,
      q: '',
      region: 'all',
      regions: '',
      stars: 'all',
      costs: '',
      cost: '',
      tags: '',
      rarity: '',
      rarities: '',
      type: '',
      types: '',
      sort: targetTab === 'cards' ? 'cost-asc' : 'name-asc',
      page: 1,
      limit: 24,
      champion: '',
      relic: '',
      power: '',
      item: '',
      card: '',
      map: '',
      hash: '',
      adminModule: targetTab === 'admin' ? (prev.adminModule || 'overview') : 'overview',
      adminChampion: ''
    }), { push: true });
  }, [updateFilters]);

  const clearSearch = () => {
    updateFilters({ q: '' });
    setResults([]);
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  const handleResetFilters = () => {
    updateFilters({ q: '', region: 'all', stars: 'all', sort: 'name-asc' });
    setResults([]);
    setIsDropdownOpen(false);
  };

  // Compute Dynamic SEO Metadata based on Tab, Champion, and Language
  const getSeoData = () => {
    const isEn = language === 'en';

    if (selectedChampion) {
      const champName = isEn && selectedChampion.translations?.en?.name
        ? selectedChampion.translations.en.name
        : selectedChampion.name;
      const regionsStr = Array.isArray(selectedChampion.regions)
        ? selectedChampion.regions.map((r) => t(`regions.${r}`) || r).join(', ')
        : 'Runeterra';
      const stars = selectedChampion.maxStar || 3;
      const tierShort = selectedChampion.tier ? selectedChampion.tier.split('//')[0].trim() : null;
      const tierPart = tierShort ? ` (${tierShort} Tier)` : '';
      const image =
        selectedChampion.assets?.[0]?.gameAbsolutePath ||
        selectedChampion.assets?.[0]?.avatar ||
        '/assets/hero-bg.jpg';

      const title = isEn
        ? `${champName} Guide - Best Relics, Constellation & Star Powers (${stars}★${tierPart})`
        : `${champName} - Cẩm Nang Tướng, Sức Mạnh Sao, Chòm Sao & Cổ Vật Tối Ưu (${stars}★${tierPart})`;

      const description = isEn
        ? `Complete Path of Champions guide for ${champName} (${regionsStr}). Detailed constellation powers, star powers, relic loadouts, and encounter strategies.`
        : `Cẩm nang chuyên sâu vị tướng ${champName} (${regionsStr}) trong Con Đường Anh Hùng. Khám phá sức mạnh sao, cây chòm sao và gợi ý cổ vật tối ưu nhất.`;

      const keywords = getChampionKeywords(selectedChampion, language);
      const champSlug = selectedChampion.championID || selectedChampion.name;
      const url = `https://lortpoc.com/champion/${encodeURIComponent(champSlug)}`;

      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: isEn ? 'Home' : 'Trang Chủ',
                item: 'https://lortpoc.com/'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: isEn ? 'Champions' : 'Tướng',
                item: 'https://lortpoc.com/?tab=champions'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: champName,
                item: url
              }
            ]
          },
          {
            '@type': 'ItemPage',
            mainEntity: {
              '@type': 'VideoGameCharacter',
              name: champName,
              description: description,
              image: image,
              genre: 'Legends of Runeterra'
            }
          }
        ]
      };

      return { title, description, image, keywords, url, jsonLd, type: 'article' };
    }

    switch (activeTab) {
      case 'champions':
        return {
          title: isEn
            ? 'Champions Roster (89 Heroes) - Tier List & Builds'
            : 'Danh Sách 89 Vị Tướng Con Đường Anh Hùng - Xếp Hạng & Sức Mạnh',
          description: isEn
            ? 'Browse all 89 champions in LoR: The Path of Champions. Filter by region, star rating, optimal relics, and tier list ranking.'
            : 'Tra cứu toàn bộ 89 tướng trong Con Đường Anh Hùng. Lọc theo vùng đất Runeterra, cấp sao tối đa, cổ vật tối ưu và thứ hạng sức mạnh.',
          image: allChampions[0]?.assets?.[0]?.gameAbsolutePath || allChampions[0]?.assets?.[0]?.avatar || 'https://lortpoc.com/home-hero.webp',
          keywords: getTabKeywords('champions', language),
          url: 'https://lortpoc.com/?tab=champions'
        };
      case 'relics':
        return {
          title: isEn
            ? 'Relics Database (155 Items) - Common, Rare & Epic'
            : 'Danh Sách Cổ Vật Con Đường Anh Hùng (155 Cổ Vật) - Thường, Hiếm & Sử Thi',
          description: isEn
            ? 'Explore all 155 common, rare, and epic relics in The Path of Champions with full stat breakdown and best champion synergies.'
            : 'Khám phá 155 cổ vật Thường, Hiếm và Sử Thi trong Con Đường Anh Hùng cùng hiệu ứng gia tăng sức mạnh và gợi ý tướng phù hợp.',
          image: 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png',
          keywords: getTabKeywords('relics', language),
          url: 'https://lortpoc.com/?tab=relics'
        };
      case 'powers':
        return {
          title: isEn
            ? 'Powers Database (1,196 Powers) - Star Powers & Blessings'
            : 'Danh Sách Sức Mạnh Con Đường Anh Hùng (1,196 Sức Mạnh) - Sức Mạnh Sao & Nội Tại',
          description: isEn
            ? 'Complete database of 1,196 star powers, encounter blessings, and enemy abilities in Legends of Runeterra: The Path of Champions.'
            : 'Hệ thống tra cứu 1,196 sức mạnh sao, bổng lộc phiêu lưu và nội tại của kẻ địch trong Con Đường Anh Hùng.',
          image: 'https://dd.b.pvp.net/7_11_0/adventure/vi_vn/img/powers/FP0000-full.png',
          keywords: getTabKeywords('powers', language),
          url: 'https://lortpoc.com/?tab=powers'
        };
      case 'items':
        return {
          title: isEn
            ? 'Card Items Database (187 Items) - Equipment & Stats'
            : 'Danh Sách Vật Phẩm Thẻ Bài (187 Items) - Trang Bị & Hiệu Ứng',
          description: isEn
            ? 'Explore 187 items attachable to cards, spells, and equipment in The Path of Champions with synergized champions.'
            : 'Khám phá 187 vật phẩm trang bị gắn vào bài quân và phép thuật trong Con Đường Anh Hùng.',
          image: 'https://dd.b.pvp.net/6_11_0/adventure/vi_vn/img/items/I0000.png',
          keywords: getTabKeywords('items', language),
          url: 'https://lortpoc.com/?tab=items'
        };
      case 'cards':
        return {
          title: isEn
            ? 'Cards Database (2,686 Cards) - Champions, Spells & Units'
            : 'Thư Viện Lá Bài Runeterra (2,686 Lá Bài) - Tướng & Phép Thuật',
          description: isEn
            ? 'Explore all 2,686 collectible cards and spells in Legends of Runeterra with high-resolution card artwork.'
            : 'Tra cứu toàn bộ 2,686 lá bài quân, phép thuật và địa danh trong Huyền Thoại Runeterra với ảnh gốc sắc nét.',
          image: 'https://dd.b.pvp.net/7_3_0/set1/vi_vn/img/cards/01DE001.png',
          keywords: getTabKeywords('cards', language),
          url: 'https://lortpoc.com/?tab=cards'
        };
      case 'tierlist':
        return {
          title: isEn
            ? 'Champion Tier List (S+ to C Tier) - Meta Power Rankings'
            : 'Bảng Xếp Hạng Tướng Con Đường Anh Hùng (Tier S+ đến C) - Meta Mới Nhất',
          description: isEn
            ? 'Latest community and meta power rankings for all 89 champions in The Path of Champions. Discover the strongest champions in the current patch.'
            : 'Bảng xếp hạng sức mạnh và phân bậc meta từ S+ đến C của 89 tướng trong Con Đường Anh Hùng. Tìm kiếm vị tướng mạnh nhất phiên bản hiện tại.',
          image: 'https://images.lortpoc.com/backgrounds/1920px-01FR008T1-hd-full.webp',
          keywords: getTabKeywords('tierlist', language),
          url: 'https://lortpoc.com/?tab=tierlist'
        };
      case 'maps':
        return {
          title: isEn
            ? 'Adventures & Boss Guides (48 Maps & 338 Bosses)'
            : 'Cuộc Phiêu Lưu & Trùm Con Đường Anh Hùng (48 Bản Đồ & 338 Trùm)',
          description: isEn
            ? 'Guide to all 48 world adventures, nightmare weekly maps, and 338 boss encounters in The Path of Champions.'
            : 'Cẩm nang 48 cuộc phiêu lưu, bản đồ Ác Mộng và hướng dẫn khắc chế 338 trùm nguy hiểm trong Con Đường Anh Hùng.',
          image: 'https://images.lortpoc.com/backgrounds/zoe.webp',
          keywords: getTabKeywords('maps', language),
          url: 'https://lortpoc.com/?tab=maps'
        };
      case 'admin':
        if (filters.adminChampion) {
          const isNew = filters.adminChampion === 'new';
          return {
            title: isNew
              ? (isEn ? 'Create New Champion - Admin Portal' : 'Thêm Tướng Mới - Quản Trị Hệ Thống')
              : (isEn ? `Edit ${filters.adminChampion} - Admin Portal` : `Chỉnh Sửa ${filters.adminChampion} - Quản Trị Hệ Thống`),
            description: isEn ? 'PoC Guide Content Management System' : 'Hệ thống quản trị nội dung PoC Guide',
            keywords: 'poc admin cms, edit champion, poc guide admin',
            robots: 'noindex, nofollow'
          };
        }
        if (filters.adminModule && filters.adminModule !== 'overview') {
          const modLabel = filters.adminModule.charAt(0).toUpperCase() + filters.adminModule.slice(1);
          return {
            title: isEn ? `${modLabel} - Admin Portal` : `Quản Trị ${modLabel} - PoC Guide CMS`,
            description: isEn ? 'PoC Guide Content Management System' : 'Hệ thống quản trị nội dung PoC Guide',
            keywords: 'poc admin cms, poc guide admin',
            robots: 'noindex, nofollow'
          };
        }
        return {
          title: isEn ? 'Admin Portal - PoC Guide CMS' : 'Cổng Quản Trị Hệ Thống - PoC Guide CMS',
          description: isEn ? 'PoC Guide Content Management System' : 'Hệ thống quản trị nội dung PoC Guide',
          keywords: 'poc admin cms, poc guide admin',
          robots: 'noindex, nofollow'
        };
      default:
        return {
          title: isEn
            ? 'The Path of Champions Guide - Strategy, Builds & Database'
            : 'The Path of Champions Guide - Cẩm Nang Con Đường Anh Hùng LoR',
          description: isEn
            ? 'Comprehensive database and strategy guide for Legends of Runeterra: The Path of Champions. Explore 89 champions, 155 relics, 1,196 powers, and adventures.'
            : 'Hệ thống tra cứu chuyên sâu toàn bộ 89 tướng, 155 cổ vật, 1,196 sức mạnh và bảng xếp hạng meta Con Đường Anh Hùng.',
          image: 'https://lortpoc.com/home-hero.webp',
          keywords: getGlobalKeywords(language),
          url: 'https://lortpoc.com/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': 'https://lortpoc.com/#website',
                url: 'https://lortpoc.com/',
                name: 'The Path of Champions Guide',
                description: isEn
                  ? 'Comprehensive strategy and database for LoR: The Path of Champions'
                  : 'Cẩm nang và cơ sở dữ liệu chuyên sâu Con Đường Anh Hùng - Legends of Runeterra',
                inLanguage: ['vi', 'en'],
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://lortpoc.com/?q={search_term_string}'
                  },
                  'query-input': 'required name=search_term_string'
                }
              },
              {
                '@type': 'VideoGame',
                '@id': 'https://lortpoc.com/#game',
                name: 'Legends of Runeterra: The Path of Champions',
                genre: ['Digital Card Game', 'Roguelike Deckbuilder'],
                gamePlatform: ['PC', 'Android', 'iOS']
              }
            ]
          }
        };
    }
  };

  const seoData = getSeoData();

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#07090e] font-sans">
      {/* 0. Dynamic SEO Head Manager (rendered when not in child view that manages its own SEO) */}
      {!filters.relic && !filters.power && !filters.item && !filters.card && !filters.map && (
        <SEOHead
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          image={seoData.image}
          url={seoData.url}
          jsonLd={seoData.jsonLd}
          type={seoData.type || 'website'}
          lang={language}
          robots={seoData.robots}
        />
      )}

      {/* 1. Hero Background Layer (Đen dần 3/4 từ dưới lên cho các trang phụ, ẩn ở trang Admin CMS) */}
      {activeTab !== 'admin' && (
        <BackgroundHero
          isSubpage={activeTab !== 'home' || Boolean(selectedChampion || filters.champion)}
          imageUrl={
            selectedChampion?.assets?.[0]?.fullAbsolutePath ||
            selectedChampion?.assets?.[0]?.gameAbsolutePath ||
            undefined
          }
        />
      )}

      {/* 2. Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        onLogoClick={() => handleNavigateTab('home')}
      />

      {/* 3. Page View Routing */}
      {/* 3.0.1 Dedicated Full-Page Relic Detail View (/relic/:code) */}
      {filters.relic ? (
        <RelicDetailView
          relicCode={filters.relic}
          onBack={() => {
            if (typeof window !== 'undefined' && window.history.state?.isModal) {
              window.history.back();
            } else {
              updateFilters({ relic: '', hash: '' });
            }
          }}
          onNavigateChampion={(champKey) => updateFilters({ champion: toChampionSlug(champKey), hash: 'relics', relic: '', power: '', item: '', card: '' }, { push: true })}
          onSelectRelic={(code) => updateFilters({ relic: code, hash: '' }, { push: true })}
          onNavigateTab={handleNavigateTab}
          currentHash={filters.hash}
          onHashChange={(newHash) => updateFilters({ hash: newHash }, { push: false })}
        />
      ) : filters.power ? (
        <PowerDetailView
          powerCode={filters.power}
          onBack={() => {
            if (typeof window !== 'undefined' && window.history.state?.isModal) {
              window.history.back();
            } else {
              updateFilters({ power: '', hash: '' });
            }
          }}
          onNavigateChampion={(champKey, targetHash) => updateFilters({ champion: toChampionSlug(champKey), hash: targetHash || 'constellation', power: '', relic: '', item: '', card: '' }, { push: true })}
          onNavigateTab={handleNavigateTab}
          currentHash={filters.hash}
          onHashChange={(newHash) => updateFilters({ hash: newHash }, { push: false })}
        />
      ) : filters.item ? (
        <ItemDetailView
          itemCode={filters.item}
          onBack={() => {
            if (typeof window !== 'undefined' && window.history.state?.isModal) {
              window.history.back();
            } else {
              updateFilters({ item: '' });
            }
          }}
          onNavigateChampion={(champKey, targetHash) => updateFilters({ champion: toChampionSlug(champKey), hash: targetHash || 'synergies', item: '', relic: '', power: '', card: '' }, { push: true })}
          onNavigateTab={handleNavigateTab}
        />
      ) : filters.card ? (
        <CardDetailView
          cardCode={filters.card}
          onBack={() => {
            if (typeof window !== 'undefined' && window.history.state?.isModal) {
              window.history.back();
            } else {
              updateFilters({ card: '' });
            }
          }}
          onNavigateChampion={(champKey) => updateFilters({ champion: toChampionSlug(champKey), hash: 'deck', card: '', relic: '', power: '', item: '' }, { push: true })}
          onSelectCard={(code) => updateFilters({ card: code }, { push: true })}
          onNavigateTab={handleNavigateTab}
        />
      ) : filters.map ? (
        <MapDetailView
          mapId={filters.map}
          onBack={() => {
            if (typeof window !== 'undefined' && window.history.state?.isModal) {
              window.history.back();
            } else {
              updateFilters({ map: '' });
            }
          }}
          onNavigateChampion={(champKey) => updateFilters({ champion: toChampionSlug(champKey), map: '', relic: '', power: '', item: '', card: '' }, { push: true })}
          onNavigateTab={handleNavigateTab}
        />
      ) : (selectedChampion || Boolean(filters.champion && filters.champion.trim())) ? (
        <ChampionDetailView
          champion={selectedChampion}
          loading={championDetailLoading || !selectedChampion?.relicSets}
          onBack={handleCloseModal}
          onNavigate={handleNavigateTab}
          currentHash={filters.hash}
          onHashChange={(newHash) => updateFilters({ hash: newHash }, { push: false })}
          onSelectRelic={(code) => updateFilters({ relic: code, champion: '', hash: '' }, { push: true })}
          onSelectPower={(powerCode) => updateFilters({ power: powerCode, champion: '', hash: '' }, { push: true })}
          onSelectItem={(itemCode) => updateFilters({ item: itemCode, champion: '', hash: '' }, { push: true })}
          onSelectCard={(cardCode) => updateFilters({ card: cardCode, champion: '', hash: '' }, { push: true })}
        />
      ) : (
        <ErrorBoundary onNavigateTab={handleNavigateTab}>
          {/* 3.1 Landing Page (Home View) */}
          {activeTab === 'home' && (
            <HomeView
              searchTerm={searchTerm}
              onSearchChange={(q) => updateFilters({ q })}
              onClearSearch={clearSearch}
              searchInputRef={searchInputRef}
              dropdownRef={dropdownRef}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              loading={loading}
              results={results}
              onSelectChampion={handleSelectOmniItem}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {/* 3.2 Dedicated Champions Page */}
          {activeTab === 'champions' && (
            <ChampionsView
              filters={filters}
              updateFilters={updateFilters}
              onSelectChampion={handleSelectChampion}
            />
          )}

          {/* 3.3 Dedicated Relics Page */}
          {activeTab === 'relics' && (
            <RelicsView
              filters={filters}
              updateFilters={updateFilters}
              onSelectRelic={(relicCode) => updateFilters({ relic: relicCode }, { push: true })}
            />
          )}

          {/* 3.4 Dedicated Powers Page */}
          {activeTab === 'powers' && (
            <PowersView
              filters={filters}
              updateFilters={updateFilters}
              onSelectPower={(powerCode) => updateFilters({ power: powerCode }, { push: true })}
            />
          )}

          {/* 3.5 Dedicated Items Page */}
          {activeTab === 'items' && (
            <ItemsView
              filters={filters}
              updateFilters={updateFilters}
              onSelectItem={(item) => {
                const code = item.itemCode || item.name;
                updateFilters({ item: code }, { push: true });
              }}
            />
          )}

          {/* 3.6 Dedicated Cards Page */}
          {activeTab === 'cards' && (
            <CardsView
              filters={filters}
              updateFilters={updateFilters}
              onSelectCard={(card) => {
                const code = card.cardCode || card.cardName;
                updateFilters({ card: code }, { push: true });
              }}
            />
          )}

          {/* 3.7 Dedicated Maps / Adventures Page */}
          {activeTab === 'maps' && (
            <MapsView
              filters={filters}
              updateFilters={updateFilters}
              onSelectMap={(mapItem) => {
                const code = typeof mapItem === 'string' ? mapItem : (mapItem.adventureID || mapItem.adventureName);
                updateFilters({ map: code }, { push: true });
              }}
            />
          )}

          {/* 3.8 Dedicated Tier List Page */}
          {activeTab === 'tierlist' && (
            <TierListView onSelectChampion={handleSelectChampion} />
          )}

          {/* 3.9 Dedicated Admin CMS Panel */}
          {activeTab === 'admin' && (
            <AdminView
              filters={filters}
              updateFilters={updateFilters}
              onNavigate={(tab) => updateFilters({ tab, champion: '', adminChampion: '' })}
            />
          )}

          {/* 3.10 404 Not Found Fallback */}
          {(activeTab === '404' || !['home', 'champions', 'relics', 'powers', 'items', 'cards', 'maps', 'tierlist', 'admin'].includes(activeTab)) && (
            <NotFoundView
              notFoundPath={filters.notFoundPath}
              onNavigateTab={handleNavigateTab}
            />
          )}
        </ErrorBoundary>
      )}

      {/* 4. Detail Modals (For general items/relics/cards) */}
      <EntityDetailModal
        item={selectedEntity}
        type={selectedEntityType}
        onClose={() => setSelectedEntity(null)}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';

const DEFAULT_FILTERS = {
  tab: 'home',
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
  difficulty: '',
  sort: 'name-asc',
  page: 1,
  limit: 24,
  champion: '',
  relic: '',
  power: '',
  item: '',
  card: '',
  map: '',
  hash: '',
  adminModule: 'overview',
  adminChampion: ''
};

export const ADMIN_ROUTE_PREFIX = '/admin/admin/admin';

export const VALID_ADMIN_MODULES = [
  'overview',
  'champions',
  'relics',
  'powers',
  'items',
  'cards',
  'maps',
  'logs'
];

const VALID_TABS = ['home', 'champions', 'relics', 'powers', 'items', 'cards', 'maps', 'tierlist'];

/**
 * Parses path & search parameters into a normalized state object
 */
export function parseCurrentLocation() {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;

  const pathname = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const parsed = { ...DEFAULT_FILTERS };

  // 1. Check hierarchical secret admin paths (/admin/admin/admin):
  //    - /admin/admin/admin/champion/:name or /admin/admin/admin/champions/:name
  const adminChampMatch = pathname.match(/^\/admin\/admin\/admin\/(?:champion|champions)\/([^/]+)$/i);
  if (adminChampMatch) {
    parsed.tab = 'admin';
    parsed.adminModule = 'champions';
    parsed.adminChampion = decodeURIComponent(adminChampMatch[1]).trim();
  } else if (pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(ADMIN_ROUTE_PREFIX + '/')) {
    //    - /admin/admin/admin or /admin/admin/admin/:module
    parsed.tab = 'admin';
    const adminModMatch = pathname.match(/^\/admin\/admin\/admin(?:\/([^/]+))?$/i);
    const sub = (adminModMatch && adminModMatch[1] ? adminModMatch[1].toLowerCase().trim() : '');
    if (VALID_ADMIN_MODULES.includes(sub)) {
      parsed.adminModule = sub;
    } else {
      parsed.adminModule = 'overview';
    }
    parsed.adminChampion = '';
  } else {
    // 2. Check hierarchical user-facing paths:
    const champMatch = pathname.match(/^\/(?:champion|champions)\/([^/]+)$/i);
    const relicMatch = pathname.match(/^\/(?:relic|relics)\/([^/]+)$/i);
    const powerMatch = pathname.match(/^\/(?:power|powers)\/([^/]+)$/i);
    const itemMatch = pathname.match(/^\/(?:item|items)\/([^/]+)$/i);
    const cardMatch = pathname.match(/^\/(?:card|cards)\/([^/]+)$/i);
    const mapMatch = pathname.match(/^\/(?:map|maps|adventure|adventures)\/([^/]+)$/i);

    if (champMatch) {
      parsed.tab = 'champions';
      parsed.champion = decodeURIComponent(champMatch[1]).trim();
    } else if (relicMatch) {
      parsed.tab = 'relics';
      parsed.relic = decodeURIComponent(relicMatch[1]).trim();
    } else if (powerMatch) {
      parsed.tab = 'powers';
      parsed.power = decodeURIComponent(powerMatch[1]).trim();
    } else if (itemMatch) {
      parsed.tab = 'items';
      parsed.item = decodeURIComponent(itemMatch[1]).trim();
    } else if (cardMatch) {
      parsed.tab = 'cards';
      parsed.card = decodeURIComponent(cardMatch[1]).trim();
    } else if (mapMatch) {
      parsed.tab = 'maps';
      parsed.map = decodeURIComponent(mapMatch[1]).trim();
    } else {
      // 3. Check top-level catalog paths
      const cleanRoute = pathname.slice(1).toLowerCase();
      if (VALID_TABS.includes(cleanRoute)) {
        parsed.tab = cleanRoute;
      } else if (pathname === '/' || pathname === '/home') {
        parsed.tab = 'home';
      }

      // 4. Fallback to legacy query parameters if present
      if (params.has('champion')) {
        parsed.champion = params.get('champion')?.trim() || '';
      }
      if (params.has('relic')) {
        parsed.relic = params.get('relic')?.trim() || '';
      }
      if (params.has('power')) {
        parsed.power = params.get('power')?.trim() || '';
      }
      if (params.has('item')) {
        parsed.item = params.get('item')?.trim() || '';
      }
      if (params.has('card')) {
        parsed.card = params.get('card')?.trim() || '';
      }
      if (params.has('map')) {
        parsed.map = params.get('map')?.trim() || '';
      }
      if (params.has('tab')) {
        const legacyTab = params.get('tab')?.trim().toLowerCase();
        if (VALID_TABS.includes(legacyTab)) {
          parsed.tab = legacyTab;
        }
      }
    }
  }

  // Admin query fallbacks if passed via ?adminModule=... or ?adminChampion=...
  if (params.has('adminModule')) {
    const mod = params.get('adminModule')?.trim().toLowerCase();
    if (VALID_ADMIN_MODULES.includes(mod)) {
      parsed.adminModule = mod;
    }
  }
  if (params.has('adminChampion')) {
    parsed.adminChampion = params.get('adminChampion')?.trim() || '';
  }

  // 5. Query string filters (catalog & vaults)
  if (params.has('q')) {
    parsed.q = params.get('q')?.trim() || '';
  }
  if (params.has('page')) {
    const p = parseInt(params.get('page'), 10);
    parsed.page = !isNaN(p) && p > 0 ? p : 1;
  }
  if (params.has('limit')) {
    const l = params.get('limit')?.trim();
    parsed.limit = l === 'all' ? 'all' : parseInt(l, 10) || 24;
  }
  if (params.has('sort')) {
    const sortVal = params.get('sort')?.trim();
    if (['name-asc', 'name-desc', 'stars-desc', 'stars-asc', 'cost-asc', 'cost-desc', 'tier', 'rarity-desc', 'rarity-asc'].includes(sortVal)) {
      parsed.sort = sortVal;
    }
  } else if (parsed.tab === 'cards') {
    parsed.sort = 'cost-asc';
  }

  // Scope vault-specific parameters strictly to matching tabs to prevent cross-tab filter bleed
  if (parsed.tab === 'champions') {
    if (params.has('regions')) {
      parsed.regions = params.get('regions')?.trim() || '';
    } else if (params.has('region')) {
      parsed.region = params.get('region')?.trim().toLowerCase() || 'all';
      parsed.regions = parsed.region !== 'all' ? parsed.region : '';
    }
    if (params.has('stars')) {
      parsed.stars = params.get('stars')?.trim().toLowerCase() || 'all';
    }
    if (params.has('costs')) {
      parsed.costs = params.get('costs')?.trim() || '';
    }
    if (params.has('tags')) {
      parsed.tags = params.get('tags')?.trim() || '';
    }
  } else if (parsed.tab === 'relics' || parsed.tab === 'powers' || parsed.tab === 'items') {
    if (params.has('rarity')) {
      parsed.rarity = params.get('rarity')?.trim() || '';
      parsed.rarities = parsed.rarity;
    }
    if (params.has('type')) {
      parsed.type = params.get('type')?.trim() || '';
      parsed.types = parsed.type;
    }
  } else if (parsed.tab === 'cards') {
    if (params.has('regions')) {
      parsed.regions = params.get('regions')?.trim() || '';
    } else if (params.has('region')) {
      parsed.regions = params.get('region')?.trim() || '';
    }
    if (params.has('costs')) {
      parsed.costs = params.get('costs')?.trim() || '';
    } else if (params.has('cost')) {
      parsed.costs = params.get('cost')?.trim() || '';
    }
    if (params.has('types')) {
      parsed.types = params.get('types')?.trim() || '';
      parsed.type = parsed.types;
    } else if (params.has('type')) {
      parsed.type = params.get('type')?.trim() || '';
      parsed.types = parsed.type;
    }
    if (params.has('rarities')) {
      parsed.rarities = params.get('rarities')?.trim() || '';
      parsed.rarity = parsed.rarities;
    } else if (params.has('rarity')) {
      parsed.rarity = params.get('rarity')?.trim() || '';
      parsed.rarities = parsed.rarity;
    }
  } else if (parsed.tab === 'maps') {
    if (params.has('types')) {
      parsed.types = params.get('types')?.trim() || '';
      parsed.type = parsed.types;
    } else if (params.has('type')) {
      parsed.type = params.get('type')?.trim() || '';
      parsed.types = parsed.type;
    }
    if (params.has('difficulty')) {
      parsed.difficulty = params.get('difficulty')?.trim() || '';
    }
  }

  // 6. Hash fragment (e.g. #constellation or #relics or #Veigar)
  if (typeof window !== 'undefined' && window.location.hash) {
    try {
      parsed.hash = decodeURIComponent(window.location.hash.replace(/^#/, '')).trim();
    } catch {
      parsed.hash = window.location.hash.replace(/^#/, '').trim();
    }
  }

  return parsed;
}

/**
 * Builds the canonical hierarchical URL from a filter state
 */
export function buildHierarchicalUrl(state) {
  let targetPath = '/';

  if (state.tab === 'admin') {
    if (state.adminChampion && state.adminChampion.trim()) {
      targetPath = `${ADMIN_ROUTE_PREFIX}/champion/${encodeURIComponent(state.adminChampion.trim())}`;
    } else if (state.adminModule && state.adminModule !== 'overview' && VALID_ADMIN_MODULES.includes(state.adminModule)) {
      targetPath = `${ADMIN_ROUTE_PREFIX}/${state.adminModule.trim().toLowerCase()}`;
    } else {
      targetPath = ADMIN_ROUTE_PREFIX;
    }
  } else if (state.champion && state.champion.trim()) {
    targetPath = `/champion/${encodeURIComponent(state.champion.trim())}`;
  } else if (state.relic && state.relic.trim()) {
    targetPath = `/relic/${encodeURIComponent(state.relic.trim())}`;
  } else if (state.power && state.power.trim()) {
    targetPath = `/power/${encodeURIComponent(state.power.trim())}`;
  } else if (state.item && state.item.trim()) {
    targetPath = `/item/${encodeURIComponent(state.item.trim())}`;
  } else if (state.card && state.card.trim()) {
    targetPath = `/card/${encodeURIComponent(state.card.trim())}`;
  } else if (state.map && state.map.trim()) {
    targetPath = `/map/${encodeURIComponent(state.map.trim())}`;
  } else if (state.tab && state.tab !== 'home') {
    targetPath = `/${state.tab}`;
  }

  // If currently viewing an entity detail page, do not leak vault list filter query parameters
  const isDetailView = Boolean(
    state.champion?.trim() ||
    state.relic?.trim() ||
    state.power?.trim() ||
    state.item?.trim() ||
    state.card?.trim() ||
    state.map?.trim()
  );

  const params = new URLSearchParams();

  if (!isDetailView && state.tab !== 'admin') {
    // Only serialize query parameters that strictly belong to the active tab
    if (state.tab === 'champions') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
      if (state.regions && state.regions.trim()) {
        params.set('regions', state.regions.trim());
      } else if (state.region && state.region !== 'all') {
        params.set('region', state.region);
      }
      if (state.stars && state.stars !== 'all') params.set('stars', state.stars);
      if (state.costs && state.costs.trim()) params.set('costs', state.costs.trim());
      if (state.tags && state.tags.trim()) params.set('tags', state.tags.trim());
      if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);
      if (state.page && state.page > 1) params.set('page', state.page);
    } else if (state.tab === 'relics') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
      if (state.rarity && state.rarity.trim()) params.set('rarity', state.rarity.trim());
      if (state.type && state.type.trim()) params.set('type', state.type.trim());
      if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);
      if (state.page && state.page > 1) params.set('page', state.page);
    } else if (state.tab === 'powers') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
      if (state.rarity && state.rarity.trim()) params.set('rarity', state.rarity.trim());
      if (state.type && state.type.trim()) params.set('type', state.type.trim());
      if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);
      if (state.page && state.page > 1) params.set('page', state.page);
    } else if (state.tab === 'items') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
      if (state.rarity && state.rarity.trim()) params.set('rarity', state.rarity.trim());
      if (state.type && state.type.trim()) params.set('type', state.type.trim());
      if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);
      if (state.page && state.page > 1) params.set('page', state.page);
    } else if (state.tab === 'cards') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
      const cardRegions = state.regions || (state.region && state.region !== 'all' ? state.region : '');
      if (cardRegions && cardRegions.trim()) params.set('regions', cardRegions.trim());
      const cardCosts = state.costs || state.cost;
      if (cardCosts && cardCosts.trim()) params.set('costs', cardCosts.trim());
      const cardTypes = state.types || state.type;
      if (cardTypes && cardTypes.trim()) params.set('types', cardTypes.trim());
      const cardRarities = state.rarities || state.rarity;
      if (cardRarities && cardRarities.trim()) params.set('rarities', cardRarities.trim());
      if (state.sort && state.sort !== 'cost-asc') params.set('sort', state.sort);
      if (state.page && state.page > 1) params.set('page', state.page);
    } else if (state.tab === 'maps') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
      const mapTypes = state.types || state.type;
      if (mapTypes && mapTypes.trim()) params.set('types', mapTypes.trim());
      if (state.difficulty && state.difficulty.trim()) params.set('difficulty', state.difficulty.trim());
      if (state.sort && state.sort !== 'difficulty-asc') params.set('sort', state.sort);
      if (state.page && state.page > 1) params.set('page', state.page);
    } else if (state.tab === 'tierlist') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
    } else if (state.tab === 'home') {
      if (state.q && state.q.trim()) params.set('q', state.q.trim());
    }
  }

  const queryString = params.toString();
  const urlBase = queryString ? `${targetPath}?${queryString}` : targetPath;
  const hashPart = state.hash
    ? `#${encodeURIComponent(decodeURIComponent(state.hash.replace(/^#/, '')))}`
    : '';

  return `${urlBase}${hashPart}`;
}

/**
 * Custom hook to synchronize hierarchical routing and URL query filters
 */
export function useUrlFilters() {
  const [filters, setFilters] = useState(parseCurrentLocation);

  // Sync state to hierarchical URL without hard page reloads
  const updateFilters = useCallback((updates, options = {}) => {
    setFilters((prev) => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };

      const newUrl = buildHierarchicalUrl(next);
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (newUrl !== currentUrl) {
        const isNavigation =
          options.push !== undefined
            ? options.push
            : (next.tab !== prev.tab) ||
              (Boolean(next.champion) && !prev.champion) ||
              (next.champion && prev.champion && next.champion !== prev.champion) ||
              (Boolean(next.relic) && !prev.relic) ||
              (next.relic && prev.relic && next.relic !== prev.relic) ||
              (Boolean(next.power) && !prev.power) ||
              (next.power && prev.power && next.power !== prev.power) ||
              (Boolean(next.item) && !prev.item) ||
              (next.item && prev.item && next.item !== prev.item) ||
              (Boolean(next.card) && !prev.card) ||
              (next.card && prev.card && next.card !== prev.card) ||
              (Boolean(next.map) && !prev.map) ||
              (next.map && prev.map && next.map !== prev.map) ||
              (next.tab === 'admin' && (
                next.adminModule !== prev.adminModule ||
                next.adminChampion !== prev.adminChampion
              ));

        const historyState = {
          ...next,
          isModal: Boolean(options.isModal || (next.champion && !prev.champion))
        };

        if (isNavigation) {
          window.history.pushState(historyState, '', newUrl);
        } else {
          window.history.replaceState(historyState, '', newUrl);
        }
      }

      return next;
    });
  }, []);

  // Initialize initial history entry with state on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.history.state) {
      const initial = parseCurrentLocation();
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.history.replaceState(initial, '', currentUrl);
    }
  }, []);

  // Listen for browser Back/Forward (popstate) and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const fresh = parseCurrentLocation();
      setFilters(fresh);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return [filters, updateFilters];
}

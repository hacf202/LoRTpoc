import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const RouterContext = createContext(null);

/**
 * Clean path parser for Path of Champions application
 * Supports:
 * - / (Home)
 * - /champions (Champions Roster)
 * - /champion/:name or /champions/:name (Champion Element Details)
 * - /relics (Relics Vault)
 * - /powers (Powers Archive)
 * - /items (Card Items)
 * - /cards (Cards Database)
 * - /maps (Adventures & Boss Guides)
 * - /tierlist (Meta Power Rankings)
 */
export function parseRoute(pathname = window.location.pathname, search = window.location.search) {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(search || '');

  // 1. Check hierarchical path: /champion/:name or /champions/:name
  const champMatch = cleanPath.match(/^\/(?:champion|champions)\/([^/]+)$/i);
  if (champMatch) {
    const rawChamp = decodeURIComponent(champMatch[1]).trim();
    return {
      pathname: cleanPath,
      tab: 'champions',
      champion: rawChamp,
      isDetail: true
    };
  }

  // 2. Specific top-level catalogs
  if (cleanPath === '/champions') {
    return { pathname: cleanPath, tab: 'champions', champion: null, isDetail: false };
  }
  if (cleanPath === '/relics') {
    return { pathname: cleanPath, tab: 'relics', champion: null, isDetail: false };
  }
  if (cleanPath === '/powers') {
    return { pathname: cleanPath, tab: 'powers', champion: null, isDetail: false };
  }
  if (cleanPath === '/items') {
    return { pathname: cleanPath, tab: 'items', champion: null, isDetail: false };
  }
  if (cleanPath === '/cards') {
    return { pathname: cleanPath, tab: 'cards', champion: null, isDetail: false };
  }
  if (cleanPath === '/maps') {
    return { pathname: cleanPath, tab: 'maps', champion: null, isDetail: false };
  }
  if (cleanPath === '/tierlist') {
    return { pathname: cleanPath, tab: 'tierlist', champion: null, isDetail: false };
  }

  // 3. Backward compatibility for legacy query param ?tab=... and ?champion=...
  if (searchParams.has('champion')) {
    const champ = searchParams.get('champion').trim();
    return { pathname: `/champion/${encodeURIComponent(champ)}`, tab: 'champions', champion: champ, isDetail: true };
  }
  if (searchParams.has('tab')) {
    const legacyTab = searchParams.get('tab').trim().toLowerCase();
    const validTabs = ['champions', 'relics', 'powers', 'items', 'cards', 'maps', 'tierlist'];
    if (validTabs.includes(legacyTab)) {
      return { pathname: `/${legacyTab}`, tab: legacyTab, champion: null, isDetail: false };
    }
  }

  // Default: Landing page (Home)
  return { pathname: '/', tab: 'home', champion: null, isDetail: false };
}

export function RouterProvider({ children }) {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window === 'undefined') {
      return { pathname: '/', tab: 'home', champion: null, isDetail: false, search: '' };
    }
    const parsed = parseRoute(window.location.pathname, window.location.search);
    return { ...parsed, search: window.location.search };
  });

  // Re-read route from window.location
  const syncRouteFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return;
    const parsed = parseRoute(window.location.pathname, window.location.search);
    setCurrentRoute({ ...parsed, search: window.location.search });
  }, []);

  // Listen to popstate (Browser Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      syncRouteFromLocation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncRouteFromLocation]);

  /**
   * Programmatic navigation
   * @param {string} to - Destination path (e.g. '/champions', '/champion/Yasuo', '/tierlist')
   * @param {Object} options - Navigation options
   * @param {boolean} options.replace - Whether to replace the current history entry
   * @param {boolean} options.preserveSearch - Whether to keep query parameters (?q=...)
   */
  const navigate = useCallback((to, { replace = false, preserveSearch = false } = {}) => {
    if (typeof window === 'undefined') return;

    // Separate pathname and search if provided in destination string
    let [targetPath, targetSearch] = to.split('?');
    targetPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;

    // Clean trailing slashes
    if (targetPath.length > 1 && targetPath.endsWith('/')) {
      targetPath = targetPath.slice(0, -1);
    }

    let finalSearch = '';
    if (targetSearch) {
      finalSearch = `?${targetSearch}`;
    } else if (preserveSearch && window.location.search) {
      finalSearch = window.location.search;
    }

    const fullUrl = `${targetPath}${finalSearch}`;

    // Only modify history if URL is different
    const currentFull = `${window.location.pathname}${window.location.search}`;
    if (currentFull !== fullUrl) {
      if (replace) {
        window.history.replaceState(null, '', fullUrl);
      } else {
        window.history.pushState(null, '', fullUrl);
      }
    }

    const parsed = parseRoute(targetPath, finalSearch);
    setCurrentRoute({ ...parsed, search: finalSearch });

    // Scroll to top on page view change (unless staying in the same modal)
    if (!parsed.isDetail) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  /**
   * Go back in history or fallback to safe route
   */
  const goBack = useCallback((fallbackPath = '/champions') => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallbackPath);
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      ...currentRoute,
      navigate,
      goBack
    }),
    [currentRoute, navigate, goBack]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

/**
 * Declarative Accessible SPA Link Component
 */
export function Link({ to, children, className = '', onClick, preserveSearch = false, replace = false, ...rest }) {
  const { navigate, pathname } = useRouter();

  const handleClick = (e) => {
    // Allow user to Ctrl+click or Cmd+click to open in new tab
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      onClick?.(e);
      navigate(to, { replace, preserveSearch });
    }
  };

  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <a
      href={to}
      onClick={handleClick}
      className={typeof className === 'function' ? className({ isActive }) : className}
      {...rest}
    >
      {children}
    </a>
  );
}

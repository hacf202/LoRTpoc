import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Global In-Memory Query Cache Registry (Rule 10 Compliant)
 * Structure: Map<namespace, Map<serializedKey, { data, total, totalPages, pagination, timestamp }>>
 */
const cacheStore = new Map();
const MAX_ENTRIES_PER_NAMESPACE = 50;

/**
 * Retrieve or initialize cache bucket for a namespace
 * @param {string} namespace
 * @returns {Map<string, Object>}
 */
export function getNamespaceCache(namespace = 'default') {
  if (!cacheStore.has(namespace)) {
    cacheStore.set(namespace, new Map());
  }
  return cacheStore.get(namespace);
}

/**
 * Purge cache entries for a given namespace or the entire store
 * @param {string} [namespace] Optional namespace to invalidate. If omitted, clears all namespaces.
 */
export function invalidateQueryCache(namespace = null) {
  if (!namespace) {
    cacheStore.clear();
  } else if (cacheStore.has(namespace)) {
    cacheStore.get(namespace).clear();
  }
}

// Auto-listen to global CMS update event to purge stale cached queries across all components
if (typeof window !== 'undefined') {
  window.addEventListener('poc-data-updated', () => {
    cacheStore.clear();
  });
}

/**
 * Unified Query Cache Hook
 * - Rule 9: Debounced smooth transition (minTransitionMs) to eliminate jarring flashes
 * - Rule 10: Cache-First strategy with in-memory LRU eviction & on-demand pagination
 * 
 * @param {Object} options
 * @param {string} options.namespace - Resource namespace ('champions', 'relics', 'powers', etc.)
 * @param {Object|string} options.key - Unique query parameters object or string
 * @param {Function} options.fetcher - Async function ({ signal }) => Promise<{ data, total, totalPages, pagination }>
 * @param {boolean} [options.enabled=true] - Whether query is active
 * @param {number} [options.minTransitionMs=320] - Minimum transition time on cache miss (Rule 9)
 * @param {number} [options.cacheHitDelayMs=150] - Subtle smooth transition time on cache hit (Rule 9)
 * @param {number} [options.maxEntries=50] - Max cache size per namespace (LRU)
 * @param {any} [options.initialData=[]] - Initial data value
 * @param {number} [options.initialTotal=0] - Initial total count
 * @param {number} [options.initialTotalPages=1] - Initial total pages
 */
export function useQueryCache({
  namespace = 'default',
  key,
  fetcher,
  enabled = true,
  minTransitionMs = 320,
  cacheHitDelayMs = 150,
  maxEntries = MAX_ENTRIES_PER_NAMESPACE,
  initialData = [],
  initialTotal = 0,
  initialTotalPages = 1
}) {
  const serializedKey = typeof key === 'string' ? key : JSON.stringify(key);

  const [data, setData] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [version, setVersion] = useState(0);

  // Keep latest fetcher in ref to prevent stale closures without re-triggering effect
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Refetch forces a cache bypass for the current key
  const refetch = useCallback(() => {
    const nsCache = getNamespaceCache(namespace);
    nsCache.delete(serializedKey);
    setVersion((v) => v + 1);
  }, [namespace, serializedKey]);

  // Mutate allows manual local update of cached data
  const mutate = useCallback(
    (updater) => {
      const nsCache = getNamespaceCache(namespace);
      setData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (nsCache.has(serializedKey)) {
          const entry = nsCache.get(serializedKey);
          nsCache.set(serializedKey, { ...entry, data: next });
        }
        return next;
      });
    },
    [namespace, serializedKey]
  );

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;
    const abortController = new AbortController();
    const nsCache = getNamespaceCache(namespace);

    setIsTransitioning(true);

    // 1. Cache HIT path (Rule 10: Instant from memory with subtle smooth transition)
    if (nsCache.has(serializedKey)) {
      const cached = nsCache.get(serializedKey);
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setData(cached.data);
          setTotal(cached.total ?? (Array.isArray(cached.data) ? cached.data.length : 0));
          setTotalPages(cached.totalPages ?? 1);
          if (cached.pagination) {
            setPagination(cached.pagination);
          }
          setIsCached(true);
          setLoading(false);
          setIsTransitioning(false);
          setError(null);
        }
      }, cacheHitDelayMs);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        abortController.abort();
      };
    }

    // Cache MISS: If currently empty, set loading state
    setData((curr) => {
      if (!curr || (Array.isArray(curr) && curr.length === 0)) {
        setLoading(true);
      }
      return curr;
    });
    setIsCached(false);

    // 2. Cache MISS path (Fetch on demand with guaranteed subtle transition timing)
    const startTime = performance.now();

    (async () => {
      try {
        const result = await fetcherRef.current({ signal: abortController.signal });

        const elapsed = performance.now() - startTime;
        const remainingDelay = Math.max(0, minTransitionMs - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (isCancelled) return;

        const resultData = result?.data ?? result ?? [];
        const resultTotal =
          result?.total ?? (Array.isArray(resultData) ? resultData.length : 0);
        const resultTotalPages =
          result?.totalPages ?? result?.pagination?.totalPages ?? 1;
        const resultPagination = result?.pagination ?? null;

        // Store into LRU cache
        if (nsCache.size >= maxEntries) {
          const oldestKey = nsCache.keys().next().value;
          if (oldestKey !== undefined) {
            nsCache.delete(oldestKey);
          }
        }

        nsCache.set(serializedKey, {
          data: resultData,
          total: resultTotal,
          totalPages: resultTotalPages,
          pagination: resultPagination,
          timestamp: Date.now()
        });

        setData(resultData);
        setTotal(resultTotal);
        setTotalPages(resultTotalPages);
        if (resultPagination) {
          setPagination(resultPagination);
        }
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error(`[useQueryCache:${namespace}] Fetch failed:`, err);
          setError(err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setIsTransitioning(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [
    namespace,
    serializedKey,
    enabled,
    minTransitionMs,
    cacheHitDelayMs,
    maxEntries,
    version
  ]);

  return {
    data,
    total,
    totalPages,
    pagination,
    loading,
    isTransitioning,
    error,
    isCached,
    refetch,
    mutate
  };
}

export default useQueryCache;

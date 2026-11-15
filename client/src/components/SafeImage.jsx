import React, { useState, useEffect, useRef } from 'react';
import { FALLBACK_SVGS, isUrlFailed } from '../utils/imageFallback';

/**
 * SafeImage Component
 * - 100% offline-safe with zero network spam
 * - Uses inline SVG Data URIs when offline or when links 404
 * - Circuit breaker against infinite error loops
 * - Auto-retries loading original source when internet connection is restored
 */
export default function SafeImage({
  src,
  fallbackSrc = null,
  type = 'default',
  alt = '',
  className = '',
  loading = 'lazy',
  style = {},
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(() => {
    if (!src) return FALLBACK_SVGS[type] || FALLBACK_SVGS.default;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // If offline and URL was previously failed, don't attempt request
      if (isUrlFailed(src)) return FALLBACK_SVGS[type] || FALLBACK_SVGS.default;
    }
    return src;
  });

  const [hasFailed, setHasFailed] = useState(false);
  const attemptedFallbackRef = useRef(false);

  // Sync state if incoming src prop changes
  useEffect(() => {
    attemptedFallbackRef.current = false;
    setHasFailed(false);
    if (!src) {
      setCurrentSrc(FALLBACK_SVGS[type] || FALLBACK_SVGS.default);
      return;
    }
    setCurrentSrc(src);
  }, [src, type]);

  // Network recovery: retry loading original image when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (hasFailed && src) {
        attemptedFallbackRef.current = false;
        setHasFailed(false);
        setCurrentSrc(src);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasFailed, src]);

  const handleError = () => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const svgFallback = FALLBACK_SVGS[type] || FALLBACK_SVGS.default;

    // 1. If offline or no secondary fallback provided or already tried, use offline SVG immediately
    if (isOffline || !fallbackSrc || attemptedFallbackRef.current) {
      setHasFailed(true);
      setCurrentSrc(svgFallback);
      return;
    }

    // 2. If online and secondary fallback exists, try once
    attemptedFallbackRef.current = true;
    setCurrentSrc(fallbackSrc);
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
}

/**
 * Production-Grade Offline-Safe Image Fallback System
 * - Zero network spam when offline (uses embedded SVG data URIs)
 * - Circuit breaker: Prevents infinite onError request loops
 * - Global capture-phase error listener for 100% app-wide coverage
 * - Dynamic network recovery via window 'online' event
 */

// Global registry of failed image URLs during the current session
const failedUrls = new Set();

/**
 * Generate lightweight, crisp SVG Data URIs matching LoR PoC dark theme
 */
function createSvgDataUri(iconPath, viewBox = '0 0 24 24', bgColor = '#0b0f19', strokeColor = '#475569') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" fill="none">
    <rect width="100%" height="100%" fill="${bgColor}" rx="6"/>
    <g stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      ${iconPath}
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const FALLBACK_SVGS = {
  // Champion Portrait Silhouette
  champion: createSvgDataUri(
    `<path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" fill="#1e293b"/>
     <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#38bdf8" stroke-width="1.5"/>
     <circle cx="12" cy="7" r="3" fill="#64748b"/>
     <polygon points="12 1 14 4 10 4" fill="#f59e0b"/>`,
    '0 0 24 24',
    '#070a12',
    '#38bdf8'
  ),

  // Card Outline
  card: createSvgDataUri(
    `<rect x="4" y="2" width="16" height="20" rx="2" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
     <circle cx="12" cy="8" r="3.5" fill="#1e293b" stroke="#60a5fa" stroke-width="1"/>
     <path d="M7 15h10M7 18h6" stroke="#64748b" stroke-width="1.5"/>`,
    '0 0 24 24',
    '#070a12',
    '#3b82f6'
  ),

  // Relic Hexagon Gem
  relic: createSvgDataUri(
    `<polygon points="12 2 20 7 20 17 12 22 4 17 4 7" fill="#1e1035" stroke="#a855f7" stroke-width="1.5"/>
     <polygon points="12 6 17 9.5 17 14.5 12 18 7 14.5 7 9.5" fill="#3b0764" stroke="#c084fc" stroke-width="1"/>
     <circle cx="12" cy="12" r="2" fill="#f3e8ff"/>`,
    '0 0 24 24',
    '#0d0818',
    '#a855f7'
  ),

  // Power Lightning Burst
  power: createSvgDataUri(
    `<circle cx="12" cy="12" r="9.5" fill="#201a08" stroke="#eab308" stroke-width="1.5"/>
     <polygon points="13 3 7 13 12 13 11 21 17 11 12 11 13 3" fill="#ca8a04" stroke="#fef08a" stroke-width="1"/>`,
    '0 0 24 24',
    '#100d04',
    '#eab308'
  ),

  // Item Equipment / Sword
  item: createSvgDataUri(
    `<circle cx="12" cy="12" r="9.5" fill="#0a1d17" stroke="#10b981" stroke-width="1.5"/>
     <path d="M14.5 4.5l5 5L8 21l-5-1 1-5L14.5 4.5z" fill="#064e3b" stroke="#34d399" stroke-width="1.2"/>
     <path d="M13 6l5 5" stroke="#6ee7b7" stroke-width="1.5"/>`,
    '0 0 24 24',
    '#05110d',
    '#10b981'
  ),

  // Adventure Map / Compass
  map: createSvgDataUri(
    `<circle cx="12" cy="12" r="9.5" fill="#0c1d2e" stroke="#0ea5e9" stroke-width="1.5"/>
     <polygon points="12 5 15 12 12 19 9 12" fill="#0284c7" stroke="#bae6fd" stroke-width="1"/>
     <circle cx="12" cy="12" r="1.5" fill="#ffffff"/>`,
    '0 0 24 24',
    '#06101c',
    '#0ea5e9'
  ),

  // General / Default Universal LoR Fallback
  default: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121826" />
      <stop offset="50%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#06090e" />
    </linearGradient>
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#785a28" />
      <stop offset="30%" stop-color="#c59b27" />
      <stop offset="70%" stop-color="#93732c" />
      <stop offset="100%" stop-color="#463414" />
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="40%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#0b0f19" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="300" height="400" rx="12" fill="url(#bgGrad)" />
  <rect x="6" y="6" width="288" height="388" rx="8" fill="none" stroke="url(#goldBorder)" stroke-width="1.5" stroke-opacity="0.4" />
  <rect x="12" y="12" width="276" height="376" rx="6" fill="none" stroke="#1e293b" stroke-width="1" />
  <g stroke="url(#goldBorder)" stroke-width="1.5" fill="none" opacity="0.6">
    <path d="M16 28 L28 16 M16 20 L20 16" />
    <path d="M284 28 L272 16 M284 20 L280 16" />
    <path d="M16 372 L28 384 M16 380 L20 384" />
    <path d="M284 372 L272 384 M284 380 L280 384" />
  </g>
  <circle cx="150" cy="180" r="110" fill="url(#centerGlow)" />
  <g transform="translate(150, 180)">
    <polygon points="0,-48 34,-34 48,0 34,34 0,48 -34,34 -48,0 -34,-34" fill="#0f172a" stroke="url(#goldBorder)" stroke-width="2" stroke-opacity="0.8" />
    <polygon points="0,-32 24,0 0,32 -24,0" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.7" />
    <polygon points="0,-16 12,0 0,16 -12,0" fill="#0284c7" opacity="0.6" />
    <circle cx="0" cy="0" r="3" fill="#e0f2fe" />
    <path d="M-60 65 L60 65" stroke="#334155" stroke-width="1.5" stroke-linecap="round" />
    <path d="M-30 75 L30 75" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />
  </g>
  <text x="150" y="320" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" letter-spacing="2">PATH OF CHAMPIONS</text>
  <text x="150" y="340" text-anchor="middle" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="9" letter-spacing="1">IMAGE UNAVAILABLE</text>
</svg>
`)}`
};

export const UNIVERSAL_FALLBACK_SVG = FALLBACK_SVGS.default;
export const FALLBACK_IMAGE_URL = '/placeholder.svg';

/**
 * Determine placeholder type from image attributes or src URL
 */
function detectImageType(img) {
  if (img.dataset.fallbackType) return img.dataset.fallbackType;
  const src = (img.src || '').toLowerCase();
  const alt = (img.alt || '').toLowerCase();
  const cls = (img.className || '').toLowerCase();

  if (src.includes('avatar') || src.includes('champion') || alt.includes('tướng') || cls.includes('avatar')) {
    return 'champion';
  }
  if (src.includes('relic') || alt.includes('cổ vật') || alt.includes('relic')) {
    return 'relic';
  }
  if (src.includes('power') || alt.includes('sức mạnh') || alt.includes('power')) {
    return 'power';
  }
  if (src.includes('item') || alt.includes('vật phẩm') || alt.includes('item')) {
    return 'item';
  }
  if (src.includes('card') || alt.includes('lá bài') || alt.includes('card')) {
    return 'card';
  }
  if (src.includes('map') || src.includes('adventure') || alt.includes('phiêu lưu')) {
    return 'map';
  }
  return 'default';
}

/**
 * Universal safe image error handler
 * Guarantees NO infinite loop and NO network requests when offline.
 *
 * @param {Event} e - The image onError event
 * @param {string} [type=null] - Type of placeholder ('champion'|'card'|'relic'|'power'|'item'|'map')
 * @param {string} [secondaryRemoteUrl=null] - Optional secondary HTTP URL to try ONLY IF online
 */
export function handleImageError(e, type = null, secondaryRemoteUrl = null) {
  const img = e.currentTarget || e.target;
  if (!img) return;

  // 1. Circuit Breaker: Prevent infinite error loops
  if (img.dataset.fallbackApplied === 'true') {
    return;
  }

  // Clear existing onError to stop event bubbling/recursion
  img.onerror = null;

  // Track original failing URL
  if (img.src && !img.src.startsWith('data:')) {
    failedUrls.add(img.src);
  }

  const resolvedType = type || detectImageType(img);
  const svgFallback = FALLBACK_SVGS[resolvedType] || FALLBACK_SVGS.default;
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  // 2. If offline or secondary URL already failed, immediately apply inline SVG
  if (isOffline || !secondaryRemoteUrl || failedUrls.has(secondaryRemoteUrl)) {
    img.dataset.fallbackApplied = 'true';
    img.src = svgFallback;
    return;
  }

  // 3. If online and secondary remote URL exists, attempt it exactly ONCE
  img.dataset.fallbackStage = 'secondary';
  img.onerror = () => {
    img.onerror = null;
    img.dataset.fallbackApplied = 'true';
    failedUrls.add(secondaryRemoteUrl);
    img.src = svgFallback;
  };

  img.src = secondaryRemoteUrl;
}

/**
 * Get fallback SVG data URI
 */
export function getFallbackSvg(type = 'default') {
  return FALLBACK_SVGS[type] || FALLBACK_SVGS.default;
}

/**
 * Check if a URL has already failed during this session
 */
export function isUrlFailed(url) {
  return failedUrls.has(url);
}

/**
 * Initialize Global Capture-Phase Image Error Interceptor
 * Ensures ANY <img> tag that fails when offline gets intercepted immediately,
 * preventing any request spamming across the entire application.
 */
if (typeof window !== 'undefined') {
  // 1. Network Reconnection: clear failed registry to allow seamless reload
  window.addEventListener('online', () => {
    failedUrls.clear();
  });

  // 2. Capture-phase image error handler
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (target && target.tagName === 'IMG') {
        if (target.dataset.fallbackApplied === 'true') return;

        // If offline, kill network retries and apply SVG placeholder instantly
        if (!navigator.onLine) {
          target.onerror = null;
          target.dataset.fallbackApplied = 'true';
          const type = detectImageType(target);
          target.src = FALLBACK_SVGS[type] || FALLBACK_SVGS.default;
        }
      }
    },
    true // Capture phase: intercepts before bubbling or component onError
  );
}

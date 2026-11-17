import { useEffect, useRef } from 'react';

/**
 * Get or initialize persistent session ID for the current browser tab
 */
function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  const KEY = 'poc_visitor_sid';
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = `sid_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    try {
      sessionStorage.setItem(KEY, sid);
    } catch (_) {}
  }
  return sid;
}

/**
 * Lightweight Hook for Tracking Real-time Concurrent Active Users
 * Sends periodic heartbeats (30s) while the tab is active/visible
 * 
 * @param {string} page Current active page or tab
 * @param {string} lang Current language ('vi' | 'en')
 */
export function usePresenceTracker(page = 'home', lang = 'vi') {
  const pageRef = useRef(page);
  const langRef = useRef(lang);
  pageRef.current = page;
  langRef.current = lang;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const sendPing = () => {
      // Don't send heartbeat if tab is in the background to save client & server resources
      if (document.visibilityState === 'hidden') return;

      fetch('/api/v1/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          page: pageRef.current || 'home',
          lang: langRef.current || 'vi'
        }),
        keepalive: true
      }).catch(() => {
        // Silent fail for network glitches
      });
    };

    // Initial ping on mount
    sendPing();

    // Periodic heartbeat every 30s
    const interval = setInterval(sendPing, 30000);

    // Send ping immediately when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPing();
      }
    };

    // Send leave notification when user closes tab or navigates away
    const handleLeave = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/v1/presence/leave',
          JSON.stringify({ sessionId })
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('beforeunload', handleLeave);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleLeave);
      window.removeEventListener('beforeunload', handleLeave);
    };
  }, []);

  // Also trigger a ping when page route changes
  useEffect(() => {
    if (typeof window === 'undefined' || document.visibilityState === 'hidden') return;
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    fetch('/api/v1/presence/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        page: page || 'home',
        lang: lang || 'vi'
      }),
      keepalive: true
    }).catch(() => {});
  }, [page, lang]);
}

export default usePresenceTracker;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. Explicitly bypass Pages Function for all static assets (images, icons, styles, scripts, data, fonts)
  // Cloudflare Pages serves these directly from Edge CDN with zero cold-start latency
  if (/\.(ico|webp|png|jpg|jpeg|svg|gif|css|js|map|txt|xml|json|woff|woff2|ttf|eot)$/i.test(pathname)) {
    return context.next();
  }

  // 2. ONLY proxy API requests and crawler preview endpoints to Render backend (api.lortpoc.com)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/v1/') ||
    pathname === '/preview' ||
    pathname === '/share'
  ) {
    const targetUrl = `https://api.lortpoc.com${pathname}${url.search}`;
    const newHeaders = new Headers(context.request.headers);
    newHeaders.set('host', 'api.lortpoc.com');

    const modifiedRequest = new Request(targetUrl, {
      method: context.request.method,
      headers: newHeaders,
      body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
      redirect: 'follow'
    });

    return fetch(modifiedRequest);
  }

  // 3. All SPA client routes (/, /champions, /tierlist, /relics, /maps, /powers, /cards, /champion/*, etc.)
  // Pure SPA frontend: Cloudflare Pages serves static index.html directly from edge cache.
  // NEVER forward client-side HTML routes to Render to eliminate cold-start 504/522 timeouts.
  return context.next();
}

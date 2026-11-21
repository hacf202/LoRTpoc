export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Forward API and SEO endpoints to Render backend (api.lortpoc.com)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/v1/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
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

  // All other frontend routes serve static Vite assets / index.html
  return context.next();
}

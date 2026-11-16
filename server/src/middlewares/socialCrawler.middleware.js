import { seoService } from '../services/seo.service.js';

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'slackbot',
  'linkedinbot',
  'pinterest',
  'skypeuripreview',
  'embedly',
  'quora link preview',
  'yahoo! slurp',
  'zalo',
  'applebot'
];

/**
 * Middleware that detects social media crawler bots (Discord, Facebook, Twitter, Zalo, WhatsApp, Telegram...)
 * and immediately serves an SEO-optimized Open Graph & Twitter Card HTML document with real preview images
 * without requiring client-side JavaScript execution.
 */
export function socialCrawlerMiddleware(req, res, next) {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isBot = CRAWLER_USER_AGENTS.some((botToken) => userAgent.includes(botToken));

  // If request is from a social crawler and is requesting an HTML page
  if (isBot && (req.method === 'GET' || req.method === 'HEAD')) {
    // Only intercept page requests, not API or static assets with extensions
    if (!req.path.startsWith('/api') && !req.path.includes('.')) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = `${protocol}://${host}`;

        let target = req.query.champion || req.query.relic || req.query.power || req.query.item || req.query.card || req.query.map || '';
        let category = '';

        if (req.path) {
          const champMatch = req.path.match(/^\/(?:champion|champions)\/([^/]+)/i);
          const relicMatch = req.path.match(/^\/(?:relic|relics)\/([^/]+)/i);
          const powerMatch = req.path.match(/^\/(?:power|powers)\/([^/]+)/i);
          const itemMatch = req.path.match(/^\/(?:item|items)\/([^/]+)/i);
          const cardMatch = req.path.match(/^\/(?:card|cards)\/([^/]+)/i);
          const mapMatch = req.path.match(/^\/(?:map|maps|adventure|adventures)\/([^/]+)/i);

          if (champMatch) {
            category = 'champion';
            target = decodeURIComponent(champMatch[1]);
          } else if (relicMatch) {
            category = 'relic';
            target = decodeURIComponent(relicMatch[1]);
          } else if (powerMatch) {
            category = 'power';
            target = decodeURIComponent(powerMatch[1]);
          } else if (itemMatch) {
            category = 'item';
            target = decodeURIComponent(itemMatch[1]);
          } else if (cardMatch) {
            category = 'card';
            target = decodeURIComponent(cardMatch[1]);
          } else if (mapMatch) {
            category = 'map';
            target = decodeURIComponent(mapMatch[1]);
          } else if (req.path.startsWith('/tierlist')) {
            category = 'tierlist';
          } else if (req.path === '/champions' || req.path === '/champions/') {
            category = 'champions_list';
          } else if (req.path === '/relics' || req.path === '/relics/') {
            category = 'relics_list';
          } else if (req.path === '/powers' || req.path === '/powers/') {
            category = 'powers_list';
          } else if (req.path === '/items' || req.path === '/items/') {
            category = 'items_list';
          } else if (req.path === '/cards' || req.path === '/cards/') {
            category = 'cards_list';
          } else if (req.path === '/maps' || req.path === '/maps/') {
            category = 'maps_list';
          }
        }

        const html = seoService.generateSocialPreviewHtml(target, baseUrl, category);

        res.header('Content-Type', 'text/html; charset=utf-8');
        res.header('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(html);
      } catch (err) {
        console.error('[Social Crawler Middleware] Error rendering bot preview:', err);
      }
    }
  }

  next();
}

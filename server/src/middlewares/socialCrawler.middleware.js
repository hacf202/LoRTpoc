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
  'yahoo! slurp'
];

/**
 * Middleware that detects social media crawler bots (Discord, Facebook, Twitter, WhatsApp...)
 * and immediately serves an SEO-optimized Open Graph & Twitter Card HTML document
 * without requiring client-side JavaScript execution.
 */
export function socialCrawlerMiddleware(req, res, next) {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isBot = CRAWLER_USER_AGENTS.some((botToken) => userAgent.includes(botToken));

  // If request is from a social crawler and is requesting an HTML page
  if (isBot && (req.method === 'GET' || req.method === 'HEAD')) {
    // Only intercept page requests, not API or static assets
    if (!req.path.startsWith('/api') && !req.path.includes('.')) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = `${protocol}://${host}`;

        let target = req.query.champion || req.query.relic || req.query.map || '';
        if (!target && req.path) {
          const match = req.path.match(/^\/(?:champion|champions)\/([^/]+)/i);
          if (match) {
            target = decodeURIComponent(match[1]);
          }
        }
        const html = seoService.generateSocialPreviewHtml(target, baseUrl);

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

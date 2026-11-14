import { seoService } from '../services/seo.service.js';

export const seoController = {
  getSitemap: (req, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const sitemap = seoService.generateSitemapXml(baseUrl);

      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24h
      return res.status(200).send(sitemap);
    } catch (err) {
      console.error('[SEO Controller] Sitemap generation error:', err);
      return res.status(500).send('Error generating sitemap');
    }
  },

  getRobots: (req, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const robots = seoService.generateRobotsTxt(baseUrl);

      res.header('Content-Type', 'text/plain; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(robots);
    } catch (err) {
      console.error('[SEO Controller] Robots.txt generation error:', err);
      return res.status(500).send('Error generating robots.txt');
    }
  },

  getSocialPreview: (req, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const target = req.query.champion || req.query.relic || req.params.id;

      const html = seoService.generateSocialPreviewHtml(target, baseUrl);
      res.header('Content-Type', 'text/html; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(html);
    } catch (err) {
      console.error('[SEO Controller] Social preview error:', err);
      return res.status(500).send('Error generating social preview');
    }
  }
};

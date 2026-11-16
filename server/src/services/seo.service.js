import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

// Load datasets safely
const loadJson = (filename) => {
  try {
    const raw = fs.readFileSync(path.join(dataDir, filename), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[SEO Service] Failed to load ${filename}:`, err.message);
    return [];
  }
};

const champions = loadJson('champions.json');
const relics = loadJson('relics.json');
const maps = loadJson('maps.json');

const escapeXml = (unsafe) => {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const seoService = {
  /**
   * Generates a fully compliant XML Sitemap covering all pages, champions, relics, and adventures
   */
  generateSitemapXml: (customBaseUrl) => {
    const baseUrl = (customBaseUrl || config.clientUrl || 'https://thepathofchampions.guide').replace(/\/+$/, '');
    const today = new Date().toISOString().split('T')[0];

    const entries = [];

    // 1. Core Landing and Catalog Pages (Hierarchical Canonical URLs)
    const catalogPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/champions', priority: '0.95', changefreq: 'daily' },
      { path: '/relics', priority: '0.9', changefreq: 'weekly' },
      { path: '/tierlist', priority: '0.9', changefreq: 'weekly' },
      { path: '/powers', priority: '0.85', changefreq: 'weekly' },
      { path: '/items', priority: '0.85', changefreq: 'weekly' },
      { path: '/cards', priority: '0.85', changefreq: 'weekly' },
      { path: '/maps', priority: '0.85', changefreq: 'weekly' }
    ];

    catalogPages.forEach((page) => {
      entries.push(`  <url>
    <loc>${escapeXml(baseUrl + page.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    });

    // 2. All 89 Champions (Canonical Clean Paths for Google/Bing Indexing)
    champions.forEach((champ) => {
      const identifier = champ.name || champ.championID || champ.cardCode;
      const url = `${baseUrl}/champion/${encodeURIComponent(identifier)}`;
      entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
    });

    // 3. All 155 Relics
    relics.forEach((relic) => {
      const identifier = relic.relicCode || relic.name;
      const url = `${baseUrl}/relic/${encodeURIComponent(identifier)}`;
      entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`);
    });

    // 4. All 48 Adventures / Maps
    maps.forEach((map) => {
      const identifier = map.adventureID || map.mapID || map.adventureName;
      if (identifier) {
        const url = `${baseUrl}/map/${encodeURIComponent(identifier)}`;
        entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`);
      }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
  },

  /**
   * Generates standard robots.txt directing search bots to the sitemap while protecting admin paths
   */
  generateRobotsTxt: (customBaseUrl) => {
    const baseUrl = (customBaseUrl || config.clientUrl || 'https://thepathofchampions.guide').replace(/\/+$/, '');
    return `# Robots.txt for The Path of Champions Guide
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /admin/admin/admin

Sitemap: ${baseUrl}/sitemap.xml
`;
  },

  /**
   * Generates Rich Social Preview HTML (OpenGraph / Twitter Cards) for crawler bots
   */
  generateSocialPreviewHtml: (targetParam, customBaseUrl) => {
    const baseUrl = (customBaseUrl || config.clientUrl || 'https://thepathofchampions.guide').replace(/\/+$/, '');
    let title = 'The Path of Champions Guide - Cẩm Nang Con Đường Anh Hùng LoR';
    let description = 'Hệ thống tra cứu chuyên sâu toàn bộ 89 tướng, 155 cổ vật, 1,196 sức mạnh và bảng xếp hạng meta Con Đường Anh Hùng.';
    let image = `${baseUrl}/og-image.webp`;
    let canonicalUrl = `${baseUrl}/`;

    if (targetParam) {
      const q = String(targetParam).toLowerCase().trim();

      // Check if target is a champion
      const champ = champions.find(
        (c) =>
          (c.championID && c.championID.toLowerCase() === q) ||
          (c.cardCode && c.cardCode.toLowerCase() === q) ||
          (c.name && c.name.toLowerCase() === q)
      );

      if (champ) {
        const champName = champ.name;
        const regionsStr = Array.isArray(champ.regions) ? champ.regions.join(' • ') : 'Runeterra';
        const stars = champ.maxStar || 3;
        const tier = champ.tier ? ` - Tier ${champ.tier.split('//')[0].trim()}` : '';

        title = `${champName} - Cẩm Nang Tướng, Sức Mạnh Sao & Cổ Vật Tối Ưu (${stars}★${tier}) | PoC Guide`;
        description =
          champ.relicSets?.[0]?.descriptionRaw ||
          champ.descriptionRaw ||
          champ.description ||
          `Hướng dẫn lối chơi, cây chòm sao và gợi ý cổ vật chuẩn nhất cho ${champName} (${regionsStr}) trong Con Đường Anh Hùng.`;
        if (champ.assets?.[0]?.gameAbsolutePath) {
          image = champ.assets[0].gameAbsolutePath;
        } else if (champ.assets?.[0]?.avatar) {
          image = champ.assets[0].avatar;
        }
        canonicalUrl = `${baseUrl}/champion/${encodeURIComponent(champ.name || champ.championID)}`;
      } else {
        // Check if target is a relic
        const relic = relics.find(
          (r) =>
            (r.relicCode && r.relicCode.toLowerCase() === q) ||
            (r.name && r.name.toLowerCase() === q)
        );

        if (relic) {
          title = `${relic.name} (${relic.rarity || 'Cổ vật'}) - Cẩm Nang Cổ Vật PoC Guide`;
          description = relic.descriptionRaw || relic.description || 'Chi tiết hiệu ứng cổ vật và tướng tương thích.';
          if (relic.assetAbsolutePath) image = relic.assetAbsolutePath;
          canonicalUrl = `${baseUrl}/relic/${encodeURIComponent(relic.relicCode || relic.name)}`;
        }
      }
    }

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <meta name="description" content="${escapeXml(description)}">
  <link rel="canonical" href="${escapeXml(canonicalUrl)}">

  <!-- Open Graph / Discord / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="The Path of Champions Guide">
  <meta property="og:title" content="${escapeXml(title)}">
  <meta property="og:description" content="${escapeXml(description)}">
  <meta property="og:image" content="${escapeXml(image)}">
  <meta property="og:url" content="${escapeXml(canonicalUrl)}">

  <!-- Twitter / X -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="${escapeXml(title)}">
  <meta property="twitter:description" content="${escapeXml(description)}">
  <meta property="twitter:image" content="${escapeXml(image)}">

  <!-- Client-side Redirect for real users -->
  <meta http-equiv="refresh" content="0; url=${escapeXml(canonicalUrl)}">
</head>
<body style="background:#07090e; color:#e2e8f0; font-family:sans-serif; padding:40px; text-align:center;">
  <h1>${escapeXml(title)}</h1>
  <p>${escapeXml(description)}</p>
  <p><a href="${escapeXml(canonicalUrl)}" style="color:#e6b758;">Bấm vào đây nếu không tự động chuyển hướng...</a></p>
</body>
</html>`;
  }
};

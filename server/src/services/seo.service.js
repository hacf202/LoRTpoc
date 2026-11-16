import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { toChampionSlug } from '../utils/slug.js';

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
const powers = loadJson('powers.json');
const items = loadJson('items.json');
const cards = loadJson('cards.json');

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
   * Generates a fully compliant XML Sitemap covering all pages, champions, relics, powers, items, cards, and adventures
   */
  generateSitemapXml: (customBaseUrl) => {
    const baseUrl = (customBaseUrl || (config.clientUrl?.startsWith('http') && !config.clientUrl.includes('localhost') ? config.clientUrl : null) || 'https://lortpoc.com').replace(/\/+$/, '');
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

    // 2. All Champions (Canonical Clean Paths for Google/Bing Indexing)
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

    // 5. All Powers
    powers.forEach((power) => {
      const identifier = power.powerCode || power.name;
      if (identifier) {
        const url = `${baseUrl}/power/${encodeURIComponent(identifier)}`;
        entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>`);
      }
    });

    // 6. All Items
    items.forEach((item) => {
      const identifier = item.itemCode || item.name;
      if (identifier) {
        const url = `${baseUrl}/item/${encodeURIComponent(identifier)}`;
        entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>`);
      }
    });

    // 7. All Cards
    cards.forEach((card) => {
      const identifier = card.cardCode;
      if (identifier) {
        const url = `${baseUrl}/card/${encodeURIComponent(identifier)}`;
        entries.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
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
    const baseUrl = (customBaseUrl || (config.clientUrl?.startsWith('http') && !config.clientUrl.includes('localhost') ? config.clientUrl : null) || 'https://lortpoc.com').replace(/\/+$/, '');
    return `# Robots.txt for LoR TPoC (lortpoc.com)
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
  generateSocialPreviewHtml: (targetParam, customBaseUrl, category = null) => {
    const baseUrl = (customBaseUrl || (config.clientUrl?.startsWith('http') && !config.clientUrl.includes('localhost') ? config.clientUrl : null) || 'https://lortpoc.com').replace(/\/+$/, '');
    const homeHeroImage = `${baseUrl}/home-hero.webp`;
    let title = 'LoR TPoC - Cẩm Nang Con Đường Anh Hùng | lortpoc.com';
    let description = 'Hệ thống tra cứu chuyên sâu toàn bộ 89 tướng, 155 cổ vật, 1,196 sức mạnh và bảng xếp hạng meta Con Đường Anh Hùng.';
    let image = homeHeroImage;
    let canonicalUrl = `${baseUrl}/`;

    const q = String(targetParam || '').toLowerCase().trim();

    // 1. Specific Entity Match by category or search target (Ảnh chi tiết của từng trang)
    if (category === 'champion' || (!category && q)) {
      const champ = champions.find(
        (c) =>
          (c.championID && c.championID.toLowerCase() === q) ||
          (c.cardCode && c.cardCode.toLowerCase() === q) ||
          (c.name && c.name.toLowerCase() === q) ||
          toChampionSlug(c.name) === toChampionSlug(q) ||
          toChampionSlug(c.translations?.en?.name) === toChampionSlug(q)
      );

      if (champ) {
        const champName = champ.name;
        const regionsStr = Array.isArray(champ.regions) ? champ.regions.join(' • ') : 'Runeterra';
        const stars = champ.maxStar || 3;
        const tier = champ.tier ? ` - Tier ${champ.tier.split('//')[0].trim()}` : '';

        title = `${champName} - Cẩm Nang Tướng, Sức Mạnh Sao & Cổ Vật (${stars}★${tier}) | lortpoc.com`;
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
        canonicalUrl = `${baseUrl}/champion/${toChampionSlug(champ)}`;
      }
    }

    if (!canonicalUrl.includes('/champion/') && (category === 'relic' || (!category && q))) {
      const relic = relics.find(
        (r) =>
          (r.relicCode && r.relicCode.toLowerCase() === q) ||
          (r.name && r.name.toLowerCase() === q)
      );

      if (relic) {
        title = `${relic.name} (${relic.rarity || 'Cổ vật'}) - Cẩm Nang Cổ Vật | lortpoc.com`;
        description = relic.descriptionRaw || relic.description || 'Chi tiết hiệu ứng cổ vật và tướng tương thích.';
        image = relic.assetAbsolutePath || relic.image || `https://images.lortpoc.com/relics/${relic.relicCode}.webp`;
        canonicalUrl = `${baseUrl}/relic/${encodeURIComponent(relic.relicCode || relic.name)}`;
      }
    }

    if (!canonicalUrl.includes('/champion/') && !canonicalUrl.includes('/relic/') && (category === 'power' || (!category && q))) {
      const power = powers.find(
        (p) =>
          (p.powerCode && p.powerCode.toLowerCase() === q) ||
          (p.name && p.name.toLowerCase() === q)
      );

      if (power) {
        title = `${power.name} (${power.rarity || 'Sức mạnh'}) - Sức Mạnh Viễn Chinh | lortpoc.com`;
        description = power.descriptionRaw || power.description || 'Chi tiết hiệu ứng sức mạnh viễn chinh và nâng cấp.';
        image = power.image || power.assetFullAbsolutePath || power.assetAbsolutePath || `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${power.powerCode}.png`;
        canonicalUrl = `${baseUrl}/power/${encodeURIComponent(power.powerCode || power.name)}`;
      }
    }

    if (!canonicalUrl.includes('/champion/') && !canonicalUrl.includes('/relic/') && !canonicalUrl.includes('/power/') && (category === 'item' || (!category && q))) {
      const item = items.find(
        (it) =>
          (it.itemCode && it.itemCode.toLowerCase() === q) ||
          (it.name && it.name.toLowerCase() === q)
      );

      if (item) {
        title = `${item.name} (${item.rarity || 'Vật phẩm'}) - Vật Phẩm Thẻ Bài | lortpoc.com`;
        description = item.descriptionRaw || item.description || 'Chi tiết hiệu ứng vật phẩm gắn vào bài quân và phép.';
        image = item.assetAbsolutePath || item.image || `https://images.lortpoc.com/items/${item.itemCode}.webp` || 'https://images.lortpoc.com/icon/itemIcon.webp';
        canonicalUrl = `${baseUrl}/item/${encodeURIComponent(item.itemCode || item.name)}`;
      }
    }

    if (!canonicalUrl.includes('/champion/') && !canonicalUrl.includes('/relic/') && !canonicalUrl.includes('/power/') && !canonicalUrl.includes('/item/') && (category === 'card' || (!category && q))) {
      const card = cards.find(
        (cd) =>
          (cd.cardCode && cd.cardCode.toLowerCase() === q) ||
          (cd.cardName && cd.cardName.toLowerCase() === q) ||
          (cd.name && cd.name.toLowerCase() === q)
      );

      if (card) {
        const cName = card.cardName || card.name || card.cardCode;
        title = `${cName} (${card.cost ?? 0} Mana) - Thư Viện Lá Bài LoR | lortpoc.com`;
        description = card.descriptionRaw || card.description || 'Thông số chi tiết, chỉ số công thủ và từ khóa lá bài.';
        image = card.gameAbsolutePath || card.assets?.[0]?.gameAbsolutePath || `https://dd.b.pvp.net/latest/set1/vi_vn/img/cards/${card.cardCode}.png`;
        canonicalUrl = `${baseUrl}/card/${encodeURIComponent(card.cardCode || cName)}`;
      }
    }

    if (!canonicalUrl.includes('/champion/') && !canonicalUrl.includes('/relic/') && !canonicalUrl.includes('/power/') && !canonicalUrl.includes('/item/') && !canonicalUrl.includes('/card/') && (category === 'map' || (!category && q))) {
      const map = maps.find(
        (m) =>
          (m.adventureID && m.adventureID.toLowerCase() === q) ||
          (m.mapID && m.mapID.toLowerCase() === q) ||
          (m.adventureName && m.adventureName.toLowerCase() === q)
      );

      if (map) {
        title = `${map.adventureName || map.name} (${map.difficultyStars || 3}★) - Cẩm Nang Bản Đồ | lortpoc.com`;
        description = map.description || 'Hướng dẫn chọn tướng, khắc chế trùm và vượt ải bản đồ Con Đường Anh Hùng.';
        image = map.background || map.assetAbsolutePath || map.image || map.assets?.banner || map.icon || homeHeroImage;
        canonicalUrl = `${baseUrl}/map/${encodeURIComponent(map.adventureID || map.mapID || map.adventureName)}`;
      }
    }

    // 2. High-level Catalog Pages (Trang danh sách: Lấy ảnh của phần tử đầu tiên trong danh sách)
    if (category === 'tierlist') {
      title = 'Bảng Xếp Hạng Tướng Con Đường Anh Hùng (Tier S+ đến C) | lortpoc.com';
      description = 'Đánh giá sức mạnh meta toàn diện của 89 tướng trong Legends of Runeterra: The Path of Champions.';
      canonicalUrl = `${baseUrl}/tierlist`;
      const topChamp = champions.find(c => c.tier && (c.tier.includes('S+') || c.tier.includes('0'))) || champions[0];
      if (topChamp) {
        image = topChamp.assets?.[0]?.gameAbsolutePath || topChamp.assets?.[0]?.avatar || homeHeroImage;
      }
    } else if (category === 'champions_list') {
      title = 'Danh Sách 89 Tướng Con Đường Anh Hùng - Chỉ Số & Lối Chơi | lortpoc.com';
      description = 'Tra cứu toàn bộ 89 vị tướng: Chỉ số Mana, Sao tối ưu, Bộ bài khởi điểm và Cây chòm sao 6 sao.';
      canonicalUrl = `${baseUrl}/champions`;
      const firstChamp = champions[0];
      if (firstChamp) {
        image = firstChamp.assets?.[0]?.gameAbsolutePath || firstChamp.assets?.[0]?.avatar || homeHeroImage;
      }
    } else if (category === 'relics_list') {
      title = 'Danh Sách 155 Cổ Vật Relics - Hiệu Ứng & Phân Cấp | lortpoc.com';
      description = 'Khám phá 155 cổ vật Thường, Hiếm, Sử Thi và Cổ Vật Độc Quyền tương thích tốt nhất cho từng tướng.';
      canonicalUrl = `${baseUrl}/relics`;
      const firstRelic = relics[0];
      if (firstRelic) {
        image = firstRelic.assetAbsolutePath || firstRelic.image || `https://images.lortpoc.com/relics/${firstRelic.relicCode}.webp` || homeHeroImage;
      }
    } else if (category === 'powers_list') {
      title = 'Danh Sách 1,196 Sức Mạnh Viễn Chinh - Bổ Trợ & Hiệu Ứng | lortpoc.com';
      description = 'Tra cứu tất cả sức mạnh ngẫu nhiên trong hành trình Con Đường Anh Hùng.';
      canonicalUrl = `${baseUrl}/powers`;
      const firstPower = powers[0];
      if (firstPower) {
        image = firstPower.image || firstPower.assetFullAbsolutePath || firstPower.assetAbsolutePath || `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${firstPower.powerCode}.png` || homeHeroImage;
      }
    } else if (category === 'items_list') {
      title = 'Danh Sách 187 Vật Phẩm Thẻ Bài - Trang Bị & Nâng Cấp | lortpoc.com';
      description = 'Chi tiết toàn bộ trang bị cường hóa chỉ số và từ khóa đặc biệt cho bài quân.';
      canonicalUrl = `${baseUrl}/items`;
      const firstItem = items[0];
      if (firstItem) {
        image = firstItem.assetAbsolutePath || firstItem.image || `https://images.lortpoc.com/items/${firstItem.itemCode}.webp` || homeHeroImage;
      }
    } else if (category === 'cards_list') {
      title = 'Thư Viện 2,686 Lá Bài Runeterra - Toàn Bộ Bài Quân & Phép | lortpoc.com';
      description = 'Thư viện hình ảnh sắc nét và hiệu ứng của toàn bộ bài quân, phép thuật và địa danh trong LoR.';
      canonicalUrl = `${baseUrl}/cards`;
      const firstCard = cards[0];
      if (firstCard) {
        image = firstCard.gameAbsolutePath || firstCard.assets?.[0]?.gameAbsolutePath || `https://dd.b.pvp.net/latest/set1/vi_vn/img/cards/${firstCard.cardCode}.png` || homeHeroImage;
      }
    } else if (category === 'maps_list') {
      title = 'Danh Sách 48 Bản Đồ Phiêu Lưu & Trùm Cuối | lortpoc.com';
      description = 'Cẩm nang chinh phục 48 cuộc phiêu lưu từ 0.5 sao đến Ác Mộng 6.5 sao trong Con Đường Anh Hùng.';
      canonicalUrl = `${baseUrl}/maps`;
      const firstMap = maps[0];
      if (firstMap) {
        image = firstMap.background || firstMap.assetAbsolutePath || firstMap.image || firstMap.assets?.banner || firstMap.icon || homeHeroImage;
      }
    }

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <meta name="description" content="${escapeXml(description)}">
  <link rel="canonical" href="${escapeXml(canonicalUrl)}">

  <!-- Open Graph / Discord / Facebook / Zalo / Telegram -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="LoR TPoC - lortpoc.com">
  <meta property="og:title" content="${escapeXml(title)}">
  <meta property="og:description" content="${escapeXml(description)}">
  <meta property="og:image" content="${escapeXml(image)}">
  <meta property="og:image:secure_url" content="${escapeXml(image)}">
  <meta property="og:image:alt" content="${escapeXml(title)}">
  <meta property="og:url" content="${escapeXml(canonicalUrl)}">

  <!-- Twitter / X Cards -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="${escapeXml(title)}">
  <meta property="twitter:description" content="${escapeXml(description)}">
  <meta property="twitter:image" content="${escapeXml(image)}">
  <meta property="twitter:url" content="${escapeXml(canonicalUrl)}">

  <!-- Client-side Redirect for human browsers -->
  <meta http-equiv="refresh" content="0; url=${escapeXml(canonicalUrl)}">
</head>
<body style="background:#07090e; color:#e2e8f0; font-family:sans-serif; padding:40px; text-align:center;">
  <h1>${escapeXml(title)}</h1>
  <p>${escapeXml(description)}</p>
  <p><a href="${escapeXml(canonicalUrl)}" style="color:#8CC0EB;">Bấm vào đây nếu không tự động chuyển hướng...</a></p>
</body>
</html>`;
  }
};

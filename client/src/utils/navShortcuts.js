/**
 * Navigation Shortcuts Utility for Omnisearch
 * Provides instant destination navigation to core database catalog pages
 * when the user types keywords matching pages (champions, relics, powers, etc.).
 */

export function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export const NAV_SHORTCUTS = [
  {
    id: 'nav-champions',
    targetTab: 'champions',
    type: 'nav',
    path: '/champions',
    icon: 'https://images.lortpoc.com/avatarChampions/AurelionSol.webp',
    title: { vi: 'Danh Sách Tướng', en: 'Champions Roster' },
    desc: { vi: 'Xem toàn bộ 89 tướng, lối chơi, bộ bài và chỉ số', en: 'Browse all 89 champions, playstyles, and guides' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'tuong', 'tướng', 'champ', 'champion', 'champions', 'anh hung', 'anh hùng', 'roster', 'nhan vat', 'nhân vật'
    ]
  },
  {
    id: 'nav-relics',
    targetTab: 'relics',
    type: 'nav',
    path: '/relics',
    icon: 'https://dd.b.pvp.net/7_3_0/adventure/vi_vn/img/relics/R0000.png',
    title: { vi: 'Danh Sách Cổ Vật', en: 'Relics Catalog' },
    desc: { vi: 'Toàn bộ 155 cổ vật, phân loại độ hiếm và hiệu ứng', en: 'All 155 relics, rarity tiers, and build guides' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'co vat', 'cổ vật', 'covat', 'relic', 'relics', 'trang bi', 'trang bị', 'equipment'
    ]
  },
  {
    id: 'nav-powers',
    targetTab: 'powers',
    type: 'nav',
    path: '/powers',
    icon: 'https://dd.b.pvp.net/7_11_0/adventure/vi_vn/img/powers/FP0000.png',
    title: { vi: 'Danh Sách Sức Mạnh', en: 'Powers Catalog' },
    desc: { vi: 'Kho sức mạnh phiêu lưu và ngọc bổ trợ đa dạng', en: 'Full database of powers and runes' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'suc manh', 'sức mạnh', 'sucmanh', 'power', 'powers', 'ngoc', 'ngọc', 'rune', 'runes', 'buff'
    ]
  },
  {
    id: 'nav-items',
    targetTab: 'items',
    type: 'nav',
    path: '/items',
    icon: 'https://dd.b.pvp.net/6_11_0/adventure/vi_vn/img/items/I0000.png',
    title: { vi: 'Danh Sách Vật Phẩm', en: 'Items Catalog' },
    desc: { vi: 'Tất cả vật phẩm trang bị cho bài quân và bài phép', en: 'All card upgrade items and equipment' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'vat pham', 'vật phẩm', 'vatpham', 'item', 'items', 'do', 'đồ'
    ]
  },
  {
    id: 'nav-cards',
    targetTab: 'cards',
    type: 'nav',
    path: '/cards',
    icon: 'https://dd.b.pvp.net/latest/set1/vi_vn/img/cards/01PZ040.png',
    title: { vi: 'Danh Sách Lá Bài', en: 'Cards Database' },
    desc: { vi: 'Hơn 2,600 lá bài với đầy đủ hiệu ứng và khu vực', en: 'Over 2,600 cards with full stats and regions' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'la bai', 'lá bài', 'labai', 'bai', 'bài', 'card', 'cards', 'bo bai', 'bộ bài', 'deck'
    ]
  },
  {
    id: 'nav-tierlist',
    targetTab: 'tierlist',
    type: 'nav',
    path: '/tierlist',
    icon: 'https://images.lortpoc.com/backgrounds/1920px-01FR008T1-hd-full.webp',
    title: { vi: 'Bảng Xếp Hạng Tướng', en: 'Champion Tier List' },
    desc: { vi: 'Đánh giá xếp hạng sức mạnh từ bậc S+ đến D', en: 'Champion power tier ranking from S+ to D' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'bang xep hang', 'bảng xếp hạng', 'bangxephang', 'xep hang', 'xếp hạng', 'tier', 'tierlist', 'rank', 'ranking', 'top'
    ]
  },
  {
    id: 'nav-maps',
    targetTab: 'maps',
    type: 'nav',
    path: '/maps',
    icon: 'https://images.lortpoc.com/backgrounds/1920px-01PZ008T2-full.webp',
    title: { vi: 'Danh Sách Cuộc Phiêu Lưu', en: 'Adventures & Maps' },
    desc: { vi: 'Các bản đồ cốt truyện, thử thách hàng tuần và trùm', en: 'Story maps, weekly adventures, and boss nodes' },
    badge: { vi: 'Đi đến trang', en: 'Go to page' },
    keywords: [
      'cuoc phieu luu', 'cuộc phiêu lưu', 'cuocphieuluu', 'phieu luu', 'phiêu lưu', 'ban do', 'bản đồ', 'bando', 'map', 'maps', 'adventure', 'adventures', 'trum', 'trùm', 'boss'
    ]
  }
];

/**
 * Filter navigation shortcuts that match the user's search query
 */
export function getMatchingNavShortcuts(query) {
  if (!query) return [];
  const clean = query.trim().toLowerCase();
  const normalized = removeVietnameseTones(clean);
  if (normalized.length < 2) return [];

  return NAV_SHORTCUTS.filter((item) => {
    // 1. Direct tab match
    if (item.targetTab === clean || item.targetTab === normalized) return true;
    
    // 2. Keyword match
    const keywordMatch = item.keywords.some((k) => {
      const normK = removeVietnameseTones(k);
      return normK.includes(normalized) || normalized.includes(normK);
    });
    if (keywordMatch) return true;

    // 3. Title match
    const titleNormVi = removeVietnameseTones(item.title.vi);
    const titleNormEn = removeVietnameseTones(item.title.en);
    return titleNormVi.includes(normalized) || titleNormEn.includes(normalized);
  });
}
